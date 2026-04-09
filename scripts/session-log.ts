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

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readJson, writeJson, appendLog, nextId } from './lib/utils';

const SESSION_PATH = path.join(ROOT, 'memory', 'sessions', 'current_session.json');
const SESSION_INDEX_PATH = path.join(ROOT, 'memory', 'sessions', 'session_index.json');
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory', 'shared', 'topic_index.json');
const DECISION_LEDGER_PATH = path.join(ROOT, 'memory', 'shared', 'decision_ledger.json');
const FEEDBACK_LOG_PATH = path.join(ROOT, 'memory', 'master', 'master_feedback_log.json');

interface SessionRecord {
  sessionId: string;
  topicSlug: string;
  status: 'open' | 'closed';
  mode: string;
  startedAt: string;
  closedAt?: string;
  agentsCompleted: string[];
  gaps: string[];
}

interface SessionIndex {
  sessions: Array<{ sessionId: string; topicSlug: string; startedAt: string; closedAt?: string }>;
  lastUpdated: string;
}

function log(level: 'INFO' | 'WARN' | 'ERROR', context: string, message: string): void {
  appendLog(context, `[${level}] ${message}`);
  console.log(`[${new Date().toISOString()}] [${level}] [${context}] ${message}`);
}

function nextSessionId(index: SessionIndex): string {
  return nextId(index.sessions.map(s => ({ id: s.sessionId })), 'session_');
}

function startSession(topicSlug: string, mode = 'observation'): void {
  const index = readJson<SessionIndex>(SESSION_INDEX_PATH, { sessions: [], lastUpdated: '' });
  const sessionId = nextSessionId(index);
  const now = new Date().toISOString();
  const gaps: string[] = [];

  // OP-04: check if previous session was properly closed
  const last = index.sessions.length > 0 ? index.sessions[index.sessions.length - 1] : null;
  if (last && !last.closedAt) {
    const gapMsg = `gap: ${last.sessionId} (${last.topicSlug}) has no closedAt — session-log end was not run`;
    gaps.push(gapMsg);
    log('WARN', 'session-log', gapMsg);
    console.warn(`  ⚠ ${gapMsg}`);
    // Mark gap in session_index
    index.sessions = index.sessions.map(s =>
      s.sessionId === last.sessionId ? { ...s, gap: true } : s
    );
  }

  const session: SessionRecord = {
    sessionId,
    topicSlug,
    status: 'open',
    mode,
    startedAt: now,
    agentsCompleted: [],
    gaps,
  };

  writeJson(SESSION_PATH, session);

  index.sessions.push({ sessionId, topicSlug, startedAt: now });
  index.lastUpdated = now;
  writeJson(SESSION_INDEX_PATH, index);

  log('INFO', 'session-log', `START ${sessionId} | topic: ${topicSlug} | mode: ${mode}`);
  console.log(`\n✓ Session started: ${sessionId}`);
  console.log(`  topic: ${topicSlug} | mode: ${mode}`);
  console.log(`  current_session.json updated`);
}

interface CheckResult {
  item: string;
  pass: boolean;
  detail: string;
}

function runEndChecklist(session: SessionRecord): CheckResult[] {
  const results: CheckResult[] = [];

  // 1. Reports: cross-validate topic_index.json reportFiles vs actual disk files
  const reportPath = (session as any).reportPath as string | undefined;
  if (reportPath) {
    const fullReportPath = path.join(ROOT, reportPath);
    // Find topic entry in topic_index to get registered reportFiles
    const topicIdx = readJson<{ topics: any[] }>(TOPIC_INDEX_PATH, { topics: [] });
    const topicEntry = topicIdx.topics.find((t: any) =>
      t.reportPath === reportPath || t.path === reportPath
    );
    const registeredFiles: string[] = topicEntry?.reportFiles ?? [];

    if (!fs.existsSync(fullReportPath)) {
      results.push({ item: 'reports', pass: false, detail: `reportPath not found on disk: ${reportPath}` });
    } else if (registeredFiles.length === 0) {
      // No files registered — just check directory has something
      const onDisk = fs.readdirSync(fullReportPath).filter((f: string) => f.endsWith('.md'));
      results.push({ item: 'reports', pass: onDisk.length > 0, detail: `${onDisk.length} file(s) on disk, none registered in topic_index` });
    } else {
      // Cross-validate each registered file
      const missing = registeredFiles.filter(f => !fs.existsSync(path.join(fullReportPath, f)));
      if (missing.length === 0) {
        results.push({ item: 'reports', pass: true, detail: `all ${registeredFiles.length} registered file(s) present: ${registeredFiles.join(', ')}` });
      } else {
        results.push({
          item: 'reports',
          pass: false,
          detail: `MISSING ${missing.length}/${registeredFiles.length} file(s): ${missing.join(', ')} — create before committing`
        });
      }
    }
  } else {
    results.push({ item: 'reports', pass: false, detail: 'no reportPath in current_session.json' });
  }

  // 2. decision_ledger updated (if session has decisions)
  const decisions = (session as any).masterDecisions as string[] | undefined;
  if (decisions && decisions.length > 0) {
    const ledger = readJson<{ decisions: any[] }>(DECISION_LEDGER_PATH, { decisions: [] });
    const sessionDecisions = ledger.decisions.filter((d: any) => d.session === session.sessionId);
    results.push({
      item: 'decision_ledger',
      pass: sessionDecisions.length > 0,
      detail: sessionDecisions.length > 0
        ? `${sessionDecisions.length} decision(s) recorded for ${session.sessionId}`
        : `masterDecisions noted but none found in ledger for ${session.sessionId}`
    });
  } else {
    results.push({ item: 'decision_ledger', pass: true, detail: 'no decisions this session — skip' });
  }

  // 3. topic_index has the topic
  const topicIndex = readJson<{ topics: any[] }>(TOPIC_INDEX_PATH, { topics: [] });
  const topicEntry = topicIndex.topics.find((t: any) =>
    t.reportPath === reportPath || t.path === reportPath
  );
  results.push({
    item: 'topic_index',
    pass: !!topicEntry,
    detail: topicEntry ? `topic found: ${topicEntry.id} (${topicEntry.status})` : 'topic not found in topic_index.json'
  });

  // 4. current_session status (will be set to closed after this check)
  results.push({ item: 'current_session', pass: true, detail: 'will be set to closed' });

  // 5. master_feedback_log (advisory — check if feedback entries exist for this session)
  const feedbackLog = readJson<{ feedbackLog: any[] }>(FEEDBACK_LOG_PATH, { feedbackLog: [] });
  const sessionFeedback = feedbackLog.feedbackLog.filter((f: any) => f.session === session.sessionId);
  results.push({
    item: 'master_feedback',
    pass: true,
    detail: sessionFeedback.length > 0
      ? `${sessionFeedback.length} feedback entry(ies) recorded`
      : 'no feedback entries — OK if none given'
  });

  return results;
}

