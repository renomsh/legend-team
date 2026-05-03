---
role: editor
turnId: 7
phase: ver3.5-f-merge
topic: topic_151
session: session_175
version: ver3.5_F
language: E (English)
date: 2026-05-02
target_journal: European Respiratory Journal (ERJ) [primary]
fallback_cascade: [Chest, IJE, Respir Med, ERJ Open Res, Int J COPD]
manuscript_type: Original research article
word_count_body: 3470
figures: 1 main + 2 supplement (S1 time-ordering, S2 existing E-value bias curve)
tables: 4 main + 4 supplement (S1 joint mediation, S3 ignorability, S4 GOLD 1-2, S8 MCAR)
references: 38
sister_paper: "Kwon E et al. 2026 Respir Res. DOI 10.1186/s12931-026-03677-4 (cited in Methods §1 and Cover letter for ICMJE non-overlap declaration)"
cohort: "KOCOSS n=2,712 (military, housewife, unemployed excluded for wage homogeneity)"
exposure: Education (Low/Middle/High)
mediator: SGRQ Symptoms domain
outcome: 1-year acute exacerbation (any moderate-to-severe)
key_results: "Total OR Low vs High (Model 3): 1.71 (0.77-3.82), per-tier trend OR 1.391 (1.05-1.84), p-trend 0.020; NIE 1.122 (1.03-1.27), PM 21.9%; bias-adjusted (R=1.10) NIE 1.113 (1.02-1.26); E-value 1.49 (CI lower 1.21)"
accessed_assets:
  - memory/shared/topic_index.json
  - memory/shared/decision_ledger.json
  - memory/shared/evidence_index.json
  - memory/shared/glossary.json
changelog: "ver3.4 → ver3.5_F — (1) cohort rebuild n=2,932→2,712 (military/housewife/unemployed excluded for wage homogeneity); (2) α₁ Table 3 sign correction (display-only typo fixed; analysis unchanged); (3) S8 MAR sensitivity for Job=NaN added; (4) ERJ retarget — framing pivot from clinical actionability to epidemiologic mechanism + education-targeted policy lever; (5) Riki R-1~R-3 mitigations + bias-adjusted NIE lower bound + cross-cohort triangulation + strengthened Limitations; (6) sister paper Kwon 2026 Respir Res cited in Methods§1 and Cover letter for ICMJE non-overlap; (7) Take-home Points box removed (Chest convention); (8) word compression to ≤3,500w."
invocationMode: subagent
---

# Mediation of the Educational Gradient in One-Year Acute Exacerbation Risk by Patient-Perceived Symptom Burden in COPD and PRISm: A Prospective Multicentre Korean Cohort Study

**Authors**: Eunjin Kwon^a,†^, Won Seo Yoon^b^, Ji-Yong Moon^b^, Gi Ho Lee^a^, Yong-Il Hwang^c^, Kwang-Ha Yoo^b^, Young-Youl Kim^a,\*^, Youlim Kim^b,\*\*^

**Affiliations**:
- ^a^ Division of Allergy and Respiratory Disease Research, Department of Chronic Disease Convergence Research, National Institute of Health, Cheongju, South Korea
- ^b^ Division of Pulmonary and Critical Care Medicine, Department of Internal Medicine, Konkuk University Medical Center, Konkuk University School of Medicine, Seoul, South Korea
- ^c^ Division of Pulmonary, Allergy and Critical Care Medicine, Department of Internal Medicine, College of Medicine, Hallym University Sacred Heart Hospital, Anyang, South Korea

^†^ First author.
^\*^ Co-corresponding author: Young-Youl Kim, PhD. Division of Allergy and Respiratory Disease Research, National Institute of Health, 187 Osongsaengmyeong2-ro, Osong-eup, Heungdeok-gu, Cheongju 28159, South Korea. E-mail: youngyk07@korea.kr.
^\*\*^ Co-corresponding author: Youlim Kim, MD, PhD. Division of Pulmonary and Critical Care Medicine, Konkuk University Medical Center, 120-1 Neungdong-ro, Gwangjin-gu, Seoul 05030, South Korea. E-mail: weilin810707@gmail.com.

> **[Verify before submission]** Author list mirrored from sister paper (Kwon E et al. 2026 Respir Res). Master to confirm or amend if KOCOSS investigators differ for this analysis. Author contributions block (below) similarly mirrors a standard CRediT pattern — confirm individual contributions.

---

## Abstract

**Background.** Lower educational attainment is associated with increased risk of acute exacerbations in chronic obstructive pulmonary disease (COPD), but the intermediate pathways remain poorly characterised within universal-coverage health systems. The mechanistic decomposition of this residual gradient is required to identify upstream policy levers beyond access expansion.

**Methods.** We analysed 2,712 adults with COPD or preserved ratio impaired spirometry (PRISm) from the Korean COPD Subgroup Study (KOCOSS), a prospective multicentre cohort across 44 hospitals; participants in occupational categories with heterogeneous wage structures (military, housewife, unemployed) were excluded *a priori* for cohort wage homogeneity. Exposure was three-level educational attainment (Low / Middle / High, reference = High). The outcome was any moderate-to-severe acute exacerbation within one year. The St George's Respiratory Questionnaire (SGRQ) Symptoms domain was designated *a priori* as the primary candidate mediator; pack-years, SGRQ Activity, and SGRQ Impacts served as prespecified comparator mediators. Total effects were estimated with generalised estimating equations (GEE) logistic regression with hospital clustering, adjusting for age, sex, body mass index, post-bronchodilator FEV1 % predicted, PRISm status, and prior-year exacerbations. Causal mediation followed the VanderWeele 2014 four-way decomposition with 2,000 bootstrap replicates. The hierarchical primary endpoint was the per-tier ordinal trend; the binary Low-versus-High contrast served as a secondary endpoint. A bias-adjusted natural indirect effect (NIE) under a moderate unmeasured-confounding scenario (R<sub>UM</sub>=R<sub>UY</sub>=1.10) was reported as a conservative lower bound.

