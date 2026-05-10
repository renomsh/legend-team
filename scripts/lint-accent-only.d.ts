export interface AccentHit {
    file: string;
    line: number;
    col: number;
    token: string;
    snippet: string;
}
export declare function lintAccentOnly(scanDir: string): {
    ok: boolean;
    hits: AccentHit[];
    scanned: number;
};
//# sourceMappingURL=lint-accent-only.d.ts.map