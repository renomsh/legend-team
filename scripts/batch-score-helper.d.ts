import type { Metric, TopicType } from "./lib/signature-metrics-types";
interface CurrentSession {
    sessionId: string;
    topicId: string;
    topicType?: TopicType;
}
export interface RunOptions {
    sessionId: string;
    dryRun?: boolean;
}
export declare function loadCurrentSession(): CurrentSession;
export declare function filterRoleMetrics(role: string): Metric[];
export declare function runInteractive(opts: RunOptions): Promise<number>;
export {};
//# sourceMappingURL=batch-score-helper.d.ts.map