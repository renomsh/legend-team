// PD-023 P0b — Aggregation strategies (spec §4.4)
import type { ScoreRecord } from "./signature-metrics-types";

export type StrategyId =
  | "all-sessions"
  | "invoked-sessions-only"
  | "signal-gated"
  | "stratified-by-grade";

export interface StrategyContext {
  invokedSessions?: Set<string>; // for invoked-sessions-only
  signalSessions?: Set<string>;  // for signal-gated (e.g., Riki spoke)
  sessionGrade?: Record<string, string>; // sessionId -> grade for stratified
}

// Deterministic sort: (sessionId asc, raterId asc, ts asc); tie-break ts desc latest wins (handled at supersedes layer).
export function sortDeterministic(records: ScoreRecord[]): ScoreRecord[] {
  return [...records].sort((a, b) => {
    if (a.sessionId !== b.sessionId) return a.sessionId < b.sessionId ? -1 : 1;
    if (a.raterId !== b.raterId) return a.raterId < b.raterId ? -1 : 1;
    return a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0;
  });
}

export function applyStrategy(
  records: ScoreRecord[],
  strategy: StrategyId,
  ctx: StrategyContext = {},
): ScoreRecord[] {
  const sorted = sortDeterministic(records);
  switch (strategy) {
    case "all-sessions":
      return sorted;
    case "invoked-sessions-only":
      return ctx.invokedSessions
        ? sorted.filter(r => ctx.invokedSessions!.has(r.sessionId))
        : sorted;
    case "signal-gated":
      return ctx.signalSessions
        ? sorted.filter(r => ctx.signalSessions!.has(r.sessionId))
        : sorted;
    case "stratified-by-grade":
      // No filter; consumer reads sessionGrade for stratum keys.
      return sorted;
    default: {
      const _ex: never = strategy;
      throw new Error(`unknown strategy: ${String(_ex)}`);
    }
  }
}
