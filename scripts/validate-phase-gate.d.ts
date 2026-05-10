/**
 * validate-phase-gate.ts
 * D-171 G-PRE 게이트 — topic_176 Case B Phase P0 진입 전 3조건 검증.
 *
 * 3건 모두 충족해야 exit 0. 1건 이상 fail 시 stderr + exit 1.
 *
 * 조건:
 *   (1) Arki rev4 spc_lck=Y — session_208 turns[] arki turnIdx=4 spc_lck=Y 확인
 *   (2) D-170-A1·A2 decision_ledger 박제 완료
 *   (3) PD-066 resolved OR current_session turnPushMode="hook" fallback 박제
 *
 * 사용:
 *   npx ts-node scripts/validate-phase-gate.ts
 *   npx ts-node scripts/validate-phase-gate.ts --json   # machine-readable output
 */
export {};
//# sourceMappingURL=validate-phase-gate.d.ts.map