/**
 * migrate-topic-index.ts
 * 일회성 마이그레이션 + 재사용 가능한 정렬/정규화 유틸.
 * - closed → completed (status_catalog.aliases 기반)
 * - topics 배열을 id 내림차순(natural)으로 재정렬
 *
 * 사용:
 *   npx ts-node scripts/migrate-topic-index.ts
 */
interface StatusCatalog {
    statuses: Array<{
        id: string;
        terminal: boolean;
    }>;
    aliases: Record<string, string>;
    defaultStatus: string;
}
/** topic_NNN[suffix] → { num, suffix } */
export declare function parseTopicId(id: string): {
    num: number;
    suffix: string;
};
/** 내림차순(큰 num 먼저; 같은 num이면 suffix 긴 게 먼저 → 10a가 10 위). */
export declare function compareTopicDesc(a: string, b: string): number;
export declare function normalizeStatus(raw: string, catalog: StatusCatalog): string;
export {};
//# sourceMappingURL=migrate-topic-index.d.ts.map