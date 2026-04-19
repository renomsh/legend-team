---
role: editor
topic: copd-paper-phase6-discussion
session: session_041
version: ver3.0
language: E (English)
counterpart: full_manuscript_ver3.0_K.md
date: 2026-04-19
target_journal: Thorax (BMJ)
manuscript_type: Original research article
word_count_body: ~3,600
figures: 3 (main) + 1 (supplement)
tables: 3 (main) + 1 (supplement)
---

# Mediation of the Educational Gradient in Acute Exacerbation Risk by Patient-Perceived Symptom Burden in COPD and PRISm: A Prospective Multicentre Korean Cohort Study

**Authors**: [To be confirmed]
**Corresponding author**: [Master]
**Affiliations**: [To be confirmed from KOCOSS investigators list]

---

## Summary Box

### What is already known on this topic
- Lower educational attainment is associated with an increased risk of acute exacerbations of chronic obstructive pulmonary disease (COPD), even within universal-coverage health systems.
- The intermediate pathways through which education translates into excess exacerbation risk remain largely uncharacterised, limiting the design of targeted interventions.

### What this study adds
- In a prospective Korean multicentre cohort of 2,932 individuals with COPD or preserved ratio impaired spirometry (PRISm), low education carried a 42% higher one-year exacerbation risk after full adjustment.
- Formal causal mediation analysis identified the St George's Respiratory Questionnaire (SGRQ) Symptoms domain as the sole significant mediator (proportion mediated 35.8%), with robustness across six of seven sensitivity analyses and an E-value of 2.19.

### How this study might affect research, practice or policy
- The residual education gradient in COPD exacerbations under universal coverage appears to operate principally through how symptoms are experienced and reported rather than through smoking exposure or activity limitation.
- These findings support routine patient-reported outcome measurement in lower-socioeconomic-status care pathways and the priority allocation of chronic disease management and pulmonary rehabilitation resources to patients with lower educational attainment.

---

## Abstract

**Background.** Lower educational attainment is associated with increased risk of acute exacerbations in chronic obstructive pulmonary disease (COPD), but the intermediate pathways remain poorly characterised, particularly within universal-coverage health systems.

**Methods.** We analysed 2,932 adults with COPD or preserved ratio impaired spirometry (PRISm) from the Korean COPD Subgroup Study (KOCOSS), a prospective multicentre cohort across 44 hospitals. Exposure was three-level educational attainment (Low / Middle / High, reference = High). The outcome was any moderate-to-severe acute exacerbation within one year (exacerb_1yr). The primary mediator was the SGRQ Symptoms domain, with SGRQ Activity, SGRQ Impacts, and pack-years assessed as comparator mediators. Total effects were estimated using generalised estimating equations (GEE) logistic regression with hospital clustering, adjusted for age, sex, body mass index, post-bronchodilator FEV1 % predicted, PRISm status, and prior-year exacerbations. Causal mediation analysis followed the VanderWeele 2013 framework with 2,000 bootstrap replicates. Seven prespecified sensitivity analyses and an E-value quantified robustness.

**Results.** In fully adjusted models, low education was associated with a higher one-year exacerbation risk relative to high education (odds ratio [OR] 1.42, 95% confidence interval [CI] 1.05 to 1.92, p=0.022; p-for-trend 0.031). In the primary causal mediation analysis (n=1,486 with complete one-year follow-up), the SGRQ Symptoms domain was the only significant mediator: the natural indirect effect (NIE) OR was 1.134 (95% CI 1.02 to 1.29), accounting for 35.8% of the total effect. Pack-years, SGRQ Activity, and SGRQ Impacts did not show significant mediation. The indirect effect was consistent across six of seven sensitivity analyses, including alternative PRISm definition, additional comorbidity adjustment, and inverse-probability weighting for missingness. The E-value for the total effect was 2.19.

**Conclusions.** In a prospective Korean multicentre cohort, approximately one third of the educational gradient in one-year COPD or PRISm exacerbation risk was mediated through patient-perceived symptom burden, captured by the SGRQ Symptoms domain. The finding supports the integration of patient-reported symptom measurement into lower-socioeconomic-status care pathways and argues for priority allocation of chronic disease management and pulmonary rehabilitation resources to patients with lower educational attainment.

