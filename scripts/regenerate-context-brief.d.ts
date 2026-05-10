/**
 * regenerate-context-brief.ts
 * PD-020b P4 (session_061) — L3 context_brief.md regenerator.
 *
 * 역할: topics/{topicId}/session_contributions/*.md 전체를 읽어
 *       topics/{topicId}/context_brief.md 를 재생성.
 *
 * 특성:
 *  - 멱등: 동일 입력 재실행 → 동일 출력 (타임스탬프 제외)
 *  - hold=true 토픽도 재생성 수행 (읽기 시 필터링은 /open 로더 담당, R2 해소)
 *  - L2 파일 없으면 empty state context_brief 생성 (R1 해소)
 *  - sizeBytes > L3_SIZE_LIMIT_BYTES 시 경고 (throws 하지 않음 — Editor 압축은 별도)
 *
 * Usage (CLI):
 *   npx ts-node scripts/regenerate-context-brief.ts <topicId>
 *
 * Usage (programmatic):
 *   import { regenerateContextBrief } from './regenerate-context-brief';
 *   regenerateContextBrief('topic_063');
 */
export declare function contextBriefPath(topicId: string): string;
export declare function regenerateContextBrief(topicId: string): void;
export declare function main(args?: string[]): Promise<void>;
//# sourceMappingURL=regenerate-context-brief.d.ts.map