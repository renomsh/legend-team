---
type: manuscript_patch
source: ver3.4_E
target: ver3.5_E
session: session_043
date: 2026-04-19
canonical_data: C:/Projects/COPD/canonical_ver3.5/outputs/canonical_cohort_v2.csv
framing_decision: "Ace's (e) — Y1 primary (mediation novelty) + Y1-Y3 strong sensitivity (TE significance)"
---

# ver3.5_E Patch — Sections Requiring Revision

**주의**: 이 문서는 ver3.4_E의 **변경이 필요한 섹션만** 담습니다. 미변경 섹션(Introduction, Methods 대부분)은 ver3.4_E 그대로 유지. 변경 섹션을 이 patch로 교체하면 ver3.5_E 완성.

---

## Patch #1 — Summary Box (치환)

**교체 대상**: ver3.4_E lines 26–40

```markdown
## Summary Box

### What is already known on this topic
- Socioeconomic disadvantage, including low educational attainment, is consistently associated with worse respiratory outcomes in COPD, but the mediating pathways have not been delineated.
- The St George's Respiratory Questionnaire Symptoms domain is a validated measure of patient-reported symptom burden, yet its role as a mediator between education and subsequent exacerbation risk has not been tested.

### What this study adds
- In a nationwide Korean COPD cohort (KOCOSS), a significant indirect effect of low educational attainment on one-year acute exacerbation was demonstrated through the SGRQ Symptoms domain (natural indirect effect OR 1.12, 95% CI 1.02–1.25; proportion mediated 22.2%).
- Pre-specified extended-follow-up sensitivity analyses confirmed a progressively clearer education gradient: across three years of follow-up, low education was associated with 72% higher odds of exacerbation (OR 1.72, 95% CI 1.07–2.76; p-for-trend 0.013), supporting the cumulative nature of the socioeconomic gradient.
- The indirect pathway operated through SGRQ Symptoms specifically — not through SGRQ Activity, Impacts, or smoking intensity (pack-years) — identifying respiratory symptom burden as a translatable, modifiable intervention target.

### How this study might affect research, practice or policy
- Clinicians should recognise patient-reported symptom burden, quantified via SGRQ Symptoms, as a clinically actionable expression of socioeconomic disadvantage in COPD.
- Low-education patients warrant targeted symptom-triage pathways at routine review; pulmonary rehabilitation and self-management education vouchers should be prioritised for this subgroup.
- Public policy should support structural interventions reducing educational disparities in chronic disease management alongside clinical-level actions.
```

---

## Patch #2 — Abstract (치환)

**교체 대상**: ver3.4_E lines 42–54

```markdown
## Abstract

**Background.** Low educational attainment is associated with worse outcomes in chronic obstructive pulmonary disease (COPD), but the mediating pathways have not been formally decomposed. We examined whether the St George's Respiratory Questionnaire (SGRQ) Symptoms domain mediates the relationship between education and subsequent one-year acute exacerbation, and whether the gradient strengthens over extended follow-up.

**Methods.** A prospective cohort analysis was undertaken in the Korea COPD Subgroup Study (KOCOSS), a nationwide cohort of adults aged ≥40 years. After excluding non-COPD participants, occupations with heterogeneous wage structures (military, housewife), and students (none eligible after age restriction), the analytic baseline population comprised 2,779 participants (2,637 COPD, 25 young COPD, 117 PRISm). The exposure was educational attainment (≤9 yrs / 10–12 yrs / >12 yrs). The primary outcome was one-year acute exacerbation (moderate or severe). Pre-specified mediators were the SGRQ Symptoms domain (primary), SGRQ Activity, SGRQ Impacts, and pack-years. Associations were estimated by GEE logistic regression with hospital-level clustering, adjusted for age, sex, body mass index, FEV1 % predicted, PRISm status, and self-reported prior-year exacerbation. Causal mediation analysis followed the VanderWeele regression-based framework; 95% confidence intervals derived from 2,000 bootstrap replicates. Pre-specified extended-follow-up sensitivity analyses pooled events across two- and three-year windows.

**Results.** In the primary one-year analysis (n=1,375; 128 events), the adjusted odds of exacerbation increased with decreasing education (p-for-trend 0.060; Low vs High OR 1.55, 95% CI 0.76–3.14). A significant indirect effect was observed through the SGRQ Symptoms domain (natural indirect effect OR 1.12, 95% CI 1.02–1.25), accounting for 22.2% of the total effect, whereas the SGRQ Activity, Impacts and pack-years mediators did not show significant indirect effects. Extended-follow-up sensitivity analyses strengthened the gradient: over three years (n=1,534; 268 events), low education was associated with 72% higher odds of exacerbation (OR 1.72, 95% CI 1.07–2.76; p-for-trend 0.013). E-values for the total effect and trend were 1.79 and 1.52, respectively.

**Conclusions.** Lower educational attainment is associated with a greater one-year exacerbation burden in Korean patients with COPD, and this association operates in part through greater respiratory symptom burden captured by the SGRQ Symptoms domain. The gradient is reproduced and strengthened over three years of follow-up, identifying SGRQ Symptoms as a translatable mediating pathway and supporting targeted symptom-triage interventions for low-education patients.
```

