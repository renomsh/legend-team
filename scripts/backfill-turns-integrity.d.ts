/**
 * backfill-turns-integrity.ts
 * PD-020b P0.3d — session_047~059의 turns[].phase + agentsCompleted 규칙 기반 재작성.
 *
 * 작업:
 *  - phase enum drift 정규화 (C1)
 *  - agentsCompleted = turns[].role 순서·중복 허용 배열로 재생성 (C2)
 *  - current_session.json도 해당 세션이 현재 열려 있으면 갱신 (여기선 스킵 — closed 대상)
 *
 * 사용:
 *   npx ts-node scripts/backfill-turns-integrity.ts --dry-run    # diff 출력만
 *   npx ts-node scripts/backfill-turns-integrity.ts --apply      # 실제 수정
 */
export {};
//# sourceMappingURL=backfill-turns-integrity.d.ts.map