/**
 * validate-turns-integrity.ts
 * PD-020b P0 — turns[] 무결성 전수 검증 (session_047~059).
 *
 * 기존 validate-session-turns.ts 상위 집합:
 *  - RK-1: agentsCompleted ↔ turns[] 정합성 (순서 보존 + 중복 허용 배열 여부)
 *  - RK-2: smoke test — 깨진 fixture 2종(phase 오타, turnIdx 중복)으로 FAIL 확인
 *  - phase_catalog 엄격 검증, recallReason 검증
 *  - turnIdx 연속·중복 검사
 *
 * 사용:
 *   npx ts-node scripts/validate-turns-integrity.ts                 # 전수 실행 (session_047~059)
 *   npx ts-node scripts/validate-turns-integrity.ts --smoke         # smoke test만
 *   npx ts-node scripts/validate-turns-integrity.ts --report <out>  # 전수 + 리포트 md 생성
 */

import fs from 'fs';
import path from 'path';
import { Turn, VALID_RECALL_REASONS } from './lib/turn-types';

const CWD = process.cwd();
const SESSION_INDEX_PATH = path.join(CWD, 'memory', 'sessions', 'session_index.json');
const PHASE_CATALOG_PATH = path.join(CWD, 'memory', 'shared', 'phase_catalog.json');

interface IntegrityResult {
  sessionId: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
  turnsCount: number;
  agentsCompletedCount: number;
  rolesFromTurns: string[];
  rolesFromAgents: string[];
}

function readJson<T = unknown>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) as T; } catch { return null; }
}

function loadValidPhases(): string[] {
  const c = readJson<{ phases?: Array<{ id: string }> }>(PHASE_CATALOG_PATH);
  return c?.phases?.map(p => p.id) ?? [];
}

export function validateIntegrity(
  sessionId: string,
  turnsRaw: unknown,
  agentsCompletedRaw: unknown,
  legacy: boolean,
  validPhases: string[],
): IntegrityResult {
  const r: IntegrityResult = {
    sessionId, ok: true, errors: [], warnings: [],
    turnsCount: 0, agentsCompletedCount: 0,
    rolesFromTurns: [], rolesFromAgents: [],
  };

  if (legacy) {
    r.warnings.push('legacy:true — skip');
    return r;
  }
  if (!Array.isArray(turnsRaw)) {
    r.errors.push(`turns가 배열이 아님: ${typeof turnsRaw}`);
    r.ok = false;
    return r;
  }
  const turns = turnsRaw as Partial<Turn>[];
  r.turnsCount = turns.length;

  const seenIdx = new Set<number>();
  turns.forEach((t, i) => {
    const px = `turns[${i}]`;
    if (!t.role || typeof t.role !== 'string') {
      r.errors.push(`${px}: role 누락/비문자열`); r.ok = false;
    } else {
      r.rolesFromTurns.push(t.role);
    }
    if (typeof t.turnIdx !== 'number') {
      r.errors.push(`${px}: turnIdx 누락/비숫자`); r.ok = false;
    } else {
      if (seenIdx.has(t.turnIdx)) {
        r.errors.push(`${px}: turnIdx=${t.turnIdx} 중복`); r.ok = false;
      }
      seenIdx.add(t.turnIdx);
      if (t.turnIdx !== i) {
        r.warnings.push(`${px}: turnIdx=${t.turnIdx} vs 배열 위치=${i} 불일치`);
      }
    }
    if (validPhases.length > 0 && t.phase !== undefined) {
      if (!validPhases.includes(t.phase as string)) {
        r.errors.push(`${px}: phase="${t.phase}" phase_catalog에 없음`); r.ok = false;
      }
    }
    if (t.recallReason !== undefined && !VALID_RECALL_REASONS.includes(t.recallReason)) {
      r.errors.push(`${px}: 알 수 없는 recallReason="${t.recallReason}"`); r.ok = false;
    }
  });

  // RK-1: agentsCompleted ↔ turns[] 정합성
  if (Array.isArray(agentsCompletedRaw)) {
    const agents = agentsCompletedRaw as string[];
    r.agentsCompletedCount = agents.length;
    r.rolesFromAgents = agents.slice();

    // 모든 역할 turns 추출 vs agentsCompleted
    // "중복 허용 배열" 검사 — turns에 동일 역할이 N번 등장하면 agentsCompleted도 N번
    const turnsCount: Record<string, number> = {};
    r.rolesFromTurns.forEach(role => { turnsCount[role] = (turnsCount[role] ?? 0) + 1; });
    const agentsCount: Record<string, number> = {};
    agents.forEach(role => { agentsCount[role] = (agentsCount[role] ?? 0) + 1; });

    const allRoles = new Set([...Object.keys(turnsCount), ...Object.keys(agentsCount)]);
    for (const role of allRoles) {
      const tc = turnsCount[role] ?? 0;
      const ac = agentsCount[role] ?? 0;
      if (tc !== ac) {
        // "Set 의미 중복 제거" 패턴 탐지: turns엔 N회, agents엔 1회
        if (tc > 1 && ac === 1) {
          r.errors.push(
            `RK-1: role="${role}" turns=${tc}회 vs agentsCompleted=${ac}회 — ` +
            `agentsCompleted이 Set 의미로 중복 제거됨 (D-048 "중복 허용 배열" 위반)`
          );
        } else {
          r.errors.push(
            `RK-1: role="${role}" turns=${tc}회 vs agentsCompleted=${ac}회 — 정합성 불일치`
          );
        }
        r.ok = false;
      }
    }

    // 순서 일관성 — turns[].role 순서와 agentsCompleted 순서가 일치해야 함 (중복 제거 없이)
    if (r.rolesFromTurns.length === agents.length) {
      for (let i = 0; i < agents.length; i++) {
        if (agents[i] !== r.rolesFromTurns[i]) {
          r.warnings.push(
            `RK-1: 순서 불일치 [${i}] agentsCompleted="${agents[i]}" vs turns="${r.rolesFromTurns[i]}"`
          );
        }
      }
    }
  } else {
    r.warnings.push('agentsCompleted 배열 아님/누락 — RK-1 검증 스킵');
  }

  return r;
}

