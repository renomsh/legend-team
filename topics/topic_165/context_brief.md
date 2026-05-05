---
topicId: topic_165
topicTitle: "Measurement Loop 종합 — self-score → registry → board 5겹 단절 정리"
phase: framing
hold: null
grade: S
sessionCount: 7
lastUpdated: 2026-05-05T01:44:14.744Z
sizeBytes: 1423
---

## Current Phase

**completed**

## Key Anchors

- D-159
- D-160

## Decisions

- **D-160**: memory/roles/jobs_memory.json + memory/roles/policies/role-jobs.md 5 metrics → 4. 폐기: jobs.frame_decision_link / jobs.bias_hit / jobs.legacy_log (external rater = Master ex-post 행위 의존, self-measurement 부적합). 유지: focus_sharp / bloat_idx (self). 신규 자가카운트: bias_cnt(Step 6 적출 편향 개수) / no_cnt(Step 4 OUT 항목 개수). Master 지시 'jobs SOT 부적합하면 4개로 압축' 직접 처리.
- **D-159**: Jobs framing(Why=D-092 자가측정 약속 이행) + Ace 종합(A-1 aggregate SOT, registry derived) + Master 결정. 5겹 단절: 1.입력 박제 dead(extractSelfScores 3 bug — content[]/lastIndexOf/SCREAMING_SNAKE) / 2.registry⟂aggregate ID 정합 0 / 3.렌더 join 0 / 4.로컬 path / 5.parser 미스매치. Phase 1~4 모두 PASS. registry v1.1, 51 metrics(active 15+historical 36), aggregate IDs 50⊆registry 51 정합률 100%. hidden 정책: hasData(n>0 && mean!=null). 본 세션 보드 4 role 노출(jsonl 멈춘 historical), 다음 세션부터 jobs/dev/ace/arki/riki 자연 누적.

## Open Issues

_(없음)_

## Next Action

_(미정)_
