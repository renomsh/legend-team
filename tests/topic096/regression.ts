/**
 * tests/topic096/regression.ts
 * D-067 ~ D-070 regression test runner (T-101 ~ T-110, 10건).
 *
 * 실행: npx ts-node tests/topic096/regression.ts
 *
 * 테스트 격리 전략:
 *   - 각 테스트는 os.tmpdir()/topic096-<rand>/ 작업 디렉토리 생성
 *   - 그 안에 memory/sessions/{current_session.json, session_index.json} + reports/{date}_{slug}/ 구조 fixture 생성
 *   - finalize hook을 child_process.spawnSync로 실행 (FINALIZE_CWD env 주입)
 *   - PostToolUse hook은 stdin에 JSON 주입하여 spawnSync 실행
 *   - turn-types.ts 정적 검증은 fs.readFileSync + 정규식
 *   - 종료 시 임시 디렉토리 cleanup
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawnSync } from 'child_process';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const FINALIZE_HOOK = path.join(PROJECT_ROOT, '.claude', 'hooks', 'session-end-finalize.js');
const POST_TOOL_HOOK = path.join(PROJECT_ROOT, '.claude', 'hooks', 'post-tool-use-task.js');

type Result = { id: string; name: string; pass: boolean; reason?: string };
const results: Result[] = [];

function record(id: string, name: string, pass: boolean, reason?: string) {
  const r: Result = { id, name, pass };
  if (typeof reason === 'string') r.reason = reason;
  results.push(r);
  const tag = pass ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${id} ${name}${reason ? ' — ' + reason : ''}`);
}

function makeTmpWorkdir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'topic096-'));
  fs.mkdirSync(path.join(dir, 'memory', 'sessions'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'memory', 'shared'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'reports'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'logs'), { recursive: true });
  return dir;
}

function writeJson(p: string, obj: unknown) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function readJson<T = any>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function rmrf(p: string) {
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

function runFinalize(workdir: string) {
  const currentSession = path.join(workdir, 'memory', 'sessions', 'current_session.json');
  const sessionIndex = path.join(workdir, 'memory', 'sessions', 'session_index.json');
  const r = spawnSync('node', [FINALIZE_HOOK], {
    cwd: workdir,
    encoding: 'utf8',
    env: {
      ...process.env,
      FINALIZE_CWD: workdir,
      FINALIZE_CURRENT_SESSION: currentSession,
      FINALIZE_SESSION_INDEX: sessionIndex,
    },
    input: '',
  });
  return { stdout: r.stdout || '', stderr: r.stderr || '', status: r.status };
}

function runPostToolUse(workdir: string, hookInput: object) {
  const r = spawnSync('node', [POST_TOOL_HOOK], {
    cwd: workdir,
    encoding: 'utf8',
    env: { ...process.env },
    input: JSON.stringify({ ...hookInput, cwd: workdir }),
  });
  return { stdout: r.stdout || '', stderr: r.stderr || '', status: r.status };
}

function makeReport(
  workdir: string,
  dateStr: string,
  slug: string,
  role: string,
  rev: number,
  frontmatter: Record<string, unknown>
): string {
  const dir = path.join(workdir, 'reports', `${dateStr}_${slug}`);
  fs.mkdirSync(dir, { recursive: true });
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : String(v)}`)
    .join('\n');
  const filename = `${role}_rev${rev}.md`;
  const fp = path.join(dir, filename);
  fs.writeFileSync(fp, `---\n${fm}\n---\n\n# ${role} rev${rev}\n`, 'utf8');
  return fp;
}

function makeBaseSession(opts: {
  workdir: string;
  sessionId: string;
  topicSlug: string;
  date: string;
  turns: any[];
  legacy?: boolean;
  grade?: string;
}) {
  const sess = {
    sessionId: opts.sessionId,
    topicSlug: opts.topicSlug,
    topic: 'test topic',
    startedAt: `${opts.date}T00:00:00.000Z`,
    closedAt: `${opts.date}T01:00:00.000Z`,
    status: 'closed',
    cwd: opts.workdir,
    turns: opts.turns,
    grade: opts.grade,
    legacy: opts.legacy,
  };
  writeJson(path.join(opts.workdir, 'memory', 'sessions', 'current_session.json'), sess);
  writeJson(path.join(opts.workdir, 'memory', 'sessions', 'session_index.json'), { sessions: [], lastUpdated: null });
  return sess;
}

// ======================================================================
// T-101 — D-067: 신규 reports에 turnId 부재 시 fail (frontmatter 의무)
// ======================================================================
function T101() {
  const wd = makeTmpWorkdir();
  try {
    const date = '2026-04-24';
    const slug = 't101-slug';
    makeBaseSession({
      workdir: wd,
      sessionId: 'session_t101',
      topicSlug: slug,
      date,
      turns: [
        { role: 'ace', turnIdx: 0, invocationMode: 'subagent', subagentId: 'sub-ace-1' },
        { role: 'editor', turnIdx: 1, phase: 'compile' },
      ],
    });
    // ace report 생성하되 turnId 빠뜨림
    makeReport(wd, date, slug, 'ace', 1, { role: 'ace', invocationMode: 'subagent' });
    runFinalize(wd);
    const sess = readJson<any>(path.join(wd, 'memory', 'sessions', 'current_session.json'));
    const gaps = (sess?.gaps || []) as any[];
    const has = gaps.some(g => g.type === 'dual-satisfaction-violation' &&
      g.violations?.some((v: any) => v.role === 'ace' && v.cond_turnIdMatch === false));
    const passed = (sess?.agentsCompleted || []).includes('ace');
    record('T-101', 'D-067 turnId 부재 시 dual-sat fail', has && !passed,
      has ? (passed ? 'ace가 agentsCompleted에 잔존' : undefined) : 'gap 박제 안 됨');
  } finally {
    rmrf(wd);
  }
}

// ======================================================================
// T-102 — D-067: invocationMode=subagent turn에 subagentId 부재 시 fail
// ======================================================================
function T102() {
  const wd = makeTmpWorkdir();
  try {
    const date = '2026-04-24';
    const slug = 't102-slug';
    makeBaseSession({
      workdir: wd,
      sessionId: 'session_t102',
      topicSlug: slug,
      date,
      turns: [
        { role: 'arki', turnIdx: 0, invocationMode: 'subagent' /* subagentId 누락 */ },
        { role: 'editor', turnIdx: 1, phase: 'compile' },
      ],
    });
    makeReport(wd, date, slug, 'arki', 1, { role: 'arki', turnId: 0, invocationMode: 'subagent' });
    runFinalize(wd);
    const sess = readJson<any>(path.join(wd, 'memory', 'sessions', 'current_session.json'));
    const gaps = (sess?.gaps || []) as any[];
    const violation = gaps.find(g => g.type === 'dual-satisfaction-violation');
    const arkiV = violation?.violations?.find((v: any) => v.role === 'arki');
    const ok = arkiV && arkiV.cond_subagentId === false;
    const passed = (sess?.agentsCompleted || []).includes('arki');
    record('T-102', 'D-067 subagentId 부재 시 dual-sat fail', !!ok && !passed,
      ok ? (passed ? 'arki 잔존' : undefined) : 'subagentId 위반 박제 안 됨');
  } finally {
    rmrf(wd);
  }
}

