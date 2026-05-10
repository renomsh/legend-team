"use strict";
/**
 * get-ledger-snapshot.ts
 * G1 — PD-059 close 토큰 절감 (topic_169, session_196, 2026-05-05)
 *
 * decision_ledger.json에서 /close 시 필요한 최소 결정만 필터링.
 * 전문(48K tokens) 대신 스냅샷(수 K tokens)만 LLM에 노출.
 *
 * 필터 규칙:
 *   1. 현 topicId와 관련된 결정 전체 (topic 또는 relatedDecisions 매칭)
 *   2. 최근 N건 (날짜 내림차순, 기본 30)
 *   3. 위 두 집합의 합집합 (중복 제거)
 *
 * CLI: npx ts-node scripts/get-ledger-snapshot.ts <topicId> [--limit=30]
 * 출력: JSON stdout — decisions 배열 + 메타 (총 건수, 필터 건수, 생략 건수)
 *
 * Escape hatch: 충돌 의심 시 decision_ledger.json 전문 직접 조회 가능.
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function getSnapshot(topicId, limit) {
    const root = path.resolve(__dirname, '..');
    const ledgerPath = path.join(root, 'memory', 'shared', 'decision_ledger.json');
    if (!fs.existsSync(ledgerPath)) {
        throw new Error(`decision_ledger.json not found: ${ledgerPath}`);
    }
    const raw = fs.readFileSync(ledgerPath, 'utf-8');
    const ledger = JSON.parse(raw);
    const all = ledger.decisions || [];
    // 1. 현 topicId 관련 결정 전체
    const topicRelated = all.filter((d) => d.topic === topicId ||
        (Array.isArray(d.relatedDecisions) && d.relatedDecisions.includes(topicId)));
    // 2. 최근 N건 (날짜 내림차순 — 배열 뒤쪽이 최신이므로 slice(-limit))
    const recentN = all.slice(-limit);
    // 3. 합집합 (중복 제거, ID 기준)
    const seen = new Set();
    const merged = [];
    for (const d of [...topicRelated, ...recentN]) {
        if (!seen.has(d.id)) {
            seen.add(d.id);
            merged.push(d);
        }
    }
    // 날짜 내림차순 정렬 (최신 먼저)
    merged.sort((a, b) => {
        if (a.date > b.date)
            return -1;
        if (a.date < b.date)
            return 1;
        return 0;
    });
    return {
        generatedAt: new Date().toISOString(),
        totalDecisions: all.length,
        snapshotDecisions: merged.length,
        omittedDecisions: all.length - merged.length,
        topicId,
        limit,
        escapeHatch: '충돌 결정 의심 시 decision_ledger.json 전문 조회 가능 (escape hatch). ' +
            '이 스냅샷이 불충분하다고 판단되면 Read 도구로 memory/shared/decision_ledger.json 직접 읽기 허용.',
        decisions: merged,
    };
}
// ── CLI 진입점 ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === '--help') {
    console.error('Usage: npx ts-node scripts/get-ledger-snapshot.ts <topicId> [--limit=30]\n' +
        'Example: npx ts-node scripts/get-ledger-snapshot.ts topic_169\n' +
        'Example: npx ts-node scripts/get-ledger-snapshot.ts topic_169 --limit=50');
    process.exit(1);
}
const topicId = args[0];
const limitArg = args.find((a) => a.startsWith('--limit='));
const limitStr = limitArg ? limitArg.split('=')[1] : '30';
const limit = parseInt(limitStr ?? '30', 10);
if (isNaN(limit) || limit < 1) {
    console.error('Error: --limit must be a positive integer');
    process.exit(1);
}
try {
    const snapshot = getSnapshot(topicId, limit);
    console.log(JSON.stringify(snapshot, null, 2));
}
catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
}
//# sourceMappingURL=get-ledger-snapshot.js.map