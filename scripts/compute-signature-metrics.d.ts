import { AlertLevel } from "./lib/alert-evaluator";
interface ViewAggregate {
    metricId: string;
    role: string;
    view: "all" | "recent10" | "recent3";
    mean: number | null;
    n: number;
    std: number;
    ci95: [number, number] | null;
    stratum?: {
        grade?: string;
    };
    alert?: {
        level: AlertLevel;
        reasons: string[];
    };
}
interface ComputeOutput {
    computedAt: string;
    registryVersion: string;
    durationMs: number;
    slaWarnMs: number;
    slaBreached: boolean;
    sourceJsonl: string;
    recordCount: number;
    metricCount: number;
    aggregates: ViewAggregate[];
    derivedAggregates: ViewAggregate[];
    warnings: string[];
}
interface CliOpts {
    fixture?: string;
    outPath?: string;
    registryPath?: string;
    slaWarnMs?: number;
}
export declare function compute(opts?: CliOpts): ComputeOutput;
export {};
//# sourceMappingURL=compute-signature-metrics.d.ts.map