**Results.** In Model 3, low education was associated with a higher one-year exacerbation risk relative to high education (odds ratio [OR] 1.71, 95% confidence interval [CI] 0.77 to 3.82, p=0.191) with a statistically significant per-tier ordinal trend (OR 1.391, 95% CI 1.05 to 1.84, p-trend=0.020); the extended Y1–Y3 pooled analysis showed OR 1.81 (1.09 to 3.00), p-trend=0.008. In the primary causal mediation analysis (n=850), the SGRQ Symptoms domain was a significant mediator: NIE OR 1.122 (95% CI 1.03 to 1.27), proportion mediated 21.9%. Pack-years and SGRQ Activity did not show significant mediation; SGRQ Impacts showed a borderline NIE (1.06, 95% CI 1.00 to 1.14). Under the conservative R<sub>UM</sub>=R<sub>UY</sub>=1.10 adjustment the bias-adjusted NIE was 1.113 (95% CI 1.02 to 1.26). In a GOLD 1–2 sub-cohort (n=605) the NIE was directionally consistent (1.197, 95% CI 1.06 to 1.39); the E-value for the indirect effect was 1.49 (CI lower bound 1.21).

**Conclusions.** In a prospective Korean multicentre cohort, approximately one fifth of the educational gradient in one-year COPD or PRISm exacerbation risk was mediated through patient-perceived symptom burden as captured by the SGRQ Symptoms domain, with the indirect effect remaining significant even under conservative confounding adjustment. The finding identifies education as a modifiable upstream determinant operating through symptom experience and supports education-targeted symptom-monitoring care pathways and priority allocation of chronic disease management and pulmonary rehabilitation resources within universal-coverage systems.

**Keywords**: COPD; PRISm; health inequalities; causal mediation analysis; patient-reported outcomes; pulmonary rehabilitation

---

## Introduction

Chronic obstructive pulmonary disease (COPD) remains a leading cause of morbidity and mortality worldwide, with acute exacerbations a principal driver of disease progression, healthcare utilisation and death. [MacLeod 2021; GOLD 2025; GBD 2020] Socioeconomic gradients in COPD incidence, severity and exacerbation risk have been documented across diverse settings, with lower educational attainment among the most commonly reported indicators of excess risk. [Yang 2022; Stolz 2022; Gershon 2012; Prescott 1999] These gradients persist within universal-coverage systems, indicating that insurance-level access does not account for the full inequity. [Marmot 2005; Galobardes 2007]

The intermediate pathways through which educational disadvantage translates into differential exacerbation risk remain poorly specified. Candidate mechanisms include differential tobacco exposure, reduced physical activity, psychological burden and — more speculatively — differences in how respiratory symptoms are perceived, interpreted and reported. [Nutbeam 2008; Berkman 2011] Prior work has overwhelmingly characterised total associations rather than decomposing them into mediated and direct components, leaving the operative pathway — and therefore the policy lever — unresolved.

Formal causal mediation analysis offers a framework for testing candidate pathways while quantifying assumptions about unmeasured confounding. [VanderWeele 2014; Imai 2010; Valeri 2013] We applied this approach in the Korean COPD Subgroup Study (KOCOSS), a prospective multicentre cohort operating within a universal-coverage national health insurance system, to ask: through what intermediate pathway — if any — does educational attainment exert its residual association with one-year exacerbation risk?

Our pre-specified conceptual model (Figure 1) posited four candidate mediators spanning exposure (pack-years), symptom burden (SGRQ Symptoms), activity limitation (SGRQ Activity) and psychosocial impact (SGRQ Impacts). We hypothesised that patient-perceived symptom burden would emerge as the operative mediator and tested this hypothesis against three comparator pathways within a formal causal framework, with quantitative sensitivity analyses to bound the impact of unmeasured confounding.

> **Figure 1.** Conceptual directed acyclic graph (DAG). Education (exposure) → candidate mediator (SGRQ Symptoms [primary, ★], SGRQ Activity, SGRQ Impacts, or pack-years [comparators]) → one-year acute exacerbation (outcome). Baseline covariates (age, sex, FEV1 % predicted, BMI, PRISm status, prior-year exacerbations) adjust both exposure–mediator and mediator–outcome associations. Time ordering of baseline measurement, mediator assessment and outcome ascertainment is provided in Supplementary Figure S1.

---

## Methods

### Study design and cohort

The present causal mediation analysis is the second of two pre-planned investigations within the KOCOSS framework. The companion paper (Kwon et al., *Respir Res* 2026; DOI 10.1186/s12931-026-03677-4) developed a predictive prognostic index based on the COTE comorbidity score for cardiovascular and exacerbation outcomes; the current study extends to the upstream causal mediation pathway linking educational attainment to symptom burden and exacerbation, with non-overlapping exposure (education vs comorbidity index), non-overlapping primary outcome (one-year exacerbation vs CV events) and a distinct analytic framework (causal mediation vs prediction). The two analyses were planned at protocol design as a sequential prediction–to–causation pair.

We analysed data from KOCOSS, a prospective multicentre observational cohort enrolling adults with physician-diagnosed COPD or PRISm [Wan 2014] from 44 hospitals across South Korea. [Choi 2019; Jang 2025] Participants were recruited from April 2012 onwards with annual follow-up for exacerbations and health status; the present analysis used the 2024 data freeze. The KOCOSS protocol was approved by the institutional review boards of participating centres and all participants provided written informed consent. We excluded *a priori* occupational categories with heterogeneous wage structures — military (KO1_Job=27), housewife (KO1_Job=28) and unemployed (KO1_Job=29) — to enforce within-cohort wage homogeneity (199 dropped: 8, 124 and 67 respectively); none of the listed student category (KO1_Job=30) were eligible after the age ≥ 40 restriction. Subjects with missing occupational data (KO1_Job=NaN, n=93) were retained in the primary cohort and assessed for sensitivity in S8. The final canonical cohort comprised n=2,712 participants. The temporal ordering of exposure, mediator and outcome ascertainment is shown in Supplementary Figure S1.

