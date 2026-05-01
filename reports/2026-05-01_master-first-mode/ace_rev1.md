---
role: ace
topic: topic_136
session: session_154
date: 2026-05-01
turnId: 0
invocationMode: subagent
---

# Ace — 구조·흐름 판정 (topic_136, session_154)

## Step 1. 판정 대상

D-129 Master-first 모드 구현 완료 상태 점검.
판정 대상: HookA(`user-prompt-submit-master-first.js`) + HookB(`pre-tool-use-task-master-first.js`) + `master_first_config.json` 3파일 + `settings.json` 등록 상태.

---

## Step 2. 구조 진단 (Structure — Porter)

**결론: 구현 완료. 이번 토픽은 검증(Verification) 토픽이다.**

3파일 모두 stub/skeleton이 아닌 실질 구현 코드가 존재한다.

| 항목 | 상태 | 비고 |
|------|------|------|
| HookA (`user-prompt-submit-master-first.js`) | 완료 | 키워드 매칭·state 박제·로그 append. LLM-free. exit 0 warn-only. |
| HookB (`pre-tool-use-task-master-first.js`) | 완료 | state read→audit msg emit to stderr. LLM-free. 2초 timeout cap. exit 0 warn-only. |
| `master_first_config.json` | 완료 | triggerGrades(B/A/S), echoTriggerKeywords, intentReconfirmKeywords, dual-trigger, timeoutMs 모두 박제. |
| `settings.json` 등록 | 완료 | UserPromptSubmit hook(HookA) + PreToolUse/Task hook(HookB) 모두 체인에 등록. |

**얻은 것**: hook chain에 Master-first 감사가 실제로 박제됨. D4 prime directive 정합.  
**포기한 것**: P4(LLM 2차 분류)·P5(enforce)·P6(30세션 게이트) — 의도적 MVP 범위 제한, 별도 세션 예정.

**구조적 강점:**
- SRP 준수 — HookA(분류·박제)와 HookB(audit inject)가 분리 파일. 단일 파일 비대 방지.
- Pure function 구조 — `classifyPrompt`, `buildAuditMessage` 모두 callable export. 테스트 가능.
- 항상 exit 0 — warn-only. hook 실패로 인한 하네스 중단 위험 0.

**구조적 약점:**
- HookA의 `gradeOk` 로직: `!grade`(세션 grade 미설정)면 무조건 통과(gradeOk=true). 새 세션 초기에 grade가 null이면 트리거 게이트가 사실상 비활성화됨.
- `triggerTopicTypes: ["framing"]` 설정이 현재 세션(`topicType: "implementation"`)과 불일치 → HookA는 이 세션에서 실제로 no-op(typeOk=false). 의도적 설계인지 확인 필요.

---

## Step 3. 흐름 분석 (System — Keynes)

**기존 hook chain과의 관계:**

```
UserPromptSubmit: [user-prompt-submit-master-first.js]  ← HookA (신규)
PreToolUse(Task): [pre-tool-use-task.js]                ← 기존 dispatch
                  [pre-tool-use-task-sage-gate.js]       ← D-128 Sage 격리
                  [pre-tool-use-task-master-first.js]    ← HookB (신규)
PostToolUse(Task):[post-tool-use-task.js]               ← 기존 PostToolUse
```

**흐름 적합성**: 순서 정합. HookA가 먼저 state를 쓰고, HookB가 Task 호출 시점에 읽는 파이프라인 구조. Sage-gate(process.exit(2) 차단)가 HookB보다 앞에 위치하므로 Sage 세션에서는 HookB 실행 전 차단 — 안전.

**불확실성(Uncertainty):**
- `master_first_state.json`은 세션 간 초기화 로직이 없다. 이전 세션의 state가 남아 있으면 다음 세션 첫 Task 호출에서 오탐(stale state) 가능성.
- warn-only 모드에서 audit 메시지는 stderr로만 emit. Master가 실제로 이 경고를 인지하는 채널이 명확한지 확인 필요 (Claude Code UI가 stderr를 어떻게 표시하는지 의존).

**리스크(Risk) — 한정적:**
- false-positive(정상 발언을 echo로 오분류): "좋아", "OK" 등이 일상 발언에도 포함 가능. 현재 warn-only이므로 피해 없음. P5 enforce 단계 전에 FP rate 측정 필수.
- false-negative(echo 미감지): 키워드 미포함 동의 발언. warn-only 단계에서는 허용 잔존 리스크.

**적응 가능성**: config-driven 설계(`master_first_config.json`)로 키워드·임계 변경이 코드 수정 없이 가능. 높은 적응 가능성.

---

## Step 4. 지속 가능성 판정

**Conditional.**

MVP(P1~P3 warn-only) 범위에서는 **지속 가능하다.** hook이 항상 exit 0이므로 하네스 안정성에 영향 없음. config-driven이므로 운영 조정 가능.

단, **2개 조건 충족 전까지 P5 enforce 진입 불가:**
1. `topicType: "framing"` 트리거 설계 의도 확인 — implementation 토픽에서도 감사가 필요하면 config 수정 필요.
2. `master_first_state.json` 세션 간 초기화 보장 — stale state로 인한 오탐 방지.

---

## Step 5. 결정축 — Master 결정 필요 사항

**결정축 1: implementation 토픽에서도 HookA를 활성화할 것인가?**
- 현재: `triggerTopicTypes: ["framing"]` → implementation 토픽은 no-op.
- 좌: framing 전용 유지 (echo chamber는 framing 단계에서만 위험 — 구현 단계는 pass)
- 우: implementation도 포함 (구현 방향 승인 발언도 echo 위험 존재)
- Trade-off: 포함 시 false-positive 증가 / 미포함 시 구현 단계 echo 무방비

**결정축 2: `master_first_state.json` 세션 간 초기화 — 자동 vs 수동?**
- 좌: session-end-finalize.js에 state 초기화 로직 추가 (자동, 코드 수정 ~5 LOC)
- 우: 현재 유지 (warn-only 단계에서 stale state는 worst case = 불필요한 audit warn 1건)
- Trade-off: P5 enforce 진입 전에 자동 초기화가 없으면 enforce 단계에서 오탐 차단 위험

**결정축 3: 이번 세션 범위 — 검증만 할 것인가, 갭 보완까지 할 것인가?**
- 좌: 현재 구현 기능 검증(실행 테스트) 완료 후 close
- 우: 위 2개 갭(topicType 트리거, state 초기화) 보완까지 이번 세션에서 완결
- Trade-off: 갭 보완은 ~10 LOC + config 1줄 수정. 복잡도 낮음. 별도 세션 소요 없음.

---

[ROLE:ace]
# self-scores
rfrm_trg: Y
ctx_car: 0.95
mst_fr: 0.80
ang_nov: 2
