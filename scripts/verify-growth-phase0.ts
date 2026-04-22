#!/usr/bin/env ts-node
/**
 * Phase 0 자가검증. Dev 규칙: 구현 후 런타임 검증 필수, export 함수 callable.
 */
import {
  loadRegistry, loadRegimes, loadExistingOutput,
  validateRegistry, resolveRegimeAt, scoreMetric, resolvePendingLag,
  computeGrowth,
  MetricsRegistry, MetricDef
} from './compute-growth';

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else      { fail++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
}

// ── T1. Registry 로드 & 필드 검증 ─────────────────────────────────────
console.log('[T1] Registry load & field integrity');
const reg = loadRegistry();
check('schemaVersion 존재', reg.schemaVersion === '0.1.0');
check('registryVersion=v1', reg.registryVersion === 'v1');
check('metrics 배열', Array.isArray(reg.metrics));
check('common 3개', reg.metrics.filter(m => m.tier === 'common').length === 3);
check('signature 8개', reg.metrics.filter(m => m.tier === 'signature').length === 8);
check('전 메트릭 active', reg.metrics.every(m => m.status === 'active'));
check('scoringLag 전 필드 존재',
  reg.metrics.every(m => typeof m.scoringLag === 'number'));
check('windows=[20,100,500]',
  reg.metrics.every(m => m.windows.length === 3 && m.windows[0] === 20));

// Master 확인한 scoringLag 값 정확성
const lagExpected: Record<string, number> = {
  'signature.ace.orchestrationHitRate': 3,
  'signature.arki.structuralLifespan': 10,
  'signature.fin.costForecastAccuracy': 0,
  'signature.riki.riskF1': 3,
  'signature.dev.firstPassRate': 0,
  'signature.vera.masterRevisionInv': 0,
  'signature.edi.gapFlagAccuracy': 1,
  'signature.nova.promotionRate': 5,
};
for (const [id, expected] of Object.entries(lagExpected)) {
  const m = reg.metrics.find(x => x.id === id);
  check(`scoringLag ${id}=${expected}`, m?.scoringLag === expected, `got=${m?.scoringLag}`);
}

// ── T2. validateRegistry — 정상/오류 ───────────────────────────────────
console.log('\n[T2] validateRegistry — error paths');
check('valid registry → errors=[]', validateRegistry(reg).length === 0);

const bad: MetricsRegistry = {
  schemaVersion: '0.1.0', registryVersion: 'x', effectiveFrom: 'x',
  metrics: [
    { id: 'dup.a', tier: 'common', source:{type:'x'}, scorer:{mode:'automatic'}, scoringLag: -1 as number, windows:[20], normalization:'none', status:'active' } as MetricDef,
    { id: 'dup.a', tier: 'common', source:{type:'x'}, scorer:{mode:'automatic'}, scoringLag: 0, windows:[20], normalization:'none', status:'active' } as MetricDef,
  ]
};
const errs = validateRegistry(bad);
check('duplicate id 감지', errs.some(e => e.includes('duplicate metric id')));
check('negative scoringLag 감지', errs.some(e => e.includes('scoringLag')));

// ── T3. Regime 해석 ────────────────────────────────────────────────────
console.log('\n[T3] resolveRegimeAt');
const regimes = loadRegimes();
check('regimes=3', regimes.length === 3);

const r052 = resolveRegimeAt('session_052', regimes);
check('session_052 (전 레짐) → null', r052.id === null && !r052.inTransitionZone);

const r053 = resolveRegimeAt('session_053', regimes);
check('session_053 → R-001 + zone', r053.id === 'R-001' && r053.inTransitionZone === true);

const r055 = resolveRegimeAt('session_055', regimes);
check('session_055 (transitionZone 내) → R-001 + zone', r055.id === 'R-001' && r055.inTransitionZone === true);

const r056 = resolveRegimeAt('session_056', regimes);
check('session_056 (zone 이탈) → R-001 + !zone', r056.id === 'R-001' && r056.inTransitionZone === false);

const r068 = resolveRegimeAt('session_068', regimes);
check('session_068 → R-003 + zone', r068.id === 'R-003' && r068.inTransitionZone === true);

const r078 = resolveRegimeAt('session_078', regimes);
check('session_078 (최신 이후) → R-003 !zone', r078.id === 'R-003' && r078.inTransitionZone === false);

// ── T4. Phase 1 스텁은 throw 보장 ──────────────────────────────────────
console.log('\n[T4] Phase 1 stubs throw');
const aceMetric = reg.metrics.find(m => m.id === 'signature.ace.orchestrationHitRate')!;
let threw = false;
try { scoreMetric(aceMetric, 'session_078'); } catch (e) { threw = (e as Error).message.includes('Phase 1'); }
check('scoreMetric throws Phase 1', threw);
threw = false;
try { resolvePendingLag(loadExistingOutput(), 'session_078'); } catch (e) { threw = (e as Error).message.includes('Phase 1'); }
check('resolvePendingLag throws Phase 1', threw);

// ── T5. 엔트리포인트 ───────────────────────────────────────────────────
console.log('\n[T5] computeGrowth entrypoint');
(async () => {
  const out = await computeGrowth({ dryRun: true });
  check('dryRun 출력 registryVersion=v1', out.registryVersion === 'v1');
  check('dryRun datapoints=[]', out.datapoints.length === 0);
  check('dryRun pendingLag=[]', out.pendingLag.length === 0);
  check('_phase0 마커', out._phase0 === '__phase_0_skeleton__');

  // ── T6. 크로스참조: rubric/classifier가 registry와 정합 ───────────────
  console.log('\n[T6] Cross-ref integrity');
  const rubric = require('../memory/shared/hit_rate_rubric.json');
  const v1 = rubric.versions[0].rubrics;
  const consensusMetrics = reg.metrics.filter(m => m.scorer.mode === 'consensus' || m.scorer.mode === 'single');
  for (const m of consensusMetrics) {
    if (!m.scorer.rubricRef) continue;
    const key = m.scorer.rubricRef.split('#/rubrics/')[1] || m.scorer.rubricRef.split('#')[1];
    if (key && !key.startsWith('currentVersion')) {
      check(`rubric 존재: ${key}`, !!v1[key], `ref=${m.scorer.rubricRef}`);
    }
  }

  const classifier = require('../memory/shared/intervention_classifier.json');
  check('classifier classes=5', classifier.classes.length === 5);
  const autoFormula = classifier.autonomyFormula;
  check('autonomy formula 존재', typeof autoFormula === 'string' && autoFormula.includes('directive'));

  // ── Summary ─────────────────────────────────────────────────────────
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  PASS: ${pass}   FAIL: ${fail}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  process.exit(fail > 0 ? 1 : 0);
})();