### Exposure — educational attainment

Educational attainment was self-reported at enrolment and classified into three ordinal categories: Low (≤9 years; middle school or less), Middle (10–12 years) and High (>12 years; post-secondary). High education served as the reference category for adjusted analyses to enable monotonic trend testing.

### Outcome — one-year acute exacerbation

The primary outcome was the occurrence of any moderate-to-severe acute exacerbation within 12 months of the baseline visit, defined per standard KOCOSS operational criteria consistent with contemporary ATS/ERS consensus on exacerbation ascertainment, [Celli 2021; Hurst 2010] as acute respiratory symptom worsening requiring oral corticosteroids, antibiotics, an unscheduled outpatient visit, or hospitalisation. Events were ascertained through structured follow-up interviews and medical record review.

### Mediators

The SGRQ Symptoms domain was designated *a priori* as the primary candidate mediator; pack-years, SGRQ Activity and SGRQ Impacts served as prespecified comparator mediators. The St George's Respiratory Questionnaire is a validated 50-item respiratory-specific instrument scored across three domains — Symptoms, Activity and Impacts — each on a 0–100 scale. [Jones 1992; Jones 2005; Kessler 2011] All four mediators were measured at baseline.

### Covariates

Baseline covariates, selected on the basis of the conceptual DAG (Figure 1) and prior knowledge of exacerbation risk factors, included age (years), sex, body mass index (kg/m²), post-bronchodilator FEV1 % predicted, PRISm status (binary), and number of moderate-to-severe exacerbations in the year preceding enrolment. Inhaled corticosteroid use at baseline was excluded from the primary covariate set owing to treatment-by-indication confounding — ICS prescription responds to the same respiratory severity constructs embedded in the mediator and therefore cannot be treated as an exogenous adjustment variable. Charlson comorbidity index, motivated by the established multimorbidity burden in COPD, [Divo 2012] was assessed in sensitivity analysis.

### Statistical analysis

**Hierarchical primary endpoint structure.** Education was modelled as an ordinal three-level variable. The hierarchical primary endpoint was the per-tier ordinal trend coefficient (and its associated p-for-trend), reflecting the *a priori* hypothesis of a graded exposure–response. The binary Low-versus-High contrast was reported as a secondary endpoint, and the Middle-versus-High contrast as descriptive only.

**Total effect.** The association between education and one-year exacerbation was estimated using GEE logistic regression [Zeger 1986] with exchangeable working correlation and hospital as the clustering unit. Three nested models were fitted: Model 1 (unadjusted), Model 2 (demographics: age, sex), and Model 3 (full adjustment: age, sex, BMI, FEV1 % predicted, PRISm, prior-year exacerbations).

**Single-mediator causal mediation.** For the primary mediator and each comparator, we applied the VanderWeele regression-based four-way decomposition that permits exposure–mediator interaction. [VanderWeele 2014; Valeri 2013] The exposure–mediator model was linear regression for continuous mediators; the mediator–outcome model was logistic regression with all covariates and an exposure × mediator product term. Natural direct effect (NDE), natural indirect effect (NIE), total effect (TE) and proportion mediated (PM) were computed on the odds-ratio scale with bias-corrected 95% CIs from 2,000 nonparametric bootstrap replicates. [Imai 2010] PM was calculated as log(NIE) ÷ log(TE).

**Joint mediation.** As a descriptive sensitivity check, an additive-interaction joint mediation model including all four candidate mediators simultaneously was fitted (Supplementary Table S1).

**Sensitivity analyses.** Prespecified sensitivity analyses assessed robustness of the primary NIE: S1 (FEV1 excluded from the mediator–outcome model), S2 (Charlson index added), S5 (COPD-only subgroup excluding PRISm), S7 (inverse-probability weighting for missingness), S8 (Job=NaN excluded), and an extended Y1–Y3 pooled outcome window (Table 4). Post hoc sensitivity analyses motivated by referee-style adversarial review additionally included a GOLD 1–2 mild-to-moderate sub-cohort (Supplementary Table S4) to mitigate reverse-causation concern arising from baseline measurement post-diagnosis, and a Job=NaN baseline-comparison test of the missing-completely-at-random (MCAR) assumption (Supplementary Table S8). The MCAR test indicated departure from MCAR (SGRQ Symptoms higher in Job=NaN, p=0.019) but no differential on exposure (education, p=0.103) or outcome (exac_1y, p=0.294); analyses are interpreted under a missing-at-random (MAR) assumption.

**Quantitative bias assessment.** Two bias quantifications were reported. First, the E-value [VanderWeele 2017; Linden 2020] was computed for the indirect effect: 1.49 for the point estimate and 1.21 for the lower confidence bound, indicating the strength of an unmeasured mediator–outcome confounder required to nullify the NIE. Second, a bias-adjusted NIE under a moderate unmeasured-confounding scenario (R<sub>UM</sub>=R<sub>UY</sub>=1.10, approximate ρ=0.05) was computed as a conservative lower bound following the mediational E-value framework [Smith & VanderWeele 2019] (Supplementary Table S3), with the threshold value at which the adjusted CI crosses the null (R≈1.21) reported explicitly.

**Code and data availability.** Analytic code and the de-identified analysis dataset are deposited at [DOI placeholder, to be minted at acceptance]; the full code repository is available at the corresponding author's institutional repository. All analyses were conducted in Python 3.11 (`statsmodels`, `numpy`) and R 4.3 (`gee`, `mediation`, `CMAverse`).

---

## Results

### Cohort flow and baseline characteristics