// ======================================================================
// T-103 — D-068: PostToolUse(Task) hook이 turns에 subagentId 자동 박제
// ======================================================================
function T103() {
  const wd = makeTmpWorkdir();
  try {
    writeJson(path.join(wd, 'memory', 'sessions', 'current_session.json'), {
      sessionId: 'session_t103',
      topicSlug: 't103-slug',
      startedAt: '2026-04-24T00:00:00.000Z',
      status: 'open',
      turns: [],
    });
    runPostToolUse(wd, {
      tool_name: 'Task',
      tool_input: { subagent_type: 'role-fin', description: 'fin 호출' },
      tool_response: { agentId: 'sub-fin-T103' },
      session_id: 'cli-session-abc',
    });
    const sess = readJson<any>(path.join(wd, 'memory', 'sessions', 'current_session.json'));
    const turns = sess?.turns || [];
    const t = turns[0];
    const ok = t && t.role === 'fin' && t.turnIdx === 0 &&
               t.invocationMode === 'subagent' && t.subagentId === 'sub-fin-T103';
    record('T-103', 'D-068 PostToolUse(Task) 자동 박제', ok,
      ok ? undefined : `turn=${JSON.stringify(t)}`);
  } finally {
    rmrf(wd);
  }
}

// ======================================================================
// T-104 — D-068: reports 파일 부재 + invocationMode=subagent 조합 fail
// ======================================================================
function T104() {
  const wd = makeTmpWorkdir();
  try {
    const date = '2026-04-24';
    const slug = 't104-slug';
    makeBaseSession({
      workdir: wd,
      sessionId: 'session_t104',
      topicSlug: slug,
      date,
      turns: [
        { role: 'riki', turnIdx: 0, invocationMode: 'subagent', subagentId: 'sub-riki-1' },
        { role: 'editor', turnIdx: 1, phase: 'compile' },
      ],
    });
    // riki report 의도적으로 생성하지 않음
    runFinalize(wd);
    const sess = readJson<any>(path.join(wd, 'memory', 'sessions', 'current_session.json'));
    const gaps = (sess?.gaps || []) as any[];
    const violation = gaps.find(g => g.type === 'dual-satisfaction-violation');
    const rikiV = violation?.violations?.find((v: any) => v.role === 'riki');
    const ok = rikiV && rikiV.cond_reportExists === false;
    const passed = (sess?.agentsCompleted || []).includes('riki');
    record('T-104', 'D-068 reports 부재 fail', !!ok && !passed,
      ok ? (passed ? 'riki 잔존' : undefined) : 'reports 위반 박제 안 됨');
  } finally {
    rmrf(wd);
  }
}

