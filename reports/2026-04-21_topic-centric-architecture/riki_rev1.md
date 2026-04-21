---
role: riki
session: session_053
topic: topic-centric-architecture
topicId: topic_056
rev: 1
date: 2026-04-21
phase: risk-audit
---

# Riki — 가정 공격·실패 모드

개수 채우기 금지. 확신 있는 것만 제기.

## 1. G1 공격 — 부분 기각

"빈 토픽 세션 원인 = 스키마 1:1"은 완전 원인 아님. D-047 topic_index 등록 실패가 더 큰 비중. **N:1 전환 후에도 create-topic.ts 자동 호출 규칙(D-047) 유지 필수 — 중복 방어.**

## 2. 실질 리스크

**🔴 RK-1 (critical): 토픽 수명 폭증**
N:1 + 자동 context 로드는 "그냥 이어서 세션 추가"를 구조적으로 쉽게 만듦. 토픽 종결 판단 흐려짐.
- 완화: `maxSessions 5`·`lastActivityAt 30일` 경보, `topic_lifecycle_rules.json` 신설
- **Master 제안 hold 직교화로 대부분 해소**: hold 토픽은 경보 제외

**🔴 RK-2 (critical): context_brief 신뢰성**
D-046 save04.md 오염 동결 사례 재발 가능. 편의 요약이 canonical 취급됨.
- 완화: brief frontmatter에 `sources:` 의무, 수치·결정 인용 앵커 링크, 불일치 감지 시 자동 무효 플래그
- **hold 토픽 brief 재계산 동결로 부분 해소**

**🟡 RK-3 (moderate): owningTopicId Ace 과부하**
경계 케이스 Arki도 모호 인정. Ace 실시간 판정 부담.
- 완화: 판정 룰 1줄 — "agenda.md 스코프 충돌 시 새 토픽, 아니면 현 토픽"

**🟡 RK-4 (moderate): 이연 파이프라인 부재**
Master 제안 "Ace 이연 중재" 메커니즘 미명시.
- 완화: 세션 중 Ace 판정 즉시 pendingDeferrals에 PD-NNN append, /close 소급 불가

## 3. 공격 면제

A3 이중 성장축, A4 점진 이행, A8 토큰 비용 — 확신 없는 공격 제기하지 않음.

## 4. 데드락 없음

Nova 소집 신호 없음.
