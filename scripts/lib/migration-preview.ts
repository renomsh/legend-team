/**
 * migration-preview.ts — PD-079 / D-181 Phase 4
 *
 * closed mtopic 스캔 + 마이그 미리보기 생성. **dry-run only** (변경 0).
 * P5에서 apply 단계 추가 예정.
 *
 * 공식 SOT는 read만. 본 모듈은 m_* + 공식 ledger·PD를 read하여
 * 각 mD/mPD에 cross-check 결과를 첨부한 preview 객체를 반환.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from './utils';
import type {
  MDecisionLedger,
  MDecisionLedgerEntry,
  MPendingDeferrals,
  MPendingDeferralEntry,
  MTopicIndex,
  MTopicIndexEntry,
} from './m-types';
import type {
  DecisionLedgerEntry,
  DecisionLedger,
} from '../../src/types/index';
import type { PendingDeferralEntry } from './m-types';
import { crossCheckMD, type CrossCheckResult } from './m-cross-check';
import { mNamespacePaths } from './m-namespace-paths';

const SHARED = path.join(ROOT, 'memory', 'shared');

export interface ClosedMTopic {
  wid: string;
  mtopicId: string;
  closedAt: string;
  mDecisions: MDecisionLedgerEntry[];
  mPDs: MPendingDeferralEntry[];
}

export interface MDecisionPreviewItem {
  mEntry: MDecisionLedgerEntry;
  crossCheck: CrossCheckResult;
}

export interface MPDPreviewItem {
  mEntry: MPendingDeferralEntry;
  // PD에 대한 dedupe는 P5에서 분리. 본 P4에서는 placeholder 후보만.
  idMatches: string[];
}

export interface MigrationPreview {
  wid: string;
  mtopicId: string;
  closedAt: string;
  decisions: MDecisionPreviewItem[];
  pendingDeferrals: MPDPreviewItem[];
  summary: {
    totalMD: number;
    totalMPD: number;
    autoDedupe: number;
    needsPreview: number;
    newD: number;
  };
}

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

/** fs.readdirSync로 closed mtopic 전수 스캔. */
export function scanClosedMTopics(): ClosedMTopic[] {
  if (!fs.existsSync(SHARED)) return [];
  const files = fs
    .readdirSync(SHARED)
    .filter((f) => /^m_topic_index_.+\.json$/.test(f))
    .map((f) => path.join(SHARED, f));
  const result: ClosedMTopic[] = [];

  for (const file of files) {
    const idx = safeReadJson<MTopicIndex>(file);
    if (!idx || !Array.isArray(idx.topics)) continue;
    const wid = idx.worktreeId;
    if (!wid) continue;

    const paths = mNamespacePaths(wid);
    const ledger = safeReadJson<MDecisionLedger>(paths.decisionLedger);
    const pds = safeReadJson<MPendingDeferrals>(paths.pendingDeferrals);

    const closedTopics = idx.topics.filter(
      (t: MTopicIndexEntry) => (t as { status?: string }).status === 'closed'
    );

    for (const topic of closedTopics) {
      const mDecisions = (ledger?.decisions ?? []).filter(
        (d) => (d as MDecisionLedgerEntry & { mtopicId?: string }).mtopicId === topic.mtopicId
      );
      const mPDs = (pds?.items ?? []).filter(
        (p) =>
          (p as MPendingDeferralEntry & { fromMTopic?: string }).fromMTopic ===
          topic.mtopicId
      );
      result.push({
        wid,
        mtopicId: topic.mtopicId,
        closedAt:
          (topic as { closedAt?: string }).closedAt ??
          (topic as { lastUpdated?: string }).lastUpdated ??
          '',
        mDecisions,
        mPDs,
      });
    }
  }
  return result;
}

/** preview 생성. 공식 SOT는 read만 (변경 0). */
export function buildPreview(
  closed: ClosedMTopic,
  officialLedger: DecisionLedgerEntry[],
  officialPDs: PendingDeferralEntry[]
): MigrationPreview {
  const decisions: MDecisionPreviewItem[] = closed.mDecisions.map((m) => ({
    mEntry: m,
    crossCheck: crossCheckMD(m, officialLedger),
  }));

  // PD: P4 범위는 ID 매칭만 (유사도 dedupe는 P5에서 별도 함수)
  const pendingDeferrals: MPDPreviewItem[] = closed.mPDs.map((m) => {
    const text = `${m.title ?? ''} ${m.item ?? ''}`;
    const ids = new Set<string>();
    for (const off of officialPDs) {
      if (typeof off?.id === 'string' && text.includes(off.id)) ids.add(off.id);
    }
    return { mEntry: m, idMatches: [...ids] };
  });

  const summary = {
    totalMD: decisions.length,
    totalMPD: pendingDeferrals.length,
    autoDedupe: decisions.filter(
      (d) => d.crossCheck.recommendedAction === 'auto-dedupe'
    ).length,
    needsPreview: decisions.filter(
      (d) => d.crossCheck.recommendedAction === 'preview'
    ).length,
    newD: decisions.filter((d) => d.crossCheck.recommendedAction === 'new-d')
      .length,
  };

  return {
    wid: closed.wid,
    mtopicId: closed.mtopicId,
    closedAt: closed.closedAt,
    decisions,
    pendingDeferrals,
    summary,
  };
}

/** 공식 SOT load helper. */
export function loadOfficialLedger(): DecisionLedgerEntry[] {
  const p = path.join(SHARED, 'decision_ledger.json');
  const data = safeReadJson<DecisionLedger>(p);
  return data?.decisions ?? [];
}

export function loadOfficialPDs(): PendingDeferralEntry[] {
  const p = path.join(SHARED, 'pending_deferrals.json');
  const data = safeReadJson<{ items: PendingDeferralEntry[] }>(p);
  return data?.items ?? [];
}
