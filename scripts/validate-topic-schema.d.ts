/**
 * validate-topic-schema.ts
 * D-052 topic_meta.json phase × hold 검증기.
 * topic_phase_catalog.json + hold_reasons_catalog.json 런타임 로드.
 *
 * 사용:
 *   npx ts-node scripts/validate-topic-schema.ts                        # topics/ 전체 검사
 *   npx ts-node scripts/validate-topic-schema.ts topic_058              # 특정 토픽 검사
 *   npx ts-node scripts/validate-topic-schema.ts --path topics/topic_058/topic_meta.json
 *
 * 함수 export: assertPhase(), assertHold(), validateTopicMeta()
 */
interface TopicPhaseCatalog {
    phases: string[];
    aliases: Record<string, string>;
    deprecated: string[];
}
interface HoldReasonsCatalog {
    reasons: string[];
    aliases: Record<string, string>;
    deprecated: string[];
}
interface HoldState {
    heldAt: string;
    heldAtPhase: string | null;
    reason: string;
    note?: string;
}
interface TopicMeta {
    id?: string;
    phase?: string | null;
    hold?: HoldState | null;
    legacy?: boolean;
    [key: string]: unknown;
}
export interface TopicValidationResult {
    topicId: string;
    ok: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * phase 값이 catalog에서 허용된 값인지 검사.
 * phases ∪ aliases.keys() ∪ deprecated 모두 허용 (D-052 spec).
 * null은 legacy 토픽 허용값.
 */
export declare function assertPhase(value: string | null | undefined, catalog?: TopicPhaseCatalog): void;
/**
 * hold 객체가 catalog 규칙을 준수하는지 검사.
 * null은 active 상태 허용값.
 */
export declare function assertHold(hold: HoldState | null | undefined, catalog?: HoldReasonsCatalog): void;
export declare function validateTopicMeta(topicId: string, meta: TopicMeta): TopicValidationResult;
export {};
//# sourceMappingURL=validate-topic-schema.d.ts.map