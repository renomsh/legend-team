---
role: editor
topic: PD-020c — 결정 소유권 + 운영규칙 구현
session: session_063
date: 2026-04-21
rev: 1
---

# Editor — 최종 산출물

## 세션 결과
PD-020c 프레이밍 + 실행계획 확정. 구현은 별도 세션 오픈 권장.

## 확정 결정축
- D1 scopeCheck: 4값 enum (topic-local / cross-topic / global / legacy-ambiguous)
- D2 lifecycle rules: 경고만 (과부화 회피)
- D3 앵커 규칙: 경고만 (legacy 면제)
- D4 실시간 PD append: 발언 직후 즉시 + Editor 백업 게이트

## 실행계획
- Phase 1 (하드): decision_ledger 스키마 확장 + 백필 + validate
- Phase 2 (경고): lifecycle config + stale check + brief anchor lint
- Phase 3 (하드): 실시간 PD append 프로토콜 + 래퍼 스크립트

## Master 핵심 피드백
"별것 아닌 자동화는 경고만 — 과부화 회피" → 4요소 중 2건을 soft warning으로 하향. Ace 기본 제안 → Master 조정 원칙 재확인.

## 다음 세션
PD-020c P1 (decision_ledger 스키마 확장 + 백필) 부터 구현 착수.