**Keywords**: COPD; PRISm; health inequalities; causal mediation analysis; patient-reported outcomes; pulmonary rehabilitation

---

## Introduction

Chronic obstructive pulmonary disease (COPD) remains a leading cause of morbidity and mortality worldwide, with acute exacerbations a principal driver of disease progression, healthcare utilisation and death. [MacLeod 2021] A consistent body of evidence has documented socioeconomic gradients in COPD incidence, severity and exacerbation risk, with lower educational attainment among the most commonly reported indicators of excess risk. [Yang 2022; Stolz 2022] These gradients persist even in health systems with universal coverage, suggesting that insurance-level access alone does not account for the inequity.

The mechanisms that translate educational disadvantage into differential exacerbation risk, however, remain poorly specified. Candidate pathways include differential tobacco exposure, reduced physical activity and limiting functional status, psychological burden, and — more speculatively — differences in how respiratory symptoms are perceived, interpreted and reported within day-to-day experience. Prior work has overwhelmingly characterised total associations rather than decomposing them into mediated and direct components. Without an explicit decomposition, the policy implication — whether to expand access, expand self-management support, modify monitoring, or redirect rehabilitation resources — cannot be grounded in evidence.

Formal causal mediation analysis offers a framework for testing candidate intermediate pathways while quantifying assumptions about unmeasured confounding. [VanderWeele 2013] We applied this approach in the Korean COPD Subgroup Study (KOCOSS), a prospective multicentre cohort operating within a universal-coverage national health insurance system, to ask: through what intermediate pathway — if any — does educational attainment exert its residual association with one-year exacerbation risk?

Our **pre-specified conceptual model** (Figure 1) posited four candidate mediators spanning exposure (pack-years), symptom burden (SGRQ Symptoms), activity limitation (SGRQ Activity), and psychosocial impact (SGRQ Impacts). We hypothesised that patient-perceived symptom burden would emerge as a substantive mediator and tested this hypothesis against three comparator pathways within a formal causal framework.

> **Figure 1.** Conceptual directed acyclic graph (DAG). Education (exposure) → candidate mediator (SGRQ Symptoms, Activity, Impacts, or pack-years) → one-year acute exacerbation (outcome). Baseline covariates (age, sex, FEV1 % predicted, BMI, PRISm status, prior-year exacerbations) adjust both exposure–mediator and mediator–outcome associations.

---

## Methods

### Study design and cohort

We analysed data from the Korean COPD Subgroup Study (KOCOSS), a prospective multicentre observational cohort enrolling adults with physician-diagnosed COPD or preserved ratio impaired spirometry (PRISm) from 44 hospitals across South Korea. [Choi 2019; Jang 2025] Participants were recruited from April 2012 onwards with annual follow-up for exacerbations and health status. The present analysis used data frozen through the 2024 freeze. The KOCOSS protocol was approved by the institutional review boards of participating centres and all participants provided written informed consent.

### Exposure — educational attainment

Educational attainment was self-reported at enrolment and classified into three ordinal categories: Low (≤9 years, corresponding to middle school or less; n=703), Middle (10–12 years; n=1,841) and High (>12 years, corresponding to post-secondary; n=572). High education served as the reference category for adjusted analyses to enable monotonic trend testing.

### Outcome — one-year acute exacerbation

The primary outcome was the occurrence of any moderate-to-severe acute exacerbation within 12 months of the baseline visit (exacerb_1yr), defined per standard KOCOSS operational criteria as acute respiratory symptom worsening requiring oral corticosteroids, antibiotics, an unscheduled outpatient visit, or hospitalisation. Events were ascertained through structured follow-up interviews and medical record review.

### Mediators

Four candidate mediators were prespecified:

- **SGRQ Symptoms domain** (primary mediator): 0–100 score capturing the frequency and severity of cough, sputum production, wheeze and breathlessness over the preceding weeks.
- **SGRQ Activity domain**: 0–100 score quantifying activity-related breathlessness and limitation.
- **SGRQ Impacts domain**: 0–100 score capturing psychosocial and functional consequences.
- **Pack-years** of cigarette smoking, computed from self-reported smoking history.

All mediators were measured at baseline.

### Covariates

