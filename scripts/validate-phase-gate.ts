/**
 * validate-phase-gate.ts
 * D-171 G-PRE 게이트 — topic_176 Case B Phase P0 진입 전 3조건 검증.
 *
 * 3건 모두 충족해야 exit 0. 1건 이상 fail 시 stderr + exit 1.
 *
 * 조건:
 *   (1) Arki rev4 spc_lck=Y — session_208 turns[] arki turnIdx=4 spc_lck=Y 확인
 *   (2) D-170-A1·A2 decision_ledger 박제 완료
 *   (3) PD-066 resolved OR current_session turnPushMode="hook" fallback 박제
 *
 * 사용:
 *   npx ts-node scripts/validate-phase-gate.ts
 *   npx ts-node scripts/validate-phase-gate.ts --json   # machine-readable output
 */

import fs from 'fs';
import path from 'path';

const CWD = process.cwd();
const DECISION_LEDGER_PATH = path.join(CWD, 'memory', 'shared', 'decision_ledger.json');
const PENDING_DEFERRALS_PATH = path.join(CWD, 'memory', 'shared', 'pending_deferrals.json');
const CURRENT_SESSION_PATH = path.join(CWD, 'memory', 'sessions', 'current_session.json');
const SESSION_INDEX_PATH = path.join(CWD, 'memory', 'sessions', 'session_index.json');

interface GateResult {
  gate: string;
  pass: boolean;
  detail: string;
}

function readJSON<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

function checkCond1(): GateResult {
  // spc_lck=Y — session_208 arki turn 확인 (session_index 또는 prior session)
  // current_session이 session_209이므로 session_index에서 session_208을 찾는다
  const index = readJSON<{ sessions: Array<{ sessionId: string; turns?: Array<{ role: string; turnIdx: number; selfScores?: Record<string, unknown> }> }> }>(SESSION_INDEX_PATH);
  const s208 = index.sessions.find(s => s.sessionId === 'session_208');

  if (!s208) {
    // fallback: session_208 not yet in index (was closed recently) — check prior current_session
    // Try to find evidence from arki_rev4 report existence as a proxy
    const arkiRev4 = path.join(CWD, 'reports', '2026-05-07_topic_176_arki', 'arki_rev4.md');
    if (fs.existsSync(arkiRev4)) {
      const content = fs.readFileSync(arkiRev4, 'utf8');
      if (content.includes('spc_lck: Y') || content.includes('spc_lck=Y')) {
        return { gate: 'C1', pass: true, detail: 'Arki rev4 report arki_rev4.md 존재 + spc_lck=Y 확인' };
      }
    }
    return { gate: 'C1', pass: false, detail: 'session_208 not in session_index, arki_rev4.md 없거나 spc_lck=Y 미확인' };
  }

  const arkiTurn = s208.turns?.find(t => t.role === 'arki' && t.turnIdx === 4);
  if (arkiTurn && arkiTurn.selfScores && arkiTurn.selfScores['spc_lck'] === 'Y') {
    return { gate: 'C1', pass: true, detail: 'session_208 turns arki turnIdx=4 spc_lck=Y 확인' };
  }

  // Final fallback: report file
  const arkiRev4 = path.join(CWD, 'reports', '2026-05-07_topic_176_arki', 'arki_rev4.md');
  if (fs.existsSync(arkiRev4)) {
    const content = fs.readFileSync(arkiRev4, 'utf8');
    if (content.includes('spc_lck: Y') || content.includes('spc_lck=Y')) {
      return { gate: 'C1', pass: true, detail: 'Arki rev4 report spc_lck=Y 확인 (session_index turns 미보존 fallback)' };
    }
  }

  return { gate: 'C1', pass: false, detail: `session_208 arki turnIdx=4 spc_lck 값: ${JSON.stringify(arkiTurn?.selfScores?.['spc_lck'])}` };
}

function checkCond2(): GateResult {
  const ledger = readJSON<{ decisions: Array<{ id: string; status?: string }> }>(DECISION_LEDGER_PATH);
  const d170a1 = ledger.decisions.find(d => d.id === 'D-170-A1');
  const d170a2 = ledger.decisions.find(d => d.id === 'D-170-A2');

  if (d170a1 && d170a2) {
    return { gate: 'C2', pass: true, detail: 'D-170-A1, D-170-A2 모두 decision_ledger 박제 확인' };
  }

  const missing = [!d170a1 && 'D-170-A1', !d170a2 && 'D-170-A2'].filter(Boolean);
  return { gate: 'C2', pass: false, detail: `decision_ledger 미박제: ${missing.join(', ')}` };
}

function checkCond3(): GateResult {
  // PD-066 resolved OR current_session turnPushMode="hook"
  const deferrals = readJSON<{ items: Array<{ id: string; status: string }> }>(PENDING_DEFERRALS_PATH);
  const pd066 = deferrals.items.find(i => i.id === 'PD-066');

  if (pd066 && pd066.status === 'resolved') {
    return { gate: 'C3', pass: true, detail: 'PD-066 resolved 확인' };
  }

  // Check fallback: current_session turnPushMode="hook"
  const session = readJSON<{ turnPushMode?: string; sessionId?: string }>(CURRENT_SESSION_PATH);
  if (session.turnPushMode === 'hook') {
    return {
      gate: 'C3',
      pass: true,
      detail: `PD-066 미해결(status=${pd066?.status ?? 'not found'}) — fallback: current_session.turnPushMode="hook" 박제 확인 (Arki rev4 §7.1 정합)`
    };
  }

  return {
    gate: 'C3',
    pass: false,
    detail: `PD-066 status=${pd066?.status ?? 'not found'}, current_session.turnPushMode="${session.turnPushMode ?? 'missing'}". 둘 다 미충족.`
  };
}

function main(): void {
  const jsonMode = process.argv.includes('--json');

  const results: GateResult[] = [
    checkCond1(),
    checkCond2(),
    checkCond3(),
  ];

  const allPass = results.every(r => r.pass);

  if (jsonMode) {
    console.log(JSON.stringify({ pass: allPass, results }, null, 2));
    process.exit(allPass ? 0 : 1);
  }

  console.log('=== G-PRE 게이트 (D-171) ===\n');
  for (const r of results) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`${icon} [${r.gate}] ${r.detail}`);
  }
  console.log('');

  if (allPass) {
    console.log('✅ G-PRE PASS — P0 진입 가능');
    process.exit(0);
  } else {
    const failed = results.filter(r => !r.pass).map(r => r.gate);
    process.stderr.write(`\n❌ G-PRE FAIL — ${failed.join(', ')} 미충족. P0 진입 차단.\n`);
    process.exit(1);
  }
}

main();
