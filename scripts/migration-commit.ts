/**
 * migration-commit.ts — PD-079 / D-181 Phase 6
 *
 * runMigration() 결과를 `migrate:` prefix 커밋으로 박제하고
 * m_migration_log.json의 최근 entry들에 commitSha back-fill.
 *
 * D-187 정합: main 브랜치에서는 호출 차단 (워크트리 전용).
 *
 * R-4 K-5 mitigation: commitSha를 로그에 기록 → Master `git show <sha>` 검증 경로.
 *
 * non-blocking: throw 안 함. 실패 시 {committed:false, reason} 반환.
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readJson } from './lib/utils';
import { atomicWriteJSON } from './lib/atomic-write';
import {
  MIGRATION_LOG_PATH,
  MIGRATION_LOG_SCHEMA,
  type MigrationLogFile,
  type MigrationLogEntry,
} from './lib/m-migration-log';
import type { RunMigrationResult } from './lib/m-migration-runner';

export interface MigrationCommitOptions {
  cwd?: string;
  /** 변경 0건이어도 커밋 강제. 기본 false. */
  allowEmpty?: boolean;
}

export interface MigrationCommitResult {
  committed: boolean;
  sha?: string;
  reason?: string;
}

interface MConfigFile {
  commit?: { prefix?: string };
}

const M_CONFIG_PATH = path.join(ROOT, 'memory', 'shared', 'm_config.json');
const OFFICIAL_LEDGER_REL = 'memory/shared/decision_ledger.json';
const OFFICIAL_PD_REL = 'memory/shared/pending_deferrals.json';
const M_LOG_REL = 'memory/shared/m_migration_log.json';

function gitCmd(cwd: string, args: string[]): { code: number; stdout: string; stderr: string } {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return {
    code: r.status ?? -1,
    stdout: (r.stdout ?? '').trim(),
    stderr: (r.stderr ?? '').trim(),
  };
}

function currentBranch(cwd: string): string {
  const r = gitCmd(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
  return r.code === 0 ? r.stdout : '';
}

function getCommitPrefix(): string {
  const cfg = readJson<MConfigFile>(M_CONFIG_PATH, {});
  return cfg.commit?.prefix ?? 'migrate: m* → SOT';
}

/**
 * 최근 entry N건에 commitSha back-fill.
 * N = result.migrated + result.skipped (이번 run에서 append된 entry 수)
 * 단순화: 마지막 N개의 entry 중 commitSha 미설정인 것만 채움.
 */
function backfillCommitSha(sha: string, addedCount: number): void {
  if (addedCount <= 0) return;
  if (!fs.existsSync(MIGRATION_LOG_PATH)) return;
  let logFile: MigrationLogFile;
  try {
    const raw = fs.readFileSync(MIGRATION_LOG_PATH, 'utf8').trim();
    if (!raw) return;
    logFile = JSON.parse(raw) as MigrationLogFile;
    if (!Array.isArray(logFile.entries)) return;
  } catch {
    return;
  }
  const entries = logFile.entries;
  const start = Math.max(0, entries.length - addedCount);
  let touched = false;
  for (let i = start; i < entries.length; i++) {
    const e = entries[i] as MigrationLogEntry;
    if (!e.commitSha) {
      e.commitSha = sha;
      touched = true;
    }
  }
  if (touched) {
    logFile.lastUpdated = new Date().toISOString();
    if (!logFile.schema) logFile.schema = MIGRATION_LOG_SCHEMA;
    atomicWriteJSON(MIGRATION_LOG_PATH, logFile);
  }
}

export function commitMigrationResult(
  result: RunMigrationResult,
  opts: MigrationCommitOptions = {}
): MigrationCommitResult {
  const cwd = opts.cwd ?? ROOT;

  // D-187 정합: main 브랜치 차단
  const branch = currentBranch(cwd);
  if (branch === 'main') {
    return { committed: false, reason: 'main-branch-blocked' };
  }

  // dry-run 또는 변경 0건이면 skip
  const writeCount = result.migrated + result.skipped;
  if (writeCount === 0 && !opts.allowEmpty) {
    return { committed: false, reason: 'no-change' };
  }

  // staging: 4종 경로만 화이트리스트 (Riki R-2 권고)
  const paths = [OFFICIAL_LEDGER_REL, OFFICIAL_PD_REL, M_LOG_REL];
  // m_topic_index_*.json — wid별 동적
  const sharedDir = path.join(cwd, 'memory', 'shared');
  if (fs.existsSync(sharedDir)) {
    for (const f of fs.readdirSync(sharedDir)) {
      if (/^m_topic_index_.+\.json$/.test(f)) {
        paths.push(`memory/shared/${f}`);
      }
    }
  }

  // 실제 변경 있는 경로만 add (porcelain check)
  const status = gitCmd(cwd, ['status', '--porcelain', ...paths]);
  if (status.code !== 0) {
    return { committed: false, reason: `git-status-failed: ${status.stderr}` };
  }
  if (!status.stdout && !opts.allowEmpty) {
    return { committed: false, reason: 'no-staged-change' };
  }

  // add
  const addRes = gitCmd(cwd, ['add', '--', ...paths]);
  if (addRes.code !== 0) {
    return { committed: false, reason: `git-add-failed: ${addRes.stderr}` };
  }

  // commit
  const prefix = getCommitPrefix();
  const msg = `${prefix} (migrated=${result.migrated}, skipped=${result.skipped}, errors=${result.errors})`;
  const commitRes = gitCmd(cwd, ['commit', '-m', msg]);
  if (commitRes.code !== 0) {
    // pre-commit hook 차단 또는 nothing-to-commit
    return { committed: false, reason: `git-commit-failed: ${commitRes.stderr || commitRes.stdout}` };
  }

  // SHA
  const shaRes = gitCmd(cwd, ['rev-parse', 'HEAD']);
  if (shaRes.code !== 0 || !shaRes.stdout) {
    return { committed: true, reason: 'committed-but-sha-unavailable' };
  }
  const sha = shaRes.stdout;

  // back-fill commitSha to recent log entries
  try {
    backfillCommitSha(sha, writeCount);
  } catch {
    // back-fill 실패는 commit 자체 결과에 영향 주지 않음
  }

  return { committed: true, sha };
}

if (require.main === module) {
  // CLI: stdin or empty result test
  const empty: RunMigrationResult = {
    migrated: 0,
    quarantined: 0,
    skipped: 0,
    errors: 0,
    log: [],
  };
  const r = commitMigrationResult(empty);
  console.log(JSON.stringify(r, null, 2));
}