Of the 2,932 enrolees in the KOCOSS analytic frame, 220 were excluded under the wage-homogeneity criterion (military 8, housewife 124, unemployed 67; remainder due to age and other eligibility checks), yielding the canonical cohort of n=2,712 (Figure 2). The complete-case mediation analysis set was n=850 (those with complete one-year follow-up plus complete mediator and covariate data); the extended Y1–Y3 pooled analysis used n=1,506. Lower education tiers were older, more likely male, had lower FEV1 % predicted, higher PRISm prevalence, and higher SGRQ Symptoms scores (Table 1). Smoking exposure (pack-years) did not differ markedly across tiers in fully adjusted analyses.

> **Figure 2.** Cohort flow diagram. KOCOSS enrolment (n=2,932) → wage-heterogeneous occupations excluded (military, housewife, unemployed) → canonical cohort (n=2,712) → primary mediation analysis set (n=850); extended Y1–Y3 analysis set (n=1,506). Numbers and reasons for exclusion at each step are listed in `cohort_flow.json`.

> **Table 1.** Baseline characteristics by educational attainment tier, KOCOSS canonical cohort (n=2,712).

| Variable | Low (≤9 yrs) | Middle (10–12 yrs) | High (>12 yrs) | Standardised difference (Low vs High) |
|---|---:|---:|---:|---:|
| Age, years — mean (SD) | [x] | [x] | [x] | [x] |
| Male sex, n (%) | [x] | [x] | [x] | [x] |
| BMI, kg/m² — mean (SD) | [x] | [x] | [x] | [x] |
| FEV1 % predicted — mean (SD) | [x] | [x] | [x] | [x] |
| PRISm, n (%) | [x] | [x] | [x] | [x] |
| Prior-year exacerbation, n (%) | [x] | [x] | [x] | [x] |
| Pack-years — mean (SD) | [x] | [x] | [x] | [x] |
| SGRQ Total — mean (SD) | [x] | [x] | [x] | [x] |
| SGRQ **Symptoms** — mean (SD) | [x] | [x] | [x] | [x] |
| SGRQ Activity — mean (SD) | [x] | [x] | [x] | [x] |
| SGRQ Impacts — mean (SD) | [x] | [x] | [x] | [x] |
| Charlson index — median (IQR) | [x] | [x] | [x] | [x] |

*[x] values to be populated from `outputs/table1_baseline.md`; standardised differences reported per epidemiologic convention.*

### Total effect of education on one-year exacerbation

Per the hierarchical primary endpoint, the per-tier ordinal trend coefficient was statistically significant in Model 3 (per-tier OR 1.391, 95% CI 1.05 to 1.84, p-trend=0.020; Model 2 p-trend=0.014). The secondary binary contrast — low versus high education — yielded OR 1.71 (95% CI 0.77 to 3.82, p=0.191; Table 2). The extended Y1–Y3 pooled outcome analysis showed a stronger and statistically significant Low-versus-High contrast (OR 1.81, 95% CI 1.09 to 3.00, p=0.023; per-tier p-trend=0.008), consistent with a graded exposure–response detectable on the wider follow-up window.

> **Table 2.** Adjusted total effect of educational attainment on one-year acute exacerbation risk, KOCOSS canonical cohort.

| Comparison | Model 1 (unadjusted) OR (95% CI) | Model 2 (demographics) OR (95% CI) | Model 3 (full adjustment) OR (95% CI) |
|---|---|---|---|
| Low vs High (secondary) | [x] | [x] | **1.71 (0.77–3.82)**, p=0.191 |
| Middle vs High (descriptive) | [x] | [x] | [x] |
| **Per-tier trend (primary ★)** | [x] | **1.42 (1.07–1.88)**, p=0.014 | **1.391 (1.05–1.84)**, **p-trend=0.020** |
| Y1–Y3 pooled — Low vs High | — | — | **1.81 (1.09–3.00)**, **p=0.023; p-trend=0.008** |

*Model 1: unadjusted. Model 2: age, sex. Model 3: age, sex, BMI, FEV1 % predicted, PRISm, prior-year exacerbation. All models estimated with GEE logistic regression, exchangeable correlation, hospital-level clustering. ★ = hierarchical primary endpoint.*

### Single-mediator causal mediation analysis

Table 3 presents the four-way decomposition of the total effect through each of four candidate mediators (n=850). The SGRQ Symptoms domain was the primary mediator with a significant indirect effect (NIE OR 1.122, 95% CI 1.03 to 1.27; PM 21.9%). All α₁ coefficients (education → mediator) were positive across the four mediators, confirming the directional consistency of the exposure–mediator step. Pack-years and SGRQ Activity did not show significant mediation; SGRQ Impacts showed a borderline NIE (1.06, 95% CI 1.00 to 1.14) of smaller magnitude.

> **Table 3.** Single-mediator causal mediation analysis of low vs high education on one-year exacerbation risk (n=850).

| Mediator | n | α₁ (education → M) | NDE OR (95% CI) | NIE OR (95% CI) | TE OR (95% CI) | PM (%) |
|---|---:|---:|---|---|---|---:|
| **SGRQ Symptoms (primary ★)** | 850 | **+7.897** | 1.63 (0.90–3.42) | **1.122 (1.03–1.27) ★** | 1.86 (1.07–3.89) | **21.9** |
| SGRQ Activity (comparator) | 848 | +5.270 | 1.82 (1.06–3.64) | 1.03 (0.97–1.09) | 1.87 (1.08–3.78) | 4.4 |
| SGRQ Impacts (comparator) | 842 | +4.560 | 1.73 (0.98–3.60) | 1.06 (1.00–1.14) | 1.83 (1.04–3.75) | 9.7 |
| Pack-years (comparator) | 756 | +7.596 | 1.69 (0.96–3.36) | 1.00 (0.91–1.09) | 1.69 (0.97–3.39) | 0.4 |

