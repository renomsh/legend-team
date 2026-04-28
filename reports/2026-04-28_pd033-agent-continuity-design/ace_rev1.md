---
role: ace
session: session_123
topic: topic_121
topicSlug: pd033-agent-continuity-design
turnId: 0
invocationMode: subagent
grade: A
framingLevel: 2
date: 2026-04-28
rev: 1
---

# Ace 프레이밍 — PD-033 각 Agent 연속성 방안 수립

## Step 0. 토픽 생명주기 판정

- **topicType: framing**
- **parentTopicId 후보: topic_096 (S grade, "legend-team 구조 점검 — 서브에이전트 미발동·세션 단절 원인 + 상시 병행 검토", 2026-04-24 closed)**
- 근거: topic_096이 PD-033/PD-043/PD-044가 속한 인프라 진단 라인의 직계 부모. session_092 D-071/D-072로 dispatcher 폐기 → 그 이후의 "현재 살아남은 PD-033"이 본 토픽의 대상.
- 본 토픽은 **방안 수립(설계 결정) 단계**이며 구현 단계 아님. Resolved 조건("같은 session 내 Arki 3회 호출 시 F-NNN 유지 + scratchpad 또는 SendMessage 택1 구현")은 본 토픽에서 결정만 하고 구현은 child 토픽으로 분리 권고. 단 Master memory feedback `feedback_no_premature_topic_split.md`("토픽 분화 신중 — 한 토픽 안에서 끝까지")가 있으므로 분리 여부도 A3 결정축으로 정식 상정합니다.

### Step 0b. PD 교차검증 3행

| 검증 축 | 결과 | 비고 |
|---|---|---|
| children 확인 | topic_096 closed, child 단절. PD-033 자체엔 child 토픽 미생성 | parentTopicId=topic_096 추가 권고 |
| git log 확인 | `6a8b497 session end: legend-team-structure-audit-subagent-persistence` 1건 (session_091, topic_096). 그 외 sendmessage·scratchpad 키워드 commit 0건 | 22세션 fiction 잠복(D-071) → 4일 동안 미해소 |
| artifacts 확인 | `.claude/agents/role-*.md` 4개 archive 처리(D-073). `opus-dispatcher` skill 폐기. `dispatch_config.json` 폐기. `.claude/skills/`에 `dispatching-parallel-agents`·`subagent-driven-development` 잔존. **현재 본 발언 자체가 서브에이전트 호출로 작동 중** — 즉 D-071 폐기 이후 별도 메커니즘으로 Task tool subagent invocation은 살아있음 | "dispatcher 폐기 = 서브에이전트 시스템 폐기"가 아님. 호출 인프라는 남아 있고, 폐기된 건 Sonnet/Opus 모델 분기 로직. **PD-033이 다루는 "지속성"은 모델 분기와 직교** |

**핵심 통찰**: D-071이 폐기한 것은 *모델 분기 dispatcher*이지 *서브에이전트 호출 자체*가 아닙니다. PD-033은 "호출은 되는데 매번 재부팅"이라는 지속성 문제로 **여전히 유효**하며, Master가 본 토픽을 A grade로 직접 오픈한 이유가 그것입니다.

---

## Step 1. 토픽 정의

**핵심 질문 (1문장)**:
> 같은 session 내 동일 역할 서브에이전트가 N회 호출될 때 직전 호출의 finding/판단을 어떤 메커니즘으로 승계할 것인가, 그리고 PD-043(역할 사칭 검증 hook)·PD-044(정책-페르소나 박제)를 본 토픽 안에서 묶을 것인가.

**왜 지금**:
- D-066(Grade A 서브에이전트 강제) + F-005(Ace relay 금지) + PD-035(YAML self-score instruction 페르소나 박제)까지 박혔으나, **finding 누적·승계 자체는 미해결**.
- session_119 Master 피드백 `feedback_arki_full_system_view`("코드 한 축만 보고 단언 금지, 다축 교차 검증")은 **다축 검증 인프라가 서브 간에 작동해야** 의미 있음. 현재는 매 호출 재부팅 → Arki 1차 호출이 본 finding을 못 보고 단언 → Master가 직접 적발. 인프라 부재가 직접 원인.
- D-071/D-072로 fiction 잡았지만 **남은 진짜 문제(지속성·사칭·정책박제)는 미해결로 4일째**. 이번 세션에서 결정 안 박으면 PD-033은 또 잠복.

