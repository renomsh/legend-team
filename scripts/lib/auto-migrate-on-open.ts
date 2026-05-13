/**
 * auto-migrate-on-open.ts — PD-079 / D-181 Phase 6
 *
 * `/open` step 7-c에서 동기 호출되는 마이그레이션 entry point.
 *
 * 동작:
 *   1. closed mtopic scan (0건이면 early exit ~10ms)
 *   2. runMigration({mode:'silent-1', dryRun:false}) — P5 산출 호출
 *   3. commitMigrationResult() — `migrate:` prefix git commit
 *   4. KPI snapshot 박제 (m-kpi.ts)
 *
 * non-blocking: throw 안 함. 모든 에러 catch → error 필드로 격리.
 * timeout: m_config.json::autoMigrate.timeoutMs (기본 30s) — Promise.race
 *
 * Master 통제 정합 (Q1B): 본 함수는 lock 없이 진행.
 * 동시 /open 가능성은 Master 수동 조정으로 회피 — 충돌 시 Master가 즉시 처리.
 *
 * R-4 K-5 mitigation: commit SHA가 m_migration_log.json entry에 박제됨 (commitMigrationResult 내부).
 */

import * as path from 'path';
import { ROOT, readJson } from './utils';
import { scanClosedMTopics } from './migration-preview';
import { runMigration, type RunMigrationResult } from './m-migration-runner';
import { commitMigrationResult, type MigrationCommitResult } from '../migration-commit';

const M_CONFIG_PATH = path.join(ROOT, 'memory', 'shared', 'm_config.json');

interface MConfigAutoMigrate {
  autoMigrate?: { timeoutMs?: number };
}

export interface AutoMigrateResult {
  ran: boolean;
  summary?: RunMigrationResult;
  commit?: MigrationCommitResult;
  kpi?: { written: boolean; error?: string };
  error?: string;
  elapsedMs: number;
}

function getTimeoutMs(): number {
  const cfg = readJson<MConfigAutoMigrate>(M_CONFIG_PATH, {});
  return cfg.autoMigrate?.timeoutMs ?? 30000;
}

async function withTimeout<T>(p: Promise<T>, ms: number, tag: string): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout-${tag}-${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function autoMigrateOnOpen(
  opts: { dryRun?: boolean; timeoutMs?: number } = {}
): Promise<AutoMigrateResult> {
  const start = Date.now();
  const dryRun = opts.dryRun ?? false;
  const timeoutMs = opts.timeoutMs ?? getTimeoutMs();

  // Step 1: closed mtopic scan — early exit
  let closedCount = 0;
  try {
    const closed = scanClosedMTopics();
    closedCount = closed.length;
  } catch (e) {
    return {
      ran: false,
      error: `scan-failed: ${e instanceof Error ? e.message : String(e)}`,
      elapsedMs: Date.now() - start,
    };
  }

  if (closedCount === 0) {
    return { ran: false, elapsedMs: Date.now() - start };
  }

  // Step 2~3: runMigration + commit (timeout 캡)
  const work = (async (): Promise<AutoMigrateResult> => {
    let summary: RunMigrationResult;
    try {
      summary = runMigration({ mode: 'silent-1', dryRun });
    } catch (e) {
      return {
        ran: true,
        error: `runMigration-failed: ${e instanceof Error ? e.message : String(e)}`,
        elapsedMs: Date.now() - start,
      };
    }

    const out: AutoMigrateResult = {
      ran: true,
      summary,
      elapsedMs: Date.now() - start,
    };

    if (!dryRun) {
      try {
        out.commit = commitMigrationResult(summary);
      } catch (e) {
        out.commit = {
          committed: false,
          reason: `commit-threw: ${e instanceof Error ? e.message : String(e)}`,
        };
      }
    }

    // Step 4: KPI snapshot (best-effort)
    try {
      const { computeMKPIs, writeMKPISnapshot } = await import('./m-kpi');
      const snap = computeMKPIs();
      writeMKPISnapshot(snap);
      out.kpi = { written: true };
    } catch (e) {
      out.kpi = { written: false, error: e instanceof Error ? e.message : String(e) };
    }

    out.elapsedMs = Date.now() - start;
    return out;
  })();

  try {
    return await withTimeout(work, timeoutMs, 'auto-migrate');
  } catch (e) {
    return {
      ran: true,
      error: e instanceof Error ? e.message : String(e),
      elapsedMs: Date.now() - start,
    };
  }
}

if (require.main === module) {
  (async () => {
    const dry = !process.argv.includes('--apply');
    const r = await autoMigrateOnOpen({ dryRun: dry });
    console.log(JSON.stringify(r, null, 2));
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
