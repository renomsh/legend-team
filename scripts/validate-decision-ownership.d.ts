/**
 * validate-decision-ownership.ts
 * D-055 게이트 A 검증: decision_ledger의 owningTopicId + scopeCheck 무결성 확인.
 *
 * 검증 항목:
 * 1. 전 엔트리 owningTopicId 존재 (null 허용, undefined 불가)
 * 2. 전 엔트리 scopeCheck 존재 + 허용값
 * 3. owningTopicId가 non-null이면 topic_index에 실존
 * 4. cross-topic이면 relatedTopics 존재
 *
 * npx ts-node scripts/validate-decision-ownership.ts
 */
export {};
//# sourceMappingURL=validate-decision-ownership.d.ts.map