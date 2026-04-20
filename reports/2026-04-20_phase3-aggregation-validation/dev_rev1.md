---
session: session_048
topic: "Phase 3 — 집계 전환 + 실측 데이터 검증"
topicSlug: phase3-aggregation-validation
topicId: topic_051
date: 2026-04-20
grade: B
roles: [ace, dev]
decisions: []
status: completed
---

# Phase 3 — 집계 전환 + 실측 데이터 검증

## 세션 요약

D-048 Phase 3 구현 세션. `compute-dashboard.ts` Turn[]-기반 집계 전환 완료.

---

## 변경 사항: compute-dashboard.ts

### 1. `seen.has()` 제거 — Turn[] 기반 roleFrequency 전환

**이전 코드 (PD-011 원인):**
```typescript
const seen = new Set<string>();
for (const rawRole of s.agentsCompleted) {
  if (seen.has(role)) continue; // 세션당 1회만 카운트
  seen.add(role);
  ...
}
```

**변경 후 (D-048 R-6 적용):**
```typescript
// legacy:true 세션 완전 배제
for (const s of sessionIndex.sessions) {
  if (s.legacy) continue;
  if (!s.turns || s.turns.length === 0) continue;
  for (const turn of s.turns) {
    // seen.has 없음 — 재호출 포함 전체 카운트
    entry.count++;
  }
}
```

### 2. `turnSequences` 신설 (D3 sequence 대시보드용)

```typescript
const turnSequences = sessionIndex.sessions
  .filter(s => !s.legacy && s.turns && s.turns.length > 0)
  .map(s => ({
    sessionId, topic,
    sequence: turns[].map(t => ({ role, phase, turnIdx, recallReason }))
  }));
```

### 3. `metrics.turnBasedSessions` 추가

Turn[]-기반 세션 수 집계 지표 신설.

### 4. `SessionIndexEntry` 타입 확장

`turns?: Turn[]`, `plannedSequence?: string[]`, `legacy?: boolean` 필드 추가.

---

## G3 게이트 결과

| 검증 항목 | 결과 |
|---|---|
| `tsc --noEmit` | ✅ 오류 없음 |
| `validate-session-turns.ts --all` | ✅ 46개 OK, FAIL: 0 |
| `compute-dashboard.ts` 실행 | ✅ 정상 완료 |
| `roleFrequency` 실측값 | ✅ session_047: ace×1, dev×1 |
| `turnSequences` 실측값 | ✅ session_047 sequence 2개 항목 |
| `metrics.turnBasedSessions` | ✅ 1 (session_047만 non-legacy + turns 보유) |

---

## 실측 데이터 스냅샷

```json
"roleFrequency": [
  { "role": "ace", "count": 1, "sessions": ["session_047"] },
  { "role": "dev", "count": 1, "sessions": ["session_047"] }
],
"turnSequences": [
  {
    "sessionId": "session_047",
    "topic": "Phase 2 — ...",
    "sequence": [
      { "role": "ace", "phase": "framing", "turnIdx": 0, "recallReason": null },
      { "role": "dev", "phase": "execution-plan", "turnIdx": 1, "recallReason": null }
    ]
  }
],
"metrics": { "turnBasedSessions": 1 }
```

---

## Phase 3 완료 — D-048 실구현 전 Phase 완료

| Phase | 세션 | 상태 |
|---|---|---|
| Phase 1 | session_046 | ✅ phase_catalog · turn-types · 필드 확장 · G1 |
| Phase 2 | session_047 | ✅ CLAUDE.md Turn Push · finalize 검증 · validate 신설 |
| Phase 3 | session_048 | ✅ 집계 전환 · turnSequences · G3 게이트 |
