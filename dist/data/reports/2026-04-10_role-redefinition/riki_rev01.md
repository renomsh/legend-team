---
topic: topic_010
title: 역할 재정의
role: riki
revision: 1
date: 2026-04-10
session: session_012
status: completed
---

# Riki — 리스크/반대축 분석

## Ace 진화 리스크 검증

### R-01 조기 승격
- 측정 구조 없음 → "느낌" 승격 위험
- 대응: 측정 구조 별도 토픽

### R-02 눈치 vs 학습 (가장 위험)
- Ace memory에 framePatterns만 있고 Master 선택 패턴 미기록
- **Master 채택**: masterSelectionPatterns 필드 추가 필요 (이연)
- Master 지시: "왜 채택했고 왜 기각했는지 학습해야 하고 답변하지 않으면 물어봐야"

### R-03 교란축 사망
- Ace 승격 후에도 Riki adversarial 기능 강화 필요
- 대응: 역할 정의에 "Ace 초안 포함" 명시

## Editor 판단 경계
- "편집 판단"과 "내용 판단" 구분 명시 필요
- Editor 존재 의미: 구성/순서/강조점 선택

## Riki 자체 조정
- "실행 왜곡" 명시 추가 (CLAUDE.md에는 있었으나 charter 누락)
- "Ace 초안 포함 모든 제안에 대해 adversarial 검증" 명시
