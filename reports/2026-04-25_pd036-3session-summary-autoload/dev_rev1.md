---
topic: topic_103
topic_slug: pd036-3session-summary-autoload
title: PD-036 3세션 summary 자동 로드 시스템 구현
role: dev
phase: implementation
revision: 1
date: 2026-04-25
report_status: approved
session_status: closed
accessed_assets:
  - topic_index.json
  - session_index.json
  - system_state.json
---

# Dev 구현 보고 — PD-036 3세션 summary 자동 로드 시스템

## 구현 파일 목록 및 변경 요약

### P1-A: `scripts/append-session.ts`
- `SessionEntry` 인터페이스에 `oneLineSummary?: string`, `decisionsAdded?: string[]` 추가
- `ParsedArgs` 인터페이스에 동일 2필드 추가
- `parseArgs()` 함수에 `--oneLineSummary`, `--decisionsAdded` 파싱 로직 추가
- entry 구성 블록(신규/업데이트 양쪽)에 조건부 spread 적용

### P1-B: `scripts/create-topic.ts`
- `entry` 구성 시 `closedInSession: null` 기본값 포함
- 타입 캐스트 `as TopicIndexEntry & { closedInSession: string | null }` 적용

### P3-B: `scripts/set-closed-in-session.ts` (신규)
- 인수: `--topicId <id>`, `--sessionId <id>`
- `memory/shared/topic_index.json` 해당 엔트리의 `closedInSession` 필드를 sessionId로 기록
- 엔트리 없으면 `exit 1` + "topicId not found" stderr 출력
- 성공 시 `exit 0` + 성공 메시지 stdout 출력

### P3-A: `.claude/hooks/session-end-finalize.js`
- `appendOrUpdateSessionIndex()` entry 구성 블록에 `oneLineSummary` + `decisionsAdded` 필드 추가
  - `oneLineSummary`: `sess.oneLineSummary || '[summary 없음 — {topicSlug}]'` (G3 안전장치)
  - `decisionsAdded`: `sess.decisionsAdded` > `sess.masterDecisions` ID 목록 > `[]` 우선순위
- `updateClosedInSession(sess)` 신규 함수 추가 (set-closed-in-session.ts 호출)
  - 실패 시 `sess.gaps`에 `topic-index-write-failed` 항목 기록
- hook chain에서 `runAutoCloseDryRun()` 직전에 `updateClosedInSession(sess)` 호출 삽입

### P2: `scripts/sync-system-state.ts`
- `SessionEntry` 로컬 타입에 `closedAt`, `oneLineSummary`, `decisionsAdded` 추가
- `RecentSessionSummary` 인터페이스 신규 정의
- `SystemState` 인터페이스에 `recentSessionSummaries: RecentSessionSummary[]` 추가
- `recentDecisions` 산출 이후 `recentSessionSummaries` 합성 블록 추가:
  - closedAt 역순 정렬 → `oneLineSummary` 존재 엔트리 필터 → 최대 3개 슬라이스
  - 500자 초과 시 497자 + "…" truncate + `console.warn`
- 기본값 fallback 객체에 `recentSessionSummaries: []` 추가
- `next` 객체에 `recentSessionSummaries` 포함

### P4: `.claude/commands/open.md`
- step 3.5 이후, step 3.6 이전에 step 3.5-b `[최근 3세션 요약 브리핑]` 삽입
- 브리핑 형식: `{sessionId}: {topicSlug} — {oneLineSummary} (결정: {decisionsAdded.join(', ')})`
- 배열 비어있으면 "최근 세션 요약 없음" 출력 후 진행

### P4-close: `.claude/commands/close.md`
- step 5 체크리스트에 `oneLineSummary` 1줄 작성 + Edit 툴 기록 항목 추가
- placeholder 안전장치 안내 포함

---

## 검증 게이트 결과

| 게이트 | 내용 | 결과 |
|--------|------|------|
| G0 | `append-session.ts --help` 컴파일·출력 | ✅ 통과 |
| G1 | `sync-system-state.ts` 실행 → `recentSessionSummaries` 배열 생성 | ✅ 통과 (빈 배열, oneLineSummary 미기록 세션 없어 정상) |
| G2 | `set-closed-in-session.ts --topicId topic_103 --sessionId session_098` → 기록 확인 후 null 원복 | ✅ 통과 |
| G3 | finalize hook에 placeholder 삽입 로직 코드 존재 확인 | ✅ 통과 |
| G4 | `open.md`에 step 3.5-b 삽입 확인 | ✅ 통과 |

---

## 미구현/스킵 항목

없음. 지시서의 전 항목(P1-A, P1-B, P3-B, P3-A, P2, P4, P4-close) 구현 완료.

---

## 비고

- `TopicIndexEntry` 타입에 `closedInSession` 필드가 없어 타입 캐스트로 처리. 향후 `src/types/index.ts`에 옵셔널 필드 추가 권장.
- `recentSessionSummaries`가 현재 빈 배열인 이유: session_index.json의 기존 세션에 `oneLineSummary` 필드가 없음. 다음 세션부터 `/close` 시 `oneLineSummary` 기록 → 자동 반영됨.
