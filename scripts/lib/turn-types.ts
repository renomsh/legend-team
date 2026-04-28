/**
 * turn-types.ts
 * D-048 (session_045) — agentsCompleted Turn[] 스키마 정의.
 * phase 값은 memory/shared/phase_catalog.json enum 참조.
 *
 * D-074 (session_093, topic_098): InvocationMode/subagentId 제거.
 * orchestrationMode: "manual"|"auto" 신설. (D-058 dispatcher 폐기 unwind)
 */

export type PhaseId =
  | 'framing'
  | 'speculative'
  | 'analysis'
  | 'synthesis'
  | 'reframe'
  | 'execution-plan'
  | 'compile'
  | 'implementation'
  | 'dispatch'
  | 'master-response'
  | 'relay'
  | 'role-speech'
  | 'master-gate-request'; // D-074: auto 모드 결정 박제 직전·Edi 호출 직전 Ace 확인 질의 Turn

export type OrchestrationMode = 'manual' | 'auto';

export type RecallReason =
  | 'post-intervention'
  | 'post-master'
  | 'phase-transition'
  | 'master-direct-nomination'
  | 'manual';

export const VALID_RECALL_REASONS: RecallReason[] = [
  'post-intervention', 'post-master', 'phase-transition', 'master-direct-nomination', 'manual',
];

export interface Turn {
  role: string;
  turnIdx: number;
  phase?: PhaseId;
  recallReason?: RecallReason;
  splitReason?: string;
  chars?: number;
  segments?: number;
  /** PD-052: Agent 툴 경유 마킹. post-tool-use-task.js가 'agent'로 박제. 없으면 legacy-unmarked. */
  source?: string;
}

/** role report frontmatter link 표준. */
export interface ReportLinkFrontmatter {
  /** turn.turnIdx와 동일 값. 정수. */
  turnId: number;
}

/** plannedSequence 개정 기록 */
export interface PlannedSequenceRevision {
  revisedAt: string;   // ISO 8601
  before: string[];
  after: string[];
  reason: string;
}

/** current_session.json 확장 필드 */
export interface CurrentSessionTurnFields {
  turns?: Turn[];
  plannedSequence?: string[];
  plannedSequenceRevisions?: PlannedSequenceRevision[];
  /** true이면 D-048 이전 세션 — turns 집계에서 배제 */
  legacy?: boolean;
  /** D-074: 오케스트레이션 모드. /auto=자동, /master=수동 복귀. 기본 manual. */
  orchestrationMode?: OrchestrationMode;
  orchestrationTransitions?: Array<{
    mode: OrchestrationMode;
    turnIdx: number;
    trigger: string; // "/auto" | "/master" | "natural-language"
    at: string;      // ISO 8601
  }>;
}

/** session_index.json 엔트리 확장 필드 */
export interface SessionIndexTurnFields {
  turns?: Turn[];
  plannedSequence?: string[];
  legacy?: boolean;
}
