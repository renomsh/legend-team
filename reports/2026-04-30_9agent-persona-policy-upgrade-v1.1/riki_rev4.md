---
role: riki
sessionId: session_151
topicId: topic_134
turnId: 4
invocationMode: subagent
date: 2026-04-30
slug: 9agent-persona-policy-upgrade-v1.1
subject: Jobs persona/policy/memory upgrade 5건 사전 리스크 감사
---

# Riki 감사 — Jobs persona/policy/memory upgrade 5건

## 변경 1 — framingStructure 8단계 갱신

### 🟡 R-1. 8단계는 framing 1회당 비용이 높아 `/jobs-framing` 호출 자체를 회피하게 만든다

D-130에서 자동 트리거를 폐기하고 명시 호출로 전환한 시점에서, framing 단계가 5→8로 60% 증가하면 호출 주체(Master/Nexus/타 역할)는 "그냥 인라인으로 진행하자" 판단을 늘릴 가능성이 높다. 7단계 본문(Step0~Step7) 자체는 정당하나, 8단계 모두를 매 호출마다 채우는 의무 구조면 Grade B/C 토픽에서 framing 회피가 발생한다.

파손 범위: Jobs 호출 빈도가 의도보다 낮아져 D-130의 "framing 주체" 정체성이 사문화. memory.json에 `framingStructure`만 갱신하고 "Step0/Step6/Step7은 해당 시에만"이라는 조건부 명시가 없으면 Jobs는 8단계 전체를 매번 채우게 된다.

완화 조건: 8단계 중 **필수(Step1·2·3·4) vs 조건부(Step0 lifecycle 판정 필요시 / Step6 인지편향 적출시 / Step7 executionPlanMode 결정시)** 구분을 memory에 명시.

---

## 변경 2 — Top 0.1% 기준 추가

### 확인된 추가 리스크 없음. 패스.

다른 8역할 일관성 확보 + 제안 문구가 Jobs 정체성(99% 잘라내기 = focus·saying no)과 정합. 리스크 식별 안 됨.

---

## 변경 3 — 호출 규칙 `callerScope: "any"`

### 🟡 R-2. "누구든 호출 가능"은 Nexus 단일 orchestration 책임(D-130)과 충돌 가능

D-130은 "Orchestration = Nexus 단일 책임"으로 박제됐다. `callerScope: "any"`로 다른 역할(Arki·Fin·Riki 등)이 직접 Jobs를 호출할 수 있게 하면, Nexus를 우회하는 호출 경로가 정책상 합법화된다. session_150에서 발생한 "Ace 무단 호출" 과실(G-9)과 동형 패턴이 Jobs에서 재발할 위험.

파손 범위: 역할 서브에이전트가 자기 발언 중 Jobs를 직접 호출 → Nexus의 호출 순서·재호출 판단 권한이 분산 → orchestration 책임 추적 불가.

완화 조건: `callerScope`를 `"master | nexus"`로 제한하거나, `"any"` 유지 시 "타 역할 호출 시 Nexus 사후 승인 필수" 단서 추가. Master 지시가 "누구든"이라면 그대로 가되, 호출 로그가 Nexus orchestration 기록에 자동 박제되는 메커니즘 명시 필요.

---

## 변경 4 — Self-Score 지표 3개

### 🔴 R-3. `frm_acc` "Master 수정 없이 채택=1.0" 기준은 Master 침묵을 만점으로 오역한다

Master 피드백 정책상 무응답=승인(저마찰 자율성, session_066)이다. 이 정책 하에서 `frm_acc`를 "수정 없이 채택"으로 정의하면, **Master가 단순히 응답하지 않은 경우도 1.0**으로 채점된다. Jobs는 "Master가 침묵할 만한 무난한 framing"을 선호하게 되고, 이는 Jobs persona의 "99% 잘라내기" 정체성과 정면 충돌한다.

파손 범위: Jobs 자가평가 점수가 framing 품질이 아니라 **무난함**을 측정. 대시보드에서 Jobs 점수가 높아도 실제 framing이 결정에 영향을 주지 못하는 상태가 누적.

완화 조건: `frm_acc` 정의를 "Master가 명시적으로 채택 표명한 경우=1.0 / 침묵=N/A(미채점) / 명시적 수정=0.5 / 명시적 폐기=0.0"로 변경. 침묵을 만점으로 처리하지 않음.

