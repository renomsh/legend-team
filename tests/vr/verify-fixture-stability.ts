/**
 * verify-fixture-stability.ts — Phase 5 G5 게이트 (PD-050 D-102)
 *
 * Verifies that tests/vr/fixtures/dashboard.mock.json invariants hold:
 *   1. sessions.length === _meta.sessionsLength (length 안정성)
 *   2. sessions[].sessionId monotonic (session_NNN 단조 증가)
 *   3. _meta block 존재 + schemaVersion 박제값
 *
 * Spec: D-102 §5.3, edi_rev1 §5.3.
 *
 * Usage:
 *   npx ts-node tests/vr/verify-fixture-stability.ts
 *   exit 0 PASS / exit 1 FAIL
 */
import * as fs from 'fs';
import * as path from 'path';

interface FixtureMeta {
  schemaVersion: string;
  frozenAt: string;
  sessionsLength: number;
  note?: string;
}

interface Fixture {
  _meta?: FixtureMeta;
  sessions: { sessionId: string }[];
  [k: string]: any;
}

export interface StabilityResult {
  ok: boolean;
  failures: string[];
  checks: { name: string; ok: boolean; detail: string }[];
}

export function verifyFixtureStability(fixturePath: string): StabilityResult {
  const checks: StabilityResult['checks'] = [];
  const failures: string[] = [];

  const j: Fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  // Check 1: _meta 존재
  const hasMeta = !!j._meta;
  checks.push({ name: '_meta presence', ok: hasMeta, detail: hasMeta ? `schemaVersion=${j._meta!.schemaVersion}` : 'missing' });
  if (!hasMeta) {
    failures.push('_meta block missing');
    return { ok: false, failures, checks };
  }

  // Check 2: sessions length === _meta.sessionsLength
  const len = j.sessions.length;
  const expected = j._meta!.sessionsLength;
  const lenOk = len === expected;
  checks.push({ name: 'sessions length', ok: lenOk, detail: `actual=${len} expected=${expected}` });
  if (!lenOk) failures.push(`sessions.length (${len}) ≠ _meta.sessionsLength (${expected})`);

  // Check 3: sessionId monotonic
  let prev = -1;
  let monoOk = true;
  let monoBadIdx = -1;
  for (let i = 0; i < j.sessions.length; i++) {
    const s = j.sessions[i];
    if (!s) continue;
    const m = /session_(\d+)/.exec(s.sessionId);
    if (!m || !m[1]) {
      monoOk = false;
      monoBadIdx = i;
      break;
    }
    const n = parseInt(m[1], 10);
    if (n <= prev) {
      monoOk = false;
      monoBadIdx = i;
      break;
    }
    prev = n;
  }
  checks.push({
    name: 'sessionId monotonic',
    ok: monoOk,
    detail: monoOk ? `${j.sessions.length} ids ascending` : `break at idx ${monoBadIdx}`
  });
  if (!monoOk) failures.push(`sessionId monotonic violated at idx ${monoBadIdx}`);

  // Check 4: schemaVersion 박제값
  const expectedVersion = '1.0.0';
  const verOk = j._meta!.schemaVersion === expectedVersion;
  checks.push({ name: 'schemaVersion pin', ok: verOk, detail: `${j._meta!.schemaVersion}` });
  if (!verOk) failures.push(`schemaVersion (${j._meta!.schemaVersion}) ≠ pinned (${expectedVersion})`);

  return { ok: failures.length === 0, failures, checks };
}

if (require.main === module) {
  const ROOT = path.resolve(__dirname, '..', '..');
  const FIX = path.join(ROOT, 'tests', 'vr', 'fixtures', 'dashboard.mock.json');
  const r = verifyFixtureStability(FIX);
  console.log(`[verify-fixture-stability] ${path.relative(ROOT, FIX)}`);
  for (const c of r.checks) {
    console.log(`  ${c.ok ? 'PASS' : 'FAIL'} ${c.name} — ${c.detail}`);
  }
  if (!r.ok) {
    console.error(`\nFAIL: ${r.failures.length} invariant violation(s)`);
    process.exit(1);
  }
  console.log(`\nG5 PASS — fixture stable.`);
  process.exit(0);
}
