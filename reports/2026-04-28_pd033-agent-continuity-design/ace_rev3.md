---
role: ace
session: session_123
topic: topic_121
topicSlug: pd033-agent-continuity-design
turnId: 5
invocationMode: subagent
grade: A
date: 2026-04-28
rev: 3
recallReason: post-master
splitReason: "Master 비전 축소 해석 정정 — 토픽×세션 2축"
---

# Ace 종합검토 rev3 — Master 비전 정정본 정확히 받기

Ace입니다. rev2에서 Master가 안 한 말을 자가 추가했습니다. 정정합니다. 본 비전은 1축이 아니라 2축입니다.

---

## Sec 1. Master 비전 정정본 1문장 재선언

**원문 (직접 인용)**:
> "내가 같은 세션 안에서 토픽을 끝낸다는 말은 안했는데. 하나의 토픽을 여러 세션에서 진행할 수 있고, 세션의 내용은 저장되기 때문에 같은 토픽일 때는 해당 내용들을 읽어야하고, 하나의 세션 내에서는 서로의 내용을 알아야 한다는게 내 전제야. 그게 구성이 안되면 회의를 할 이유가 없잖아."

**메인 합성 4점 검증**:

| # | 메인 해석 | Ace 판정 | 비고 |
|---|---|---|---|
| 1 | 토픽은 여러 세션에 걸칠 수 있음 | ✅ 확정 | rev2 "1세션 완결" 가정 폐기. 본 토픽 자체도 다음 세션으로 이어질 수 있음 |
| 2 | 토픽 layer 누적 — 같은 토픽 다음 세션은 이전 세션 발언 모두 read | ✅ 확정 | 토픽이 canonical. 세션은 토픽의 진행 단위 |
| 3 | 세션 layer 동기 — 같은 세션 내 다른 역할 발언 즉시 read | ✅ 확정 | 회의 동시성 — 옆사람 발언을 알아야 의미 |
| 4 | 2축 모두 충족 안 되면 회의 자체 무의미 | ✅ 확정 | "회의를 할 이유" = 다중 호출의 존재 이유. 자동 inject 부재 시 다중 호출은 비용만 증가 |

**비전 1문장 재선언**:

> **"토픽 단위로 영속, 세션 단위로 동기. 같은 토픽이면 과거 세션 발언 자동 read, 같은 세션이면 타 역할 발언 자동 read. 둘 중 하나라도 빠지면 다중 호출은 무의미."**

핵심어는 **토픽 영속·세션 동기·자동·둘 다**. "1세션 완결"은 비전이 아니었습니다.

**"회의를 할 이유" 문구 의미**: 8역할 다중 호출의 존재 가치는 *상호 인지 위에서 누적되는 합성*입니다. 자동 inject 인프라 없으면 N번 호출은 N번의 독립 monologue — 회의가 아니라 발화 N건의 집합. 인프라 부재 시 시스템이 그동안 *회의 행세*를 한 셈.

---

## Sec 2. ace_rev2 결함 자가 인정

**결함 1 — Master가 안 한 말 자가 추가**:
- rev2 Sec 1 표 #1: `"최소 세션 안에서" = ... *지금 이 세션 안에서 토픽을 끝내라*`로 해석.
- Master 원문엔 "최소 세션" 표현 없음. rev2가 다른 라운드 비전(아마 이전 세션)을 본 토픽에 잘못 결합. **자가 추가 환각**.
- mst_fr 점수에 직격 — 본 rev3는 그 결함 정정 발언이라 mst_fr=0 (rev2가 재수정됨).

**결함 2 — 토픽 layer 누락**:
- rev2 C1·C2·C3 전부 *세션 단위* 가정 위에 설계됨.
- C1-α PreToolUse hook의 inject 범위가 "직전 reports/ 경로"만 — 같은 토픽의 *과거 세션* reports/ 누락.
- 결과: 토픽이 2~3세션에 걸치면 N+1세션은 N세션 발언을 자동 read 못함. 비전 #2 직격 위반.

**결함 3 — C3 토픽 종결 처리 정의의 토대 결함**:
- rev2 C3는 "토픽 closed 시 캐릭터 자동 승격" — *토픽이 한 세션 안에서 closed 된다*는 가정.
- 정정: 토픽은 *세션을 가로질러* 진행 → C3는 "토픽 진행 중 세션 종료 시 어떻게 다음 세션으로 넘기는가"가 본 질문. *closed* 처리는 그 다음 단계.

**갱신 매핑** — rev2의 어떤 부분이 살아남고 무엇이 갱신되는가:

