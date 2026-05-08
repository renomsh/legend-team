#!/usr/bin/env ts-node
/**
 * test-p3-turn-push-mode.ts
 * D-169 P3 단위 테스트 — post-tool-use-task.js nexus/hook 분기 검증
 * session_209, topic_176
 *
 * 테스트 케이스:
 *   T1. hook 모드: turns[] 직접 push + selfScores 추출
 *   T2. hook 모드: selfScores 없는 경우 turns[] push
 *   T3. nexus 모드: pending_turns.jsonl append + __hook_origin sentinel 박제
 *   T4. nexus 모드: turns[] 미변경 확인 (③ skip)
 *   T5. nexus 모드: agentId 필드 보존
 *   T6. nexus 모드 N=5 동시 append — 손실·오염 0건
 *   T7. turnPushMode 필드 없음(legacy) → hook 동작
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

const CWD = process.cwd();
const HOOK_PATH = path.join(CWD, '.claude', 'hooks', 'post-tool-use-task.js');
const SESSIONS_DIR = path.join(CWD, 'memory', 'sessions');

// ─── helpers ───────────────────────────────────────────────

function readJson<T = any>(p: string): T {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(p: string, obj: any) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}
function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function cleanup(...paths: string[]) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  }
}

function buildHookInput(role: string, agentId: string | null, selfScoresYaml: string | null, cwdOverride?: string) {
  return {
    tool_name: 'Task',
    tool_input: {
      subagent_type: `role-${role}`,
      description: `${role} test`,
      prompt: `## ROLE: ${role}\ntest`,
    },
    tool_response: {
      ...(agentId && { agentId }),
      content: [{ type: 'text', text: selfScoresYaml
        ? `[ROLE:${role}]\n# self-scores\n${selfScoresYaml}`
        : `[ROLE:${role}]\n분석 완료.` }],
    },
    cwd: cwdOverride ?? CWD,
    session_id: 'test_session',
  };
}

function spawnHook(input: any): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn('node', [HOOK_PATH]);
    let stderr = '';
    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => resolve({ code: code ?? 0, stderr }));
    setTimeout(() => { child.kill(); resolve({ code: 1, stderr: 'timeout' }); }, 5000);
  });
}

// ─── test fixtures ─────────────────────────────────────────

const FIXTURE_DIR = path.join(os.tmpdir(), `p3_test_${Date.now()}`);

function makeSession(turnPushMode: 'hook' | 'nexus' | undefined, existingTurns: any[] = []) {
  return {
    sessionId: 'test_session',
    topicId: 'topic_test',
    reportPath: 'reports/test',
    ...(turnPushMode !== undefined && { turnPushMode }),
    turns: existingTurns,
    gaps: [],
  };
}

function setupFixture(sessionObj: any): { sessionPath: string; pendingPath: string } {
  ensureDir(FIXTURE_DIR);
  ensureDir(path.join(FIXTURE_DIR, 'memory', 'sessions'));
  ensureDir(path.join(FIXTURE_DIR, 'scripts', 'lib'));

  // copy turn-push-mode.js
  const tpmSrc = path.join(CWD, 'scripts', 'lib', 'turn-push-mode.js');
  const tpmDst = path.join(FIXTURE_DIR, 'scripts', 'lib', 'turn-push-mode.js');
  fs.writeFileSync(tpmDst, fs.readFileSync(tpmSrc, 'utf8'));

  const sessionPath = path.join(FIXTURE_DIR, 'memory', 'sessions', 'current_session.json');
  writeJson(sessionPath, sessionObj);

  const pendingPath = path.join(FIXTURE_DIR, 'memory', 'sessions', 'pending_turns_test_session.jsonl');
  cleanup(pendingPath);

  return { sessionPath, pendingPath };
}

// ─── test runner ───────────────────────────────────────────

interface TestResult {
  name: string;
  pass: boolean;
  detail: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, detail: string) {
  results.push({ name, pass: condition, detail });
  const icon = condition ? '✅' : '❌';
  console.log(`  ${icon} ${name}: ${detail}`);
}

// ─── T1: hook mode turns[] push + selfScores ───────────────

async function t1() {
  console.log('\n[T1] hook 모드: turns[] 직접 push + selfScores 추출');
  const { sessionPath, pendingPath } = setupFixture(makeSession('hook'));
  const input = buildHookInput('arki', null, 'aud_rcl: 1\nstr_fd: 5\nspc_lck: Y\nsa_rnd: 3', FIXTURE_DIR);

  await spawnHook(input);

  const sess = readJson(sessionPath);
  assert('T1-turns-count', sess.turns.length === 1, `turns.length=${sess.turns.length}`);
  assert('T1-role', sess.turns[0]?.role === 'arki', `role=${sess.turns[0]?.role}`);
  assert('T1-turnIdx', sess.turns[0]?.turnIdx === 0, `turnIdx=${sess.turns[0]?.turnIdx}`);
  assert('T1-selfScores-spc_lck', sess.turns[0]?.selfScores?.spc_lck === 'Y', `spc_lck=${sess.turns[0]?.selfScores?.spc_lck}`);
  assert('T1-no-pending', !fs.existsSync(pendingPath), `pendingPath exists=${fs.existsSync(pendingPath)}`);
}

// ─── T2: hook mode selfScores 없음 ─────────────────────────

async function t2() {
  console.log('\n[T2] hook 모드: selfScores 없는 경우 turns[] push');
  const { sessionPath } = setupFixture(makeSession('hook'));
  const input = buildHookInput('jobs', null, null, FIXTURE_DIR);

  await spawnHook(input);

  const sess = readJson(sessionPath);
  assert('T2-turns-count', sess.turns.length === 1, `turns.length=${sess.turns.length}`);
  assert('T2-no-selfScores', !sess.turns[0]?.selfScores, `selfScores=${JSON.stringify(sess.turns[0]?.selfScores)}`);
}

// ─── T3: nexus mode pending_turns append + __hook_origin ───

async function t3() {
  console.log('\n[T3] nexus 모드: pending_turns.jsonl append + __hook_origin sentinel');
  const { sessionPath, pendingPath } = setupFixture(makeSession('nexus'));
  const input = buildHookInput('riki', 'agent_abc_123', 'crt_rcl: 0.83\ncr_val: Y', FIXTURE_DIR);

  await spawnHook(input);

  const exists = fs.existsSync(pendingPath);
  assert('T3-pending-exists', exists, `pendingPath exists=${exists}`);

  if (exists) {
    const line = fs.readFileSync(pendingPath, 'utf8').trim();
    let entry: any = null;
    try { entry = JSON.parse(line); } catch {}
    assert('T3-parse-ok', !!entry, `parse ok=${!!entry}`);
    assert('T3-hook-origin', entry?.__hook_origin === 'post-tool-use-task', `__hook_origin=${entry?.__hook_origin}`);
    assert('T3-agentId', entry?.agentId === 'agent_abc_123', `agentId=${entry?.agentId}`);
    assert('T3-role', entry?.role === 'riki', `role=${entry?.role}`);
    assert('T3-selfScores-cr_val', entry?.selfScores?.cr_val === 'Y', `cr_val=${entry?.selfScores?.cr_val}`);
    assert('T3-sessionId', entry?.sessionId === 'test_session', `sessionId=${entry?.sessionId}`);
  }
}

// ─── T4: nexus mode turns[] 미변경 ─────────────────────────

async function t4() {
  console.log('\n[T4] nexus 모드: turns[] 미변경 (③ skip 확인)');
  const { sessionPath } = setupFixture(makeSession('nexus', [{ role: 'existing', turnIdx: 0 }]));
  const input = buildHookInput('ace', 'agent_def_456', 'rfrm_trg: Y\nctx_car: 5', FIXTURE_DIR);

  await spawnHook(input);

  const sess = readJson(sessionPath);
  assert('T4-turns-unchanged', sess.turns.length === 1, `turns.length=${sess.turns.length} (should stay 1)`);
  assert('T4-no-new-push', sess.turns[0]?.role === 'existing', `first role=${sess.turns[0]?.role}`);
}

// ─── T5: nexus mode agentId null (tool_response.agentId 없음) ─

async function t5() {
  console.log('\n[T5] nexus 모드: agentId=null (tool_response.agentId 미박제)');
  const { sessionPath, pendingPath } = setupFixture(makeSession('nexus'));
  const input = buildHookInput('fin', null, 'cst_acc: Y', FIXTURE_DIR);

  await spawnHook(input);

  if (fs.existsSync(pendingPath)) {
    const line = fs.readFileSync(pendingPath, 'utf8').trim();
    let entry: any = null;
    try { entry = JSON.parse(line); } catch {}
    assert('T5-agentId-null', entry?.agentId === null, `agentId=${JSON.stringify(entry?.agentId)}`);
    assert('T5-still-appended', !!entry, 'entry appended despite null agentId');
  } else {
    assert('T5-pending-exists', false, 'pending file not created');
  }
}

// ─── T6: nexus mode N=5 동시 append — 손실·오염 0 ──────────

async function t6() {
  console.log('\n[T6] nexus 모드: N=5 동시 append — 손실·오염 0건');
  const { sessionPath, pendingPath } = setupFixture(makeSession('nexus'));

  const roles = ['arki', 'jobs', 'riki', 'ace', 'fin'];
  const agentIds = roles.map((_, i) => `agent_conc_${i}`);

  const inputs = roles.map((role, i) =>
    buildHookInput(role, agentIds[i]!, `metric: ${i}`, FIXTURE_DIR)
  );

  await Promise.all(inputs.map(inp => spawnHook(inp)));

  const raw = fs.existsSync(pendingPath) ? fs.readFileSync(pendingPath, 'utf8') : '';
  const lines = raw.split('\n').filter(l => l.trim());
  let corrupt = 0;
  const parsedAgentIds: string[] = [];
  for (const line of lines) {
    try {
      const e = JSON.parse(line);
      parsedAgentIds.push(e.agentId);
    } catch { corrupt++; }
  }

  const matched = agentIds.filter(id => parsedAgentIds.includes(id)).length;
  assert('T6-line-count', lines.length === 5, `lines=${lines.length}/5`);
  assert('T6-no-corruption', corrupt === 0, `corrupt=${corrupt}`);
  assert('T6-all-agentIds', matched === 5, `matched=${matched}/5`);

  // turns[] 여전히 비어있어야 함
  const sess = readJson(sessionPath);
  assert('T6-turns-empty', sess.turns.length === 0, `turns.length=${sess.turns.length}`);
}

// ─── T7: turnPushMode 없음(legacy) → hook 동작 ─────────────

async function t7() {
  console.log('\n[T7] turnPushMode 없음(legacy) → hook 동작');
  const { sessionPath, pendingPath } = setupFixture(makeSession(undefined));
  const input = buildHookInput('edi', null, 'art_cmp: 1\nscc: Y', FIXTURE_DIR);

  await spawnHook(input);

  const sess = readJson(sessionPath);
  assert('T7-turns-pushed', sess.turns.length === 1, `turns.length=${sess.turns.length}`);
  assert('T7-no-pending', !fs.existsSync(pendingPath), `pendingPath exists=${fs.existsSync(pendingPath)}`);
}

// ─── main ──────────────────────────────────────────────────

async function main() {
  console.log('=== P3 단위 테스트 — post-tool-use-task.js nexus/hook 분기 ===');

  await t1();
  await t2();
  await t3();
  await t4();
  await t5();
  await t6();
  await t7();

  // cleanup
  try { fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }); } catch {}

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n=== 결과: ${passed}/${results.length} PASS, ${failed} FAIL ===`);

  if (failed > 0) {
    console.log('\n실패 목록:');
    results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
    process.exit(1);
  } else {
    console.log('✅ 전체 PASS');
    process.exit(0);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
