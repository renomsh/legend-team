---
turnId: 6
invocationMode: subagent
phase: cross-review
---

# Riki — Ace rev3 Cross-Review

Riki입니다. Ace rev3(Fin/Dev 지표 델타) + rev2 잔여안을 cross-review합니다. Arki R-1~R-8과 중복되지 않는 새로운 공격각만 제시합니다.

---

## Arki R-1~R-8 중복 검사

- **자가채점 인플레이션 일반론** — Arki R-8이 baseline 전 inflation을 이미 다룸. 단, R-8은 "baseline 경과 전 표본 희소"만 다루고 "채점 주체의 구조적 편향"은 다루지 않음 → 아래 RK-1은 별개.
- **PD-023 drift / 경계 침범** — Arki R-5, R-6이 이미 다룸. 스킵.
- **구조 섹션 중첩** — Arki R-7이 이미 다룸. 스킵.
- **Vera raterId 집계** — Arki R-3이 이미 다룸. 스킵.

중복 제외 후 신규 각도 4건 제시합니다.

---

## 신규 리스크 RK-1~RK-4

### 🔴 RK-1. `dev.hc_rt` (lower-better) + core 0.30 weight = Goodhart 최단 경로

**취약점**
Ace rev3 §2 인용: `hc_rt … polarity: lower-better, tier: core, weight: 0.30` + 정규화 `100 - raw_pct`. 즉 **하드코딩 0건이면 `hc_rt = 100`**. Dev가 config 참조 0건짜리 작업(문서 수정·로그 추가·주석 변경)만 골라서 수행하면 `hc_rt`는 항상 100, 분자 0/분모 0 엣지에서는 `defaultStrategy: previous-session-value`로 100이 상속됨.

externalAnchor도 취약: Arki rev2 §1-A는 "git diff 스캔 (정규식 기반)" 명시 — 정규식을 회피하는 패턴(변수명을 config처럼 위장, 상수를 함수 호출로 래핑)은 쉽게 만들 수 있음. 자가 채점이므로 Dev가 "이건 하드코딩 아니다"로 선언하면 끝.

**시나리오**
세션 096~100에서 Dev가 4회 연속 `hc_rt: 100` 자가채점 → composite 기여 `100 × 0.30 = 30`. `rt_cov`도 자가채점이라 `85` 수준 유지 → dev composite 평균 80+ 고정. Master는 "Dev 성장 중"으로 읽으나 실상은 구조적 변경 회피.

**Mitigation**
- `hc_rt` 분모(`총 config 참조 지점`)에 **하한값** 부여: 구현 세션 중 diff LOC < 50이면 측정 제외(denominator=NaN), 단 `invoked-sessions-only` 규약 수정 필요.
- 정규식 anchor 대신 **Arki가 구현 리뷰에서 지적한 하드코딩 건수**를 외부 raterWeight 0.5 이상으로 병기 → 자가-외부 2-rater 구조.
- core tier 강등 검토: `hc_rt`를 standard(weight ≤ 0.15)로 두고 core는 `rt_cov` 단독.

**Fallback**
3세션 연속 `hc_rt ≥ 95` + `rt_cov ≥ 85`인데 Arki 구현 리뷰에서 구조적 결함이 지적되면 lifecycleState `candidate → shadow` 강등, PD-025 안티-Goodhart 조기 activate.

---

### 🔴 RK-2. `invoked-sessions-only` 분모 판정 규칙 부재 — denominator 게이밍

**취약점**
Ace rev3 §3 `invoked-sessions-only (역할이 실제 발언한 세션만 집계)`. Arki rev2 §1-B도 nova/vera에만 적용. 그러나 **"실제 발언"의 판정 기준이 어디에도 없음**:

- Turn 1개짜리 인라인 발언도 참여? (Grade C의 Ace 1~2줄 인라인)
- Master가 "Nova 참고만"이라고 부른 세션은 참여?
- Edi가 frontmatter 자동 생성만 한 세션은 참여?

규칙 부재 시 자가채점자가 **분모에 포함할 세션을 선택적으로 선언**할 수 있음. 점수 낮을 것 같은 세션은 "충분히 참여 안 함"으로 제외, 점수 높을 세션만 포함 → `invoked-sessions-only`가 오히려 cherry-picking 도구화.

**시나리오**
Nova가 세션 097에서 제안 1건 냈으나 Master가 기각 → `inv_prm` 분자 0. Nova self-score 시 "이건 호출 수준이 약해서 분모 제외"로 선언 → 3세션 연속 이런 식이면 분모=0, `defaultStrategy: previous-session-value`로 이전 점수 영구 상속.

**Mitigation**
- `invoked-sessions-only`에 **명시적 판정 조건** 박기: `turns[*].role == <role> AND turns[*].chars ≥ N` (N=Grade별 최소 임계, 예: A=300, C=50). 자가채점자 재량 제거.
- 판정은 `session-end-finalize.js`가 turns 배열에서 **자동 산출** → 자가 선언 금지.
- `validate-session-turns.ts`가 분모 산출 결과를 session_index에 박제, 자가 YAML은 참고만.

**Fallback**
판정 규칙 합의 실패 시 `invoked-sessions-only` 대신 `all-sessions` + "미참여 세션은 0점"으로 통일 (Goodhart은 증가하나 게이밍은 감소, trade-off 선택).

---

### 🟡 RK-3. `editor.gp_acc` 현세션 산출 불가 — 자가채점 YAML 블록에 쓸 값이 없음

**취약점**
Arki rev2 §1-A 인용: `editor.gap_pinning_accuracy … Edi가 세션 종료 시 박제한 gaps 건수 중 차기 세션 초반 3세션 내 Master·Arki가 "놓침"으로 재지적하지 않은 비율`.

