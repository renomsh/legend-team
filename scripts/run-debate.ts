/**
 * @deprecated 삭제 예정 (OP-03, session_005)
 * package.json "debate" 스크립트에 참조가 남아 있어 _archived/ 이동 보류.
 * 참조 제거 후 다음 라운드에서 _archived/로 이동할 것.
 * 현재 active tool처럼 사용하지 말 것.
 *
 * run-debate.ts
 * Records a role debate entry to a topic's control-plane debate_log.json.
 * Resolves controlPath from topic_index.json; falls back to topics/{topicId}.
 *
 * Usage:
 *   ts-node scripts/run-debate.ts <topicId> <role> <phase> <filePath> [summary]
 *
 * Example:
 *   ts-node scripts/run-debate.ts topic_005 ace framing reports/2026-04-05_foo/ace_rev01.md "Framing complete"
 */

import * as fs from 'fs';
import * as path from 'path';
import type { DebateEntry, RoleId, TopicIndex } from '../src/types/index';

const ROOT = path.resolve(__dirname, '..');
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory/shared/topic_index.json');

const VALID_ROLES: RoleId[] = ['ace', 'arki', 'fin', 'riki', 'editor', 'nova', 'master'];

function readJson<T>(absPath: string, fallback: T): T {
  if (!fs.existsSync(absPath)) return fallback;
  const raw = fs.readFileSync(absPath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function writeJson(absPath: string, content: unknown): void {
  fs.writeFileSync(absPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
}

function appendLog(message: string): void {
  const logPath = path.join(ROOT, 'logs', 'app.log');
  const line = `[${new Date().toISOString()}] [run-debate] ${message}\n`;
  fs.appendFileSync(logPath, line, 'utf8');
}

/** Resolve the control-plane directory for a topic from topic_index, falling back to topics/{id} */
function resolveControlPath(topicId: string): string {
  const index = readJson<TopicIndex>(TOPIC_INDEX_PATH, { topics: [], lastUpdated: '' });
  const entry = index.topics.find(t => t.id === topicId);
  if (entry?.controlPath) return entry.controlPath;
  // Legacy fallback: topics/{topicId}
  return `topics/${topicId}`;
}

function run(): void {
  const [topicId, role, phase, filePath, ...rest] = process.argv.slice(2);
  const summary = rest.join(' ') || '';

  if (!topicId || !role || !phase || !filePath) {
    console.error('Usage: ts-node scripts/run-debate.ts <topicId> <role> <phase> <filePath> [summary]');
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role as RoleId)) {
    console.error(`Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  const controlPath = resolveControlPath(topicId);
  const topicDir = path.join(ROOT, controlPath);
  const debateLogPath = path.join(topicDir, 'debate_log.json');

  interface DebateLog { topicId: string; entries: DebateEntry[] }
  const log = readJson<DebateLog>(debateLogPath, { topicId, entries: [] });

  // Determine next entry ID and revision
  const existing = log.entries.filter(e => (e.role ?? e.agent) === role as RoleId);
  const revision = existing.length + 1;
  const entryId = `${topicId}_${role}_${String(revision).padStart(2, '0')}`;
  const date = new Date().toISOString().slice(0, 10);

  // Mark any prior entries for same role as superseded
  log.entries = log.entries.map(e =>
    (e.role ?? e.agent) === role as RoleId && e.status === 'submitted'
      ? { ...e, status: 'superseded' as const }
      : e
  );

  const entry: DebateEntry = {
    id: entryId,
    topicId,
    role: role as RoleId,
    phase,
    revision,
    date,
    summary: summary || `${role} output for phase: ${phase}`,
    filePath,
    status: 'submitted',
  };

  log.entries.push(entry);

  // Ensure control directory exists
  if (!fs.existsSync(topicDir)) {
    fs.mkdirSync(topicDir, { recursive: true });
  }

  writeJson(debateLogPath, log);
  appendLog(`Recorded: ${entryId} → ${filePath} (controlPath: ${controlPath})`);

  console.log(`✓ Debate entry recorded: ${entryId}`);
  console.log(`  topic: ${topicId} | role: ${role} | phase: ${phase} | rev: ${revision}`);
  console.log(`  file: ${filePath}`);
  console.log(`  log: ${controlPath}/debate_log.json`);
}

run();
