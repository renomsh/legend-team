---
session_id: session_094
topic: pd023-resume-self-scores-mvp
role: arki
rev: 3
date: 2026-04-24
---

# Arki — 3세션 Summary 필드 설계

## 배경
- Master 피드백: "구현은 3세션 이내 원칙 — 세션 토큰 효율화로 인한 정보 휘발 차단".
- 구현 지연 시 context loss가 구조적 risk. 자동 summary 로드 시스템 필요.

## 설계 (D-077 박제용)
- 신설 경로: `system_state.recentSessionSummaries[]` (최신 3개 session)
- 생성 주체: `scripts/sync-system-state.ts` 확장 (auto-push.js 이후 단계)
- 필드:
  - `sessionId`, `topicId`, `topicSlug`, `grade`, `closedAt`
  - `decisionsAdded`: D-xxx id 배열
  - `pdOpened` / `pdResolved`: PD id 배열
  - `oneLineSummary`: Edi가 session close 시 작성한 1줄 요약
  - `openFollowUps`: 다음 세션으로 넘긴 action item 요약
- 소비 경로: `/open` step 3.5에서 Master 브리핑 자동 포함

## Dependency
- session_index 2필드 신설: `oneLineSummary`, `decisionsAdded`
- topic_index: `closedInSession` (reverse lookup용)

## PD-036으로 이관 (구현 작업)
