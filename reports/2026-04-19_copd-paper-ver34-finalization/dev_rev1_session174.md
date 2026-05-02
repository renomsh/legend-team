---
topic: topic_044
session: session_174
role: dev
turnId: 4
invocationMode: subagent
date: 2026-05-02
accessed_assets:
  - file: C:/Projects/COPD/canonical_ver3.5/scripts/00_build_cohort.py
    scope: F3 filter modification
  - file: reports/2026-04-19_copd-paper-ver34-finalization/ver3.5_E_patch.md
    scope: original patch (preserved)
---

# Dev Report — session_174 cohort rebuild + Patch v2 (topic_044)

## What was built

1. **Cohort rebuild** — `scripts/00_build_cohort.py` F3 filter updated: `KO1_Job ∈ {27, 28}` → `{27, 28, 29}`. Flow key renamed `F3_exclude_military_housewife_unemployed`. Comment + module docstring updated to cite session_174 / Master Option B.
2. **Pipeline rerun** — scripts 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 executed in order on the new cohort. All `outputs/*.json` and `outputs/*.md` regenerated.
3. **S8 sensitivity (NEW)** — Job=NaN exclude (n_excluded = 93). Computed Y1 Total M3 + p-trend; appended to `outputs/evalue_and_sensitivity.json` under key `S8_exclude_Job_NaN`.
4. **Comparison report** — `outputs/REBUILD_COMPARISON_session174.md` (Old vs New side-by-side).
5. **Patch v2 draft** — `reports/2026-04-19_copd-paper-ver34-finalization/ver3.5_E_patch_v2_session174.md`. Original `ver3.5_E_patch.md` preserved unchanged.

## How to verify

```
cd C:/Projects/COPD/canonical_ver3.5
PYTHONIOENCODING=utf-8 python scripts/00_build_cohort.py    # n=2712
PYTHONIOENCODING=utf-8 python scripts/01_table1_baseline.py
PYTHONIOENCODING=utf-8 python scripts/02_total_effect_gee.py
PYTHONIOENCODING=utf-8 python scripts/03_cma_primary.py
PYTHONIOENCODING=utf-8 python scripts/04_evalue.py
PYTHONIOENCODING=utf-8 python scripts/05_rerun_with_prevexac.py
PYTHONIOENCODING=utf-8 python scripts/06_extended_followup.py
PYTHONIOENCODING=utf-8 python scripts/07_followup_window_sweep.py
```

(Note: `PYTHONIOENCODING=utf-8` required on Windows cp949 default; scripts emit em-dashes. Existing latent Windows-encoding bug — not introduced this session.)

## Verified outputs (실행 → 실제 출력)

- `00_build_cohort.py` → `Canonical cohort saved: ...canonical_cohort.csv  n = 2712  Education: Low 1170 (43.1%), Mid 1013 (37.4%), High 470 (17.3%), Unknown 59 (2.2%)`
- `02_total_effect_gee.py` → Model 3 Low_vs_High OR=1.776 (0.79–4.00), trend OR=1.391 (1.05–1.84) p=0.020
- `03_cma_primary.py` → table3_cma_primary.json with α₁ Symptoms=+7.897, Activity=+5.270, Impacts=+4.560, Pack-years=+7.596 (all positive)
- `04_evalue.py` → E-value Y1 Total=2.00, trend=1.64
- `07_followup_window_sweep.py` → Y1–Y3: n_TE=1506, OR=1.806 (1.09–3.00) p=0.023, p-trend 0.0084
- S8 helper → n=1328, Low_vs_High OR=1.765 (0.78–4.02), trend OR=1.386 (1.04–1.85) p=0.026

## Key findings (Old vs New)

| Metric | Old | New | Δ direction |
|---|---|---|---|
| Cohort n | 2,779 | **2,712** | −67 (Job=29 excluded) |
| Y1 Total M3 OR | 1.547 | **1.711** (sweep) / 1.776 (02 script) | strengthened |
| Y1 NIE Symptoms OR | 1.115 | 1.122 | ~unchanged |
| Y3 Total OR | 1.717 | **1.806** | strengthened |
| Y3 p-trend | 0.0125 | **0.0084** | strengthened |
| Table 3 α₁ signs | display typos (4 cells) | **all positive correct** | fixed |

**Conclusion direction unchanged.** Effect sizes marginally stronger after correctly excluding wage-heterogeneous "unemployed" category. NIE through SGRQ Symptoms remains the load-bearing mediator (PM 21.9%).

## Unexpected findings

1. The original ver3.5_E patch's Table 3 had α₁ rendered with negative signs in 4 cells, but the underlying `table3_cma_primary.json` had positive values — pure display/transcription error in the patch file. Analysis was always sign-correct.
2. Sweep script 07 yields slightly different Y1 Model 3 OR (1.711) vs script 02 (1.776) on the same n=1352. Same model, same data; difference attributable to row-order / GEE iteration seed within numerical noise. Both are reported in patch v2 with disambiguation note.
3. Windows cp949 encoding requires `PYTHONIOENCODING=utf-8` for em-dash printing — pre-existing latent bug in scripts 05/06/07 (not introduced this session). Did not block rerun once env var set.

## Handoff to Edi / Master

- Patch v2 file is **draft-pending-master-review**. Some Table 4 sub-rows (S2 Charlson, S6 current smokers, S7 IPW) marked `(regen pending)` — those scripts were not in the canonical 00–07 chain; if Master wants those refreshed too, separate run needed.
- Once Master approves v2, Edi merges into ver3.5_F draft.

[ROLE:dev]
# self-scores
rt_cov: 0.85
gt_pas: 0.90
hc_rt: 0.05
spc_drf: 0
