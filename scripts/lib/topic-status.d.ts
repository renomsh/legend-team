/**
 * topic-status.ts
 * D-F (D-104-s130 / topic_127 P4, 2026-04-28)
 *
 * topic_index.json(SOT) + topics/{topicId}/topic_meta.json(mirror) 동시 갱신 헬퍼.
 * SOT 갱신 실패 시 mirror 갱신 중단 — 부분 갱신으로 인한 표류 방지.
 *
 * D-B status enum 7종:
 *   open | framing | design-approved | implementing | completed | suspended | cancelled
 */
export type TopicStatus = 'open' | 'framing' | 'design-approved' | 'implementing' | 'completed' | 'suspended' | 'cancelled';
export type TopicPhase = 'framing' | 'design' | 'implementation' | 'validated';
export interface TopicStatusUpdate {
    status?: TopicStatus;
    phase?: TopicPhase;
    hold?: string | null;
}
export interface UpdateResult {
    sotUpdated: boolean;
    mirrorUpdated: boolean;
    warnings: string[];
}
/**
 * topic_index.json(SOT)와 topics/{topicId}/topic_meta.json(mirror)를 동시 갱신.
 *
 * @param root  프로젝트 루트 경로 (절대 경로)
 * @param topicId  e.g. "topic_127"
 * @param update  변경할 필드만 포함 (partial update)
 */
export declare function updateTopicStatus(root: string, topicId: string, update: TopicStatusUpdate): UpdateResult;
//# sourceMappingURL=topic-status.d.ts.map