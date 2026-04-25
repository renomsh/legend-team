---
topic: pd036-3session-summary-autoload
session: session_098
topicId: topic_103
role: arki
rev: 1
date: 2026-04-25
phase: structural-analysis
---

# Arki 구조 분석 + 실행계획 — PD-036 3세션 summary 자동 로드 시스템

## 1. 구조적 진단

### 1-1. session_index 스키마 현황 vs 필요 필드

**현황 (append-session.ts SessionEntry 인터페이스 기준):**
```
sessionId, topicId, topicSlug, topic, startedAt, closedAt,
grade, gradeDeclared, gradeActual, gradeMismatch,
decisions, plannedSequence, turns, agentsCompleted, note
```

**Gap:** `oneLineSummary` (string), `decisionsAdded` (string[]) 필드 부재.

- `oneLineSummary`: 세션 종료 시 Edi(Claude)가 1줄로 박제하는 human-readable 요약. finalize hook이 수신하여 session_index 엔트리에 기록해야 하나, 현재 current_session.json → session_index 전파 로직(`appendOrUpdateSessionIndex` 함수, `session-end-finalize.js` L113~128)에 해당 필드를 수용하는 코드가 없음.
- `decisionsAdded`: 해당 세션에서 추가된 D-xxx 목록. `masterDecisions` 필드가 current_session에 존재하나 session_index 전파 시 `decisions` 키로만 전달됨(L120). 새 필드 `decisionsAdded`를 별도로 박제하거나, 기존 `decisions` 필드를 재사용할지 결정 필요.

> → 변경 필요: `scripts/append-session.ts:46~57` (SessionEntry 인터페이스에 2필드 추가)
> → 변경 필요: `scripts/append-session.ts:204~222` (entry 구성 블록에 조건부 확산)
> → 변경 필요: `.claude/hooks/session-end-finalize.js:113~128` (entry 구성에 oneLineSummary, decisionsAdded 포함)

### 1-2. system_state.json 현황 vs 필요 구조

**현황 (SystemState 인터페이스, sync-system-state.ts L51~60):**
```json
{
  "lastSessionId", "nextSessionId", "currentVersion",
  "openTopics", "recentDecisions", "pendingDeferrals", "lastUpdated"
}
```

**Gap:** `recentSessionSummaries` 배열 완전 부재.

필요 구조:
```json
"recentSessionSummaries": [
  {
    "sessionId": "session_097",
    "topicSlug": "...",
    "closedAt": "...",
    "oneLineSummary": "...",
    "decisionsAdded": ["D-086", "D-085"]
  }
]
```

- window = 3 고정(Ace D3 결정). session_index를 역순 정렬 후 oneLineSummary가 존재하는 엔트리 최대 3개 추출.
- `sync-system-state.ts`의 `main()` 함수 내 `recentDecisions` 산출 블록(L104~115) 이후 신규 블록으로 삽입.
- SystemState 인터페이스(L51~60)에 필드 추가 필요.

> → 변경 필요: `scripts/sync-system-state.ts:51~60` (SystemState 인터페이스 확장)
> → 변경 필요: `scripts/sync-system-state.ts:104~128` (recentSessionSummaries 합성 블록 신설)

### 1-3. finalize hook 진입점

`session-end-finalize.js`의 `appendOrUpdateSessionIndex(sess)` 함수(L89~141)가 current_session 필드를 session_index entry로 투영한다. 현재 entry 구성 블록(L113~128)에 `oneLineSummary`와 `decisionsAdded` 수신 코드가 없다.

- current_session.json에 `oneLineSummary` 필드가 없으면 entry에 기록되지 않음 → **박제 선행 필요**.
- Ace D2 결정: Edi(Claude)가 /close 직전에 `current_session.json.oneLineSummary`에 1줄을 write하고, finalize hook이 그것을 수신하여 session_index에 전파하는 흐름.
- `decisionsAdded`는 current_session의 `masterDecisions` 배열을 재사용(이미 존재). 다만 session_index entry에서 키 이름을 `decisions`(현재)→`decisionsAdded`로 명시화하거나 병기 필요.

