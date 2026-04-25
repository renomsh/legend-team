---
deliverable: G2-spec-1
artifact: components-spec
topic: Dashboard 개편 — UX + 반응형 (Phase 2)
topicId: topic_082
session: session_105
date: 2026-04-25
phase: phase-2-spec-lock
grade: A
turnId: 1
invocationMode: subagent
status: locked-for-dev
sources:
  - reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md (D-098)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/responsive-policy.md §3·§4 (G0-6)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/token-axes-spec.md (D-091·D-097)
  - app/css/tokens.css
parent_spec: reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md
---

# G2-spec-1 components-spec — helper class 5종 + drawer mobile CSS 동결 spec

Arki입니다. 본 문서는 Phase 2 G2 게이트 1·2 산출물의 **단일 출처**입니다. responsive-policy(G0-6) §4-1 helper class skeleton과 §3-1 drawer mobile CSS skeleton을 Dev 실 작성 가능한 declaration 수준으로 정밀화합니다.

옵션 탐색 0 — D-098 단일 출처 정합. spec 재해석 권한 없음.

---

## 1. helper class 5종 정의 (`app/css/components.css`)

### 1-1. 명명·purpose 매트릭스

| # | class | purpose | 적용 페이지 (G2 baseline 6) | 적용 페이지 (Phase 4 신설 5) | 토큰 의존 |
|---|---|---|---|---|---|
| 1 | `.title-1l` | 카드/패널 title 1-line ellipsis. helper 미적용 시 한국어 wrap → 카드 높이 drift → bbox tolerance 초과 | Home·Upgrade·Ops·Topics·Growth·People | Sessions·Decisions·Feedback·Deferrals·System | — |
| 2 | `.kr-text` | 본문 한국어 줄바꿈 — `keep-all` + `overflow-wrap: anywhere` 결합. URL/숫자만 강제 줄바꿈 | Home(hero meta·card body)·Upgrade(filter label)·Topics(card body)·Growth(panel body)·People(role bio) | Sessions·Decisions·Feedback·Deferrals(PD body)·System | — |
| 3 | `.kpi-num` | KPI 큰 숫자 — `tabular-nums` + `--fs-display` + `--lh-tight` + `--ls-display`. 1024~1280 fallback에서 자릿수 너비 일정 | Home(hero KPI 3)·Upgrade(KPI 4)·Ops(KPI 5~6)·Growth(3축 KPI) | Sessions(KPI bar)·Deferrals(count) | `--fs-display`·`--lh-tight`·`--ls-display` (tokens.css §typography) |
| 4 | `.chip-row` | 가로 chip nav — `flex-wrap: nowrap` + `overflow-x: auto` + 우측 mask fade | Home(recent topic chip)·Topics(session chip row) | Sessions(turn chip)·Feedback(tag chip) | — |
| 5 | `.table-scroll` | 표 가로 스크롤 wrapper — `min-width: 560px` 강제, `overflow-x: auto` | Ops(metric table)·Topics(decision row table) | Sessions(turn table)·Decisions(decision table)·System(scripts table) | — |

**Vera 디자인 재해석 권한 없음** (D-098 §6-2). 토큰 변경 시 token-axes-spec.md 갱신 + Vera 의무 재호출.

### 1-2. CSS 의사코드 (실 declaration 수준)

```css
/* app/css/components.css — Phase 2 G2 박제 */
/* 의존: app/css/tokens.css (D-091 단일 출처), :root{} 재정의 0 (lint-inline-root-color) */

/* 1. .title-1l — 1-line ellipsis */
.title-1l {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;            /* flex 부모에서 ellipsis 작동 보장 */
}

/* 2. .kr-text — 한국어 줄바꿈 */
.kr-text {
  word-break: keep-all;
  overflow-wrap: anywhere; /* URL/긴 영숫자만 강제 줄바꿈 */
}

/* 3. .kpi-num — KPI 큰 숫자 */
.kpi-num {
  font-variant-numeric: tabular-nums;
  font-size: var(--fs-display);     /* desktop 48px / mobile 36px (token swap) */
  line-height: var(--lh-tight);
  letter-spacing: var(--ls-display);
  font-feature-settings: 'tnum' 1;  /* fallback for older WebKit */
}

/* 4. .chip-row — 가로 chip nav */
.chip-row {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;            /* Firefox */
  mask-image: linear-gradient(to right, #000 92%, transparent);
}
.chip-row::-webkit-scrollbar { display: none; }  /* WebKit */

/* 5. .table-scroll — 표 가로 스크롤 wrapper */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.table-scroll > table {
  min-width: 560px;                 /* PD 80% 본문 표 최소폭 */
  width: 100%;
  border-collapse: collapse;
}
```

