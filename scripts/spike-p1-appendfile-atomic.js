"use strict";
/**
 * spike-p1-appendfile-atomic.ts
 *
 * topic_176 / Arki rev2 §5.2 P1 — appendFile atomic spike.
 *
 * Verifies (a) line size <= PIPE_BUF assumption (b) byte-level atomicity of
 * fs.appendFileSync under multi-child concurrent append on Windows NTFS
 * (POSIX optional via WSL).
 *
 * Matrix: 3 line sizes (0.5KB, 1KB, 5KB) × 2 child counts (5, 10) × 5 rounds.
 * Each child appends 200 lines/round.
 *
 * GATE α': corruptRate < 0.01% AND avgByteSize < 1KB → PASS.
 *
 * Outputs:
 *   reports/2026-05-07_topic_176_arki/spike_p1_appendfile_atomic.json
 *
 * D2 정합: fs.appendFileSync description not trusted; verified by measurement.
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const WORKER_FLAG = "--__spike_worker";
// ----------------- Worker -----------------
if (process.argv.includes(WORKER_FLAG)) {
    const args = parseArgs(process.argv.slice(2));
    const filePath = String(args.file);
    const lineSize = Number(args.lineSize);
    const repetitions = Number(args.repetitions);
    const childId = Number(args.childId);
    const startMs = Number(args.startMs);
    // sync wait until startMs (sub-process sync; busy wait if very close)
    const waitMs = startMs - Date.now();
    if (waitMs > 0) {
        // setTimeout is async; use a sync wait via Atomics
        try {
            const sab = new SharedArrayBuffer(4);
            const view = new Int32Array(sab);
            Atomics.wait(view, 0, 0, waitMs);
        }
        catch {
            // fallback
            const end = Date.now() + waitMs;
            while (Date.now() < end) {
                // spin
            }
        }
    }
    for (let seq = 0; seq < repetitions; seq++) {
        // Build a JSON object: {"sessionId":"spike","childId":N,"seq":N,"__pad":"xxx..."}\n
        const head = `{"sessionId":"spike","childId":${childId},"seq":${seq},"__pad":"`;
        const tail = `"}\n`;
        const padLen = Math.max(1, lineSize - Buffer.byteLength(head, "utf8") - Buffer.byteLength(tail, "utf8"));
        const line = head + "x".repeat(padLen) + tail;
        fs.appendFileSync(filePath, line);
    }
    process.exit(0);
}
// ----------------- Parent -----------------
function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a && a.startsWith("--") && a !== WORKER_FLAG) {
            const key = a.slice(2);
            const next = argv[i + 1];
            if (next === undefined || next.startsWith("--")) {
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
async function runRound(cfg, round, workDir) {
    const file = path.join(workDir, `spike-p1-r${round}-s${cfg.lineSize}-c${cfg.childCount}-${Date.now()}.jsonl`);
    fs.writeFileSync(file, "");
    const startMs = Date.now() + 150; // sync barrier
    const t0 = Date.now();
    await new Promise((resolve, reject) => {
        let exited = 0;
        let firstErr = null;
        const children = [];
        for (let i = 0; i < cfg.childCount; i++) {
            const child = (0, child_process_1.fork)(__filename, [
                WORKER_FLAG,
                "--file", file,
                "--lineSize", String(cfg.lineSize),
                "--repetitions", String(cfg.repetitions),
                "--childId", String(i),
                "--startMs", String(startMs),
            ], { stdio: ["ignore", "pipe", "pipe", "ipc"], execArgv: process.execArgv });
            child.on("exit", (code) => {
                exited++;
                if (code !== 0 && !firstErr) {
                    firstErr = new Error(`child ${i} exit code ${code}`);
                }
                if (exited === cfg.childCount) {
                    if (firstErr)
                        reject(firstErr);
                    else
                        resolve();
                }
            });
            child.stderr?.on("data", (d) => {
                process.stderr.write(`[c${i}] ${d}`);
            });
            children.push(child);
        }
    });
    const durationMs = Date.now() - t0;
    const buf = fs.readFileSync(file, "utf8");
    const fileBytes = Buffer.byteLength(buf, "utf8");
    const parts = buf.split("\n");
    const rawLines = parts[parts.length - 1] === "" ? parts.slice(0, -1) : parts;
    let parseSuccess = 0;
    let parseFail = 0;
    let maxByteSize = 0;
    const corruptSnippets = [];
    for (const ln of rawLines) {
        const sz = Buffer.byteLength(ln, "utf8");
        if (sz > maxByteSize)
            maxByteSize = sz;
        try {
            const obj = JSON.parse(ln);
            if (typeof obj === "object" && obj !== null && obj.sessionId === "spike" && typeof obj.childId === "number" && typeof obj.seq === "number") {
                parseSuccess++;
            }
            else {
                parseFail++;
                if (corruptSnippets.length < 5)
                    corruptSnippets.push(ln.slice(0, 80));
            }
        }
        catch {
            parseFail++;
            if (corruptSnippets.length < 5)
                corruptSnippets.push(ln.slice(0, 80));
        }
    }
    const expectedLines = cfg.childCount * cfg.repetitions;
    const lineCount = rawLines.length;
    const corruptRate = lineCount > 0 ? parseFail / lineCount : 0;
    const lossRate = (expectedLines - lineCount) / expectedLines;
    const avgByteSize = lineCount > 0 ? fileBytes / lineCount : 0;
    // cleanup jsonl
    try {
        fs.unlinkSync(file);
    }
    catch { }
    return {
        round,
        lineSize: cfg.lineSize,
        childCount: cfg.childCount,
        repetitions: cfg.repetitions,
        expectedLines,
        lineCount,
        parseSuccess,
        parseFail,
        corruptRate,
        lossRate,
        fileBytes,
        avgByteSize,
        maxByteSize,
        durationMs,
        corruptSnippets,
    };
}
function aggregate(rounds) {
    const first = rounds[0];
    let totalExpected = 0;
    let totalLineCount = 0;
    let totalParseFail = 0;
    let totalBytes = 0;
    let maxByteSize = 0;
    for (const r of rounds) {
        totalExpected += r.expectedLines;
        totalLineCount += r.lineCount;
        totalParseFail += r.parseFail;
        totalBytes += r.fileBytes;
        if (r.maxByteSize > maxByteSize)
            maxByteSize = r.maxByteSize;
    }
    return {
        lineSize: first.lineSize,
        childCount: first.childCount,
        rounds: rounds.length,
        totalExpected,
        totalLineCount,
        totalParseFail,
        corruptRate: totalLineCount > 0 ? totalParseFail / totalLineCount : 0,
        lossRate: (totalExpected - totalLineCount) / totalExpected,
        avgByteSize: totalLineCount > 0 ? totalBytes / totalLineCount : 0,
        maxByteSize,
    };
}
async function main() {
    const matrix = [
        { lineSize: 512, childCount: 5, repetitions: 200 },
        { lineSize: 512, childCount: 10, repetitions: 200 },
        { lineSize: 1024, childCount: 5, repetitions: 200 },
        { lineSize: 1024, childCount: 10, repetitions: 200 },
        { lineSize: 5120, childCount: 5, repetitions: 200 },
        { lineSize: 5120, childCount: 10, repetitions: 200 },
    ];
    const ROUNDS = 5;
    const workDir = path.join(process.cwd(), "tmp", "spike-p1");
    fs.mkdirSync(workDir, { recursive: true });
    const env = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        osRelease: os.release(),
        cwd: process.cwd(),
        posixRoundIncluded: false,
        posixNote: "Windows-only this round; POSIX (WSL) deferred to follow-up round per spec.",
    };
    const allRounds = [];
    const cellSummaries = [];
    for (const cfg of matrix) {
        const rounds = [];
        for (let r = 1; r <= ROUNDS; r++) {
            process.stdout.write(`[run] lineSize=${cfg.lineSize} children=${cfg.childCount} round=${r}/${ROUNDS} ... `);
            const result = await runRound(cfg, r, workDir);
            rounds.push(result);
            allRounds.push(result);
            process.stdout.write(`lines=${result.lineCount}/${result.expectedLines} parseFail=${result.parseFail} corrupt=${(result.corruptRate * 100).toFixed(4)}% avgByte=${result.avgByteSize.toFixed(1)} ${result.durationMs}ms\n`);
        }
        const summary = aggregate(rounds);
        cellSummaries.push(summary);
    }
    // GATE α' verdict per cell + overall
    const cellVerdicts = cellSummaries.map((c) => ({
        lineSize: c.lineSize,
        childCount: c.childCount,
        corruptRate: c.corruptRate,
        avgByteSize: c.avgByteSize,
        lossRate: c.lossRate,
        pass: c.corruptRate < 0.0001 && c.avgByteSize < 1024,
    }));
    const overallPass = cellVerdicts.every((v) => v.pass);
    const reportDir = path.join(process.cwd(), "reports", "2026-05-07_topic_176_arki");
    fs.mkdirSync(reportDir, { recursive: true });
    const outJson = path.join(reportDir, "spike_p1_appendfile_atomic.json");
    fs.writeFileSync(outJson, JSON.stringify({
        spec: "topic_176 / Arki rev2 §5.2 P1 — appendFile atomic spike",
        env,
        matrix,
        roundsPerCell: ROUNDS,
        gateThreshold: { corruptRateMax: 0.0001, avgByteSizeMaxBytes: 1024 },
        cellSummaries,
        cellVerdicts,
        overallVerdict: overallPass ? "PASS" : "FAIL",
        rounds: allRounds,
    }, null, 2));
    console.log(`\n[done] report: ${outJson}`);
    console.log(`[GATE α'] overall: ${overallPass ? "PASS" : "FAIL"}`);
    console.log(`Cells:`);
    for (const v of cellVerdicts) {
        console.log(`  lineSize=${v.lineSize} children=${v.childCount}: corrupt=${(v.corruptRate * 100).toFixed(4)}% avgByte=${v.avgByteSize.toFixed(1)} loss=${(v.lossRate * 100).toFixed(4)}% → ${v.pass ? "PASS" : "FAIL"}`);
    }
    process.exit(overallPass ? 0 : 2);
}
if (require.main === module && !process.argv.includes(WORKER_FLAG)) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
//# sourceMappingURL=spike-p1-appendfile-atomic.js.map