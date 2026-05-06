---
topicId: topic_175
topicTitle: "데이터북 Agent 설계"
phase: framing
hold: null
grade: A
sessionCount: 2
lastUpdated: 2026-05-06T12:39:58.221Z
sizeBytes: 742
---

## Current Phase

**framing**

## Key Anchors

- D-169
- D-170

## Decisions

- **D-169**: 개인 제출 파일은 변경건만 포함(박정규 47건). 팀 완료 파일이 전체 행 포함(박정규 117건). G1.a 기준값 117건 확정. normalize 소스 = 팀 완료 파일.
- **D-170**: 취합본 실측: col7(현재담당자) 사용, col8(변경전)·col9(To_be) 0건. 팀 파일 as_is(col6) → 취합본 현재담당자(col7) 매핑. rep_column_key=as_is, rep_output_col=현재담당자 policy SOT 박제.

## Open Issues

_(없음)_

## Next Action

_(미정)_