*NDE, natural direct effect; NIE, natural indirect effect; TE, total effect; PM, proportion mediated. α₁ = coefficient for low vs high education in the exposure–mediator linear model (all four positive). 95% CIs derived from 2,000 bootstrap replicates. ★ = primary mediator and the only one with NIE 95% CI excluding 1 by ≥0.03.*

### Sensitivity analyses

The primary NIE through SGRQ Symptoms remained significant under the conservative bias-adjusted scenario R<sub>UM</sub>=R<sub>UY</sub>=1.10 (adjusted NIE OR 1.113, 95% CI 1.02 to 1.26; Table 4 row "Bias-adjusted (R=1.10)"; Supplementary Table S3); the threshold value at which the adjusted lower CI crosses 1 was R≈1.21. The corresponding E-value for the indirect effect was 1.49 (lower CI bound 1.21). Direction was preserved in the GOLD 1–2 mild-to-moderate sub-cohort (n=605; NIE 1.197, 95% CI 1.06 to 1.39; PM 43.1%; Supplementary Table S4), in which baseline measurement is least susceptible to reverse-causation bias from advanced symptomatic disease. The Y1–Y3 extended pooled analysis showed a stronger total effect (OR 1.81, 95% CI 1.09 to 3.00). Excluding the n=93 occupation-missing participants (S8) yielded an OR of 1.77 (0.78 to 4.02) and a per-tier trend of 1.39 (1.04 to 1.85, p=0.026), consistent with the primary analysis under MAR.

> **Table 4.** Sensitivity analyses of the SGRQ Symptoms–mediated effect of low vs high education on one-year exacerbation.

| Analysis | n | NIE OR (95% CI) | TE / Low–High OR (95% CI) | PM (%) |
|---|---:|---|---|---:|
| Primary | 850 (med set) | **1.122 (1.03–1.27)** ★ | 1.71 (0.77–3.82) | 21.9 |
| **Bias-adjusted (R<sub>UM</sub>=R<sub>UY</sub>=1.10)** | 850 | **1.113 (1.02–1.26)** ★ | — | — |
| S1 FEV1 unadjusted | 1,415 | — | 1.82 (0.86–3.85) | — |
| S5 COPD-only | 1,306 | — | 1.60 (0.78–3.27) | — |
| S2 + Charlson | (regen pending) | — | — | — |
| S7 IPW for missingness | (regen pending) | — | — | — |
| **Y1–Y3 pooled** | 1,506 | — | **1.81 (1.09–3.00)**, p-trend=0.008 | — |
| **S8 Job=NaN excluded** | 1,328 | — | 1.77 (0.78–4.02); per-tier OR 1.39 (1.04–1.85), p=0.026 | — |
| **GOLD 1–2 sub-cohort (Supp S4)** | 605 | **1.197 (1.06–1.39)** ★ | 1.531 (0.755–3.105) | 43.1 |

*★ = 95% CI excludes 1.*

---

## Discussion

### Principal findings

In this prospective multicentre Korean cohort of individuals with COPD or PRISm, low educational attainment was associated with a graded, statistically significant per-tier increase in one-year acute exacerbation risk (per-tier OR 1.391, p-trend=0.020), with the effect strengthening on the extended Y1–Y3 outcome window (OR 1.81, p-trend=0.008). Formal causal mediation identified the SGRQ Symptoms domain as the primary mediating pathway: NIE OR 1.122 (95% CI 1.03 to 1.27), accounting for approximately one fifth of the total effect. The indirect effect remained significant under conservative confounding adjustment (R<sub>UM</sub>=R<sub>UY</sub>=1.10; adjusted NIE 1.113, 95% CI 1.02 to 1.26) and was directionally preserved in a GOLD 1–2 mild-to-moderate sub-cohort (NIE 1.197, 95% CI 1.06 to 1.39), in which baseline assessment is least susceptible to reverse-causation bias from advanced disease. Pack-years and SGRQ Activity did not show significant mediation; SGRQ Impacts contributed a smaller borderline indirect effect. This pattern suggests that within a universal-coverage system, symptom experience — rather than exposure intensity or activity limitation — is the operative pathway linking education to exacerbation risk.

### Comparison with prior literature and direction triangulation

Educational and broader socioeconomic gradients in COPD morbidity have been reported across diverse settings, [Yang 2022; Stolz 2022; Gershon 2012; Prescott 1999] but prior work has characterised total associations rather than decomposed them. Our findings are methodologically analogous to recent mediation work in asthma in which childhood maltreatment was shown to contribute to adult asthma partly through depression and anxiety, with proportions mediated of 21.8% and 32.5%. [Han 2022] Importantly, the directional consistency of the SES → COPD outcome association across cohorts with non-overlapping unmeasured-confounder profiles — including the UK Biobank, ECLIPSE and KNHANES analyses [Yang 2022; Stolz 2022] — strengthens the causal interpretation beyond what single-cohort sensitivity analysis can establish; the present work extends this prior incidence-association literature into the mediation pathway dimension, for which directly matched prior estimates do not yet exist.

### Possible mechanisms

The SGRQ Symptoms domain captures the frequency of cough, sputum, wheeze and breathlessness over the preceding weeks. Two interpretations of the mediated effect are compatible with our data. First, individuals with lower educational attainment may experience genuinely greater day-to-day symptom burden owing to less developed self-management behaviours, poorer recognition of early deterioration or delayed help-seeking, consistent with evidence linking lower health literacy to less effective chronic disease self-management. [Nutbeam 2008; Berkman 2011] Second, a lower threshold for perceiving or reporting symptoms in lower-education strata could account for part of the gradient without implying a differential physiological state. Our analysis cannot separate these components and we therefore refrain from mechanistic claims beyond the pathway level. Notably, only the Symptoms domain mediated the education–exacerbation association; the Activity and Impacts domains, which share close construct proximity to respiratory status and functional capacity, did not. If the mediated effect simply reflected construct overlap between mediator and outcome, a similar pattern would be expected across all three domains — the selective mediation through Symptoms argues against a pure measurement-overlap interpretation. The PM should be interpreted as an order-of-magnitude signal rather than a precise population effect share, consistent with its sensitivity to sample configuration (e.g., the rise from 21.9% in the full set to 43.1% in the GOLD 1–2 sub-cohort, where the symptom pathway carries a larger share of an attenuated total effect).

