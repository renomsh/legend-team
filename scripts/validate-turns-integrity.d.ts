/**
 * validate-turns-integrity.ts
 * PD-020b P0 — turns[] 무결성 전수 검증 (session_047~059).
 *
 * 기존 validate-session-turns.ts 상위 집합:
 *  - RK-1: agentsCompleted ↔ turns[] 정합성 (순서 보존 + 중복 허용 배열 여부)
 *  - RK-2: smoke test — 깨진 fixture 2종(phase 오타, turnIdx 중복)으로 FAIL 확인
 *  - phase_catalog 엄격 검증, recallReason 검증
 *  - turnIdx 연속·중복 검사
 *
 * 사용:
 *   npx ts-node scripts/validate-turns-integrity.ts                 # 전수 실행 (session_047~059)
 *   npx ts-node scripts/validate-turns-integrity.ts --smoke         # smoke test만
 *   npx ts-node scripts/validate-turns-integrity.ts --report <out>  # 전수 + 리포트 md 생성
 */
interface IntegrityResult {
    sessionId: string;
    ok: boolean;
    errors: string[];
    warnings: string[];
    turnsCount: number;
    agentsCompletedCount: number;
    rolesFromTurns: string[];
    rolesFromAgents: string[];
}
export declare function validateIntegrity(sessionId: string, turnsRaw: unknown, agentsCompletedRaw: unknown, legacy: boolean, validPhases: string[]): IntegrityResult;
export {};
//# sourceMappingURL=validate-turns-integrity.d.ts.map