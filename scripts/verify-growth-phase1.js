#!/usr/bin/env ts-node
"use strict";
/**
 * verify-growth-phase1.ts — D-060 Phase 1 자가검증
 *
 * G1 게이트:
 *   G1.1  growth_metrics.json 존재 + 파싱 가능
 *   G1.2  비-null datapoint ≥ 20개
 *   G1.3  L1.cumulativeLearning 3개 window 모두 datapoint 존재 (window 20/100/500)
 *   G1.4  dev.firstPassRate datapoint 존재 (non-null ≥ 1)
 *   G1.5  pendingLag 구조 유효 (dueAtSession 형식)
 *   G1.6  computedAtSession 필드 존재 (provenance 필드)
 *   G1.7  latestBySignature 재계산 정합 (signature 메트릭 키 일치)
 *   G1.8  metric_health.json 존재 + computedAtSession 필드
 *   G1.9  Phase 0 verify 회귀 (scoreMetric no longer throws)
 *   G1.10 auto-push.js에 compute-growth.ts 삽입 확인
 *   G1.11 dry-run 재실행 후 datapoint 수 불변 (멱등성)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const utils_1 = require("./lib/utils");
const compute_growth_1 = require("./compute-growth");
let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
    if (cond) {
        console.log(`  PASS  ${label}`);
        pass++;
    }
    else {
        console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`);
        fail++;
    }
}
async function main() {
    console.log('[verify-growth-phase1] 시작\n');
    // ── G1.1 파일 존재 + 파싱 ──────────────────────────────────────────────
    console.log('── G1 게이트 ──');
    const OUTPUT_PATH = path.join(utils_1.ROOT, 'memory', 'derived', 'growth_metrics.json');
    assert('G1.1  growth_metrics.json 존재', fs.existsSync(OUTPUT_PATH));
    const output = (0, utils_1.readJson)(OUTPUT_PATH, null);
    assert('G1.1b 파싱 성공', output !== null);
    if (!output) {
        printSummary();
        return;
    }
    // ── G1.2 nonNull ≥ 20 ──────────────────────────────────────────────────
    const nonNull = output.datapoints.filter((d) => d.value !== null);
    assert('G1.2  nonNull datapoints ≥ 20', nonNull.length >= 20, `got ${nonNull.length}`);
    // ── G1.3 L1.cumulativeLearning 3 windows ───────────────────────────────
    const l1dps = output.datapoints.filter((d) => d.metricId === 'common.L1.cumulativeLearning');
    const l1windows = new Set(l1dps.map((d) => d.window));
    assert('G1.3  L1 window=20 존재', l1windows.has(20));
    assert('G1.3b L1 window=100 존재', l1windows.has(100));
    assert('G1.3c L1 window=500 존재', l1windows.has(500));
    // ── G1.4 dev.firstPassRate non-null ≥ 1 ───────────────────────────────
    const devDps = output.datapoints.filter((d) => d.metricId === 'signature.dev.firstPassRate' && d.value !== null);
    assert('G1.4  dev.firstPassRate non-null ≥ 1', devDps.length >= 1, `got ${devDps.length}`);
    // ── G1.5 pendingLag 구조 유효 ──────────────────────────────────────────
    const lagValid = output.pendingLag.every((p) => typeof p.metricId === 'string' &&
        /^session_\d+$/.test(p.triggerSession) &&
        /^session_\d+$/.test(p.dueAtSession));
    assert('G1.5  pendingLag 구조 유효', lagValid, `${output.pendingLag.length}개 항목`);
    // ── G1.6 computedAtSession 필드 존재 ──────────────────────────────────
    const hasComputedAt = output.datapoints.every((d) => typeof d.computedAtSession === 'string');
    assert('G1.6  computedAtSession 필드 존재 (전체)', hasComputedAt);
    // ── G1.7 latestBySignature 정합 ────────────────────────────────────────
    const sigMetricIds = [...new Set(output.datapoints
            .filter((d) => d.metricId.startsWith('signature.'))
            .map((d) => d.metricId))];
    const lbsKeys = Object.keys(output.latestBySignature);
    const allSigPresent = sigMetricIds.every(id => lbsKeys.includes(id));
    assert('G1.7  latestBySignature 키 정합', allSigPresent, `sig=${sigMetricIds.length} lbs=${lbsKeys.length}`);
    // ── G1.8 metric_health.json ────────────────────────────────────────────
    const HEALTH_PATH = path.join(utils_1.ROOT, 'memory', 'derived', 'metric_health.json');
    assert('G1.8  metric_health.json 존재', fs.existsSync(HEALTH_PATH));
    const health = (0, utils_1.readJson)(HEALTH_PATH, {});
    assert('G1.8b computedAtSession 필드', typeof health.computedAtSession === 'string');
    assert('G1.8c metrics 필드', typeof health.metrics === 'object' && health.metrics !== null);
    // ── G1.9 Phase 0 회귀 — scoreMetric no longer throws ──────────────────
    console.log('\n── Phase 0 회귀 ──');
    try {
        const reg = (0, compute_growth_1.loadRegistry)();
        const regimes = (0, compute_growth_1.loadRegimes)();
        const def = reg.metrics.find(m => m.id === 'common.L1.cumulativeLearning');
        assert('G1.9  scoreMetricForWindow callable (L1)', def !== undefined);
        if (def) {
            const dp = (0, compute_growth_1.scoreMetricForWindow)(def, {
                sessionId: 'session_078',
                window: 20,
                allSessions: [],
                regimes,
                registryVersion: reg.registryVersion,
                existingDatapoints: [],
            });
            assert('G1.9b returns GrowthDatapoint', dp !== null && typeof dp === 'object');
            assert('G1.9c metricId correct', dp.metricId === 'common.L1.cumulativeLearning');
        }
    }
    catch (e) {
        assert('G1.9  scoreMetricForWindow callable', false, String(e));
    }
    // ── G1.10 auto-push.js 삽입 확인 ───────────────────────────────────────
    console.log('\n── 훅 체인 ──');
    const AUTOPUSH = path.join(utils_1.ROOT, 'scripts', 'auto-push.js');
    const autoPushSrc = fs.existsSync(AUTOPUSH) ? fs.readFileSync(AUTOPUSH, 'utf8') : '';
    assert('G1.10 auto-push.js에 compute-growth 삽입됨', autoPushSrc.includes('compute-growth.ts'), 'scripts/auto-push.js에서 미검출');
    // compute-growth이 compute-dashboard 앞에 위치하는지 확인
    const cgIdx = autoPushSrc.indexOf('compute-growth.ts');
    const cdIdx = autoPushSrc.indexOf('compute-dashboard.ts');
    assert('G1.10b compute-growth이 compute-dashboard 앞에 위치', cgIdx > 0 && cdIdx > 0 && cgIdx < cdIdx);
    // ── G1.11 멱등성 (dry-run 재실행 후 datapoint 수 불변) ─────────────────
    console.log('\n── 멱등성 ──');
    try {
        const countBefore = output.datapoints.length;
        const out2 = await (0, compute_growth_1.computeGrowth)({ dryRun: true });
        assert('G1.11 dry-run 재실행 후 datapoint 수 불변', out2.datapoints.length === countBefore, `before=${countBefore} after=${out2.datapoints.length}`);
    }
    catch (e) {
        assert('G1.11 dry-run 재실행', false, String(e));
    }
    printSummary();
}
function printSummary() {
    console.log(`\n[verify-growth-phase1] ${pass} PASS / ${fail} FAIL`);
    if (fail > 0)
        process.exit(1);
}
main().catch(e => {
    console.error('[verify-growth-phase1] FATAL:', e instanceof Error ? e.message : e);
    process.exit(1);
});
//# sourceMappingURL=verify-growth-phase1.js.map