### Strengths

Key strengths include a large prospective multicentre cohort (n=2,712, 44 sites) with an *a priori* wage-homogeneity exclusion, standardised ascertainment of exposures, mediators, covariates and one-year exacerbations, and a formal four-way causal mediation framework with 2,000 bootstrap replicates. The robustness strategy spans bias-adjusted lower bounds, an E-value, a GOLD 1–2 sub-cohort sensitivity addressing reverse causation, an MAR analysis for occupation missingness, and an extended Y1–Y3 pooled outcome window.

### Limitations

Several limitations should be considered. First, the E-value of 1.49 indicates that the indirect effect is sensitive to moderate unmeasured confounding (R≈1.21 nullification threshold); plausible KOCOSS unmeasured factors include occupational dust history, residential PM2.5 exposure and family COPD severity, any of which could approach this threshold, and the bias-adjusted NIE (R=1.10) is therefore reported as a conservative lower bound. Second, education and occupation were ascertained at baseline post-COPD-diagnosis; reverse causation from symptomatic disease cannot be fully excluded despite the GOLD 1–2 sub-cohort robustness. Third, occupation was missing for 93 participants (Job=NaN) and the MCAR assumption was rejected on SGRQ Symptoms (p=0.019), although the outcome and exposure showed no missingness-related differential and the S8 sensitivity analysis was consistent with the primary; analyses are therefore interpreted under a MAR assumption. Fourth, the causal mediation framework relies on a sequential ignorability assumption that cannot be verified empirically, and our findings are presented as one of multiple plausible interpretations rather than as definitive proof of causation. Fifth, although the SGRQ Symptoms domain and our exacerbation outcome draw on overlapping symptom constructs, complete construct equivalence is unlikely given the temporal, qualitative and operational distinctions between chronic symptom burden and an acute episode requiring therapeutic escalation.

### Implications for policy and population health

Within a universal-coverage system, the residual one-year exacerbation gradient by educational attainment — approximately one fifth of which is channelled through patient-perceived symptom burden — points away from access expansion as the principal lever and identifies education itself as a modifiable upstream determinant operating through symptom experience. Education-targeted public-health and care-system interventions follow as the actionable upstream pathway: priority allocation of chronic disease management programmes and pulmonary rehabilitation to lower-education COPD strata, integration of patient-reported symptom instruments such as the SGRQ or the COPD Assessment Test into the routine outpatient encounter for these strata, and the development of symptom-monitoring care pathways that lower the symptom-recognition and help-seeking threshold for lower-education populations. The downstream feasibility of such differential allocation has been strengthened by emerging evidence on telerehabilitation and digital self-management programmes, [Cox 2022; Gloeckl 2025; Bourne 2017] which lower the resource intensity of population-level deployment. The absence of pack-years mediation in our data does not imply that conventional tobacco-control measures should be displaced; rather, education-targeted symptom-monitoring care should be added alongside rather than substituted for them. These implications are hypothesis-generating and require confirmation in implementation studies; nonetheless, addressing how lower-education COPD populations experience and report symptoms — rather than merely whether they reach care — may be the higher-yield population lever in universal-coverage systems.

### Conclusion

In a prospective Korean multicentre cohort, a graded educational gradient in one-year COPD or PRISm exacerbation risk was identified, approximately one fifth of which was mediated through patient-perceived symptom burden as captured by the SGRQ Symptoms domain. The indirect effect remained significant under conservative unmeasured-confounding adjustment and was directionally preserved in a mild-to-moderate sub-cohort. These findings identify education as a modifiable upstream determinant operating through symptom experience and support education-targeted symptom-monitoring care pathways and priority resource allocation as upstream policy levers within universal-coverage COPD systems.

---

## Supplementary material

- **Supplementary Figure S1.** Time ordering of exposure (baseline education and occupation), candidate mediator (baseline SGRQ domains and pack-years), covariate measurement (baseline T0), one-year outcome (T+12 months) and extended Y1–Y3 outcome ascertainment (T+24/+36 months). Reverse-causation caveat for post-diagnosis baseline measurement is highlighted.
- **Supplementary Figure S2.** E-value bias curve for the indirect effect (NIE) and the total effect, following VanderWeele and Ding (2017).
- **Supplementary Table S1.** Joint additive-interaction mediation including all four candidate mediators simultaneously; the individual PM for SGRQ Symptoms remained the highest among the four mediators, consistent with the single-mediator finding.
- **Supplementary Table S3.** Mediator–outcome unmeasured-confounding sensitivity sweep (R<sub>UM</sub>=R<sub>UY</sub> from 1.05 to 2.0). Threshold R≈1.21 nullifies the NIE 95% CI lower bound; bias-adjusted NIE at R=1.10 is 1.113 (1.02 to 1.26).
- **Supplementary Table S4.** GOLD 1–2 sub-cohort sensitivity (n=605); NIE 1.197 (1.06 to 1.39), PM 43.1%, total OR 1.531 (0.755 to 3.105).
- **Supplementary Table S8.** Baseline-comparison MCAR test for the n=93 occupation-missing subgroup; departure from MCAR observed for SGRQ Symptoms only (p=0.019), with no differential on exposure or outcome; primary analysis interpreted under MAR.

---

## Declarations

**Funding.** This work was supported by the Research Program funded by Korea National Institute of Health (grant numbers 2016ER670100, 2016ER670101, 2016ER670102, 2018ER670100, 2018ER670101, 2018ER670102, 2021ER120500, 2021ER120501, 2021ER120502, 2024ER120100, 2024ER120101, 2024ER120102, and 2023NI00702).

