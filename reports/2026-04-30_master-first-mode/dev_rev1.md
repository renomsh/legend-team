---
role: dev
topic: topic_132
session: session_144
turnId: 7
invocationMode: subagent
date: 2026-04-30
---

# Dev — Master-first 모드 MVP (P1~P3 warn-only) 구현 + 검증

## 1. 무엇을 만들었는지

D-129 박제 결정에 따라 Master-first 모드 MVP를 warn-only로 구현. 6개 파일 신설/수정.

| # | 파일 | 종류 | 역할 |
|---|---|---|---|
| 1 | `memory/shared/master_first_config.json` | 신설 | 트리거 매트릭스·키워드 룰·timeout cap·dual-trigger 임계 |
| 2 | `memory/shared/master_first_state.json` | 신설 | HookA→HookB state 전달 (echo/intent flag + matched keywords) |
| 3 | `.claude/hooks/user-prompt-submit-master-first.js` | 신설 | HookA — UserPromptSubmit, 키워드 1차 분류 + state write + log |
| 4 | `.claude/hooks/pre-tool-use-task-master-first.js` | 신설 | HookB — PreToolUse(Task), state read + stderr audit, LLM-free |
| 5 | `.claude/settings.json` | 수정 | UserPromptSubmit 추가 + PreToolUse Task chain 3번째 entry 추가 |
| 6 | `CLAUDE.md` | 수정 | Rules에 D-129 1줄 박제 (Sage D-128 다음) |
| 7 | `logs/master-first.log` | 신설 | 빈 파일 (jsonl append) |

## 2. 어떻게 실행하는지

- **HookA (UserPromptSubmit)**: Master 발언이 들어올 때마다 자동 실행. config의 `triggerGrades`(B/A/S) + `triggerTopicTypes`(framing) 게이트 통과 시 키워드 매칭, state.json write, log append. Grade C/D는 즉시 no-op.
- **HookB (PreToolUse Task)**: Task 호출 시 state.json read. echo/intent flag 설정되어 있으면 stderr에 audit 메시지. warn-only이므로 항상 exit 0.
- **LLM-free 강제 (Riki R-302 mitigation)**: HookB는 키워드/state read만, LLM 호출 코드 자체 없음. 2초 timeout cap은 elapsedMs 측정 + warn 로깅으로 감시.
- **Hook chain 순서**: `pre-tool-use-task.js` (기존 marker) → `pre-tool-use-task-sage-gate.js` (D-128) → `pre-tool-use-task-master-first.js` (D-129). sage-gate가 차단하면 master-first 미도달 (직렬 단락).
- **Pure function export**: `classifyPrompt`, `matchKeywords`, `buildAuditMessage` 모두 module.exports — 테스트·재사용 callable.

## 3. 실제 출력 증거 (8/8 PASS)

### T1 settings.json hook chain 정합

```
UserPromptSubmit: ["node .claude/hooks/user-prompt-submit-master-first.js"]
PreToolUse Task: ["node .claude/hooks/pre-tool-use-task.js","node .claude/hooks/pre-tool-use-task-sage-gate.js","node .claude/hooks/pre-tool-use-task-master-first.js"]
```

PASS — 양쪽 hook 정확히 등록, sage-gate 다음 master-first 위치 (D-128 우선순위 보존).

### T2 HookA classifyPrompt 4 케이스

```
A 좋아 그대로 진행 → echo:true intent:false matched:[좋아, 그대로]
B 다음 단계로 가자 → echo:false intent:true matched:[다음]
C 새 토픽을 정의해줘 → echo:false intent:false matched:[]
D OK 진행해 → echo:true intent:true matched:[OK, ok, 진행해]
```

PASS — echo·intent·neutral·both 모두 정확. case-insensitive 매칭(OK/ok 동시 hit) 작동.

### T3 HookB buildAuditMessage 4 케이스