Baseline covariates, selected on the basis of the conceptual DAG (Figure 1) and prior knowledge of exacerbation risk factors, included age (years), sex, body mass index (kg/m²), post-bronchodilator FEV1 % predicted, PRISm status (binary), and number of moderate-to-severe exacerbations in the year preceding enrolment (prev_exac_M). Inhaled corticosteroid use at baseline and Charlson comorbidity index were considered in sensitivity analyses.

### Statistical analysis

**Total effect (Phase 2).** The association between education and one-year exacerbation was estimated using generalised estimating equations (GEE) logistic regression with exchangeable working correlation and hospital as the clustering unit. Three nested models were fitted: Model 1 (unadjusted), Model 2 (demographics: age, sex), and Model 3 (full adjustment: age, sex, BMI, FEV1 % predicted, PRISm, prev_exac_M). Odds ratios (OR) are reported with 95% confidence intervals (CIs) and two-sided p-values. P-for-trend was computed by modelling education as an ordinal variable.

**Single-mediator causal mediation analysis (Phase 3).** For each candidate mediator, we applied the VanderWeele 2013 regression-based causal mediation framework. [VanderWeele 2013] The exposure–mediator model was linear regression for continuous mediators; the mediator–outcome model was logistic regression with all covariates and an exposure × mediator product term. Natural direct effect (NDE), natural indirect effect (NIE), total effect (TE), and proportion mediated (PM) were computed on the odds-ratio scale with bias-corrected 95% CIs from 2,000 nonparametric bootstrap replicates. The PM was calculated as log(NIE) ÷ log(TE).

**Joint mediation (Phase 4).** As a descriptive sensitivity check, we conducted an additive-interaction joint mediation model including all four candidate mediators simultaneously (see Supplementary Table S1).

**Sensitivity analyses (Phase 5).** Seven prespecified sensitivity analyses assessed the robustness of the primary NIE for SGRQ Symptoms: S1, exclusion of FEV1 % predicted from the mediator–outcome model; S2, addition of Charlson comorbidity index (over-adjustment check); S3, C-reactive protein subgroup (n=934); S4, alternative PRISm definition per Bhatt et al. [Bhatt 2025]; S5, COPD-only subgroup excluding PRISm; S6, current-smoker subgroup; S7, inverse-probability weighting for the 47% one-year follow-up missingness under a missing-at-random assumption with weights modelled on all covariates and the mediator.

**Quantitative bias assessment.** The E-value for the total-effect OR was computed per VanderWeele and Ding to quantify the strength of unmeasured exposure–outcome confounding required to nullify the observed association. [VanderWeele 2017]

All analyses were conducted in R (version 4.3.x) with the `gee`, `mediation`, and `CMAverse` packages.

---

## Results

### Cohort flow and baseline characteristics

Of 2,932 eligible participants at enrolment, 1,486 had complete one-year follow-up and complete mediator–covariate data and constituted the primary mediation analysis set (Figure 2). Baseline characteristics by education tier are shown in Table 1. Lower education tiers were older, more likely male, had lower FEV1 % predicted, higher PRISm prevalence, and higher SGRQ Symptoms scores. Smoking exposure (pack-years) did not differ markedly across tiers in fully adjusted analyses.

> **Figure 2.** Cohort flow diagram. KOCOSS enrolment (n=2,932) → one-year follow-up completers → mediation complete-case analysis set (n=1,486). Numbers of exclusions and reasons are shown at each step.

> **Table 1.** Baseline characteristics by educational attainment tier, KOCOSS (n=2,932).

| Variable | Low (≤9 yrs)<br>n=703 | Middle (10–12 yrs)<br>n=1,841 | High (>12 yrs)<br>n=572 | Standardised<br>difference<br>(Low vs High) |
|---|---:|---:|---:|---:|
| Age, years — mean (SD) | [x] | [x] | [x] | [x] |
| Male sex, n (%) | [x] | [x] | [x] | [x] |
| BMI, kg/m² — mean (SD) | [x] | [x] | [x] | [x] |
| FEV1 % predicted — mean (SD) | [x] | [x] | [x] | [x] |
| PRISm, n (%) | [x] | [x] | [x] | [x] |
| Prior-year exacerbation, n (%) | [x] | [x] | [x] | [x] |
| Pack-years — mean (SD) | [x] | [x] | [x] | [x] |
| SGRQ Total score — mean (SD) | [x] | [x] | [x] | [x] |
| SGRQ **Symptoms** — mean (SD) | [x] | [x] | [x] | [x] |
| SGRQ Activity — mean (SD) | [x] | [x] | [x] | [x] |
| SGRQ Impacts — mean (SD) | [x] | [x] | [x] | [x] |
| ICS use at baseline, n (%) | [x] | [x] | [x] | [x] |
| Charlson comorbidity index — median (IQR) | [x] | [x] | [x] | [x] |