즉 **세션 N의 gp_acc는 세션 N+3 종료 시에만 확정**. 그러나 Ace rev3 §3 출력 예시는 세션 종료 시 composite 표기. Edi가 세션 종료 YAML 블록에 `gp_acc: ?` 어떻게 쓸 것인가?

- 옵션 A: `gp_acc: null` → `missingPenalty: warn` + `defaultStrategy: previous-session-value` 발동 → 세션 N-3 값이 무한 상속되어 **진짜 성과와 무관한 안정 값 고정**.
- 옵션 B: Edi가 현세션 추정치 자가보고 → 3세션 후 실측이 들어와도 이미 박제된 composite는 고정 (revision 프로토콜 부재).

**시나리오**
Edi가 세션 094~097에서 추정 `gp_acc: 80` 자가보고 → 세션 096에서 Arki가 gaps 3건 재지적 → 실측 `gp_acc ≈ 40`. 그러나 이미 박제된 세션 094 composite는 80 기준. dashboard가 "Edi 성장 정체"로 표시되나 실상은 세션 094 소급 수정 없이 고정.

**Mitigation**
- `gp_acc`에 **deferred-settlement 플래그** 신설: 세션 N 박제 시 `gp_acc: deferred`, 세션 N+3 종료 hook에서 소급 값 주입 + composite 재계산.
- 또는 `gp_acc`를 **lookback 지표**로 재정의: 세션 N의 gp_acc = "세션 N-3에서 박제한 gaps 중 N까지 재지적 없는 비율". 현세션 박제 가능.

**Fallback**
revision 프로토콜 설계 실패 시 `gp_acc`를 standard로 강등, core는 `scc`(구조 일관성) 단독으로 운영.

---

### 🟡 RK-4. 가중치 assignment 근거 부재 — composite는 "Ace 주관 가중치의 합"

**취약점**
Ace rev3 §1 Fin weight `0.40/0.25/0.20/0.15`, §2 Dev weight `0.35/0.30/0.20/0.15`. **이 숫자의 근거가 rev3·rev2 어디에도 없음**. core가 왜 0.40이고 standard가 0.15인가? Master 승인만이 근거.

D-059(외부 앵커 cross-check 의무) 정신과 충돌: 지표 자체엔 externalAnchor가 있으나 **합산 가중치엔 anchor 없음**. 즉 composite = Σ(외부 앵커 있는 값 × 외부 앵커 없는 가중치) → 합산 결과의 타당성은 가중치 주관성에 의해 오염.

나아가 core 1건에 0.30~0.40 집중은 **core 지표 1건이 전체 composite의 1/3 이상을 결정**한다는 뜻. core 지표가 Goodhart에 취약하면(→ RK-1) composite 전체가 끌려감.

**시나리오**
세션 3개월 후 dashboard에서 "Dev composite 78 / 100, 상승세"로 표기. Master 의사결정: "Dev 성장 중, 추가 투자". 실상: `rt_cov`와 `hc_rt`(core 2건, weight 합 0.65) 자가채점 인플레이션이 전체의 2/3를 지배. 나머지 35%가 하락해도 마스킹됨.

**Mitigation**
- **가중치 결정 근거를 decision_ledger에 명시 박제**: "Fin cst_acc 0.40 = 역할 정체성 축 우선 + Master feedback N건"처럼 근거 1줄 의무.
- 초기 3개월(~15세션)은 **동일 가중치(uniform)**로 운영 → 데이터 축적 후 근거 기반 재배분. Ace rev3 §1은 "역할 본질" 수사로 0.40 정당화했으나 실측 데이터 0.
- core 가중치 **상한 0.30** 규약: 단일 지표가 composite 1/3 초과 금지.

**Fallback**
3개월 후 composite가 자가채점 trend와 외부 앵커(D-ledger 승급 건수 등) 사이 drift > 20점이면 uniform으로 리셋 + 전체 PD 재오픈.

---

## Master에게 돌려야 할 Q

1. **Q1 (RK-2 근본)**: `invoked-sessions-only`의 "참여" 판정 주체는 누구입니까? 자가 선언인가, turns 자동 산출인가, Master 확인인가? 이 결정 없으면 분모가 임의화됩니다.
2. **Q2 (RK-1·RK-4 교차)**: `dev.hc_rt` core 0.30 + lower-better는 "하드코딩 안 함"만으로 30점 확보 가능한 구조입니다. core 유지하시겠습니까, standard 강등하시겠습니까? core 유지 시 Arki 외부 rater 도입이 필수 조건으로 들어갑니다.
3. **Q3 (RK-3)**: `editor.gp_acc`처럼 3세션 후 실측 확정되는 지표의 박제 프로토콜이 설계되지 않았습니다. deferred-settlement로 갈지, lookback 재정의로 갈지 판정 필요합니다.

---

## 권고: 🟡

진행은 가능하나 Q1~Q3 최소 2건 해소 전 Edi 컴파일 금지를 권고합니다. RK-1(hc_rt Goodhart)과 RK-2(분모 게이밍)는 구조적 결함으로, v1.0 박제 후 수정이 PD-023 재compile·registry drift(Arki R-5 증폭)를 유발합니다. 지금 해소가 훨씬 쌉니다.

Q3는 deferred-settlement 설계가 1세션 분량이므로 PD-040으로 분리해도 합리적입니다 — `gp_acc`를 일시 standard로 강등하고 본 PD-035는 나머지만 박제하는 경로가 최소 저항.

RIKI_WRITE_DONE: reports/2026-04-24_pd035-yaml-instruction-8roles/riki_rev1.md
