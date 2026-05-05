---
role: jobs
turnId: 1
sessionId: session_193
topicId: topic_166
grade: B
invocationMode: subagent
condensed: true
---

[ROLE:jobs]

# Jobs — PD-062 Frame (압축)

## Why
PD-062는 "weight 어디 둘지"가 아니라 "쓰지도 않는 필드 SOT 논쟁"의 문제. D-158 박제 시점엔 drift 위험으로 보였지만 실측 = 0줄 사용 = 환상.

## What
8 policy weight 컬럼 삭제 상태 + 박제 1줄: "사용처 없는 메타데이터의 SOT 논쟁은 하지 않는다." Master 인식: drift 사고 증가가 아닌 drift 정의 정련.

## 결정축 (단일)
**weight 살리기(A·B·C) vs 묻기(D)**. Master "3안 시뮬레이션"은 정직 비교 요청이지 "셋 중 하나" 강제 아님. Arki D안 정합, Jobs 동조.

## Scope
**In:** 8 policy weight 컬럼 삭제 / D 박제("dead field는 SOT 논쟁 대상 아님") / PD-062 → resolved-cancelled.
**Out:** PD-063(별개) / core/extended 보존 논쟁(이미 `inputPriority`) / weight validator(측정 위한 측정) / 미래 사용 변호 / 다른 dead field 일괄 점검.

## 핵심 전제
- 🔴 weight 사용 코드 = 0줄 (Arki 1-3·1-4). 틀리면 frame 무효.
- 🟡 D-158 분리 판단은 "drift 정합" 의도, "weight 가치 검증" 아님 — 재해석 가능.
- 🟢 Master 가치 = 구조 정합성.

## 인지편향 적출
1. **confirmation bias** — Arki·Jobs 동조. 검증축: Dev grep 0건 재확인 의무.
2. **anchoring** — "3안 시뮬레이션" anchor. Arki D안 제시로 깸.
3. **sunk cost 회피** — D-158은 분리만 결정, 보존 결정 아님 → sunk cost 0.
4. **availability 역방향** — drift 5건이 표 형식 = "표 형식 = 위험" 일반화 위험. weight 표 형식이지만 drift 0건. 형식 ≠ 위험.

## Focus
- 본질: 사용처 0 필드는 SOT 논쟁 대상이 아니다.
- saying no: A·B·C 전면 기각.
- 단일 액션: 8 policy weight 컬럼 삭제 + D 박제 + PD-062 resolved-cancelled.

## executionPlanMode: none
변경 범위 8 policy + ledger 1 + PD 1. Phase 분해 불필요. Dev 직행.

## Grade B 정합
override 없음. (a) 8 policy 일관성 강제 (b) D 박제 일반화 효과 (c) 인지편향 적출 분량 — B 유지.

[ROLE:jobs]
# self-scores
focus_sharp: 5
bloat_idx: 1
bias_cnt: 4
no_cnt: 5
