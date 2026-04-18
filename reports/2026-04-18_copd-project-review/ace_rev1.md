---
role: Ace
session: session_034
topic: COPD project review (Track B)
rev: 1
date: 2026-04-18
---

# Ace — 프레이밍·오케스트레이션·종합검토

## 1. 토픽 정의

**핵심 질문:** COTE index 심혈관 Track A(IF 5 게재 완료) 이후, 같은 KOCOSS 코호트로 고IF 원저 Track B를 어떻게 설계할 것인가.

**배경:** Master 와이프(Eunjin Kwon 박사, KDCA 국립보건연구원) 과제. 과거 Claude Code 협업에서 "데이터를 안 쓰고 자의적 등급 분류·미스매칭"으로 Master 불만족. 전면 재검토 요청.

## 2. 재설계 과정 요약

**기존(Master 단독 Phase 1~2):**
- 교육(edu_3cat) → CAT/SGRQ/mMRC 매개 → exacerbation
- KOCOSS 전체 n=3,191 (표현형 미구분)
- Phase 2 결과: Low OR≈1.70 (p=0.076, 경계적)

**재설계 핵심 변경 5가지:**
1. **코호트 재정의** — non-COPD 551명(17.3%) 섞여있음 확인 → COPD+PRISm n=2,719 (Wan 2014)
2. **흡연 매개 재투입** — Pack-years (edu 상관 r=-0.12***, COPD에서 강함)
3. **매개 세트 정제** — CAT/SGRQ 중복 해결 → SGRQ subscale 3개(Sym/Act/Imp) + Pack-years = 4개 병렬
4. **공변량 과보정 교정** — Age·Sex·Prev_exac·FEV1%·Hospital(cluster) 만 (DAG 기반)
5. **표현형별 분기 가설 → Pooled CMA** (G2 FAIL, PRISm n=51/events=3으로 식별 불가)

## 3. 최종 확정 설계

**코호트:** COPD+PRISm, n=2,719 (Wan 2014)

**Primary model:** GEE logistic + VanderWeele regression-based CMA
- Y: exacerb_1yr
- X: edu_3cat
- M (4 parallel): Pack-years, SGRQ Symptoms, Activity, Impact
- C: Age, Sex, Phenotype(PRISm=1), Prev_exac, FEV1%pred
- Cluster: Hospital (GEE exchangeable)

**Sensitivity 7트랙:** FEV1비보정 / Over-adjusted / Inflammation / Bhatt PRISm / COPD-stratum descriptive / Current smoker only / IPW for missing

**Novelty 3축:**
- A. SES upstream (Track A의 comorbidity downstream과 차별)
- B. Airflow impairment spectrum (COPD+PRISm inclusive, JAMA/Lancet RHWP와 차별 각도)
- C. Near-universal coverage context (Nova 궤도 3, 국제 사회역학 접근)

## 4. 역할 호출 로그

| 순서 | 역할 | 주요 산출 |
|---|---|---|
| 1 | Ace | 프레이밍, Q1~Q27 질문 설계, 3회 재수렴 |
| 2 | Arki (1차) | 6개 구조결정 지점(D-A~D-F), 공변량·매개 DAG 정제 |
| 3 | Riki (1차) | 7개 리스크, G1/G2/G3 선결 조건 |
| 4 | G1·G2 실행 | G1 PASS / G2 FAIL → Pooled 재수렴 |
| 5 | Nova (Master 명시 호출) | 4개 궤도 제시 |
| 6 | Riki (2차) | Nova 반영 후 R-10~R-13 추가 + 저널 현실 확률 |
| 7 | Ace 종합검토 | Nova 궤도 2·3 채용 / 1·4 기각 / 1 유보 |
| 8 | Arki (2차, plan mode) | Phase 0~7 실행계획 + 10 Gate |
| 9 | Editor | 본 세션 문서화 |

## 5. Ace의 종합 권고

**기대 성과 밴드 (base case):** IF 5~10 (Thorax stretch / Chest base / ERJ Open Res 안전)

**투고 Cascade 순서:** Thorax → Int J Epidemiol → Chest → ERJ Open Res → Int J COPD

**핵심 리스크 관리:**
- R-10·R-11: Nova 궤도 3 용어 순화 필수 ("natural laboratory" 제거 → "near-universal coverage context")
- R-12·R-13: "modifiable pathway"까지만, "intervention effect" 금지; PRISm 강조 수위 제한
- G2 FAIL 흔적 제거: PRISm subgroup에 대한 over-promise 금지

**다음 세션 착수점:** Phase 1 — 코호트 고정 + phenotype 층화 Table 1
