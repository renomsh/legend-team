---
topic: topic_103
session: session_098
role: riki
rev: 1
date: 2026-04-25
slug: pd036-3session-summary-autoload
---

# Riki — 리스크 감사 발언
## topic_103 / PD-036: 3세션 summary 자동 로드 시스템 구현

---

### R-1: oneLineSummary 누락 시 영구 공백 (🔴)

**현상**: `oneLineSummary`는 Edi(Claude)가 `/close` 직전 `current_session.json`에 수동으로 write해야 한다. hook은 이 필드를 읽어 `session_index`로 전파할 뿐, 필드 존재 여부를 검증하거나 생성하는 로직이 `session-end-finalize.js` 어디에도 없다. Edi가 write 단계를 누락하면 해당 세션의 `recentSessionSummaries` 항목은 `null` 또는 `undefined`로 전파된다.

**발생 조건**:
- Edi가 `/close` 체크리스트를 빠르게 처리하면서 `oneLineSummary` write를 건너뛸 때
- 세션이 비정상 종료(타임아웃, 연결 끊김)되어 체크리스트가 중단될 때
- Grade C/D 세션처럼 Edi가 간략하게 처리하도록 유도되는 상황

**mitigation**:
- `session-end-finalize.js`의 `appendOrUpdateSessionIndex` 함수 내에서 `oneLineSummary`가 없을 경우 `"[summary 없음 — topicSlug: {slug}]"` 형태의 placeholder를 자동 삽입하는 guard 로직 추가
- `/close` SKILL.md(또는 `close.md` command)에 "step 4.5: `current_session.json`에 `oneLineSummary` 필드 확인 → 없으면 1줄 요약 write" 항목을 명시적으로 추가하여 체크리스트 강제화

**fallback**:
- `sync-system-state.ts`가 `recentSessionSummaries`를 재구성할 때 null/undefined 항목을 필터링하고 경고 로그 출력
- 누락 세션은 `validate-session-turns.ts` 또는 별도 `validate-summaries.ts` 스크립트가 사후 탐지하여 Master에게 보고

---

### R-2: finalize hook의 topic_index 직접 쓰기 — D-028 계약 충돌 (🔴)

**현상**: Arki 설계에서 `updateClosedInSession` 신규 함수는 `finalize` hook 내부에서 `topic_index.json`을 직접 읽고 쓰는 구조로 제안되었다. 그러나 D-028은 "session_index.json은 `append-session.ts` 스크립트로만 수정"을 강제한다. topic_index에 대한 동등한 수준의 쓰기 독점 계약은 명시되어 있지 않지만, hook이 `topic_index`를 직접 조작하면 두 가지 문제가 발생한다.

1. `topic_index`를 수정하는 다른 경로(reclassify-topic.ts, auto-close-topics.ts)와 동시 실행 시 race condition 발생 가능 — hook은 spawnSync로 직렬화하지만 hook chain 내에서 `auto-close-topics.ts`와 같은 세션에 실행된다.
2. hook chain은 에러 발생 시에도 `process.exit(0)`으로 강제 통과(현재 finalize.js 353~356행)하므로, `topic_index` 쓰기 실패가 조용히 묻힌다.

**발생 조건**:
- `auto-close-topics.ts`(hook chain 내 `runAutoCloseDryRun`)와 `updateClosedInSession`이 동일 세션 종료 시 같은 `topic_index`를 읽는 경우
- `topic_index.json`이 이미 다른 프로세스에 의해 lock되어 있을 때(Windows 파일시스템에서 가능)

**mitigation**:
- `updateClosedInSession`은 hook 내부 직접 쓰기 대신 `reclassify-topic.ts` 또는 신규 `set-closed-in-session.ts` 스크립트를 spawnSync로 호출하는 위임 패턴으로 구현
- hook chain 순서를 `updateClosedInSession` → `runAutoCloseDryRun`으로 명시 고정하여 순차 실행 보장
- 실패 시 gap 박제: `process.exit(0)` 전에 `sess.gaps.push({type:'topic-index-write-failed', ...})`를 추가하여 현재의 조용한 실패 방지

**fallback**:
- 세션 종료 후 `validate-schema-lifecycle.ts`가 `closedInSession` 누락 토픽을 탐지
- Master가 다음 `/open` 시 dry-run 제안에서 확인 후 `--apply`로 수동 보정

