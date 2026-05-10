/**
 * turn-types.ts
 * D-048 (session_045) — agentsCompleted Turn[] 스키마 정의.
 * phase 값은 memory/shared/phase_catalog.json enum 참조.
 *
 * D-074 (session_093, topic_098): InvocationMode/subagentId 제거.
 * orchestrationMode: "manual"|"auto" 신설. (D-058 dispatcher 폐기 unwind)
 */
export type PhaseId = 'framing' | 'speculative' | 'analysis' | 'synthesis' | 'reframe' | 'execution-plan' | 'compile' | 'implementation' | 'dispatch' | 'master-response' | 'relay' | 'role-speech' | 'master-gate-request';
export type OrchestrationMode = 'manual' | 'auto';
export type RecallReason = 'post-intervention' | 'post-master' | 'phase-transition' | 'master-direct-nomination' | 'manual';
export declare const VALID_RECALL_REASONS: RecallReason[];
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
    revisedAt: string;
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
        trigger: string;
        at: string;
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
export declare function findTurnById(turns: Turn[] | undefined | null, turnIdx: number): Turn | null;
//# sourceMappingURL=turn-types.d.ts.map