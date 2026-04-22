---
role: ace
session: session_075
topic: 알람 원인 분석 및 해결
date: 2026-04-22
phase: framing
---

## Ace 프레이밍 — 알람 원인 분석 및 해결

### Step 0. 토픽 생명주기 판정
- topicType: standalone
- parentTopicId: 없음

### 1. 핵심 질문
compute-dashboard가 생성하는 29개 경보 중 어떤 것이 실제 신호이고, 어떤 것이 노이즈인가.

### 2. 현황 (실측)
- R1 역할 과호출 9건: rolesRecalled >= 2 → Grade A/S 정상 오케스트레이션도 포함
- R2 Master 병목 11건: masterTurns > avg×1.5, avg=16.8 → 경보 70%가 session_017~034 (오래된 세션)
- R5 피드백 재발 9건: Ace/Master/역할 등 도메인 메타어가 stop words 없이 경보 유발

### 3. 결정 축
- 축 A (R1): Grade 조건부 임계값 (A/S:≥5, B/C:≥3)
- 축 B (R2): 삭제 — masterTurns 단독으로 병목/깊은논의 구분 불가
- 축 C (R5): alarms에서 삭제 — feedbackRecurrences 배열로 별도 보존

### 4. 핵심 전제
- 🔴 rolesRecalled 값이 session_index에 정확히 기록되어야 R1 재조정 유효
- 🔴 extractKeywords가 도메인 stop words 없이 동작 중 (→ 실측 반증: 조사 stop words 이미 존재, 누락은 도메인 메타어)

### 5. executionPlanMode: conditional

### 6. 종합검토 결론
- R1: Grade 조건부 임계값 채택 (Arki 권고, Riki 이상 없음 확인)
- R2: 삭제 (Master 확인 — masterTurns는 KPI 패널에서 계속 관찰 가능)
- R5: alarms 제거, feedbackRecurrences 보존 (Master 확인)
- 목표 29건 → 1건 달성
