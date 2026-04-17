---
topic: legend-team-dashboard
session: session_028
date: 2026-04-17
roles: [ace, arki, fin, riki, dev, editor]
decisions: [D-027, D-028]
status: completed
---

# legend-team Dash board — 구현 완료 보고서

## 핵심 결론

D-025 설계(session_027)의 구조적 공백을 해소하고, 대시보드 2뷰를 실제 구현하였다.
`축 A`(자동 탐지 로직), `축 B`(Size 공식 검증), `축 C`(차트 구조)를 모두 확정·구현하였다.

---

## 1. 결정 사항

### D-027 — Size 공식 masterTurns 제거
```
Size = (decisionAxes × 2) + rolesCalled + (rolesRecalled × 2) + (sessionsSpanned × 3)
```
- masterTurns 제거 — 복잡도(Size)와 자율성(masterTurns) 개념 분리
- 버블 차트 색상: masterTurns 독립 변수 유지

### D-028 — compute-dashboard.ts Hook 자동 실행
- SessionEnd Hook: `session-end-tokens.js` → `compute-dashboard.ts` 순차 실행
- dashboard_data.json 항상 최신 상태 유지

---

## 2. 구현 산출물

| 파일 | 역할 |
|---|---|
| `scripts/append-session.ts` | session_index.json 전용 append 스크립트 (Edit 도구 금지) |
| `scripts/compute-dashboard.ts` | 대시보드 지표 계산 (D-027 Size 공식 적용) |
| `memory/sessions/proposal_log.json` | 역할별 제안 + 채택 레이블 스키마 (session_028+) |
| `memory/shared/dashboard_data.json` | 28개 세션 지표 계산 결과 |
| `app/dashboard-upgrade.html` | 업그레이드 뷰 (버블·꺾은선·막대 ECharts, 슬라이더 필터) |
| `app/dashboard-ops.html` | 과제 운영 뷰 (지휘판·파이프라인·이연·세션·결정) |
| `.claude/settings.json` | SessionEnd Hook에 compute-dashboard.ts 추가 |
| `CLAUDE.md` | session_index.json 직접 수정 금지 규칙 추가 |

---

## 3. 구조적 수정

### session_index.json JSON 오류 수정
- session_026이 sessions 배열 밖으로 이탈된 구조 오류 수정
- session_027 누락 항목 추가
- `append-session.ts`로 향후 오류 원천 차단

### decision_ledger.json 쉼표 누락 수정
- D-026 ↔ D-027 사이 쉼표 누락 → 수정

---

## 4. 대시보드 설계 확정

### 업그레이드 뷰 (dashboard-upgrade.html)
- **필터 바**: 슬라이더(최근 N개 세션, 기본 28) + 날짜 범위 (기간 or 세션수)
- **자율성 카드**: masterTurns 평균, 데이터 있는 세션 기준
- **U1 버블 차트**: X=Size, Y=채택률, 버블크기=토큰, 색상=masterTurns
- **U1 꺾은선**: masterTurns 추세, 점선/회색(수기) vs 실선/파랑(자동), 전체 평균선
- **U1 막대**: Size 분포, 토픽 타입 색상 구분
- **데이터 신뢰성 계층**: session_027 이전=점선/연색, 이후=실선/진한색

### 과제 운영 뷰 (dashboard-ops.html)
- **O1 지휘판**: 경보 수·오픈 토픽·이연 항목·총 결정 카드
- **O2 파이프라인**: in-progress·suspended 토픽 + 최근 완료 5건
- **O4 이연 항목**: pendingDeferrals 전체, 상태 배지
- **O3 최근 세션**: 최근 15개 세션 테이블 (역순)
- **O4 최근 결정**: 최근 10개 decision_ledger 항목

---

## 5. 현재 지표 (dashboard_data.json 기준)

| 항목 | 값 |
|---|---|
| 총 세션 | 28개 |
| 총 결정 | 28개 (D-001~D-028) |
| 캐시 히트율 (auto 구간) | 94.47% |
| 경보 | 0개 |
| 피드백 재발 패턴 | 7개 |

---

## 6. Master 피드백 (session_028)

- **MF-010**: Ace는 경로 선택 위임이 아닌 **안을 제시하고 Master가 수정하는 구조**여야 한다.
  - "어느 경로로 갈까요?" 형식 금지
  - 구체 설계안 제시 후 Master가 수정하는 방식으로 전환

---

## 7. 이연 항목

| ID | 내용 |
|---|---|
| PD-006 | Hook Windows 경로 이스케이프 검증 (이번 세션 Hook 발동으로 검증 예정) |
| PD-004 | 데이터북 Agent 프로토타입 (다음 주) |
| PD-005 | Figma 연동 |
