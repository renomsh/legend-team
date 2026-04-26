---
role: editor
session: session_111
topic: dashboard-maintenance-remaining-pages
date: 2026-04-26
rev: 1
---

# 세션 산출물 — dashboard-maintenance-remaining-pages

## 완료 작업 (G0~G5 전체)

### G0: .card 3중 정의 → 단일화
- `style.css`: `.card` + `.card:hover` + `.card-accent` 블록 삭제
- `components.css §6`: `.card-sub` 추가 (growth.html 유일 사용 클래스)
- `growth.html`: 인라인 `.card`/`.card-h`/`.card-title`/`.card-sub` 4줄 제거
- `people.html`: `.card` base 제거 → `position:relative;transition` 추가 속성만 유지
- `session.html`: `.card` border 제거 → bg/radius/padding override 유지 (--panel-2 의도적)

### G1: decisions + feedback inline `<style>` 제거
- `decisions.html`: sidebar/nav CSS 11줄 블록 제거 (components.css §7~§8 중복)
- `feedback.html`: 동일 블록 제거

### G2: 공통 유틸 → components.css
- `components.css §13`: `.badge` + `.badge.ok/warn/bad/baseline` 추가
- `components.css §14`: `.table` + `.table th/td/td.num` 추가
- `growth.html`: badge 5줄 + table 4줄 제거
- `people.html`: badge 5줄 제거

### G3: deferrals / people / topic 정리
- `components.css §11`: `.tab-bar`/`.tab-btn`/`.tab-btn:hover` 추가 (session+topic 공유)
- `deferrals.html`: sidebar/nav 중복 + media .app 쿼리 제거
- `people.html`: body/app/sidebar/nav-item/nav-group 6줄 + table 4줄 제거
- `topic.html`: sidebar/nav 중복 + tab-bar base 제거 → `.tab-btn.active` 색만 유지

### G4: session.html 정리
- `session.html`: sidebar/nav 중복 9줄 제거

### G5: Version bump
- `system_state.json`: v1.65 → v1.75
- `project_charter.json`: v1.65 → v1.75
- `node scripts/build.js` 실행 → dist/ 갱신

## 검증 결과

| 페이지 | 검증 방법 | 결과 |
|---|---|---|
| decisions.html | preview_snapshot | ✅ nav + 100 decisions |
| feedback.html | preview_snapshot | ✅ nav + 111 entries |
| growth.html | preview_snapshot | ✅ 3축 + panel + table |
| deferrals.html | preview_snapshot | ✅ nav + chip + D3 + 47 PD |
| people.html | preview_eval | ✅ nav + 8 cards |
| topic.html | preview_eval | ✅ nav + 3 tabs |
| session.html | preview_eval | ✅ nav + 2 tabs + 108 hist |
| version | preview_eval | ✅ v1.75 표시 확인 |

## CSS 단일 출처 현황 (세션 후)

| 클래스 | 출처 |
|---|---|
| `.card` | components.css §6 |
| `.tab-bar`/`.tab-btn` | components.css §11 |
| `.badge` | components.css §13 |
| `.table` | components.css §14 |
| `.card-h`/`.card-title`/`.card-sub` | components.css §6 |
| sidebar/nav | components.css §7~§8 |
