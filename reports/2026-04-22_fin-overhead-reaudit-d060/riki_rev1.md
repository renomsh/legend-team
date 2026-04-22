---
role: riki
session: session_080
topic: fin-overhead-reaudit-d060
date: 2026-04-22
rev: 1
---

## Riki — 리스크 검토

### R-1. L3.autonomy proxy 의미론적 오염 🔴 (수용)
proxy 공식 `1 - masterTurns/agentTurns`는 "참여 빈도 역수"이지 D-060 원 공식(지시 비율)이 아님.
- 세션 A: Master 10회 전부 탐색 → D-060=1.00 / proxy=0.87
- 세션 B: Master 3회 전부 지시 → D-060=0.00 / proxy=0.97

**수용 조건:** Board UI에서 `(proxy)` 레이블 또는 색상 구분 필수. Phase 2 교체 시 regime marker로 불연속 표시.

### R-2. draft 전환 후 pendingLag 재계산 허점 🟡 (수정 완료)
`resolvePendingLag`가 draft 지표도 만기 시 재계산 시도.
- arki.structuralLifespan draft 전환 후 pendingLag 10건 잔존
- 수정: `def.status === 'active'` 필터 1줄 추가로 해소
