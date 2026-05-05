# Regression Snapshots (P0b placeholders)

These snapshots are frozen at P0b phase start. `scripts/test-regression.ts` (built in P4)
compares new `compute-signature-metrics.ts` output against these fixtures to detect
unintended behavior drift.

Populate in P1 after the first `compile-metrics-registry.ts` + `compute-signature-metrics.ts`
produce real dashboard_data.json fragments. Each snapshot should cover one representative
scenario (empty, baseline, post-baseline, stratified, alert-triggered).

Spec: `reports/2026-04-23_pd023-self-scores-thin-impl/arki_rev1.md` §2.1 / §6 (P0b→P4 chain).
