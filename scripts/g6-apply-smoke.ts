/**
 * g6-apply-smoke.ts — PD-079 P6 apply 경로 실측 검증 (one-shot).
 *
 * Fixture: 1 closed mtopic + 1 mD → autoMigrateOnOpen apply →
 *   ① decision_ledger.json 신규 D-NNN 1건
 *   ② m_migration_log.json entry.commitSha 박제
 *   ③ m_kpi.json 디스크 쓰기
 *   ④ git log에 `migrate:` 커밋 존재
 * → git revert + m_* 원복.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import { ROOT } from './lib/utils';
import { getWorktreeId } from './lib/m-worktree-id';
import { mNamespacePaths } from './lib/m-namespace-paths';
import { atomicWriteJSON } from './lib/atomic-write';
import { appendMDecision } from './lib/m-decision-write';
import { autoMigrateOnOpen } from './lib/auto-migrate-on-open';
import { nextMTopicId } from './lib/m-id-generator';
import { MIGRATION_LOG_PATH, readMigrationLog } from './lib/m-migration-log';
import type { MTopicIndex } from './lib/m-types';

const KPI_PATH = path.join(ROOT, 'memory', 'shared', 'm_kpi.json');
const LEDGER_PATH = path.join(ROOT, 'memory', 'shared', 'decision_ledger.json');

function snap(p: string): string | null {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}
function restore(p: string, s: string | null): void {
  if (s === null) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } else fs.writeFileSync(p, s, 'utf8');
}

async function main(): Promise<void> {
  const wid = getWorktreeId();
  const paths = mNamespacePaths(wid);

  const snaps = {
    topicIndex: snap(paths.topicIndex),
    decisionLedger: snap(paths.decisionLedger),
    mLog: snap(MIGRATION_LOG_PATH),
    kpi: snap(KPI_PATH),
    officialLedger: snap(LEDGER_PATH),
  };

  let result: {
    migrated: number;
    commitSha: string | undefined;
    kpiWritten: boolean;
    ledgerAdded: boolean;
    error?: string;
  } = { migrated: 0, commitSha: undefined, kpiWritten: false, ledgerAdded: false };

  let mtopicId: string | null = null;

  try {
    // 1. fixture: closed mtopic
    mtopicId = nextMTopicId(wid);
    const idx: MTopicIndex = snaps.topicIndex
      ? (JSON.parse(snaps.topicIndex) as MTopicIndex)
      : {
          schema: 'm_topic_index.v1',
          worktreeId: wid,
          topics: [],
          lastUpdated: new Date().toISOString(),
        };
    idx.topics.unshift({
      id: mtopicId,
      mtopicId,
      worktreeId: wid,
      title: 'g6 apply smoke',
      topicSlug: 'g6-apply-smoke',
      grade: 'C',
      status: 'closed',
      created: new Date().toISOString().slice(0, 10),
      closedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    } as unknown as MTopicIndex['topics'][number]);
    idx.lastUpdated = new Date().toISOString();
    atomicWriteJSON(paths.topicIndex, idx);

    // 2. mD 박제 (apply 대상)
    const ap = appendMDecision(wid, {
      date: new Date().toISOString().slice(0, 10),
      mtopicId,
      axis: 'g6 apply smoke axis — unique-9c5f8a',
      summary: 'g6 apply smoke decision body — m_migration_runner apply path verification',
    });
    if (!ap.mId || ap.quarantined) throw new Error(`appendMDecision failed: ${JSON.stringify(ap)}`);

    const ledgerBefore = JSON.parse(snaps.officialLedger ?? '{"decisions":[]}').decisions.length;

    // 3. autoMigrateOnOpen apply
    const r = await autoMigrateOnOpen({ dryRun: false });
    if (r.error) result.error = r.error;
    result.migrated = r.summary?.migrated ?? 0;
    result.commitSha = r.commit?.sha;
    result.kpiWritten = r.kpi?.written ?? false;

    const ledgerAfter = JSON.parse(snap(LEDGER_PATH) ?? '{"decisions":[]}').decisions.length;
    result.ledgerAdded = ledgerAfter > ledgerBefore;

    console.log('apply result:', JSON.stringify(r, null, 2));
    console.log('---');
    console.log(`ledger before=${ledgerBefore}, after=${ledgerAfter}, added=${result.ledgerAdded}`);
    console.log(`commit sha=${result.commitSha ?? 'none'}`);
    console.log(`kpi written=${result.kpiWritten}`);

    // 4. m_migration_log entry.commitSha 검증
    const logFile = readMigrationLog();
    const lastEntry = logFile.entries[logFile.entries.length - 1];
    console.log(`last log entry commitSha=${lastEntry?.commitSha ?? 'MISSING'}`);

    // 5. migrate: 커밋 git log 확인
    const gl = spawnSync('git', ['log', '-1', '--pretty=%s'], { cwd: ROOT, encoding: 'utf8' });
    console.log(`last commit msg=${gl.stdout?.trim()}`);

    // ── 게이트 ───────────────────────────────────────────────────────────
    const pass =
      result.migrated >= 1 &&
      !!result.commitSha &&
      result.kpiWritten &&
      result.ledgerAdded &&
      lastEntry?.commitSha === result.commitSha &&
      /^migrate:/i.test(gl.stdout?.trim() ?? '');

    console.log('---');
    console.log(`apply-smoke ${pass ? 'PASS' : 'FAIL'}`);

    if (!pass) {
      throw new Error('apply-smoke assertions failed');
    }
  } finally {
    // ── cleanup: git reset --soft (migrate commit 해제, 다른 untracked/modified 보존) ──
    try {
      if (result.commitSha) {
        // 현재 HEAD가 migrate commit인지 확인
        const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
        if (head.stdout?.trim() === result.commitSha) {
          const reset = spawnSync('git', ['reset', '--soft', 'HEAD~1'], { cwd: ROOT, encoding: 'utf8' });
          console.log(`git reset --soft exit=${reset.status}`);
          // staged 4 경로 unstage
          spawnSync('git', ['reset', 'HEAD', '--',
            'memory/shared/decision_ledger.json',
            'memory/shared/pending_deferrals.json',
            'memory/shared/m_migration_log.json',
          ], { cwd: ROOT, encoding: 'utf8' });
        } else {
          console.error(`HEAD ${head.stdout?.trim()} != migrate sha ${result.commitSha}; skip reset`);
        }
      }
    } catch (e) {
      console.error('cleanup-reset failed:', e);
    }
    // 강제 원복: 스냅샷 복원 (m_* + 공식 ledger)
    restore(paths.topicIndex, snaps.topicIndex);
    restore(paths.decisionLedger, snaps.decisionLedger);
    restore(MIGRATION_LOG_PATH, snaps.mLog);
    restore(KPI_PATH, snaps.kpi);
    restore(LEDGER_PATH, snaps.officialLedger);
    console.log('cleanup: snapshots restored');
  }
}

main().catch((e) => {
  console.error('apply-smoke threw:', e);
  process.exit(1);
});