| rev2 요소 | 처리 |
|---|---|
| C1-α PreToolUse(Task) hook 코드 강제 | ✅ 살림 — 메커니즘 자체는 정합 |
| C1-α inject 범위 "직전 reports/ 경로" | ❌ 갱신 — *직전 같은 세션 + 같은 토픽 모든 과거 세션*으로 확장 |
| C2-α turn 발언 전문 read | ✅ 살림 — 200자 summary 부족 진단 그대로 |
| C2-α "신규 저장 인프라 0" | ⚠️ 부분 살림 — reports/ 재활용은 그대로, 단 *세션 layer 인덱스*는 신설 필요 |
| C3-β 캐릭터 자동 승격 | ⚠️ 보류 — 토픽 종결이 후순위. 토픽 진행 중 세션-간 승계가 우선 |
| C4-γ PD-044 폐기 | ✅ 살림 — hook이 페르소나 read 강제 시 슬림화 동기 소멸 변함 없음 |
| 4축 구성 (C1~C4) | ❌ 갱신 — 5축으로 확장 (inject 범위 축 신설) |

---

## Sec 3. C-축 재정정 — 5축

### C1. 자동 inject 메커니즘 (rev2 권고 유지 검증)

| 옵션 | 설명 |
|---|---|
| **C1-α: PreToolUse(Task) hook** | Agent tool 호출 직전 hook가 prompt에 표준 dispatch 블록 + 경로 list + 페르소나 read 명령 자동 prepend |
| **C1-β: 메인 dispatch 코드 표준화 + finalize 검증** | 메인이 표준 함수로 dispatch + finalize hook가 누락 검증 |

**Ace 단일 권고**: **C1-α**.

근거 — rev2와 동일하나 비전 정정 후 더 강해짐:
1. 토픽 layer + 세션 layer *2축 자동 inject*가 비전인데 메인 휘발성 의존(C1-β)은 1축도 못 강제. 2축은 더더욱 무리.
2. PostToolUse(Task) hook이 이미 turn 박제 자동화 중 (rev2 K7) → PreToolUse도 동일 메커니즘 가정 합리.
3. 비전 "회의를 할 이유" 직격 — 코드 레벨 강제만이 *시스템적 보장*. 문서·prompt 표준은 휘발성.

### C2. inject 범위 (신설 — 비전 핵심)

| 옵션 | 설명 |
|---|---|
| **C2-α: 토픽 layer만** | 같은 토픽의 모든 세션 reports/ inject. 같은 세션 내 옆 역할은 누락 |
| **C2-β: 세션 layer만** | 같은 세션 내 모든 역할 inject. 과거 세션은 누락 |
| **C2-γ: 양축 모두** | 세션 layer (직전 같은 세션) + 토픽 layer (과거 세션 누적) 둘 다 inject |

**Ace 단일 권고**: **C2-γ 양축**. 비전 직역.

작동 메커니즘 차이 명시:
- **세션 layer**: PreToolUse hook이 `current_session.json.turns[]` read → 같은 토픽의 turn 발언 reports/ 경로 list 자동 prepend. 세션 진행 중 실시간 누적.
- **토픽 layer**: PreToolUse hook이 `topics/{topicId}/` 하위 turn_log.jsonl 또는 session_contributions/ read → 같은 토픽의 과거 세션 발언 reports/ 경로 list 자동 prepend. 세션 시작 시점에 인지.

두 layer는 *경로 list 출처*가 다를 뿐 *prepend 메커니즘은 동일*. hook 한 본문 안에서 두 source 합쳐 dedupe 후 prepend.

### C3. 토픽 layer 인프라

| 옵션 | 설명 |
|---|---|
| **C3-α: 기존 `topics/{id}/turn_log.jsonl` 자동 read+inject** | PD-020b 인프라 활용. turn당 1줄 jsonl. role·rev·summary·reports/ 경로 |
| **C3-β: 기존 `context_brief.md` 자동 read+inject** | `/open` 시 생성되는 토픽 브리프. 자연어 요약 |
| **C3-γ: 양쪽 + role별 필터링** | turn_log.jsonl(인덱스) + context_brief.md(서사) + 호출 역할 본인의 직전 발언만 필터하여 reports/ 전문 read |

**Ace 단일 권고**: **C3-γ**.

