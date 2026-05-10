export declare const FIXTURES_DIR: string;
export interface RegressionResult {
    fixture: string;
    pass: boolean;
    diff?: string;
}
export declare function runRegression(fixturesDir?: string, update?: boolean): RegressionResult[];
//# sourceMappingURL=test-regression.d.ts.map