export interface RootBlockDump {
    file: string;
    active: boolean;
    rootBlocks: Array<{
        lineStart: number;
        lineEnd: number;
        rawLength: number;
        colorTokens: string[];
        layoutTokens: string[];
        baseTokens: string[];
        otherTokens: string[];
    }>;
}
export interface ScanSummary {
    scanRoot: string;
    scannedFiles: number;
    activeFiles: number;
    legacyFiles: number;
    perFileDumps: RootBlockDump[];
    summary: {
        pagesWithColorTokenDuplication: number;
        pagesWithLayoutTokenDuplication: number;
        totalRootBlocks: number;
        g1LintTargetPages: string[];
        pdDeferralLayoutPages: string[];
    };
}
/**
 * Extract :root{ ... } blocks that appear inside <style>...</style> regions.
 * Line numbers are 1-based.
 */
export declare function extractRootBlocks(content: string): Array<{
    lineStart: number;
    lineEnd: number;
    body: string;
}>;
export declare function scanInlineRoot(appDir: string): ScanSummary;
//# sourceMappingURL=scan-inline-root.d.ts.map