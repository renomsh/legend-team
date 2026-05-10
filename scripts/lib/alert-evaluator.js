"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAlert = evaluateAlert;
function evaluateAlert(currentMean, previousMean, cfg) {
    if (!cfg)
        return { level: "ok", reasons: [] };
    const reasons = [];
    let level = "ok";
    if (typeof cfg.redBelow === "number" && currentMean < cfg.redBelow) {
        level = "red";
        reasons.push(`mean ${currentMean.toFixed(1)} < redBelow ${cfg.redBelow}`);
    }
    else if (typeof cfg.yellowBelow === "number" && currentMean < cfg.yellowBelow) {
        level = "yellow";
        reasons.push(`mean ${currentMean.toFixed(1)} < yellowBelow ${cfg.yellowBelow}`);
    }
    if (typeof cfg.trendDropPct === "number" &&
        previousMean !== null &&
        previousMean > 0) {
        const dropPct = ((previousMean - currentMean) / previousMean) * 100;
        if (dropPct >= cfg.trendDropPct) {
            if (level === "ok")
                level = "yellow";
            reasons.push(`drop ${dropPct.toFixed(1)}% >= ${cfg.trendDropPct}%`);
        }
    }
    return { level, reasons };
}
//# sourceMappingURL=alert-evaluator.js.map