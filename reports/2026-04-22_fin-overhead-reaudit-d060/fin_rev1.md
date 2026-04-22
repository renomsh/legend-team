---
role: fin
session: session_080
topic: fin-overhead-reaudit-d060
date: 2026-04-22
rev: 1
---

## Fin — 측정 오버헤드 감사

### Phase 1 지표 성공률
| 지표 | nonNull | 판정 |
|---|---|---|
| L1.cumulativeLearning | 100% | ✅ |
| L3.autonomy | 0% → 95% (수정 후) | 🔴→✅ |
| dev.firstPassRate | 76% | ✅ |
| nova.promotionRate | 83% | ✅ |

Phase 1 성공률: 수정 전 3/4 (75%), 수정 후 4/4 (100%)

### Phase 2 지표 오버헤드
7개 active지만 null만 생성 → 전체 nonNull 37% 위장. draft 전환 권고.

### 오버헤드 진단
- compute-growth.ts 690줄 / activeMetrics 11개 → 수정 후 4개
- hook 실행 비용: 상수, 수 ms 수준. 병목 아님
- 진짜 부담: 불필요 null 누적 + 유지보수 혼선

### Gate 판정
A1: Phase 2 조건부 Go (L3.autonomy 버그 선수정 후)
A2: Phase 1 active ≥70% nonNull 기준 설정
A3: 7개 draft 전환 권고
A4: 매 세션 hook 유지

### 비재무적 가치
L1.cumulativeLearning 100% 작동 = 80세션 역할 학습량 최초 수치화.
L3.autonomy 복구 = N4 자율성 진척 관측 수단 복원.
