---
role: jobs
topic: topic_171
title: Legend Nexus PC 환경 — 노트북 하드웨어 업그레이드
date: 2026-05-05
turnId: 1
invocationMode: subagent
executionPlanMode: plan
grade: B
---

# Jobs Framing — topic_171

## Step 0. 토픽 생명주기 판정

- **topicType**: `standalone`
- parentTopicId: 없음

## Step 1. Why

현재 LG 그램의 병목은 메모리와 열 설계다.

Claude Code + Legend Nexus는 동시에 다수의 서브에이전트를 구동한다. 16GB RAM은 에이전트 컨텍스트 적재 + OS + 개발 툴체인이 겹치는 순간 스왑이 발생하고, 그램의 경량 냉각 설계는 지속 부하 시 쓰로틀링을 유발한다. **지금 병목은 CPU 클럭이 아니라 메모리 대역폭과 열 마진이다.**

브릿지 머신이기 때문에 "영구 최적"이 아니라 **"서버 이전 전까지 시스템이 제약 없이 돌아가는 것"** 이 목표다.

## Step 2. What

≤2.5kg 조건을 만족하는 노트북 중, Legend Nexus 에이전트 워크로드를 제약 없이 구동할 수 있는 기종을 하나 선택한다.

결과물: 기종 확정 + 구매 스펙 (RAM·SSD·디스플레이 구성) 1안

## Step 3. Decision Axes

| 축 | 극단 A | 극단 B | 핵심 trade-off |
|---|---|---|---|
| **메모리** | 32GB | 64GB+ | 현재 워크로드 커버 vs 미래 에이전트 확장 여유 |
| **열 설계** | 경량 팬리스형 | 풀 히트파이프 + 듀얼팬 | 무게 vs 지속 부하 성능 |
| **무게** | ≤1.5kg (그램급) | 2.0~2.5kg (성능 노트북) | 이동성 vs 쓰로틀링 리스크 |
| **플랫폼** | Intel Core Ultra | Apple M-series (맥북) | 호환성(Windows/WSL) vs 메모리 효율·전력 우위 |
| **브릿지 기간** | 단기(~6개월) | 장기(~2년) | 투자 규모 정당성 |

## Step 4. Scope In / Out

**In:**
- ≤2.5kg 기종 후보 구조 분석
- RAM 32GB vs 64GB 판단
- 지속 부하 쓰로틀링 리스크 검토
- 플랫폼 선택(Windows vs macOS)
- 구매 구성 확정 (단일 최종 안)

**Out:**
- 서버 이전 이후 환경 설계
- 외부 모니터·주변기기 셋업
- 소프트웨어 마이그레이션 절차
- 가격 비교·최저가 채널 탐색
- 3개 이상 후보 상세 비교

## Step 5. Key Assumptions

- 🔴 브릿지 기간 미확정 — 2년 이상이면 투자 규모 재산정
- 🔴 에이전트 규모 확장 가정 — 현재 기준, 2배 증가 시 64GB 필요
- WSL 의존 가정 — Claude Code Windows+WSL 구동 전제
- 쓰로틀링 기준 — 지속 30분+ 풀 부하 시 성능 저하 없음

## Step 6. 인지편향 경고

1. **Anchoring** — 그램 기준 "조금 더 나은 것" 탐색. 기준을 에이전트 워크로드로 재설정.
2. **Loss Aversion** — Windows 환경 포기 회피. M-series 실질 비교 필요.
3. **Sunk Cost** — "어차피 서버로 갈 건데" 투자 억제. 브릿지 기간 생산성 비용이 더 크다.

## Step 7. Focus — Saying No

- ❌ 외장 GPU / eGPU 셋업 — LLM은 API 경유, 무관
- ❌ 서버 이전 일정 병행 논의 — 범위 오염
- ❌ 3개 이상 후보 상세 비교표 — 결정 지연
- ❌ 무게 1.5kg 이하 고수 — 2.5kg 허용 범위 실제 활용 필요

## executionPlanMode: plan

결정 축 명확(2축 교차), 후보 압축 → 구매 스펙 확정까지 단계 선형. Arki 실행계획 필요.

---

## Self-Scores

[ROLE:jobs]
# self-scores
focus_sharp: 5
bloat_idx: 1
bias_cnt: 3
no_cnt: 4
