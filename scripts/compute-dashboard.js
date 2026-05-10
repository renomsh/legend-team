#!/usr/bin/env ts-node
"use strict";
/**
 * compute-dashboard.ts
 * 대시보드 지표 계산기 → memory/shared/dashboard_data.json 출력
 *
 * Size 공식 (D-027):
 *   Size = (decisionAxes × 2) + rolesCalled + (rolesRecalled × 2) + (sessionsSpanned × 3)
 *   masterTurns 제거 — 자율성 지표는 버블 색상으로만 표현
 *
 * 사용법:
 *   ts-node scripts/compute-dashboard.ts
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
exports.computeAckedButUnresolved = computeAckedButUnresolved;
exports.computeNexusPushStats = computeNexusPushStats;
exports.main = main;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
// ── 경로 (환경변수 오버라이드 지원 — 테스트 픽스처 주입용) ──────────────────
const SESSION_INDEX_PATH = process.env.COMPUTE_SESSION_INDEX ?? path.join(utils_1.ROOT, 'memory', 'sessions', 'session_index.json');
const TOPIC_INDEX_PATH = process.env.COMPUTE_TOPIC_INDEX ?? path.join(utils_1.ROOT, 'memory', 'shared', 'topic_index.json');
const DECISION_LEDGER_PATH = process.env.COMPUTE_DECISION_LEDGER ?? path.join(utils_1.ROOT, 'memory', 'shared', 'decision_ledger.json');
const TOKEN_LOG_PATH = process.env.COMPUTE_TOKEN_LOG ?? path.join(utils_1.ROOT, 'memory', 'sessions', 'token_log.json');
const FEEDBACK_LOG_PATH = process.env.COMPUTE_FEEDBACK_LOG ?? path.join(utils_1.ROOT, 'memory', 'master', 'master_feedback_log.json');
const PROPOSAL_LOG_PATH = process.env.COMPUTE_PROPOSAL_LOG ?? path.join(utils_1.ROOT, 'memory', 'sessions', 'proposal_log.json');
const SYSTEM_STATE_PATH = process.env.COMPUTE_SYSTEM_STATE ?? path.join(utils_1.ROOT, 'memory', 'shared', 'system_state.json');
const PENDING_DEFERRALS_PATH = process.env.COMPUTE_PENDING_DEFERRALS ?? path.join(utils_1.ROOT, 'memory', 'shared', 'pending_deferrals.json');
const OUTPUT_PATH = process.env.COMPUTE_OUTPUT_PATH ?? path.join(utils_1.ROOT, 'memory', 'shared', 'dashboard_data.json');
// Sonnet 4.6 단가 ($ per 1M tokens)
const COST_PER_MTOK = { input: 3.0, output: 15.0, cache_creation: 3.75, cache_read: 0.30 };
function calcCostUSD(usage) {
    return ((usage.input_tokens * COST_PER_MTOK.input +
        usage.output_tokens * COST_PER_MTOK.output +
        usage.cache_creation_input_tokens * COST_PER_MTOK.cache_creation +
        usage.cache_read_input_tokens * COST_PER_MTOK.cache_read) / 1_000_000);
}
/**
 * 단일 출처 SOT: decision_ledger.json 의 caveatsMeta.
 * acked=true && resolvedAt=null && (currentSession - ackedBySession) >= ttl 인 caveat을 항목별로 평탄화.
 *
 * @param decisions decision_ledger.decisions
 * @param currentSessionNum 현재 세션 정수 (예: session_168 → 168)
 * @param ttl ack 후 미해결 노출 TTL (세션 수, default 2 — D-145 Master 결정)
 */
