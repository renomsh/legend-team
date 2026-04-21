---
session: session_052
topic: Session History Design Change
role: ace
rev: 1
date: 2026-04-21
---

# Ace — 프레이밍

## 핵심 질문
Session History의 Turn Sequence와 Role Frequency 차트를 어떤 시각 언어로 교체해야, 정보 밀도를 유지하면서 품질 기준을 충족하는가?

## 결정 축
1. Turn Sequence dot — 색상 구분(A) vs 이니셜+색상(B)
2. Role Frequency — 차트 타입 (Lollipop / 수직 Bar / Dot / 기타)
3. Vera 참여 범위 — 색 토큰 명세만 vs 전체 시스템 재설계

## 범위
- In: Turn Sequence dot 색상/크기/stroke, Role Frequency 차트 타입·색상
- Out: 전체 레이아웃, 다른 패널, ECharts 타입 전환

## 실행계획 모드
`executionPlanMode: plan`

## 역할 호출
Vera → Dev (Arki/Fin/Riki 스킵)
