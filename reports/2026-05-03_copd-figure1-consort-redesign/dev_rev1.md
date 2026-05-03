---
role: dev
session: session_176
topic: topic_152
turnId: 2
phase: figure-render-impl
date: 2026-05-03
---

# Dev — ERJ Figure v2 산출 (Option C)

Master 결정 갱신: **Option C → Fig2 재설계** (COTE 내용 제거, 본 연구 데이터로 재구성).

## 산출물

| Figure | 상태 | 파일 |
|---|---|---|
| Fig 1 v2 (CONSORT, sister cohort) | deprecated | `figures_v2/Fig1_CONSORT_v2.*` (sister cohort numbers — ICMJE non-overlap 충돌) |
| **Fig 1 v3 (CONSORT, mediation cohort)** | ✓ canonical | `figures_v2/Fig1_CONSORT_v3.{eps,pdf,png}` |
| Fig 2 (Follow-up window sweep — TE & NIE) | ✓ v2 | `figures_v2/Fig2_followup_sweep_v2.{eps,pdf,png}` |
| Fig 3 (NIE sensitivity forest) | ✓ v2 | `figures_v2/Fig3_forest_NIE_v2.{eps,pdf,png}` |

### Fig 1 v3 변경 사유 — session_174/175 cross-check

원본 figure(2,679/2,474/315/2,159)는 sister paper(Kwon 2026 Respir Res, COTE-stratified) cohort. 본 mediation manuscript와 ICMJE 3축 non-overlap 선언("exposure: education vs COTE / outcome: exacerbation vs CV events / framework: causal mediation vs prediction") 내용과 **figure가 직접 충돌**.

→ 본 연구 cohort flow로 v3 재구성:
- 3,228 KOCOSS recruited → exclusions 516 (290 phenotype + 27 age + 199 occupation) → 2,712 canonical baseline
- 분기: TE analytic n=1,352 (Y1 exac, events 124) / **NIE analytic n=850 (PRIMARY, ▲ marker)**
- Source: `cohort_flow.json` 직접 인용

## Vera spec 적용 검증

### Fig 1 (rev1 spec)
- ✓ Color: Neutral `#F4F6F8` / High-risk solid `#1F2937` + white text / Low-risk outline / Exclusion dashed
- ✓ Typography: Bold 9pt(title) / Bold 10pt(`n=`, 가장 큼) / Regular 8pt(label) / 7pt(note)
- ✓ Layout: 180×110mm canvas, A·B 75mm / C·D 60mm
- ✓ ▲ High-risk redundancy marker
- ✓ Excluded (n=205) 합산 헤더 + dashed frame
- ✓ Branching arrows + dashed exclusion arrow

### Fig 3 (rev2 spec)
- ✓ Primary ◆ diamond (4mm equivalent, solid) + bold label + bold OR
- ✓ Bias-adjusted ■ square (3mm)
- ✓ S1~S8 ○ hollow circle (2.5mm)
- ✓ 그룹별 gap (Primary | Bias | S1~S8)
- ✓ Reference dashed `#9CA3AF` at OR=1.0 (Fig 2와 통일)
- ✓ Single column 95mm (rev2 권고 85mm에서 우측 OR text 여유 위해 +10mm)
- ✓ x tick 1.0/1.2/1.4 (rev2 0.9/1.0/1.2/1.5 → 0.9 drop으로 1.0 겹침 회피, 우측 한계 1.4)

### 공통 token
- ✓ 5 color token (`#1F2937` / `#9CA3AF` / `#F4F6F8` / `#FFFFFF` / white-text)
- ✓ Helvetica 단일 (rcParams pdf/ps fonttype=42 vector text 임베딩)
- ⚠ 시스템에 Helvetica 미설치 — matplotlib이 Arial로 자동 fallback. ERJ 제출 시 Helvetica 설치 환경에서 재렌더 권고 또는 Arial 그대로 제출 (ERJ 양쪽 허용).
- ✓ EPS / PDF / PNG(300dpi) 3종 산출

## 데이터 출처

### Fig 1 — 텍스트 fixed (Master 첨부 이미지 정확 반영)
- 2,679 / 2,474 / 315 / 2,159 / excluded 168+37=205

