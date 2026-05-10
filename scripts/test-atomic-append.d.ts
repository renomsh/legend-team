/**
 * test-atomic-append.ts
 *
 * Empirical test for line-level atomicity of fs.appendFileSync on Windows NTFS
 * when multiple processes concurrently append to the same jsonl file.
 *
 * Master question (topic_176, session_205):
 *   Does Node.js `fs.appendFileSync` (which uses O_APPEND on POSIX, FILE_APPEND_DATA
 *   on Windows) guarantee line-level atomic on Windows NTFS for two distinct
 *   processes appending to the same .jsonl file simultaneously?
 *
 * Methodology:
 *   parent forks N workers; each worker appendFileSync's K JSON lines (with
 *   worker id and sequence number). After all exit, parent reads the file
 *   line-by-line, JSON.parses each, checks line count, sequence completeness,
 *   and per-worker monotonicity. Reports interleave count to confirm true
 *   concurrent execution.
 *
 *   Three line sizes: small (~100B), medium (~4KB), large (~16KB).
 *
 * CLI:
 *   npx ts-node scripts/test-atomic-append.ts --size small --workers 4 --lines 1000
 *   npx ts-node scripts/test-atomic-append.ts --all   (run full matrix 3 sizes x 3 trials)
 */
export type LineSize = "small" | "medium" | "large";
export interface TestOptions {
    size: LineSize;
    workers: number;
    lines: number;
    outDir?: string;
    trial?: number;
}
export interface TestResult {
    size: LineSize;
    workers: number;
    linesPerWorker: number;
    expectedLines: number;
    actualLines: number;
    jsonParseFails: number;
    corruptOrSplit: number;
    duplicates: number;
    missingPerWorker: Record<string, number>;
    outOfOrderPerWorker: Record<string, number>;
    interleavePoints: number;
    fileBytes: number;
    durationMs: number;
    filePath: string;
    verdict: "OK" | "FAIL";
    notes: string[];
}
export declare function runTest(opts: TestOptions): Promise<TestResult>;
//# sourceMappingURL=test-atomic-append.d.ts.map