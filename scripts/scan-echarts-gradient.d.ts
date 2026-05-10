export interface GradientViolation {
    file: string;
    line: number;
    column: number;
    context: 'LinearGradient' | 'RadialGradient' | 'setOption-color';
    literal: string;
    whitelisted: boolean;
}
export interface ScanResult {
    violations: GradientViolation[];
    scannedFiles: number;
    scriptBlocks: number;
}
export declare function scanEchartsGradient(appDir: string): ScanResult;
//# sourceMappingURL=scan-echarts-gradient.d.ts.map