> → 변경 필요: `.claude/hooks/session-end-finalize.js:113~128` (entry 블록에 `...(sess.oneLineSummary && { oneLineSummary: sess.oneLineSummary })` 추가)

**closedInSession 박제 경로:**  
topic_index의 `closedInSession` 필드는 finalize hook의 `runL3Regenerator(sess)` 이후 별도 topic_index 갱신 함수가 없다. 현재 topic_index 직접 갱신은 `create-topic.ts`, `reclassify-topic.ts`, `auto-close-topics.ts`만이 담당한다.

- 신규 방안: finalize hook에 `updateClosedInSession(sess)` 함수를 추가. current_session의 `closedTopics[]` 또는 `topicId`를 읽어 해당 topic_index 엔트리의 `closedInSession: sess.sessionId`를 기록.
- 단순화 방안: 기존 `reclassify-topic.ts`에 `--closedInSession` 파라미터 추가 → /close 스킬에서 명시 호출.

> → 변경 필요: `.claude/hooks/session-end-finalize.js` (updateClosedInSession 함수 신설 또는 reclassify 호출 추가)
> → 변경 필요: `memory/shared/topic_index.json` 스키마 (closedInSession: string | null 필드 신설)
> → 변경 필요: `scripts/create-topic.ts` (신규 토픽 기본값 `closedInSession: null` 포함)

### 1-4. sync-system-state.ts 확장 포인트

```
main() 함수 흐름:
  L87~91  → lastSessionId/nextSessionId 산출
  L93~102 → openTopics 산출
  L104~115 → recentDecisions 산출   ← 여기 이후에 신규 블록 삽입
  L117~126 → next 객체 구성
  L128     → writeJson
```

신규 블록 위치: L115 직후.

```typescript
// recentSessionSummaries (window=3, oneLineSummary 있는 엔트리만)
const sortedSessions = [...sessionIndex.sessions]
  .filter(s => s.closedAt)
  .sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''));
const recentSessionSummaries = sortedSessions
  .filter(s => s.oneLineSummary)
  .slice(0, 3)
  .map(s => ({
    sessionId: s.sessionId,
    topicSlug: s.topicSlug,
    closedAt: s.closedAt,
    oneLineSummary: s.oneLineSummary,
    decisionsAdded: s.decisionsAdded || s.decisions || [],
  }));
```

> → 변경 필요: `scripts/sync-system-state.ts:115` (블록 삽입 위치)
> → 변경 필요: `scripts/sync-system-state.ts:117~126` (next 객체에 recentSessionSummaries 포함)

### 1-5. open.md step 3.5 현황

현재 step 3.5(`.claude/commands/open.md:10~13`):
```
3.5. [context_brief 자동 로드] npx ts-node scripts/load-context-briefs.ts 실행.
```

**Gap:** `recentSessionSummaries` 출력 섹션 없음.

Ace D5 결정: step 3.5를 확장하거나 step 3.5와 3.6 사이에 신규 step 3.5.5를 삽입하여 `system_state.json.recentSessionSummaries`를 읽어 Master에게 브리핑.

- 단순화 방안: step 3.5에 context_brief 로드 직후 "최근 3세션 요약" 섹션을 추가하되, `system_state.json`은 step 2에서 이미 읽으므로 재파일 Read 없이 필드만 출력.
- 현재 step 3.5는 `load-context-briefs.ts` 스크립트 호출 방식 → 별도 스크립트 불필요. system_state 메모리 내 값을 그대로 출력하면 됨.

> → 변경 필요: `.claude/commands/open.md:10~13` (step 3.5 확장, recentSessionSummaries 브리핑 지시 추가)

---

## 2. 의존 그래프