function endSession(topicSlug: string): void {
  const session = readJson<SessionRecord | null>(SESSION_PATH, null);
  const now = new Date().toISOString();

  if (!session) {
    log('WARN', 'session-log', `END called but no current session found. topicSlug: ${topicSlug}`);
    console.warn('⚠ No current session found in current_session.json');
    return;
  }

  if (session.topicSlug !== topicSlug) {
    log('WARN', 'session-log', `END topicSlug mismatch. expected: ${session.topicSlug}, got: ${topicSlug}`);
    console.warn(`⚠ Topic slug mismatch. Current session: ${session.topicSlug}`);
  }

  // H-01: Run end-of-session checklist before closing
  const checks = runEndChecklist(session);
  const passed = checks.filter(c => c.pass).length;
  const warned = checks.filter(c => !c.pass).length;

  console.log(`\n── Session End Checklist ──`);
  for (const c of checks) {
    const icon = c.pass ? '✓' : '⚠';
    console.log(`  ${icon} ${c.item}: ${c.detail}`);
    log(c.pass ? 'INFO' : 'WARN', 'checklist', `${c.item}: ${c.detail}`);
  }
  console.log(`  ── ${passed} passed, ${warned} warned ──\n`);

  if (warned > 0) {
    session.gaps = session.gaps || [];
    for (const c of checks.filter(c => !c.pass)) {
      session.gaps.push(`checklist-warn: ${c.item} — ${c.detail}`);
    }
  }

  session.status = 'closed';
  session.closedAt = now;
  writeJson(SESSION_PATH, session);

  // Update session index
  const index = readJson<SessionIndex>(SESSION_INDEX_PATH, { sessions: [], lastUpdated: '' });
  index.sessions = index.sessions.map(s =>
    s.sessionId === session.sessionId ? { ...s, closedAt: now } : s
  );
  index.lastUpdated = now;
  writeJson(SESSION_INDEX_PATH, index);

  const duration = session.startedAt
    ? `${Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)}m`
    : 'unknown';

  log('INFO', 'session-log', `END ${session.sessionId} | topic: ${topicSlug} | duration: ${duration}`);
  console.log(`\n✓ Session closed: ${session.sessionId}`);
  console.log(`  topic: ${topicSlug} | duration: ${duration}`);
  if (session.gaps && session.gaps.length > 0) {
    console.log(`  ⚠ Gaps recorded: ${session.gaps.join(', ')}`);
  }
  // OP-04: confirm session_index entry exists and has closedAt
  const verifyIndex = readJson<SessionIndex>(SESSION_INDEX_PATH, { sessions: [], lastUpdated: '' });
  const entry = verifyIndex.sessions.find(s => s.sessionId === session.sessionId);
  if (entry && entry.closedAt) {
    console.log(`  ✓ OP-04 check: session_index entry verified (closedAt: ${entry.closedAt})`);
    log('INFO', 'session-log', `OP-04 PASS: ${session.sessionId} confirmed in session_index with closedAt`);
  } else {
    console.warn(`  ✗ OP-04 check: session_index entry missing or no closedAt`);
    log('WARN', 'session-log', `OP-04 FAIL: ${session.sessionId} not found or missing closedAt in session_index`);
  }
}

function run(): void {
  const [action, topicSlug, ...rest] = process.argv.slice(2);

  if (!action || !topicSlug) {
    console.error('Usage:');
    console.error('  ts-node scripts/session-log.ts start <topicSlug> [mode]');
    console.error('  ts-node scripts/session-log.ts end   <topicSlug>');
    process.exit(1);
  }

  if (action === 'start') {
    startSession(topicSlug, rest[0] || 'observation');
  } else if (action === 'end') {
    endSession(topicSlug);
  } else {
    console.error(`Unknown action: ${action}. Must be "start" or "end".`);
    console.error('  ts-node scripts/session-log.ts start <topicSlug> [mode]');
    console.error('  ts-node scripts/session-log.ts end   <topicSlug>');
    process.exit(1);
  }
}

run();
