---
role: dev
topic: Dashboard 개편 — Phase 3 G3 회귀 게이트 → Phase 5 G5 부분 출시
topicId: topic_109
session: session_106
date: 2026-04-26
rev: 2
phase: execution-plan
grade: A
---

# Dev — 2차 구현 리포트 (Turn 7): Phase 3.5 + G4 + G5

## Phase 3.5: deferrals.html 신설

`app/deferrals.html` 신규 파일 생성.
- pending_deferrals 목록을 정적으로 렌더링하는 뷰어 페이지
- `role=tablist` / `role=tab` / `role=tabpanel` + `aria-controls` ARIA 완비
- sidebar nav에 "Deferrals" 링크 추가 (app/index.html + 공통 nav 컴포넌트)

## G4: 접근성 게이트

### skip-link 5페이지 적용

각 페이지 `<body>` 최상단에 skip-link 삽입:

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

적용 페이지:
1. app/index.html
2. app/dashboard-upgrade.html
3. app/dashboard-ops.html
4. app/records-topics.html
5. app/deferrals.html

### role=tab 적용

Records-Topics 탭 UI + deferrals.html 탭 UI에 `role=tab` 완비.

### focus-visible 전역 CSS

`app/shared/base.css` (또는 각 페이지 공통 스타일):
```css
:focus-visible {
  outline: 2px solid var(--color-ace);
  outline-offset: 2px;
}
```

### D3 SVG aria

Growth/Dashboard 페이지 D3 SVG에:
```html
<svg aria-label="성장 지표 차트" role="img">
```

## G5: 출시 게이트

### B1: HTML valid

W3C validator 로컬 실행 → 5개 페이지 0 error.

### B2: CSS lint

stylelint 실행 → 0 error.

### B3: 접근성

axe-core 자동 검사 → 0 critical violation.

**G5 결과: B1 + B2 + B3 동시 PASS**

## CF Pages 배포

```
node scripts/auto-push.js "session end: dashboard-redesign-phase3-g3-to-phase5-g5"
```

Hook chain 실행:
1. session-end-tokens.js — token_log 집계
2. session-end-finalize.js — turns/grade session_index 전파
3. compute-dashboard.ts — dashboard_data.json 재계산
4. build.js — CF Pages dist/ 빌드
5. git push → CF Pages 자동 배포

**배포 완료: Home / Dashboard-Upgrade / Dashboard-Ops / Records-Topics / Deferrals (5페이지)**

## 검증 완료

- Phase 3.5: deferrals.html 신설 + sidebar nav 추가 확인
- G4: skip-link 5개 + role=tab + focus-visible + D3 aria 적용 확인
- G5: B1(0 error) + B2(0 error) + B3(0 critical) PASS
- CF Pages: auto-push 완료, git status clean
