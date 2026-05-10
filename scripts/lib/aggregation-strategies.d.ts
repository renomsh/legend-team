import type { ScoreRecord } from "./signature-metrics-types";
export type StrategyId = "all-sessions" | "invoked-sessions-only" | "signal-gated" | "stratified-by-grade";
export interface StrategyContext {
    invokedSessions?: Set<string>;
    signalSessions?: Set<string>;
    sessionGrade?: Record<string, string>;
}
export declare function sortDeterministic(records: ScoreRecord[]): ScoreRecord[];
export declare function applyStrategy(records: ScoreRecord[], strategy: StrategyId, ctx?: StrategyContext): ScoreRecord[];
//# sourceMappingURL=aggregation-strategies.d.ts.map