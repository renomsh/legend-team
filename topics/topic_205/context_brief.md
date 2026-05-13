---
topicId: topic_205
topicTitle: "D-NNN status 규격화 + 전수 검사"
phase: framing
hold: null
grade: A
sessionCount: 2
lastUpdated: 2026-05-13T05:35:36.440Z
sizeBytes: 1195
---

## Current Phase

**framing**

## Key Anchors

- D-189
- D-190

## Decisions

- **D-189**: (1) status 표준 3종 확정: active(현행 정책·구현) / deprecated(폐기·대체·완료) / superseded(후속 결정 존재). 기존 비표준 상태값(confirmed/partially-superseded/resolved/pending) 전부 정규화. (2) 189건 전수 검사 완료: active 97건 / deprecated 84건 / superseded 8건. (3) decisions.html viewer 수정: fallback || pending → || active, 필터·pill·카운트 3종 갱신.
- **D-190**: 향후 인용은 active D-NNN만 허용 정책 코드 박제. scripts/validate-decision-citations.js: staged(pre-commit) / all(수동 감사) 2모드. 대상 파일: CLAUDE.md / hooks / skills / commands / memory/roles. 제외: decision_ledger.json / sessions / reports / topics. exit 0 WARN-only. pre-commit hook(.githooks/pre-commit)에 staged 모드 자동 연결. 기존 레거시 인용 101건은 별도 정리 토픽 대상.

## Open Issues

_(없음)_

## Next Action

_(미정)_
