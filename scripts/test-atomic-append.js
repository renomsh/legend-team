"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTest = runTest;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
// ---- Helpers ------------------------------------------------------------
function targetByteSize(size) {
    if (size === "small")
        return 100;
    if (size === "medium")
        return 4 * 1024;
    return 16 * 1024;
}
function makePadding(byteTarget, headerLen) {
    const need = Math.max(0, byteTarget - headerLen - 4); // 4 chars for "}\n" + commas
    // Use a benign printable ASCII char so byte length == char length
    return "x".repeat(need);
}
// ---- Worker mode --------------------------------------------------------
const WORKER_FLAG = "--__worker";
if (process.argv.includes(WORKER_FLAG)) {
    // Worker entry
    const args = parseArgs(process.argv.slice(2));
    const id = String(args.id);
    const lines = Number(args.lines);
    const size = args.size;
    const file = String(args.file);
    const startSignal = String(args.startSignal || "");
    // Wait for parent's start signal so all workers begin near-simultaneously
    if (startSignal) {
        const ms = Number(startSignal);
        const wait = Math.max(0, ms - Date.now());
        // busy-wait small windows are fine; for larger, setTimeout
        if (wait > 5) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            const t = setTimeout(() => { }, wait);
            // block until then
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, wait);
            clearTimeout(t);
        }
    }
    const target = targetByteSize(size);
    for (let seq = 0; seq < lines; seq++) {
        const header = `{"w":"${id}","seq":${seq},"pad":"`;
        const trailer = `"}\n`;
        const padLen = Math.max(1, target - header.length - trailer.length);
        const pad = "x".repeat(padLen);
        const line = header + pad + trailer;
        fs.appendFileSync(file, line);
    }
    // Notify parent
    if (process.send)
        process.send({ workerDone: id });
    process.exit(0);
}
function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a && a.startsWith("--")) {
            const key = a.slice(2);
            const next = argv[i + 1];
            if (!next || next.startsWith("--")) {
                out[key] = "true";
            }
            else {
                out[key] = next;
                i++;
            }
        }
    }
    return out;
}
// ---- Parent / runner ----------------------------------------------------
async function runTest(opts) {
    const outDir = opts.outDir ?? path.join(process.cwd(), "tmp", "atomic-test");
    fs.mkdirSync(outDir, { recursive: true });
    const trialTag = opts.trial != null ? `-t${opts.trial}` : "";
    const file = path.join(outDir, `append-${opts.size}-w${opts.workers}-l${opts.lines}${trialTag}-${Date.now()}.jsonl`);
    // Fresh file
    fs.writeFileSync(file, "");
    const startAt = Date.now() + 200; // give all workers ~200ms to spin up
    const workers = [];
    const doneIds = [];
    const t0 = Date.now();
    await new Promise((resolve, reject) => {
        let exitedCount = 0;
        let errored = false;
        for (let i = 0; i < opts.workers; i++) {
            const id = String.fromCharCode(65 + i); // A, B, C, ...
            const child = (0, child_process_1.fork)(__filename, [
                WORKER_FLAG,
                "--id", id,
                "--lines", String(opts.lines),
                "--size", opts.size,
                "--file", file,
                "--startSignal", String(startAt),
            ], {
                stdio: ["ignore", "pipe", "pipe", "ipc"],
                execArgv: process.execArgv,
            });
            child.on("message", (msg) => {
                if (msg && msg.workerDone)
                    doneIds.push(String(msg.workerDone));
            });
            child.on("exit", (code) => {
                exitedCount++;
                if (code !== 0 && !errored) {
                    errored = true;
                    reject(new Error(`worker ${i} exit code ${code}`));
                    return;
                }
                if (exitedCount === opts.workers && !errored)
                    resolve();
            });
            child.stderr?.on("data", (d) => {
                // surface worker errors
                process.stderr.write(`[w] ${d}`);
            });
            workers.push(child);
        }
    });
    const durationMs = Date.now() - t0;
    // ---- Verify --------------------------------------------------------
    const buf = fs.readFileSync(file, "utf8");
    const fileBytes = Buffer.byteLength(buf, "utf8");
    // split on \n; last entry may be empty
    const parts = buf.split("\n");
    const rawLines = parts[parts.length - 1] === "" ? parts.slice(0, -1) : parts;
    const expectedLines = opts.workers * opts.lines;
    let jsonParseFails = 0;
    let corruptOrSplit = 0;
    const seenPerWorker = {};
    const lastSeqPerWorker = {};
    const outOfOrderPerWorker = {};
    let duplicates = 0;
    const order = []; // worker id sequence as parsed
    const notes = [];
    for (let i = 0; i < opts.workers; i++) {
        const id = String.fromCharCode(65 + i);
        seenPerWorker[id] = new Set();
        lastSeqPerWorker[id] = -1;
        outOfOrderPerWorker[id] = 0;
    }
    for (const ln of rawLines) {
        let parsed;
        try {
            parsed = JSON.parse(ln);
        }
        catch {
            jsonParseFails++;
            // Heuristic for line-internal corruption: detect mid-line worker tag flip
            // e.g. "...x"w":"B"..." would mean another worker's bytes inserted
            if (/"w":"[A-Z]"[\s\S]*"w":"[A-Z]"/.test(ln)) {
                corruptOrSplit++;
            }
            continue;
        }
        const w = parsed.w;
        const seq = parsed.seq;
        if (typeof w !== "string" || typeof seq !== "number") {
            jsonParseFails++;
            continue;
        }
        const set = seenPerWorker[w];
        if (!set) {
            notes.push(`unexpected worker id "${w}" in output`);
            continue;
        }
        if (set.has(seq))
            duplicates++;
        set.add(seq);
        const last = lastSeqPerWorker[w];
        if (last !== undefined && seq < last) {
            const cur = outOfOrderPerWorker[w] ?? 0;
            outOfOrderPerWorker[w] = cur + 1;
        }
        lastSeqPerWorker[w] = seq;
        order.push(w);
    }
    // Count interleave points: adjacent lines from different workers
    let interleavePoints = 0;
    for (let i = 1; i < order.length; i++) {
        if (order[i] !== order[i - 1])
            interleavePoints++;
    }
    // Missing per worker
    const missingPerWorker = {};
    for (const id of Object.keys(seenPerWorker)) {
        missingPerWorker[id] = opts.lines - seenPerWorker[id].size;
    }
    const actualLines = rawLines.length;
    const lineCountOk = actualLines === expectedLines;
    const noParseFail = jsonParseFails === 0;
    const noMissing = Object.values(missingPerWorker).every((n) => n === 0);
    const noDup = duplicates === 0;
    const verdict = lineCountOk && noParseFail && noMissing && noDup ? "OK" : "FAIL";
    if (!lineCountOk)
        notes.push(`line count mismatch: expected ${expectedLines}, got ${actualLines}`);
    if (!noParseFail)
        notes.push(`${jsonParseFails} lines failed JSON.parse (likely line splits/interleave)`);
    if (corruptOrSplit > 0)
        notes.push(`${corruptOrSplit} lines show inter-worker byte interleave inside a single line`);
    if (!noMissing)
        notes.push(`missing seqs: ${JSON.stringify(missingPerWorker)}`);
    if (!noDup)
        notes.push(`${duplicates} duplicate (worker,seq) tuples observed`);
    if (interleavePoints < opts.workers - 1) {
        notes.push(`low interleave (${interleavePoints}) — workers may not have run truly concurrently`);
    }
    return {
        size: opts.size,
        workers: opts.workers,
        linesPerWorker: opts.lines,
        expectedLines,
        actualLines,
        jsonParseFails,
        corruptOrSplit,
        duplicates,
        missingPerWorker,
        outOfOrderPerWorker,
        interleavePoints,
        fileBytes,
        durationMs,
        filePath: file,
        verdict,
        notes,
    };
}
// ---- CLI ----------------------------------------------------------------
async function mainCli() {
    const args = parseArgs(process.argv.slice(2));
    const all = args.all === "true";
    if (all) {
        const sizes = ["small", "medium", "large"];
        const workers = Number(args.workers ?? 4);
        const lines = Number(args.lines ?? 1000);
        const trials = Number(args.trials ?? 3);
        const results = [];
        for (const size of sizes) {
            for (let t = 1; t <= trials; t++) {
                process.stdout.write(`\n[run] size=${size} workers=${workers} lines=${lines} trial=${t} ... `);
                const r = await runTest({ size, workers, lines, trial: t });
                results.push(r);
                process.stdout.write(`${r.verdict} (parseFail=${r.jsonParseFails}, lines=${r.actualLines}/${r.expectedLines}, intl=${r.interleavePoints})\n`);
            }
        }
        // Summary table
        console.log("\n==== SUMMARY ====");
        console.log("Size\tTrial\tExp\tGot\tParseFail\tCorruptInline\tMissing\tDup\tIntl\tVerdict");
        for (const r of results) {
            const missTotal = Object.values(r.missingPerWorker).reduce((a, b) => a + b, 0);
            console.log(`${r.size}\t${"?"}\t${r.expectedLines}\t${r.actualLines}\t${r.jsonParseFails}\t${r.corruptOrSplit}\t${missTotal}\t${r.duplicates}\t${r.interleavePoints}\t${r.verdict}`);
        }
        // Write JSON report
        const reportPath = path.join(process.cwd(), "tmp", "atomic-test", "report.json");
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify({ env: envInfo(), results }, null, 2));
        console.log(`\nReport: ${reportPath}`);
        const anyFail = results.some((r) => r.verdict === "FAIL");
        process.exit(anyFail ? 2 : 0);
    }
    else {
        const size = args.size ?? "small";
        const workers = Number(args.workers ?? 4);
        const lines = Number(args.lines ?? 1000);
        const r = await runTest({ size, workers, lines });
        console.log(JSON.stringify({ env: envInfo(), result: r }, null, 2));
        process.exit(r.verdict === "OK" ? 0 : 2);
    }
}
function envInfo() {
    return {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        osRelease: os.release(),
        cwd: process.cwd(),
    };
}
if (require.main === module && !process.argv.includes(WORKER_FLAG)) {
    mainCli().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
//# sourceMappingURL=test-atomic-append.js.map