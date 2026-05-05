---
topicId: topic_155
topicTitle: "셀프 평가 가동 - 미가동 원인 분석 및 정상화"
phase: implementation
hold: null
grade: B
sessionCount: 2
lastUpdated: 2026-05-03T14:20:07.433Z
sizeBytes: 798
---

## Current Phase

**implementation**

## Key Anchors

- D-150

## Decisions

- **D-150**: post-tool-use-task.js extractSelfScores()가 tool_response를 content block array([{"type":"text","text":"..."}]) 형식으로 수신 시, Array.isArray 분기 없어 JSON.stringify() fallback → \n이 \\n으로 이스케이프 → split(/\r?\n/) 불발 → selfScores 파싱 0건 → turns[].selfScores 누락. session_130~178 (49세션) 연속 누락 원인. Array.isArray 분기 6줄 추가로 수정. TC1~TC4 ALL PASS 검증 완료.

## Open Issues

_(없음)_

## Next Action

_(미정)_
