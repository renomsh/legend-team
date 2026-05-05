---
topicId: topic_125
topicTitle: "버전 업그레이드 기준 개편"
phase: framing
hold: null
grade: A
sessionCount: 1
lastUpdated: 2026-04-28T06:38:15.371Z
sizeBytes: 702
---

## Current Phase

**framing**

## Key Anchors

- D-104

## Decisions

- **D-104**: 버전 bump 트리거를 Decision 전용에서 구현·디버그·역할 강화·정책 추가로 확장. Ace 수동 선언 + session-end-finalize.js 자동 전파. 증분 +0.1/+0.01/+0.001, 세션당 최대 +0.1 캡. 경고 없음 (캡이 구조적 안전장치). R1 역할 과호출 임계값 Grade 구분 없이 ≥11 단일 통일. legacy-gap 태그로 v1.65~v1.75 공백 마킹.

## Open Issues

_(없음)_

## Next Action

D-104:
