/**
 * get-ledger-snapshot.ts
 * G1 — PD-059 close 토큰 절감 (topic_169, session_196, 2026-05-05)
 *
 * decision_ledger.json에서 /close 시 필요한 최소 결정만 필터링.
 * 전문(48K tokens) 대신 스냅샷(수 K tokens)만 LLM에 노출.
 *
 * 필터 규칙:
 *   1. 현 topicId와 관련된 결정 전체 (topic 또는 relatedDecisions 매칭)
 *   2. 최근 N건 (날짜 내림차순, 기본 30)
 *   3. 위 두 집합의 합집합 (중복 제거)
 *
 * CLI: npx ts-node scripts/get-ledger-snapshot.ts <topicId> [--limit=30]
 * 출력: JSON stdout — decisions 배열 + 메타 (총 건수, 필터 건수, 생략 건수)
 *
 * Escape hatch: 충돌 의심 시 decision_ledger.json 전문 직접 조회 가능.
 */
export {};
//# sourceMappingURL=get-ledger-snapshot.d.ts.map