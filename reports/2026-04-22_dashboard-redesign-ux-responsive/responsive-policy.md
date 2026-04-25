---
deliverable: G0-6
artifact: responsive-policy
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
phase: phase-0-execution
grade: S
turnId: 11
invocationMode: subagent
raterId: vera
recallReason: phase-0-execution
status: locked-for-dev
---

# G0-6 responsive-policy — 1024 단일 분기 반응형 정책

Vera입니다. 본 문서는 Master 박제 #11(D-095) "2축 단일 분기점 1024px"를 8 페이지 전체에 일관 적용하는 반응형 정책 단일 출처입니다. 옵션 비교는 vera_rev2에서 종결되었으므로 본 문서는 spec lock 형태로 박제합니다.

새 옵션 탐색 0. 단일 분기·단일 추천.

---

## 1. 단일 분기 정책

### 1-1. 분기점

```css
@media (max-width: 1023px) { /* mobile */ }
/* default = desktop ≥ 1024 */
```

- **breakpoint 토큰**: `--bp-mobile-max: 1023px` (tokens.css §6-1)
- **단일 분기** — 640·768·1440 다중 분기 폐기 (vera_rev2 §2-1 carry)
- **이유**: Master 박제 #11. 사이드바 220px + 메인 max 1440 + iPad Pro 가로 1024 정합점.

### 1-2. 8 페이지 적용

| # | 페이지 | 경로 | desktop | mobile |
|---|---|---|---|---|
| 1 | Home | `app/index.html` | sidebar + hero + 5 card grid + recent 2col | drawer + hero + card stack + recent stack |
| 2 | Dashboard/Upgrade | `app/dashboard-upgrade.html` | sidebar + 2tab + filter + KPI 4col + chart 2col | drawer + tab + filter + KPI stack + chart stack |
| 3 | Dashboard/Ops | `app/dashboard-ops.html` | sidebar + 2tab + KPI grid + chart | drawer + tab + KPI stack + chart |
| 4 | Growth | `app/growth.html` (신규) | sidebar + 3축 KPI + signature 4×2 | drawer + KPI stack + signature 1col |
| 5 | People | `app/people.html` (신규) | sidebar + role 4×2 | drawer + role 1col |
| 6 | Records (5 sub) | `app/records/{topics,sessions,decisions,feedback,deferrals}.html` | sidebar + 5 second-nav-tab + filter + 콘텐츠 | drawer + 5tab horizontal scroll + filter + 콘텐츠 stack |
| 7 | System | `app/system.html` (신규) | sidebar + system status panel | drawer + system status stack |

신규 8 페이지 = 1+2+1+1+5+1=11이 아니라 신규 페이지(growth·people·system + records 5sub) = 8건. 기존 active 9 페이지 중 일부는 records sub로 재배치.

---

## 2. 데스크톱 (≥1024) 레이아웃

### 2-1. 그리드 골격

```
┌─────────────────────────────────────────────────────────┐
│ .app { display:grid; grid-template-columns: 220px 1fr; } │
├─────────┬───────────────────────────────────────────────┤
│ sidebar │ main (max-width: 1440px, padding 28 36 64)    │
│ 220px   │   topbar / second-nav (sticky top:0)          │
│ fixed   │   content                                     │
│ sticky  │                                               │
└─────────┴───────────────────────────────────────────────┘
```

- **sidebar**: `width: 220px; position: sticky; top: 0; height: 100vh`
- **main**: `padding: 28px 36px 64px; max-width: 1440px` — viewport >1660 시 좌우 여백 발생, sidebar+main 합 max 1660px
- **second-nav-tab**: 페이지 내부 (사이드바 expand 아님) — arki rev3 §3-1 D-fb-2 박제

### 2-2. 고정 픽셀 보존 정책

**Master 원칙**: "데스크톱 기준 + 모바일 안 깨짐". 고정값은 그대로, 컨테이너만 fluid.