### 1-3. lint 정합

| lint | 검증 대상 | helper class 영향 |
|---|---|---|
| `lint-inline-root-color.ts` | components.css `:root{}` 재정의 0건 | 본 spec `:root{}` 0 declaration ✓ |
| `lint-contrast.ts` | 본 helper에 color 선언 0건 (구조만 담당) | color 의존 0 ✓ |
| `lint-accent-only.ts` | `--c-dev`·`--c-ace` 본문 color 사용 0건 | color 의존 0 ✓ |

---

## 2. drawer mobile CSS spec (`app/css/components.css` 하단)

### 2-1. 구조 정의

| 요소 | role | desktop (≥1024) | mobile (<1024) |
|---|---|---|---|
| `.sidebar` | 6 카테고리 nav 컨테이너 | sticky 220px width | fixed off-canvas 280px width, `transform: translateX(-100%)` 기본 |
| `.sidebar[data-open="true"]` | 열린 상태 | n/a (1024+ display none) | `transform: translateX(0)` |
| `.sidebar-backdrop` | dim layer | display: none | `position: fixed` 전면, opacity 0~1 transition |
| `.hamburger` | open trigger | display: none | fixed top-left 40×40, padding 8px (tap target ≥48) |

### 2-2. CSS 의사코드 (실 declaration)

```css
/* drawer mobile — responsive-policy §3-1 carry, declaration 수준 정밀화 */

/* 데스크톱 기본 (≥1024 정합) */
.sidebar {
  position: sticky;
  top: 0;
  width: var(--sidebar-w, 220px);
  height: 100vh;
  z-index: var(--z-sticky);
  background: var(--panel);
}
.sidebar-backdrop { display: none; }
.hamburger { display: none; }

/* 모바일 분기 (D-095 단일 분기 1024) */
@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: 280px;
    transform: translateX(-100%);
    transition: transform var(--t-base) var(--ease-std);
    z-index: var(--z-drawer);
    box-shadow: var(--shadow-2);
  }
  .sidebar[data-open="true"] {
    transform: translateX(0);
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--t-base) var(--ease-std);
    z-index: var(--z-backdrop);
  }
  .sidebar-backdrop[data-open="true"] {
    opacity: 1;
    pointer-events: auto;
  }

  .hamburger {
    display: block;
    position: fixed;
    top: 16px;
    left: 16px;
    width: 40px;
    height: 40px;
    padding: 8px;            /* tap target 40+8 = 48 ✓ WCAG SC 2.5.5 */
    z-index: var(--z-hamburger);
    background: var(--panel);
    border-radius: var(--r-2);
  }
}

/* prefers-reduced-motion 정합 (R-1 mitigation 일부) */
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar-backdrop {
    transition: none !important;
  }
}
```

### 2-3. 토큰 의존 (tokens.css §motion·§z-index 정합)

| 토큰 | 용도 | 출처 (token-axes-spec) |
|---|---|---|
| `--t-base` | drawer slide-in 시간 | §motion (200ms 권장) |
| `--ease-std` | easing curve | §motion (cubic-bezier 표준) |
| `--z-drawer` | drawer stack | §z-index (700 등급) |
| `--z-backdrop` | backdrop stack | §z-index (600 등급, drawer 밑) |
| `--z-sticky` | desktop sticky sidebar | tokens.css §z-index (10) |
| `--z-hamburger` | trigger button | §z-index (800 등급, drawer 위) |
| `--panel` | sidebar 배경 (desktop sticky 동일 등급 surface) | tokens.css §panel |
| `--shadow-2` | drawer 우측 그림자 (mobile drawer 등급 적합) | tokens.css §shadow |
| `--r-2` | hamburger 모서리 (8px nav-item 등급) | tokens.css §radius |
| `--sidebar-w` | desktop sidebar width | §spacing 11 (220px) |

**토큰 누락 발견 시**: tokens.css 갱신은 Vera 의무 재호출 트리거 (D-098 §6-2). Dev 자체 정의 금지.

### 2-4. focus trap·a11y 셀렉터 (Dev JS 박제 인계 — `app/js/nav.js`)

CSS 단독으로 focus trap 불가 — JS 협조 필요. 본 spec은 셀렉터·계약만 박제, 동작은 nav.js 책임.

