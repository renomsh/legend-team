"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortDeterministic = sortDeterministic;
exports.applyStrategy = applyStrategy;
// Deterministic sort: (sessionId asc, raterId asc, ts asc); tie-break ts desc latest wins (handled at supersedes layer).
function sortDeterministic(records) {
    return [...records].sort((a, b) => {
        if (a.sessionId !== b.sessionId)
            return a.sessionId < b.sessionId ? -1 : 1;
        if (a.raterId !== b.raterId)
            return a.raterId < b.raterId ? -1 : 1;
        return a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0;
    });
}
function applyStrategy(records, strategy, ctx = {}) {
    const sorted = sortDeterministic(records);
    switch (strategy) {
        case "all-sessions":
            return sorted;
        case "invoked-sessions-only":
            return ctx.invokedSessions
                ? sorted.filter(r => ctx.invokedSessions.has(r.sessionId))
                : sorted;
        case "signal-gated":
            return ctx.signalSessions
                ? sorted.filter(r => ctx.signalSessions.has(r.sessionId))
                : sorted;
        case "stratified-by-grade":
            // No filter; consumer reads sessionGrade for stratum keys.
            return sorted;
        default: {
            const _ex = strategy;
            throw new Error(`unknown strategy: ${String(_ex)}`);
        }
    }
}
//# sourceMappingURL=aggregation-strategies.js.map