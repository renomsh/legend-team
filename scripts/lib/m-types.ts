/**
 * m-types.ts — PD-079 / D-181 Phase 1
 *
 * m_* 네임스페이스 타입 정의. 공식 타입 extend.
 *   - MDecisionLedgerEntry  ← DecisionLedgerEntry + mId
 *   - MTopicIndexEntry      ← TopicIndexEntry + mtopicId, worktreeId
 *   - MPendingDeferral      ← PendingDeferral schema + mpdId
 *   - MQuarantineEntry      (신규)
 *
 * D-181 마이그레이션 의무: m_* → 공식 SOT 승격 시 본 타입을 공식 타입으로 변환.
 */

import type {
  DecisionLedgerEntry,
  TopicIndexEntry,
} from '../../src/types/index';

// ── Decision Ledger ─────────────────────────────────────────────────────────

export interface MDecisionLedgerEntry extends DecisionLedgerEntry {
  /** worktree-local 임시 ID. 형식: "mD-NNN" */
  mId: string;
  /** 본 결정이 생성된 worktree 식별자 */
  worktreeId: string;
}

export interface MDecisionLedger {
  schema: 'm_decision_ledger.v1';
  worktreeId: string;
  decisions: MDecisionLedgerEntry[];
  lastUpdated?: string;
}

// ── Topic Index ─────────────────────────────────────────────────────────────

export interface MTopicIndexEntry extends TopicIndexEntry {
  /** worktree-local 임시 topic ID. 형식: "mtopic_NNN_W{hash}" (R-1) */
  mtopicId: string;
  /** 본 토픽이 생성된 worktree 식별자 */
  worktreeId: string;
}

export interface MTopicIndex {
  schema: 'm_topic_index.v1';
  worktreeId: string;
  topics: MTopicIndexEntry[];
  lastUpdated: string;
}

// ── Pending Deferrals ───────────────────────────────────────────────────────

/** pending_deferrals.json items[] 엔트리 (실측 스키마) */
export interface PendingDeferralEntry {
  id: string;
  fromSession?: string;
  fromTopic?: string;
  createdAt?: string;
  title?: string;
  item?: string;
  status: 'pending' | 'resolved' | 'in-progress' | string;
  resolveCondition?: string;
  dependsOn?: string[];
  relatedDecisions?: string[];
  relatedTopic?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolveNote?: string;
  fallback?: string;
  blockers?: string[];
  [k: string]: unknown;
}

export interface MPendingDeferralEntry extends PendingDeferralEntry {
  /** worktree-local 임시 ID. 형식: "mPD-NNN" */
  mpdId: string;
  /** 본 PD가 생성된 worktree 식별자 */
  worktreeId: string;
}

export interface MPendingDeferrals {
  schema: 'm_pending_deferrals.v1';
  worktreeId: string;
  createdAt: string;
  items: MPendingDeferralEntry[];
}

// ── Quarantine ──────────────────────────────────────────────────────────────

export interface MQuarantineEntry {
  /** 격리 대상 원본 식별자 (mId / mtopicId / mpdId) */
  originalId: string;
  /** 원본 파일 종류 */
  originType: 'decision' | 'topic' | 'pending_deferral';
  /** 격리 시각 ISO */
  quarantinedAt: string;
  /** 격리 사유 (자동-1 silent 마이그 실패·정합성 위반 등) */
  reason: string;
  /** worktree id */
  worktreeId: string;
  /** 원본 페이로드 (전체 보존) */
  payload: unknown;
}
