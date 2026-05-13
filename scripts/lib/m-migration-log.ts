/**
 * m-migration-log.ts — PD-079 / D-181 Phase 5
 *
 * 사후 감사 로그(audit log). silent-1 자동 마이그레이션은 Master UI 호출이
 * 0건이므로(D2 + D4 정합) 본 로그가 유일한 사후 추적 경로.
 *
 * SOT: memory/shared/m_migration_log.json
 * .gitattributes에서 merge=ours 지정(병합 안전, D-187).
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from './utils';
import { atomicWriteJSON } from './atomic-write';

export const MIGRATION_LOG_SCHEMA = 'm_migration_log.v1';
export const MIGRATION_LOG_PATH = path.join(
  ROOT,
  'memory',
  'shared',
  'm_migration_log.json'
);

export type MigrationAction =
  | 'success'
  | 'quarantined'
  | 'skipped'
  | 'failed'
  | 'would-migrate'
  | 'would-skip'
  | 'would-dedupe';

export interface MigrationLogEntry {
  timestamp: string;
  wid: string;
  mtopicId: string;
  action: MigrationAction;
  details?: Record<string, unknown>;
  error?: string;
}

export interface MigrationLogFile {
  schema: typeof MIGRATION_LOG_SCHEMA;
  entries: MigrationLogEntry[];
  lastUpdated?: string;
}

function readLog(): MigrationLogFile {
  if (!fs.existsSync(MIGRATION_LOG_PATH)) {
    return { schema: MIGRATION_LOG_SCHEMA, entries: [] };
  }
  const raw = fs.readFileSync(MIGRATION_LOG_PATH, 'utf8').trim();
  if (!raw) return { schema: MIGRATION_LOG_SCHEMA, entries: [] };
  try {
    const parsed = JSON.parse(raw) as MigrationLogFile;
    if (!parsed.schema) parsed.schema = MIGRATION_LOG_SCHEMA;
    if (!Array.isArray(parsed.entries)) parsed.entries = [];
    return parsed;
  } catch {
    return { schema: MIGRATION_LOG_SCHEMA, entries: [] };
  }
}

export function appendMigrationLog(entry: MigrationLogEntry): void {
  const log = readLog();
  log.entries.push(entry);
  log.lastUpdated = new Date().toISOString();
  atomicWriteJSON(MIGRATION_LOG_PATH, log);
}

/** 테스트용 — 로그 파일 자체를 안전하게 읽어 반환. */
export function readMigrationLog(): MigrationLogFile {
  return readLog();
}

if (require.main === module) {
  console.log(JSON.stringify(readMigrationLog(), null, 2));
}
