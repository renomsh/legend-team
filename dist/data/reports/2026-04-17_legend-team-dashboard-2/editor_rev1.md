---
topic: legend-team-dashboard-2
session: session_029
date: 2026-04-17
roles: [ace, arki, editor]
decisions: []
status: completed
---

# Legend Team Dashboard #2 — 세션 기록

## 핵심 작업

session_028에서 구현된 대시보드가 CF Pages에 반영되지 않은 원인을 진단하고, 전면 배포 완료 + 추가 수정 4건을 처리했다.

---

## 1. 배포 갭 해소

### 원인 (Arki 진단)
- `app/dashboard-upgrade.html`, `app/dashboard-ops.html`, `memory/shared/dashboard_data.json`은 session_028에 커밋됐으나
- `dist/`에 반영되지 않아 CF Pages가 구버전 배포 중이었음
- `.gitignore`에 `dist/`가 있어 `git add dist/`가 차단됐고, `build.js`가 미실행 상태였음

### 수정
- `git add -f dist/` 강제 추가 후 빌드·push → CF Pages 배포 완료
- `.claude/settings.json` SessionEnd Hook: `session-end-tokens.js && npx ts-node scripts/compute-dashboard.ts && node scripts/build.js` (D-028 완전 이행)
- 전 페이지 nav: 홈→Home, 업그레이드 뷰→Upgrade, 과제 운영 뷰→Ops + Feedback 탭 추가
- `index.html`: DEV (Phase 5, 오렌지) 카드 추가
- `project_charter.json`: version 0.7.0 → 0.9.0

---

## 2. 추가 수정 (Master 요청)

| 항목 | 내용 |
|---|---|
| topic_index 상태 통일 | closed/in-progress 9건 → completed (topic_001~004, 020~025) |
| masterTurns 수정 | compute-dashboard.ts에서 token_log 우선 읽도록 수정. 기존 session_027 데이터에 masterTurns 없어 0 표시 — 다음 세션 종료부터 자동 수집 |
| Topics 섹션 개편 | 최신순 역순, 기본 10개, ▼ Show all / ▲ Show less 토글 |
| nav 영어 통일 | 전 페이지 nav 한글 제거 완료 |

---

## 3. 배포 결과

| URL | 상태 |
|---|---|
| https://legend-team.pages.dev/ | ✅ Home — DEV 카드, 영어 nav, Topics 최신순 10개 |
| /dashboard-upgrade.html | ✅ Upgrade 뷰 — ECharts 3차트 |
| /dashboard-ops.html | ✅ Ops 뷰 — 지휘판·파이프라인·이연·세션·결정 |

---

## 4. 이연 항목

| ID | 내용 | 상태 |
|---|---|---|
| PD-006 | Hook Windows 경로 이스케이프 검증 | pending |
| PD-004 | 데이터북 Agent 프로토타입 | pending |
| PD-005 | Figma 연동 | pending |