| 고정값 | 값 | 변경 금지 사유 |
|---|---|---|
| sidebar width | 220px | brand+nav-item label 가독 보장 (vera_rev2 §2-2) |
| KPI grid gap | 16px (`--sp-4`) | 4px base scale 정합 |
| card radius | 12px (`--r-3`) | hero 20·card 12·chip 6 위계 |
| card padding | 20px (`--sp-5`) | typography line-height 14×1.5=21 정합 |
| nav-item padding | 9px 10px | dashboard-upgrade carry |
| filter-bar padding | 12px 18px | dashboard-upgrade carry |

이 6 고정값은 모바일에서도 보존(`--sp-4`만 모바일 16 그대로, 컨테이너 padding만 줄임).

### 2-3. 카드 grid minmax 표준

V-5 박제(vera_rev2 §8-2): KPI grid `repeat(auto-fit, minmax(220px, 1fr))` — 1024~1280 자동 3col fallback.

| 페이지 | grid | gap | 분기 동작 |
|---|---|---|---|
| Home — Index card grid (5장, 5번째 col 1~2 span) | `grid-template-columns: repeat(3, 1fr)` | 20px | 1024+ 3col 고정 |
| Home — Recent band (Topics·Decisions) | `grid-template-columns: 1fr 1fr` | 20px | — |
| Dashboard/Upgrade — KPI | `repeat(auto-fit, minmax(220px, 1fr))` | 16px | 1024~1280 3col / 1280~1660 4col / ≥1660 4col(max) |
| Dashboard/Ops — KPI | `repeat(auto-fit, minmax(180px, 1fr))` | 16px | 더 좁은 KPI (Ops 표준 4~5col) |
| Dashboard/Upgrade·Ops — Chart | `grid-template-columns: 1fr 1fr` | 20px | 1024+ 2col 고정 |
| Growth — 3축 KPI | `grid-template-columns: repeat(3, 1fr)` | 20px | 3축 고정 |
| Growth — Signature 4×2 | `repeat(4, 1fr)` | 16px | 4×2 grid |
| People — Role 4×2 | `repeat(4, 1fr)` | 20px | 4×2 grid |
| Records/Topics — Topic card | `grid-template-columns: 1fr` (single column stacked) | 16px | 토픽 카드는 항상 1col stack(가로 정보량 많음) |
| Records/Deferrals — list+graph | `grid-template-columns: 60% 40%` | 20px | graph sticky top 28px height 560px |

KPI auto-fit `minmax(180px, 1fr)`은 Dashboard/Ops 5~6 KPI 노출용(Ops는 KPI 수 많음). Upgrade는 4 KPI 표준이라 220px.

---

## 3. 모바일 (<1024) 레이아웃

### 3-1. off-canvas drawer

vera_rev2 §2-2 그대로. drawer 280px + backdrop dim.

```css
.sidebar {
  position: fixed; inset: 0 auto 0 0;
  width: 280px; transform: translateX(-100%);
  transition: transform var(--t-base) var(--ease-std);
  z-index: var(--z-drawer);
}
.sidebar[data-open="true"] { transform: translateX(0); }
.sidebar-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  opacity: 0; pointer-events: none;
  transition: opacity var(--t-base);
  z-index: var(--z-backdrop);
}
.sidebar-backdrop[data-open="true"] {
  opacity: 1; pointer-events: auto;
}
.hamburger {
  position: fixed; top: 16px; left: 16px;
  width: 40px; height: 40px; padding: 8px;
  z-index: var(--z-hamburger);
}
@media (min-width: 1024px) {
  .hamburger { display: none; }
  .sidebar { position: sticky; transform: none; width: 220px; }
  .sidebar-backdrop { display: none; }
}
```

### 3-2. 모바일 main padding

- desktop: `padding: 28px 36px 64px`
- mobile: `padding: 56px 16px 56px` — top 56(hamburger 영역 회피) / left·right 16(=`--sp-4`)

