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
  | 'compile'
  | 'implementation'
  | 'dispatch'          // D-066 (session_090) — Ace가 역할 호출 계획만 밝힐 때
  | 'master-response'   // D-066 — Master 직접 지명에 대한 역할 응답
  | 'relay'             // D-066 — Ace가 서브 결과를 요약/전달 (Grade A/S 금지, F-005)
  | 'role-speech';      // D-066 — 역할 서브에이전트 일반 발언

/**
 * D-066 (session_090) — 역할 발언의 실제 생성 경로.
 * Grade A/S 세션에서 Block 리스트 역할은 inline-main 기록 시 finalize hook이 gaps에 박제.
 */
export type InvocationMode =
  | 'subagent'          // Task/Agent 툴로 독립 서브에이전트 호출 (subagentId required)
  | 'inline-main'       // Main이 페르소나 흉내 (Grade A/S 차단 대상, F-001)
  | 'inline-allowed'    // Grade B/C 또는 Ace(alwaysActive)
  | 'master-direct';    // Master 직접 지명 (phase: master-response와 페어)

export const VALID_INVOCATION_MODES: InvocationMode[] = [
  'subagent', 'inline-main', 'inline-allowed', 'master-direct',
];

export type RecallReason =
  | 'post-intervention'       // 다른 역할 개입 후 복귀 (조건 1)
  | 'post-master'             // Master 개입 후 재발언 (조건 2)
  | 'phase-transition'        // phase 전환으로 분리 (조건 3)
  | 'master-direct-nomination'// D-066 — Master 직접 호명
  | 'manual';                 // 수동 판정

export const VALID_RECALL_REASONS: RecallReason[] = [
  'post-intervention', 'post-master', 'phase-transition', 'master-direct-nomination', 'manual',
];

export interface Turn {
  role: string;
  /**
   * D-067 (session_091, topic_096) — canonical link key.
   * 모든 role report frontmatter는 동일 `turnId` 값으로 본 turn을 참조한다.
   * 본 필드(turnIdx)는 turns 배열 내 0-based 자동 부여, report frontmatter는 `turnId`로 동일 정수 매칭.
   * link 책임: PostToolUse(Task) hook이 자동 박제 (D-068), SessionEnd finalize hook이 cross-check (D-068).
   */
  turnIdx: number;
  phase?: PhaseId;
  /** D-066: invocationMode. Grade A/S 세션은 필수, 기존 세션(001~089)은 undefined 허용(legacy). */
  invocationMode?: InvocationMode;
  /**
   * D-067 (의미 강화) — invocationMode=subagent인 turn에서 **반드시** 박제되는 보조 식별자.
   * Agent 툴 반환 시 PostToolUse(Task) hook이 자동 추출하여 push (D-068).
   * 9 기준 #3 충족: invocationMode=subagent + subagentId 양자 박제.
   * legacy(legacy=true) 세션에선 undefined 허용 — 백필 금지(기준 #7).
   */
  subagentId?: string;
  recallReason?: RecallReason;
  splitReason?: string;
  chars?: number;
  segments?: number;
}

/**
 * D-067 (session_091, topic_096) — role report frontmatter link 표준.
 * 신규 세션의 모든 role report (.md) frontmatter는 `turnId` 필드를 의무 기록한다.
 * 기존 자유 텍스트 `parentInstanceId`는 폐기. `turnId`는 정수.
 *
 * - 9 기준 #5 (invocation record와 turnId/agentId link) 충족.
 * - SessionEnd finalize hook이 turn.turnIdx ↔ frontmatter.turnId cross-check (D-068).
 */
export interface ReportLinkFrontmatter {
  /** turn.turnIdx와 동일 값. 정수. */
  turnId: number;
  /** invocationMode=subagent인 경우 동시 박제 권장 (Turn.subagentId와 동일). */
  subagentId?: string;
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
