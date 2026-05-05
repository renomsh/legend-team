---
sessionId: session_073
topicId: topic_079
startedAt: 2026-04-22T06:00:00.000Z
closedAt: 2026-04-22T07:00:00.000Z
grade: A
rolesInOrder: []
turnsCount: 0
decisionIds: []
nextAction: "RAW"
---

## Summary

RAW 토큰 패널 2-row 재설계: Row1=token counts(항상visible), Row2=$(항상visible), hidden expand=5행 상세표

## Decisions

_(없음)_

## Key Findings

- compute-dashboard.ts: tokenUsage에 inputTokens/outputTokens 필드 추가 → 상세 테이블 input/output 분리 표시 가능
- session_072 PD-NEW-B 설계 역전 원인 규명: <details> 전체 접기 = 수치 hidden 처리 → 이번 세션에서 복원

## Open Issues

_(없음)_

## Next Action

RAW