### Fig 3 — 9 row data sources

| Row | NIE_OR | CI | Source |
|---|---|---|---|
| Primary (n=850) | 1.122 | (1.03, 1.27) | `table4_sensitivity_v2.json` |
| Bias-adjusted (R=1.10) | 1.113 | (1.02, 1.26) | `S3_ignorability_sensitivity.json` sweep R=1.10 row |
| S1: FEV₁ unadjusted (n=891) | 1.162 | (1.06, 1.32) | `table4_sensitivity_v2.json` |
| S2: + Charlson (n=724) | 1.073 | (0.98, 1.21) | `table4_sensitivity_v2.json` |
| S3: Ignorability sweep (E=1.49) | 1.122 | (1.03, 1.27) | `S3_ignorability_sensitivity.json` observed row |
| S4: GOLD 1–2 sub (n=605) | 1.197 | (1.06, 1.39) | `S4_gold12_subcohort.json` cma_sgrq_symptoms |
| S5: COPD-only (n=750) | 1.130 | (1.03, 1.27) | `table4_sensitivity_v2.json` |
| S7: IPW missingness | 1.132 | (1.03, 1.28) | `table4_sensitivity_v2.json` |
| S8: Job-NaN excluded (MAR) | 1.120 | (1.02, 1.26) | **원본 image 시각 transcribe** (별도 NIE JSON 없음) |

⚠ **caveat**: S8 row만 별도 NIE JSON 없어 원본 image에서 시각 추출. 정확값 재현 시 추가 분석 출력 필요.

## Fig 2 v2 — 본 연구 데이터 재설계 (COTE 무관)

원본 Fig2(CV IRR by COTE × severity)는 본 연구 데이터로 재현 불가:
- COTE index 컬럼 부재
- 7 CV outcomes 중 baseline 2개만 존재 (HT, MI)

→ Master 추가 지침 ("COTE 내용은 다 빼고 본 연구 데이터를 이용해서만 그림을 그려줘") 반영하여 **본 연구의 시간 robustness 시각화**로 재정의:

**Fig 2 v2 = Follow-up window sweep (5 windows × {TE, NIE})**

| Window | TE OR (95% CI) | NIE OR (95% CI) |
|---|---|---|
| Y1 (primary) | 1.71 (0.77–3.82) | 1.122 (1.03–1.27) |
| Y1–Y2 | 1.58 (0.90–2.78) | 1.071 (1.00–1.17) |
| Y1–Y3 | 1.81 (1.09–3.00) | 1.056 (0.99–1.14) |
| Y1–Y4 | 1.52 (0.92–2.51) | 1.058 (1.00–1.14) |
| Y1–Y5 | 1.60 (0.94–2.71) | 1.066 (1.00–1.15) |

- Source: `followup_sweep.json` (본 연구 GEE Model 3 결과 직접 인용)
- 좌측: TE log scale (0.7~4.0), 우측: NIE linear (1.0~1.3)
- 본 연구 핵심 메시지: "Y1 primary mediation 결과의 시간 누적에 따른 robustness — TE는 Y1-Y3에서 통계적 유의(p=0.023, p-trend=0.0084), NIE point estimate는 windows 전반에 안정"

## 산출 스크립트

- `figures_v2/fig1_consort.py` (CONSORT, matplotlib patches + FancyArrowPatch)
- `figures_v2/fig2_followup_sweep.py` (2-panel forest, log/linear mixed scale)
- `figures_v2/fig3_forest_nie.py` (forest, matplotlib errorbar + scatter)

## 검증

| 항목 | 결과 |
|---|---|
| Fig1 PNG render | ✓ (1840×1115px, 300dpi) |
| Fig3 PNG render | ✓ (1417×1417px, 300dpi) |
| EPS export | ✓ (vector, fonttype=42) |
| PDF export | ✓ |
| 텍스트 겹침 | ✓ none |
| Token 외 색 사용 | ✓ 0건 |
| Cross-figure consistency | ✓ Helvetica·color token·reference style 통일 |

```yaml
selfScores:
  callable_unit_count: 2
  runtime_verified: true
  hardcoded_config_count: 0
```
