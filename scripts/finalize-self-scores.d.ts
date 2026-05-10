import type { TopicType } from "./lib/signature-metrics-types";
interface SessionInfo {
    sessionId: string;
    topicId: string;
    topicType: TopicType;
    turns: {
        role: string;
        phase?: string;
        selfScores?: Record<string, number | string>;
    }[];
}
interface FinalizeReport {
    sessionId: string;
    topicId: string;
    topicType: TopicType;
    recordsWritten: number;
    defaultsUsed: {
        role: string;
        metricId: string;
    }[];
    orphans: {
        role: string;
        key: string;
    }[];
    supersededChains: number;
    participationGaps: {
        role: string;
        metricId: string;
    }[];
    auditNonNullRate: number;
}
export declare function finalize(opts?: {
    transcript?: string;
    sessionInfo?: SessionInfo;
}): FinalizeReport;
export {};
//# sourceMappingURL=finalize-self-scores.d.ts.map