```
null state → null
clean (flag false) → null
echo only → [master-first] WARN: echo-trigger 감지 (matched: 좋아). Master 의도 재확인 권고. (D-129, warn-only)
both → [master-first] WARN: echo-trigger+intent-reconfirm 감지 (matched: OK, 진행해). ...
```

PASS — flag 없으면 null(silent), flag 있으면 정확한 audit msg.

### T4 HookA stdin 풀 파이프라인 (Grade A framing)

```
입력: {"prompt":"좋아 그대로 박제해","session_id":"session_144"}
exit=0
state.json: echoTriggerDetected=true, matchedKeywords=[좋아, 그대로, 박제해]
log: phase=classified, elapsedMs=10
```

PASS — state write + log append + 10ms (timeoutMs 2000 << 미달).

### T5 HookB stdin 파이프라인 (Task + flag set)

```
입력: {"tool_name":"Task","tool_input":{"prompt":"## ROLE: arki\nrun"}}
stderr: [master-first] WARN: echo-trigger 감지 (matched: 좋아, 그대로, 박제해). ...
exit=0
```

PASS — Task 호출 시 audit 메시지 emit, warn-only이므로 exit 0.

### T6 HookB non-Task (Read 도구)

```
입력: {"tool_name":"Read","tool_input":{}}
stderr: (없음)
exit=0
```

PASS — Task/Agent 외 도구는 즉시 no-op.

### T7 HookA Grade C 세션 (no-op)

```
session.grade=C로 변조 → 입력: {"prompt":"OK 진행해"}
exit=0
log: phase=no-op, reason=grade-or-type-mismatch, grade=C
```

PASS — Grade C 즉시 no-op + 사유 로깅. 세션 백업/복구 정상.

### T8 D-129 ledger 정합

```
node 검색: D-129 FOUND
```

PASS — decision_ledger에 D-129 박제 확인.

## 4. 제약·메모

- **하드코딩 0건**: 모든 임계값(timeoutMs, dualTrigger, keywords, statePath, logPath)은 master_first_config.json에서 read.
- **callable 구조**: HookA/B 모두 `module.exports` + `if (require.main === module) run()` 패턴 — node -e로 직접 함수 호출 가능.
- **silent fail**: 양 hook 모두 try/catch + log 후 exit 0 (warn-only). config 누락·state 누락도 안전 통과.
- **D2 정합**: hook description("warn-only", "LLM-free")과 실동작 일치 — T4·T5에서 코드 trace로 검증. LLM 호출 코드 자체 0줄.
- **D4 정합**: enforce 단계(P5) 미구현 — warn-only이므로 D4 "이번만 우회" 자가설득 위험 자체가 차단됨(차단 메커니즘이 없으니 우회 대상도 없음). enforce 전환 시 process.exit(2) 박제 필수 (Riki R-305 권고).
- **false-negative/positive 측정**: warn-only 단계에서 logs/master-first.log jsonl 누적 → P4/P6에서 dashboard 패널로 분석 (이번 MVP 범위 외).
- **P4~P6 미구현**: LLM 2차 분류, enforce 전환, 30세션·FP 5건 dual-trigger 자동 알림 — 별도 토픽/세션.

## 5. 미해결 / 후속

- **R-303 코드 단언 (analysis_window)**: HookA가 직전 1개 user prompt만 read하는 것은 stdin 입력 구조상 자연 강제 (다른 prompt 접근 코드 없음). 명시적 assert 박제는 P4 LLM 분류 추가 시 함께 (그때 분석 범위 확장 위험).
- **R-304 dual-trigger 인프라**: warn-only 단계에서는 단순 로그 누적만. compute-dashboard.ts 패널·자동 알림은 P6에서 박제.
- **P4 LLM 2차 분류 hook**: 별도 파일(`user-prompt-submit-master-first-llm.js`) 분리 권고 — HookA LLM-free 원칙 보존, SRP 정합.

---

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0

DEV_WRITE_DONE: reports/2026-04-30_master-first-mode/dev_rev1.md