### 🟡 R-4. `bias_cnt`는 카운팅 지표 — Riki R-3(session_151 turn 0)와 동일한 registry 미등록 리스크

직전 턴에서 내가 지적한 Zero `hc_found`/`ref_cnt`와 동형. `bias_cnt`도 상한 없는 양의 정수로 기존 4가지 scale(`0-5/Y·N/ratio/percentile`) 어디에도 속하지 않는다. `metrics_registry.json`에 `scale: count` 타입 등록 + `session-end-finalize.js` 파서 수정이 선행되지 않으면 Jobs `bias_cnt`도 조용히 누락되거나 검증 실패한다.

완화 조건: Zero 카운팅 지표 도입과 **묶어서** registry/파서 수정. 분리 도입 금지.

### 🟡 R-5. `focus_clr` "saying no 1줄 명확=1.0"은 자가채점 편향 회피 불가

`focus_clr`는 Jobs 자신이 자기 발언의 명료성을 채점한다. Jobs persona가 "focus 설계자"인 만큼 자가채점에서 "내 saying no는 명확하다"로 1.0 부여 편향이 구조적으로 발생한다.

완화 조건: 외부 검증 가능한 객체적 기준 추가 — "saying no 항목이 명시적 글머리표/번호로 분리 표기되었는가(Y) + 토픽 결정축 외 항목을 명시적으로 out-of-scope 선언했는가(Y)" 같은 체크리스트화.

---

## 변경 5 — 한 줄 정의 수정 필요성

### 의견: **수정 필요**

근거 3가지:

1. **레전드팀 맥락 부재**: 현재 문장 "인간의 심리를 꿰뚫어 독보적인 경험을 창조한다"는 제품 디자인 철학(Apple·Jobs 인용구)이며 레전드팀 내 framing 생성 역할을 지시하지 않는다. Master가 이 문장을 읽고 Jobs를 언제 호출해야 하는지 판단 불가.

2. **Kahneman 합성 결여**: D-130 박제는 "Steve Jobs + Daniel Kahneman 합성"이다. 현재 문장은 Jobs 측면(독보적 경험)만 반영, Kahneman 측면(인지편향 적출·framing 효과 인식)이 누락. persona 핵심 합성을 한 줄 정의가 표현하지 못함.

3. **다른 역할 한 줄 정의 패턴 불일치**: 다른 역할들의 정체성 정의는 "역할 동작"을 직접 서술(Riki="리스크 감사자", Arki="구조 설계자"). Jobs만 결과 효과("경험 창조")를 서술해 호출 트리거 판단 어려움.

**교체 제안 방향** (Riki는 문구 작성 주체 아님): framing 동작 + 인지편향 적출 + Focus 설계 3요소 중 최소 2개를 직접 서술하는 동작 중심 1문장.

---

## 기각 항목 (의도적 제외)

- "Jobs 신설 자체가 Ace와 책임 중복" — D-130에서 Ace=구조·흐름 판정, Jobs=framing으로 명확히 분리됨. 정책 박제 완료 사항이라 리스크 아님.
- "8단계가 너무 많다" 일반론 — R-1에서 호출 회피 인센티브로 구체화했으므로 일반론은 중복 제거.
- "ratio 0~1 scale 자체의 정밀도 부족" — 기존 4 scale 정책 재논의이며 Jobs 특이적 아님.
- "Steve Jobs 인물명 사용 적절성(F-013과 별개)" — persona 합성 레퍼런스로서의 인물명은 F-013 위반 아님.

---

## 핵심 요약

5건 중 진짜 위험한 항목은 **R-3(`frm_acc` 침묵=만점 오역)** — Jobs를 무난함 추구 역할로 변질시킨다. 즉시 정의 수정 필요. **R-4(`bias_cnt` registry 미등록)**는 직전 턴 Zero R-3와 묶어 처리하지 않으면 동일 기술 부채. **변경 5(한 줄 정의)**는 수정 필요 — Kahneman 합성 누락 + 호출 트리거 판단 불가. 변경 2는 리스크 없음. 변경 1·3은 완화 조건 부착 시 진행 가능.

[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
