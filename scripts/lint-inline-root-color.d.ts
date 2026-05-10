export interface LintFailure {
    file: string;
    line: number;
    tokens: string[];
}
export declare function lintInlineRootColor(appDir: string): {
    ok: boolean;
    failures: LintFailure[];
    checkedFiles: number;
};
//# sourceMappingURL=lint-inline-root-color.d.ts.map