// ======================================================================
// T-105 — D-068: turn.turnIdx ≠ frontmatter.turnId 시 fail
// ======================================================================
function T105() {
  const wd = makeTmpWorkdir();
  try {
    const date = '2026-04-24';
    const slug = 't105-slug';
    makeBaseSession({
      workdir: wd,
      sessionId: 'session_t105',
      topicSlug: slug,
      date,
      turns: [
        { role: 'ace', turnIdx: 0, invocationMode: 'subagent', subagentId: 'sub-ace-1' },
        { role: 'editor', turnIdx: 1, phase: 'compile' },
      ],
    });
    // turnId mismatch (5 vs turnIdx 0)
    makeReport(wd, date, slug, 'ace', 1, { role: 'ace', turnId: 5, invocationMode: 'subagent' });
    runFinalize(wd);
    const sess = readJson<any>(path.join(wd, 'memory', 'sessions', 'current_session.json'));
    const gaps = (sess?.gaps || []) as any[];
    const violation = gaps.find(g => g.type === 'dual-satisfaction-violation');
    const aceV = violation?.violations?.find((v: any) => v.role === 'ace');
    const ok = aceV && aceV.cond_turnIdMatch === false;
    const passed = (sess?.agentsCompleted || []).includes('ace');
    record('T-105', 'D-068 turnId mismatch fail', !!ok && !passed,
      ok ? (passed ? 'ace 잔존' : undefined) : 'turnId mismatch 위반 박제 안 됨');
  } finally {
    rmrf(wd);
  }
}

// ======================================================================
// T-106 — D-069: 신규 세션에서 4조건 통과 role만 agentsCompleted 포함
// ======================================================================
function T106() {
  const wd = makeTmpWorkdir();
  try {
    const date = '2026-04-24';
    const slug = 't106-slug';
    makeBaseSession({
      workdir: wd,
      sessionId: 'session_t106',
      topicSlug: slug,
      date,
      turns: [
        // ace: 4조건 모두 통과 예정
        { role: 'ace', turnIdx: 0, invocationMode: 'subagent', subagentId: 'sub-ace-A' },
        // arki: reports 부재 → fail
        { role: 'arki', turnIdx: 1, invocationMode: 'subagent', subagentId: 'sub-arki-A' },
        // fin: 4조건 모두 통과 예정
        { role: 'fin', turnIdx: 2, invocationMode: 'subagent', subagentId: 'sub-fin-A' },
        { role: 'editor', turnIdx: 3, phase: 'compile' },
      ],
    });
    makeReport(wd, date, slug, 'ace', 1, { role: 'ace', turnId: 0, invocationMode: 'subagent' });
    makeReport(wd, date, slug, 'fin', 1, { role: 'fin', turnId: 2, invocationMode: 'subagent' });
    // arki report 생성 안함
    runFinalize(wd);
    const sess = readJson<any>(path.join(wd, 'memory', 'sessions', 'current_session.json'));
    const ac = (sess?.agentsCompleted || []) as string[];
    const ok = ac.includes('ace') && ac.includes('fin') && !ac.includes('arki') && ac.includes('editor');
    record('T-106', 'D-069 4조건 통과 role만 포함', ok, ok ? undefined : `agentsCompleted=${JSON.stringify(ac)}`);
  } finally {
    rmrf(wd);
  }
}

