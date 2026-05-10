/**
 * validate-session-turns.ts
 * D-048 Turn[] 구조 검증기.
 * current_session.json 또는 session_index.json 엔트리의 turns 배열을 검사한다.
 *
 * D-074 (session_093): dispatch_config 참조 제거, invocationMode/subagentId 검증 제거.
 *
 * 사용:
 *   npx ts-node scripts/validate-session-turns.ts                    # current_session 검사
 *   npx ts-node scripts/validate-session-turns.ts session_047        # 특정 세션 검사
 *   npx ts-node scripts/validate-session-turns.ts --all              # session_index 전체 검사
 *
 * 함수 export: validateTurns() — 다른 스크립트에서 programmatic 호출 가능
 */
export interface ValidationResult {
    sessionId: string;
    ok: boolean;
    errors: string[];
    warnings: string[];
    turnsCount: number;
}
export declare function validateTurns(sessionId: string, turns: unknown, legacy: boolean, validPhases?: string[]): ValidationResult;
//# sourceMappingURL=validate-session-turns.d.ts.map