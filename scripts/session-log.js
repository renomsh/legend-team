"use strict";
/**
 * session-log.ts  [M-02 로그 시스템 + H-01 체크리스트 검증]
 * Logs session start/end events to logs/app.log and updates
 * memory/sessions/current_session.json accordingly.
 *
 * On `end`: runs session-end checklist verification (CLAUDE.md protocol).
 * Reports pass/warn per item — does NOT block session closure (D-011: script-assisted).
 *
 * Usage:
 *   ts-node scripts/session-log.ts start <topicSlug> [mode]
 *   ts-node scripts/session-log.ts end   <topicSlug>
 *
 * Example:
 *   ts-node scripts/session-log.ts start 2026-04-03_legend-team-upgrade observation
 *   ts-node scripts/session-log.ts end   2026-04-03_legend-team-upgrade
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
const utils_1 = require("./lib/utils");
const SESSION_PATH = path.join(utils_1.ROOT, 'memory', 'sessions', 'current_session.json');
const SESSION_INDEX_PATH = path.join(utils_1.ROOT, 'memory', 'sessions', 'session_index.json');
const TOPIC_INDEX_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'topic_index.json');
const DECISION_LEDGER_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'decision_ledger.json');
const FEEDBACK_LOG_PATH = path.join(utils_1.ROOT, 'memory', 'master', 'master_feedback_log.json');
function log(level, context, message) {
    (0, utils_1.appendLog)(context, `[${level}] ${message}`);
    console.log(`[${new Date().toISOString()}] [${level}] [${context}] ${message}`);
}
function nextSessionId(index) {
    return (0, utils_1.nextId)(index.sessions.map(s => ({ id: s.sessionId })), 'session_');
}
function startSession(topicSlug, mode = 'observation') {
    const index = (0, utils_1.readJson)(SESSION_INDEX_PATH, { sessions: [], lastUpdated: '' });
    const sessionId = nextSessionId(index);
    const now = new Date().toISOString();
    const gaps = [];
    // OP-04: check if previous session was properly closed
    const last = index.sessions.length > 0 ? index.sessions[index.sessions.length - 1] : null;
    if (last && !last.closedAt) {
        const gapMsg = `gap: ${last.sessionId} (${last.topicSlug}) has no closedAt — session-log end was not run`;
        gaps.push(gapMsg);
        log('WARN', 'session-log', gapMsg);
        console.warn(`  ⚠ ${gapMsg}`);
        // Mark gap in session_index
        index.sessions = index.sessions.map(s => s.sessionId === last.sessionId ? { ...s, gap: true } : s);
    }
    const session = {
        sessionId,
        topicSlug,
        status: 'open',
        mode,
        startedAt: now,
        agentsCompleted: [],
        gaps,
    };
    (0, utils_1.writeJson)(SESSION_PATH, session);
    index.sessions.push({ sessionId, topicSlug, startedAt: now });
    index.lastUpdated = now;
    (0, utils_1.writeJson)(SESSION_INDEX_PATH, index);
    log('INFO', 'session-log', `START ${sessionId} | topic: ${topicSlug} | mode: ${mode}`);
    console.log(`\n✓ Session started: ${sessionId}`);
    console.log(`  topic: ${topicSlug} | mode: ${mode}`);
    console.log(`  current_session.json updated`);
}
function runEndChecklist(session) {
    const results = [];
    // 1. Reports: cross-validate topic_index.json reportFiles vs actual disk files
    const reportPath = session.reportPath;
    if (reportPath) {
        const fullReportPath = path.join(utils_1.ROOT, reportPath);
        // Find topic entry in topic_index to get registered reportFiles
        const topicIdx = (0, utils_1.readJson)(TOPIC_INDEX_PATH, { topics: [] });
        const topicEntry = topicIdx.topics.find((t) => t.reportPath === reportPath || t.path === reportPath);
        const registeredFiles = topicEntry?.reportFiles ?? [];
        if (!fs.existsSync(fullReportPath)) {
            results.push({ item: 'reports', pass: false, detail: `reportPath not found on disk: ${reportPath}` });
        }
        else if (registeredFiles.length === 0) {
            // No files registered — just check directory has something
            const onDisk = fs.readdirSync(fullReportPath).filter((f) => f.endsWith('.md'));
            results.push({ item: 'reports', pass: onDisk.length > 0, detail: `${onDisk.length} file(s) on disk, none registered in topic_index` });
        }
        else {
            // Cross-validate each registered file
            const missing = registeredFiles.filter(f => !fs.existsSync(path.join(fullReportPath, f)));
            if (missing.length === 0) {
                results.push({ item: 'reports', pass: true, detail: `all ${registeredFiles.length} registered file(s) present: ${registeredFiles.join(', ')}` });
            }
            else {
                results.push({
                    item: 'reports',
                    pass: false,
                    detail: `MISSING ${missing.length}/${registeredFiles.length} file(s): ${missing.join(', ')} — create before committing`
                });
            }
        }
    }
    else {
        results.push({ item: 'reports', pass: false, detail: 'no reportPath in current_session.json' });
    }
    // 2. decision_ledger updated (if session has decisions)
    const decisions = session.masterDecisions;
    if (decisions && decisions.length > 0) {
        const ledger = (0, utils_1.readJson)(DECISION_LEDGER_PATH, { decisions: [] });
        const sessionDecisions = ledger.decisions.filter((d) => d.session === session.sessionId);
        results.push({
            item: 'decision_ledger',
            pass: sessionDecisions.length > 0,
            detail: sessionDecisions.length > 0
                ? `${sessionDecisions.length} decision(s) recorded for ${session.sessionId}`
                : `masterDecisions noted but none found in ledger for ${session.sessionId}`
        });
    }
    else {
        results.push({ item: 'decision_ledger', pass: true, detail: 'no decisions this session — skip' });
    }
    // 3. topic_index has the topic
    const topicIndex = (0, utils_1.readJson)(TOPIC_INDEX_PATH, { topics: [] });
    const topicEntry = topicIndex.topics.find((t) => t.reportPath === reportPath || t.path === reportPath);
    results.push({
        item: 'topic_index',
        pass: !!topicEntry,
        detail: topicEntry ? `topic found: ${topicEntry.id} (${topicEntry.status})` : 'topic not found in topic_index.json'
    });
    // 4. current_session status (will be set to closed after this check)
    results.push({ item: 'current_session', pass: true, detail: 'will be set to closed' });
    // 5. master_feedback_log (advisory — check if feedback entries exist for this session)
    const feedbackLog = (0, utils_1.readJson)(FEEDBACK_LOG_PATH, { feedbackLog: [] });
    const sessionFeedback = feedbackLog.feedbackLog.filter((f) => f.session === session.sessionId);
    results.push({
        item: 'master_feedback',
        pass: true,
        detail: sessionFeedback.length > 0
            ? `${sessionFeedback.length} feedback entry(ies) recorded`
            : 'no feedback entries — OK if none given'
    });
    return results;
}
function endSession(topicSlug) {
    // D': 읽기 전용 감사관 — 검증 + 로그만 수행. 쓰기 없음. /close가 모든 쓰기를 선행 완료.
    const session = (0, utils_1.readJson)(SESSION_PATH, null);
    if (!session) {
        log('WARN', 'session-log', `END called but no current session found. topicSlug: ${topicSlug}`);
        console.warn('⚠ No current session found in current_session.json');
        process.exit(1);
    }
    if (session.topicSlug !== topicSlug) {
        log('WARN', 'session-log', `END topicSlug mismatch. expected: ${session.topicSlug}, got: ${topicSlug}`);
        console.warn(`⚠ Topic slug mismatch (got: ${topicSlug}, session value: ${session.topicSlug})`);
    }
    // H-01: 독립 감사 — /close와 별개로 디스크 실재 검증
    const checks = runEndChecklist(session);
    const criticalFails = checks.filter(c => !c.pass && c.item !== 'master_feedback');
    const passed = checks.filter(c => c.pass).length;
    const warned = checks.filter(c => !c.pass).length;
    console.log(`\n── Session End Audit (read-only) ──`);
    for (const c of checks) {
        const icon = c.pass ? '✓' : '✗';
        console.log(`  ${icon} ${c.item}: ${c.detail}`);
        log(c.pass ? 'INFO' : 'WARN', 'checklist', `${c.item}: ${c.detail}`);
    }
    console.log(`  ── ${passed} passed, ${warned} failed ──\n`);
    // B-01 fix: guard against negative duration
    let duration = 'unknown';
    if (session.startedAt) {
        const ms = Date.now() - new Date(session.startedAt).getTime();
        duration = ms >= 0 ? `${Math.round(ms / 60000)}m` : 'unknown (startedAt in future)';
    }
    log('INFO', 'session-log', `END ${session.sessionId} | topic: ${topicSlug} | duration: ${duration}`);
    console.log(`✓ Audit complete: ${session.sessionId} | duration: ${duration}`);
    // exit code 1 on critical failures — /close gates on this to record gaps
    if (criticalFails.length > 0) {
        console.error(`\n✗ Critical audit failures (${criticalFails.length}):`);
        for (const c of criticalFails) {
            console.error(`  - ${c.item}: ${c.detail}`);
        }
        process.exit(1);
    }
}
function run() {
    const [action, topicSlug, ...rest] = process.argv.slice(2);
    if (!action || !topicSlug) {
        console.error('Usage:');
        console.error('  ts-node scripts/session-log.ts start <topicSlug> [mode]');
        console.error('  ts-node scripts/session-log.ts end   <topicSlug>');
        process.exit(1);
    }
    if (action === 'start') {
        startSession(topicSlug, rest[0] || 'observation');
    }
    else if (action === 'end') {
        endSession(topicSlug);
    }
    else {
        console.error(`Unknown action: ${action}. Must be "start" or "end".`);
        console.error('  ts-node scripts/session-log.ts start <topicSlug> [mode]');
        console.error('  ts-node scripts/session-log.ts end   <topicSlug>');
        process.exit(1);
    }
}
run();
//# sourceMappingURL=session-log.js.map