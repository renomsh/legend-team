---
role: dev
turnId: 8
phase: erj-submission-prep
topic: topic_151
session: session_175
invocationMode: subagent
---

DEV_WRITE_DONE: reports/2026-05-02_copd-paper-part2-residual/dev_rev2.md

## Dev — ERJ submission 준비 (Task 1 + Task 2)

### Task 1 — Table 4 sensitivity rows S2/S6/S7 regen on n=2,712

**정의 추출 (manuscript Methods §Sensitivity + table4_sensitivity_v2.json legacy):**
- **S2**: Add Charlson comorbidity index (`KO1_F_CCI_total`) as additional covariate to the primary CMA covariate set (age, sex, BMI, FEV1%pred, PRISm).
- **S6**: Restrict the primary Low+High frame to current smokers (`KO1_smoking_status == 2`).
- **S7**: Inverse-probability weighting (IPW) for missingness on the mediation analysis set. Stage-1 logit predicts the complete-case indicator from baseline non-missing predictors (A, age, sex, BMI, PRISm); IPW = 1/p̂ clipped to [0.05, 0.95] then mean-stabilised; stage-2 CMA fitted with WLS / GLM `freq_weights`.

> Manuscript ver3.5_F currently lists only S2 + S7 as "regen pending" in Table 4 (line 174-184) and does **not** include an S6 row. Old (n=2,932) `table4_sensitivity_v2.json` carried S6 ("Current smokers, underpowered"). Per task instruction "S2/S6/S7", all three regenerated for completeness — Master decides whether to add the S6 row back to Table 4.

**스크립트:** `Data/ver2.0/submission_session174_2026-05-02/04_scripts/scripts/S2_S6_S7_regen.py` (mirrors `03_cma_primary.py`: VanderWeele regression-based CMA, no A×M interaction, 2,000 bootstrap, contrast Low vs High, mediator SGRQ Symptoms).

**실행:**
- 명령: `cd C:/Projects/COPD/Data/ver2.0/submission_session174_2026-05-02 && PYTHONIOENCODING=utf-8 python 04_scripts/scripts/S2_S6_S7_regen.py`
- exit code: 0
- 출력 파일: `02_analysis_outputs/table4_S2_S6_S7_regen.json` (2,120 bytes), `table4_S2_S6_S7_regen.md` (1,761 bytes)

**결과:**

| Sensitivity | n | NIE OR | 95% CI | p (boot) | TE OR (95% CI) | PM (%) | direction vs primary |
|---|---:|---:|---|---:|---|---:|---|
| **S2 + Charlson index** | 724 | 1.100 | 1.00-1.24 | 0.052 | 1.668 (0.94-3.60) | 18.6 | preserved (>1.0), borderline-significant |
| **S6 Current smokers** | 192 | 1.051 | 0.92-1.34 | 0.533 | unstable † | n/a | preserved direction, n too small for stable inference |
| **S7 IPW for missingness** | 850 | 1.149 | 1.05-1.29 \* | 0.003 | 1.878 (1.09-4.14) | 22.0 | preserved, **statistically significant**, slightly stronger than primary |

\* 95% CI excludes 1.
† S6 TE bootstrap CI degenerate due to a small number of separating-design iterations on n=192 (upper CI inflated to ~2.2×10⁹); NIE itself is bounded but PM is uninterpretable. Recommend reporting S6 NIE only, omitting TE/PM, with explicit n=192 underpowered caveat — or dropping S6 row entirely (consistent with current ver3.5_F manuscript).

**vs old (n=2,932):**

| Row | old NIE OR (95% CI) | new NIE OR (95% CI) | direction consistent |
|---|---|---|---|
| S2 +Charlson | 1.073 (0.98-1.21) | 1.100 (1.00-1.24) | YES (CI lower edge moves from 0.98 to 1.00 — slightly stronger) |
| S6 Current smokers | 1.052 (0.90-1.37) | 1.051 (0.92-1.34) | YES (essentially unchanged) |
| S7 IPW missingness | 1.132 (1.03-1.28) | 1.149 (1.05-1.29) | YES (slightly stronger) |

**Manuscript Table 4 paste-ready rows (recommended — drop S6, add S2 + S7):**

```markdown
| S2 + Charlson | 724 | **1.100 (1.00–1.24)** | 1.668 (0.94–3.60) | 18.6 |
| S7 IPW for missingness | 850 | **1.149 (1.05–1.29) ★** | 1.878 (1.09–4.14) | 22.0 |
```

Insert these two rows between current Table 4 lines 179 and 181 of `full_manuscript_ver3.5_F_E.md` (replacing the existing `(regen pending)` placeholders for S2 and S7).

If Master wants S6 row included:

```markdown
| S6 Current smokers (underpowered, n=192) | 192 | 1.051 (0.92–1.34) | unstable | — |
```

### Task 2 — DOI mint guide

**Bundle:** `C:/Projects/COPD/Data/ver2.0/submission_session174_2026-05-02/zenodo_upload_bundle/`

| Subdir | files | size |
|---|---|---|
| `data/` | `canonical_cohort_deid.csv` | 328 KB |
| `scripts/` | 15 .py files (00–08, S1, S2_S6_S7_regen, S3, S4, S8, deidentify_for_zenodo) | 124 KB |
| `outputs/` | 14 supplementary files (S1 fig, S3/S4/S8 json+md, table4_S2_S6_S7_regen, cohort_flow, evalue, followup_sweep, table2/table3) | 249 KB |
| `README.md` | citation + reproduction guide + de-id recipe + licence | 4 KB |
| **Total** | | ~700 KB |

