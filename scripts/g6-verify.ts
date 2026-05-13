/**
 * g6-verify.ts — PD-079 / D-181 Phase 6 검증 게이트
 *
 * G6-Pre + G6-1 ~ G6-8 일괄 실행.
 * 공식 SOT 보호: 변경 0 (e2e는 g7-verify.ts).
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import { ROOT } from './lib/utils';
import { autoMigrateOnOpen } from './lib/auto-migrate-on-open';
import { commitMigrationResult } from './migration-commit';
import { computeMKPIs, M_KPI_SCHEMA } from './lib/m-kpi';
import { MIGRATION_LOG_SCHEMA } from './lib/m-migration-log';
import type { RunMigrationResult } from './lib/m-migration-runner';

interface GateResult {
  id: string;
  pass: boolean;
  detail: string;
}

const results: GateResult[] = [];
function record(id: string, pass: boolean, detail: string): void {
  results.push({ id, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}: ${detail}`);
}

const GITATTR_PATH = path.join(ROOT, '.gitattributes');
const OPEN_MD = path.join(ROOT, '.claude', 'commands', 'open.md');
const OPEN_MTOPIC_MD = path.join(ROOT, '.claude', 'commands', 'open-mtopic.md');
const OFFICIAL_LEDGER = path.join(ROOT, 'memory', 'shared', 'decision_ledger.json');
const OFFICIAL_TOPIC_INDEX = path.join(ROOT, 'memory', 'shared', 'topic_index.json');

async function main(): Promise<void> {
  // ── G6-Pre: .gitattributes 보강 ────────────────────────────────────────
  try {
    const ga = fs.readFileSync(GITATTR_PATH, 'utf8');
    const hasLog = /m_migration_log\.json\s+merge=ours/.test(ga);
    const hasKpi = /m_kpi\.json\s+merge=ours/.test(ga);
    record('G6-Pre', hasLog && hasKpi, `m_migration_log=${hasLog}, m_kpi=${hasKpi}`);
  } catch (e) {
    record('G6-Pre', false, `read-failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── G6-1: autoMigrateOnOpen 호출 가능 + early exit ─────────────────────
  try {
    const r = await autoMigrateOnOpen({ dryRun: true });
    const ok = typeof r.ran === 'boolean' && typeof r.elapsedMs === 'number';
    record(
      'G6-1',
      ok,
      `ran=${r.ran}, elapsedMs=${r.elapsedMs}${r.error ? `, error=${r.error}` : ''}`
    );
  } catch (e) {
    record('G6-1', false, `threw: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── G6-2: migration-commit empty result → no-change ─────────────────────
  try {
    const empty: RunMigrationResult = {
      migrated: 0,
      quarantined: 0,
      skipped: 0,
      errors: 0,
      log: [],
    };
    const r = commitMigrationResult(empty);
    const ok = r.committed === false && (r.reason === 'no-change' || r.reason === 'no-staged-change');
    record('G6-2', ok, `committed=${r.committed}, reason=${r.reason}`);
  } catch (e) {
    record('G6-2', false, `threw: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── G6-3: non-blocking — autoMigrateOnOpen never throws ─────────────────
  try {
    let threw = false;
    let result: { error?: string } = {};
    try {
      result = await autoMigrateOnOpen({ dryRun: true, timeoutMs: 5000 });
    } catch {
      threw = true;
    }
    record('G6-3', !threw, `threw=${threw}, error-field=${result.error ?? 'none'}`);
  } catch (e) {
    record('G6-3', false, `outer-threw: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── G6-4: 현재 브랜치 != main + main 가드 동작 확인 ──────────────────────
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    const notMain = branch !== 'main';
    // main이면 migration-commit이 'main-branch-blocked' 반환하는지 확인 불가 (현재 branch가 main이면)
    // 본 게이트는 워크트리 = non-main 확인만
    record('G6-4', notMain, `branch=${branch} (non-main 요구)`);
  } catch (e) {
    record('G6-4', false, `branch-read-failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── G6-5: KPI snapshot schema·type 검증 ─────────────────────────────────
  try {
    const snap = computeMKPIs();
    const ok =
      snap.schema === M_KPI_SCHEMA &&
      typeof snap.sampledAt === 'string' &&
      Number.isFinite(snap.orphanCount) &&
      Number.isFinite(snap.executionRate) &&
      Number.isFinite(snap.accuracyProxy);
    record(
      'G6-5',
      ok,
      `schema=${snap.schema}, orphan=${snap.orphanCount}, exec=${snap.executionRate}, acc=${snap.accuracyProxy}`
    );
  } catch (e) {
    record('G6-5', false, `compute-threw: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── G6-6: open-mtopic.md placeholder 제거 + step 7-c inject ────────────
  try {
    const mtopicMd = fs.readFileSync(OPEN_MTOPIC_MD, 'utf8');
    const noPlaceholder = !/Phase 5 마이그 hook 진입점/.test(mtopicMd);
    const openMd = fs.readFileSync(OPEN_MD, 'utf8');
    const has7c = /7-c.*m\* 자동 마이그/i.test(openMd);
    record('G6-6', noPlaceholder && has7c, `placeholder-removed=${noPlaceholder}, step7-c=${has7c}`);
  } catch (e) {
    record('G6-6', false, `read-failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── G6-7: 공식 SOT에 m* 흔적 0건 ────────────────────────────────────────
  try {
    const ledgerTxt = fs.readFileSync(OFFICIAL_LEDGER, 'utf8');
    const idxTxt = fs.readFileSync(OFFICIAL_TOPIC_INDEX, 'utf8');
    const mDleak = /\bmD-\d{3}/.test(ledgerTxt);
    const mTopicLeak = /\bmtopic_\d{3}_W[0-9a-f]+/.test(ledgerTxt) || /\bmtopic_\d{3}_W[0-9a-f]+/.test(idxTxt);
    const ok = !mDleak && !mTopicLeak;
    record('G6-7', ok, `mD-leak=${mDleak}, mtopic-leak=${mTopicLeak}`);
  } catch (e) {
    record('G6-7', false, `read-failed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── G6-8: 자가 원복 검증 — migrate: 커밋 없을 때도 git revert 명령 자체가 호출 가능한지 ────
  try {
    const r = spawnSync('git', ['log', '--all', '--grep=^migrate:', '-1', '--pretty=%H'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    const sha = (r.stdout ?? '').trim();
    if (!sha) {
      // 아직 migrate 커밋 없음 — G7 e2e에서 생성. 본 게이트는 검색 가능성만.
      record('G6-8', r.status === 0, `no-migrate-commit-yet (search-ok=${r.status === 0})`);
    } else {
      // dry: revert --no-commit 후 즉시 --abort로 검증
      const rev = spawnSync('git', ['revert', '--no-commit', sha], { cwd: ROOT, encoding: 'utf8' });
      spawnSync('git', ['revert', '--abort'], { cwd: ROOT, encoding: 'utf8' });
      record('G6-8', rev.status === 0, `revert-dry-ok=${rev.status === 0}, sha=${sha.slice(0, 7)}`);
    }
  } catch (e) {
    record('G6-8', false, `threw: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── summary ────────────────────────────────────────────────────────────
  const pass = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log('---');
  console.log(`G6 summary: ${pass}/${total} PASS`);
  if (pass !== total) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('g6-verify threw:', e);
  process.exit(1);
});