| 셀렉터 | JS 계약 |
|---|---|
| `.sidebar[data-open="true"] [data-nav-first]` | drawer open 시 focus 이동 첫 위치 |
| `.sidebar[data-open="true"] [data-nav-last]` | Tab cycle 마지막 위치 → 다음 Tab은 first로 |
| `.sidebar[role="navigation"][aria-label="주요 메뉴"]` | screen reader 라벨 |
| `.sidebar-backdrop[role="presentation"]` | a11y 트리에서 제외 |
| `.hamburger[aria-controls="sidebar"][aria-expanded]` | open/close 상태 sync |

### 2-5. open trigger 매트릭스 (responsive-policy §6-2 carry)

| trigger | 동작 |
|---|---|
| hamburger click | `data-open="true"` 양 요소 |
| Esc key | `data-open="false"` + focus → hamburger |
| backdrop click | `data-open="false"` |
| nav-item click (drawer 내부) | navigate + `data-open="false"` (defer 50ms로 transition 자연 종료) |
| viewport resize ≥1024 | force close + sticky 모드 전환 |

---

## 3. 의존 그래프 (본 spec 내부)

```
tokens.css (D-091 canonical)
  └── components.css §1 helper class 5종
        ├── .kpi-num → --fs-display, --lh-tight, --ls-display
        └── (나머지 4종 토큰 의존 0)
  └── components.css §2 drawer mobile
        ├── --t-base, --ease-std (motion)
        ├── --z-drawer, --z-backdrop, --z-sticky, --z-hamburger (z-index)
        ├── --panel, --shadow-2 (색·shadow)
        └── --r-2, --sidebar-w (radius·spacing)
  └── responsive-policy.md §4 (text-overflow 7 규칙)
        └── helper class 5종 → §1
```

**파일 import 순서** (Phase 1 G1 산출 정합): `tokens.css` → `components.css`. components.css가 먼저 로드되면 토큰 미정의로 모든 declaration fail.

---

## 4. 검증 체크리스트 (Phase 2 G2 게이트 1·2 정합)

| # | 검증 | 방법 | 게이트 |
|---|---|---|---|
| 1 | helper class 5종 모두 실 declaration (skeleton 0) | `grep -c "^\\." app/css/components.css` ≥ 5 + 각 class에 declaration ≥ 1 | G2-1 |
| 2 | components.css `:root{}` 재정의 0 | `lint-inline-root-color.ts components.css` PASS | G2-1 |
| 3 | drawer mobile CSS — 1024 미만 slide-in | Playwright e2e: viewport 375에서 hamburger click → `transform: translateX(0)` 확인 | G2-2 |
| 4 | focus trap 셀렉터 박제 | `grep "data-nav-first\|data-nav-last" app/css/components.css` 또는 nav.js JS sync | G2-2 |
| 5 | backdrop opacity·z-index 정합 | computed style 검사: `--z-backdrop < --z-drawer < --z-hamburger` | G2-2 |
| 6 | tap target ≥48px | manual: hamburger boundingBox().width + padding ≥ 48 | G2-2 |
| 7 | prefers-reduced-motion 정합 | DevTools rendering panel에서 reduced-motion ON → transition 0 확인 | G2-2 |

---

## 5. 롤백 트리거

| trigger | 처리 |
|---|---|
| helper class declaration이 spec 1-2와 다름 (Vera 자체 디자인 변경) | Phase 2 정지 + Vera 재호출 + spec drift 박제 (D-098 §6-2) |
| drawer transition 1024 분기에서 sticky 전환 실패 | responsive-policy §3-1 컴파일 검증 + Dev 재구현 |
| 토큰 누락 (예: `--shadow-2` undefined) | Phase 2 정지 + token-axes-spec 갱신 + Vera 재호출 |
| focus trap 미구현 (JS 미박제) | nav.js 박제 의무 (Phase 1 G1 잔여) — Dev 인계 |

---

## 6. 중단 조건

다음 발견 시 Phase 2 즉시 정지, Master 통지:

- helper class 적용으로 기존 페이지 6건 중 ≥3 페이지 layout 깨짐 (회귀)
- drawer mobile transition으로 chrome rendering jank ≥16ms (60fps 미달)
- 토큰 의존이 token-axes-spec.md에 박제된 토큰 외 등장 (spec drift)

---

## 7. lock 선언

본 components-spec = helper class 5종 declaration + drawer mobile CSS declaration + 토큰 의존 매트릭스 + a11y 셀렉터 + 검증 체크리스트 + 롤백 트리거 + 중단 조건. Phase 2 G2 게이트 1·2 단일 출처. Dev 인계 직전 동결.

다음 spec: `vr-infra-spec.md` (G2 게이트 3·6·7 단일 출처).