### 3-3. 모바일 grid stack

| 영역 | mobile |
|---|---|
| KPI grid | `grid-template-columns: 1fr` |
| Index card grid (Home) | `grid-template-columns: 1fr` |
| Chart 2col | `grid-template-columns: 1fr` (stack) |
| Recent band | stack |
| Records/Deferrals list+graph | list stack 위 / graph 360h 아래 |
| Signature 4×2 | `grid-template-columns: 1fr` |
| Role 4×2 | `grid-template-columns: 1fr` |

모든 desktop multi-col grid가 mobile에서 `1fr` 1col로 stack. 가로 스크롤 0 (chip-row·표 wrapper만 예외).

### 3-4. 모바일 second-nav-tab 동작

```
Records 5tab desktop: [Topics][Sessions][Decisions][Feedback][Deferrals] (page 내부 가로 정렬)
Records 5tab mobile:  [Topics][Sessions][Decisions][Feedback][Deferrals] (overflow-x: auto + mask fade right)
```

5 sub 모두 `app/records/` 같은 폴더이므로 second-nav-tab은 5 파일 간 링크 (단순 a tag, no JS state).

---

## 4. 텍스트 깨짐 방지 7 규칙 (1024 분기 기준 재정렬)

vera_rev2 §2-3 carry. 본 G0-6에서 component·CSS 헬퍼 명시.

| # | 규칙 | mobile (<1024) | desktop (≥1024) | helper class |
|---|---|---|---|---|
| 1 | 카드 title 1-line | `text-overflow: ellipsis; white-space: nowrap; min-width: 0` | 동일 | `.title-1l` |
| 2 | 본문 줄바꿈 | `word-break: keep-all; overflow-wrap: anywhere` | 동일 | `.kr-text` |
| 3 | KPI 숫자 | `font-variant-numeric: tabular-nums; font-size: var(--fs-display)` (=36px mobile) | (=48px desktop) | `.kpi-num` |
| 4 | chip-row | `flex-wrap: nowrap; overflow-x: auto` + 우측 mask fade | 동일 (visible chip 더 많음) | `.chip-row` |
| 5 | 표 wrapper | `overflow-x: auto; min-width: 560px (table)` | 표 native 폭 | `.table-scroll` |
| 6 | 본문 최소 폰트 | 11px (eyebrow·meta까지). 본문 13px 이상 | 동일 | (token enforcement) |
| 7 | viewport 가로 스크롤 | 0 (chip-row·표 제외 컨테이너) | 0 | (lint review) |

**Master 정합**: "데스크톱 기준 + 모바일 안 깨짐(가로 스크롤·텍스트 잘림 0)" — 7 규칙 모두 차단으로 정렬.

### 4-1. helper class CSS skeleton

```css
.title-1l   { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.kr-text    { word-break: keep-all; overflow-wrap: anywhere; }
.kpi-num    { font-variant-numeric: tabular-nums; font-size: var(--fs-display); line-height: var(--lh-tight); letter-spacing: var(--ls-display); }
.chip-row   { display: flex; gap: 6px; flex-wrap: nowrap; overflow-x: auto; mask-image: linear-gradient(to right, #000 92%, transparent); }
.table-scroll { overflow-x: auto; }
.table-scroll > table { min-width: 560px; }
```

Phase 1 G1 진입 시 `app/css/components.css`(또는 tokens.css 하단)에 박제. Editor 인계.

---

## 5. 페이지별 wireframe (8 페이지)

### 5-1. Home (`app/index.html`)