```
P1: 스키마 신설
  ├── [P1-A] session_index 엔트리에 oneLineSummary, decisionsAdded 필드 추가
  │         → append-session.ts SessionEntry 인터페이스 + entry 구성 블록
  └── [P1-B] topic_index 엔트리에 closedInSession 필드 추가
            → create-topic.ts 기본값 null 포함
            (reclassify-topic.ts 호환: 기존 --field 패턴으로 처리 가능)
       │
       ▼
P2: sync-system-state.ts 확장
  ├── SessionEntry 타입에 oneLineSummary, decisionsAdded 인식 추가
  ├── 최근 3개 세션(oneLineSummary 있는 것) 읽어 recentSessionSummaries[] 합성
  └── SystemState 인터페이스 + next 객체 + writeJson 출력에 필드 추가
       │
       ▼ (P1-A 완료 후 P2 진행 가능, P1-B는 P3와 병렬 가능)
       │
P3: finalize hook 박제 로직
  ├── [P3-A] appendOrUpdateSessionIndex(): oneLineSummary, decisionsAdded 수신 + entry 포함
  └── [P3-B] updateClosedInSession(): topicId → topic_index closedInSession 기록
             (current_session.topicId 이미 존재 → 읽기 용이)
       │
       ▼
P4: open.md step 3.5 통합
  └── step 3.5 지시문에 "recentSessionSummaries 읽어 최근 3세션 요약 브리핑" 추가
      (system_state.json은 step 2에서 이미 로드됨 → 재파일 Read 불필요)
       │
       ▼
P5: 검증 게이트 (1사이클 실행 확인)
  └── 실제 /close → /open 실행 후 end-to-end 동작 확인
```

**병렬 가능 구간:**
- P1-A와 P1-B는 독립적으로 병렬 진행 가능
- P1-B와 P3-B는 topic_index 수정 대상이 같으나 충돌 없음 (P1-B: 스키마, P3-B: 로직)
- P3 완료 전에 P4 초안 작성 가능 (지시문 수준 변경이므로 코드 의존 없음)

**직렬 강제 구간:**
- P2는 P1-A(session_index 필드 신설) 완료 후에 의미 있는 데이터 존재
- P3-A는 finalize hook이 실제로 oneLineSummary를 박제해야 P2 → recentSessionSummaries 합성 가능
- P5는 P1~P4 전체 완료 후 실행

---

## 3. 검증 게이트

### G0 — P1 완료 기준
- `session_index.json` 최신 엔트리(신규 세션 기준)에 `oneLineSummary` 및 `decisionsAdded` 키 존재 확인
  - 값이 채워지는 시점은 P3 완료 후이므로, 이 게이트에서는 **필드 존재** 여부만 검증
  - 기존 legacy 엔트리에는 필드 없어도 무방 (소급 금지)
- `topic_index.json` 신규 토픽 엔트리에 `closedInSession: null` 존재 확인
  - `create-topic.ts` 실행 후 출력 JSON 검사로 확인 가능

### G1 — P2 완료 기준
- `memory/shared/system_state.json`에 `recentSessionSummaries` 키 존재 + 배열 타입 확인
- 배열 길이 ≥ 1 (oneLineSummary가 있는 세션이 1개 이상 존재 시)
- 배열 길이 = 0이어도 키는 존재해야 함 (빈 배열 허용)

### G2 — P3 완료 기준
- `/close` 실행 후 `session_index.json` 해당 세션 엔트리에 `oneLineSummary` 값이 채워짐 (비어있지 않음)
- 동일 세션의 `topic_index.json` 엔트리에 `closedInSession: "session_NNN"` 기록됨
- 검증: `session-end-finalize.js` 실행 로그(`[session-end-finalize]`)에 oneLineSummary 기록 메시지 존재

### G3 — P4 완료 기준
- `/open` 실행 시 step 3.5에서 "최근 3세션 요약" 섹션이 출력됨
- `recentSessionSummaries` 길이가 0이면 "최근 세션 요약 없음 (oneLineSummary 미기록)" 메시지 출력
- context_brief 로드 기존 동작은 유지됨 (퇴행 없음)

### G4 — P5 완료 기준 (PD-036 resolveCondition 충족)
- 3세션 연속으로 `oneLineSummary`가 session_index에 자동 기록됨
- `/open` 실행 시 최근 3세션 요약이 브리핑 섹션에 출력됨
- PD-036 `resolveCondition`: "구현 완료 + 3세션 자동 summary 생성 확인 + /open step 3.5 브리핑 동작"

