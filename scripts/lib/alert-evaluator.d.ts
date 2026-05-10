import type { AlertConfig } from "./signature-metrics-types";
export type AlertLevel = "red" | "yellow" | "ok";
export interface AlertResult {
    level: AlertLevel;
    reasons: string[];
}
export declare function evaluateAlert(currentMean: number, previousMean: number | null, cfg: AlertConfig | undefined): AlertResult;
//# sourceMappingURL=alert-evaluator.d.ts.map