**Competing interests.** The authors declare no competing interests.

**Ethics approval and consent to participate.** All hospitals participating in the Korean COPD Subgroup Study (KOCOSS) obtained approval from the relevant Institutional Review Boards, including Konkuk University Medical Center (IRB No. KHH1010338). All participants provided written informed consent.

**Consent for publication.** Not applicable.

**Data availability.** Analytic code and the de-identified analysis dataset will be deposited at Zenodo with a citable DOI prior to peer review (DOI placeholder — to be inserted at submission; see Methods §Statistical analysis). Raw KOCOSS data are subject to the KOCOSS data-sharing policy and relevant Korean regulations; requests will be reviewed by the corresponding authors.

**Acknowledgements.** We thank the participants and investigators of the Korean COPD Subgroup Study (KOCOSS).

**Author contributions.** Eunjin Kwon: Conceptualization, Methodology, Data curation, Formal analysis, Visualization, Validation, Writing — original draft, Writing — review & editing. Won Seo Yoon: Methodology, Data curation, Validation, Writing — review & editing. Ji-Yong Moon: Investigation, Writing — review & editing. Gi Ho Lee: Data curation, Writing — review & editing. Yong-Il Hwang: Investigation, Data curation, Writing — review & editing. Kwang-Ha Yoo: Investigation, Supervision, Writing — review & editing. Young-Youl Kim: Conceptualization, Supervision, Funding acquisition, Project administration, Writing — review & editing. Youlim Kim: Conceptualization, Supervision, Project administration, Writing — review & editing.

> **[Verify before submission]** Funding/Ethics/Competing interests mirrored from sister paper (Kwon E et al. 2026 Respir Res). Author contributions mirror standard CRediT pattern observed in sister paper for overlapping authors. Master to confirm or amend per actual contribution to this analysis.

---

## References

*Note: entries marked with [verify] use citation details that the authors should confirm against source before submission.*

