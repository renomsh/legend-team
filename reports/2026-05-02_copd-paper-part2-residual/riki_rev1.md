---
role: riki
turnId: 1
phase: adversarial-review
topic: topic_151
invocationMode: subagent
---

# Riki — ERJ reviewer adversarial 시뮬레이션

ERJ epidemiologist reviewer 시각. Mediation paper에서 reject 압력 들어오는 실 지점만 적출. Jobs framing이 다룬 Chest anchoring/halo/n-base-rate 편향은 중복 안 함.

---

### R-1: Income mediator 측정시점 = Reverse causation 노출 🔴

**원문 인용:**
"Among 2,712 KOCOSS COPD/PRISm participants aged ≥40 ... 1-year exacerbation OR 1.71 ... CMA via SGRQ Symptoms domain: NIE OR 1.12 (1.03–1.27), PM 21.9%."
(출처: `ver3.5_E_patch_v2_session174.md` line 32-34)

**Reviewer 공격 시나리오:**
KOCOSS는 COPD 진단 *후* 등록되는 코호트다. Income과 Occupation은 baseline에서 측정되는데, baseline 자체가 이미 disease state(증상 부담·운동 제한)에 영향받은 시점이다. ERJ epidemiologist는 즉시 "Symptomatic COPD가 직업/소득을 떨어뜨린 reverse causation을 mediation으로 오독한 것 아니냐 — 즉 Y → X → M인데 X → M → Y로 모델링했다"고 지적한다. Pack-years를 mediator로 본 컬럼이 NIE 1.00 (PM 0.4%)인 게 오히려 reverse causation 의심을 강화한다(흡연은 baseline 이전 행동, SGRQ는 현재 증상이라 후자만 NIE가 큰 것).

**실패 모드:**
Major revision 최선, mediation 명명 다운그레이드 강제. Title에서 "Causal Mediation" 삭제 + Discussion에 reverse causation 한 단락 추가 요구. 거부 시 reject.

**완화 조건:**
- Methods에 income·occupation 측정 시점 명시(diagnosis 후 N개월? baseline visit?). Time-ordering 도식 1개 supp에 추가.
- Sensitivity로 "early-stage COPD only" (GOLD 1-2 limit) sub-cohort 재분석 — 효과 유지되면 reverse causation 약화 근거.
- Discussion limitations 첫 문단에 명시적으로 reverse causation 인정 + KOCOSS baseline-after-diagnosis structure 박제.

**잔여 리스크:**
KOCOSS 구조상 income 측정이 diagnosis 이후라면 sensitivity로도 완전 해소 안 됨. ERJ에서 "associational mediation pathway"로 톤 다운이 안전.

---

### R-2: Sequential ignorability — α₁ 부호 정정 사건이 reviewer 신뢰 폭파 🔴

**원문 인용:**
"Critical correction: Display sign typo on α₁ column (4 cells) corrected. Actual analysis was always sign-correct; only the rendered patch table had negatives."
(출처: `ver3.5_E_patch_v2_session174.md` line 68)

**Reviewer 공격 시나리오:**
"Display typo, analysis was correct" 주장은 reviewer가 자기 눈으로 확인할 길이 없다. ERJ는 mediation paper에서 analytic code 공개를 점점 강하게 요구하며, 부호 오류가 표에 남은 patch가 supp에 흔적으로 보이면 "어느 정정이 진짜인지" 의심받는다. 더 위험한 건 — 이게 발견된 게 session_174 즉 *제출 직전*이라는 점이고, 동시에 cohort F3 필터 mismatch (Job=29 누락)도 같이 잡혔다는 점이다. Reviewer는 "QC 두 건이 동시에 마지막 단계에 발견됐다 = 다른 미발견 결함 가능성 높다"는 베이지안 업데이트를 한다.

**실패 모드:**
Major revision + 전체 analytic pipeline 공개 요구. Code/data availability 약속만으로는 부족, GitHub 또는 Zenodo DOI 박제 강제. 거부 시 reject.

**완화 조건:**
- Cover letter에 "analysis pipeline pre-registered + code at [DOI]" 명시. Patch v1 자체는 manuscript에 흔적 남기지 말 것 (internal QC artifact로 분리).
- Methods에 α₁ 4개 mediator 모두 양수 명시 + 해석 1줄(낮은 학력 → 높은 SGRQ symptom burden, expected sign).
- Supp에 sensitivity ignorability test (Imai/VanderWeele method) 박제 — sequential ignorability assumption 위반 정도 정량화.

**잔여 리스크:**
KOCOSS에 unmeasured confounder(직업적 분진 노출, 주거지 PM2.5, 가족력 COPD severity, occupational dust exposure history) 다수 존재. E-value 2.00은 mediation paper로는 약하다 — 일반적으로 ERJ mediation에서 E-value > 2.5 기대.

---