---

## 4. 롤백 조건 + 전제 + 중단 조건

### 롤백 조건
- **append-session.ts 파라미터 변경이 기존 hook chain을 깨는 경우**: `oneLineSummary`와 `decisionsAdded` 파라미터를 **optional**로 추가 → 기존 호출 코드(`session-end-finalize.js`가 인라인 구현 사용) 영향 없음. backward-compatible 보장.
- **topic_index closedInSession 신규 필드가 validate-schema-lifecycle.ts를 깨는 경우**: 스키마 검증 스크립트(`scripts/validate-schema-lifecycle.ts`) 실행 후 drift 발생 시 → closedInSession을 optional 필드로 선언하여 기존 엔트리(undefined) 허용.
- **finalize hook에서 updateClosedInSession이 topic_index 손상을 유발하는 경우**: `readJson` 실패 시 `process.exit(0)` 패턴(기존 hook 방어 코드) 적용 → hook 체인 중단 없이 스킵.

### 전제
- **D-028 append-only 규칙 준수**: session_index 직접 Edit 금지. 모든 쓰기는 `append-session.ts` 또는 `session-end-finalize.js` inlined 로직을 통해서만 수행.
- **oneLineSummary 박제 주체**: Edi(Claude)가 `/close` 스킬 실행 직전 `current_session.json.oneLineSummary`에 1줄 write. 이것이 없으면 finalize hook은 빈 값으로 기록 → G2 실패.
- **topic_index 스키마 변경 시 create-topic.ts와 reclassify-topic.ts 동시 업데이트 필요**: 두 스크립트 모두 topic_index 엔트리를 쓰므로 closedInSession 필드 처리 로직 추가 필요.

### 중단 조건
- **finalize hook이 oneLineSummary를 빈값으로 박제하는 경우**: 기본값 처리 전략 정의 필요. 후보: (1) 빈 문자열로 기록 후 recentSessionSummaries 필터에서 제외(`filter(s => s.oneLineSummary)` 이미 포함), (2) null로 기록 후 UI 레벨에서 "요약 없음" 표시. — **Riki 확인 권장**: 빈값 허용 vs 박제 실패로 gap 기록 선택.
- **session_index 크기 증가로 sync-system-state.ts 실행 지연 발생 시**: 현재 전체 sessions 배열 정렬 방식. 세션 수 증가 시 슬라이스 최적화 필요. 현재 session_098 수준에서는 무시 가능.

---

## 변경 파일 요약

| Phase | 파일 | 변경 위치 | 변경 내용 |
|---|---|---|---|
| P1-A | `scripts/append-session.ts` | L46~57 (SessionEntry 인터페이스) | oneLineSummary?: string; decisionsAdded?: string[] 추가 |
| P1-A | `scripts/append-session.ts` | L204~222 (entry 구성) | 두 필드 조건부 확산 추가 |
| P1-B | `scripts/create-topic.ts` | topic 엔트리 기본값 블록 | closedInSession: null 추가 |
| P2 | `scripts/sync-system-state.ts` | L27 (SessionEntry 인터페이스) | oneLineSummary?: string; decisionsAdded?: string[] 추가 |
| P2 | `scripts/sync-system-state.ts` | L51~60 (SystemState 인터페이스) | recentSessionSummaries 배열 필드 추가 |
| P2 | `scripts/sync-system-state.ts` | L115 이후 신규 블록 | recentSessionSummaries 합성 로직 삽입 |
| P2 | `scripts/sync-system-state.ts` | L117~126 (next 객체) | recentSessionSummaries 포함 |
| P3-A | `.claude/hooks/session-end-finalize.js` | L113~128 (entry 구성) | oneLineSummary, decisionsAdded 수신 코드 추가 |
| P3-B | `.claude/hooks/session-end-finalize.js` | L340~355 (main 실행 블록) | updateClosedInSession(sess) 함수 신설 + 호출 |
| P4 | `.claude/commands/open.md` | L10~13 (step 3.5) | recentSessionSummaries 브리핑 지시문 추가 |
