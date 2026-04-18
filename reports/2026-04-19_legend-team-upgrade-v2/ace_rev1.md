---
session: session_036
role: ace
topic: legend-team-upgrade-v2
date: 2026-04-19
rev: 1
---

# Ace 프레이밍 + 오케스트레이션 — session_036

## L1 프레이밍 (경량)

**3축 분해:**
1. 페르소나 재정의 (7개 역할 × Top 0.1% 기준)
2. 스킬·오픈소스 매핑 (역할별 역량 ↔ 기존 skill)
3. Board 계측 (성장 패턴 + 자율성 게이트 + 캐시 진단)

**범위 경계:**
- IN: 역할 메모리 업데이트, 대시보드 자율성 게이트, 캐시 진단
- OUT: 신규 역할 도입, 토픽 프로토콜 재설계

## Grade 상향 선언 (Ace 조정권 최초 행사)

- Master 선언: B
- Ace 상향: A (역할 페르소나 전면 재정의 + 성장지표 정의 프레임 = Size ≥ 8)
- 실제 진행: B (버그 수정 + 이연 확정으로 범위 축소)
- gradeActual: B, gradeMismatch: true 기록

## 핵심 의사결정 (이번 세션 확정)

- **D-040**: Ace가 Grade 조정권 행사. Master 선언 grade와 실제 작업 gap 발생 시 Ace가 조정.
- **성장 인과 체인 확정**: 학습 누적 → 적중률 향상 → 자율성 증가 (Master 명시, session_036)
- **자율성 게이트**: session ≥ 026만 유효 (D-024 의미 확립 시점 기준)

## 축 3 실행 결과 요약

- session_035 캐시 재백필 성공 (94.15%)
- 수동 복구 13건 완료 (17 → 30/35 세션)
- 대시보드 session ≥ 026 게이트 3곳 적용
- dashboard-ops 이연과제 필터 버그 수정

## 이연 확정 (PD-013~016)

- PD-013: 페르소나 Top 0.1% 재정의 (다음 세션 1순위)
- PD-014: 역할별 스킬·오픈소스 매핑
- PD-015: 성장지표 정의 + 계측 구조 설계
- PD-016: Hook transcript_path=MISSING 방어 (PD-013에 묶음 처리)
