/**
 * run-debate.ts
 * @deprecated LEGACY — 삭제 예정 (D-011, session_005)
 *
 * 현재 운영 방식(D-002: Claude Code 직접 Write)과 구조적으로 불일치.
 * debate_log.json 기반 구조는 v0.1.0 이전 설계 흔적.
 * 실제 호출 이력 없음. 다음 세션에서 삭제 예정.
 *
 * Records an agent debate entry to a topic's debate_log.json.
 *
 * Usage:
 *   ts-node scripts/run-debate.ts <topicId> <agent> <phase> <filePath> [summary]
 */

import * as fs from 'fs';
import * as path from 'path';
import type { DebateEntry, AgentId } from '../src/types/index';

const ROOT = path.resolve(__dirname, '..');

const VALID_AGENTS: AgentId[] = ['ace', 'arki', 'fin', 'riki', 'editor', 'nova', 'master'];

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

function run(): void {
  const [topicId, agent, phase, filePath, ...rest] = process.argv.slice(2);
  const summary = rest.join(' ') || '';

  if (!topicId || !agent || !phase || !filePath) {
    console.error('Usage: ts-node scripts/run-debate.ts <topicId> <agent> <phase> <filePath> [summary]');
    process.exit(1);
  }

  if (!VALID_AGENTS.includes(agent as AgentId)) {
    console.error(`Invalid agent: ${agent}. Must be one of: ${VALID_AGENTS.join(', ')}`);
    process.exit(1);
  }

  // Locate the debate log — check both old topics/ path and new reports/ path
  const topicDir = path.join(ROOT, 'topics', topicId);
  const debateLogPath = path.join(topicDir, 'debate_log.json');

  interface DebateLog { topicId: string; entries: DebateEntry[] }
  const log = readJson<DebateLog>(debateLogPath, { topicId, entries: [] });

  // Determine next entry ID and revision
  const existing = log.entries.filter(e => e.agent === agent as AgentId);
  const revision = existing.length + 1;
  const entryId = `${topicId}_${agent}_${String(revision).padStart(2, '0')}`;
  const date = new Date().toISOString().slice(0, 10);

  // Mark any prior entries for same agent as superseded
  log.entries = log.entries.map(e =>
    e.agent === agent as AgentId && e.status === 'submitted'
      ? { ...e, status: 'superseded' as const }
      : e
  );

  const entry: DebateEntry = {
    id: entryId,
    topicId,
    agent: agent as AgentId,
    phase,
    revision,
    date,
    summary: summary || `${agent} output for phase: ${phase}`,
    filePath,
    status: 'submitted',
  };

  log.entries.push(entry);

  // Ensure directory exists
  if (!fs.existsSync(topicDir)) {
    fs.mkdirSync(topicDir, { recursive: true });
  }

  writeJson(debateLogPath, log);
  appendLog(`Recorded: ${entryId} → ${filePath}`);

  console.log(`✓ Debate entry recorded: ${entryId}`);
  console.log(`  topic: ${topicId} | agent: ${agent} | phase: ${phase} | rev: ${revision}`);
  console.log(`  file: ${filePath}`);
  console.log(`  log: topics/${topicId}/debate_log.json`);
}

run();
