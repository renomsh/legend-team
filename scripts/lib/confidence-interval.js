"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meanStdCI = meanStdCI;
function meanStdCI(values) {
    const n = values.length;
    if (n === 0)
        return { mean: 0, std: 0, n: 0, ci95: null };
    const mean = values.reduce((s, v) => s + v, 0) / n;
    if (n < 3)
        return { mean: round1(mean), std: 0, n, ci95: null };
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
    const std = Math.sqrt(variance);
    const margin = 1.96 * (std / Math.sqrt(n));
    return {
        mean: round1(mean),
        std: round1(std),
        n,
        ci95: [round1(mean - margin), round1(mean + margin)],
    };
}
function round1(x) {
    return Math.round(x * 10) / 10;
}
//# sourceMappingURL=confidence-interval.js.map