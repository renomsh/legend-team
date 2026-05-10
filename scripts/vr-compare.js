"use strict";
/**
 * vr-compare.ts — Visual Regression comparator (G3-B gate)
 *
 * Compares all matching PNGs in tests/vr/baseline/ vs tests/vr/current/
 * (or baseline vs baseline for --self self-diff verification).
 *
 * Per-pair: diffPixelCount / (width × height) as ratio.
 * Threshold: 2% (0.02). Any ratio > 0.02 → FAIL.
 *
 * Exit 0 = all PASS, Exit 1 = any FAIL.
 *
 * Usage:
 *   npx ts-node scripts/vr-compare.ts          # baseline vs current
 *   npx ts-node scripts/vr-compare.ts --self   # baseline vs baseline (expect 0%)
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pngjs_1 = require("pngjs");
const pixelmatch_1 = __importDefault(require("pixelmatch"));
const ROOT = path.resolve(__dirname, '..');
const BASELINE_DIR = path.join(ROOT, 'tests', 'vr', 'baseline');
const CURRENT_DIR = path.join(ROOT, 'tests', 'vr', 'current');
const THRESHOLD = 0.02; // 2%
const isSelf = process.argv.includes('--self');
function readPNG(filePath) {
    const buf = fs.readFileSync(filePath);
    return pngjs_1.PNG.sync.read(buf);
}
/** Recursively collect all .png file paths under a directory. Returns paths relative to root. */
function collectPNGs(dir, base = dir) {
    if (!fs.existsSync(dir))
        return [];
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...collectPNGs(full, base));
        }
        else if (entry.name.endsWith('.png')) {
            results.push(path.relative(base, full));
        }
    }
    return results;
}
function comparePair(baselinePath, candidatePath) {
    const img1 = readPNG(baselinePath);
    const img2 = readPNG(candidatePath);
    if (img1.width !== img2.width || img1.height !== img2.height) {
        throw new Error(`Size mismatch: baseline ${img1.width}x${img1.height} vs candidate ${img2.width}x${img2.height}`);
    }
    const { width, height } = img1;
    const diff = new pngjs_1.PNG({ width, height });
    const diffCount = (0, pixelmatch_1.default)(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
    const total = width * height;
    const ratio = diffCount / total;
    return { ratio, diffCount, total };
}
function main() {
    const baselineFiles = collectPNGs(BASELINE_DIR);
    if (baselineFiles.length === 0) {
        console.error(`[vr-compare] FAIL — No PNG files found in ${BASELINE_DIR}`);
        process.exit(1);
    }
    let candidateDir;
    let modeLabel;
    if (isSelf) {
        // Self-diff: compare baseline vs baseline (expect 0%)
        candidateDir = BASELINE_DIR;
        modeLabel = 'self-diff (baseline vs baseline)';
    }
    else {
        candidateDir = CURRENT_DIR;
        modeLabel = 'baseline vs current';
    }
    if (!isSelf && !fs.existsSync(CURRENT_DIR)) {
        console.error(`[vr-compare] FAIL — current dir not found: ${CURRENT_DIR}`);
        console.error('  Run npm run vr:capture to generate current screenshots first.');
        process.exit(1);
    }
    const failures = [];
    const sizeMismatches = [];
    let maxRatio = 0;
    let checkedCount = 0;
    let missingCount = 0;
    for (const relPath of baselineFiles) {
        const baselineFile = path.join(BASELINE_DIR, relPath);
        const candidateFile = path.join(candidateDir, relPath);
        if (!fs.existsSync(candidateFile)) {
            if (!isSelf) {
                console.warn(`  [MISSING] ${relPath}`);
                missingCount++;
            }
            continue;
        }
        try {
            const { ratio } = comparePair(baselineFile, candidateFile);
            checkedCount++;
            if (ratio > maxRatio)
                maxRatio = ratio;
            if (ratio > THRESHOLD) {
                failures.push({ file: relPath, ratio });
            }
        }
        catch (err) {
            if (err.message && err.message.includes('Size mismatch')) {
                sizeMismatches.push({ file: relPath, error: err.message });
            }
            else {
                throw err;
            }
        }
    }
    const pct = (r) => (r * 100).toFixed(2) + '%';
    if (sizeMismatches.length > 0) {
        console.error(`[vr-compare] FAIL — ${sizeMismatches.length} size mismatch(es):`);
        for (const sm of sizeMismatches) {
            console.error(`  ${sm.file}: ${sm.error}`);
        }
        process.exit(1);
    }
    if (failures.length > 0 || missingCount > 0) {
        const totalFail = failures.length + missingCount;
        console.error(`[vr-compare] FAIL — ${totalFail}/${baselineFiles.length} files exceed ${THRESHOLD * 100}% (mode: ${modeLabel})`);
        for (const f of failures) {
            console.error(`  FAIL  ${f.file}  diff=${pct(f.ratio)}`);
        }
        if (missingCount > 0) {
            console.error(`  MISSING  ${missingCount} file(s) not found in current/`);
        }
        process.exit(1);
    }
    console.log(`[vr-compare] PASS — ${checkedCount} files, max diff: ${pct(maxRatio)} (mode: ${modeLabel})`);
    process.exit(0);
}
main();
//# sourceMappingURL=vr-compare.js.map