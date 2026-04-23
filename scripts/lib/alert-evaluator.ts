// PD-023 P0b — Alert evaluator (spec AlertConfig)
import type { AlertConfig } from "./signature-metrics-types";

export type AlertLevel = "red" | "yellow" | "ok";

export interface AlertResult {
  level: AlertLevel;
  reasons: string[];
}

export function evaluateAlert(
  currentMean: number,
  previousMean: number | null,
  cfg: AlertConfig | undefined,
): AlertResult {
  if (!cfg) return { level: "ok", reasons: [] };
  const reasons: string[] = [];
  let level: AlertLevel = "ok";

  if (typeof cfg.redBelow === "number" && currentMean < cfg.redBelow) {
    level = "red";
    reasons.push(`mean ${currentMean.toFixed(1)} < redBelow ${cfg.redBelow}`);
  } else if (typeof cfg.yellowBelow === "number" && currentMean < cfg.yellowBelow) {
    level = "yellow";
    reasons.push(`mean ${currentMean.toFixed(1)} < yellowBelow ${cfg.yellowBelow}`);
  }

  if (
    typeof cfg.trendDropPct === "number" &&
    previousMean !== null &&
    previousMean > 0
  ) {
    const dropPct = ((previousMean - currentMean) / previousMean) * 100;
    if (dropPct >= cfg.trendDropPct) {
      if (level === "ok") level = "yellow";
      reasons.push(`drop ${dropPct.toFixed(1)}% >= ${cfg.trendDropPct}%`);
    }
  }
  return { level, reasons };
}
