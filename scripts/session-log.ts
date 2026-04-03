/**
 * session-log.ts  [M-02 로그 시스템]
 * Logs session start/end events to logs/app.log and updates
 * memory/sessions/current_session.json accordingly.
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

const ROOT = path.resolve(__dirname, '..');

const APP_LOG = path.join(ROOT, 'logs', 'app.log');
const SESSION_PATH = path.join(ROOT, 'memory', 'sessions', 'current_session.json');
const SESSION_INDEX_PATH = path.join(ROOT, 'memory', 'sessions', 'session_index.json');

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

function readJson<T>(absPath: string, fallback: T): T {
  if (!fs.existsSync(absPath)) return fallback;
  const raw = fs.readFileSync(absPath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function writeJson(absPath: string, content: unknown): void {
  fs.writeFileSync(absPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
}

function log(level: 'INFO' | 'WARN' | 'ERROR', context: string, message: string): void {
  const line = `[${new Date().toISOString()}] [${level}] [${context}] ${message}\n`;
  fs.appendFileSync(APP_LOG, line, 'utf8');
  console.log(line.trim());
}

function nextSessionId(index: SessionIndex): string {
  const nums = index.sessions
    .map(s => parseInt(s.sessionId.replace('session_', ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `session_${String(next).padStart(3, '0')}`;
}

function startSession(topicSlug: string, mode = 'observation'): void {
  const index = readJson<SessionIndex>(SESSION_INDEX_PATH, { sessions: [], lastUpdated: '' });
  const sessionId = nextSessionId(index);
  const now = new Date().toISOString();

  const session: SessionRecord = {
    sessionId,
    topicSlug,
    status: 'open',
    mode,
    startedAt: now,
    agentsCompleted: [],
    gaps: [],
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
    process.exit(1);
  }
}

run();
