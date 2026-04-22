---
role: ace
topic: PD-021 auto-model-switch 재구현 — Sonnet 메인 + Opus 서브에이전트
session: session_068
phase: framing
date: 2026-04-22
---

# Ace — 프레이밍

## Step 0. 토픽 생명주기 판정
- **topicType**: `framing` — 오케스트레이션 모델 정책 결정이 선결. 구현은 child 토픽으로 분기.
- **parentTopicId**: 없음 (standalone framing)
- **resolveCondition**: 오케스트레이션 모델정책 확정 + 구현 토픽 분기 시 resolved

## 1. 토픽 정의
**핵심 질문**: Sonnet을 메인 오케스트레이터로 유지하고 역할 발언을 `model: opus` 서브에이전트로 위임하는 구조가 현 레전드팀 프로토콜에서 성립하는가, 그리고 성립한다면 Grade A까지 Sonnet 메인으로 내릴 수 있는가.

**배경**: 현 auto-model-switch는 "/model opus-4-7 타이핑 안내"에 그친 더미. 원래 의도(Sonnet 메인 + Opus 서브호출)와 불일치 — session_059 발견.

## 2. 결정 축
- **Axis 1**: Monolithic(현재) vs Dispatcher-Worker(제안)
- **Axis 2**: Grade × 모델 매핑 재정의 — A까지 Sonnet 메인?
- **Axis 3**: 발언 기록 무결성 — 서브 원문 보존
- **Axis 4**: 재호출 4조건 호환성

## 3. 범위
**In**: 기술 성립 검증, 프로토콜 호환성, Grade×모델 매핑, 비용 비교, child 구현 토픽 분기
**Out**: 실제 스킬 구현(child), 정확한 비용 측정, Nova·Dev·Vera 서브화

## 4. 핵심 전제
- 🔴 E1: Agent tool `model: opus` 실제 라우팅
- E2: 오케스트레이션 판단은 Sonnet 수준으로 충분
- E3: 서브 raw 원문 보존 가능
- E4: 컨텍스트 재주입 비용이 통짜 Opus보다 낮음

## 5. executionPlanMode: conditional

## 6. 역할 호출 설계
순서: Arki → Fin → Riki → Ace 종합. Nova/Dev/Editor 스킵.