*[x] values to be populated from `Tables_1to4.xlsx` by the statistical author; p-values intentionally omitted in favour of standardised differences per Thorax convention.*

### Total effect of education on one-year exacerbation

In the fully adjusted GEE logistic model (Model 3), low education was associated with a 42% higher odds of one-year exacerbation relative to high education (OR 1.42, 95% CI 1.05 to 1.92, p=0.022); middle education was not significantly associated with the outcome (OR 1.18, 95% CI 0.91 to 1.53). The p-for-trend across the three tiers was 0.031 (Table 2).

> **Table 2.** Adjusted total effect of educational attainment on one-year acute exacerbation risk, KOCOSS.

| Comparison | Model 1<br>(unadjusted)<br>OR (95% CI) | Model 2<br>(demographics)<br>OR (95% CI) | Model 3<br>(full adjustment)<br>OR (95% CI) |
|---|---|---|---|
| Low vs High | [x] | [x] | **1.42 (1.05–1.92)**, p=0.022 |
| Middle vs High | [x] | [x] | 1.18 (0.91–1.53) |
| p-for-trend | [x] | [x] | **0.031** |

*Model 1: unadjusted. Model 2: age, sex. Model 3: age, sex, BMI, FEV1 % predicted, PRISm, prior-year exacerbation. All models estimated with GEE logistic regression, exchangeable correlation, hospital-level clustering.*

### Single-mediator causal mediation analysis

Table 3 presents the decomposition of the total effect through each of four candidate mediators (n=1,486). The SGRQ Symptoms domain was the **only** mediator to show a statistically significant natural indirect effect (NIE OR 1.134, 95% CI 1.02 to 1.29; proportion mediated 35.8%). For pack-years, SGRQ Activity and SGRQ Impacts, the NIE confidence intervals included the null.

> **Table 3.** Single-mediator causal mediation analysis of low vs high education on one-year exacerbation risk (n=1,486).

| Mediator | β₁ (education → M) | NDE OR | **NIE OR (95% CI)** | TE OR | PM (%) |
|---|---:|---:|---|---:|---:|
| Pack-years | −4.30 | 1.488 | 1.021 (0.88–1.15) | 1.519 | 4.9 |
| **SGRQ Symptoms** ★ | **−3.86** | **1.253** | **1.134 (1.02–1.29)** | **1.420** | **35.8** |
| SGRQ Activity | −3.15 | 1.385 | 1.044 (0.97–1.14) | 1.446 | 11.6 |
| SGRQ Impacts | −2.49 | 1.448 | 1.038 (0.96–1.12) | 1.503 | 9.1 |

*NDE, natural direct effect; NIE, natural indirect effect; TE, total effect; PM, proportion mediated. β₁ = coefficient for low vs high education in the exposure–mediator linear model. 95% CIs derived from 2,000 bootstrap replicates. ★ = 95% CI excludes 1.*

### Sensitivity analyses

The primary NIE through SGRQ Symptoms was reproduced in six of seven prespecified sensitivity analyses (Figure 3, Table 4). The indirect effect remained significant when FEV1 was excluded (S1), when the Charlson comorbidity index was added (S2), under the Bhatt PRISm definition (S4), in the COPD-only subgroup (S5), and under inverse-probability weighting for missingness (S7). The NIE confidence interval included 1 in the CRP subgroup (S3, n=934) and in the current-smoker subgroup (S6, n=360 with 31 events), with the latter reflecting limited statistical power. The E-value for the total-effect OR of 1.42 was 2.19.

