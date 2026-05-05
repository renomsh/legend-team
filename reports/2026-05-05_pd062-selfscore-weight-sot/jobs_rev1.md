---
role: jobs
turnId: 1
sessionId: session_193
topicId: topic_166
grade: B
invocationMode: subagent
---

JOBS_WRITE_DONE: reports/2026-05-05_pd062-selfscore-weight-sot/jobs_rev1.md

# Jobs — PD-062 Frame

Jobs입니다. Arki 발언 받았습니다. frame 짧게 박습니다.

---

## 1. 본질 (Why)

**PD-062는 "weight 필드를 어디에 둘지"가 아니라 "쓰지도 않는 필드의 SOT를 왜 논쟁하고 있는가"의 문제다.**

session_191 D-158 박제 시점엔 "SOT 부재 = drift 위험"으로 보였지만, 실측해보니 weight를 읽는 코드가 0줄이다. 위험으로 본 것이 환상이었다.

## 2. 결과물 (What)

**8개 policy 파일에서 weight 컬럼이 사라진 상태. PD-062는 종결. 박제 1줄: "사용처 없는 메타데이터의 SOT 논쟁은 하지 않는다."**

Master는 이 결과물을 보고 "drift 사고가 또 늘어났다"가 아니라 "drift 정의가 정련됐다"로 인식해야 한다.

## 3. 결정축 (단일)

**"weight를 살릴 것인가, 묻을 것인가"** — 이게 유일한 축입니다.

- 살리기: A·B·C 중 어느 안이든 — 비용 발생, 가치 0, PD-063 의존
- 묻기: D — 비용 0, 가치는 군더더기 제거

세 안(A·B·C)을 비교하는 것 자체가 prompt anchoring이었습니다. Master가 "3안 시뮬레이션"을 요청한 건 정직한 비교 요청이지 "셋 중 하나 골라라"가 아닙니다. Arki가 4번째 안(D)을 제시한 것은 정합 — Jobs도 동일.

## 4. Scope In/Out

**In:**
- 8 policy 파일 weight 컬럼 + `0.50 (core)` 토큰 삭제
- D-159(또는 후속 D) 박제: "사용처 0 dead field는 SOT 논쟁 대상이 아니다"
- PD-062 → resolved-cancelled

**Out (saying no):**
- PD-063(role_memory.metrics[] 데이터 경로 복원)은 본 토픽 OUT — 별개 토픽
- core/extended 분류 보존 논쟁은 OUT — 이미 `inputPriority` 필드로 살아있음(Arki 1-3 확인)
- weight 검증 validator 작성은 OUT — 0회 읽히는 필드 검증은 측정 위한 측정
- "혹시 미래에 쓸 수도" 변호는 OUT — 그때 가서 `composition.inputs[]` 패턴으로 추가
- 다른 dead field 일괄 점검(frame-3 후보)은 OUT — 본 토픽은 weight 단건. 일반 위생은 별도 토픽 발의 시.

## 5. 핵심 전제

- 🔴 weight를 읽는 코드가 정말 0줄이다 (Arki 1-3·1-4 확인). 틀리면 frame 무효.
- 🟡 D-158 박제 당시 PD-062 분리 판단은 "drift 사고 정합" 의도였지 "weight 가치 검증"이 아니었다 (재해석 가능).
- 🟢 Master가 "구조 정합성"을 가치로 본다(메모리 `feedback_simple_growth_not_measurement` 정합).

## 6. 인지편향 자가 점검

**본 frame이 빠질 수 있는 편향 — 정직하게 적출:**

1. **confirmation bias** — Arki가 D안 권고했고 Jobs도 D안에 동조. "Arki가 맞으니까 맞다"가 아니라 "Arki 근거(사용처 0)가 검증 가능하니까 맞다"로 분리해야 함. 검증축: dashboard·compile·hook grep 결과 0건이 사실인지 Dev 단계에서 재확인 의무.

2. **anchoring** — Master prompt의 "3안 시뮬레이션 후 결정"이 anchor. 3안에 갇히면 D안이 보이지 않음. Arki가 깬 anchor를 Jobs도 깬다.

3. **sunk cost fallacy 회피** — D-158 박제(weight SOT 분리 결정)를 보존하려는 압력 발생 가능. "이전 결정 살리려고 dead field를 살리지 않는다." D-158은 PD-062 *분리*만 결정했지 weight *보존*을 결정한 것이 아님 — sunk cost 없음.

4. **(주의) availability heuristic 역방향** — drift 사고 5건이 표 형식 문제였기에 "표 형식 = drift 위험"으로 일반화될 위험. weight는 표 형식이지만 drift 발생 0건. 형식 ≠ 위험.

## 7. Focus 설계

- **본질 1줄**: 사용처 0 필드는 SOT 논쟁 대상이 아니다.
- **saying no 1줄**: weight를 살리는 모든 안을 거부한다 (A·B·C 전면 기각).
- **단일 액션 1줄**: 8 policy weight 컬럼 삭제 + D 박제 + PD-062 resolved-cancelled.

## 8. executionPlanMode

`executionPlanMode: none`

근거: 변경 범위 8 policy 파일 weight 컬럼 일괄 삭제 + ledger 1건 + PD 1건. Phase 분해 불필요. Dev 직행 가능.

## 9. Grade 적합성

**현 Grade B 정합** — override 없음.

근거: 결정 축 단일(살리기 vs 묻기), 변경 범위 ~10파일, 명확 결정건. C로 하향 가능성도 있으나 (a) 8 policy 일괄 변경은 일관성 강제 필요, (b) D 박제로 정책 일반화 효과, (c) 인지편향 적출이 의미 있는 분량 — B 유지.

---

selfScores: {"focus_sharp": 5, "bloat_idx": 1, "bias_cnt": 4, "no_cnt": 5}

[ROLE:jobs]
# self-scores
focus_sharp: 5
bloat_idx: 1
bias_cnt: 4
no_cnt: 5
