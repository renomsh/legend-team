#!/usr/bin/env ts-node
/**
 * scaffold-role.ts — 8역할 페르소나 레이어 inject 100% 검증 (G3 게이트).
 *
 * buildPersonaLayer() 동작을 시뮬레이션:
 *   1. _common.md 존재 확인
 *   2. policies/role-{r}.md 존재 확인 (없으면 WARN — P3 완료 기준 필수)
 *   3. personas/role-{r}.md 존재 확인 (없으면 FAIL — PERSONA_INJECT_FAILED 발생 경로)
 *   4. 파일 존재 시 PERSONA_OVER_CAP 마커 없음 확인
 *
 * 종료 코드: 0=PASS, 1=FAIL
 */
export {};
//# sourceMappingURL=scaffold-role.d.ts.map