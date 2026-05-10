/**
 * load-context-briefs.ts
 * PD-020b P6 (session_062) — /open 로더용 context_brief 자동 로드.
 *
 * 역할: system_state.json의 openTopics 중 hold=null인 항목의
 *       topics/{id}/context_brief.md를 읽어 요약 출력.
 *
 * 특성:
 *  - hold!=null 토픽은 스킵 (보류 중 토픽은 로드 불필요)
 *  - context_brief.md 미존재 시 해당 토픽 스킵 (조용히)
 *  - excludeId 옵션: 신규 생성 토픽 ID는 제외 (자기 자신 로드 방지)
 *
 * Usage (CLI):
 *   npx ts-node scripts/load-context-briefs.ts [--exclude <topicId>]
 *
 * Usage (programmatic):
 *   import { loadContextBriefs } from './load-context-briefs';
 *   const results = loadContextBriefs({ excludeId: 'topic_065' });
 */
interface TopicContextEntry {
    topicId: string;
    title: string;
    phase: string;
    hold: unknown;
    grade: string;
    nextAction: string;
    raw: string;
}
export interface LoadOptions {
    excludeId?: string | undefined;
}
export declare function loadContextBriefs(opts?: LoadOptions): TopicContextEntry[];
export {};
//# sourceMappingURL=load-context-briefs.d.ts.map