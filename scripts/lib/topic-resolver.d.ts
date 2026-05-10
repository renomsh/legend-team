/**
 * lib/topic-resolver.ts — topic path resolution from topic_index.json
 */
export interface TopicPaths {
    controlPath: string;
    reportPath: string;
}
export declare function resolveTopicPaths(topicId: string): TopicPaths;
export declare function resolveControlPath(topicId: string): string;
//# sourceMappingURL=topic-resolver.d.ts.map