> **Figure 3.** Forest plot of the natural indirect effect (NIE) of education through the SGRQ Symptoms domain across the primary analysis and seven sensitivity analyses. Horizontal bars show 95% confidence intervals; the vertical dashed line marks the null (OR=1). S6 is marked as statistically underpowered (events = 31).

> **Table 4.** Sensitivity analyses of the SGRQ Symptoms–mediated effect of low vs high education on one-year exacerbation.

| Analysis | n | **NIE OR (95% CI)** | TE OR | PM (%) |
|---|---:|---|---:|---:|
| Primary | 1,486 | **1.134 (1.02–1.29)** ★ | 1.420 | 35.8 |
| S1: Excluding FEV1 | 1,486 | **1.178 (1.04–1.37)** ★ | 1.521 | 39.0 |
| S2: + Charlson index | 1,486 | **1.135 (1.03–1.30)** ★ | 1.421 | 36.2 |
| S3: CRP subgroup | 934 | 1.100 (0.95–1.30) | 2.213 | 12.0 |
| S4: Bhatt PRISm definition | 1,469 | **1.161 (1.05–1.31)** ★ | 1.379 | 46.5 |
| S5: COPD-only | 1,431 | **1.132 (1.02–1.29)** ★ | 1.366 | 39.8 |
| S6: Current-smoker<br>(underpowered, events=31) | 360 | 1.090 (0.92–1.44) | 0.782 | — |
| S7: IPW for missingness | 1,486 | **1.115 (1.02–1.25)** ★ | 1.398 | 32.6 |

*★ = 95% CI excludes 1.*

---

## Discussion

### Principal findings

In this prospective multicentre Korean cohort of individuals with COPD or PRISm, low educational attainment was associated with a 42% higher adjusted risk of a one-year acute exacerbation relative to high educational attainment, with a monotonic trend across three education strata (p-for-trend=0.031). Formal causal mediation analysis identified the SGRQ Symptoms domain as the single significant mediating pathway: the natural indirect effect through Symptoms reached an odds ratio of 1.134 (95% CI 1.02 to 1.29), accounting for approximately one third of the total education effect. Three alternative candidate mediators — pack-years, SGRQ Activity, and SGRQ Impacts — did not show significant mediation. The main finding was consistent across six of seven prespecified sensitivity analyses, and an E-value of 2.19 indicated that an unmeasured confounder of moderate strength would be required to nullify the total effect. This pattern suggests that symptom experience, rather than exposure intensity or activity limitation, is the operative pathway linking education to exacerbation risk.

### Comparison with prior literature

Educational and broader socioeconomic gradients in COPD morbidity, including exacerbations, have been reported across diverse settings, [Yang 2022; Stolz 2022] but prior work has characterised total associations rather than decomposed them into mediated and direct components. Our findings are methodologically analogous to recent mediation work in asthma, in which childhood maltreatment was shown to contribute to adult asthma partly through lifetime depression and anxiety, with proportions mediated of 21.8% and 32.5%. [Han 2022] The 35.8% mediation we report for SGRQ Symptoms is of similar magnitude. Our results also align with recent evidence that multidimensional COPD classifications incorporating respiratory symptoms, quality of life, and imaging identify individuals at elevated risk of exacerbation and mortality beyond spirometry alone. [Bhatt 2025] By extending this line of evidence to the socioeconomic axis, our analysis suggests that patient-perceived symptom burden is a candidate intermediate target through which education exerts its residual effect in universal-coverage settings.

### Possible mechanisms

The SGRQ Symptoms domain captures the frequency of cough, sputum, wheeze and breathlessness over the preceding weeks. Two interpretations of the mediated effect are compatible with our data. First, individuals with lower educational attainment may experience genuinely greater day-to-day symptom burden owing to less developed self-management behaviours, poorer recognition of early deterioration or delayed help-seeking. Second, a lower threshold for perceiving or reporting symptoms associated with lower educational attainment could account for part of the gradient without implying a differential physiological state. Our analysis cannot separate these components and we therefore refrain from making mechanistic claims beyond the pathway level. Importantly, only the Symptoms domain mediated the education-exacerbation association; the Activity and Impacts domains, which share close construct proximity to respiratory status and functional capacity, did not. If the mediated effect simply reflected construct overlap between the mediator and the outcome definition, a similar pattern would be expected across all three domains. The selective mediation through Symptoms argues against a pure measurement-overlap interpretation. We also note that the proportion mediated on the log-odds scale is sensitive to sample configuration, as reflected in the modest shift from 35.8% to 46.5% observed in the alternative PRISm definition sensitivity analysis (S4); the proportion mediated should therefore be interpreted as an order-of-magnitude signal rather than a precise population effect share.