```
< 1024 (mobile)                              ≥ 1024 (desktop)
┌─[☰]──────────────────┐                    ┌──────┬─────────────────────────────────┐
│ Hero band (96-h)     │                    │ side │ Hero band (120-h)                │
│ ● running            │                    │ 220  │ ● running   [104][87][92] meta   │
│ [104][87][92] 1col   │                    │ -px  ├──────────────────────────────────┤
├──────────────────────┤                    │ nav  │ Index cards 3col (5장, 5번째 span)│
│ Index cards 1col     │                    │      │ ┌─────┐┌─────┐┌─────┐            │
│ ┌─────┐              │                    │      │ │Dash ││Grow ││Peop │            │
│ │ ... │              │                    │      │ └─────┘└─────┘└─────┘            │
├──────────────────────┤                    │      │ ┌──────────┐┌─────┐              │
│ Recent stack         │                    │      │ │ Records  ││ Sys │              │
│ ┌─Topics─┐           │                    │      │ └──────────┘└─────┘              │
│ ┌─Decis──┐           │                    │      ├──────────────────────────────────┤
└──────────────────────┘                    │      │ Recent 2col (Topics | Decisions) │
                                            └──────┴──────────────────────────────────┘
```

### 5-2. Dashboard/Upgrade (`app/dashboard-upgrade.html`)

```
< 1024                                       ≥ 1024
┌─[☰]──────────────────┐                    ┌──────┬─────────────────────────────────┐
│ [Upgrade][Ops] tab   │                    │ side │ [Upgrade][Ops] second-nav-tab   │
├──────────────────────┤                    │ 220  ├──────────────────────────────────┤
│ filter-bar           │                    │      │ filter-bar (sticky top:0)        │
├──────────────────────┤                    │      ├──────────────────────────────────┤
│ KPI 1col (4 stack)   │                    │      │ KPI auto-fit 4col(≥1280) / 3col  │
├──────────────────────┤                    │      ├──────────────────────────────────┤
│ Chart 1col (stack)   │                    │      │ Chart 2col (1fr 1fr)             │
└──────────────────────┘                    └──────┴──────────────────────────────────┘
```

### 5-3. Dashboard/Ops (`app/dashboard-ops.html`)

```
< 1024                                       ≥ 1024
┌─[☰]──────────────────┐                    ┌──────┬─────────────────────────────────┐
│ [Upgrade][Ops] tab   │                    │ side │ [Upgrade][Ops] second-nav-tab   │
├──────────────────────┤                    │ 220  ├──────────────────────────────────┤
│ KPI 1col (5~6 stack) │                    │      │ KPI auto-fit 4~5col              │
├──────────────────────┤                    │      ├──────────────────────────────────┤
│ Chart 1col           │                    │      │ Chart 2col                       │
└──────────────────────┘                    └──────┴──────────────────────────────────┘
```

### 5-4. Growth (`app/growth.html`, 신규)

```
< 1024                                       ≥ 1024
┌─[☰]──────────────────┐                    ┌──────┬─────────────────────────────────┐
│ 3축 KPI 1col stack   │                    │ side │ 3축 KPI 3col                     │
├──────────────────────┤                    │ 220  ├──────────────────────────────────┤
│ Signature 1col stack │                    │      │ Signature 4×2 (4col × 2row)      │
│ ┌──[role-card]──┐    │                    │      │ ┌─Ace─┐┌─Arki─┐┌─Fin─┐┌─Riki─┐  │
│ │ Ace ...       │    │                    │      │ ┌─Nova┐┌─Dev──┐┌─Vera┐┌─Edi──┐  │
│ ...             │    │                    │      │                                  │
└──────────────────────┘                    └──────┴──────────────────────────────────┘
```

### 5-5. People (`app/people.html`, 신규)

```
< 1024                                       ≥ 1024
┌─[☰]──────────────────┐                    ┌──────┬─────────────────────────────────┐
│ Role card 1col stack │                    │ side │ Role card 4×2 (4col × 2row)     │
│ ┌──Ace──┐            │                    │ 220  │ ┌─Ace─┐┌─Arki─┐┌─Fin─┐┌─Riki─┐  │
│ ┌──Arki─┐            │                    │      │ ┌─Nova┐┌─Dev──┐┌─Vera┐┌─Edi──┐  │
│ ...                  │                    │      │                                  │
└──────────────────────┘                    └──────┴──────────────────────────────────┘
```

