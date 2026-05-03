# Dev — session_177 (erj-paper-review)

## 세션 요약

Grade C 논문 리뷰 세션. COPD ERJ 제출 패키지 관련 탐색적 CMA 분석 시리즈.

---

## 수행 작업

### 1. 기존 분석 확인
- ERJ = European Respiratory Journal (IF ~24.9)
- D-148 박제값 재확인: honest accept odds ~12%

### 2. 신규 CMA 분석 (원자료 기반)
원자료: `KOCOSS_VER3_KDCA_DB_20260219.xlsx`  
대상: COPD only (Enroll=1), Job 27/28/29/30 제외

#### 2-1. Education → Pack-years → SGRQ Total Score
- 스크립트: `cma_sgrq_smoking_raw.py`
- n=1,329 (Low vs High), PM=12.7% [3.6%, 29.7%]
- NIE=+0.55 [+0.17, +1.02] — 유의

#### 2-2. Education → Smoking Status → SGRQ (COPD only)
- 스크립트: `cma_sgrq_smokingstatus_copd.py`
- n=1,446, PM=0.4% — 비유의
- 흡연 상태 분포 두 군 동일(~25% Current 양쪽)

#### 2-3. Education → BMI → SGRQ (COPD only)
- 스크립트: `cma_sgrq_bmi_copd.py`
- n=1,446, PM=0.2% — 비유의
- BMI 두 군 동일(23.36 vs 23.33)

#### 2-4. 매개변수 후보 전체 스크리닝
- α₁·β₁ 동시 유의: Pack-years, 흡연기간, 하루흡연량 — 모두 흡연의 다른 측면
- 비유의: BMI, CCI, 흡연상태, 대기오염, 바이오매스연료, FEV1%pred
- 우울(BDI)/불안(BAI): β₁ 유의하나 α₁ 비유의 + n<200

#### 2-5. Education → BMI → CAT Total Score (COPD only)
- 스크립트: `cma_cat_bmi_copd.py`
- n=1,474, PM=-1.2% — 비유의

#### 2-6. Education → Pack-years → CAT Total Score (COPD only)
- n=1,287, PM=15.5% [4.8%, 38.0%]
- β₁=+0.002 비유의 — 해석 주의

### 3. DAG 시각화
- 삼각형 구조 DAG 2패널 생성
- 저장: `C:/Projects/COPD/canonical_ver3.5/outputs/dag_mediation_figure.png`

### 4. 흡연 종류 탐색
- `KO1_SmokeType1`: 연초 여부만(전원 1=연초) — 전자담배 변수 없음
- KOCOSS 2013년 시작 코호트, 전자담배 항목 미설계

---

## 산출 파일 (C:/Projects/COPD/canonical_ver3.5/)

| 파일 | 내용 |
|---|---|
| `scripts/cma_sgrq_smoking_raw.py` | SGRQ × Pack-years CMA (원자료) |
| `scripts/cma_sgrq_smokingstatus_raw.py` | SGRQ × Smoking status (전체) |
| `scripts/cma_sgrq_smokingstatus_copd.py` | SGRQ × Smoking status (COPD only) |
| `scripts/cma_sgrq_bmi_copd.py` | SGRQ × BMI (COPD only) |
| `scripts/cma_cat_bmi_copd.py` | CAT × BMI (COPD only) |
| `outputs/cma_sgrq_smoking_raw.json` | SGRQ × Pack-years 결과 |
| `outputs/cma_sgrq_smokingstatus_copd.json` | SGRQ × Smoking status 결과 |
| `outputs/cma_sgrq_bmi_copd.json` | SGRQ × BMI 결과 |
| `outputs/cma_cat_bmi_copd.json` | CAT × BMI 결과 |
| `outputs/dag_mediation_figure.png` | DAG 삼각형 구조 시각화 |

---

## 핵심 결론

1. **Pack-years만이 유일한 유의 매개변수** — α₁·β₁·NIE 세 조건 모두 충족
2. **PM=12.7% (SGRQ) / 15.5% (CAT)** — 부분 매개. 나머지 ~85%는 미측정 경로
3. 흡연 상태·BMI·CCI 등은 매개 기능 없음
4. 전자담배 변수 없어 종류별 분석 불가
5. 급성악화(FU_Y1_M/S_exacerbation) 변수 존재 — 이진형 결과 CMA 가능(로지스틱 기반)