**개인정보 검증:**

PII grep across `canonical_cohort.csv` (1,753 columns) identified 3 actual identifying fields requiring de-identification (the rest were clinical-keyword false positives like `KO1_DZ_Hyperlipid` matching `ID`):

| Original field | Risk | Transformation in `canonical_cohort_deid.csv` |
|---|---|---|
| `SUBJ_ID` (5-digit pseudonymous id) | site-linkage re-id | sha256(salt + id)[:16] → `subj_hash` (irreversible) |
| `BASELINE_DATE` (full YYYY-MM-DD) | combined with hospital code allows re-id | year only → `baseline_year` |
| `hosp` (2-digit hospital code from SUBJ_ID prefix) | links to KOCOSS site catalogue | sequential anon `H01..H46` → `hosp_anon` |

Additionally, the deid script applies a 28-variable **whitelist** (analysis-relevant only — exposure, mediators, outcome, covariates) — drops 1,725 unused KOCOSS columns to minimise re-identification surface.

Recipe script: `04_scripts/scripts/deidentify_for_zenodo.py` (also bundled in `zenodo_upload_bundle/scripts/` for transparency).

**DOI mint guide:** `reports/2026-05-02_copd-paper-part2-residual/dev_dois_mint_guide.md`

Covers: pre-mint checklist (zip, IRB, licence), Zenodo step-by-step (account → metadata → publish), OSF alternative, post-mint update flow.

**Manuscript 박제 위치 (DOI mint 후 갱신 대상):**

| File | Line | Current text | Replace with |
|---|---|---|---|
| `full_manuscript_ver3.5_F_E.md` | 115 | `[DOI placeholder, to be minted at acceptance]` | `https://doi.org/10.5281/zenodo.NNNNNNN` |
| `full_manuscript_ver3.5_F_E.md` | 251 (Discussion §Data availability) | `(DOI placeholder — to be inserted at submission; see Methods §Statistical analysis)` | `(Zenodo, doi:10.5281/zenodo.NNNNNNN; see Methods §Statistical analysis)` |
| `cover_letter_ver3.5_F.md` | grep `DOI placeholder` or `Zenodo` | (verify exact line) | Same DOI string |
| `full_manuscript_ver3.5_F_E.md` frontmatter | YAML block top | (no field) | Add `code_data_doi: "10.5281/zenodo.NNNNNNN"` + changelog line `ver3.5_F → ver3.5_F_doi: code/data DOI minted at Zenodo` |

### 의외 발견

1. **S2 (+Charlson) on n=2,712 strengthens slightly** vs old n=2,932 — CI lower bound moves from 0.98 to 1.00 (technically borderline-significant at α=0.05; bootstrap p=0.052). Prior round's "S2 attenuates the NIE" framing remains true (PM 18.6% vs primary 21.9%), but the attenuation is less severe than reported in old table. Manuscript prose may want to soften the S2 attenuation statement (currently no S2 prose exists; prose is implicit in the "regen pending" row).

2. **S7 (IPW for missingness) is now significant** at 1.149 (1.05-1.29), bootstrap p=0.003 — slightly **stronger** than primary NIE 1.122 (1.03-1.27). This is a minor positive finding for the manuscript: missingness-pattern IPW yields a similar, marginally larger indirect effect, supporting the MAR assumption used elsewhere. Worth a single-sentence highlight in Discussion §Sensitivity (currently the §Sensitivity prose only mentions S8 explicitly).

3. **S6 (current smokers) TE bootstrap is degenerate** at n=192 with sparse exacerbation events — separating-design iterations produce extreme OR outliers, inflating TE upper CI to ~2×10⁹ and rendering PM uninterpretable (-952%). The NIE point and CI are bounded (1.051, 0.92-1.34) and consistent with old. Recommend either dropping S6 row entirely (current ver3.5_F default) or reporting NIE only with explicit "underpowered, n=192, TE not estimable" caveat. Do **not** paste the raw TE/PM numbers into the manuscript.

4. **canonical_cohort.csv has 1,753 columns** — 1,725 unused KOCOSS variables flow through the entire analysis. Whitelist-then-deid (28 cols retained for Zenodo) drastically reduces re-id surface and bundle size (raw 24 MB vs deid 328 KB). Suggest applying the same whitelist-first principle to future KOCOSS submissions.

### Master 결정 필요

**1건 (Table 4 S6 행 처리):**
- (a) Drop S6 row from Table 4 (matches current ver3.5_F format, consistent with "underpowered" old-table label) — Dev 권고
- (b) Include S6 row with NIE-only + explicit "TE not estimable, n=192 underpowered" caveat
- (c) Re-run S6 with stratified bootstrap or alternative variance estimator to stabilise TE — adds 30-60 min Dev work, marginal manuscript value

권고: **(a)**. n=192 current-smoker subgroup contributes minimal evidentiary value for ERJ epidemiology audience — the NIE point estimate (1.051) is uninformative and the TE collapse signals the design is underpowered for this stratum. Manuscript already covers smoking via pack-years comparator mediator (Table 3) and primary covariate set indirectly.

---

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 0.85
hc_rt: 0.05
spc_drf: 1