---

## Step 2. 결정 축 (Decision Axes)

### A1. 지속성 메커니즘 — 어떤 경로로 finding을 승계할 것인가

| 옵션 | 설명 | 트레이드오프 |
|---|---|---|
| **A1-α: SendMessage 툴 활성화** | Claude Agent SDK의 inter-subagent 메시지 채널 사용. 서브 간 직접 통신 | (+) 가장 깔끔한 모델. (−) D-072 게이트(falsification probe 1회 통과 필수)에 걸림. SDK 가용 여부 미실측 — 22세션 dispatcher fiction 재현 위험 |
| **A1-β: Shared scratchpad JSON + explicit re-inject** | `memory/sessions/scratchpad/{sessionId}/{role}.json`에 turn별 finding append. 메인이 다음 호출 시 prompt에 명시적으로 read+inject | (+) 파일 기반 inspectable. 즉시 구현 가능. CLAUDE.md "Prefer explicit, inspectable, file-based structure" 원칙과 정렬. (−) 메인이 매번 수동 inject — 자동화 hook 필요 |
| **A1-γ: hybrid (SendMessage 시도 + scratchpad fallback)** | 양쪽 다 박제 | (−) **명시적 절충안 — 기각 사유 자동 발효**. memory feedback `feedback_no_middle_ground` 위반. 2벌 인프라 부담 |

**Ace 강한 의견**: **A1-β 단독**. 이유 3가지:
1. D-072는 인프라 결정에 falsification probe 1회 통과 의무를 박았는데 SendMessage는 미실측 = G1 게이트 미통과 = **결정 박제 차단** 대상.
2. 22세션 dispatcher fiction 재발 방지가 Riki 권고 → 검증 가능한 단순 경로 우선.
3. 파일 기반 = Claude Code 정책(D-002 쓰기 경로 단일화)과 자연 정렬. 서브 발언 직후 `memory/sessions/scratchpad/{sessionId}/{role}/turn_{idx}.json` write를 페르소나 Write 계약에 추가하면 끝.

### A2. 역할별 lifecycle 차등 vs 단일

| 옵션 | 설명 |
|---|---|
| **A2-α: 단일 lifecycle** — 모든 서브가 call-마다 재부팅 + scratchpad 일괄 인젝트 | 단순 / 모든 역할 동등 |
| **A2-β: 차등 lifecycle** (PD-033 본문안) — Ace=session 상주, 타 역할=topic 상주, 일부=call 상주 | "상주"가 SDK상 fiction일 가능성. session_092 D-071이 가르친 교훈 |

**Ace 강한 의견**: **A2-α 단일 lifecycle**. PD-033 본문이 제시한 차등안은 SDK 격리 인프라가 fiction이라는 D-071 결과 이후엔 의미 없음. 모든 호출이 *재부팅*이 사실이고, 차등은 scratchpad inject 범위(전체 session 누적 vs topic 누적 vs 직전 turn만)로만 처리. 즉 **저장은 동일·인젝트 정책만 차등**. 역할별 inject scope:
- Ace: session 누적 전체
- Arki/Riki/Fin: topic 누적 + 직전 같은 역할 turn 전체
- Edi/Dev: 직전 turn만 (포맷·구현 작업은 누적 부담 불필요)
- Nova: 인젝트 없음 — 의외성 보존

### A3. 본 토픽 스코프 — PD-033 단독 vs 묶음

| 옵션 | 포함 PD | 트레이드오프 |
|---|---|---|
| **A3-α: PD-033 단독** | 지속성만 결정 | (+) 단순. (−) PD-043(사칭 hook)이 PD-033 의존이라 다음 토픽이 곧 열림 — 3토픽 분할이 inflation |
| **A3-β: PD-033 + PD-043 묶음** | 지속성 + 사칭 검증 hook | scratchpad turn append와 사칭 검증은 같은 turns[].role 데이터 축을 공유 → 동일 토픽 처리가 자연 |
| **A3-γ: PD-033 + PD-043 + PD-044 묶음** | + 정책-페르소나 박제 | (+) memory feedback `feedback_implementation_within_3_sessions`("3세션 이내") + `feedback_no_premature_topic_split`("한 토픽 안에서 끝까지") 양립. (−) Grade A 1세션 부담 증가 |