### 5-6. Records 5 sub — 단일 wireframe + 5 sub 차이

**공통 wireframe** (5 페이지 동일 골격):

```
< 1024                                       ≥ 1024
┌─[☰]──────────────────┐                    ┌──────┬─────────────────────────────────┐
│ [Top][Sess][Dec][Fb][Df] 5tab→             │ side │ [Topics][Sessions][Decisions]    │
│   (overflow-x scroll) │                    │ 220  │   [Feedback][Deferrals] 5tab    │
├──────────────────────┤                    │      ├──────────────────────────────────┤
│ filter-bar           │                    │      │ filter-bar (sticky)              │
├──────────────────────┤                    │      ├──────────────────────────────────┤
│ 콘텐츠 영역 (sub별)   │                    │      │ 콘텐츠 영역 (sub별)               │
└──────────────────────┘                    └──────┴──────────────────────────────────┘
```

**5 sub 콘텐츠 차이**:

| sub | desktop 콘텐츠 grid | mobile |
|---|---|---|
| `topics.html` | topic-card 1col stack(가로 정보량) | 동일 |
| `sessions.html` | 3탭(Sessions list / Turn Flow / Session Stats) — Turn Flow는 ECharts graph | tab horizontal scroll + ECharts mobile 1col |
| `decisions.html` | decision-card list (1col) | 동일 |
| `feedback.html` | feedback-card list (1col) | 동일 |
| `deferrals.html` | PD list 60% + dependsOn graph(ECharts) 40% sticky | PD list 위 + graph 360h 아래 |

### 5-7. System (`app/system.html`, 신규)

```
< 1024                                       ≥ 1024
┌─[☰]──────────────────┐                    ┌──────┬─────────────────────────────────┐
│ system status 1col   │                    │ side │ system status panel grid        │
│ - hooks status       │                    │ 220  │ ┌─hooks─┐┌─scripts─┐             │
│ - scripts status     │                    │      │ ┌─builds─┐┌─PD list─┐            │
│ - builds             │                    │      │                                  │
│ - PD list            │                    │      │                                  │
└──────────────────────┘                    └──────┴──────────────────────────────────┘
```

---

## 6. 모바일 사이드바 toggle 동작 spec

### 6-1. 상태

- `data-open="false"` (default) — drawer 화면 밖
- `data-open="true"` — drawer 노출 + backdrop active

### 6-2. open trigger

| trigger | 동작 |
|---|---|
| hamburger click | drawer + backdrop `data-open="true"` |
| Esc key | close |
| backdrop click | close |
| nav-item click (drawer 내부) | navigate + close (defer 50ms) |
| viewport resize ≥1024 | force close (drawer 자동 sticky 모드 전환) |

### 6-3. JS skeleton

`app/js/nav.js` 에 Phase 1 G1에서 박제. Dev 인수.

```js
// app/js/nav.js — drawer toggle (Phase 1 G1 박제)
export function openDrawer() {
  document.querySelector('.sidebar').dataset.open = 'true';
  document.querySelector('.sidebar-backdrop').dataset.open = 'true';
  document.body.style.overflow = 'hidden';
}
export function closeDrawer() {
  document.querySelector('.sidebar').dataset.open = 'false';
  document.querySelector('.sidebar-backdrop').dataset.open = 'false';
  document.body.style.overflow = '';
}
// Esc / backdrop / resize listeners
```

### 6-4. 접근성

- hamburger `aria-label="메뉴 열기"` / open 시 `aria-label="메뉴 닫기"`
- drawer `role="navigation" aria-label="주요 메뉴"`
- focus trap: drawer open 시 첫 nav-item에 focus
- keyboard: Tab cycle within drawer, Esc to close
- prefers-reduced-motion: `transition: none` 강제

