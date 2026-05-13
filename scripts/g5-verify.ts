/**
 * g5-verify.ts — PD-079 / D-181 Phase 5 검증 게이트
 *
 * G5-1 ~ G5-8 일괄 실행 + 정리.
 * 공식 SOT 보호: G5-3 apply 케이스만 공식 SOT 변경 → finally 블록에서 git restore로 원복.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ROOT } from './lib/utils';
import { getWorktreeId } from './lib/m-worktree-id';
import { mNamespacePaths } from './lib/m-namespace-paths';
import { atomicWriteJSON } from './lib/atomic-write';
import {
  runMigration,
  processMTopic,
  M_MIGRATE_STAGING_DIR,
} from './lib/m-migration-runner';
import { loadOfficialLedger, loadOfficialPDs } from './lib/migration-preview';
import type { MigrationLogEntry } from './lib/m-migration-log';
import {
  MIGRATION_LOG_PATH,
  readMigrationLog,
} from './lib/m-migration-log';
import {
  SCHEMA_M_DECISION_LEDGER,
  SCHEMA_M_PENDING_DEFERRALS,
} from './lib/m-schema-validator';
import type {
  MDecisionLedger,
  MPendingDeferrals,
  MTopicIndex,
} from './lib/m-types';

const SHARED = path.join(ROOT, 'memory', 'shared');

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

function snapshot(absPath: string): string | null {
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
}

const wid = getWorktreeId();
const paths = mNamespacePaths(wid);
console.log(`wid=${wid}`);
console.log(`paths.topicIndex=${paths.topicIndex}`);
console.log(`paths.decisionLedger=${paths.decisionLedger}`);
console.log('---');

// 공식 SOT 사전 스냅샷 (드리프트 감시 + 복구용)
const officialPaths = [
  path.join(SHARED, 'decision_ledger.json'),
  path.join(SHARED, 'pending_deferrals.json'),
  path.join(SHARED, 'topic_index.json'),
];
const officialSnaps = officialPaths.map(snapshot);

// migration_log 사전 스냅샷 (검증 후 원복용)
const logSnap = snapshot(MIGRATION_LOG_PATH);

// 기존 m_* 파일 백업
const backups: Array<{ orig: string; backup: string }> = [];
for (const p of [paths.decisionLedger, paths.pendingDeferrals, paths.topicIndex]) {
  if (fs.existsSync(p)) {
    const b = p + '.g5bak';
    fs.renameSync(p, b);
    backups.push({ orig: p, backup: b });
    console.log(`backed up: ${path.basename(p)}`);
  }
}
if (fs.existsSync(paths.quarantineDir)) {
  const b = paths.quarantineDir + '.g5bak';
  if (fs.existsSync(b)) fs.rmSync(b, { recursive: true, force: true });
  fs.renameSync(paths.quarantineDir, b);
  backups.push({ orig: paths.quarantineDir, backup: b });
}

// ── 가짜 mtopic 준비 함수 ───────────────────────────────────────────────────
type SetupOpts = {
  decisionAxis: string;
  badLedger?: boolean;
};

function seedMTopic(mtopicId: string, opts: SetupOpts): void {
  // mtopic_index
  const idx: MTopicIndex = {
    schema: 'm_topic_index.v1',
    worktreeId: wid,
    topics: [
      {
        mtopicId,
        worktreeId: wid,
        // TopicIndexEntry 일부 필드 — 본 검증에 충분한 최소 셋
        id: mtopicId,
        title: 'g5 verify seed',
        status: 'closed',
        created: '2026-05-13',
        lastUpdated: '2026-05-13',
        description: 'seed',
        tags: ['g5'],
        closedAt: '2026-05-13T00:00:00Z',
      } as never,
    ],
    lastUpdated: new Date().toISOString(),
  };
  atomicWriteJSON(paths.topicIndex, idx);

  // m_decision_ledger
  if (opts.badLedger) {
    fs.mkdirSync(path.dirname(paths.decisionLedger), { recursive: true });
    fs.writeFileSync(paths.decisionLedger, '{ this is : broken json,,,', 'utf8');
  } else {
    const ledger: MDecisionLedger = {
      schema: SCHEMA_M_DECISION_LEDGER,
      worktreeId: wid,
      decisions: [
        {
          mId: 'mD-001',
          worktreeId: wid,
          date: '2026-05-13',
          axis: opts.decisionAxis,
          // 추가 m_decision 필드들
          mtopicId,
          summary: 'g5 seed decision',
          decision: 'g5 seed decision content',
        } as never,
      ],
      lastUpdated: new Date().toISOString(),
    };
    atomicWriteJSON(paths.decisionLedger, ledger);
  }

  // m_pending_deferrals (empty)
  const pdFile: MPendingDeferrals = {
    schema: SCHEMA_M_PENDING_DEFERRALS,
    worktreeId: wid,
    createdAt: new Date().toISOString(),
    items: [],
  };
  atomicWriteJSON(paths.pendingDeferrals, pdFile);
}

function cleanupMFiles(): void {
  for (const p of [paths.decisionLedger, paths.pendingDeferrals, paths.topicIndex]) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  if (fs.existsSync(paths.quarantineDir)) {
    fs.rmSync(paths.quarantineDir, { recursive: true, force: true });
  }
}

let appliedSOTChange = false;

try {
  // ── G5-1: dry-run preview only (변경 0) ────────────────────────────────
  seedMTopic('mtopic_g51_W' + wid.slice(0, 8), {
    decisionAxis: 'P5 검증용 신규 결정 - 매우 독특한 axis 텍스트 12345',
  });
  const r1 = runMigration({ dryRun: true, mode: 'silent-1' });
  const officialAfterG51 = officialPaths.map(snapshot);
  const driftedG51: string[] = [];
  officialPaths.forEach((p, i) => {
    if (officialSnaps[i] !== officialAfterG51[i]) driftedG51.push(path.basename(p));
  });
  const wouldMigrateCount = r1.log.filter((e) => e.action === 'would-migrate').length;
  const ok1 =
    r1.migrated === 1 &&
    wouldMigrateCount >= 1 &&
    driftedG51.length === 0;
  record(
    'G5-1',
    ok1,
    `migrated=${r1.migrated} would-migrate=${wouldMigrateCount} drift=${driftedG51.join(',') || 'none'}`
  );
  cleanupMFiles();

  // ── G5-2: non-blocking 예외 처리 ───────────────────────────────────────
  // processMTopic을 직접 2회 호출: ①throw 유발 ClosedMTopic ②정상 ClosedMTopic.
  // ①에서 try/catch 작동 → 'failed' log + non-throw. ②는 정상 'would-migrate'.
  const officialLedgerG52 = loadOfficialLedger();
  const officialPDsG52 = loadOfficialPDs();
  const logG52: MigrationLogEntry[] = [];

  // ① throw 유발: mDecisions에 axis getter throw 1건
  const throwingMD = {
    mId: 'mD-throw',
    worktreeId: wid,
    date: '2026-05-13',
    mtopicId: 'mtopic_throw',
    summary: 'throw seed',
    decision: 'x',
  } as Record<string, unknown>;
  Object.defineProperty(throwingMD, 'axis', {
    get() {
      throw new Error('G5-2 forced throw via axis getter');
    },
    enumerable: true,
  });

  const r2a = processMTopic(
    {
      wid,
      mtopicId: 'mtopic_throw',
      closedAt: '2026-05-13T00:00:00Z',
      mDecisions: [throwingMD as never],
      mPDs: [],
    },
    officialLedgerG52,
    officialPDsG52,
    'silent-1',
    true, // dryRun
    logG52
  );

  // ② 정상 ClosedMTopic — would-migrate 1
  const goodMD = {
    mId: 'mD-good',
    worktreeId: wid,
    date: '2026-05-13',
    mtopicId: 'mtopic_good',
    axis: 'G5-2 정상 케이스 unique axis abc 9988',
    summary: 'good seed',
    decision: 'good',
  };
  const r2b = processMTopic(
    {
      wid,
      mtopicId: 'mtopic_good',
      closedAt: '2026-05-13T00:00:00Z',
      mDecisions: [goodMD as never],
      mPDs: [],
    },
    officialLedgerG52,
    officialPDsG52,
    'silent-1',
    true, // dryRun
    logG52
  );

  const failedCount = logG52.filter((e) => e.action === 'failed').length;
  const goodHandled = logG52.some(
    (e) => e.mtopicId === 'mtopic_good' && e.action === 'would-migrate'
  );
  const totalErrors = r2a.errors + r2b.errors;
  const totalMigrated = r2a.migrated + r2b.migrated;
  const ok2 =
    failedCount >= 1 &&
    goodHandled &&
    totalErrors >= 1 &&
    totalMigrated >= 1;
  record(
    'G5-2',
    ok2,
    `failed=${failedCount} migrated=${totalMigrated} errors=${totalErrors} goodHandled=${goodHandled}`
  );
  cleanupMFiles();

  // ── G5-3: 2-phase commit 실증 (apply mode) ──────────────────────────────
  const g53Id = 'mtopic_g53_W' + wid.slice(0, 8);
  seedMTopic(g53Id, {
    decisionAxis: 'G5-3 apply 실증 unique sentinel xyz9876',
  });
  const officialLedgerBeforeG53 = snapshot(officialPaths[0]!);
  const r3 = runMigration({ dryRun: false, mode: 'silent-1' });
  appliedSOTChange = true;
  const officialLedgerAfterG53 = snapshot(officialPaths[0]!);
  const ledgerChanged = officialLedgerBeforeG53 !== officialLedgerAfterG53;
  const newLedger = JSON.parse(officialLedgerAfterG53 ?? '{}') as {
    decisions: Array<{ id: string; axis: string }>;
  };
  const seededD = newLedger.decisions.find((d) => d.axis?.includes('G5-3 apply 실증'));
  const idxAfter = JSON.parse(fs.readFileSync(paths.topicIndex, 'utf8')) as MTopicIndex;
  const targetMTopic = idxAfter.topics.find(
    (t) => (t as { mtopicId?: string }).mtopicId === g53Id
  );
  const migratedMarked = (targetMTopic as { status?: string })?.status === 'migrated';
  const ok3 =
    ledgerChanged === true &&
    !!seededD &&
    /^D-\d{3,}$/.test(seededD!.id) &&
    migratedMarked === true &&
    r3.migrated === 1;
  record(
    'G5-3',
    ok3,
    `ledgerChanged=${ledgerChanged} newId=${seededD?.id} migratedMarked=${migratedMarked} migrated=${r3.migrated}`
  );

  // 즉시 원복 (다음 게이트의 공식 SOT 사전 조건 회복)
  if (logSnap === null) {
    if (fs.existsSync(MIGRATION_LOG_PATH)) fs.unlinkSync(MIGRATION_LOG_PATH);
  } else {
    fs.writeFileSync(MIGRATION_LOG_PATH, logSnap, 'utf8');
  }
  officialPaths.forEach((p, i) => {
    const snap = officialSnaps[i];
    if (snap === null || snap === undefined) {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } else {
      fs.writeFileSync(p, snap as string, 'utf8');
    }
  });
  appliedSOTChange = false;
  cleanupMFiles();

  // ── G5-4: auto-dedupe (axis 매우 유사 ≥ 0.85) ─────────────────────────
  // 공식 ledger의 첫 번째 decision의 axis와 거의 동일한 axis로 mD 생성
  const officialLedgerParsed = JSON.parse(
    fs.readFileSync(officialPaths[0]!, 'utf8')
  ) as { decisions: Array<{ id: string; axis: string }> };
  const targetOfficial = officialLedgerParsed.decisions[0];
  if (!targetOfficial) {
    record('G5-4', false, '공식 ledger 비어있음 — 검증 불가');
  } else {
    const g54Id = 'mtopic_g54_W' + wid.slice(0, 8);
    seedMTopic(g54Id, {
      decisionAxis: targetOfficial.axis, // 완전 동일 → similarity = 1.0
    });
    const beforeBytes = snapshot(officialPaths[0]!);
    const r4 = runMigration({ dryRun: true, mode: 'silent-1' });
    const afterBytes = snapshot(officialPaths[0]!);
    const dedupeEntry = r4.log.find(
      (e) =>
        e.action === 'would-dedupe' &&
        (e.details as { kind?: string })?.kind === 'decision'
    );
    const matchedId =
      (dedupeEntry?.details as { matchedOfficialId?: string })?.matchedOfficialId ?? null;
    const ok4 =
      r4.skipped >= 1 &&
      beforeBytes === afterBytes &&
      matchedId === targetOfficial.id;
    record(
      'G5-4',
      ok4,
      `skipped=${r4.skipped} matchedId=${matchedId} expected=${targetOfficial.id} drift=${beforeBytes !== afterBytes}`
    );
    cleanupMFiles();
  }

  // ── G5-5: silent-1 자동 통과 (preview threshold 범위) ────────────────────
  // axis를 공식 D 중 하나와 0.2~0.85 사이 유사도로 → silent-1에선 'new-d' 처리.
  // 단순 보장: silent-1 모드에선 recommendedAction='preview'여도 새 D-NNN 발급.
  // 'preview-2' 모드 명시 호출 시 명시적 'failed' log 1건.
  const g55Id = 'mtopic_g55_W' + wid.slice(0, 8);
  // 매우 짧고 일반적인 단어 → 어떤 공식 D와도 유사도 낮을 가능성 — 그냥 new-d 분기 확인
  seedMTopic(g55Id, { decisionAxis: 'G5-5 silent pass test alpha' });
  const r5a = runMigration({ dryRun: true, mode: 'silent-1' });
  const silentMigrated = r5a.migrated >= 1;

  const r5b = runMigration({ dryRun: true, mode: 'preview-2' });
  const previewModeFailed = r5b.errors >= 1 && r5b.log.some((e) => e.action === 'failed');
  const ok5 = silentMigrated && previewModeFailed;
  record(
    'G5-5',
    ok5,
    `silent migrated=${r5a.migrated} preview-2 errors=${r5b.errors} failedLog=${previewModeFailed}`
  );
  cleanupMFiles();

  // ── G5-6: 사후 감사 로그 존재·유효 ───────────────────────────────────────
  // G5-3에서 apply 시 로그가 박혔다가 원복됐을 가능성 → 여기서 신규 dry-run으로 다시 append
  const g56Id = 'mtopic_g56_W' + wid.slice(0, 8);
  seedMTopic(g56Id, { decisionAxis: 'G5-6 log existence sentinel' });
  // dry-run이라 디스크 로그 변경 0 → apply 모드 1회 (그리고 다시 원복)
  const logBefore = snapshot(MIGRATION_LOG_PATH);
  runMigration({ dryRun: false, mode: 'silent-1' });
  appliedSOTChange = true;
  const logAfter = snapshot(MIGRATION_LOG_PATH);
  const logParsed = JSON.parse(logAfter ?? '{"entries":[]}') as {
    schema?: string;
    entries: Array<{ action: string }>;
  };
  const ok6 =
    logBefore !== logAfter &&
    logParsed.schema === 'm_migration_log.v1' &&
    Array.isArray(logParsed.entries) &&
    logParsed.entries.length >= 1;
  record(
    'G5-6',
    ok6,
    `logChanged=${logBefore !== logAfter} schema=${logParsed.schema} entries=${logParsed.entries.length}`
  );
  // 원복
  if (logSnap === null) {
    if (fs.existsSync(MIGRATION_LOG_PATH)) fs.unlinkSync(MIGRATION_LOG_PATH);
  } else {
    fs.writeFileSync(MIGRATION_LOG_PATH, logSnap, 'utf8');
  }
  officialPaths.forEach((p, i) => {
    const snap = officialSnaps[i];
    if (snap === null || snap === undefined) {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } else {
      fs.writeFileSync(p, snap as string, 'utf8');
    }
  });
  appliedSOTChange = false;
  cleanupMFiles();

  // ── G5-7: 공식 SOT 변경 0 (현재 시점) ─────────────────────────────────────
  const finalSnaps = officialPaths.map(snapshot);
  const drifted: string[] = [];
  officialPaths.forEach((p, i) => {
    if (officialSnaps[i] !== finalSnaps[i]) drifted.push(path.basename(p));
  });
  const ok7 = drifted.length === 0;
  record(
    'G5-7',
    ok7,
    ok7 ? '공식 SOT 3종 검증 종료 시점 사전과 바이트 동일' : `드리프트: ${drifted.join(', ')}`
  );

  // ── G5-8: .gitattributes m_migration_log.json merge=ours ──────────────────
  const gaPath = path.join(ROOT, '.gitattributes');
  const ga = fs.readFileSync(gaPath, 'utf8');
  const ok8 = /m_migration_log\.json\s+merge=ours/.test(ga);
  record('G5-8', ok8, ok8 ? '.gitattributes에 명시 줄 존재' : '.gitattributes 누락');
} finally {
  console.log('---');
  console.log('cleanup');
  cleanupMFiles();
  for (const b of backups) {
    if (fs.existsSync(b.backup)) {
      try {
        if (fs.existsSync(b.orig)) {
          if (fs.statSync(b.orig).isDirectory()) {
            fs.rmSync(b.orig, { recursive: true, force: true });
          } else {
            fs.unlinkSync(b.orig);
          }
        }
        fs.renameSync(b.backup, b.orig);
        console.log(`  restored ${path.basename(b.orig)}`);
      } catch (e) {
        console.log(`  restore failed ${path.basename(b.orig)}: ${e instanceof Error ? e.message : e}`);
      }
    }
  }
  // 만약 G5-3·G5-6에서 원복 못한 채 throw됐다면 git restore로 강제 복구
  if (appliedSOTChange) {
    try {
      execSync('git checkout HEAD -- memory/shared/decision_ledger.json memory/shared/pending_deferrals.json memory/shared/topic_index.json', {
        cwd: ROOT,
        stdio: 'pipe',
      });
      console.log('  git checkout fallback: 공식 SOT 3종 원복');
    } catch (e) {
      console.log(`  git checkout fallback 실패: ${e instanceof Error ? e.message : e}`);
    }
    if (logSnap === null) {
      if (fs.existsSync(MIGRATION_LOG_PATH)) fs.unlinkSync(MIGRATION_LOG_PATH);
    } else {
      fs.writeFileSync(MIGRATION_LOG_PATH, logSnap, 'utf8');
    }
  }
  // .staging 정리
  const stagingDir = path.join(SHARED, '.staging');
  if (fs.existsSync(stagingDir)) {
    try {
      const remaining = fs.readdirSync(stagingDir);
      if (remaining.length === 0) fs.rmdirSync(stagingDir);
    } catch {
      /* ignore */
    }
  }
  // staging/m_migrate 비어있으면 정리
  if (fs.existsSync(M_MIGRATE_STAGING_DIR)) {
    try {
      const remaining = fs.readdirSync(M_MIGRATE_STAGING_DIR);
      if (remaining.length === 0) {
        fs.rmdirSync(M_MIGRATE_STAGING_DIR);
        const parent = path.dirname(M_MIGRATE_STAGING_DIR);
        if (fs.existsSync(parent) && fs.readdirSync(parent).length === 0) {
          fs.rmdirSync(parent);
        }
      }
    } catch {
      /* ignore */
    }
  }
}

console.log('---');
const passCount = results.filter((r) => r.pass).length;
console.log(`SUMMARY: ${passCount}/${results.length} PASS`);
process.exit(passCount === results.length ? 0 : 1);