**Ace 강한 의견**: **A3-γ 3개 묶음**. 근거:
1. PD-044(정책-페르소나 박제)는 **scratchpad inject 정책이 어디 박제되는가**의 직접 답이다. 현재 페르소나에 self-score YAML 박제만 있고 turn-append 의무는 미박제. 본 토픽 결정과 동시에 페르소나에 박제해야 다음 세션부터 작동.
2. PD-043(사칭 hook)은 turns[].role 검증이며 scratchpad write가 turns[]와 1:1로 쌓이면 hook 구현은 부산물.
3. 분리하면 PD-044가 미박제인 채 PD-033 결정만 박혀 다시 *결정-박제 분리 fiction* 재현. session_119 Master 피드백 직격탄.

### A4. 결정 vs 구현 분기 — 본 토픽 안에서 구현까지 마칠지

| 옵션 | 설명 |
|---|---|
| **A4-α: 본 토픽 안에서 결정 + Dev 구현 + 검증까지** | resolveCondition("Arki 3회 호출 F-NNN 유지")을 본 세션에서 실증 |
| **A4-β: 본 토픽=결정만, 구현은 child 토픽** | 결정 박제 후 closed, 구현 재오픈 |

**Ace 강한 의견**: **A4-α 본 토픽 안에서 끝**. memory feedback `feedback_no_premature_topic_split`("S/A grade에서 child 분화 권고는 진행 마비")·`feedback_implementation_within_3_sessions`("3세션 이내")가 합쳐서 단일 토픽 완결을 강제. Dev 구현 범위는 작음(scratchpad I/O + persona 한 블록 추가 + hook 1개). 1세션 내 가능.

---

## Step 3. 범위 경계 (Scope In/Out)

### In (본 토픽에서 결정·구현)
1. scratchpad 스키마(파일 위치·필드)
2. 역할별 inject scope 정책
3. write/read 책임 주체(서브 발언 끝 write / 메인이 다음 호출 prompt에 inject)
4. PD-043 사칭 검증 hook 구현(turns[].role ↔ 직전 Task tool_use 매칭)
5. PD-044 정책-페르소나 박제 (8역할 페르소나에 turn-append 의무 + canonical 분리 원칙)
6. resolveCondition 실증(Arki 3회 호출 F-NNN 유지) — 본 세션 turn 안에서 dry-run 가능

### Out (다음 토픽으로 이연)
- SendMessage 툴 활성화 spike (선택 옵션 A1-α 채택 시에만 별도 토픽으로 falsification probe 실행 — 이번엔 기각)
- scratchpad 누적 압축·만료 정책 (1주 이상 누적 시 별도)
- 다른 PD 일괄 정리

---

## Step 4. 핵심 전제 (Key Assumptions)

| # | 전제 | 표시 |
|---|---|---|
| K1 | 현재 Task tool subagent invocation은 정상 작동한다 (본 발언 자체가 증거) | — |
| K2 | 같은 session 내 동일 역할 서브에이전트 N번째 호출은 직전 호출 컨텍스트를 보유하지 않는다 — "매 호출 재부팅" | 🔴 |
| K3 | 메인 컨텍스트는 서브 prompt에 임의 파일 내용을 inject할 수 있다 (현재 호출에서 이미 그렇게 받고 있음) | — |
| K4 | 페르소나 파일은 서브 호출 시 prompt에 주입된다 — 정책을 페르소나에 박제하면 작동 (PD-044 전제) | 🔴 |
| K5 | scratchpad write 경로가 Claude Code 권한으로 가능하다 (memory/ 하위 표준 경로) | — |

🔴 K2/K4가 틀리면 본 토픽 무효. K2는 PD-033 본문이 명시한 사실(F-001~F-013 미전달 관찰), K4는 PD-044 본문에서 Master 가설로 명시. 본 세션 Dev 검증으로 확인 필수.

---

## Step 5. 실행계획 모드 선언

**executionPlanMode: plan**

근거: A3-γ로 3개 PD 동시 처리 + A4-α로 구현까지 1세션 진행. Phase 분해·의존 그래프·검증 게이트·롤백·중단 조건이 필요. Arki가 4번째 섹션으로 구조적 실행계획 작성 의무. Fin이 contamination 감사 대상(시간·인력·공수 키워드 금지).

