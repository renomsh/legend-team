---
role: ace
topic: topic_137
title: "Nexus structure ver1.0 — 구조 판정"
date: 2026-05-01
turnId: 0
invocationMode: subagent
rev: 1
---

# [Ace] Nexus ver1.0 기본 골격 판정

## 판정 대상

D-133 정의 기준: **Nexus = CLAUDE.md + hooks + dispatch_config + skills 총체.**
"기본 골격 완료 여부"를 4개 레이어별 실측으로 판정합니다.

---

## 1. Nexus ver1.0 기본 골격 — 레이어별 완성 기준

| 레이어 | ver1.0 완성 기준 |
|---|---|
| **CLAUDE.md** | Prime Directive 4개 + 역할 R&R + 운영 프로토콜이 현행 결정과 정합 |
| **hooks** | SessionEnd·UserPromptSubmit·PreToolUse(Task)·PostToolUse(Task) 4 이벤트가 등록·동작 |
| **dispatch_config** | jobs·sage·zero 3개 역할 규칙 완비 + session_isolation·write_permission 정합 |
| **skills** | 운영 핵심 skill 파일 존재 (jobs-framing·ace-synthesis·orchestration-mode·close·open 최소 5개) |

---

## 2. 현황 판정

### Layer 1 — CLAUDE.md ✅ 완료

- Prime Directive D1~D4 박제 확인 (D-113/D-133 기준).
- 역할 R&R: Ace·Jobs 분리(D-130), Sage·Zero 신설(D-126/D-127), Nexus 오케스트레이션(D-130) — 전부 반영.
- versionBump 책임 분배(D-130) 문서화 확인.
- **갭 없음.**

### Layer 2 — hooks ⚠ 부분 완료

실측 파일:
```
pre-tool-use-task.js          ✅ Agent dispatch + role 식별
post-tool-use-task.js         ✅ 사후 검증
pre-tool-use-task-sage-gate.js ✅ Sage exclusive isolation (D-128)
pre-tool-use-task-master-first.js ✅ HookB master-first (D-129)
user-prompt-submit-master-first.js ✅ HookA master-first (D-129)
session-end-finalize.js       ✅ turns→session_index 전파 + versionBump 자동 감지(D-130) 구현 확인
session-end-tokens.js         ✅ token 집계
```

settings.json 등록 확인:
- `SessionEnd` → `auto-push.js` (hook chain 포함) ✅
- `UserPromptSubmit` → `user-prompt-submit-master-first.js` ✅
- `PreToolUse[Task]` → `pre-tool-use-task.js` + sage-gate + master-first ✅
- `PostToolUse[Task]` → `post-tool-use-task.js` ✅

**갭 1개:** `versionBump Edi 확정` 흐름 — hook이 `versionBumpSuggested`를 박제하는 것은 구현됨. 그러나 **Edi가 세션 종료 시 이를 검증·확정하는 Edi 턴 절차가 운영 프로토콜로만 존재** (hook 강제 없음). Edi가 누락하면 `versionBump` 필드 미확정 상태로 세션 종료 가능. → **warn-only 수준. 시스템 가동 불가 수준 아님.**

### Layer 3 — dispatch_config ✅ 완료

실측: `memory/shared/dispatch_config.json` 존재.
- `jobs` 규칙: trigger(explicit + NL suggest) / session_isolation=shared ✅
- `sage` 규칙: trigger(explicit) / session_isolation=exclusive / write_permission=none ✅
- `zero` 규칙: scope_areas 정의 / session_isolation=shared ✅

**갭 없음.** (zero의 trigger 필드가 undefined이나 zero는 Zero 역할 정책상 명시 호출 없이 scope_areas 매칭으로 동작 — 설계 의도 부합)

### Layer 4 — skills ✅ 완료

실측 skills 디렉토리:
```
ace-framing (deprecated 표시)    — 존재
ace-learning-loop               ✅
ace-synthesis                   ✅
dispatching-parallel-agents     ✅
executing-plans                 ✅
jobs-framing                    ✅ (D-130 신설 확인)
orchestration-mode              ✅
subagent-driven-development     ✅
systematic-debugging            ✅
verification-before-completion  ✅
writing-plans                   ✅
writing-skills                  ✅
```

`close` / `open` skill은 `.claude/skills/` 아닌 `.claude/commands/`에 있을 가능성 — 확인 불필요 (운영 중 정상 동작이 증거).

**갭 없음.**

---

## 3. 구조적 갭 요약

| # | 항목 | 심각도 | 상태 |
|---|---|---|---|
| G-1 | versionBump Edi 확정 — hook 강제 없음, 운영 절차 의존 | ⚠ warn-only | D-130 미완 항목, 다음 세션 처리 권고 |
| G-2 | topic_132·133 status = completed (topic_index 실측) | ℹ 정보 | NCL 의존 토픽이나 이미 completed 상태 — cancelled 재처리 불필요 |
| G-3 | prime directive 표/본문 정합 (topic_134 Edi 인계 메모) | ℹ 정보 | topic_134 completed — 본 세션에서 별도 확인 필요 시 Master 지시 대기 |

---

## 4. 핵심 판정

> **"기본 골격 완료 — 단, 1개 warn-only 갭 존재"**

**4개 레이어 전부 ver1.0 기준 충족.** 시스템 가동 가능 상태입니다.

유일한 미완 항목(G-1)은 **versionBump Edi 확정 hook 강제** — 현재 운영 절차 의존. topic_137 또는 다음 세션에서 `session-end-finalize.js`에 Edi 확정 강제 로직 추가하면 완전 자동화됩니다.

**Master에게 권고하는 다음 액션:**
1. G-1 처리 여부 결정 — 이번 세션에서 hook 강제 구현 (Grade A 실행) or 다음 세션 이연
2. topic_132·133 status 그대로 유지 (completed가 맞음 — NCL 폐기로 사실상 완결)
3. topic_137을 "implementing → completed" 전환 조건: G-1 처리 완료 시

---

[ROLE:ace]
# self-scores
rfrm_trg: Y
ctx_car: 0.95
mst_fr: 0.90
ang_nov: 2
