/**
 * nexus-turn-push.ts
 * D-169 / Arki rev4 §4 / session_209 P4
 *
 * Nexus(Main Claude) 직접 turns[] push 헬퍼.
 * turnPushMode = "nexus" 일 때 병렬 dispatch 완료 후 호출.
 *
 * 흐름:
 *   1. pending_turns_{sessionId}.jsonl에서 agentId 매칭 entry 조회
 *   2. __hook_origin 검증 (D1 sentinel)
 *   3. sort_key(dispatch_order) 기준 정렬
 *   4. current_session.json.turns[] 순차 push (단일 스레드 — race 없음)
 *   5. pending_turns 파일 archive 이동
 *
 * export:
 *   pushTurnsFromPending(dispatches, sessionPath?, cwd?)
 *   extractSelfScoresFromContent(content)  [옵션 B fallback]
 */
export interface DispatchRecord {
    role: string;
    dispatchOrder: number;
    agentId?: string | null;
    toolResult?: {
        content?: Array<{
            type: string;
            text: string;
        }>;
        agentId?: string | null;
        [key: string]: unknown;
    };
}
export interface PendingTurnEntry {
    ts: string;
    sessionId: string;
    agentId: string | null;
    role: string;
    selfScores?: Record<string, unknown>;
    __hook_origin: string;
}
export interface PushedTurn {
    role: string;
    turnIdx: number;
    source: 'agent';
    selfScores?: Record<string, unknown>;
    sort_key: number;
}
export interface PushResult {
    pushed: PushedTurn[];
    gaps: Array<{
        kind: string;
        role: string;
        detail: string;
    }>;
    pendingArchived: boolean;
}
export declare function extractSelfScoresFromContent(content: Array<{
    type: string;
    text: string;
}> | undefined): Record<string, unknown> | null;
/**
 * N개 병렬 dispatch 완료 후 Nexus가 호출.
 * dispatches는 dispatch 호출 시 준비한 배열 — toolResult는 완료 후 채워넣음.
 */
export declare function pushTurnsFromPending(dispatches: DispatchRecord[], sessionPath?: string, cwd?: string): Promise<PushResult>;
//# sourceMappingURL=nexus-turn-push.d.ts.map