---
role: Arki
session: session_034
topic: COPD project review (Track B)
rev: 1
date: 2026-04-18
executionPlanMode: plan (conditional→plan 전환, Ace 종합검토 후 재호출)
---

# Arki — Phase 0~7 실행계획 (COPD Track B)

## 1. Phase 분해 및 의존 그래프

```
P0 (선결)
  └─ G1 결측 mechanism ✅PASS
  └─ G2 검정력 🔴FAIL → Pooled 재수렴 완료
  └─ G3 IRB ✅PASS (기승인)
        │
        ▼
P1 코호트 고정 + 기술통계
  └─ Wan 2014 PRISm 필터 적용
  └─ Phenotype binary 변수 고정
  └─ Table 1 phenotype 층화 재작성 (R-5 근거)
  └─ G4: BMI·DLCO·FVC 분포 phenotype별 확보
        │
        ▼
P2 총효과 재추정
  └─ GEE Logistic: edu_3cat → exacerb_1yr
  └─ 공변량 5 + hospital cluster
  └─ G5: Low OR > 1 방향 확인
        │
        ▼
P3 Single mediator CMA  ──┐
  └─ Pack-years 단독        │ (병렬 가능)
  └─ SGRQ Sym 단독          │
  └─ SGRQ Act 단독          │
  └─ SGRQ Imp 단독          │
  └─ Valeri & VanderWeele 2013 regression-based
  └─ Bootstrap 5,000 iter   │
  └─ G6: 각 NIE 방향 일치   │
                            │
        ▼                   ▼
P4 Multiple mediator decomposition
  └─ 4개 병렬 동시 분해 (Vansteelandt & Daniel 2017)
  └─ VIF 진단 (SGRQ subscale multicollinearity)
  └─ G7: total NIE ≈ Σ single NIE
        │
        ▼
P5 Sensitivity analyses  (일부 P3·P4와 병렬)
  ├─ S1: FEV1%pred 비보정 (DAG 원칙)
  ├─ S2: Over-adjusted (+BMI, Comorbidity)
  ├─ S3: Inflammation (+WBC, +CRP subgroup)
  ├─ S4: Bhatt 2022 PRISm 정의 (z-score)
  ├─ S5: COPD stratum CMA (descriptive, n=1,142)
  ├─ S6: Current smoker only (R-3 recall bias)
  ├─ S7: IPW for FU_Y1 missing (R-1 WARN 대응)
  └─ E-value (VanderWeele & Ding 2017)
  └─ G8: 주결과 방향 유지 + E-value > 2
        │
        ▼
P6 Narrative integration
  └─ Nova 궤도 2 (modifiable mediator) → Discussion
  └─ Nova 궤도 3 (near-universal coverage context) → Intro + Cover letter
  └─ Riki R-10 용어 순화 ("natural laboratory" 삭제)
  └─ Riki R-11 코호트 selection 수위 조절
  └─ Riki R-12 overpromise 제어
  └─ Riki R-13 PRISm 서사 일관성
  └─ DAG 최종 다이어그램 (publication quality)
  └─ Table 1~4, Figure 1~3 확정
  └─ G9: 자체 정합성 리뷰
        │
        ▼
P7 제출 준비
  └─ Thorax 1차 투고 포맷
  └─ Co-author contributions 확정
  └─ IRB statement, funding, COI, data availability
  └─ Supplementary materials
  └─ G10: Co-author 전원 승인
  └─ 투고 후 → Int J Epidemiol → Chest → ERJ Open Res → Int J COPD (rejection cascade)
```

## 2. 검증 게이트 (Gate Criteria)

| Gate | 단계 | 통과 기준 | 실패 시 롤백 |
|---|---|---|---|
| G1 | P0 | edu × missing p≥0.10 | ✅ PASS (p=0.40) |
| G2 | P0 | interaction power ≥80% | 🔴 FAIL → Pooled 재수렴 (완료) |
| G3 | P0 | IRB scope 확인 | ✅ PASS (기승인) |
| G4 | P1 | phenotype 층화 기술통계 full 산출 | 결측 변수 식별 후 대체지표 |
| G5 | P2 | Low edu OR > 1 (p<0.10 in Model 2) | 노출 재정의 (material_dep 대체 검토) |
| G6 | P3 | 최소 1개 mediator NIE>0 (direction) | 해당 mediator 제외, Discussion limitation |
| G7 | P4 | Joint NIE 식별 가능, VIF<5 | SGRQ subscale → SGRQ total 축소 재실행 |
| G8 | P5 | 주결과 방향 유지, E-value>2 | Limitation 강화, unmeasured confounder 명시 |
| G9 | P6 | 서사·분석·figure 정합성 | 수정 반복 |
| G10 | P7 | 공저자 전원 서명 | 이견 해결 후 재제출 |

## 3. 핵심 전제

- T1: KOCOSS 데이터 IRB scope 기승인 (Master 확인)
- T2: FU_Y1 결측 selection bias는 G1 수준에서 통제 가능 (edu 교락 없음 확인됨)
- T3: KOCOSS에 FU_Y1 spirometry가 가용할 경우 S5(stable PRISm 민감도) 가능; 불가 시 single-timepoint 기반 진행 + Limitation
- T4: Bootstrap 재현성은 seed 고정으로 확보
- T5: 공저자 구성·교신저자 Track A와 동일 유지 (데이터 사용 승인 연속성)

## 4. 중단 조건 (Abort)

- A1: P2에서 total effect 모든 Model에서 p>0.50 → 노출 재정의 필요, 현 설계 전면 폐기
- A2: P3에서 모든 4개 단독 매개 NIE 방향 불일치 → 매개 프레임 자체 재검토
- A3: 투고 진행 중 동일 가설·데이터 타 연구자 선행 발표 → Novelty 재정의 또는 서사 축 전환
- A4: Co-author 간 이견 해결 불가 → 세션 외부 의사결정 필요

## 5. Fin 금지어 감사 자가검토

- 절대 시간 표기 (D+N, N주차, 날짜): **없음** ✅
- 인력 배정 (담당자명·PD·MM): **없음** ✅
- 공수 단위 (N시간·N일·공수): **없음** ✅
- 구조적 선후 표현만 사용: ✅ ("Phase X 완료 → Y", "Gate Gn 통과 후")

## 6. 분석 코드 기본 구조 (Phase 3 참고)

```python
# Phase 3 단일 mediator CMA 예시 (VanderWeele 2013 regression-based)
# statsmodels + numpy bootstrap

# Stage 1: Outcome model  (Y on X, M, C + X:M interaction 검토)
logit_Y = Logit(Y, [const, edu_low, edu_mid, M, edu_low*M, edu_mid*M, C1..C5])

# Stage 2: Mediator model (M on X, C)
linear_M = OLS(M, [const, edu_low, edu_mid, C1..C5])

# Decomposition
NDE = outcome_model(edu=1, M=M(edu=0)) - outcome_model(edu=0, M=M(edu=0))
NIE = outcome_model(edu=1, M=M(edu=1)) - outcome_model(edu=1, M=M(edu=0))
PM  = NIE / (NDE + NIE)

# Bootstrap 5,000 iter with hospital-stratified resampling
# Output: point estimates + 95% percentile CI
```

## Arki 종결

Phase 0~7 실행계획 + 게이트 10개 + 롤백 4개 + 중단 조건 4개 + 전제 5개 확정.
본 계획은 `executionPlanMode: plan` 으로 전환됨. 실제 분석 착수는 다음 세션에서 Phase 1부터.