---

### R-3: closedInSession 조인 실패 — 레거시 토픽 혼재 시 브리핑 왜곡 (🟡)

**현상**: `topic_index`의 기존 토픽(topic_001 ~ topic_102 중 대다수)에는 `closedInSession` 필드가 없다. 신규 로드 로직이 `closedInSession`을 기준으로 "어느 세션에서 종결됐는가"를 역산하려 할 때, 레거시 토픽은 매칭 불가 → `recentSessionSummaries`에서 해당 세션의 토픽 연결이 끊기거나 "완료 토픽 없음"으로 표시된다.

**발생 조건**:
- `/open` 시 브리핑 로직이 최근 3세션의 `closedInSession`을 JOIN하여 토픽 제목을 표시할 때
- 레거시 세션(session_001 ~ session_097)이 recentSessions에 포함될 때 — 현재 session_098 기준으로 session_095~097이 해당

**mitigation**:
- 브리핑 로직에서 `closedInSession`이 없는 토픽은 `session_index.entries[].topicSlug`와 역방향 JOIN으로 폴백
- `recentSessionSummaries` 구성 시 "topicTitle이 있으면 topic_index 우선, 없으면 session_index.topic 필드 사용"하는 2단계 조회 로직 설계

**fallback**:
- 브리핑 출력 시 `closedInSession` 없는 항목은 "(레거시 — 제목 미연결)"로 명시 표기하여 왜곡 없이 사실 전달

---

### R-4: sync-system-state 타이밍 — oneLineSummary 전파 순서 역전 (🟡)

**현상**: 현재 `session-end-finalize.js`의 실행 순서(312행~351행)를 보면:

```
ensureEditorInAgents → filterAgents → writeJson(current_session) →
appendOrUpdateSessionIndex  ← 여기서 oneLineSummary가 session_index에 박제
→ runL2Writer → runL3Regenerator → runCheckPendingDeferrals →
runAutoCloseDryRun → runResolvePDDryRun →
runSyncSystemState  ← 여기서 system_state.recentSessionSummaries 재계산
```

`appendOrUpdateSessionIndex`(143행)는 현재 `oneLineSummary` 필드를 session_index entry에 포함하는 코드가 **없다**(113~128행 entry 생성부 참조). 따라서 설계대로 oneLineSummary가 session_index에 먼저 박제되어야 하는데, 현재 구현에는 해당 전파 로직 자체가 누락되어 있다. `runSyncSystemState`가 마지막에 실행되더라도 읽어올 oneLineSummary가 session_index에 없다.

**발생 조건**:
- Phase 1 구현에서 `appendOrUpdateSessionIndex` 함수에 `oneLineSummary` 전파 코드를 추가하지 않은 채 `sync-system-state.ts`의 `recentSessionSummaries` 계산 로직만 구현한 경우

**mitigation**:
- `appendOrUpdateSessionIndex` 함수의 entry 객체(113~128행)에 `...(sess.oneLineSummary && { oneLineSummary: sess.oneLineSummary })` 라인 추가가 Phase 1 필수 구현 항목임을 명시
- `sync-system-state.ts`의 `recentSessionSummaries` 생성 로직은 `session_index[].oneLineSummary`를 읽도록 구현 — 순서 의존성 문서화 필수

**fallback**:
- `sync-system-state.ts`에서 `oneLineSummary`가 없는 session_index 항목에 대해 `"(요약 없음)"` sentinel을 삽입하여 브리핑에서 공백 대신 명시적 표기

---

### 종합 평가

4개 리스크 중 R-1과 R-2는 🔴(구현 방향에 영향). 특히 R-1(Edi 수동 write 의존)은 시스템의 신뢰도를 Edi의 실수 없음에 맡기는 구조적 취약점이며, 현재 hook에 guard가 없으므로 **Phase 1 구현 전에 설계 반영이 필요**하다. R-2(finalize hook의 직접 쓰기)는 D-028 계약 정신과의 충돌 여부를 Ace가 D-xxx 결정으로 명시적으로 처리해야 한다.

R-3과 R-4는 🟡(구현 중 누락 리스크)로, 실행계획 Phase별 구현 게이트에서 검증 항목으로 포함하면 충분하다.
