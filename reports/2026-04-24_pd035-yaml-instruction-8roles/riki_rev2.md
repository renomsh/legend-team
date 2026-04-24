---
turnId: 7
invocationMode: subagent
phase: recommendation
rev: 2
---

# Riki — Q1~Q3 권고

## Q1: 옵션 B

turns 배열 자동 산출을 권고합니다. 자가 선언(A)은 게이밍 면역 0이고, Master 확인(C)은 저마찰 원칙과 정면충돌합니다. B는 Turn Push Protocol(D-048)이 이미 `role`·`chars`를 실시간 박제하고 있어 별도 수집 비용이 없습니다. 임계치 N은 고정치보다 **해당 세션 전체 turns의 chars 분포 기반 상대 임계**(예: median의 30%)로 둬야 발언 무게가 가벼운 세션에서의 cherry-picking도 차단됩니다.

## Q2: 옵션 B

`dev.hc_rt`는 standard로 강등하고 core는 `rt_cov` 단독으로 가야 합니다. 옵션 A는 "외부 rater 병기"라는 조건부 방어인데, 외부 rater 미참여 세션에서 조용히 자가 점수만 남는 순간 RK-4(Dev 자가채점 루프)가 그대로 작동합니다. Arki 참여 여부에 core 지표가 종속되면 Arki 결석 = 지표 왜곡 경로가 생깁니다. core는 외부 의존 없이도 방어가 성립해야 합니다.

## Q3: 옵션 A

deferred-settlement 플래그 신설을 권고합니다. 옵션 B(lookback 재정의)는 "N-3의 gaps"가 그 세션에 실제로 박제돼 있어야만 성립하는데, 과거 세션은 gaps 스키마가 비어 있을 확률이 높아 editor.gp_acc가 **구조적으로 산출 불가**가 됩니다 — RK-3를 해결하는 게 아니라 지표를 죽입니다. 옵션 C(PD 분리)는 박제 누락 3세션 × 8역할 drift 비용이 Phase 1개 추가 비용보다 비쌉니다. A는 Arki 실행계획에 **Phase: deferred-settlement 재계산 루프** 1개를 추가하지만, 이게 정공법입니다.

## 종합

Arki 실행계획 수정 필요 지점:

- **Phase 추가: 참여 판정 루프** — 매 세션 종료 시 `turns[]` → `participation[role]` 산출, `invoked-sessions-only` composite 분모에 주입 (Q1-B 반영)
- **Phase 추가: deferred-settlement 재계산** — `gp_acc: deferred` 플래그 세션을 N+3 시점에 소급 주입 + composite 재계산, 이전 3세션 editor composite를 **deferred 상태**로 명시 박제 (Q3-A 반영)
- **스키마 수정: dev.core 정의** — `core = {rt_cov}` 단일 지표로 축소, `hc_rt`는 standard 블록으로 이동 (Q2-B 반영). 이에 따라 dev composite 가중치 재정규화 필요.

RIKI_WRITE_DONE: C:\Projects\legend-team\reports\2026-04-24_pd035-yaml-instruction-8roles\riki_rev2.md