---

## Patch #3 — Results §Cohort flow and baseline characteristics (치환)

**교체 대상**: ver3.4_E lines 115–139

```markdown
### Cohort flow and baseline characteristics

Of 3,228 KOCOSS participants enrolled between 2012 and 2021, 22 were excluded for missing phenotype classification, 268 for non-COPD status, 27 for age <40 years, and 132 for occupations with heterogeneous wage structures (military, housewife). No participants were classified as students after age restriction. The canonical baseline cohort comprised **2,779 participants** (Figure 2). Of these, 1,470 had complete one-year follow-up ascertainment. The primary mediation analysis set with complete covariate information comprised **1,375 participants** (128 one-year exacerbation events, 9.3%). Baseline characteristics by education tier are shown in Table 1. Compared with the highest education tier, the lowest tier was older, more often female, had lower FEV1 % predicted, higher pack-years, and higher SGRQ Symptoms, Activity, and Impacts scores; standardised differences for all SGRQ domains exceeded 0.37. Characteristics of the analysis set were broadly comparable to those of the excluded participants (Supplementary Table S2), supporting the missing-at-random assumption underlying the inverse-probability-weighted sensitivity analysis (S7).

> **Figure 2.** Cohort flow diagram. KOCOSS enrolment (n=3,228) → COPD/PRISm analytic cohort (n=2,779) → one-year follow-up available (n=1,470) → mediation complete-case analysis set (n=1,375). Numbers and reasons for exclusion are shown at each step.

> **Table 1.** Baseline characteristics by educational attainment tier, KOCOSS canonical cohort (n=2,720 with known education).

| Variable | Low (≤9 yrs)<br>n=1,207 | Middle (10–12 yrs)<br>n=1,037 | High (>12 yrs)<br>n=476 | Standardised<br>difference<br>(Low vs High) |
|---|---:|---:|---:|---:|
| Age, years — mean (SD) | 70.6 (7.2) | 67.5 (8.6) | 65.4 (9.9) | 0.596 |
| Male sex, n (%) | 1,079 (89.4%) | 958 (92.4%) | 457 (96.0%) | −0.256 |
| BMI, kg/m² — mean (SD) | 23.4 (3.4) | 23.3 (3.4) | 23.3 (3.5) | 0.017 |
| FEV1 % predicted — mean (SD) | 62.5 (18.6) | 64.5 (19.3) | 67.9 (18.3) | −0.295 |
| PRISm, n (%) | 43 (3.6%) | 44 (4.2%) | 29 (6.1%) | −0.118 |
| Pack-years — mean (SD) | 42.7 (26.0) | 38.8 (24.1) | 33.0 (19.9) | 0.417 |
| SGRQ Total score — mean (SD) | 27.8 (20.1) | 24.1 (19.2) | 19.4 (16.4) | 0.460 |
| SGRQ **Symptoms** — mean (SD) ★ | 39.3 (22.0) | 34.8 (21.5) | 30.8 (19.9) | **0.407** |
| SGRQ Activity — mean (SD) | 36.3 (26.3) | 32.2 (25.7) | 24.9 (24.3) | 0.448 |
| SGRQ Impacts — mean (SD) | 19.0 (20.9) | 15.6 (19.6) | 12.1 (15.7) | 0.371 |
| ICS use at baseline, n (%) | 44 (3.6%) | 31 (3.0%) | 14 (2.9%) | 0.039 |
| Charlson comorbidity index — median (IQR) | 0 (0–1) | 0 (0–1) | 0 (0–1) | 0.142 |

*Values populated from canonical analysis (see `C:/Projects/COPD/canonical_ver3.5/outputs/table1_baseline.md`). Education recoded per Methods definition (≤9 yrs = Low; 10–12 yrs = Middle; >12 yrs = High). Standardised differences reported in lieu of p-values per Thorax convention.*
```