근거:
1. turn_log.jsonl은 *기계 인덱스*, context_brief.md는 *서사 맥락* — 역할이 다름. 둘 다 inject가 정합.
2. role별 필터링으로 prompt 부풀림 방지 — Arki 호출 시 Arki 본인 직전 N개 + 타 역할은 인덱스 1줄씩.
3. **신규 저장 인프라 0** — PD-020b 산출물(turn_log.jsonl + context_brief.md) 100% 재활용. *Master 비전 충족 + 인프라 신설 0*. 짓지 않을 수 있는 부분은 짓지 않는다.

### C4. 세션 layer 인프라 (신설)

| 옵션 | 설명 |
|---|---|
| **C4-α: `current_session.json.turns[]` + reports/ 경로 자동 inject** | 기존 turns[] 배열에서 같은 토픽 turn 추출 → reports/ 경로 prepend |
| **C4-β: 신규 `memory/sessions/temp/{sessionId}/{role}.jsonl` 신설** | 세션-역할별 신규 파일 신설 |
| **C4-γ: in-memory만 — hook이 reports/ 직접 inject** | 세션 내 turn마다 reports/ write 후 hook이 매 호출 reports/ glob |

**Ace 단일 권고**: **C4-α**.

근거:
1. `current_session.json.turns[]`은 이미 D-048(Turn Push Protocol)로 매 turn 기록 자동화 — 세션 layer의 인덱스로 이미 충분.
2. reports/ write도 페르소나 Write 계약으로 자동 — 본문 영구 보존도 이미 작동.
3. *신설 0건*. C4-β 신규 jsonl은 turns[]와 중복. C4-γ glob은 비싸고 정렬 깨짐.
4. PreToolUse hook이 `current_session.json` read → 같은 topicId의 turn list → reports/ 경로 추출 → prepend. 1 hook 본문 안에서 처리.

### C5. 토픽 종결 시 처리 (rev2 C3 갱신)

| 옵션 | 설명 |
|---|---|
| **C5-α: 토픽 layer 그대로 보존 (재오픈 시 read)** | turn_log.jsonl·context_brief.md·reports/ 변경 없음. 재오픈 토픽도 hook이 동일 inject |
| **C5-β: 캐릭터(Tier 2) 자동 승격 + 토픽 layer archive** | rev2 권고 — 매칭 algo로 캐릭터 patterns 추가 후 archive |
| **C5-γ: session_contributions/ 패턴 그대로 (PD-020b)** | 이미 작동 중인 토픽 종결 산출물 — 추가 안 함 |

**Ace 단일 권고**: **C5-α + C5-γ 결합**. C5-β는 부결.

근거:
1. 토픽 종결은 *진행이 끝났다*는 신호일 뿐, *읽지 못하게 한다*는 의미 아님. 재오픈은 항상 가능 (D-056/057 lifecycle).
2. session_contributions/.md 패턴은 이미 작동 — 추가 archive 인프라 0.
3. 캐릭터 자동 승격(C5-β)은 *토픽 간 학습*의 다른 문제 — 본 토픽 비전 "토픽 영속·세션 동기"와 직교. 별도 PD로 분기 권고. 본 토픽 종결 박제 **dropped**.
4. 비전이 *토픽 layer가 살아있다*고 명시 → archive해서 hook의 read 경로에서 제외하는 것은 비전 위반 가능. C5-α가 가장 비전 정합.

---

## Sec 4. PD-033/043/044 매핑 갱신

| PD | rev3 결론 | 근거 |
|---|---|---|
| **PD-033** (지속성) | resolved-by-C1α + C2γ + C3γ + C4α | 토픽 layer (turn_log.jsonl + context_brief.md + role 필터 reports/) + 세션 layer (turns[] + reports/) 양축 자동 inject. 신설 인프라 = PreToolUse hook 1개만 |
| **PD-043** (사칭 검출) | resolved-by-finalize-함수 +1 | rev2 결정 유지 — `validateInlineRoleHeaders(reports)` finalize에 추가. PostToolUse(Task) hook은 turn 박제용으로 이미 작동 |
| **PD-044** (정책-페르소나 박제) | dropped-by-C1α-side-effect | PreToolUse hook이 페르소나 read 명령 prepend → 페르소나 자동 inject 보장 → 슬림화 동기 소멸. 종결 박제 또는 별도 토픽 — Master 게이트 |

---

## Sec 5. 핵심 전제 갱신