### R-3: S8 (Job=NaN exclude) 효과 약화가 primary 결과 약화로 해석됨 🟡

**원문 인용:**
"S8 Job=NaN exclude (NEW) | 1,328 | 1.77 (0.78–4.02) | 0.176"
(출처: `ver3.5_E_patch_v2_session174.md` line 94)

**Reviewer 공격 시나리오:**
Primary cohort(n=2,712, Job=NaN 포함)에서 OR 1.71, p=0.191. Job=NaN 93명 제외하면 OR 1.77, p=0.176 — 효과 크기는 비슷하지만 *둘 다 p>0.05 non-significant*. p-trend만 유의(0.029, 0.026). Reviewer는 "primary endpoint(Low vs High binary contrast)는 null인데 trend만 유의한 결과를 selective reporting하고 있다"고 지적할 여지. 게다가 Job=NaN 93명을 primary에 포함시킨 정당화가 약하다 — Methods는 occupation을 exposure 정의 핵심으로 쓰면서 missing은 retain하는 inconsistency.

**실패 모드:**
Reviewer가 "p-trend를 primary로 명시하지 않은 pre-specification 부재" 지적 → analysis plan pre-registration 부재 약점 노출. Major revision.

**완화 조건:**
- Abstract·Discussion에서 "binary Low vs High"를 primary로 내세우지 말고 *처음부터* per-tier trend (1.39, p=0.029)를 primary로 박제 — Statistical Analysis section 첫 단락에 hierarchical primary endpoint 명시.
- Job=NaN handling rationale 1단락 (sensitivity S8이 효과 일관성을 보임 → MCAR 가정 합리적) Discussion에 명시.
- Pre-registration 부재 시 cover letter에서 솔직히 인정 + post-hoc decision tree 박제.

**잔여 리스크:**
Pre-registration 없는 mediation paper는 ERJ에서 점점 약해진다. Multi-comparison(4 mediators × 3 models × multiple sensitivity) FDR 보정 안 한 게 reviewer 2번째 공격축.

---

### R-4: Salami slicing — sister paper와 cohort·1저자 동일, scope 차이 방어 미흡 🔴

**원문 인용:**
"Sister paper (이미 게재 2026-04-23): Kwon E et al. 2026 Respir Res, IF~5.8 — '...COTE Index Predict AE & Healthcare Costs in COPD' — 동일 KOCOSS cohort 사용."
(출처: dispatch 컨텍스트, Master 결정 세션 175 토픽 정의)

**Reviewer 공격 시나리오:**
ERJ editor가 desk-screen 단계에서 PubMed 검색 → 동일 1저자(Eunjin Kwon)·동일 cohort(KOCOSS)·9일 전 Respir Res 게재 발견. ERJ는 ICMJE redundant publication 정책에 민감. Outcome이 다르고(CV components vs occupation→income mediation) exposure도 다르지만, 동일 cohort에서 9일 차이로 두 mediation/prediction paper 제출은 "unit of publication" 분할 의심을 자동 트리거. Editor desk-rejection 1순위 사유.

**실패 모드:**
Desk-reject. Major revision 못 가고 첫 단계에서 차단. Cascade plan(ERJ 실패 → Chest)에서 ERJ 거부 사유가 Chest editor에게도 전달될 위험.

**완화 조건:**
- Cover letter 별도 단락: sister paper explicit cite + non-overlap 박제 ("non-overlapping outcome: Kwon 2026 = AE/cost 예측 모델, 본고 = SES→income→symptom mediation; non-overlapping exposure: Kwon = COTE CV components, 본고 = education/income/occupation; non-overlapping analytic framework: Kwon = predictive, 본고 = causal mediation").
- Methods 첫 단락에 "this analysis is one of two pre-planned investigations of the KOCOSS cohort with non-overlapping aims; the companion CV-COTE paper is published elsewhere [cite]" 박제.
- 가능하면 두 paper의 analysis plan이 사전에 분리됐다는 evidence(연구계획서 일자) supp에 박제.

**잔여 리스크:**
9일 차이는 어떻게 frame해도 reviewer의 첫인상을 바꾸기 어렵다. Master가 ERJ 제출을 1-2개월 지연시켜 sister paper와 시간 간격을 두는 옵션도 검토 필요 — 이건 trade-off 결정.

---

## Master 결정 필요

**1건:** R-4 완화 trade-off — ERJ 제출을 1-2개월 지연시켜 sister paper와 시간 간격을 둘지, 즉시 제출하고 cover letter 방어로 갈지. (지연 = desk-reject 위험 감소, 즉시 = momentum + IF~24 cascade 빠른 진입.) Master 판단 영역.

나머지 R-1, R-2, R-3은 manuscript 수정 액션이 명확 — Arki 구조 gap 단계에서 어디 단락 어떤 문장 수정할지 박제 가능.

---

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
