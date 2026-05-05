---
sessionId: session_081
topicId: topic_087
startedAt: 2026-04-23T00:00:00.000Z
closedAt: 2026-04-23T01:00:00.000Z
grade: A
rolesInOrder: []
turnsCount: 0
decisionIds: ["D-062"]
nextAction: "D-062"
---

## Summary

D-062 확정: 자가평가-외부평가 공존 원칙 + 학습축 자가평가 MVP (28지표, 3뷰 추이)

## Decisions

- **D-062**: 자기평가-외부평가 공존 원칙 + 학습축 자가평가 MVP 착지 (Phase 2 consensus 본체 보류)

## Key Findings

- 28 signature 지표: Ace 4 / Arki 3 / Fin 3 / Riki 4 / Dev 4 / Vera 4 / Edi 3 / Nova 3 (즉시 21 / 지연 7)
- 집계 3뷰: 전체 평균 / 최근 10개 평균 / 최근 3개 평균 (추이 가시화)
- Nova 집계 특례: 호출 세션 기반
- Riki 자기 부정 감사 — 정교화 7/8층 자가 철회 (담합 3축·3단 경보·2-track UI·동적 calibration·pair 프로브·rater_bias·post_hoc_incidents)
- 외부 평가자 agent (d) Fin 감사로 기각 — 같은 베이스 모델 외부성 구조적 허상
- PD-023 신규: 학습축 자가평가 MVP 구현 (self_scores.jsonl · self-score-collect 훅 · compute-growth 분기 · 대시보드 역할 카드 8개)
- PD-024 신규: Phase 2 consensus 교차채점 본체 재개 (resolveCondition: 결과품질축·판단일치축 붙은 후 편향이 체계적으로 드러나면)
- 4축 프레임 공식 등록: 결과품질 / 판단일치 / 실행전환 / 학습축

## Open Issues

- Dev·Vera 자가 지표는 본인 확정 완료. Nova 지표는 Ace 대필 — Nova 다음 호출 시 본인 수락·수정 세션 필요
- 즉시/지연 혼합 지표 집계식 초기 calibration — Dev 구현 시 10세션 baseline 후 조정

## Next Action

D-062
