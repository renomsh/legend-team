---
topic: topic_067
topic_slug: pd-020c-p1-decision-ledger
role: dev
phase: implementation
revision: 1
date: 2026-04-21
report_status: approved
session_status: closed
accessed_assets:
  - decision_ledger.json
  - topic_index.json
  - session_index.json
  - system_state.json
---

# Dev — PD-020c P1+P2+P3 구현 완료

## P1 — decision_ledger 스키마 확장 + 백필

### 타입 정의 (`src/types/index.ts`)
- `ScopeCheck` 타입: `'topic-local' | 'cross-topic' | 'global' | 'legacy-ambiguous'`
- `DecisionLedgerEntry` 인터페이스: `owningTopicId: string | null`, `scopeCheck: ScopeCheck`, `relatedTopics?: string[]`
- `DecisionLedger` 인터페이스

### 백필 (`scripts/backfill-decision-ownership.ts`)
- 54개 엔트리 백필 완료 (D-055 1개 스킵 — 이미 완료)
- `owningTopicId`: session_index.topicId 역매핑 우선 → slug 역매핑 fallback → null 0건
- `scopeCheck`: 전 엔트리 `legacy-ambiguous` (기본값)

### 게이트 A 검증 (`scripts/validate-decision-ownership.ts`)
- 55개 엔트리 전 OK
- owningTopicId 미정의: 0건 / 범위 외 scopeCheck: 0건 / 존재하지 않는 topicId: 0건

## P2 — 경고계층 (A6-2 + A6-3)

### lifecycle 규칙 (`memory/shared/topic_lifecycle_rules.json`)
- maxSessions: 5, lastActivityDays: 30, legacyCutoff: 2026-04-21

### A6-2 lifecycle 경고 (`scripts/check-topic-lifecycle.ts`)
- session_contributions 파일 수 기반 세션 카운트
- topic_meta.json lastUpdated 기반 stale 판정
- hold 토픽 + expectedDuration 토픽 자동 제외

### A6-3 anchor lint (`scripts/check-context-brief-anchors.ts`)
- legacyCutoff 이전 토픽 면제
- session_contributions 있으나 Key Anchors 비어있는 경우 경고
- 검증: topic_066 경고 정확히 감지

### `/open` 통합 (`scripts/load-context-briefs.ts`)
- lifecycle 경고 + anchor lint 경고를 3.5단계 실행 시 함께 출력

## P3 — 실시간 PD append (A6-4)

### `scripts/append-pending-deferral.ts`
- system_state.json.pendingDeferrals 즉시 append
- current_session.json.pendingDeferralsAdded 추적 기록
- PD ID 자동 채번 (현재 최고 +1)

### `scripts/check-pending-deferrals.ts` (Editor 역검사)
- pendingDeferralsAdded ↔ system_state 불일치 감지
- notes에 이연 키워드 있으나 pendingDeferralsAdded 비어있는 경우 경고

### `session-end-finalize.js` 통합
- `runCheckPendingDeferrals()` 추가 → `/close` 시 자동 역검사 실행

## 검증 결과
- 정상 추가 → "이상 없음"
- 수동 제거 후 → "PD-022 미반영" 경고 정확히 감지
- 전체 스크립트 TypeScript 컴파일 통과
