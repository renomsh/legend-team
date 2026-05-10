"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalize = normalize;
exports.applyPolarity = applyPolarity;
function normalize(rawScore, scale) {
    switch (scale) {
        case "0-5": {
            const n = typeof rawScore === "number" ? rawScore : Number(rawScore);
            if (!Number.isFinite(n) || n < 0 || n > 5)
                throw makeError(`0-5 out of range: ${rawScore}`);
            return n * 20;
        }
        case "Y/N": {
            const s = String(rawScore).trim().toUpperCase();
            if (s === "Y" || s === "YES" || s === "1" || s === "TRUE")
                return 100;
            if (s === "N" || s === "NO" || s === "0" || s === "FALSE")
                return 0;
            throw makeError(`Y/N invalid: ${rawScore}`);
        }
        case "ratio": {
            const n = typeof rawScore === "number" ? rawScore : Number(rawScore);
            if (!Number.isFinite(n) || n < 0 || n > 1)
                throw makeError(`ratio out of range: ${rawScore}`);
            return n * 100;
        }
        case "percentile": {
            const n = typeof rawScore === "number" ? rawScore : Number(rawScore);
            if (!Number.isFinite(n) || n < 0 || n > 100)
                throw makeError(`percentile out of range: ${rawScore}`);
            return n;
        }
        case "count": {
            const n = typeof rawScore === "number" ? rawScore : Number(rawScore);
            if (!Number.isFinite(n) || n < 0)
                throw makeError(`count out of range: ${rawScore}`);
            return n;
        }
        default: {
            const _exhaust = scale;
            throw makeError(`unknown scale: ${String(_exhaust)}`);
        }
    }
}
// For derived weighted-mean composition: lower-better → (100 - score) before sum
function applyPolarity(normalized, polarity) {
    if (polarity === "lower-better")
        return 100 - normalized;
    return normalized;
}
function makeError(message) {
    const err = new Error(message);
    err.code = "E-004";
    return err;
}
//# sourceMappingURL=metric-normalizer.js.map