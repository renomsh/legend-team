import type { Scale, Polarity } from "./signature-metrics-types";
export interface NormalizeError {
    code: "E-004";
    message: string;
}
export declare function normalize(rawScore: number | string, scale: Scale): number;
export declare function applyPolarity(normalized: number, polarity: Polarity): number;
//# sourceMappingURL=metric-normalizer.d.ts.map