function computeAckedButUnresolved(decisions, currentSessionNum, ttl = 2) {
    const out = [];
    for (const d of decisions) {
        const m = d.caveatsMeta;
        if (!m || !m.acked || m.resolvedAt)
            continue;
        const ackedSess = m.ackedBySession ?? '';
        const ackedNum = parseInt(ackedSess.replace('session_', ''), 10);
        if (isNaN(ackedNum))
            continue;
        const age = currentSessionNum - ackedNum;
        if (age < ttl)
            continue;
        for (const caveat of d.caveats ?? []) {
            out.push({
                decisionId: d.id,
                caveat,
                ackedBySession: m.ackedBySession,
                ackedAt: m.ackedAt,
                ageInSessions: age,
            });
        }
    }
    return out;
}
// ── 헬퍼 ──────────────────────────────────────────────────────────────────
function computeSize(decisionAxes, rolesCalled, rolesRecalled, sessionsSpanned) {
    return (decisionAxes * 2) + rolesCalled + (rolesRecalled * 2) + (sessionsSpanned * 3);
}
function sizeToGrade(size) {
    if (size >= 12)
        return 'S';
    if (size >= 8)
        return 'A';
    if (size >= 5)
        return 'B';
    return 'C';
}
function countRolesRecalled(agentsCompleted) {
    const counts = new Map();
    for (const role of agentsCompleted) {
        counts.set(role, (counts.get(role) ?? 0) + 1);
    }
    let recalled = 0;
    for (const count of counts.values()) {
        if (count > 1)
            recalled += count - 1;
    }
    return recalled;
}
function extractKeywords(text) {
    const stopWords = new Set(['이', '가', '은', '는', '을', '를', '의', '에', '로', '으로', '와', '과', '및', '또는', '그리고']);
    return text
        .replace(/[^\w가-힣\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 2 && !stopWords.has(w))
        .slice(0, 5);
}
// ── D-169 P8: nexus push 운영 통계 ──────────────────────────────────────────
/**
 * nexus/hook 모드 분포 + 운영 이상 집계.
 * session_index.sessions의 gaps + pending_turns 파일 현황으로 구성.
 */
function computeNexusPushStats(sessionIdx, cwd = utils_1.ROOT) {
    const dist = { hook: 0, nexus: 0, undefined: 0 };
    let crashRecoveryCount = 0;
    let hookOriginViolations = 0;
    let nexusPushMissing = 0;
    for (const s of sessionIdx.sessions) {
        const mode = s.turnPushMode ?? 'undefined';
        dist[mode] = (dist[mode] ?? 0) + 1;
        if (Array.isArray(s.turns)) {
            for (const t of s.turns) {
                if (t._crashRecovery)
                    crashRecoveryCount++;
            }
        }
        if (Array.isArray(s.gaps)) {
            for (const g of s.gaps) {
                if (g.type === 'hook-origin-invalid')
                    hookOriginViolations++;
                if (g.type === 'nexus-push-missing')
                    nexusPushMissing++;
            }
        }
    }
    const sessionsDir = path.join(cwd, 'memory', 'sessions');
    const orphanPendingFiles = [];
    try {
        for (const f of fs.readdirSync(sessionsDir)) {
            if (f.startsWith('pending_turns_') && f.endsWith('.jsonl')) {
                try {
                    const fullPath = path.join(sessionsDir, f);
                    const stat = fs.statSync(fullPath);
                    const lines = fs.readFileSync(fullPath, 'utf8').split('\n').filter(l => l.trim()).length;
                    orphanPendingFiles.push({ file: f, sizeBytes: stat.size, lines });
                }
                catch { }
            }
        }
    }
    catch { }
    let archiveCount = 0;
    try {
        const archiveDir = path.join(sessionsDir, 'pending_turns_archive');
        if (fs.existsSync(archiveDir))
            archiveCount = fs.readdirSync(archiveDir).filter(f => f.endsWith('.jsonl')).length;
    }
    catch { }
    return { turnPushModeDistribution: dist, crashRecoveryCount, hookOriginViolations, nexusPushMissing, orphanPendingFiles, archiveCount };
}
// ── 메인 ──────────────────────────────────────────────────────────────────
function main() {
    console.log('📊 compute-dashboard.ts 시작...');
    const sessionIndex = (0, utils_1.readJson)(SESSION_INDEX_PATH, { sessions: [] });
    const topicIndex = (0, utils_1.readJson)(TOPIC_INDEX_PATH, { topics: [] });
    const decisionLedger = (0, utils_1.readJson)(DECISION_LEDGER_PATH, { decisions: [] });
    const tokenLog = (0, utils_1.readJson)(TOKEN_LOG_PATH, { entries: [] });
    const feedbackLogRaw = (0, utils_1.readJson)(FEEDBACK_LOG_PATH, {});
    const feedbackLog = { entries: feedbackLogRaw.feedbackLog ?? feedbackLogRaw.entries ?? [] };
    const proposalLog = (0, utils_1.readJson)(PROPOSAL_LOG_PATH, { proposals: [] });
    const systemState = (0, utils_1.readJson)(SYSTEM_STATE_PATH, {});
    const pendingDeferralsData = (0, utils_1.readJson)(PENDING_DEFERRALS_PATH, { items: [] });
    const pendingDeferrals = pendingDeferralsData.items ?? [];
    // 토픽별 세션 수 (sessionsSpanned 계산용)
    const topicSlugToSessions = new Map();
    for (const s of sessionIndex.sessions) {
        const count = topicSlugToSessions.get(s.topicSlug) ?? 0;
        topicSlugToSessions.set(s.topicSlug, count + 1);
    }
    // 토큰 맵
    const tokenMap = new Map();
    for (const t of tokenLog.entries) {
        tokenMap.set(t.legendSessionId, t.usage);
    }
    // 제안 맵 (sessionId → proposals)
    const proposalMap = new Map();
    for (const p of proposalLog.proposals) {
        const list = proposalMap.get(p.sessionId) ?? [];
        list.push(p);
        proposalMap.set(p.sessionId, list);
    }
    // 세션 결정 수 + ID 배열 (decision_ledger 기준 — 권위 있는 원본)
    const sessionDecisionCount = new Map();
    const sessionDecisionIds = new Map();
    for (const d of decisionLedger.decisions) {
        const count = sessionDecisionCount.get(d.session) ?? 0;
        sessionDecisionCount.set(d.session, count + 1);
        const list = sessionDecisionIds.get(d.session) ?? [];
        list.push(d.id);
        sessionDecisionIds.set(d.session, list);
    }
    // ── 세션 데이터 계산 ────────────────────────────────────────────────────
    const AUTO_START_SESSION = 'session_027'; // Hook 자동 수집 시작
    const autoStartNum = parseInt(AUTO_START_SESSION.replace('session_', ''), 10);
    const sessions = sessionIndex.sessions.map(s => {
        const sessionNum = parseInt(s.sessionId.replace('session_', ''), 10);
        const hasBackfill = s.agentsCompleted && s.agentsCompleted.length > 0 && sessionNum < autoStartNum;
        const dataQuality = sessionNum >= autoStartNum ? 'auto' : (hasBackfill ? 'backfill' : 'manual');
        const agents = s.agentsCompleted ?? [];
        const rolesCalled = agents.length > 0 ? agents.length : 1; // 최소 1 (Ace)
        const rolesRecalled = countRolesRecalled(agents);
        const sessionsSpanned = topicSlugToSessions.get(s.topicSlug) ?? 1;
        const decisionAxes = sessionDecisionCount.get(s.sessionId)
            ?? (s.decisions?.length ?? 0);
        const size = computeSize(decisionAxes, rolesCalled, rolesRecalled, sessionsSpanned);
        const gradeActual = sizeToGrade(size);
        // legacy: s.grade='D' (pre-D-174) → map to 'C'
        const rawDeclared = s.grade === 'D' ? 'C' : s.gradeDeclared;
        const gradeDeclared = (rawDeclared ?? gradeActual);
        const gradeMismatch = gradeDeclared !== gradeActual;
        const framingSkipped = s.framingSkipped ?? false;
        const token = tokenMap.get(s.sessionId);
        const totalBill = token
            ? (token.total_billable ?? ((token.input_tokens || 0) + (token.output_tokens || 0) + (token.cache_creation_input_tokens || 0) + (token.cache_read_input_tokens || 0)))
            : 0;
        const ioTokens = token ? (token.input_tokens || 0) + (token.output_tokens || 0) : 0;
        const tokenUsage = token && totalBill > 0 ? {
            totalBillable: totalBill,
            ioTokens,
            inputTokens: token.input_tokens || 0,
            outputTokens: token.output_tokens || 0,
            cacheCreate: token.cache_creation_input_tokens || 0,
            cacheRead: token.cache_read_input_tokens || 0,
            cacheHitRate: (token.cache_read_input_tokens || 0) / totalBill,
            messageCount: token.messageCount || 0,
        } : undefined;
        const sessionCostUSD = token && totalBill > 0
            ? parseFloat(calcCostUSD(token).toFixed(4))
            : undefined;
        const proposals = proposalMap.get(s.sessionId) ?? [];
        const adoptionRate = proposals.length > 0
            ? proposals.filter(p => p.label === 'explicit' || p.label === 'implicit').length / proposals.length
            : undefined;
        const decIds = sessionDecisionIds.get(s.sessionId) ?? s.decisions ?? [];
        return {
            sessionId: s.sessionId,
            topicSlug: s.topicSlug,
            topic: s.topic,
            startedAt: s.startedAt,
            closedAt: s.closedAt,
            decisionCount: decIds.length,
            decisionAxes,
            ...(decIds.length > 0 && { decisions: decIds }),
            rolesCalled,
            rolesRecalled,
            sessionsSpanned,
            size,
            gradeDeclared,
            gradeActual,
            gradeMismatch,
            framingSkipped,
            masterTurns: token?.masterTurns ?? s.masterTurns ?? 0,
            dataQuality,
            ...(agents.length > 0 && { agentsCompleted: agents }),
            ...(tokenUsage && { tokenUsage }),
            ...(adoptionRate !== undefined && { adoptionRate }),
            ...(sessionCostUSD !== undefined && { sessionCostUSD }),
        };
    });
    // ── grade 통계 ───────────────────────────────────────────────────────────
    const gradeCount = { S: 0, A: 0, B: 0, C: 0 };
    let gradeMismatchCount = 0;
    let framingSkippedCount = 0;
    const mismatchSessions = [];
    for (const s of sessions) {
        gradeCount[s.gradeActual]++;
        if (s.gradeMismatch) {
            gradeMismatchCount++;
            mismatchSessions.push(s.sessionId);
        }
        if (s.framingSkipped)
            framingSkippedCount++;
    }
    // ── 토픽 grade 분포 (topic_index 기준) ───────────────────────────────────
    const topicGradeCount = { S: 0, A: 0, B: 0, C: 0 };
    for (const t of topicIndex.topics) {
        const g = t.grade;
        if (g && g in topicGradeCount)
            topicGradeCount[g]++;
    }
    // ── 전체 지표 ────────────────────────────────────────────────────────────
    const totalSessions = sessions.length;
    const withMasterTurns = sessions.filter(s => s.masterTurns > 0);
    const avgMasterTurns = withMasterTurns.length > 0
        ? withMasterTurns.reduce((sum, s) => sum + s.masterTurns, 0) / withMasterTurns.length
        : 0;
    const autoSessions = sessions.filter(s => s.dataQuality === 'auto' && s.tokenUsage);
    const costSessions = sessions.filter(s => s.sessionCostUSD !== undefined);
    const totalCostUSD = parseFloat(costSessions.reduce((sum, s) => sum + (s.sessionCostUSD ?? 0), 0).toFixed(4));
    const avgCostPerSession = costSessions.length > 0
        ? parseFloat((totalCostUSD / costSessions.length).toFixed(4))
        : 0;
    const avgCacheHitRate = autoSessions.length > 0
        ? autoSessions.reduce((sum, s) => sum + (s.tokenUsage?.cacheHitRate ?? 0), 0) / autoSessions.length
        : 0;
    const withAdoption = sessions.filter(s => s.adoptionRate !== undefined);
    const avgAdoptionRate = withAdoption.length > 0
        ? withAdoption.reduce((sum, s) => sum + (s.adoptionRate ?? 0), 0) / withAdoption.length
        : 0;
    // ── 경보 (R1, R3) ────────────────────────────────────────────────────────
    // R2(Master 병목) 삭제: masterTurns 단독으로 병목/깊은논의 구분 불가 (session_075)
    // R5(피드백 재발) alarms 제거: 키워드 기반 구현이 도메인 메타어 노이즈 유발 (session_075)
    //   → feedbackRecurrences 배열은 대시보드 별도 시각화용으로 보존
    const alarms = [];
    // R1 임계값: Grade 구분 없이 ≥11 (D-104, 2026-04-28. 기존 A/S:≥5, B/C:≥3)
    const r1Threshold = (_grade) => 11;
    for (const s of sessions) {
        // R1: 역할 과호출 (Grade 조건부 임계값)
        const threshold = r1Threshold(s.gradeDeclared);
        if (s.rolesRecalled >= threshold) {
            alarms.push({ ruleId: 'R1', severity: 'yellow', sessionId: s.sessionId, description: `역할 과호출: rolesRecalled=${s.rolesRecalled} (임계값 ${threshold}, grade=${s.gradeDeclared})` });
        }
        // R3: 고토큰 저재활용 (캐시 히트율 50% 미만, auto 세션만)
        if (s.dataQuality === 'auto' && s.tokenUsage && s.tokenUsage.cacheHitRate < 0.5) {
            alarms.push({ ruleId: 'R3', severity: 'yellow', sessionId: s.sessionId, description: `저캐시 히트율: ${(s.tokenUsage.cacheHitRate * 100).toFixed(1)}%` });
        }
    }
    // R-MERGE: worktree merge 실패 경보 (system_state.worktreeMergeFailures)
    for (const f of systemState.worktreeMergeFailures ?? []) {
        alarms.push({
            ruleId: 'R-MERGE',
            severity: 'red',
            description: `worktree merge 실패: ${f.branch} (${f.detectedAt?.slice(0, 10)}) — 수동 머지 필요`,
        });
    }
    // feedbackRecurrences: 경보 분리 보존 (alarms에 포함하지 않음)
    const feedbackRecurrences = [];
    const keywordMap = new Map();
    for (const f of feedbackLog.entries) {
        const keywords = extractKeywords(f.feedback ?? f.topic ?? '');
        for (const kw of keywords) {
            const list = keywordMap.get(kw) ?? [];
            list.push({ date: f.date, feedbackId: f.id, summary: (f.feedback ?? '').slice(0, 60) });
            keywordMap.set(kw, list);
        }
    }
    for (const [kw, occurrences] of keywordMap.entries()) {
        if (occurrences.length >= 2) {
            feedbackRecurrences.push({ keyword: kw, occurrences });
        }
    }
    // ── 역할 호출 빈도 집계 (Turn[] 기반, non-legacy 전용) ───────────────────
    // D-048: seen.has() 제거 — Turn[] 기반으로 재호출 포함 전체 카운트.
    // legacy:true 세션은 집계 배제 (R-6).
    const turnRoleFreqMap = new Map();
    for (const s of sessionIndex.sessions) {
        if (s.legacy)
            continue;
        if (!s.turns || s.turns.length === 0)
            continue;
        for (const turn of s.turns) {
            let role = turn.role.toLowerCase();
            if (role === 'editor')
                role = 'edi';
            const entry = turnRoleFreqMap.get(role) ?? { count: 0, sessions: [] };
            entry.count++;
            if (!entry.sessions.includes(s.sessionId))
                entry.sessions.push(s.sessionId);
            turnRoleFreqMap.set(role, entry);
        }
    }
    const roleFrequency = Array.from(turnRoleFreqMap.entries())
        .map(([role, data]) => ({ role, count: data.count, sessions: data.sessions }))
        .sort((a, b) => b.count - a.count);
    // ── Turn 시퀀스 (D3 sequence 대시보드용) ─────────────────────────────────
    const turnSequences = sessionIndex.sessions
        .filter(s => !s.legacy && s.turns && s.turns.length > 0)
        .map(s => ({
        sessionId: s.sessionId,
        topic: s.topic ?? s.topicSlug,
        sequence: s.turns.map(t => ({
            role: t.role,
            phase: t.phase ?? null,
            turnIdx: t.turnIdx,
            recallReason: t.recallReason ?? null,
        })),
    }));
    // ── ackedButUnresolved (D-145, PD-056) ──────────────────────────────────
    // 현재 세션 번호 = session_index 마지막 entry 기준
    const lastSessionEntry = sessionIndex.sessions[sessionIndex.sessions.length - 1];
    const lastSessionId = lastSessionEntry ? lastSessionEntry.sessionId : 'session_0';
    const currentSessionNum = parseInt(lastSessionId.replace('session_', ''), 10) || 0;
    const ackedButUnresolved = computeAckedButUnresolved(decisionLedger.decisions, currentSessionNum, 2 // TTL=2 (Master 결정, D-145)
    );
    // ── D-169 P8: nexus push 운영 통계 ──────────────────────────────────────
    const nexusPushStats = computeNexusPushStats(sessionIndex, utils_1.ROOT);
    // ── 출력 ─────────────────────────────────────────────────────────────────
    const output = {
        generatedAt: new Date().toISOString(),
        totalSessions,
        autoDataFrom: AUTO_START_SESSION,
        ackedButUnresolved,
        nexusPushStats,
        pendingDeferrals,
        metrics: {
            avgMasterTurns: parseFloat(avgMasterTurns.toFixed(2)),
            avgCacheHitRate: parseFloat(avgCacheHitRate.toFixed(4)),
            cacheSampleSize: autoSessions.length,
            cacheSampleTotal: totalSessions,
            avgAdoptionRate: parseFloat(avgAdoptionRate.toFixed(4)),
            totalDecisions: decisionLedger.decisions.length,
            gradeDistribution: gradeCount,
            topicGradeDistribution: topicGradeCount,
            gradeMismatchCount,
            gradeMismatchSessions: mismatchSessions,
            framingSkippedCount,
            turnBasedSessions: turnSequences.length,
            totalCostUSD,
            avgCostPerSession,
            costSampleSize: costSessions.length,
            // D-169 P8: nexus push 운영 요약
            nexusModeSessions: nexusPushStats.turnPushModeDistribution['nexus'] ?? 0,
            orphanPendingCount: nexusPushStats.orphanPendingFiles.length,
            crashRecoveryCount: nexusPushStats.crashRecoveryCount,
        },
        sessions,
        roleFrequency,
        turnSequences,
        alarms,
        feedbackRecurrences,
    };
    (0, utils_1.writeJson)(OUTPUT_PATH, output);
    (0, utils_1.appendLog)('compute-dashboard', `완료 — ${totalSessions}개 세션, ${alarms.length}개 경보`);
    console.log(`✅ dashboard_data.json 생성 완료`);
    console.log(`   세션: ${totalSessions}개 | 경보: ${alarms.length}개 | 피드백 재발: ${feedbackRecurrences.length}개`);
}
if (require.main === module)
    main();
//# sourceMappingURL=compute-dashboard.js.map