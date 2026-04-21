/**
 * write-turn-log.ts
 * PD-020b P2 (session_061) — L1 turn_log.jsonl append writer.
 *
 * 역할: topics/{topicId}/turn_log.jsonl 에 TurnLogEntry 한 줄 append.
 * - D-048 C1: turn 발언 직후 append — 세션 종료 대기 없음.
 * - validates entry via validateTurnLogEntry before writing.
 * - creates directories and file if they don't exist.
 *
 * Usage (CLI):
 *   npx ts-node scripts/write-turn-log.ts <topicId> <jsonString>
 *
 * Usage (programmatic):
 *   import { appendTurnLogEntry } from './write-turn-log';
 *   appendTurnLogEntry('topic_064', { ts, topicId, sessionId, turnIdx, role, phase });
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, appendLog } from './lib/utils';
import { validateTurnLogEntry } from './lib/validate-context-layers';
import type { TurnLogEntry } from '../src/types/context-layers';

const TOPICS_DIR = path.join(ROOT, 'topics');

export function turnLogPath(topicId: string): string {
  return path.join(TOPICS_DIR, topicId, 'turn_log.jsonl');
}

/**
 * Append a single TurnLogEntry to topics/{topicId}/turn_log.jsonl.
 * Validates the entry before writing; throws ContextLayerError on invalid input.
 * Creates the topics/{topicId}/ directory if absent.
 */
export function appendTurnLogEntry(
  topicId: string,
  entry: Omit<TurnLogEntry, 'ts'> & { ts?: string },
): void {
  const normalized: TurnLogEntry = {
    ...entry,
    ts: entry.ts ?? new Date().toISOString(),
    topicId,
  };

  validateTurnLogEntry(normalized, { expectedTopicId: topicId });

  const topicDir = path.join(TOPICS_DIR, topicId);
  if (!fs.existsSync(topicDir)) {
    fs.mkdirSync(topicDir, { recursive: true });
  }

  const filePath = turnLogPath(topicId);
  const line = JSON.stringify(normalized) + '\n';
  fs.appendFileSync(filePath, line, 'utf8');
  appendLog('L1-writer', `append ok | ${topicId} | s=${normalized.sessionId} | turn=${normalized.turnIdx} | role=${normalized.role}`);
}

/**
 * Read all TurnLogEntry rows for a topic, optionally filtered by sessionId.
 * Returns entries in file order (chronological).
 */
export function readTurnLog(topicId: string, sessionId?: string): TurnLogEntry[] {
  const filePath = turnLogPath(topicId);
  if (!fs.existsSync(filePath)) return [];

  const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim() !== '');
  const entries = lines.map((line, idx) => {
    try {
      return JSON.parse(line) as TurnLogEntry;
    } catch {
      throw new Error(`turn_log.jsonl line ${idx + 1} parse error: ${line.slice(0, 80)}`);
    }
  });

  if (sessionId) {
    return entries.filter(e => e.sessionId === sessionId);
  }
  return entries;
}

// ── CLI entry point ──────────────────────────────────────────────────────────
if (require.main === module) {
  const [, , topicId, jsonArg] = process.argv;
  if (!topicId || !jsonArg) {
    console.error('Usage: ts-node write-turn-log.ts <topicId> <jsonString>');
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonArg);
  } catch {
    console.error('Error: jsonString is not valid JSON');
    process.exit(1);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    console.error('Error: entry must be a JSON object');
    process.exit(1);
  }

  try {
    appendTurnLogEntry(topicId, parsed as TurnLogEntry);
    console.log(`OK: appended to topics/${topicId}/turn_log.jsonl`);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