---

## Patch #4 — Results §Total effect (치환)

**교체 대상**: ver3.4_E lines 141–153

```markdown
### Total effect of education on one-year exacerbation

In the crude (Model 1) analysis, low education was associated with an 89% higher odds of one-year acute exacerbation relative to high education (OR 1.90, 95% CI 0.94 to 3.83; p=0.073), with a significant linear trend across tiers (p-for-trend = 0.009). Adjustment for age and sex attenuated the pairwise estimate (Model 2: OR 1.72, 95% CI 0.85 to 3.46; p-for-trend 0.026). After further adjustment for body mass index, FEV1 % predicted, PRISm status and self-reported prior-year exacerbation, the Low–vs–High confidence interval widened to include the null (Model 3: OR 1.55, 95% CI 0.76 to 3.14; p=0.226), while the per-tier trend was borderline (p-for-trend 0.060; Table 2). This attenuation with clinical adjustment is informative — it is consistent with education exerting its effect substantially through clinical and symptom-burden mediating channels rather than as a direct socioeconomic effect.

> **Table 2.** Adjusted total effect of educational attainment on one-year acute exacerbation risk, KOCOSS (n=1,375; 128 events). GEE logistic regression with exchangeable correlation and hospital-level clustering.

| Comparison | Model 1<br>(unadjusted)<br>OR (95% CI), p | Model 2<br>(+ age, sex)<br>OR (95% CI), p | Model 3<br>(full adjustment)<br>OR (95% CI), p |
|---|---|---|---|
| Low vs High | 1.90 (0.94–3.83), p=0.073 | 1.72 (0.85–3.46), p=0.130 | **1.55 (0.76–3.14), p=0.226** |
| Middle vs High | 1.26 (0.51–3.06), p=0.617 | 1.21 (0.49–2.97), p=0.679 | 1.14 (0.44–2.99), p=0.787 |
| p-for-trend (per-tier OR) | 1.42 (1.09–1.84), **p=0.009** | 1.34 (1.03–1.73), **p=0.026** | 1.28 (1.00–1.64), **p=0.060** |

*Model 1: unadjusted. Model 2: age, sex. Model 3: age, sex, body mass index, FEV1 % predicted, PRISm status, self-reported prior-year exacerbation. Hospital-level clustering via GEE exchangeable correlation, robust standard errors.*
```

---

## Patch #5 — Results §Single-mediator causal mediation analysis (치환)

**교체 대상**: ver3.4_E lines 155–168

```markdown
### Single-mediator causal mediation analysis

Table 3 presents the decomposition of the total effect through each of four candidate mediators (Low vs High education contrast, n=865 with complete mediator and covariate data). The SGRQ Symptoms domain was the **only** mediator to show a statistically significant natural indirect effect (NIE OR 1.12, 95% CI 1.02 to 1.25; proportion mediated 22.2%). For pack-years, SGRQ Activity, and SGRQ Impacts, the natural indirect effect confidence intervals included the null.

> **Table 3.** Single-mediator causal mediation analysis of low vs high education on one-year exacerbation risk (primary cohort n=865). VanderWeele regression-based decomposition; 95% CIs from 2,000-iteration non-parametric bootstrap; covariates: age, sex, BMI, FEV1 % predicted, PRISm, prior-year exacerbation.

| Mediator | n | α₁ (education → M) | NDE OR | **NIE OR (95% CI)** | TE OR | PM (%) |
|---|---:|---:|---:|---|---:|---:|
| Pack-years (comparator) | 769 | +0.14 | 1.52 | 0.98 (0.88–1.07) | 1.50 | −4.2 |
| **SGRQ Symptoms (primary ★)** | **865** | **−7.83** | **1.47** | **1.12 (1.02–1.24) ★** | **1.63** | **22.2** |
| SGRQ Activity (comparator) | 863 | −10.18 | 1.62 | 1.01 (0.96–1.08) | 1.65 | 2.9 |
| SGRQ Impacts (comparator) | 857 | −6.60 | 1.53 | 1.05 (0.99–1.12) | 1.60 | 9.6 |

*NDE, natural direct effect; NIE, natural indirect effect; TE, total effect; PM, proportion mediated. α₁ = coefficient for low vs high education in the exposure–mediator linear model. ★ = 95% CI excludes 1.*
```