---

## Step 6. 역할 호출 설계 (Orchestration Plan)

### 호출 순서

| # | 역할 | 질문 범위 | 함정 사전 고지 |
|---|---|---|---|
| 1 | **Arki** | (a) scratchpad 스키마 — 파일 위치·필드·turn append 형식. (b) 역할별 inject scope 정책 4구간(Ace/Arki·Riki·Fin/Edi·Dev/Nova) — 4개 다 일관된 근거. (c) PD-043 사칭 hook의 turns[].role ↔ tool_use 매칭 알고리즘. (d) PD-044 페르소나 정책 블록 위치·형식. **Section 4: 구조적 실행계획** 의무 — Phase 분해, 의존 그래프, 검증 게이트(K2/K4 실증 포함), 롤백, 중단 조건. | **함정 1 (memory feedback `feedback_arki_full_system_view`)**: 코드 한 축만 보고 단언 금지. 페르소나 파일·hook·CLAUDE.md·자연어 트리거·LLM 자율 호출까지 다축 교차 검증. **함정 2 (memory feedback `feedback_arki_risk_requires_mitigation`)**: 리스크 나열 시 mitigation+fallback 병기. **함정 3**: 시간·인력·공수 키워드 금지(Schedule-on-Demand, D-017). |
| 2 | **Fin** | (a) Arki 실행계획 contamination 감사 — 금지어 list 적용. (b) scratchpad 누적의 비재무 비용(컨텍스트 토큰 inflation, 메인 prompt 길이 증가) 평가. (c) ROI 직관 — 인프라 박제 대비 finding 누적 회수 가치. | **함정**: 정량 추정 금지(memory `feedback_fin_stage_awareness`). 방향성·정성. |
| 3 | **Riki** | (a) K2/K4 전제가 틀릴 시나리오. (b) scratchpad write race condition / corruption. (c) 사칭 hook false positive(메인이 정당하게 역할 헤더 인용하는 경우 등). (d) D-071 fiction 재현 가능성 — "박제했지만 작동 안 함" 시나리오. | **함정 1 (memory `feedback_riki_no_opposition_for_opposition`)**: 결정에 영향 없는 곁가지·중복·약한 항목 폐기. 슬롯 미달 정상. **함정 2 (memory `feedback_riki_count_filler`)**: 개수 채우기 금지. **함정 3 (memory `feedback_arki_risk_requires_mitigation`)** 동일 적용 — 리스크 + mitigation + fallback. |
| 4 | **Ace 종합검토** | 4축 결정·실행계획 통합. 1차 권고 박제. K2/K4 실증 dry-run 의뢰 여부 판정. |
| 5 | **Dev** | Arki 실행계획에 따라 구현 + K2/K4 실증 dry-run + regression. |
| 6 | **Edi** | 결정 박제·페르소나 정책 블록 삽입·session 종료 산출물 컴파일. |

### 스킵·배제

- **Nova**: 미포함. 본 토픽은 fiction 검출 후 보강 단계 — 의외성보다 검증 가능한 단순 경로 우선. memory `feedback_nova_auto_recommend_on_expansion`("성장지표·로드맵·체계 정의 토픽")에 해당 안 함. Master가 의외성 필요하다 판단하면 명시 요청 시 Riki 다음에 삽입.
- **Vera**: 미포함. UI/색 키워드 0건.

### orchestrationMode: manual (default)
Master `/auto` 명시 전까지 매 분기 확인. Edi 호출 직전·D-xxx 박제 직전은 master-gate-request 필수.

---

## 1차 권고 요약

> **A1-β scratchpad 단일 + A2-α 단일 lifecycle(inject scope 차등) + A3-γ PD-033/043/044 묶음 + A4-α 본 토픽 1세션 완결 + executionPlanMode=plan**.
>
> Arki → Fin → Riki → Ace종합 → Dev → Edi 순. Nova/Vera 미포함. orchestrationMode=manual.

Master 승인 시 Arki 호출 진행. 수정/반대 의견 있으면 본 프레이밍에서 멈추겠습니다.

---

```yaml
# self-scores
rfrm_trg: Y
ctx_car: 0.85
orc_hit: 0.80
mst_fr: 0.10
ang_nov: 4
```

**다음 발언자 추천**: Arki (Master 승인 대기)
