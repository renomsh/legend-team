---
role: jobs
session: session_163
topic: topic_141
topicSlug: bigbang-completion-review
date: 2026-05-01
rev: 1
invocationMode: subagent
executionPlanMode: conditional
---

## Jobs

**Why — 이 시점에 검토하는 이유**

session_162가 "미결사항 3건 전부 해소" 선언했지만 실제로 ledger에 잔존 caveat이 있다. Master 요청은 이 괴리를 확인하라는 신호다. topic_141 자체가 아직 `open` 상태 — 완료 선언과 실제 상태가 불일치한다.

**What — 검토 대상 실체**

실측 결과 잔존 미결 2건:

1. **D-138 caveat ①: dispatch_config.json Edi rule 부재**
   - pre-tool-use-task.js가 dispatch_config를 실제 read·enforce하지 않음
   - "hook 구현 후 rule 추가" 순서가 아직 역전 상태 — ghost rule 위험 그대로

2. **D-138 caveat ②: turns 중복 기록 패턴**
   - session_161 실측: ace가 turns[0](inline) + turns[1](agent)에 이중 박제됨, dev도 동일
   - 원인: Nexus가 subagent 호출 전 인라인 turn을 먼저 쓰고, subagent 완료 후 hook이 재기록
   - 이 패턴은 `enforceEdiAgentSource`가 `source: 'agent'` turn을 찾을 때 false positive/negative를 발생시킬 수 있음

**추가 발견 — session_162 선언의 문제**

session_162의 "3건 해소" 선언은 topic_141 open_issues를 기준으로 했으나, open_issues.json은 비어 있다. D-138 caveats는 decision_ledger에만 박제되어 있어 session_162가 놓쳤다. **추적 경로 불일치**가 근본 원인이다.

**결정축**

이번 세션에서 내릴 결정은 단 하나의 질문으로 수렴한다:

> "D-138 caveat 2건을 이번 세션에서 구현하고 topic_141을 닫을 것인가, 아니면 별도 경량 토픽으로 분리할 것인가?"

판단 기준:
- turns 중복 기록 = 감사 신뢰성 직결 (D4 prime directive 관련)
- dispatch_config Edi rule = 현재 hook 미구현 상태에서 추가해도 효과 0 (Riki R-1 이미 확인)

**Scope In / Out**

| In | Out |
|---|---|
| D-138 caveat ① turns 중복 기록 패턴 원인 진단 + 해소 | dispatch_config enforce hook 신규 구현 (순서 역전 — 선구현 필요) |
| topic_141 close 조건 검토 | BigBang 외 시스템 검토 |
| D-138 caveat ② dispatch_config Edi rule = "현재 조치 불가 확인 + 후속 토픽 등록"으로 처리 | |

**전제 감사**

| 전제 | 실제 |
|---|---|
| "session_162가 미결 3건을 전부 해소했다" | open_issues.json 기반 확인. decision_ledger caveats는 미추적 → **전제 부분 오류** |
| "dispatch_config enforce hook이 구현되면 Edi rule 추가하면 된다" | 맞음. 현재는 hook 없음 → rule 추가해도 ghost rule |
| "turns 중복은 minor 이슈다" | enforceEdiAgentSource 신뢰성에 직접 영향 → **minor 아님** |

**인지편향 적출**

- **완료 편향(Completion Bias)**: session_162가 "3건 해소" 선언 후 topic_141을 빨리 닫으려는 관성. 실제 잔존 이슈 과소평가.
- **추적 경로 단일화 실패**: open_issues.json vs decision_ledger caveats 두 경로가 sync되지 않아 한쪽만 보고 완료 판정하는 패턴이 반복 가능.
- **Ghost rule 위험 무시**: "나중에 추가하면 된다"는 논리로 dispatch_config Edi rule 추가를 선행하면 hook 없이 rule만 존재하는 상태가 영속화될 수 있음.

**Focus — NO라고 말할 것**

- dispatch_config enforce hook 지금 당장 신규 구현: **NO** — 선결 요건(enforce hook)이 없는 상태에서 rule 추가는 ghost rule. 이번 세션 범위 밖.
- topic_141을 "이슈 없음"으로 강제 close: **NO** — turns 중복 패턴이 미해소 상태에서 close하면 D4 위반.
- BigBang 전체 재검토 확장: **NO** — 범위 2건으로 한정.

**executionPlanMode: conditional**

turns 중복 기록 원인 진단 결과에 따라 구현 여부 결정. 구조 변경 필요 시 Arki 실행계획.

---

[ROLE:jobs]
# self-scores
framing_clarity: 5
scope_def: 5
bias_catch: 4
focus_no: 4