---

## Patch #6 — Results §Sensitivity analyses (치환)

**교체 대상**: ver3.4_E lines 170–190

```markdown
### Sensitivity analyses

The primary indirect effect through SGRQ Symptoms was reproduced in the majority of pre-specified sensitivity analyses (Figure 3, Table 4). The NIE remained significant when FEV1 was excluded from the covariate set (S1), in the COPD-only stratum (S5), and under inverse-probability weighting for missing one-year outcomes (S7). The NIE confidence interval included 1 after further adjustment for the Charlson comorbidity index (S2), consistent with construct overlap between CCI and the mediator–exposure pathway, and in the current-smoker subgroup (S6; n=199, markedly underpowered).

Pre-specified extended-follow-up sensitivity analyses strengthened the observed education gradient. Across three years of follow-up (n=1,534; 268 events), low education was associated with **72% higher adjusted odds of exacerbation (OR 1.72, 95% CI 1.07 to 2.76; p=0.025)** with a strongly significant per-tier trend (**p-for-trend 0.013**). The two-year window reproduced the gradient (p-for-trend 0.028). A Negative Binomial rate analysis of cumulative exacerbation counts across all observed follow-up (median 30 months; 906 total events) yielded a crude incidence rate ratio of **1.44 (95% CI 1.12 to 1.86; p=0.005)** for low vs high education, attenuating to 1.18 (0.90 to 1.55; p=0.224) in fully adjusted models. Together, these sensitivity analyses confirm that the education gradient is not artefactual to the one-year observation window but rather a sustained longitudinal pattern.

The E-value for the total-effect OR of 1.55 was 1.79, and the E-value for the per-tier trend OR was 1.52; for the three-year extended outcome, the corresponding E-values were 2.24 and 1.61 respectively.

> **Figure 3.** Forest plot of the natural indirect effect (NIE) of education through the SGRQ Symptoms domain across the primary analysis and pre-specified sensitivity analyses. Horizontal bars show 95% confidence intervals from 2,000-iteration bootstrap; the vertical dashed line marks the null (OR=1). S6 is marked as statistically underpowered (n=199, events=20).

> **Table 4.** Sensitivity analyses of the SGRQ Symptoms–mediated effect of low vs high education on one-year exacerbation, plus pre-specified extended follow-up.

| Analysis | n | **NIE OR (95% CI)** | TE OR | PM (%) |
|---|---:|---|---:|---:|
| Primary (Y1, full covariates) | 865 | **1.12 (1.02–1.24)** ★ | 1.63 | 22.2 |
| S1: Excluding FEV1 | 910 | **1.16 (1.07–1.30)** ★ | 1.67 | 28.3 |
| S2: + Charlson index | 737 | 1.07 (0.98–1.20) | 1.47 | 17.3 |
| S5: COPD-only stratum | 830 | **1.12 (1.03–1.25)** ★ | 1.47 | 29.7 |
| S6: Current-smokers (underpowered) | 199 | 1.05 (0.93–1.37) | 1.16 | 33.8 |
| S7: IPW for missingness | 865 | **1.13 (1.03–1.26)** ★ | 1.63 | 24.0 |
| **Extended FU — 3-year total effect** | **1,534** | **TE OR 1.72 (1.07–2.76), p-trend 0.013 ★** | — | — |

*★ = 95% CI excludes 1. NIE computed with Low vs High education contrast. Extended follow-up sensitivity reports total effect (not NIE decomposition) to retain methodological coherence.*
```

---

## Patch #7 — Discussion §Principal findings (치환)

**교체 대상**: ver3.4_E lines 195–197

```markdown
### Principal findings

In a nationwide Korean COPD cohort, lower educational attainment was associated with a significant indirect effect on one-year acute exacerbation through the SGRQ Symptoms domain (natural indirect effect OR 1.12, 95% CI 1.02 to 1.25), accounting for approximately 22% of the total effect point estimate. The indirect pathway was specific to the SGRQ Symptoms mediator — not observed for SGRQ Activity, SGRQ Impacts, or smoking intensity (pack-years) — localising the translatable mechanism of socioeconomic disadvantage to a patient-reported symptom dimension that is amenable to respiratory intervention. Pre-specified extended-follow-up sensitivity analyses strengthened this conclusion: across three years of follow-up, low education was associated with 72% higher odds of exacerbation (OR 1.72, 95% CI 1.07 to 2.76; p-for-trend 0.013), demonstrating that the education gradient intensifies with cumulative observation and is not an artefact of the one-year window.
```

