/**
 * turn-types.ts
 * D-048 (session_045) — agentsCompleted Turn[] 스키마 정의.
 * phase 값은 memory/shared/phase_catalog.json enum 참조.
 */

export type PhaseId =
  | 'framing'
  | 'speculative'
  | 'analysis'
  | 'synthesis'
  | 'reframe'
  | 'execution-plan'
  | 'compile';

export type RecallReason =
  | 'post-intervention'  // 다른 역할 개입 후 복귀 (조건 1)
  | 'post-master'        // Master 개입 후 재발언 (조건 2)
  | 'phase-transition'   // phase 전환으로 분리 (조건 3)
  | 'manual';            // 수동 판정

export interface Turn {
  role: string;
  turnIdx: number;
  phase?: PhaseId;
  recallReason?: RecallReason;
  splitReason?: string;
  chars?: number;
  segments?: number;
}

/** plannedSequence 개정 기록 */
export interface PlannedSequenceRevision {
  revisedAt: string;   // ISO 8601
  before: string[];
  after: string[];
  reason: string;
}

/** current_session.json 확장 필드 (Phase 1 추가분) */
export interface CurrentSessionTurnFields {
  /** Turn[] 기반 역할 발언 기록 (D-048). 구버전 string[] agentsCompleted는 legacy alias. */
  turns?: Turn[];
  /** 세션 시작 시 선언한 역할 순서 */
  plannedSequence?: string[];
  /** plannedSequence 개정 이력 */
  plannedSequenceRevisions?: PlannedSequenceRevision[];
  /** true이면 D-048 이전 세션 — turns 집계에서 배제 */
  legacy?: boolean;
}

/** session_index.json 엔트리 확장 필드 (Phase 1 추가분) */
export interface SessionIndexTurnFields {
  turns?: Turn[];
  plannedSequence?: string[];
  legacy?: boolean;
}
