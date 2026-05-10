/**
 * log-evidence.ts  [L-02 evidence_index 자동 갱신]
 * Appends a new evidence entry to memory/shared/evidence_index.json.
 * Agents (especially Riki and Arki) should call this when surfacing a key finding.
 *
 * Usage:
 *   ts-node scripts/log-evidence.ts <topicSlug> <type> <source> "<finding>" [status]
 *
 * Types: structural-diagnosis | principle-violation | risk | assumption | data | reference | expert-input
 * Status defaults to "open"
 *
 * Example:
 *   ts-node scripts/log-evidence.ts topic_002 risk riki "Memory files empty in v0.1.0" open
 */
export {};
//# sourceMappingURL=log-evidence.d.ts.map