---

## 7. 검증 항목 (Phase 1 G1 진입 시)

| # | 검증 | 도구 | 임계 |
|---|---|---|---|
| 1 | 8 페이지 mobile (<1024) 가로 스크롤 0 | Playwright manual + VR | 0 |
| 2 | 8 페이지 desktop (≥1024) sidebar 220px·main padding 28 36 일치 | VR bbox | ±1px |
| 3 | drawer 280px transform translateX 동작 | Playwright e2e | PASS |
| 4 | hamburger 40px tap target ≥44px(WCAG SC 2.5.5) | manual | 40+8 padding ≥48 통과 |
| 5 | typography 모바일 자동 swap (`--fs-display` 36px 적용) | VR | 36px |
| 6 | text-overflow 7 규칙 helper class 적용 | grep + visual | 0 미적용 |
| 7 | KPI auto-fit 1024~1280 3col fallback | VR baseline | 3col 캡처 |

---

## 8. self-audit (라운드 +1)

vera_rev2 대비 변경:

| # | 변경 |
|---|---|
| R-A | 8 페이지(system.html 포함)로 wireframe 확장. records 5sub 단일 wireframe + 차이 표로 압축 |
| R-B | KPI auto-fit minmax 페이지별 표준 표 박제 (Upgrade 220 / Ops 180) |
| R-C | helper class skeleton 박제 (`.title-1l`·`.kr-text`·`.kpi-num`·`.chip-row`·`.table-scroll`) |
| R-D | drawer JS skeleton + 접근성 spec 박제 |

신규 결함 자가 적출:

| # | 결함 | ROI | 대응 |
|---|---|---|---|
| R-G1 | records 5tab mobile horizontal scroll 시 어느 탭이 active인지 시각 단서 약함 | SHOULD | active tab에 `--alpha-2` bg + 1px solid `--c-ace` border (vera_rev1 §3-4 정합). spec §3-4에 흡수 |
| R-G2 | hamburger 40px이 WCAG 2.5.5 권고 44px 미달 — padding 8px 합산 시 48px tap area | NICE | tap area 48px 통과(시각 박스 40, hit area 48). 무대응 |
| R-G3 | Records/Deferrals desktop 60/40 grid에서 graph sticky가 PD list 길이보다 짧으면 하단 빈 공간 | NICE | `min-height: calc(100vh - 200px)` 권고. Phase 4 진입 시 검증 |
| R-G4 | Growth signature 4×2가 1024~1180 viewport에서 column 4 미만 fallback 필요 | MUST_NOW | `repeat(auto-fit, minmax(240px, 1fr))` 권고. §2-3 표 갱신 필요 |

R-G4 즉시 반영: Growth signature 4×2 grid → `repeat(auto-fit, minmax(240px, 1fr))`로 변경. People role 4×2도 동일 적용 권고.

**갱신**: §2-3 표의 Growth Signature·People Role 두 행 → `repeat(auto-fit, minmax(240px, 1fr))`. 1024~1180 자동 3col fallback.

---

## 9. lock 선언

본 G0-6 동결 = 1024 단일 분기 + 8 페이지 wireframe + helper class skeleton 박제. Phase 1 G1 인계 항목:

- [ ] 8 페이지 sidebar/drawer DOM 통일 (Dev)
- [ ] `app/js/nav.js` drawer toggle 구현 (Dev)
- [ ] helper class CSS 박제 (Dev / `app/css/components.css`)
- [ ] hamburger 아이콘 신규 컴포넌트 (Vera 추가 spec 불필요 — 3-line bars 표준)
- [ ] viewport resize ≥1024 자동 close listener (Dev)
- [ ] VR baseline 캡처는 Phase 2 G2 (G0-7 vr-spec 정합)

다음 산출물: G0-7 vr-spec.md / G0-9 contrast-check.md (본 turn 동시 박제).
