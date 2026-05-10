export declare function contrastRatio(fgHex: string, bgHex: string): number;
export declare function parseTokens(cssText: string): Record<string, string>;
interface RatioRow {
    fg: string;
    bg: string;
    fgHex: string;
    bgHex: string;
    ratio: number;
    min: number;
    pass: boolean;
    margin: number;
    alarm: boolean;
}
export declare function evaluate(tokens: Record<string, string>): {
    rows: RatioRow[];
    failures: RatioRow[];
    alarms: RatioRow[];
};
export {};
//# sourceMappingURL=lint-contrast.d.ts.map