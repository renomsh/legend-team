---
role: ace
session: session_080
topic: fin-overhead-reaudit-d060
date: 2026-04-22
rev: 1
---

## Ace — 프레이밍 + 종합검토

### Step 0. 토픽 생명주기
- topicType: `standalone` (단발 운영 gate 감사, 구현 결과 child 토픽 불필요)
- parentTopicId: topic_083 참조 (D-060 원 결정 오너)
- 타이밍: D-060 Phase 4(10세션 후) 아닌 G1 gate 감사로 해석

### 핵심 질문
Phase 1 MVP 구현 이후, D-060 성장지표 계측 시스템의 측정 오버헤드가 Phase 2 진입을 정당화하는가?

### 결정 축
- A1: Phase 2 Gate 판정 → **Go (조건부)**
- A2: Null 허용 기준 → Phase 구분 기반 설정
- A3: Registry 조정 → Phase 2 미구현 7개 draft 전환
- A4: Hook 빈도 → 현행(매 세션) 유지

### 종합검토
- Fin 감사: Phase 1 성공률 3/4 (L3.autonomy 버그 제외). Phase 2 7개 active가 null noise 주범.
- R-1(proxy 오염): 수용. Board UI 미구현 상태라 현 시점 무해. proxyMode 레이블은 Board 구현 시 처리.
- R-2(pendingLag draft 재계산): 실제 버그. 1줄 수정으로 즉시 해소.
- **Gate 판정: Phase 2 Go.** D-061 확정.
