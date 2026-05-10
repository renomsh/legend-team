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
export {};
//# sourceMappingURL=vr-compare.d.ts.map