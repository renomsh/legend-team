import type { ScoreRecord, Metric, TopicType, RecordSource } from "./signature-metrics-types";
export declare const PATHS: {
    jsonl: string;
    pending: string;
    quarantine: string;
    registry: string;
};
export interface RegistrySnapshot {
    registryVersion: string;
    metrics: Metric[];
}
export declare function loadRegistry(force?: boolean): RegistrySnapshot;
export declare function findMetric(metricId: string): Metric | undefined;
export interface ScoreInput {
    sessionId: string;
    topicId: string;
    topicType: TopicType;
    role: string;
    metricId: string;
    raterId: string;
    rawScore: number | string;
    recordedBy: string;
    recordSource: RecordSource;
    sessionPhase: string;
    confidence?: number;
    supersedes?: string;
    overrideReason?: string;
    extensions?: Record<string, unknown>;
}
export declare class OrphanMetricError extends Error {
    code: "E-002";
    constructor(metricId: string);
}
export declare class ExtensionsNamespaceError extends Error {
    code: "E-022";
    constructor(key: string);
}
export declare function buildRecord(input: ScoreInput): ScoreRecord;
export declare function appendScore(input: ScoreInput): ScoreRecord;
export interface PendingDeferred {
    recordId: string;
    sessionId: string;
    metricId: string;
    raterId: string;
    resolveCondition: string;
    queuedAt: string;
}
export declare function queueDeferred(item: Omit<PendingDeferred, "queuedAt">): void;
export declare function quarantine(reason: string, payload: unknown): string;
export declare function readScores(filterFn?: (r: ScoreRecord) => boolean): ScoreRecord[];
//# sourceMappingURL=self-scores-writer.d.ts.map