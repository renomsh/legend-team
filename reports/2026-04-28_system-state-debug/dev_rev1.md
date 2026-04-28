---
role: dev
session: session_135
topic: topic_129
date: 2026-04-28
grade: D
---

# Dev — system-state 미갱신 디버깅

## 진단 결과

### 문제 1: PD-052 system_state에 여전히 "pending"

**원인:** `session-end-finalize.js`에 `pendingDeferralsResolved` 배열 처리 로직 없음.
`sync-system-state.ts:166` — `pendingDeferrals: currentState.pendingDeferrals || []` (보존 필드 처리).
session_134에서 `pendingDeferralsResolved: ["PD-052"]`를 기록했으나 어떤 스크립트도 system_state를 갱신하지 않음.

**수정:** `.claude/hooks/session-end-finalize.js`에 `applyPendingDeferralsResolved(sess)` 함수 추가.
`applyVersionBump()` 직전에 호출 → 이후 세션부터 자동 반영.
session_134 소급: system_state.json PD-052 status='resolved' 직접 처리.

### 문제 2: system_state.currentVersion v1.75 고착

**원인:** `sync-system-state.ts`가 `currentVersion`을 보존 필드로 처리 (`currentState.currentVersion` 그대로 유지).
`applyVersionBump()`는 `project_charter.json`만 갱신하고 system_state는 건드리지 않음.

**수정:** `sync-system-state.ts`에서 `project_charter.json`을 읽어 `charter.charter.version`으로 동기화.
즉시 반영: v1.86 확인됨.

### 문제 3: Hook Success 40% 고착

**원인:** `parseHookLines()`가 FIRED/PD-016/OK 3줄을 각각 별개 이벤트로 취급.
세션당 1 OK / 3 이벤트 = 33~40% 고착.

**수정:** `app/dashboard-ops.html` — 터미널 상태(`OK`/`ERROR`/`ABORT`)만 필터링해 hookRate 계산.
실제 세션 성공률 = 100% 표시 예정.

## 수정 파일

- `.claude/hooks/session-end-finalize.js` — `applyPendingDeferralsResolved()` 추가
- `scripts/sync-system-state.ts` — `currentVersion` project_charter 동기화
- `app/dashboard-ops.html` — hookRate 터미널 이벤트 필터링
