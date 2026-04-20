---
session: session_048
topic: "Phase 3 — 집계 전환 + 실측 데이터 검증"
topicSlug: phase3-aggregation-validation
topicId: topic_051
date: 2026-04-20
grade: B
roles: [ace, dev, arki, dev]
decisions: []
status: completed
revision: 2
---

# Phase 3 — rev2 (Arki 보완 적용)

## 보완 내용: 환경변수 경로 오버라이드 추가

Arki 지적: compute-dashboard.ts 경로가 ROOT 기준 고정경로라 테스트 픽스처 주입 불가.
Phase 2 패턴(FINALIZE_* 오버라이드)과 일관성 유지를 위해 추가.

**변경 전:**
```typescript
const SESSION_INDEX_PATH = path.join(ROOT, 'memory', 'sessions', 'session_index.json');
const OUTPUT_PATH        = path.join(ROOT, 'memory', 'shared', 'dashboard_data.json');
// ...
```

**변경 후:**
```typescript
const SESSION_INDEX_PATH   = process.env.COMPUTE_SESSION_INDEX   ?? path.join(ROOT, ...);
const TOPIC_INDEX_PATH     = process.env.COMPUTE_TOPIC_INDEX     ?? path.join(ROOT, ...);
const DECISION_LEDGER_PATH = process.env.COMPUTE_DECISION_LEDGER ?? path.join(ROOT, ...);
const TOKEN_LOG_PATH       = process.env.COMPUTE_TOKEN_LOG       ?? path.join(ROOT, ...);
const FEEDBACK_LOG_PATH    = process.env.COMPUTE_FEEDBACK_LOG    ?? path.join(ROOT, ...);
const PROPOSAL_LOG_PATH    = process.env.COMPUTE_PROPOSAL_LOG    ?? path.join(ROOT, ...);
const OUTPUT_PATH          = process.env.COMPUTE_OUTPUT_PATH     ?? path.join(ROOT, ...);
```

## 검증

| 항목 | 결과 |
|---|---|
| `tsc --noEmit` | ✅ 오류 없음 |
| 기본 실행 | ✅ 46개 세션, 정상 완료 |
| `COMPUTE_OUTPUT_PATH` 오버라이드 | ✅ 커스텀 경로로 출력 확인 (totalSessions: 46) |
