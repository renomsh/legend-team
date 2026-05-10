#!/usr/bin/env ts-node
"use strict";
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
exports.main = main;
/**
 * sync-system-state.ts
 * session_index / topic_index / decision_ledger 원본을 읽어
 * memory/shared/system_state.json(fast-path)을 재계산한다.
 *
 * 자동 갱신 필드:
 *   - lastSessionId, nextSessionId (session_index 기준)
 *   - openTopics (topic_index 기준 — status in-progress | suspended)
 *   - recentDecisions (decision_ledger 최신 5개)
 *
 * 보존 필드 (수동 관리):
 *   - pendingDeferrals (Claude가 /close 시 직접 resolved 처리)
 *   - currentVersion
 *
 * 사용법:
 *   ts-node scripts/sync-system-state.ts
 */
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const SESSION_INDEX_PATH = path.join(utils_1.ROOT, 'memory', 'sessions', 'session_index.json');
const TOPIC_INDEX_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'topic_index.json');
const DECISION_LEDGER_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'decision_ledger.json');
const SYSTEM_STATE_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'system_state.json');
const PENDING_DEFERRALS_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'pending_deferrals.json');
function parseSessionNum(id) {
    const m = id.match(/session_(\d+)/);
    return m && m[1] ? parseInt(m[1], 10) : 0;
}
function pad3(n) {
    return String(n).padStart(3, '0');
}
function main() {
    console.log('🔄 sync-system-state.ts 시작...');
    const CHARTER_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'project_charter.json');
    const sessionIndex = (0, utils_1.readJson)(SESSION_INDEX_PATH, { sessions: [] });
    const topicIndex = (0, utils_1.readJson)(TOPIC_INDEX_PATH, { topics: [] });
    const decisionLedger = (0, utils_1.readJson)(DECISION_LEDGER_PATH, { decisions: [] });
    const charter = (0, utils_1.readJson)(CHARTER_PATH, {});
    const pendingDeferralsFile = (0, utils_1.readJson)(PENDING_DEFERRALS_PATH, { items: [] });
    const currentState = (0, utils_1.readJson)(SYSTEM_STATE_PATH, {
        lastSessionId: 'session_000',
        nextSessionId: 'session_001',
        currentVersion: 'v0.0.0',
        openTopics: [],
        recentDecisions: [],
        recentSessionSummaries: [],
        pendingDeferrals: [],
        lastUpdated: new Date().toISOString(),
    });
    // lastSessionId / nextSessionId
    const sessionNums = sessionIndex.sessions.map(s => parseSessionNum(s.sessionId)).filter(n => n > 0);
    const lastNum = sessionNums.length > 0 ? Math.max(...sessionNums) : 0;
    const lastSessionId = `session_${pad3(lastNum)}`;
    const nextSessionId = `session_${pad3(lastNum + 1)}`;
    // openTopics
    const openTopics = topicIndex.topics
        .filter(t => t.status === 'in-progress' || t.status === 'suspended')
        .map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        ...(t.reportPath && { reportPath: t.reportPath }),
        ...(t.note && { note: t.note }),
    }));
    // recentDecisions (최신 5개, date+id 역순)
    const sorted = [...decisionLedger.decisions].sort((a, b) => {
        const cmp = (b.date || '').localeCompare(a.date || '');
        if (cmp !== 0)
            return cmp;
        return b.id.localeCompare(a.id);
    });
    const recentDecisions = sorted.slice(0, 5).map(d => ({
        id: d.id,
        date: d.date,
        axis: d.axis,
        summary: d.value || d.axis,
    }));
    // recentSessionSummaries (최신 3개, closedAt 역순)
    // R-3 레거시 폴백: closedInSession 없는 항목도 topicSlug 그대로 포함 + "(레거시)" 표기
    const sessionsSortedByClose = [...sessionIndex.sessions]
        .filter(s => s.closedAt != null)
        .sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''));
    const summaryEligible = sessionsSortedByClose.filter(s => s.oneLineSummary != null);
    const recentSessionSummaries = summaryEligible.slice(0, 3).map(s => {
        let summary = s.oneLineSummary;
        // 500자 초과 시 truncate
        if (summary.length > 500) {
            console.warn(`[sync-system-state] oneLineSummary truncated for ${s.sessionId} (${summary.length} chars)`);
            summary = summary.slice(0, 497) + '…';
        }
        return {
            sessionId: s.sessionId,
            topicSlug: s.topicSlug || '(unknown)',
            closedAt: s.closedAt,
            oneLineSummary: summary,
            decisionsAdded: Array.isArray(s.decisionsAdded) ? s.decisionsAdded : [],
        };
    });
    // currentVersion: project_charter.json이 최신 버전 출처 (applyVersionBump가 charter를 먼저 갱신)
    const currentVersion = charter.charter?.version
        ? `v${charter.charter.version}`.replace(/^vv/, 'v')
        : currentState.currentVersion;
    const next = {
        _comment: currentState._comment || 'fast-path 파일. /open 시 최우선 로드. 원본에서 파생됨. /close 시 재계산.',
        lastSessionId,
        nextSessionId,
        currentVersion,
        openTopics,
        recentDecisions,
        recentSessionSummaries,
        pendingDeferrals: (pendingDeferralsFile.items || []).filter((d) => d.status === 'pending'),
        lastUpdated: new Date().toISOString(),
    };
    (0, utils_1.writeJson)(SYSTEM_STATE_PATH, next);
    (0, utils_1.appendLog)('sync-system-state', `lastSession=${lastSessionId} openTopics=${openTopics.length} recentDecisions=${recentDecisions.length} recentSummaries=${recentSessionSummaries.length} deferrals=${next.pendingDeferrals.length}`);
    console.log(`✅ system_state.json 갱신 — last=${lastSessionId} next=${nextSessionId} openTopics=${openTopics.length} recentSummaries=${recentSessionSummaries.length} deferrals(pending)=${next.pendingDeferrals.filter(d => d.status === 'pending').length}`);
}
if (require.main === module)
    main();
//# sourceMappingURL=sync-system-state.js.map