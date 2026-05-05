---
topicId: topic_157
topicTitle: "오픈·클로즈 경량화 검토"
phase: framing
hold: null
grade: B
sessionCount: 11
lastUpdated: 2026-05-04T06:01:11.311Z
sizeBytes: 1377
---

## Current Phase

**framing**

## Key Anchors

- D-151
- D-152
- D-153

## Decisions

- **D-151**: sync-system-state.ts L174: currentState.pendingDeferrals 전량 carry-over → .filter(d => d.status === pending) 1줄 수정. system_state.json 46,743 bytes → 4,938 bytes (-90%). /open step 2 토큰 ~10,500 절감.
- **D-152**: Zero Condense Gate: Edi 호출 시 `_zero_condense.json` 마커 부재 → 프롬프트 BLOCK으로 mutate. Zero가 먼저 역할 보고서 정제(60~70% 압축 목표) + 마커 작성 → Edi 재호출 시 통과. findLatestReport()가 condensed.md 우선 체크하여 압축본을 inject에 활용. 검증 2건(BLOCK 동작 / 정상 통과) 로그 확인. 목표: 극 절감이 아닌 품질 보장 + 일부 절감.
- **D-153**: Zero D.Condense 2단계 분리: Phase A(pre-Edi 개별 역할 압축, 기존) + Phase B(post-Edi Edi 최종 보고서 cross-role 중복 제거, 신규). role-zero.md Edi 제외 정책 수정(cap 8000은 inject 상한, 압축 자체 허용). buildTopicLayer: {sessionId}_edi_report_condensed.md 우선 inject. 실측: Phase A+B 합산 51,075B→21,937B (-57.0%, ~7,285 tokens).

## Open Issues

_(없음)_

## Next Action

_(미정)_
