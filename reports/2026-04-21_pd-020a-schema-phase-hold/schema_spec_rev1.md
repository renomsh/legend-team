---
topic: PD-020a 스키마 + phase×hold 기반 구현
sessionId: session_054
artifact: schema_spec
rev: 1
---

# 스키마 명세 v1 (5개 파일)

## 1. topic_meta.json (`topics/{id}/topic_meta.json`)

```jsonc
{
  "id": "topic_057",
  "title": "...",
  "grade": "A",
  "status": "in-progress",        // status_catalog.json 참조 (D-047)
  "phase": "design" | null,       // phase_catalog.json 참조. null ⇔ legacy
  "phaseHistory": [               // 인라인. 단조 증가 4~5건 상한
    {
      "phase": "framing",
      "fromPhase": null,
      "at": "2026-04-21T05:45:00.000Z",
      "sessionId": "session_054"
    }
  ],
  "hold": null | {                // null ⇔ active. 객체 ⇔ hold 상태
    "since": "ISO8601",
    "atPhase": "design",
    "reason": "waiting-decision", // hold_reasons_catalog.json 참조
    "expectedResume": null,       // 확장 여지 (PD-020c가 활용)
    "note": null
  },
  "created": "2026-04-21",
  "lastActivityAt": "2026-04-21T05:45:00.000Z",
  "legacy": false                 // true ⇔ phase·hold 항상 null 보장
}
```

**삭제된 필드:** `sessions[]` (N:1 단방향, session_index가 단일원천).

## 2. topic_index.json (`memory/shared/topic_index.json`)

기존 구조 유지 + `legacy` 1필드만 추가:

```jsonc
{
  "topics": [
    {
      "id": "topic_057",
      "grade": "A",
      "title": "...",
      "status": "in-progress",
      "created": "2026-04-21",
      "controlPath": "topics/topic_057",
      "reportPath": "reports/...",
      "reportFiles": [],
      "published": false,
      "path": "topics/topic_057",
      "legacy": false              // 신규
    }
  ]
}
```

**금지 (antiPattern #2):** phase·hold 미러 필드 추가 금지.

## 3. current_session.json / session_index.json

기존 모든 필드 유지 + 3필드 추가:

```jsonc
{
  "sessionId": "session_054",
  "topicId": "topic_057",          // 신규: 단방향 역참조
  "topicPhaseAtStart": "framing",  // 신규: 세션 시작 시점 phase 스냅샷
  "topicPhaseAtEnd": "design",     // 신규: 세션 종료 시점. /close에서 기록
  // ... 기존 필드 (turns, plannedSequence, grade, agentsCompleted 등) 그대로
}
```

**호환 가드:** 기존 dashboard·compute-dashboard.ts는 신규 필드 무시 (추가만, 변경/삭제 없음).

## 4. decision_ledger.json

**본 세션 변경 없음.** owningTopicId·scopeCheck·antiPatterns 필드는 PD-020c.

D-052 엔트리는 본문 텍스트에 antiPatterns 3건 포함 (`decision_summary_rev1.md` §4 그대로).

## 5. validate-topic-schema.ts (신설)

```ts
// scripts/validate-topic-schema.ts
export type Phase = "framing" | "design" | "implementation" | "validated";
export type HoldReason = string; // catalog 동적 로드

export interface HoldState {
  since: string;
  atPhase: Phase;
  reason: HoldReason;
  expectedResume: string | null;
  note: string | null;
}

// Type guards (모든 reader 강제)
export function assertPhase(value: unknown): Phase | null { /* catalog 참조 */ }
export function assertHold(value: unknown): HoldState | null { /* schema check */ }

// Validation entry
export function validateAll(): ValidationReport { /* 56 topic + 52 session 전수 */ }
```

**호출 규칙:** 모든 phase·hold raw 접근 금지. type guard 경유 강제.

## 6. lib/topic-sessions.ts (신설)

```ts
// scripts/lib/topic-sessions.ts
import sessionIndex from "../../memory/sessions/session_index.json";

export function getSessionsForTopic(topicId: string): SessionEntry[] {
  return sessionIndex.sessions.filter(s => s.topicId === topicId);
}

export function getLatestSession(topicId: string): SessionEntry | null {
  const list = getSessionsForTopic(topicId);
  return list.length ? list[list.length - 1] : null;
}
```

**금지 (antiPattern #3):** 결과를 파일로 캐시하지 말 것. read-time만.

## 7. writer 갱신 명세

### create-topic.ts
- 신규 topic_meta 생성 시 `phase: "framing"`, `hold: null`, `legacy: false` 초기화.
- `phaseHistory` 첫 엔트리 push: `{ phase: "framing", fromPhase: null, at, sessionId? }`.

### append-session.ts
- session_index 엔트리에 `topicId`, `topicPhaseAtStart`, `topicPhaseAtEnd` 기록.
- topic_meta 갱신: `lastActivityAt`. phase 변경 발생 시 `phase` + `phaseHistory` push.
- **금지 (antiPattern #1):** `topic_meta.sessions[]` push 코드 작성 금지.
- **금지 (antiPattern #2):** topic_index에 phase·hold 갱신 금지.

## 8. 호환성 보장

- 기존 dashboard·nav.js 무회귀 (P5 게이트).
- 신규 필드는 추가만, 기존 필드는 보존.
- legacy 토픽·세션은 `legacy:true`로 분리. 모든 집계는 `if (!legacy)` 가드 권고.