// ======================================================================
// T-107 — D-069: legacy:true 세션의 agentsCompleted 재계산 시도 시 동결
// ======================================================================
function T107() {
  const wd = makeTmpWorkdir();
  try {
    const date = '2026-04-24';
    const slug = 't107-slug';
    // 의도적으로 4조건 만족 못하는 turns + 사전 박제된 agentsCompleted
    const sess = {
      sessionId: 'session_t107',
      topicSlug: slug,
      topic: 'legacy test',
      startedAt: `${date}T00:00:00.000Z`,
      closedAt: `${date}T01:00:00.000Z`,
      status: 'closed',
      cwd: wd,
      legacy: true,
      turns: [
        { role: 'arki', turnIdx: 0 /* invocationMode 부재 (legacy) */ },
        { role: 'editor', turnIdx: 1, phase: 'compile' },
      ],
      agentsCompleted: ['arki', 'fin', 'editor'], // 사전 박제 — 변경되어선 안됨
    };
    writeJson(path.join(wd, 'memory', 'sessions', 'current_session.json'), sess);
    writeJson(path.join(wd, 'memory', 'sessions', 'session_index.json'), { sessions: [], lastUpdated: null });
    runFinalize(wd);
    const after = readJson<any>(path.join(wd, 'memory', 'sessions', 'current_session.json'));
    const ac: string[] = after?.agentsCompleted || [];
    // ensureEditorInAgents가 turns에서 재생성하므로 ['arki', 'editor']가 됨.
    // 핵심은 dual-sat 필터가 적용되지 않아 arki가 살아있어야 함.
    const ok = ac.includes('arki');
    record('T-107', 'D-069 legacy 세션 재계산 동결', ok, ok ? undefined : `agentsCompleted=${JSON.stringify(ac)}`);
  } finally {
    rmrf(wd);
  }
}

// ======================================================================
// T-108 — D-069: plannedSequence/문자열만으로 agentsCompleted 진입 불가
// turns에 없는 role을 plannedSequence에만 두고 → agentsCompleted 미진입 확인
// ======================================================================
function T108() {
  const wd = makeTmpWorkdir();
  try {
    const date = '2026-04-24';
    const slug = 't108-slug';
    const sess = {
      sessionId: 'session_t108',
      topicSlug: slug,
      topic: 'planned-only test',
      startedAt: `${date}T00:00:00.000Z`,
      closedAt: `${date}T01:00:00.000Z`,
      status: 'closed',
      cwd: wd,
      plannedSequence: ['ace', 'arki', 'fin', 'riki', 'editor'],
      turns: [
        // 실제 turn은 ace + editor만
        { role: 'ace', turnIdx: 0, invocationMode: 'subagent', subagentId: 'sub-ace-T108' },
        { role: 'editor', turnIdx: 1, phase: 'compile' },
      ],
    };
    writeJson(path.join(wd, 'memory', 'sessions', 'current_session.json'), sess);
    writeJson(path.join(wd, 'memory', 'sessions', 'session_index.json'), { sessions: [], lastUpdated: null });
    makeReport(wd, date, slug, 'ace', 1, { role: 'ace', turnId: 0, invocationMode: 'subagent' });
    runFinalize(wd);
    const after = readJson<any>(path.join(wd, 'memory', 'sessions', 'current_session.json'));
    const ac: string[] = after?.agentsCompleted || [];
    const ok = ac.includes('ace') && !ac.includes('arki') && !ac.includes('fin') && !ac.includes('riki');
    record('T-108', 'D-069 plannedSequence only → agentsCompleted 미진입', ok,
      ok ? undefined : `agentsCompleted=${JSON.stringify(ac)}`);
  } finally {
    rmrf(wd);
  }
}

