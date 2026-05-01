---
role: dev
session: session_158
topic: topic_140
topicSlug: hook-duplicate-execution-patch
date: 2026-05-01
turnId: 0
rev: 1
---

# Dev — hook 중복 실행 패치

## 문제 진단

`auto-push.js`를 세션 중 여러 번 호출하면 `runHookChain()`이 반복 실행되고, 그 안의 `session-end-finalize.js`가 매번 `gaps.push()`를 수행해 동일 항목이 누적되었다.

증거: `session_157.gaps`에 `mechanical-fallback-graded`·`edi-llm-report-absent`가 각 2건씩 중복 박제됨.

## 수정 내용

**파일:** `.claude/hooks/session-end-finalize.js`

### 변경 1 — finalizedAt 가드 추가 (line ~1427)
```js
if (sess.finalizedAt) {
  log(`이미 finalized (finalizedAt=${sess.finalizedAt}) — 중복 실행 스킵`);
  process.exit(0);
}
```
`status === 'closed'` 가드 직후 삽입. 이미 완료된 세션은 즉시 exit.

### 변경 2 — finalizedAt 스탬프 기록 (line ~1462)
```js
sess.finalizedAt = new Date().toISOString();
writeJson(CURRENT_SESSION_PATH, sess);
```
`runSyncSystemState()` 직후, 완료 로그 직전에 삽입.

## 검증

- 파싱 오류 없음 (`node .claude/hooks/session-end-finalize.js` → `status=open 스킵` 정상)
- 멱등성 로직 테스트: `finalizedAt` 없음 → 통과 OK, 있음 → skip OK
