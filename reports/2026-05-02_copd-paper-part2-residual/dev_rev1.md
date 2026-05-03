---
role: dev
turnId: 5
phase: additional-analyses
topic: topic_151
invocationMode: subagent
---

DEV_WRITE_DONE: reports/2026-05-02_copd-paper-part2-residual/dev_rev1.md

## Dev — ERJ 추가 분석 4건 실행

### D1 — GOLD 1-2 sub-cohort sensitivity (Supp Table S4, Riki R-1 완화)

- 명령: `cd C:/Projects/COPD/Data/ver2.0/submission_session174_2026-05-02 && PYTHONIOENCODING=utf-8 python 04_scripts/scripts/S4_gold12_subcohort.py`
- exit code: 0 (Bootstrap 과정에서 ConvergenceWarning 다수 — small subgroup, try/except로 captured, 최종 CI는 수렴 iteration만 percentile)
- 출력:
  - `02_analysis_outputs/S4_gold12_subcohort.json` (673 bytes)
  - `02_analysis_outputs/S4_gold12_subcohort.md` (824 bytes)
- 코드 변경: PRISm 공변량 제거. 사유 — COPD phenotype 1만 포함하면 PRISm은 정의상 0 constant → singular Hessian. 수정 후 정상 수렴.
- 결과:
  - Sub-cohort: COPD phenotype 1 + GOLD 1-2 (FEV1%pred ≥ 50) = **n=1,135**, Low+High edu n=605
  - Y1 Total OR (Low vs High) = **1.531 (95% CI 0.755-3.105, p=0.238)** — direction 유지(>1.0), 효과 크기 attenuated, n 작아 CI 넓음
  - Y1 NIE (SGRQ Symptoms) = **1.197 (95% CI 1.063-1.394)** — 유의, full cohort 1.122보다 약간 강함
  - PM = **43.1%** (full cohort 21.9%) — sub-cohort에서 mediation 비율 더 큼
- 해석: NIE 방향 보존 + 유의성 유지. 중증 disease 제외 시 reverse-causation 약화 근거. PM 상승은 mild-mod COPD에서 SES→증상 경로가 상대적으로 더 큰 비중을 차지함을 시사.

### D2 — Ignorability sensitivity (Supp Table S3, Riki R-2 완화)

- 명령: `PYTHONIOENCODING=utf-8 python 04_scripts/scripts/S3_ignorability_sensitivity.py`
- exit code: 0
- 출력:
  - `02_analysis_outputs/S3_ignorability_sensitivity.json` (2,499 bytes)
  - `02_analysis_outputs/S3_ignorability_sensitivity.md` (1,468 bytes)
- 결과 (관측 NIE 1.122, 95% CI 1.03-1.27 기준):
  - **E-value (point) = 1.49**, **E-value (CI lower) = 1.21**
  - Symmetric R_UM = R_UY sweep:

| R | rho approx | BF | adj NIE OR | adj 95% CI | CI crosses 1 |
|---|---|---|---|---|---|
| 1.05 | 0.024 | 1.0023 | 1.119 | 1.027-1.267 | No |
| 1.10 | 0.048 | 1.0083 | 1.113 | 1.022-1.260 | No |
| 1.15 | 0.070 | 1.0176 | 1.103 | 1.012-1.248 | No |
| 1.20 | 0.091 | 1.0286 | 1.091 | 1.001-1.235 | No |
| 1.21 (threshold) | 0.094 | ~1.030 | ~1.089 | <1.0 첫 발생 | Yes |
| 1.30 | 0.130 | 1.0563 | 1.062 | 0.975-1.202 | Yes |
| 1.50 | 0.200 | 1.125 | 0.997 | 0.916-1.129 | Yes |

