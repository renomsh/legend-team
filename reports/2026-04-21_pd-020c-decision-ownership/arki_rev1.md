---
role: arki
topic: PD-020c — 결정 소유권 + 운영규칙 구현
session: session_063
date: 2026-04-21
rev: 1
---

# Arki — 구조 분석 + 실행계획

## 구조 진단
4개 요소를 강제 강도로 재분류. 하드 2건(정합성·휘발방지) + 경고 2건(위생·진위)로 과부화 회피.

## Phase 1 — 데이터 정합성 (하드)
- P1-1: `decision_ledger.json` 스키마 확장 — `owningTopicId`(string), `scopeCheck`(enum 4값)
- P1-2: 소급 백필 스크립트 — 기존 ~54건 세션→토픽 역조회로 `owningTopicId` 부여, 복수 축 세션은 `legacy-ambiguous`
- P1-3: `validate-decisions.ts` — 신규 append 시 `owningTopicId` 필수 검증
- **게이트 A**: 100% 백필 + validate 통과

## Phase 2 — 경고 계층 (소프트)
- P2-1: `topic_lifecycle_rules.json` 설정 파일 신설 (동작 없음)
- P2-2: `scripts/check-stale-topics.ts` — /open 시 브리핑만, 자동 status 변경 없음
- P2-3: `scripts/check-brief-anchors.ts` — context_brief lint, 경고 리포트, legacy 면제
- **게이트 B**: /open 경고 표시 확인

## Phase 3 — 실시간 append (하드)
- P3-1: Ace 발언 중 PD 인식 → 즉시 `system_state.json.pendingDeferrals` append 프로토콜 문서화
- P3-2: `scripts/append-pd.ts` 래퍼
- **게이트 C**: 세션 중 PD 1건 이상 즉시 append 시연

## 의존 그래프
P1 → (P2 ∥ P3)

## 중단 조건
P1-2 백필 오류율 >5% 시 Master 확인.

## 롤백
각 Phase별 schema migration 역산 스크립트 구비.
