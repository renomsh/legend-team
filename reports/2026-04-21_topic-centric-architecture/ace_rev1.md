---
role: ace
session: session_053
topic: topic-centric-architecture
topicId: topic_056
rev: 1
date: 2026-04-21
phase: framing
---

# Ace — Framing (L2) + 종합검토 + 재호출

## 1. Framing

**문제 정의**: 세션·토픽 다대다를 1:1 스키마가 짓눌러 "빈 토픽 세션"과 맥락 단절 발생.

**결정 축 초안 (A1~A4)**:
- A1: 1급 단위 (토픽/세션/세션+태그)
- A2: 다대다 표현 방식
- A3: 성장 축 기준점
- A4: 이행 전략

**executionPlanMode**: none (Master 논의 단계 명시)

## 2. 종합검토 결과 (최종)

Master·Arki·Fin·Riki 출력 교차검토 후 단일 최적해:

| 축 | 결정 |
|---|---|
| A1 | 토픽 1급 승격 |
| A2 | N:1 단방향 (`topic.sessions[]`만) |
| A3 | 이중 성장축 (세션=실행 / 토픽=누적) |
| A4 | 점진 이행, legacy:true 52세션 소급 |
| A5 | **phase(4단계) × hold(직교 플래그) 2차원** |
| A6 | decision `owningTopicId` + agenda.md 충돌 검사 기계화 |
| A7 | `/open` 자동 context 로드 — hold=false 토픽만 |
| A8 | 3층 context (turn_log / session_contributions / context_brief) — hold 토픽 brief 동결 |

## 3. Riki 공격 흡수

- RK-1 (수명 폭증): `topic_lifecycle_rules.json` maxSessions 5·lastActivity 30일, **hold 제외**
- RK-2 (brief 신뢰성): 출처 앵커 의무, 불일치 무효 플래그
- RK-3 (Ace 과부하): agenda.md 충돌 검사 규칙 기계화
- RK-4 (이연 부재): 실시간 PD append 강제

## 4. 이연 결정

실제 구현은 본 세션 스코프 밖. PD-020a/b/c 3개 Grade A 분해:
- PD-020a: 스키마 + phase×hold 기반
- PD-020b: context 3층 누적
- PD-020c: 결정 소유권 + 운영규칙

## 5. 성장 연결

save01~05 수동 관행은 Master 단독 부담 인프라 → 시스템 흡수. 성장 병목 이전.
