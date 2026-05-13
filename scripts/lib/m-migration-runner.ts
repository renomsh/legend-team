/**
 * m-migration-runner.ts — PD-079 / D-181 Phase 5
 *
 * closed mtopic을 공식 SOT(decision_ledger.json / pending_deferrals.json)로 승격.
 *
 * 기본 모드: silent-1 (Master UI 호출 0건, 사후 감사 로그만).
 *   - auto-dedupe → skip + log
 *   - preview     → silent-1에선 자동 통과 = new-d 처리
 *   - new-d       → mD를 공식 D로 변환, D-NNN 발급, atomicWriteJSON로 승격
 *
 * 2-phase commit: atomicWriteJSON (lib/atomic-write.ts)이 .staging→fsync→rename 보장.
 *
 * non-blocking: 단건 실패는 m_migration_log.json에 'failed' 기록, 다음 mtopic 진행.
 *
 * D4 정합: silent-1 분기에는 Master UI 호출 코드 부재 (구조적 차단).
 *          preview 모드(preview-2)는 P5 범위 외 → 호출 시 명시적 에러.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from './utils';
import { nextId } from './utils';
import { atomicWriteJSON } from './atomic-write';
import {
  scanClosedMTopics,
  buildPreview,
  loadOfficialLedger,
  loadOfficialPDs,
  type ClosedMTopic,
  type MigrationPreview,
} from './migration-preview';
import {
  appendMigrationLog,
  type MigrationLogEntry,
} from './m-migration-log';
import { mNamespacePaths } from './m-namespace-paths';
import type {
  DecisionLedgerEntry,
  DecisionLedger,
} from '../../src/types/index';
import type {
  MTopicIndex,
  MDecisionLedgerEntry,
  MPendingDeferralEntry,
  PendingDeferralEntry,
} from './m-types';

const SHARED = path.join(ROOT, 'memory', 'shared');
const OFFICIAL_LEDGER_PATH = path.join(SHARED, 'decision_ledger.json');
const OFFICIAL_PD_PATH = path.join(SHARED, 'pending_deferrals.json');

/** P5 staging 디렉토리 — atomic-write의 .staging 외 추가 보존소(검증·복구용). */
export const M_MIGRATE_STAGING_DIR = path.join(ROOT, 'staging', 'm_migrate');

export type MigrationMode = 'silent-1' | 'preview-2' | 'deferred-3';

export interface RunMigrationOptions {
  dryRun?: boolean;
  mode?: MigrationMode;
  filter?: (mt: ClosedMTopic) => boolean;
}

export interface RunMigrationResult {
  migrated: number;
  quarantined: number;
  skipped: number;
  errors: number;
  log: MigrationLogEntry[];
}

// ── helpers ──────────────────────────────────────────────────────────────────

