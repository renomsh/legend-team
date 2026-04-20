---
session: session_050
topic: 에디 누락 재발 방지 — session-end-finalize.js editor push 자동화
role: dev
rev: 1
date: 2026-04-20
---

## 구현 요약

**파일:** `.claude/hooks/session-end-finalize.js`

**추가 함수:** `ensureEditorInAgents(sess)`

### 동작 원리

closed 세션에서 `session_index` 전파 직전 실행:
1. `agentsCompleted`에 `"editor"` 없고 `reportPath` 설정됨 → reports 저장 완료로 간주
2. `agentsCompleted`에 `"editor"` push
3. `turns`에 `{ role: "editor", turnIdx: N, phase: "output" }` 추가
4. `current_session.json` 즉시 갱신 (전파 전 일관성 유지)
5. 이미 `"editor"`가 있으면 skip (중복 방지)

### 호출 위치

```js
ensureEditorInAgents(sess);   // ← 추가
appendOrUpdateSessionIndex(sess);
runSyncSystemState();
```

### 검증

- editor 없는 mock session → agentsCompleted에 editor 추가, turns에 output turn 추가 ✅
- editor 이미 있는 session → 중복 push 없음 ✅