function printResult(r: IntegrityResult): void {
  const status = r.ok ? '✓ OK  ' : '✗ FAIL';
  console.log(`\n[${status}] ${r.sessionId} — turns=${r.turnsCount} agents=${r.agentsCompletedCount}`);
  r.errors.forEach(e => console.log(`  ERROR: ${e}`));
  r.warnings.forEach(w => console.log(`  WARN:  ${w}`));
}

// ──────────────────────────────────────────
// RK-2: Smoke Test
// ──────────────────────────────────────────
function runSmokeTest(validPhases: string[]): boolean {
  console.log('\n═══ Smoke Test (RK-2) ═══');

  // Fixture 1: phase 오타
  const f1Turns = [{ role: 'ace', turnIdx: 0, phase: 'output ' /* trailing space */ }];
  const r1 = validateIntegrity('SMOKE-1', f1Turns, ['ace'], false, validPhases);
  const f1Expected = !r1.ok && r1.errors.some(e => e.includes('phase='));
  console.log(`  Fixture 1 (phase trailing space): ${f1Expected ? '✓ FAIL 감지' : '✗ 통과 — 검증 허약'}`);

  // Fixture 2: turnIdx 중복
  const f2Turns = [
    { role: 'ace', turnIdx: 0, phase: 'framing' },
    { role: 'arki', turnIdx: 0, phase: 'analysis' },
  ];
  const r2 = validateIntegrity('SMOKE-2', f2Turns, ['ace', 'arki'], false, validPhases);
  const f2Expected = !r2.ok && r2.errors.some(e => e.includes('중복'));
  console.log(`  Fixture 2 (turnIdx 중복):       ${f2Expected ? '✓ FAIL 감지' : '✗ 통과 — 검증 허약'}`);

  // Fixture 3: agentsCompleted Set 의미 위반 (control)
  const f3Turns = [
    { role: 'ace', turnIdx: 0, phase: 'framing' },
    { role: 'arki', turnIdx: 1, phase: 'analysis' },
    { role: 'ace', turnIdx: 2, phase: 'synthesis' },
  ];
  const r3 = validateIntegrity('SMOKE-3', f3Turns, ['ace', 'arki'] /* ace 1회만 */, false, validPhases);
  const f3Expected = !r3.ok && r3.errors.some(e => e.includes('RK-1') && e.includes('Set 의미'));
  console.log(`  Fixture 3 (agents Set 의미):     ${f3Expected ? '✓ FAIL 감지' : '✗ 통과 — 검증 허약'}`);

  // Fixture 4: 정상 (negative control)
  const f4Turns = [
    { role: 'ace', turnIdx: 0, phase: 'framing' },
    { role: 'arki', turnIdx: 1, phase: 'analysis' },
  ];
  const r4 = validateIntegrity('SMOKE-4', f4Turns, ['ace', 'arki'], false, validPhases);
  const f4Expected = r4.ok;
  console.log(`  Fixture 4 (정상):               ${f4Expected ? '✓ OK 통과' : '✗ FAIL — 검증 과잉'}`);

  const allPass = f1Expected && f2Expected && f3Expected && f4Expected;
  console.log(`  Smoke Test 결과: ${allPass ? '✓ 통과' : '✗ 실패'}\n`);
  return allPass;
}