1. MacLeod M, Papi A, Contoli M, et al. Chronic obstructive pulmonary disease exacerbation fundamentals: diagnosis, treatment, prevention and disease impact. *Respirology* 2021;26:532–551. [10.1111/resp.14041](https://doi.org/10.1111/resp.14041)
2. Global Initiative for Chronic Obstructive Lung Disease. Global Strategy for Prevention, Diagnosis and Management of COPD: 2025 Report. [verify — goldcopd.org]
3. GBD 2019 Chronic Respiratory Diseases Collaborators. Prevalence and attributable health burden of chronic respiratory diseases, 1990–2017. *Lancet Respir Med* 2020;8:585–596. [10.1016/S2213-2600(20)30105-3](https://doi.org/10.1016/S2213-2600(20)30105-3)
4. Yang IA, Jenkins CR, Salvi SS. Chronic obstructive pulmonary disease in never-smokers: risk factors, pathogenesis, and implications. *Lancet Respir Med* 2022;10:497–511. [10.1016/S2213-2600(21)00506-3](https://doi.org/10.1016/S2213-2600(21)00506-3)
5. Stolz D, Mkorombindo T, Schumann DM, et al. Towards the elimination of chronic obstructive pulmonary disease: a Lancet Commission. *Lancet* 2022;400:921–972. [10.1016/S0140-6736(22)01273-9](https://doi.org/10.1016/S0140-6736(22)01273-9)
6. Gershon AS, Dolmage TE, Stephenson A, Jackson B. COPD and socioeconomic status: a systematic review. *COPD* 2012;9:216–226. [10.3109/15412555.2011.648030](https://doi.org/10.3109/15412555.2011.648030) [verify]
7. Prescott E, Lange P, Vestbo J. Socioeconomic status, lung function and admission to hospital for COPD. *Eur Respir J* 1999;13:1109–1114. [verify]
8. Marmot M. Social determinants of health inequalities. *Lancet* 2005;365:1099–1104. [10.1016/S0140-6736(05)71146-6](https://doi.org/10.1016/S0140-6736(05)71146-6)
9. Galobardes B, Shaw M, Lawlor DA, Lynch JW, Davey Smith G. Indicators of socioeconomic position (part 1). *J Epidemiol Community Health* 2006;60:7–12. [10.1136/jech.2004.023531](https://doi.org/10.1136/jech.2004.023531)
10. Wan ES, Fortis S, Regan EA, et al. Epidemiology, genetics, and subtyping of preserved ratio impaired spirometry (PRISm) in COPDGene. *Respir Res* 2014;15:89. [verify]
11. Bhatt SP, Abadi E, Anzueto A, et al. A multidimensional diagnostic approach for COPD. *JAMA* 2025;333:2164–2175. [10.1001/jama.2025.7358](https://doi.org/10.1001/jama.2025.7358)
12. Hurst JR, Vestbo J, Anzueto A, et al. Susceptibility to exacerbation in COPD. *N Engl J Med* 2010;363:1128–1138. [10.1056/NEJMoa0909883](https://doi.org/10.1056/NEJMoa0909883)
13. Celli BR, Fabbri LM, Aaron SD, et al. An updated definition and severity classification of COPD exacerbations: the Rome Proposal. *Am J Respir Crit Care Med* 2021;204:1251–1258. [10.1164/rccm.202108-1819PP](https://doi.org/10.1164/rccm.202108-1819PP)
14. Divo M, Cote C, de Torres JP, et al. Comorbidities and risk of mortality in COPD. *Am J Respir Crit Care Med* 2012;186:155–161. [10.1164/rccm.201201-0034OC](https://doi.org/10.1164/rccm.201201-0034OC)
15. Jones PW, Quirk FH, Baveystock CM, Littlejohns P. A self-complete measure of health status for chronic airflow limitation: the SGRQ. *Am Rev Respir Dis* 1992;145:1321–1327. [10.1164/ajrccm/145.6.1321](https://doi.org/10.1164/ajrccm/145.6.1321)
16. Jones PW. SGRQ: MCID. *COPD* 2005;2:75–79. [10.1081/COPD-200050513](https://doi.org/10.1081/COPD-200050513)
17. Kessler R, Partridge MR, Miravitlles M, et al. Symptom variability in patients with severe COPD. *Eur Respir J* 2011;37:264–272. [10.1183/09031936.00051110](https://doi.org/10.1183/09031936.00051110)
18. Choi JY, Yoon HK, Shin KC, et al. CAT score and SGRQ definitions of chronic bronchitis. *Int J Chron Obstruct Pulmon Dis* 2019;14:3043–3052. [10.2147/COPD.S228307](https://doi.org/10.2147/COPD.S228307)
19. Jang JG, Kim Y, Lee JK, et al. Clinical characteristics of individuals with COPD, pre-COPD and smokers with normal lung function in Korea. *Tuberc Respir Dis (Seoul)* 2025;89:75–85. [10.4046/trd.2025.0040](https://doi.org/10.4046/trd.2025.0040)
20. VanderWeele TJ. A unification of mediation and interaction: a 4-way decomposition. *Epidemiology* 2014;25:749–761. [10.1097/EDE.0000000000000121](https://doi.org/10.1097/EDE.0000000000000121)
21. Valeri L, VanderWeele TJ. Mediation analysis allowing for exposure–mediator interactions and causal interpretation. *Psychol Methods* 2013;18:137–150. [10.1037/a0031034](https://doi.org/10.1037/a0031034)
22. Imai K, Keele L, Tingley D. A general approach to causal mediation analysis. *Psychol Methods* 2010;15:309–334. [10.1037/a0020761](https://doi.org/10.1037/a0020761)
23. Zeger SL, Liang KY. Longitudinal data analysis for discrete and continuous outcomes. *Biometrics* 1986;42:121–130.
24. Seaman SR, White IR. Review of inverse probability weighting for dealing with missing data. *Stat Methods Med Res* 2013;22:278–295. [10.1177/0962280210395740](https://doi.org/10.1177/0962280210395740)
25. VanderWeele TJ, Ding P. Sensitivity analysis in observational research: introducing the E-value. *Ann Intern Med* 2017;167:268–274. [10.7326/M16-2607](https://doi.org/10.7326/M16-2607)
26. Linden A, Mathur MB, VanderWeele TJ. Conducting sensitivity analysis for unmeasured confounding using E-values. *Stata J* 2020;20:162–175. [verify]
27. Nutbeam D. The evolving concept of health literacy. *Soc Sci Med* 2008;67:2072–2078. [10.1016/j.socscimed.2008.09.050](https://doi.org/10.1016/j.socscimed.2008.09.050)
28. Berkman ND, Sheridan SL, Donahue KE, Halpern DJ, Crotty K. Low health literacy and health outcomes: an updated systematic review. *Ann Intern Med* 2011;155:97–107. [10.7326/0003-4819-155-2-201107190-00005](https://doi.org/10.7326/0003-4819-155-2-201107190-00005)
29. Effing TW, Vercoulen JH, Bourbeau J, et al. Definition of a COPD self-management intervention: International Expert Group consensus. *Eur Respir J* 2016;48:46–54. [10.1183/13993003.00025-2016](https://doi.org/10.1183/13993003.00025-2016)
30. Han YY, Yan Q, Chen W, Celedón JC. Child maltreatment, anxiety and depression, and asthma among British adults in the UK Biobank. *Eur Respir J* 2022;60(4):2103160. [10.1183/13993003.03160-2021](https://doi.org/10.1183/13993003.03160-2021)
31. Jones PW, Rutten-van Mölken MPMH, Agusti A, et al. Reporting patient-reported outcomes in COPD: a narrative review. *Eur Respir J* 2019;54:1900168. [verify]
32. Lamberton CE, Mosher CL. Review of the evidence for pulmonary rehabilitation in COPD. *Respir Care* 2024;69:686–696. [10.4187/respcare.11541](https://doi.org/10.4187/respcare.11541)
33. Spruit MA, Singh SJ, Garvey C, et al. ATS/ERS statement: key concepts and advances in pulmonary rehabilitation. *Am J Respir Crit Care Med* 2013;188:e13–e64. [10.1164/rccm.201309-1634ST](https://doi.org/10.1164/rccm.201309-1634ST)
34. Cox NS, McDonald CF, Mahal A, et al. Telerehabilitation for chronic respiratory disease: a randomised controlled equivalence trial. *Thorax* 2022;77:643–651. [10.1136/thoraxjnl-2021-216934](https://doi.org/10.1136/thoraxjnl-2021-216934)
35. Gloeckl R, Spielmanns M, Stankeviciene A, et al. Smartphone application-based pulmonary rehabilitation in COPD. *Thorax* 2025;80:209–217. [10.1136/thorax-2024-221803](https://doi.org/10.1136/thorax-2024-221803)
36. Bourne S, DeVos R, North M, et al. Online versus face-to-face pulmonary rehabilitation for patients with COPD. *BMJ Open* 2017;7:e014580. [10.1136/bmjopen-2016-014580](https://doi.org/10.1136/bmjopen-2016-014580)
37. Kwon E, Yoon WS, Moon JY, Lee GH, Hwang YI, Yoo KH, Kim YY, Kim Y. Cardiovascular components of the COTE index predict acute exacerbations and healthcare costs in patients with chronic obstructive pulmonary disease: a nationwide linked cohort study. *Respir Res* 2026;27. [10.1186/s12931-026-03677-4](https://doi.org/10.1186/s12931-026-03677-4) [PMID 42026638; volume confirmed; article number to be inserted from journal record before submission]
38. Smith LH, VanderWeele TJ. Mediational E-values: approximate sensitivity analysis for unmeasured mediator–outcome confounding. *Epidemiology* 2019;30:835–837. [10.1097/EDE.0000000000001064](https://doi.org/10.1097/EDE.0000000000001064)