| # | 전제 | 표시 | rev2 대비 |
|---|---|---|---|
| K2 | 같은 session 내 동일 역할 서브 N번째 호출은 직전 컨텍스트 미보유 | 🔴 | 유지 — 세션 layer 자동 inject 필요 근거 |
| K4 | 페르소나는 메인 prompt에 명시 inject 시에만 작동 | 🔴 | 유지 — PreToolUse hook이 read 명령 prepend로 메움 |
| K6 | PreToolUse(Task) hook이 stdin tool_input.prompt mutation 허용 | 🔴 | 유지 — Phase 1 G1 spec 실측 필수 |
| **K7 (NEW)** | **`topics/{id}/turn_log.jsonl`·`context_brief.md`·`session_contributions/`이 토픽 layer 자동 read 인프라로 작동 가능** | 🔴 | **신규 — PD-020b 산출물의 read 가용성. 파일 존재·스키마 안정 실측 필요** |
| **K8 (NEW)** | **PreToolUse hook이 메인 prompt 외 system message에도 prepend 가능** | ⚠️ | **신규 — Claude Code spec 실측 필요. user prompt mutation은 K6, system 영역은 K8. 양쪽 다 가능하면 페르소나 read 명령은 system, 경로 list는 user에 분리하여 깔끔. 어느 한 쪽만 가능하면 user에 합침** |

K7 부정 시 토픽 layer는 신설 인프라 1건 필요 (C3 옵션 갱신). K8 부정은 차선만 잃음 (C1-α 자체는 K6 충족이면 작동).

---

## Sec 6. executionPlanMode 재선언

**executionPlanMode: plan** (유지).

Phase는 토픽-세션 2축 분기 명시:

- **Phase 1 (G1 spec 실측)**: K6 (PreToolUse mutation) + K7 (turn_log.jsonl 등 read 가용성) + K8 (system prepend) 3건 falsification probe.
- **Phase 2 (인프라 구축)**:
  - 2A 세션 layer — hook이 `current_session.json.turns[]` → reports/ 경로 prepend
  - 2B 토픽 layer — hook이 `topics/{id}/turn_log.jsonl` + `context_brief.md` + `session_contributions/` read → role 필터 prepend
  - 2C dedup·정렬 — 같은 reports/ 경로가 양 layer에서 잡히면 1회만
- **Phase 3 (검증)**:
  - 3A 세션 layer dry-run — 같은 세션 Arki N차 호출이 N-1차 turn 인지 (rev3 자기감사 패턴 재현)
  - 3B 토픽 layer dry-run — 다음 세션 Arki 1차 호출이 본 세션 발언 reports/ 인지 (시뮬레이션 또는 실세션)
  - 3C `validateInlineRoleHeaders` finalize 함수 — PD-043 종결

**중단 조건**: K6 미허용이면 PreToolUse hook 별도 PD 분기 + 본 토픽은 C1-β fallback으로 종결. K7 미실측이면 토픽 layer는 Phase 2B에서 인프라 신설 옵션 재검토.

---

## Sec 7. 다음 발언자 추천 + Master 게이트

**단일 권고**: **Arki rev4 (spec 정식화)**. 단 Master 가벼운 확인 1건만 동반.

근거:
1. rev2는 4축 결정 게이트로 Master를 묶었는데, 본 rev3에서 5축 권고가 비전 직역으로 자명 — *결정 불요*. memory feedback `feedback_low_friction_no_redundant_gate`("결정 필요 0건이면 묻지 말고 다음 단계") 적용.
2. Arki rev4가 K6/K7/K8 spec 실측 + Phase 1~3 정식화하는 것이 자연스러운 다음 단계. Riki·Fin은 spec 정식화 후가 효율적.
3. Master 가벼운 확인 1건: PD-044 처리 — *C4-γ 폐기 종결 박제* vs *별도 토픽 분기*. 본 토픽에선 다루지 않으나 결론은 박제 필요.

**무응답 처리**: PD-044는 종결 박제(C4-γ). Arki rev4 즉시 호출.

다른 후보 부결 사유:
- Master 직접 결정 — 결정 불요. 비전 직역 권고는 자명.
- Riki(공격) — spec 미정 상태에선 공격 대상이 흔들림. spec 정식화 후 Phase 4에서 호출.
- Fin(자원평가) — hook 1개 + finalize 함수 1개의 자원 부담은 정성 평가도 거의 0. Phase 2 spec 후 contamination 감사로 호출.

---

```yaml
# self-scores
rfrm_trg: Y
ctx_car: 0.95
orc_hit: 0.85
mst_fr: 0
ang_nov: 3
```

**다음 발언자 추천**: Arki rev4 (5축 권고 기반 spec 정식화 — Phase 1 G1 K6/K7/K8 spec 실측 + Phase 2 hook 본문 spec + Phase 3 dry-run plan).
