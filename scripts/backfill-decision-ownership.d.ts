/**
 * backfill-decision-ownership.ts
 * D-055 백필: decision_ledger.json 전 엔트리에 owningTopicId + scopeCheck 추가.
 *
 * 규칙:
 * - 이미 두 필드 모두 있으면 스킵
 * - owningTopicId: session_index.topicId 역매핑 → 실패 시 topicSlug 역매핑 → null
 * - scopeCheck: 'legacy-ambiguous' (백필 기본값)
 */
export {};
//# sourceMappingURL=backfill-decision-ownership.d.ts.map