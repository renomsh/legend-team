---
topicId: topic_170
topicTitle: "G3, G4 확인"
phase: framing
hold: null
grade: A
sessionCount: 2
lastUpdated: 2026-05-05T06:08:10.186Z
sizeBytes: 751
---

## Current Phase

**framing**

## Key Anchors

- D-165

## Decisions

- **D-165**: close 프로세스 토큰 절감 2항목 박제. G3: master_feedback_log.json(~19K tokens) 전문 Read 금지 — apply-feedback.ts CLI 위임(인수 4개, topicId 첫 인수 강제, exit code 0 검사, escape hatch). G4: role_memory.json 전문 Read 금지 — lessonLog[] append-only Edit + escape hatch. 사전작업: 6개 역할(ace·fin·riki·sage·vera·zero) lessonLog:[] 신규 추가, dev_memory 비표준 키 정규화. Dev 4/4 PASS 검증.

## Open Issues

_(없음)_

## Next Action

_(미정)_
