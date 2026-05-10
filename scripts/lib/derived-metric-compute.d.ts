import type { DerivedComposition, Metric } from "./signature-metrics-types";
export interface DerivedInput {
    metricId: string;
    normalizedScore: number | null;
}
export interface DerivedResult {
    value: number | null;
    reason?: string;
}
export declare function computeDerived(composition: DerivedComposition, inputs: DerivedInput[], metricLookup: (id: string) => Metric | undefined): DerivedResult;
//# sourceMappingURL=derived-metric-compute.d.ts.map