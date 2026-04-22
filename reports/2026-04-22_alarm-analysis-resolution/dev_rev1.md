---
role: dev
session: session_075
topic: 알람 원인 분석 및 해결
date: 2026-04-22
phase: implementation
---

## Dev 구현 — compute-dashboard.ts 경보 규칙 수정

### 변경 내용 (scripts/compute-dashboard.ts)

**R1 (역할 과호출):**
- 기존: `rolesRecalled >= 2` (Grade-blind)
- 변경: Grade A/S → `>= 5`, Grade B/C → `>= 3`
- `r1Threshold(grade)` 헬퍼 함수 추가

**R2 (Master 병목):**
- 삭제: masterTurns 단독으로 병목/깊은논의 구분 불가
- masterTurns KPI 패널은 대시보드에서 계속 표시됨

**R5 (피드백 재발):**
- alarms[] 에서 R5 push 로직 삭제
- feedbackRecurrences 배열은 대시보드 별도 시각화용으로 보존

### 검증
- npx ts-node scripts/compute-dashboard.ts 실행
- 결과: 73개 세션, **1개 경보** (session_045, R1, Grade S, rolesRecalled=5)
- 29개 → 1개 (실제 이상 신호 1건 유지)