function safeReadJson<T>(absPath: string): T | null {
  if (!fs.existsSync(absPath)) return null;
  try {
    const raw = fs.readFileSync(absPath, 'utf8').trim();
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function loadOfficialLedgerFile(): DecisionLedger {
  const data = safeReadJson<DecisionLedger>(OFFICIAL_LEDGER_PATH);
  if (!data || !Array.isArray(data.decisions)) {
    return { decisions: [] };
  }
  return data;
}

function loadOfficialPDFile(): {
  schema?: string;
  items: PendingDeferralEntry[];
  [k: string]: unknown;
} {
  const data = safeReadJson<{ items: PendingDeferralEntry[] }>(OFFICIAL_PD_PATH);
  if (!data || !Array.isArray(data.items)) return { items: [] };
  return data;
}

/** mD → 공식 DecisionLedgerEntry 변환. mD에 누락된 공식 필수 필드는 보수적 fallback. */
function convertMDToOfficial(
  m: MDecisionLedgerEntry,
  newId: string,
  sessionId: string,
  topicHint: string
): DecisionLedgerEntry {
  const meta = m as unknown as {
    decision?: string;
    session?: string;
    topic?: string;
    authority?: 'master' | 'team';
    status?: 'confirmed' | 'superseded' | 'rejected' | string;
    owningTopicId?: string | null;
    scopeCheck?: unknown;
    relatedTopics?: string[];
  };
  return {
    id: newId,
    date: m.date ?? new Date().toISOString().slice(0, 10),
    session: meta.session ?? sessionId,
    topic: meta.topic ?? topicHint,
    axis: m.axis ?? '',
    decision: meta.decision ?? (m as { summary?: string }).summary ?? '',
    authority: meta.authority ?? 'team',
    // 데이터 파일은 'active'/'deprecated' 등 비표준 사용 중 — 타입은 'confirmed'.
    // 마이그 시 보수적으로 'confirmed' 고정 (사후 정합화는 별도 토픽).
    status: (meta.status === 'superseded' || meta.status === 'rejected'
      ? meta.status
      : 'confirmed') as DecisionLedgerEntry['status'],
    owningTopicId: meta.owningTopicId ?? topicHint ?? null,
    scopeCheck: (meta.scopeCheck ?? 'legacy-ambiguous') as DecisionLedgerEntry['scopeCheck'],
    ...(meta.relatedTopics ? { relatedTopics: meta.relatedTopics } : {}),
  };
}

/** mtopic_index에서 해당 mtopic의 status='migrated' 마킹. */
function markMTopicMigrated(wid: string, mtopicId: string): void {
  const paths = mNamespacePaths(wid);
  const idx = safeReadJson<MTopicIndex>(paths.topicIndex);
  if (!idx || !Array.isArray(idx.topics)) return;
  let touched = false;
  for (const t of idx.topics) {
    if ((t as { mtopicId?: string }).mtopicId === mtopicId) {
      (t as { status?: string }).status = 'migrated';
      (t as { migratedAt?: string }).migratedAt = nowIso();
      touched = true;
    }
  }
  if (touched) {
    idx.lastUpdated = nowIso();
    atomicWriteJSON(paths.topicIndex, idx);
  }
}

/** 단일 mtopic 처리. 단건 실패는 throw 안 함(non-blocking). */
export function processMTopic(
  closed: ClosedMTopic,
  officialLedger: DecisionLedgerEntry[],
  officialPDs: PendingDeferralEntry[],
  mode: MigrationMode,
  dryRun: boolean,
  log: MigrationLogEntry[]
): { migrated: number; skipped: number; errors: number; quarantined: number } {
  const out = { migrated: 0, skipped: 0, errors: 0, quarantined: 0 };

  try {
    const preview: MigrationPreview = buildPreview(closed, officialLedger, officialPDs);

    // 현재 작업용 in-memory ledger 사본 (id 충돌 방지를 위해 새 ID는 점진 증가)
    const workingLedger: DecisionLedgerEntry[] = [...officialLedger];

    if (mode !== 'silent-1') {
      const entry: MigrationLogEntry = {
        timestamp: nowIso(),
        wid: closed.wid,
        mtopicId: closed.mtopicId,
        action: 'failed',
        error: `mode '${mode}' not implemented in P5 (silent-1 only)`,
      };
      log.push(entry);
      if (!dryRun) appendMigrationLog(entry);
      out.errors += 1;
      return out;
    }

    // ── Decisions ────────────────────────────────────────────────────────
    for (const item of preview.decisions) {
      const action = item.crossCheck.recommendedAction;

      if (action === 'auto-dedupe') {
        const matched = item.crossCheck.candidates[0]?.officialId ?? null;
        const entry: MigrationLogEntry = {
          timestamp: nowIso(),
          wid: closed.wid,
          mtopicId: closed.mtopicId,
          action: dryRun ? 'would-dedupe' : 'skipped',
          details: {
            kind: 'decision',
            mId: item.mEntry.mId,
            reason: 'auto-dedupe',
            matchedOfficialId: matched,
            score: item.crossCheck.candidates[0]?.score,
          },
        };
        log.push(entry);
        if (!dryRun) appendMigrationLog(entry);
        out.skipped += 1;
        continue;
      }

      // silent-1: preview / new-d 둘 다 new-d 처리 (자동 통과)
      const newId = nextId(workingLedger, 'D-');
      const officialEntry = convertMDToOfficial(
        item.mEntry,
        newId,
        `migrated:${closed.wid}`,
        closed.mtopicId
      );

      if (dryRun) {
        workingLedger.push(officialEntry); // 다음 ID 단조 증가 보장
        const entry: MigrationLogEntry = {
          timestamp: nowIso(),
          wid: closed.wid,
          mtopicId: closed.mtopicId,
          action: 'would-migrate',
          details: {
            kind: 'decision',
            mId: item.mEntry.mId,
            wouldAssignId: newId,
            recommendedAction: action,
          },
        };
        log.push(entry);
        out.migrated += 1;
      } else {
        // 공식 ledger 갱신 (atomic-write가 .staging→rename 보장)
        const ledgerFile = loadOfficialLedgerFile();
        ledgerFile.decisions.push(officialEntry);
        ledgerFile.lastUpdated = nowIso();
        atomicWriteJSON(OFFICIAL_LEDGER_PATH, ledgerFile);
        workingLedger.push(officialEntry);

        const entry: MigrationLogEntry = {
          timestamp: nowIso(),
          wid: closed.wid,
          mtopicId: closed.mtopicId,
          action: 'success',
          details: {
            kind: 'decision',
            mId: item.mEntry.mId,
            assignedId: newId,
            recommendedAction: action,
          },
        };
        log.push(entry);
        appendMigrationLog(entry);
        out.migrated += 1;
      }
    }

    // ── PDs: P5에서는 ID 매칭만 (P4 preview 결과 사용). 매칭 시 skip, 아니면 new로 추가. ──
    const workingPDs: PendingDeferralEntry[] = [...officialPDs];
    for (const item of preview.pendingDeferrals) {
      if (item.idMatches.length > 0) {
        const entry: MigrationLogEntry = {
          timestamp: nowIso(),
          wid: closed.wid,
          mtopicId: closed.mtopicId,
          action: dryRun ? 'would-skip' : 'skipped',
          details: {
            kind: 'pending_deferral',
            mpdId: item.mEntry.mpdId,
            reason: 'id-match',
            matchedIds: item.idMatches,
          },
        };
        log.push(entry);
        if (!dryRun) appendMigrationLog(entry);
        out.skipped += 1;
        continue;
      }

      const newPdId = nextId(workingPDs as Array<{ id: string }>, 'PD-');
      const officialPD: PendingDeferralEntry = {
        ...item.mEntry,
        id: newPdId,
      };
      // mpdId·worktreeId·fromMTopic 등 m_* 전용 필드 제거(보존은 로그에)
      delete (officialPD as { mpdId?: string }).mpdId;
      delete (officialPD as { worktreeId?: string }).worktreeId;
      delete (officialPD as { fromMTopic?: string }).fromMTopic;

      if (dryRun) {
        workingPDs.push(officialPD);
        const entry: MigrationLogEntry = {
          timestamp: nowIso(),
          wid: closed.wid,
          mtopicId: closed.mtopicId,
          action: 'would-migrate',
          details: {
            kind: 'pending_deferral',
            mpdId: item.mEntry.mpdId,
            wouldAssignId: newPdId,
          },
        };
        log.push(entry);
        out.migrated += 1;
      } else {
        const pdFile = loadOfficialPDFile();
        pdFile.items.push(officialPD);
        atomicWriteJSON(OFFICIAL_PD_PATH, pdFile);
        workingPDs.push(officialPD);

        const entry: MigrationLogEntry = {
          timestamp: nowIso(),
          wid: closed.wid,
          mtopicId: closed.mtopicId,
          action: 'success',
          details: {
            kind: 'pending_deferral',
            mpdId: item.mEntry.mpdId,
            assignedId: newPdId,
          },
        };
        log.push(entry);
        appendMigrationLog(entry);
        out.migrated += 1;
      }
    }

    // mtopic_index에 마이그 마킹 (dry-run 시 skip)
    if (!dryRun) {
      markMTopicMigrated(closed.wid, closed.mtopicId);
    }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    const entry: MigrationLogEntry = {
      timestamp: nowIso(),
      wid: closed.wid,
      mtopicId: closed.mtopicId,
      action: 'failed',
      error: err,
    };
    log.push(entry);
    if (!dryRun) {
      try {
        appendMigrationLog(entry);
      } catch {
        /* 로그 기록 실패 시에도 throw 안 함 — non-blocking */
      }
    }
    out.errors += 1;
  }

  return out;
}

export function runMigration(
  options: RunMigrationOptions = {}
): RunMigrationResult {
  const dryRun = options.dryRun ?? false;
  const mode: MigrationMode = options.mode ?? 'silent-1';

  // staging 디렉토리 보장 (보존소). dryRun이어도 생성은 무해.
  try {
    fs.mkdirSync(M_MIGRATE_STAGING_DIR, { recursive: true });
  } catch {
    /* ignore */
  }

  const closedAll = scanClosedMTopics();
  const closed = options.filter ? closedAll.filter(options.filter) : closedAll;

  const officialLedger = loadOfficialLedger();
  const officialPDs = loadOfficialPDs();

  const result: RunMigrationResult = {
    migrated: 0,
    quarantined: 0,
    skipped: 0,
    errors: 0,
    log: [],
  };

  for (const c of closed) {
    const r = processMTopic(c, officialLedger, officialPDs, mode, dryRun, result.log);
    result.migrated += r.migrated;
    result.skipped += r.skipped;
    result.errors += r.errors;
    result.quarantined += r.quarantined;
  }

  return result;
}

if (require.main === module) {
  const dry = !process.argv.includes('--apply');
  const r = runMigration({ dryRun: dry, mode: 'silent-1' });
  console.log(JSON.stringify(r, null, 2));
}
