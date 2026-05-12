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

/**
 * D-183 / D-184 / PD-082 — Truth/Authority/Origin 3축 등급.
 * 핵심 단언(사실 주장·권고·결정)에 부착. 절차·질문·메타 발화는 면제.
 * 범위: t 1-5, a 0-4, o 1-5. 시범 운영 단계 (D-184 baseline 측정 대상).
 */
export interface TaoGrade {
  /** Truth: 1 추정 / 2 대화 맥락 / 3 문서·로그·파일 / 4 원문·라인·실행결과 / 5 독립 재현 */
  t: 1 | 2 | 3 | 4 | 5;
  /** Authority: 0 임시 / 1 1회성 / 2 반복·명시 / 3 Master 정책 / 4 박제됨 */
  a: 0 | 1 | 2 | 3 | 4;
  /** Origin: 1 출처 없음 / 2 Master 직접 / 3 현 세션 / 4 에이전트 산출물 / 5 로그·파일·ID 추적 */
  o: 1 | 2 | 3 | 4 | 5;
}

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
  /** PD-082 / D-183: T/A/O 3축 등급. optional — 부착 면제 발화 다수. */
  tao?: TaoGrade;
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

/**
 * PD-064 P3 (session_194, topic_167, 2026-05-05) — turnIdx → Turn lookup helper.
 *
 * **불변성 명문화**: `turnIdx`는 session 내 globally unique 식별자이며 array position과 무관.
 * D-048 Turn Push C1 분리/병합 4조건에 따라 array index와 turnIdx 일치는 우발적이다.
 *
 * 따라서 `turns[turnIdx]` 직접 접근은 fragile — 본 헬퍼 사용 의무.
 * 첫 매치만 반환. duplicate turnIdx 감지 시 console.warn (호출측 결정 영향 없음).
 *
 * @returns 매칭 Turn, 없으면 null.
 */
export function findTurnById(turns: Turn[] | undefined | null, turnIdx: number): Turn | null {
  if (!Array.isArray(turns) || turns.length === 0) return null;
  let first: Turn | null = null;
  let dupCount = 0;
  for (const t of turns) {
    if (t && t.turnIdx === turnIdx) {
      if (first === null) first = t;
      else dupCount++;
    }
  }
  if (dupCount > 0) {
    // eslint-disable-next-line no-console
    console.warn(`findTurnById: duplicate turnIdx=${turnIdx} 감지 (${dupCount + 1}건). 첫 매치 반환.`);
  }
  return first;
}