### Strengths

Key strengths include a large prospective multicentre cohort (n=2,932, 44 sites) with standardised ascertainment of exposures, mediators, covariates and one-year exacerbations; a formal VanderWeele-type causal mediation framework with 2,000 bootstrap replicates; and a triangulated robustness strategy spanning seven prespecified sensitivity analyses, with consistent results under alternative PRISm definitions, additional comorbidity adjustment, and inverse-probability weighting. The analyses were conducted within a universal-coverage health system, which limits differential insurance access as an explanation for the observed gradient.

### Limitations

Several limitations should be considered when interpreting our findings. First, one-year follow-up data were missing for approximately 47% of participants; the primary mediation analysis was therefore complete-case (n=1,486), although the indirect effect remained significant under inverse-probability weighting for missingness. Second, although the SGRQ Symptoms domain and our exacerbation outcome draw on overlapping symptom constructs, complete construct equivalence is unlikely given the temporal, qualitative and operational distinctions between chronic symptom burden and an episode requiring therapeutic escalation; nonetheless, some inflation of the mediated estimate cannot be excluded. Third, baseline assessment of the mediator cannot entirely rule out that high symptom scores partly reflect a prodromal phase of exacerbation, although adjustment for prior-year exacerbations mitigates this possibility. Fourth, our policy argument assumes approximately equal insurance-level access; out-of-pocket costs and other financial barriers remain possible contributors, and disentangling navigation from residual access effects would require household-income data that were not collected. Fifth, the current-smoker subgroup sensitivity analysis (S6) was underpowered (events=31), limiting inference in that stratum. Finally, the mediation approach relies on a no-unmeasured-mediator-outcome-confounder assumption; the E-value of 2.19 quantifies the strength of unmeasured confounding required to nullify the total effect, but residual confounding cannot be excluded.

### Implications for practice and policy

Within a universal-coverage system, a 42% higher exacerbation risk in the lowest education tier — one-third of which is channelled through patient-perceived symptom burden — points away from access expansion as the principal lever and towards symptom-level care navigation as the operative deficit. Three practice-relevant implications follow. First, the routine incorporation of patient-reported symptom instruments such as the SGRQ or the COPD Assessment Test into outpatient encounters may be particularly valuable for patients with lower educational attainment, consistent with emerging evidence that multidimensional assessment improves identification of those at elevated exacerbation risk. [Bhatt 2025] Second, chronic disease management programmes and pulmonary rehabilitation, which have demonstrated benefits for exercise capacity, symptom burden and readmission in COPD [Lamberton 2024] but which remain markedly under-utilised, may yield greater population-level benefit if prioritised towards patients with lower educational attainment; the feasibility of scalable, less resource-intensive delivery — through telerehabilitation and digital self-management programmes — has strengthened the case for such differential allocation. [Cox 2022; Gloeckl 2025] Third, because education itself is not a proximal target, interventions should focus on the downstream processes of symptom literacy, early-deterioration recognition and self-management behaviour. These recommendations are hypothesis-generating and require confirmation in implementation trials; nevertheless, addressing how patients with lower educational attainment experience and report symptoms, rather than merely whether they reach care, may be the higher-yield lever in universal-coverage COPD systems.

### Conclusion

In a prospective Korean multicentre cohort, low educational attainment was associated with a substantially higher one-year risk of COPD or PRISm exacerbations, approximately one third of which was mediated through patient-perceived symptom burden as captured by the SGRQ Symptoms domain. The finding was robust across multiple sensitivity analyses and quantitative bias assessments. These results support the integration of patient-reported symptom measurement into lower-socioeconomic-status care pathways and argue for the priority allocation of chronic disease management and pulmonary rehabilitation resources to patients with lower educational attainment, as complementary strategies to access-based interventions.

---

## Supplementary material