// ──────────────────────────────────────────
// Main
// ──────────────────────────────────────────
function generateReport(results: IntegrityResult[], outPath: string): void {
  const total = results.length;
  const failed = results.filter(r => !r.ok);
  const withWarn = results.filter(r => r.warnings.length > 0);

  const lines: string[] = [];
  lines.push('---');
  lines.push('topic: pd-020b-p0p1-turns-schema');
  lines.push('phase: P0');
  lines.push(`generatedAt: ${new Date().toISOString()}`);
  lines.push('---');
  lines.push('');
  lines.push('# P0 — turns[] 무결성 전수 검증 리포트');
  lines.push('');
  lines.push(`- 대상: session_047~059 (총 ${total}개, non-legacy)`);
  lines.push(`- FAIL: ${failed.length} / ${total}`);
  lines.push(`- WARN only: ${withWarn.filter(r => r.ok).length} / ${total}`);
  lines.push('');
  lines.push('## 세션별 결과');
  lines.push('');
  lines.push('| sessionId | turns | agents | status | errors | warns |');
  lines.push('|---|---|---|---|---|---|');
  for (const r of results) {
    lines.push(
      `| ${r.sessionId} | ${r.turnsCount} | ${r.agentsCompletedCount} | ` +
      `${r.ok ? 'OK' : 'FAIL'} | ${r.errors.length} | ${r.warnings.length} |`
    );
  }
  lines.push('');
  if (failed.length > 0) {
    lines.push('## FAIL 상세');
    lines.push('');
    for (const r of failed) {
      lines.push(`### ${r.sessionId}`);
      r.errors.forEach(e => lines.push(`- ERROR: ${e}`));
      r.warnings.forEach(w => lines.push(`- WARN: ${w}`));
      lines.push('');
    }
  }
  if (withWarn.filter(r => r.ok).length > 0) {
    lines.push('## WARN only (OK but noted)');
    lines.push('');
    for (const r of withWarn.filter(r => r.ok)) {
      lines.push(`### ${r.sessionId}`);
      r.warnings.forEach(w => lines.push(`- WARN: ${w}`));
      lines.push('');
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`\n리포트 저장: ${outPath}`);
}

function main(): void {
  const args = process.argv.slice(2);
  const validPhases = loadValidPhases();

  if (args.includes('--smoke')) {
    const ok = runSmokeTest(validPhases);
    process.exit(ok ? 0 : 1);
  }

  // Smoke test는 항상 먼저 — RK-2 게이트
  const smokeOk = runSmokeTest(validPhases);
  if (!smokeOk) {
    console.error('Smoke test 실패 — 본 검증 중단 (검증 스크립트 허약)');
    process.exit(2);
  }

  const index = readJson<{ sessions?: Array<Record<string, unknown>> }>(SESSION_INDEX_PATH);
  if (!index?.sessions) {
    console.error('session_index.json 읽기 실패');
    process.exit(1);
  }

  const targets = index.sessions.filter(s => !s['legacy'] && s['turns']);
  console.log(`\n═══ 전수 검증 (${targets.length}개 세션) ═══`);

  const results = targets.map(s => validateIntegrity(
    String(s['sessionId'] ?? 'unknown'),
    s['turns'],
    s['agentsCompleted'],
    s['legacy'] === true,
    validPhases,
  ));

  results.forEach(printResult);

  const failCount = results.filter(r => !r.ok).length;
  const warnCount = results.filter(r => r.warnings.length > 0 && r.ok).length;
  console.log(`\n총 ${results.length}개 — OK:${results.length - failCount} FAIL:${failCount} WARN-only:${warnCount}`);

  // --report <path> 옵션
  const reportFlagIdx = args.indexOf('--report');
  if (reportFlagIdx >= 0 && args[reportFlagIdx + 1]) {
    generateReport(results, path.resolve(CWD, args[reportFlagIdx + 1]!));
  }

  process.exit(failCount > 0 ? 1 : 0);
}

if (require.main === module) main();
