---
session: session_110
topic: topic_113
role: editor
rev: 1
date: 2026-04-26
status: completed
---

# 대시보드 정비 — session_110 산출물 요약

## 주요 변경 목록

### 1. CSS 단일화 (D-097)
- `app/css/components.css` §7~§10 신설
  - §7: nav 공통 (`.app`, `.sidebar`, `.brand`, `.nav-*`, `.sidebar-foot`)
  - §8: hero·pill·blip·spark (`.pill`, `.blip`, `.hero*`, `.h-eyebrow`, `.hm-*`, `.kpi-spark`)
  - §9: mini-panel 컴포넌트 (`.mini-row`, `.mini-panel`, `.mini-item*`, `.mini-stats`, `.mini-stat-*`)
  - §10: 페이지 레이아웃 (`.main`, `.s-main`, `.topbar`, `.topbar-right`, `.crumb`, `.s-crumb`, `.h1`, `.s-h1`)
- `app/css/style.css`: `system-ui` 제거 → Windows Arial fallback 통일
- `app/growth.html`, `people.html`, `session.html`, `decisions.html`, `feedback.html`, `deferrals.html`: inline `.s-main`/`.s-crumb`/`.s-h1` 일괄 제거

### 2. nav.js 단일 출처 topbar pills
- `app/js/nav.js`: `_renderTopbarPills()` 추가 — 모든 페이지 `.topbar-right` 자동 주입
- session ID max, topic ID max, build date → ID 기준 통일 (109 / 113 / 날짜)
- `#buildTs` sidebar 하단도 단일 출처로 채움

### 3. Home (index.html) 전면 개편
- H1: "Dashboard" → "Legend Team"
- Hero section: ECharts token usage bar chart (last 14 sessions), KPI = topic ID max (113)
- 4 hub-cards: 이모지 제거, `--hub-bg:#1d1733` 단색, raised box-shadow
- 3 mini-panels: Recent Activity / Pending Deferrals / Cost & Tokens
- Role monogram section: A/Ar/F/R/D/E/V/N (8 역할)
- 버그 수정: ECharts `axisLabel:{show:false}`만 적용, `setTimeout 200ms` 초기화, `slice(-5)→slice(0,5)`

### 4. dashboard-upgrade.html 정리
- inline CSS 전부 제거 → components.css 위임
- heroNum: session ID max (109) 기준
- decisions: `globalMetrics.totalDecisions` 단일 출처 (100건)
- hero-meta mDec/mCache/mSize: applyFilter() 동기화

### 5. dashboard-ops.html 전면 재정의
- O1 System Health 5 KPI: Build Freshness / Hook Success% / Open Alarms / Open Evidence / Avg Cost
- O2 Suspended Topics (topic_index filter)
- O3 Active Alarms
- O4 Recent Hook Events (hook-diagnostics.log)
- 구 중복 섹션 제거

### 6. System 페이지 삭제
- `app/partials/sidebar.html`: System 메뉴 항목 제거
- `app/system.html` 삭제 완료

### 7. data-loader.js 확장
- `getSessionIndex()`, `getTokenLog()`, `getSystemState()` 3개 메서드 추가

## 미완료 / 다음 세션
- session.html: ops O3 Recent Sessions 테이블 디자인 적용 (Master 지시)
- decisions.html, feedback.html, deferrals.html, people.html, growth.html, topic.html: 개별 검토
- version bump: v1.65 → 세션 완료 후 일괄
- Hook Success rate 개선: FIRED→FALLBACK 시퀀스를 1 success로 카운트