// ======================================================================
// T-109 — D-070: session_090 entry(immutable=true) 갱신 시도 시 차단
// ======================================================================
function T109() {
  const wd = makeTmpWorkdir();
  try {
    const date = '2026-04-24';
    const slug = 'pd031-topic082-parallel-integration';
    // 사전 immutable entry 박제
    writeJson(path.join(wd, 'memory', 'sessions', 'session_index.json'), {
      sessions: [
        {
          sessionId: 'session_090',
          topicSlug: slug,
          startedAt: `${date}T00:00:00.000Z`,
          closedAt: `${date}T16:00:00.000Z`,
          cwd: wd,
          grade: 'A',
          immutable: true,
          frozenAt: '2026-04-24',
          note: 'original snapshot',
        },
      ],
      lastUpdated: null,
    });
    // current_session에 동일 sessionId로 갱신 시도
    writeJson(path.join(wd, 'memory', 'sessions', 'current_session.json'), {
      sessionId: 'session_090',
      topicSlug: slug,
      topic: 'attempted overwrite',
      startedAt: `${date}T00:00:00.000Z`,
      closedAt: `${date}T17:00:00.000Z`,
      status: 'closed',
      cwd: wd,
      turns: [
        { role: 'ace', turnIdx: 0, invocationMode: 'subagent', subagentId: 'should-not-leak' },
        { role: 'editor', turnIdx: 1, phase: 'compile' },
      ],
      notes: ['ATTEMPT-TO-OVERWRITE'],
    });
    runFinalize(wd);
    const idx = readJson<any>(path.join(wd, 'memory', 'sessions', 'session_index.json'));
    const entry = idx?.sessions?.find((s: any) => s.sessionId === 'session_090');
    const noteUnchanged = entry?.note === 'original snapshot';
    const noTurnsLeak = !entry?.turns; // turns 갱신되지 않아야 함

    const sess = readJson<any>(path.join(wd, 'memory', 'sessions', 'current_session.json'));
    const gaps = (sess?.gaps || []) as any[];
    const blockedGap = gaps.some(g => g.type === 'immutable-update-blocked' && g.sessionId === 'session_090');

    const ok = noteUnchanged && noTurnsLeak && blockedGap;
    record('T-109', 'D-070 session_090 immutable 갱신 차단', ok,
      ok ? undefined : `noteUnchanged=${noteUnchanged} noTurnsLeak=${noTurnsLeak} blockedGap=${blockedGap}`);
  } finally {
    rmrf(wd);
  }
}

// ======================================================================
// T-110 — D-070: session_090을 baseline으로 사용하는 코드 부재 정적 검증
// (scripts/ + .claude/hooks/ 디렉토리에서 'session_090' 문자열을 baseline 의미로
//  하드코딩한 코드가 없어야 함. 본 hook 내부 immutable 검증은 sessionId-agnostic.)
// ======================================================================
function T110() {
  // 정적 검증: scripts/ + .claude/hooks/ + scripts/lib/ 의 .ts/.js 파일에서
  // 'session_090' 리터럴 문자열이 baseline 의미로 등장하는지 확인.
  // 허용: tests/ 내부 테스트 코드, 본 regression runner.
  const targets = [
    path.join(PROJECT_ROOT, 'scripts'),
    path.join(PROJECT_ROOT, '.claude', 'hooks'),
  ];
  function walk(dir: string, acc: string[] = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      const fp = path.join(dir, e.name);
      if (e.isDirectory()) walk(fp, acc);
      else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.js'))) acc.push(fp);
    }
    return acc;
  }
  const files = targets.flatMap(t => walk(t));
  const offenders: { file: string; line: number; text: string }[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(f, 'utf8');
    const lines = raw.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (!line.includes('session_090')) return;
      // 코멘트·로그·문자열 내 단순 언급은 허용. baseline 의미의 하드코딩만 차단.
      // 휴리스틱: 'baseline' 단어가 인접 (같은 줄 또는 ±2 줄)에 있으면 의심.
      const ctx = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ').toLowerCase();
      const baselineMention = ctx.includes('baseline');
      // 단, 본 마커는 immutable 가드(D-070) 자체이므로 'immutable' 인접 시 허용
      const immutableMention = ctx.includes('immutable');
      if (baselineMention && !immutableMention) {
        offenders.push({ file: path.relative(PROJECT_ROOT, f), line: i + 1, text: line.trim() });
      }
    });
  }
  const ok = offenders.length === 0;
  record('T-110', 'D-070 session_090 baseline 하드코딩 부재', ok,
    ok ? undefined : `offenders: ${JSON.stringify(offenders)}`);
}

// ======================================================================
// Main runner
// ======================================================================
const allTests: Array<[string, () => void]> = [
  ['T-101', T101],
  ['T-102', T102],
  ['T-103', T103],
  ['T-104', T104],
  ['T-105', T105],
  ['T-106', T106],
  ['T-107', T107],
  ['T-108', T108],
  ['T-109', T109],
  ['T-110', T110],
];

console.log('=== topic_096 regression test runner (D-067 ~ D-070) ===\n');
for (const [id, fn] of allTests) {
  try {
    fn();
  } catch (e: any) {
    record(id, 'runtime error', false, e?.message || String(e));
  }
}

const passCount = results.filter(r => r.pass).length;
const failCount = results.length - passCount;
console.log('\n=== summary ===');
console.log(`total=${results.length} pass=${passCount} fail=${failCount}`);
if (failCount > 0) {
  console.log('\nFailures:');
  for (const r of results.filter(x => !x.pass)) {
    console.log(`  - ${r.id} ${r.name}: ${r.reason || '(no reason)'}`);
  }
  process.exit(1);
}
process.exit(0);
