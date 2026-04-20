---
role: vera
topic: Phase 4 — UI
session: session_049
date: 2026-04-20
rev: 1
---

# Vera — Design Spec

## 스킬 조건부 매트릭스 (self-designed)
5개 design:* 플러그인 스킬 — Skill() 필수 호출 조건 + skipWhen + invocationMode 필드 강제 (허세성 기재 차단, session_045 재발 방지).

## 구현 주체
- 스펙 Vera / 구현 Editor 원칙 유지 (D-029)
- 예외: 신규 시각화 문법 최초 프로토타입 1회 → Vera 직접

## Sequence 패널 스펙
- 위치: session.html History 탭, roleFreqChart 직후
- 치수: 96px label · 16px node(r=8) · 28px gap · 280px 컨테이너 · 최대 10행
- 색: ROLE_COLORS 재사용, 신규 토큰 0개
- R-D01: 재호출 노드 = 2px dashed --text
- R-D02: 연결선 = rgba(139,92,246,0.25)
- 접근성: 24×24 hit area, --text-3 금지

## design:design-critique · design:design-system 실호출
두 스킬 실제 Skill() 호출하여 구조 검증 완료. 전역 재설계 불필요, 신규 토큰 0개 확인.

## Claude Design 구분 학습
claude.ai/design(웹) ≠ design:* 플러그인. 이번 세션 학습 → vera_memory.skills.external 및 feedback 메모리 신설.