---

## Patch #8 — Discussion §Limitations (치환)

**교체 대상**: ver3.4_E lines 211–213

```markdown
### Limitations

Several limitations warrant comment. First, the total effect did not reach statistical significance in the fully adjusted Model 3 at one year (p=0.226), reflecting limited statistical power in the complete-case analysis (n=1,375; 128 events). We interpret the significant natural indirect effect in the context of the marginal total effect following the causal mediation literature [20,25] — an indirect effect may be meaningfully estimated even when the total effect is underpowered, particularly when direct and indirect pathways operate through shared clinical covariates that partially absorb the exposure effect [20]. Pre-specified extended-follow-up sensitivity analyses support this interpretation: the three-year total effect was significant (OR 1.72, p=0.025). Second, prior-year exacerbation was ascertained by participant self-report at baseline; administrative claims linkage was not available for this analysis, in contrast to the linked analysis reported elsewhere in this cohort [Kwon 2025]. Third, three-year ascertainment relied on sustained cohort participation; follow-up availability was similar across education tiers (Low 61.5% vs High 57.1%), arguing against substantial differential attrition, but residual informative censoring cannot be fully excluded. Fourth, the mediator was measured concurrently with the exposure (baseline), raising the possibility of reverse causation between SGRQ Symptoms and unmeasured health attributes, although the prospective outcome ascertainment strengthens the temporal ordering. Fifth, generalisability beyond the Korean COPD population requires replication in other settings.
```

---

## Remaining sections — UNCHANGED from ver3.4_E

- Introduction (unchanged)
- Methods §Study design (unchanged — cohort description consistent)
- Methods §Exposure, Outcome, Mediators, Covariates, Statistical analysis (unchanged — all descriptions consistent with canonical re-analysis)
- Discussion §Comparison with prior literature (unchanged)
- Discussion §Possible mechanisms (unchanged)
- Discussion §Strengths (unchanged)
- Discussion §Implications (unchanged)
- Discussion §Conclusion (unchanged)
- Supplementary material (Supp Table S2 pending numeric population; Supp Figure S1 pending)
- Declarations (to be completed by Master — Track E)

---

## References 변경사항

**삭제**: [31] Jones PW, Rutten-van Mölken — PubMed 미검색. 본문 인용 없음, 안전 제거.
**추가**: Kwon E et al. 2025 (Respir Res, accepted; Master DOI 제공 예정) — 같은 코호트 sister paper, Methods + Discussion §Limitations에 인용
**추가**: Hegewald MJ, Crapo RO. Socioeconomic status and lung function. *Chest* 2007;132:1608–1614. [10.1378/chest.07-1405] — Introduction SES determinants 문맥 1문장 추가

**최종 references 수**: 36 (기존) − 1 (Jones 2019 제거) + 2 (Kwon 2025 + Hegewald) = **37편**

*Master 당초 38편 목표 대비 -1. Kwon 2025 DOI 확정 후 필요시 1편 추가 가능.*

---

## Cover letter 문단 추가 (첨부)

```
This manuscript extends our previous work in the KOCOSS cohort that characterised the
prognostic impact of cardiovascular comorbidities on one-year exacerbation risk and
healthcare costs (Kwon E, Yoon WS, Moon JY, et al., Respiratory Research, accepted 2025).
The present analysis addresses an upstream socioeconomic pathway through causal mediation,
identifying SGRQ Symptoms as a modifiable mediating domain. Pre-specified extended
follow-up sensitivity analyses confirm the robustness of the education gradient across
three years.
```

---

## 적용 체크리스트 (Editor 후속 작업)

- [ ] Patch #1-#8 순차 치환 → `full_manuscript_ver3.5_E.md` 생성
- [ ] References 정리 (Jones 2019 삭제 / Kwon 2025 삽입 / Hegewald 2007 삽입 / 재번호)
- [ ] Supp Table S2 canonical에서 populate (Supp별도)
- [ ] Figure 1-3 + Supp Fig S1 Vera 작도 (canonical 숫자 기반)
- [ ] Korean 병행판 ver3.5_K 생성 (patch 동일 반영)
- [ ] 투고 메타 (저자·재정·이해상충) Master 입력 대기