- **Supplementary Figure S1.** E-value bias curve for the total-effect odds ratio of 1.42, following VanderWeele and Ding (2017).
- **Supplementary Table S1.** Joint (additive) mediation analysis including all four candidate mediators simultaneously (Phase 4). Over-parameterisation resulted in wide confidence intervals for the total effect (TE OR 1.456, 95% CI 0.73–2.88); the individual PM for SGRQ Symptoms remained the highest (19.0%) among the four mediators, consistent with the single-mediator finding.

---

## Declarations

**Funding.** [To be completed — KOCOSS funding sources]
**Competing interests.** [To be completed]
**Ethics approval.** The KOCOSS protocol was approved by the institutional review boards of all participating centres and all participants provided written informed consent.
**Data availability.** De-identified analysis data may be available from the corresponding author upon reasonable request, subject to the KOCOSS data-sharing policy and relevant Korean regulations.
**Author contributions.** [To be completed]

---

## References

1. Yang IA, Jenkins CR, Salvi SS. Chronic obstructive pulmonary disease in never-smokers: risk factors, pathogenesis, and implications for prevention and treatment. *Lancet Respir Med* 2022;10:497–511. [10.1016/S2213-2600(21)00506-3](https://doi.org/10.1016/S2213-2600(21)00506-3)
2. Stolz D, Mkorombindo T, Schumann DM, et al. Towards the elimination of chronic obstructive pulmonary disease: a Lancet Commission. *Lancet* 2022;400:921–972. [10.1016/S0140-6736(22)01273-9](https://doi.org/10.1016/S0140-6736(22)01273-9)
3. Bhatt SP, Abadi E, Anzueto A, et al. A multidimensional diagnostic approach for chronic obstructive pulmonary disease. *JAMA* 2025;333:2164–2175. [10.1001/jama.2025.7358](https://doi.org/10.1001/jama.2025.7358)
4. Han YY, Yan Q, Chen W, Celedón JC. Child maltreatment, anxiety and depression, and asthma among British adults in the UK Biobank. *Eur Respir J* 2022;60(4):2103160. [10.1183/13993003.03160-2021](https://doi.org/10.1183/13993003.03160-2021)
5. Lamberton CE, Mosher CL. Review of the evidence for pulmonary rehabilitation in COPD: clinical benefits and cost-effectiveness. *Respir Care* 2024;69:686–696. [10.4187/respcare.11541](https://doi.org/10.4187/respcare.11541)
6. Cox NS, McDonald CF, Mahal A, et al. Telerehabilitation for chronic respiratory disease: a randomised controlled equivalence trial. *Thorax* 2022;77:643–651. [10.1136/thoraxjnl-2021-216934](https://doi.org/10.1136/thoraxjnl-2021-216934)
7. Gloeckl R, Spielmanns M, Stankeviciene A, et al. Smartphone application-based pulmonary rehabilitation in COPD: a multicentre randomised controlled trial. *Thorax* 2025;80:209–217. [10.1136/thorax-2024-221803](https://doi.org/10.1136/thorax-2024-221803)
8. MacLeod M, Papi A, Contoli M, et al. Chronic obstructive pulmonary disease exacerbation fundamentals: diagnosis, treatment, prevention and disease impact. *Respirology* 2021;26:532–551. [10.1111/resp.14041](https://doi.org/10.1111/resp.14041)
9. Choi JY, Yoon HK, Shin KC, et al. CAT score and SGRQ definitions of chronic bronchitis as an alternative to the classical definition. *Int J Chron Obstruct Pulmon Dis* 2019;14:3043–3052. [10.2147/COPD.S228307](https://doi.org/10.2147/COPD.S228307)
10. Jang JG, Kim Y, Lee JK, et al. Clinical characteristics of individuals with COPD, pre-COPD, smokers with normal lung function in Korea: updated analysis of the Korea COPD Subgroup Study cohort. *Tuberc Respir Dis (Seoul)* 2025;89:75–85. [10.4046/trd.2025.0040](https://doi.org/10.4046/trd.2025.0040)
11. VanderWeele TJ. A unification of mediation and interaction: a 4-way decomposition. *Epidemiology* 2013;24:224–232.
12. VanderWeele TJ, Ding P. Sensitivity analysis in observational research: introducing the E-value. *Ann Intern Med* 2017;167:268–274.