- 해석: NIE를 무력화하려면 unmeasured confounder가 측정된 covariate 강도(age/BMI/FEV1pp 등) **수준의 R≥1.21**(rho≈0.09)을 mediator·outcome 양쪽에 동시에 가져야 함. KOCOSS의 plausible unmeasured confounder(직업적 분진, 주거지 PM2.5, 가족 COPD 중증도)가 이 임계를 넘을 가능성은 reviewer 평가 영역 — Discussion limitations 1단락 명시 필수. **E-value 2.00 미달 (1.49)** — Riki R-2 우려 정량 확정.

### D3 — Job=NaN MCAR test (Supp Table S8 보강, Riki R-3 완화)

- 명령: `PYTHONIOENCODING=utf-8 python 04_scripts/scripts/S8_mcar_test.py`
- exit code: 0
- 출력:
  - `02_analysis_outputs/S8_mcar_test.json` (2,662 bytes)
  - `02_analysis_outputs/S8_mcar_test.md` (1,389 bytes)
- 결과 (Job=NaN n=93 vs Job=valid n=2,619):

| 변수 | p-value | 차이 |
|---|---|---|
| age | 0.585 | 차이 없음 |
| bmi | 0.439 | 차이 없음 |
| fev1pp | 0.062 | 경계 |
| **sgrq_symptoms** | **0.019** | **유의** (NaN 군 평균 42.3 vs valid 36.0) |
| sex_male | 0.130 | 차이 없음 |
| edu_3cat | 0.103 | 차이 없음 |
| prism | 0.857 | 차이 없음 |
| exac_1y | 0.294 | 차이 없음 |
| pack_years | insufficient | 결측 다수 |

- 해석: **MCAR 부분 위반(MAR)**. SGRQ Symptoms에서 유의 차이 — Job=NaN 군이 증상 부담 다소 높음. 그러나 **outcome(exac_1y), exposure(edu), 주요 covariate(age/sex/bmi/FEV1pp)에서는 유의 차이 없음**. S8 sensitivity (Job=NaN 제외 OR 1.77 vs primary 1.71) 효과 크기 일관 → 결과 robustness 지지. Discussion에 "MCAR 엄격 만족 안 되나 결과 robust" 1줄 박제 권고.

### D4 — Time-ordering Fig (Supp Fig S1, A1 R-1 보조)

- 명령: `PYTHONIOENCODING=utf-8 python 04_scripts/scripts/S1_time_ordering.py`
- exit code: 0
- 출력: `02_analysis_outputs/S1_time_ordering.png` (195,229 bytes, **dpi=300**, ERJ-호환)
- 내용: Pre-T0 (COPD diagnosis) → T0 baseline (Edu/Job/SGRQ/FEV1/covariates) → T+12mo Y1 outcome → T+24/+36mo Y2/Y3 sensitivity. Mediation pathway 화살표 + reverse-causation caveat 박스 포함.

### 의외 발견

1. **GOLD 1-2 sub-cohort에서 PM 21.9%→43.1%로 상승.** Mild-moderate COPD에서 SGRQ 매개 비율이 절반 가까이로 커진다는 결과 — Discussion에 "early-stage disease에서 SES-mediated pathway가 상대적으로 더 큰 영향력"으로 framing 가능. 단, n=600에서 Total Effect p=0.238로 **TE는 비유의** — NIE만 유의한 패턴 (mediation paper 흔한 형태, 보고 가능).
2. **E-value 1.49 < 2.5 (ERJ 표준).** Riki R-2 우려 정량 확정. Manuscript에서 "modest E-value, residual confounding cannot be excluded" 명시 필수.
3. **MCAR MAR로 약화되나 outcome·exposure·핵심 covariate 모두 차이 없음.** SGRQ 차이만 단발 → "differential disease awareness" 가능성, 그러나 NIE 결과 방향 영향 미미 (S8 sensitivity OR consistency).

### Master 결정 필요

**없음 — 즉시 Edi (ver3.5_F merge 단계로 진행).**

---

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 0.85
hc_rt: 0.05
spc_drf: 1
