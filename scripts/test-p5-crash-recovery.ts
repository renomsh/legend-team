#!/usr/bin/env ts-node
/**
 * test-p5-crash-recovery.ts
 * D-169 P5 — session-end-finalize.js joinOrphanPendingTurns crash recovery 검증
 * session_209, topic_176
 *
 * 시나리오:
 *   C1. 정상: turnPushMode=hook → pending_turns 무시 (skip)
 *   C2. 정상: turnPushMode=nexus, pending_turns 없음 → skip
 *   C3. crash: turnPushMode=nexus, pending_turns 있음 → turns[] join + gap 박제 + archive
 *   C4. crash + D1 위변조: invalid origin entries → gap 박제 + valid만 join
 *   C5. crash: 기존 turns[] 있을 때 turnIdx 연속성 유지
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

const CWD = process.cwd();
const FINALIZE_PATH = path.join(CWD, '.claude', 'hooks', 'session-end-finalize.js');
const FIXTURE_BASE = path.join(os.tmpdir(), `p5_test_${Date.now()}`);

// ─── helpers ─────────────────────────────────────────────────

function mkFixture(id: string): string {
  const dir = path.join(FIXTURE_BASE, id);
  fs.mkdirSync(path.join(dir, 'memory', 'sessions', 'pending_turns_archive'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'memory', 'shared'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'scripts', 'lib'), { recursive: true });
  // turn-push-mode.js 복사 (finalize가 동적 require할 경우 대비 — 현재는 inline이라 불필요하지만 안전용)
  const tpmSrc = path.join(CWD, 'scripts', 'lib', 'turn-push-mode.js');
  const tpmDst = path.join(dir, 'scripts', 'lib', 'turn-push-mode.js');
  if (fs.existsSync(tpmSrc)) fs.writeFileSync(tpmDst, fs.readFileSync(tpmSrc, 'utf8'));
  return dir;
}

function writeSession(dir: string, sess: object): string {
  const p = path.join(dir, 'memory', 'sessions', 'current_session.json');
  fs.writeFileSync(p, JSON.stringify(sess, null, 2) + '\n', 'utf8');
  return p;
}

function writePending(dir: string, sessionId: string, entries: object[]): string {
  const p = path.join(dir, 'memory', 'sessions', `pending_turns_${sessionId}.jsonl`);
  fs.writeFileSync(p, entries.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');
  return p;
}

function makeSession(overrides: object): object {
  return {
    sessionId: 'test_session',
    topicSlug: 'test-topic',
    startedAt: new Date().toISOString(),
    status: 'closed',
    turns: [],
    gaps: [],
    ...overrides,
  };
}

function spawnFinalize(dir: string): Promise<{ code: number; stderr: string; stdout: string }> {
  return new Promise((resolve) => {
    const child = spawn('node', [FINALIZE_PATH], {
      env: {
        ...process.env,
        FINALIZE_CWD: dir,
        FINALIZE_CURRENT_SESSION: path.join(dir, 'memory', 'sessions', 'current_session.json'),
        FINALIZE_SESSION_INDEX: path.join(dir, 'memory', 'sessions', 'session_index.json'),
      },
    });
    let stderr = '', stdout = '';
    child.stdin.end();
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.on('close', (code: number | null) => resolve({ code: code ?? 0, stderr, stdout }));
    setTimeout(() => { child.kill(); resolve({ code: 1, stderr: 'timeout', stdout: '' }); }, 10000);
  });
}

// ─── test runner ─────────────────────────────────────────────

interface Assertion { name: string; pass: boolean; detail: string }
const results: Assertion[] = [];
function assert(name: string, cond: boolean, detail: string) {
  results.push({ name, pass: cond, detail });
  console.log(`  ${cond ? '✅' : '❌'} ${name}: ${detail}`);
}

// ─── C1: hook 모드 → pending_turns 무시 ──────────────────────

async function c1() {
  console.log('\n[C1] turnPushMode=hook → pending_turns 존재해도 skip');
  const dir = mkFixture('c1');
  const sess = makeSession({ turnPushMode: 'hook' });
  writeSession(dir, sess);
  // pending_turns 파일 생성 (무시되어야 함)
  writePending(dir, 'test_session', [
    { ts: new Date().toISOString(), sessionId: 'test_session', agentId: 'a001', role: 'arki',
      selfScores: { str_fd: 5 }, __hook_origin: 'post-tool-use-task' },
  ]);

  const { stderr } = await spawnFinalize(dir);
  const result = JSON.parse(fs.readFileSync(path.join(dir, 'memory', 'sessions', 'current_session.json'), 'utf8'));

  // turns[]에 orphan이 join되면 안 됨 (hook 모드는 이미 직접 push됨)
  const noOrphanJoin = !result.gaps?.some((g: any) => g.type === 'nexus-crash-recovery');
  assert('C1-no-crash-recovery-gap', noOrphanJoin, `gaps=${JSON.stringify(result.gaps?.map((g: any) => g.type))}`);
  assert('C1-log-skip', stderr.includes('joinOrphanPendingTurns skip: turnPushMode !== nexus'), 'skip 로그 확인');
}

// ─── C2: nexus 모드 + pending_turns 없음 → skip ───────────────

async function c2() {
  console.log('\n[C2] turnPushMode=nexus, pending_turns 없음 → skip');
  const dir = mkFixture('c2');
  writeSession(dir, makeSession({ turnPushMode: 'nexus' }));
  // pending_turns 미생성

  const { stderr } = await spawnFinalize(dir);
  const result = JSON.parse(fs.readFileSync(path.join(dir, 'memory', 'sessions', 'current_session.json'), 'utf8'));

  assert('C2-no-crash-recovery-gap', !result.gaps?.some((g: any) => g.type === 'nexus-crash-recovery'),
    `gaps=${JSON.stringify(result.gaps?.map((g: any) => g.type))}`);
  assert('C2-log-skip', stderr.includes('pending_turns 없음 (정상 종료)'), 'skip 로그 확인');
}

// ─── C3: crash 시뮬 — valid entries turns[] join ──────────────

async function c3() {
  console.log('\n[C3] crash 시뮬: pending_turns 있음 → turns[] join + gap + archive');
  const dir = mkFixture('c3');
  writeSession(dir, makeSession({ turnPushMode: 'nexus' }));
  writePending(dir, 'test_session', [
    { ts: new Date(Date.now() - 2000).toISOString(), sessionId: 'test_session', agentId: 'c001', role: 'arki',
      selfScores: { str_fd: 5, spc_lck: 'Y' }, __hook_origin: 'post-tool-use-task' },
    { ts: new Date(Date.now() - 1000).toISOString(), sessionId: 'test_session', agentId: 'c002', role: 'riki',
      selfScores: { crt_rcl: 0.9 }, __hook_origin: 'post-tool-use-task' },
    { ts: new Date().toISOString(), sessionId: 'test_session', agentId: 'c003', role: 'fin',
      selfScores: { cst_acc: 'Y' }, __hook_origin: 'post-tool-use-task' },
  ]);

  await spawnFinalize(dir);
  const result = JSON.parse(fs.readFileSync(path.join(dir, 'memory', 'sessions', 'current_session.json'), 'utf8'));

  // turns[] join 확인 (edi가 ensureEdiInAgents로 추가되어 4개)
  const crashTurns = (result.turns || []).filter((t: any) => t._crashRecovery);
  assert('C3-turns-recovered', crashTurns.length === 3, `crash recovered turns=${crashTurns.length}`);
  assert('C3-arki-first', crashTurns[0]?.role === 'arki', `turns[0].role=${crashTurns[0]?.role}`);
  assert('C3-riki-second', crashTurns[1]?.role === 'riki', `turns[1].role=${crashTurns[1]?.role}`);
  assert('C3-fin-third', crashTurns[2]?.role === 'fin', `turns[2].role=${crashTurns[2]?.role}`);
  assert('C3-selfScores', crashTurns[0]?.selfScores?.spc_lck === 'Y', `spc_lck=${crashTurns[0]?.selfScores?.spc_lck}`);
  assert('C3-gap-boxed', result.gaps?.some((g: any) => g.type === 'nexus-crash-recovery'),
    `gaps=${JSON.stringify(result.gaps?.map((g: any) => g.type))}`);

  // pending_turns 파일 archive 확인 (삭제됨)
  const pendingPath = path.join(dir, 'memory', 'sessions', 'pending_turns_test_session.jsonl');
  assert('C3-pending-removed', !fs.existsSync(pendingPath), `pending exists=${fs.existsSync(pendingPath)}`);
  const archiveDir = path.join(dir, 'memory', 'sessions', 'pending_turns_archive');
  const archiveFiles = fs.existsSync(archiveDir) ? fs.readdirSync(archiveDir) : [];
  assert('C3-archive-exists', archiveFiles.some(f => f.startsWith('pending_turns_test_session')),
    `archive files=${archiveFiles.join(',')}`);
}

// ─── C4: D1 위변조 포함 — invalid only gap, valid join ─────────

async function c4() {
  console.log('\n[C4] D1 위변조 포함: invalid→gap, valid→join');
  const dir = mkFixture('c4');
  writeSession(dir, makeSession({ turnPushMode: 'nexus' }));
  writePending(dir, 'test_session', [
    { ts: new Date().toISOString(), sessionId: 'test_session', agentId: 'd001', role: 'jobs',
      selfScores: { focus: 'Y' }, __hook_origin: 'post-tool-use-task' },          // valid
    { ts: new Date().toISOString(), sessionId: 'test_session', agentId: 'd002', role: 'evil',
      selfScores: { hack: 99 }, __hook_origin: 'INJECTED' },                        // invalid
  ]);

  await spawnFinalize(dir);
  const result = JSON.parse(fs.readFileSync(path.join(dir, 'memory', 'sessions', 'current_session.json'), 'utf8'));

  const crashTurns = (result.turns || []).filter((t: any) => t._crashRecovery);
  assert('C4-valid-joined', crashTurns.length === 1, `crash recovered=${crashTurns.length} (expected 1)`);
  assert('C4-valid-role', crashTurns[0]?.role === 'jobs', `role=${crashTurns[0]?.role}`);
  assert('C4-invalid-not-joined', !crashTurns.some((t: any) => t.role === 'evil'), 'evil role must not appear');
  assert('C4-invalid-origin-gap', result.gaps?.some((g: any) => g.type === 'nexus-crash-recovery-invalid-origin'),
    `gaps=${JSON.stringify(result.gaps?.map((g: any) => g.type))}`);
  assert('C4-recovery-gap', result.gaps?.some((g: any) => g.type === 'nexus-crash-recovery'),
    `gaps=${JSON.stringify(result.gaps?.map((g: any) => g.type))}`);
}

// ─── C5: 기존 turns[] + crash join → turnIdx 연속성 ─────────

async function c5() {
  console.log('\n[C5] 기존 turns[] + crash join → turnIdx 연속성');
  const dir = mkFixture('c5');
  writeSession(dir, makeSession({
    turnPushMode: 'nexus',
    turns: [
      { role: 'jobs', turnIdx: 0, source: 'agent', sort_key: 0 },
      { role: 'ace', turnIdx: 1, source: 'agent', sort_key: 1 },
    ],
  }));
  writePending(dir, 'test_session', [
    { ts: new Date().toISOString(), sessionId: 'test_session', agentId: 'e001', role: 'arki',
      selfScores: { str_fd: 3 }, __hook_origin: 'post-tool-use-task' },
  ]);

  await spawnFinalize(dir);
  const result = JSON.parse(fs.readFileSync(path.join(dir, 'memory', 'sessions', 'current_session.json'), 'utf8'));

  const crashTurns = (result.turns || []).filter((t: any) => t._crashRecovery);
  assert('C5-crash-joined', crashTurns.length === 1, `crash recovered=${crashTurns.length}`);
  assert('C5-turnIdx-continues', crashTurns[0]?.turnIdx === 2, `arki turnIdx=${crashTurns[0]?.turnIdx} (expected 2)`);
  const allTurnIdxs: number[] = (result.turns || []).filter((t: any) => typeof t.turnIdx === 'number').map((t: any) => t.turnIdx);
  const unique = new Set(allTurnIdxs);
  assert('C5-no-dup-turnIdx', unique.size === allTurnIdxs.length, `turnIdxs=${allTurnIdxs.join(',')} unique=${unique.size}`);
}

// ─── main ─────────────────────────────────────────────────────

async function main() {
  console.log('=== P5 — joinOrphanPendingTurns crash recovery 검증 ===');

  await c1();
  await c2();
  await c3();
  await c4();
  await c5();

  try { fs.rmSync(FIXTURE_BASE, { recursive: true, force: true }); } catch {}

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n=== 결과: ${passed}/${results.length} PASS, ${failed} FAIL ===`);

  if (failed > 0) {
    results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
    process.exit(1);
  } else {
    console.log('✅ P5 전체 PASS');
    process.exit(0);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
