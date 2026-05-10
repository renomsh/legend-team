/**
 * validate-schema-vs-data.ts
 * PD-020b P1.4 (GA-1) — TS 타입 정의 ↔ 실제 JSON 데이터 필드 diff 감시.
 *
 * 목적: session_058의 TopicIndexEntry 필드 누락(session_060 오픈 차단) 같은
 * type drift를 조기에 탐지. Write 지점과 타입 선언의 동기화 체크.
 *
 * 검사 대상:
 *  1. topic_index.json 각 엔트리 필드 ↔ TopicIndexEntry 인터페이스
 *  2. session_index.json 각 엔트리 turns[] ↔ Turn 인터페이스 (중복이지만 게이트용)
 *  3. current_session.json ↔ CurrentSessionTurnFields
 *
 * 사용:
 *   npx ts-node scripts/validate-schema-vs-data.ts
 */
export {};
//# sourceMappingURL=validate-schema-vs-data.d.ts.map