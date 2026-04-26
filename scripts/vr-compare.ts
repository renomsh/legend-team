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

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ROOT = path.resolve(__dirname, '..');
const BASELINE_DIR = path.join(ROOT, 'tests', 'vr', 'baseline');
const CURRENT_DIR  = path.join(ROOT, 'tests', 'vr', 'current');
const THRESHOLD    = 0.02; // 2%

const isSelf = process.argv.includes('--self');

function readPNG(filePath: string): PNG {
  const buf = fs.readFileSync(filePath);
  return PNG.sync.read(buf);
}

/** Recursively collect all .png file paths under a directory. Returns paths relative to root. */
function collectPNGs(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectPNGs(full, base));
    } else if (entry.name.endsWith('.png')) {
      results.push(path.relative(base, full));
    }
  }
  return results;
}

function comparePair(baselinePath: string, candidatePath: string): { ratio: number; diffCount: number; total: number } {
  const img1 = readPNG(baselinePath);
  const img2 = readPNG(candidatePath);

  if (img1.width !== img2.width || img1.height !== img2.height) {
    throw new Error(`Size mismatch: baseline ${img1.width}x${img1.height} vs candidate ${img2.width}x${img2.height}`);
  }

  const { width, height } = img1;
  const diff = new PNG({ width, height });
  const diffCount = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
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

  let candidateDir: string;
  let modeLabel: string;

  if (isSelf) {
    // Self-diff: compare baseline vs baseline (expect 0%)
    candidateDir = BASELINE_DIR;
    modeLabel = 'self-diff (baseline vs baseline)';
  } else {
    candidateDir = CURRENT_DIR;
    modeLabel = 'baseline vs current';
  }

  if (!isSelf && !fs.existsSync(CURRENT_DIR)) {
    console.error(`[vr-compare] FAIL — current dir not found: ${CURRENT_DIR}`);
    console.error('  Run npm run vr:capture to generate current screenshots first.');
    process.exit(1);
  }

  const failures: Array<{ file: string; ratio: number }> = [];
  const sizeMismatches: Array<{ file: string; error: string }> = [];
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
      if (ratio > maxRatio) maxRatio = ratio;
      if (ratio > THRESHOLD) {
        failures.push({ file: relPath, ratio });
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Size mismatch')) {
        sizeMismatches.push({ file: relPath, error: err.message });
      } else {
        throw err;
      }
    }
  }

  const pct = (r: number) => (r * 100).toFixed(2) + '%';

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
