---
title: "session_089 Ace — PD-023 G6 Acceptance + 구조 사고·복구 종합"
session: session_089
topic: topic_094
parentTopic: topic_088
date: 2026-04-24
grade: S (declared) / B (actual work) — gradeMismatch 누적
author: ace
---

# session_089 — 이연 PD-023 재개착륙 + G6 PARTIAL PASS

## 발생 사고 개요

1. Master가 `/open S PD-023` 선언 → Ace가 canonical spec(arki_rev1.md)만 읽고 **P0a부터 재구현 착수**
2. P0b parallel agents(5종) 실행 → lib·schema·seed·fixture·docs overwrite
3. runtime 파괴 발생(compile-metrics-registry FAIL, test-p0b-smoke FAIL, compute-signature-metrics FAIL)
4. **사실은 session_083/084에서 이미 P0a~P5 전 구현 완료됨** — git log `add088c`, `7dc4684`
5. Ace 재소집 + Arki 구조 진단 → git restore 선별 복구 → 전 scripts 재검증 PASS (sourceHash=8d314a 보존)

## 근본 원인

1. **Ace 오케스트레이션 실패**: /open 시 PD resolveCondition을 "종결 조건" 아닌 "남은 일"로 오독. children topic status·git log 교차검증 미수행.
2. **시스템 staging drift**: Master 긴급 끼어들기(session_085~088 Vera/cost-report) 후 resumption에서 PD status 갱신 protocol 부재.

## 박제 결정

- **D-065**: Ace Step 0b 교차검증 의무화(D1) + PD-030 자동 전이 훅 신설(D3). D2 중간상태 기각.
- **PD-030**: 구현 완료 세션의 PD status 자동 전이 훅 (재발 방지)
- **PD-031**: self-score MVP 실가동 감사 (70 records 중 86% propagation 발견 후)
- **Ace Step 0b** skill 반영 완료 (`.claude/skills/ace-framing/SKILL.md`)

## G6 Acceptance 종합 평가

| 차원 | 결과 |
|---|---|
| G6.1 정량 6항목 | ✅ 6/6 PASS |
| G6.2 ① 5토픽 운영일지 | ⚠️ PARTIAL (2/5 생존) |
| G6.2 ② batch helper | ❌ FAIL (미구현 발견) |
| G6.2 ③ dashboard 사용 | ⏸ DEFERRED (topic_082 대기) |
| G6.2 ④ 의사결정 영향 | ⏸ DEFERRED (실가동 전) |
| G6.2 ⑤ 5분 초과 세션 | N/A (helper 미구현으로 moot) |

**Tier A 기계적 충족 (5토픽+Grade 2종)**, **실질 PARTIAL PASS**.

## 지표 구조 개선 (심플-성장 원칙 적용)

- `dev.gate_pass_rate` base → **derived composite**: 4 sub(first_try·retry·post_gate_debug·hardcoding) weighted-mean
- `editor.gap_flag_count` base → **derived composite**: 3 sub(mechanical·structural·retroactive) weighted-mean
- 기존 records 소급 변환 금지(feedback_no_retro_without_value)
- metrics_registry: 29 → 36 metrics, sourceHash=1c555d201ac602f0
- Master 박제 원칙: **"심플하되 성장하는 측정 — 100 도달 후 조정, 사전 상세화 금지"**

## 다음 과제 추천 (우선순위)

1. 🔴 **P0**: PD-031(MVP 실가동 감사, Grade A) + topic_082(Dashboard 전면 개편, Grade A) **병행 통합 토픽**
2. 🟠 P1: PD-030(자동 전이 훅, Grade B) / pre-existing TS drift 수리(Grade C)
3. 🟡 P2: PD-023 G6 재평가 → PD-025 체인 진입 / topic_044 COPD 재개
4. ⚪ P3: PD-028·topic_012·PD-029(대기 조건)

## Ace 자기반성

- Master 긴급 끼어들기 후 resumption 세션은 **인지 부하가 높은 취약 지점** — 이번 사고의 1차 원인
- /open 습관을 "즉시 작업 진입" → "먼저 상태 교차검증" 순서로 재구성 필요 (Step 0b가 그 박제)
- 10분 이상 작업 방향 확신하기 전에 Master에게 **"X는 이미 구현되어 있습니까?" 1줄 확인**이 P0b 5에이전트 병렬 투입보다 저렴했다
