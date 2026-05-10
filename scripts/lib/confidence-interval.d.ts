export interface CIResult {
    mean: number;
    std: number;
    n: number;
    ci95: [number, number] | null;
}
export declare function meanStdCI(values: number[]): CIResult;
//# sourceMappingURL=confidence-interval.d.ts.map