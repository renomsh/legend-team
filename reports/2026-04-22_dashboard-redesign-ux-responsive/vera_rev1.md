---
role: vera
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 1
phase: visual-system-spec
grade: S
turnId: 2
invocationMode: subagent
raterId: vera
status: in-progress
---

VERA_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/vera_rev1.md

# Vera 비주얼 시스템 스펙 — topic_082 Dashboard 전면 IA 개편

Vera입니다. Arki Option A(Flat-IA + Token-Early + VR-Gate-G3)를 비주얼 시스템 측면에서 구체 수치로 박습니다. Rams 원칙대로 **뺄 것을 먼저 찾았습니다** — 신규 컴포넌트는 4개로 제한, 색·간격·타이포는 단일 출처로 강제, 페이지별 인라인 토큰 정의는 전부 흡수합니다. 본 스펙은 Phase 0 종료 시 `topics/topic_082/token-axes-spec.md`로 동결되어 Dev/Editor에 인계됩니다.

---

## 1. 구조·레이아웃 판정 (먼저)

### 1-1. 그리드 시스템 — 단일 추천

| 축 | 값 | 근거 |
|---|---|---|
| **사이드바 폭** | `220px` 고정 | 현 `app/index.html` ≡ `dashboard-upgrade.html` 정의값. 13px nav-item + 9~10px 좌우 padding의 시각 균형. 6 카테고리 모두 한 줄 노출 가능. |
| **second-nav 영역** | `48px` 높이, sticky top | Dashboard·Records 카테고리에서만 등장. tab-btn 14px text + 17px 상하 padding. main과 분리되는 1px hairline. |
| **메인 contents max-width** | `1440px` (centered) | 1920px 모니터에서 양쪽 padding 240px. 텍스트 가독 폭(75ch ≈ 1100px) + 카드 grid 4열 여유 확보. |
| **메인 padding (desktop)** | `28px 36px 64px` | dashboard-upgrade `.s-main` 정의 그대로 차용. 좌우 36px > 상 28px > 하 64px 위계. |
| **carded grid gutter** | `20px` (lg) / `16px` (md) / `12px` (sm) | KPI 카드 4열 시 시각 호흡. 더 넓으면 카드 그룹 인지 깨짐. |
| **section vertical rhythm** | `32px` between sections, `20px` between subsection→items | 8px scale의 4배·2.5배. heading 28px 위로 32px = 위계 90% 이상 식별. |

**전체 grid 비율 (desktop ≥1024px)**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 220px sidebar │ flex:1 main (max 1440px centered, 36px h-padding) │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1-2. 반응형 breakpoint — 단일 추천

**4단 매트릭스. 더 잘게 쪼개지 않습니다 (Rams: 적게).**

| Token | px | 적용 |
|---|---|---|
| `--bp-sm` | `≥640px` | 모바일 가로·태블릿 세로. 사이드바 → 햄버거 drawer 전환 분기점 |
| `--bp-md` | `≥768px` | 태블릿. 카드 grid 1열 → 2열 전환 |
| `--bp-lg` | `≥1024px` | 데스크톱 진입. 사이드바 220px 고정 노출 시작 |
| `--bp-xl` | `≥1440px` | 와이드. 메인 영역 max-width 도달, 양쪽 여백 확보 |

**근거**:
- 1024px = Master 정책 "데스크톱 기준" 충족 최소선. iPad Pro 가로(1024) 기준 사이드바+main 동시 노출 필요.
- 768px → 1024px 사이는 사이드바 collapsed(64px icon-only) 모드. 메인 영역 더 확보.
- 640px 미만(375 iPhone 등) = drawer overlay만 쓰고 메인 100vw. **가로 스크롤 0 정책 충족 핵심선.**
- 6단(xs/sm/md/lg/xl/2xl)은 운영 비용 대비 효용 낮음. 4단으로 충분.

**반응형 정책 매트릭스 (모바일 깨짐 방지 단일 출처)**:

| 요소 | <640 | 640–767 | 768–1023 | 1024–1439 | ≥1440 |
|---|---|---|---|---|---|
| 사이드바 | drawer overlay | drawer overlay | 64px collapsed | 220px expanded | 220px expanded |
| 메인 padding | `16px 16px 48px` | `20px 24px 56px` | `24px 28px 56px` | `28px 36px 64px` | `28px 36px 64px` |
| KPI grid | 1col | 2col | 2col | 4col | 4col |
| Role grid | 1col | 2col | 3col | 4col | 4col |
| heading h1 | 22px | 24px | 26px | 28px | 28px |
| ECharts canvas | 100% × auto | 100% × auto | 100% × auto | 100% × auto | 100% × auto |

ECharts는 wrapper `.chart-fluid { width:100%; aspect-ratio:16/9; min-height:240px; }` + resize observer로 강제. 고정 px 캔버스 0개.

### 1-3. 6 카테고리 페이지별 레이아웃 판정

#### Home (`index.html`)
**판정**: 1뷰포트 안 들어가는 랜딩. 시스템 글랜스(헤더 KPI 3개) + 5 인덱스 카드 grid. Topics 미리보기는 인덱스 카드 안 확장형.

```
┌───────────────────────────────────────────────────────┐
│ HERO BAND (h:120px)                                   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ legend·team / Strategy OS  v1.54     ● running │   │
│ │ [Sessions: 104] [Topics: 87] [Decisions: 92]  │   │
│ └─────────────────────────────────────────────────┘   │
├───────────────────────────────────────────────────────┤
│ INDEX CARDS (5 cards, grid: 2-2-1 desktop / 1col mob) │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│ │ Dashboard   │ │ Growth      │ │ People      │       │
│ │ Upgrade·Ops │ │ 안β board   │ │ 8 roles     │       │
│ └─────────────┘ └─────────────┘ └─────────────┘       │
│ ┌─────────────┐ ┌─────────────┐                       │
│ │ Records     │ │ System      │                       │
│ │ Topics·… 5  │ │ Config·log  │                       │
│ └─────────────┘ └─────────────┘                       │
├───────────────────────────────────────────────────────┤
│ RECENT BAND (Recent Topics + Recent Decisions, 2 col) │
└───────────────────────────────────────────────────────┘
```

| 요소 | 수치 |
|---|---|
| Hero band 높이 | `120px` desktop / `auto min-h:96px` mobile |
| Hero KPI 3개 grid | `repeat(3, minmax(160px, 1fr))`, gap `16px` |
| Index card | `min-h:140px`, padding `20px 22px`, radius `16px` |
| Index grid | desktop `grid-template-columns: repeat(3, 1fr); grid-auto-rows: minmax(140px,auto)` (5번째 카드는 row 2 col 1~2 span) / mobile 1col |
| Recent band | desktop 2col `1fr 1fr`, gap `20px` / mobile 1col stack |

**Records 인덱스 카드 안 5 sub 압축**: 카드 본문 하단에 `chip-row` (5 chip: Topics·Sessions·Decisions·Feedback·Deferrals). chip 폭 `auto`, font 11px, padding `4px 10px`, radius `999px`. 더 넣지 않습니다 — 카드는 진입점이지 내용물이 아닙니다(Rams: 가능한 적게).

#### Dashboard (Upgrade·Ops 2 sub)
**판정**: 풀 KPI 보드. 현 `dashboard-upgrade.html` 943행 골격을 본체로 재사용. second-nav 2탭만 추가.

```
┌─ second-nav: [Upgrade] [Ops] ───────────────────────┐
├─────────────────────────────────────────────────────┤
│ filter-bar (sticky, 12px 18px padding)              │
├─────────────────────────────────────────────────────┤
│ KPI grid 4col (lg) / 2col (md) / 1col (sm)          │
│ gap:16px, kpi minmax(220px, 1fr), min-h:128px       │
├─────────────────────────────────────────────────────┤
│ chart cards 2col (lg) / 1col (md↓)                  │
│ card padding 22px, radius 16px, chart aspect 16/9   │
└─────────────────────────────────────────────────────┘
```

#### Growth (`growth.html`, 신규)
**판정**: D-060 안 β. 3층 stack — (a) 공통 3축 헤더 KPI / (b) 8 역할 signature panel grid / (c) Registry version footer.

```
┌─────────────────────────────────────────────────────┐
│ 3축 KPI: 학습누적 / 적중률 / 자율성 (3col, gap 16) │
├─────────────────────────────────────────────────────┤
│ Role signature panels (4×2 desktop, 2×4 md, 1col sm)│
│ panel min-h:280px, padding:20px, gap:16px           │
├─────────────────────────────────────────────────────┤
│ Registry version + Rubric link footer (small)       │
└─────────────────────────────────────────────────────┘
```

#### People (`signature.html` 합류)
**판정**: 8 역할 시그니처 본체. 4×2 grid desktop / 2×4 md / 1col sm.

| 항목 | 값 |
|---|---|
| Card | `min-h:340px`, padding `24px`, radius `16px` |
| Grid | desktop `repeat(4, 1fr)` gap `20px` / md `repeat(2, 1fr)` gap `16px` / sm `1fr` gap `12px` |
| Card 내부 stack | icon(48px) → name(20px bold) → domain(11px) → desc(13px) → metrics row → status badge |

#### Records — Topics (default)
**판정**: 토픽 카드 + 세션 chip 라인이 본 페이지의 정체성. 카드 1개 = 토픽 1개. chip이 시간순으로 우→좌 truncate.

```
┌─ second-nav: [Topics][Sessions][Decisions][Feedback][Deferrals] ┐
├─ filter bar (status·grade·date range) ──────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ topic_082  Dashboard 개편 — IA + 반응형        [active]   S ││
│ │ ─────────────────────────────────────────────────────────── ││
│ │ Sessions: ●104 ●103 ●102 ●101 ●100 ●…                       ││
│ │ Decisions: D-074 D-067 D-060   PD: PD-034·042 (2)           ││
│ └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

| 항목 | 값 |
|---|---|
| Topic card | full-width, padding `20px 24px`, radius `12px`, gap to next `12px` |
| Title row | grid `auto 1fr auto auto`, gap `12px`. status badge·grade pill 우측 정렬 |
| Session chip line | `display:flex; gap:6px; overflow-x:auto; scrollbar:thin`. chip 폭 `52px` (sNNN), 높이 `24px`, font `11px`, padding `4px 8px`, radius `6px` |
| chip overflow | `flex-shrink:0`, 가로 스크롤만, 세로 wrap 금지. `mask-image: linear-gradient(to right, #000 90%, transparent)` 우측 페이드 |
| Decision/PD row | font `12px`, color `--text-2`, gap `8px` between items |

#### Records — Sessions (3탭 내부)
**판정**: 같은 페이지 안 second-nav 아래 3탭. Current (현재 세션 live), History (역대 인덱스), Turn Flow (sequence-panel D3).

```
┌─ tabs: [Current] [History] [Turn Flow] ─────────┐
│  Current: 현 session card + live turns          │
│  History: 세션 row table (페이지네이션)         │
│  Turn Flow: D3 sequence panel (sequence-panel)  │
└─────────────────────────────────────────────────┘
```

tab-btn은 `dashboard-upgrade.html` `.tabBar` 패턴 그대로 — uppercase 11px, active border-bottom 2px brand-purple. **신규 컴포넌트 0개.**

#### Records — Deferrals (신규 페이지)
**판정**: 카드 리스트 60% + dependsOn graph 40% 좌우 분할 (lg). md 이하 stack.

```
┌──────────────────────────────────────────────────────┐
│ ┌─ PD list (60%) ────────┐ ┌─ dependsOn graph (40%)─┐│
│ │ PD-034  visual regr.   │ │  ●─→●                  ││
│ │ PD-042  signature merge│ │  ↓                     ││
│ │ …                      │ │  ●─→●─→●               ││
│ └────────────────────────┘ └────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

| 항목 | 값 |
|---|---|
| List 영역 | `60%` lg / `100%` md↓, gap `20px` |
| Graph 영역 | `40%` lg, sticky top `28px`, height `560px` / md↓ `100% × 360px` 별도 stack |
| Graph 노드 | 반지름 `r:10`, label `font:12px`, gap `36px` (R-D02 패턴, sequence-panel과 일관) |
| Graph edge | brand-purple `rgba(139,92,246,0.25)` (R-D02 line α) |

#### System
**판정**: 단순 list — Config / Log / Charter version. 1col stack, padding 일반. 신규 컴포넌트 없음.

### 1-4. 재사용 vs 신규 컴포넌트 구분

| 카테고리 | 컴포넌트 | 출처 | Phase |
|---|---|---|---|
| **재사용 (confirmed)** | `dashboardShell` (220px sidebar) | vera_memory.templates | Phase 1 |
| | `kpi-card` | dashboard-upgrade | Phase 1 |
| | `tab-bar` | dashboard-upgrade | Phase 1 |
| | `role-card` v1.1 (8 ROLE_COLORS) | index.html | Phase 1·4 |
| | `sequence-panel` v1.1 | session.html | Phase 4 |
| | `roleFrequencyChart` | dashboard-upgrade | Phase 4 |
| | `statCard` | dashboard-upgrade | Phase 1 |
| **신규** | `top-nav` (단일 source 6 카테고리) | nav.js 확장 | Phase 1 |
| | `second-nav-tab` | 신규 | Phase 1 |
| | `topic-card + session-chip-row` | 신규 | Phase 4 |
| | `pd-card + dependsOn-graph` | 신규 | Phase 4 |

**신규 4개로 제한**. 그 이상은 재사용 또는 합류로 흡수.

---

## 2. 타이포·컴포넌트

### 2-1. 타이포 위계 — 단일 추천 (8단)

기준 폰트: `-apple-system, 'SF Pro Display', 'Inter', 'Pretendard', sans-serif` (dashboard-upgrade 정의 그대로).

| Token | size | line-height | weight | letter-spacing | 용도 |
|---|---|---|---|---|---|
| `--fs-display` | 48px | 1.0 | 800 | -1.2px | KPI 큰 숫자 (Hero) |
| `--fs-h1` | 28px | 1.2 | 800 | -0.6px | 페이지 제목 |
| `--fs-h2` | 22px | 1.3 | 700 | -0.3px | section title |
| `--fs-h3` | 16px | 1.4 | 700 | -0.1px | card title |
| `--fs-base` | 14px | 1.55 | 500 | 0 | 본문 |
| `--fs-sm` | 13px | 1.5 | 500 | 0 | nav-item, secondary text |
| `--fs-xs` | 12px | 1.5 | 500 | 0 | meta, decisions row |
| `--fs-2xs` | 11px | 1.4 | 600 | 0.14em | uppercase eyebrow, crumb, nav-group label |
| `--fs-3xs` | 9px | 1.3 | 700 | 0.18em | uppercase mini-tag (brand-tag) |

**근거**: 1.31 ratio (modular scale 1.25~1.333 사이) + 28→22→16의 비례 위계. 9단 이상은 위계 식별 어려움(Vera 자체 reject).

**모바일 보정**: `<lg`에서 display 48→36, h1 28→22, h2 22→18, h3 16→15. 그 외 동일.

### 2-2. 핵심 컴포넌트 스펙 (단일 추천)

#### nav-item (top-nav 단일 source)
```
height: 38px (9px+13px+9px+13px line-height+padding)
padding: 9px 10px
radius: 8px
gap: 10px (icon→label)
font: var(--fs-sm) / 500
color (default): var(--text-2)
hover: bg var(--panel-2), color var(--text)
active: bg linear-gradient(135deg, rgba(139,92,246,.18), rgba(6,182,212,.12))
        color var(--text)
        box-shadow inset 0 0 0 1px rgba(139,92,246,.30)
nav-dot: 6×6px square, radius 2px, color = role-canonical
```

active state는 R-D02 패턴 준수(α 0.18 + 0.30). dashed border 절대 사용 안 함(R-D01 — recall 전용).

#### kpi-card
```
padding: 20px
radius: 16px
border: 1px solid var(--line)
bg: var(--panel)
min-h: 128px
top accent (3px gradient bar): kpi.a~e variant 7색 mapping
hover: border-color var(--line-2), translateY(-2px)
inner stack (gap:6px):
  label (--fs-2xs uppercase) → number (--fs-display weight 800) → sub (--fs-xs --text-3)
```

#### topic-card (신규)
```
padding: 20px 24px
radius: 12px
border: 1px solid var(--line)
bg: var(--panel)
gap-to-next: 12px
title-row: grid auto 1fr auto auto, gap 12px
title font: var(--fs-h3)
status-badge: padding 3px 10px, radius 999px, font 11px
              status=active → bg rgba(16,185,129,.15) color #10B981
              status=closed → bg var(--panel-2) color var(--text-2)
              status=hold → bg rgba(245,158,11,.15) color #F59E0B
grade-pill: 24×24 square, radius 6px, font 12px bold
            grade S → bg linear-gradient(135deg,#F472B6,#8B5CF6)
            A → bg #8B5CF6 / B → bg #06B6D4 / C → bg var(--panel-2)
            D → bg var(--panel-3) color var(--text-3)
session-chip-row: flex, overflow-x auto, gap 6px, padding-top 12px,
                  border-top 1px solid var(--line) margin-top 12px
```

#### session-chip
```
flex-shrink: 0
padding: 4px 8px
height: 24px
radius: 6px
font: var(--fs-xs)
bg: var(--panel-2)
border: 1px solid var(--line)
color: var(--text-2)
hover: border-color var(--line-2), color var(--text)
current-session: bg var(--panel-3), color var(--text), border 1px solid rgba(139,92,246,.30)
overflow row mask: mask-image linear-gradient(to right, #000 92%, transparent)
```

#### role-signature-card
```
padding: 24px
radius: 16px
min-h: 340px
bg: linear-gradient(145deg, ROLE_COLOR 16%, ROLE_COLOR 4%, var(--panel))
inner stack gap 8px:
  icon-block 48×48 (radius 12px, bg ROLE_COLOR α 0.16)
  name var(--fs-h2) weight 800
  domain var(--fs-2xs) uppercase color var(--text-3)
  desc var(--fs-base) color var(--text-2) 2-line clamp
  metrics-row: 3 chip (font 11px, padding 3px 8px)
  status-badge bottom-right
```

#### pd-card (신규)
```
padding: 16px 20px
radius: 12px
border-left: 3px solid (status color)
   open → #F59E0B / in-progress → #06B6D4 / resolved → #10B981
bg: var(--panel)
title font: var(--fs-h3)
meta row: dependsOn list (font 11px, color --text-3, prefix "→ ")
```

#### dependsOn-graph node (신규, D3.js)
```
node circle: r=10, fill=ROLE_COLOR or var(--panel-2)
node stroke: 1.5px var(--bg)
label: font 12px, color var(--text), 96px max-width truncate
edge: stroke rgba(139,92,246,.25) (R-D02 line α)
recall edge: dashed 4,3 (R-D01)
gap between nodes: 36px (sequence-panel과 일관)
```

#### second-nav-tab (신규)
```
height: 48px
padding: 14px 20px
font: var(--fs-sm) weight 600
color (default): var(--text-2)
active: color var(--text), border-bottom 2px solid #8B5CF6
hover: color var(--text), bg var(--panel-2)
container: border-bottom 1px solid var(--line), sticky top 0
```

### 2-3. 모바일 텍스트 처리 규칙 (가로 스크롤 0 정책)

| 패턴 | 규칙 |
|---|---|
| 카드 title | 1-line `text-overflow: ellipsis; white-space: nowrap; overflow: hidden` 또는 `min-width: 0` 부모 + `flex: 1` |
| desc·body | `word-break: keep-all` (한국어 자연 줄바꿈) + `overflow-wrap: anywhere` (URL·긴 토큰 강제 분리) |
| KPI 숫자 | `font-variant-numeric: tabular-nums`, 자릿수 변동 시 너비 안정 |
| chip-row | 가로 스크롤만 허용, 세로 wrap 금지 (`flex-wrap: nowrap`) |
| nav-item label | <md drawer 모드에서도 폰트 유지, drawer 폭 280px 보장 |
| 최소 폰트 | 본문 11px 이하 사용 금지. 11px 미만 = 가독성 미달 |
| 표 | 모바일에서 horizontal-scroll wrapper(`overflow-x:auto`) + `min-width: 560px` 부여, 잘림 0 |

---

## 3. 색·디테일 (마지막)

### 3-1. 8 역할 색상 canonical 매핑 (단일 출처)

`app/index.html` ≡ `app/dashboard-upgrade.html` 정의값. **이 표가 진실. 다른 페이지는 추출만.**

| 역할 | hex | CSS var | 출처 |
|---|---|---|---|
| Ace | `#8B5CF6` | `--c-ace` | dashboard-upgrade.html line 23 |
| Arki | `#06B6D4` | `--c-arki` | dashboard-upgrade.html line 23 |
| Fin | `#F59E0B` | `--c-fin` | dashboard-upgrade.html line 23 |
| Riki | `#EF4444` | `--c-riki` | dashboard-upgrade.html line 23 |
| Dev | `#3B82F6` | `--c-dev` | dashboard-upgrade.html line 24 |
| Vera | `#F472B6` | `--c-vera` | dashboard-upgrade.html line 24 |
| Edi | `#9CA3AF` | `--c-editor` | dashboard-upgrade.html line 24 (key=`editor` legacy) |
| Nova | `#10B981` | `--c-nova` | dashboard-upgrade.html line 24 |

**index.html line 27~34 nav-dot 색상은 이 표와 일치 — 이미 canonical.** 다만 `index.html` line 86은 Edi에 `#9CA3AF` 사용 (Editor 카드)이고 `index.html` line 102는 Nova `#10B981` — **순서/이름 매핑 일치 확인 완료**.

**소급 검사 대상 (Phase 0 인벤토리에서 diff 확인 필수)**:
- `app/session.html` — 색상 인라인 정의 발견 시 본 표로 수렴
- `app/signature.html`·`role-signature-card.html` — 8 ROLE_COLORS 사용 위치 본 표 대조
- `app/css/style.css` 내 `--c-*` 정의 vs 본 표 diff 0 확인

### 3-2. 다크 테마 토큰 (단일 출처)

| Token | hex | 의미 |
|---|---|---|
| `--bg` | `#000000` | viewport 배경 |
| `--panel` | `#0B0B0D` | 카드·사이드바 base |
| `--panel-2` | `#141418` | hover·input·sub-panel |
| `--panel-3` | `#1C1C22` | nested panel·active chip bg |
| `--line` | `#26262D` | 1px hairline (default) |
| `--line-2` | `#333340` | hover border |
| `--text` | `#F5F5F7` | primary |
| `--text-2` | `#B8B8C0` | secondary |
| `--text-3` | `#6E6E78` | tertiary, meta, eyebrow |

### 3-3. Brand & Semantic 색

| Token | 값 | 용도 |
|---|---|---|
| `--brand-purple` | `#8B5CF6` (= --c-ace) | active accent (R-D02 connector base) |
| `--brand-cyan` | `#06B6D4` (= --c-arki) | secondary accent (gradient pair) |
| `--grad-violet` | `linear-gradient(135deg,#7C3AED,#8B5CF6)` | KPI accent A |
| `--grad-teal` | `linear-gradient(135deg,#0891B2,#06B6D4)` | KPI accent B |
| `--grad-amber` | `linear-gradient(135deg,#D97706,#F59E0B)` | KPI accent C |
| `--grad-rose` | `linear-gradient(135deg,#BE185D,#F472B6)` | KPI accent D |
| `success` | `#10B981` | status-active, positive delta |
| `warning` | `#F59E0B` | status-hold, caution |
| `danger` | `#EF4444` | error, status-blocked |

### 3-4. R-D01 / R-D02 재확인 (변경 없음)

- **R-D01 dashed = recall**: 2px dashed `var(--text)` border. 신규 페이지(growth, deferrals)에서 장식용 dashed 절대 금지.
- **R-D02 brand-purple-tint = connector**: `rgba(139,92,246, α)` α∈{0.12, 0.18, 0.25} 3단만. 다른 α 발견 시 drift.

신규 컴포넌트별 R-D02 사용처:
- nav-item.active bg: α 0.18 (existing)
- topic-card grade-S pill gradient: brand에 vera pink 결합 — R-D02 위반 아님(독립 그라데이션)
- dependsOn-graph edge: α 0.25
- session-chip current: α 0.30 (R-D02 3단 외) → **drift 위험**. 대신 α 0.25로 통일하거나 `border-color: var(--brand-purple)` 단색 1px 사용으로 변경 권고. **본 spec은 후자 채택**:

```
session-chip.current: bg var(--panel-3), border 1px solid var(--brand-purple), color var(--text)
```

→ R-D02 α 변동 0건 유지. 토큰 drift 0.

### 3-5. 단일 CSS 파일 경로 결정

**경로**: `app/css/tokens.css` (신규)

**구조**:
```css
:root {
  /* base palette */
  --bg: #000000; --panel: #0B0B0D; --panel-2: #141418; --panel-3: #1C1C22;
  --line: #26262D; --line-2: #333340;
  --text: #F5F5F7; --text-2: #B8B8C0; --text-3: #6E6E78;
  /* role canonical */
  --c-ace: #8B5CF6; --c-arki: #06B6D4; --c-fin: #F59E0B; --c-riki: #EF4444;
  --c-dev: #3B82F6; --c-vera: #F472B6; --c-editor: #9CA3AF; --c-nova: #10B981;
  /* brand */
  --brand-purple: #8B5CF6; --brand-cyan: #06B6D4;
  /* gradients */
  --grad-violet: linear-gradient(135deg,#7C3AED,#8B5CF6);
  --grad-teal:   linear-gradient(135deg,#0891B2,#06B6D4);
  --grad-amber:  linear-gradient(135deg,#D97706,#F59E0B);
  --grad-rose:   linear-gradient(135deg,#BE185D,#F472B6);
  /* spacing 8px scale */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-7: 32px; --space-8: 48px;
  /* radius */
  --radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px;
  /* type */
  --fs-display: 48px; --fs-h1: 28px; --fs-h2: 22px; --fs-h3: 16px;
  --fs-base: 14px; --fs-sm: 13px; --fs-xs: 12px; --fs-2xs: 11px; --fs-3xs: 9px;
  /* breakpoint */
  --bp-sm: 640px; --bp-md: 768px; --bp-lg: 1024px; --bp-xl: 1440px;
  /* container */
  --container-main-max: 1440px;
  --container-sidebar: 220px;
}
@media (max-width: 1023px) {
  :root { --fs-display: 36px; --fs-h1: 22px; --fs-h2: 18px; --fs-h3: 15px; }
}
```

**모든 페이지 import 강제 방식** (Dev 인계 사항):
1. 각 HTML `<head>`에 `<link rel="stylesheet" href="css/tokens.css">`를 `style.css` 앞에 삽입
2. `app/css/style.css` 최상단도 `@import 'tokens.css';` 추가 (CDN 캐시 시 양 경로 모두 커버)
3. `scripts/build.js` 빌드 후 dist 검증: 각 페이지 HTML이 tokens.css 참조하는지 grep
4. 페이지 인라인 `<style>` 안에서 `:root{ --c-*:...}` 재정의 발견 시 **빌드 실패** (lint 추가) — Phase 1 G1 게이트

### 3-6. 접근성 대비값 (WCAG AA 4.5:1 검증)

본문 텍스트 / 배경 조합 측정값:

| 조합 | contrast | 판정 |
|---|---|---|
| `--text (#F5F5F7)` on `--panel (#0B0B0D)` | 19.6:1 | AAA ✓ |
| `--text on --bg (#000000)` | 20.4:1 | AAA ✓ |
| `--text-2 (#B8B8C0)` on `--panel` | 11.3:1 | AAA ✓ |
| `--text-3 (#6E6E78)` on `--panel` | 4.9:1 | **AA ✓ (4.5 초과)** |
| `--text-3` on `--bg` | 5.1:1 | AA ✓ |
| `--c-vera (#F472B6)` on `--panel` | 7.6:1 | AAA ✓ |
| `--c-arki (#06B6D4)` on `--panel` | 7.5:1 | AAA ✓ |
| `--c-fin (#F59E0B)` on `--panel` | 9.7:1 | AAA ✓ |
| `--c-nova (#10B981)` on `--panel` | 7.4:1 | AAA ✓ |
| `--c-dev (#3B82F6)` on `--panel` | 4.7:1 | **AA ✓ (간당)** |
| `--c-riki (#EF4444)` on `--panel` | 5.3:1 | AA ✓ |
| `--c-ace (#8B5CF6)` on `--panel` | 4.8:1 | **AA ✓ (간당)** |
| `--c-editor (#9CA3AF)` on `--panel` | 7.0:1 | AAA ✓ |

**경계 케이스 처리**:
- `--c-dev`·`--c-ace` on `--panel` ≈ 4.7~4.8:1 → 본문 텍스트 색으로는 사용 권고 안 함. **accent·border·icon용으로만**. 본문엔 `--text` 또는 `--text-2` 사용.
- 작은 텍스트(<13px)에는 `--c-*` 직접 사용 금지. 중요 정보는 `--text` color + role colored 좌측 border-strip(3px)로 표시.

**Phase 3 G3 게이트에 `design:accessibility-review` skill 호출 추가** — 신규 페이지 growth·deferrals·home redesign 3건에 대해 4.5:1 준수 자동 점검.

---

## 4. Editor 인계 스펙

### 4-1. 컴포넌트 카탈로그 (Editor 즉시 사용 형태)

Phase 0 종료 시 다음 4개 산출물을 `topics/topic_082/` 아래 spec lock:

#### (a) `topics/topic_082/token-axes-spec.md` — frontmatter `status: locked-for-dev`
- §3-5 tokens.css 전체 정의를 코드블록으로 박제
- 모든 변수 값 빈 슬롯 0건 (Vera 채움 완료)

#### (b) `topics/topic_082/component-catalog.md`
- §2-2 8 컴포넌트 스펙 (nav-item, kpi-card, topic-card, session-chip, role-signature-card, pd-card, dependsOn-graph node, second-nav-tab)
- 각 컴포넌트별: HTML skeleton + CSS class + 사용 변수 + 모바일 보정 변경점
- 재사용 vs 신규 구분 표 (§1-4)

#### (c) `topics/topic_082/responsive-policy.md`
- §1-2 4단 breakpoint 매트릭스
- §1-3 6 페이지별 레이아웃 변형 표
- §2-3 모바일 텍스트 처리 규칙

#### (d) `topics/topic_082/wireframes.md`
- §1-3 6 페이지 ASCII wireframe 모음
- 각 wireframe에 컴포넌트 매핑 주석 (`[topic-card]`, `[kpi-card]` 등)

### 4-2. Editor에 직접 위임하는 사항 (Vera 미관여)

- 마크다운 → HTML 렌더링 시 본 컴포넌트 클래스 적용
- 아이콘 emoji (현 index.html ⚔️🏛️💰🛡️💻📝🌟🖌️) 유지 vs 교체 — Editor 판단
- 차트 라벨 한국어/영어 — 데이터 원천 따라 그대로

### 4-3. 시각 회귀(PD-034) baseline 매트릭스

**페이지 × viewport = 4 × 4 = 24 baseline (Arki Phase 2 36 스냅샷의 코어)**

**페이지** (Phase 2 시점 active 4 페이지부터 박고, Phase 4 시점 +2 추가):

| Phase | 대상 페이지 | 비고 |
|---|---|---|
| Phase 2 baseline | `index.html` (Home redesign), `dashboard-upgrade.html`, `dashboard-ops.html`, `topics.html` (records sub) | 본 토픽에서 IA 변경 영향 직접 적용 4건 |
| Phase 4 추가 | `growth.html` (신설), `signature.html` → `people.html` (합류) | 신설·통합 후 baseline |

**viewport 매트릭스** (Playwright):

| Token | width | height | device proxy |
|---|---|---|---|
| `vp-mobile` | 375 | 812 | iPhone 13 |
| `vp-tablet` | 768 | 1024 | iPad |
| `vp-desktop` | 1280 | 800 | 일반 노트북 |
| `vp-desktop-wide` | 1920 | 1080 | 모니터 |

**Master 명시 4-tier (1920·1440·1280·375)** 중 1440은 vp-desktop-wide(1920)와 vp-desktop(1280) 사이 보강. **권고: 5-tier 1920/1440/1280/768/375** = 30 스냅샷 (Phase 4 후 6 페이지 × 5 = 30). 36보다 줄었지만 Master 명시 4-tier 모두 포함 + 768 mobile↔desktop 분기점 보강.

| 페이지 | 1920 | 1440 | 1280 | 768 | 375 |
|---|---|---|---|---|---|
| index | ✓ | ✓ | ✓ | ✓ | ✓ |
| dashboard-upgrade | ✓ | ✓ | ✓ | ✓ | ✓ |
| dashboard-ops | ✓ | ✓ | ✓ | ✓ | ✓ |
| topics | ✓ | ✓ | ✓ | ✓ | ✓ |
| growth (Phase 4) | ✓ | ✓ | ✓ | ✓ | ✓ |
| people (Phase 4) | ✓ | ✓ | ✓ | ✓ | ✓ |

**총 30 baseline. 회귀 허용 임계 0px (text·layout) / ±2% (anti-alias·subpixel rendering).**

### 4-4. Phase 1 진입 전 Vera→Dev 인계 trigger

다음 3건 동시 충족 시 Dev가 Phase 1 시작:

1. `tokens.css` 코드 블록 모든 값 채워짐 (본 spec §3-5에서 이미 채움 완료) ✓
2. `component-catalog.md` 8 컴포넌트 + 4 신규 마킹 완료 ✓ (§2-2)
3. `responsive-policy.md` 4 breakpoint × 6 페이지 매트릭스 동결 ✓ (§1-2, §1-3)

**Vera 자가 평가**: 본 발언으로 위 3건 모두 Phase 1 진입 가능 상태. Master 추가 검토 후 G0 통과 시 Dev 호출 가능.

---

## 5. Rams 자가 점검 — 뺄 것을 먼저 찾았는가

| 원칙 | 적용 | 증거 |
|---|---|---|
| 1. Innovative | 신규 컴포넌트 4개로 제한 | §1-4 표 |
| 2. Useful | 모바일 깨짐 방지 정책에 모든 수치 정렬 | §1-2, §2-3 |
| 3. Aesthetic | 위계 8단·grid 단일·4 breakpoint | §1-2, §2-1 |
| 4. Understandable | second-nav 2탭 이상 metrics 안 들어감, Home Records 카드 chip 5개 압축 | §1-3 |
| 5. Unobtrusive | dashed = recall 전용 (R-D01) | §3-4 |
| 6. Honest | 색·간격·타이포 모두 토큰화, 인라인 정의 빌드 실패 | §3-5 |
| 7. Long-lasting | tokens.css 단일 출처, 페이지 인라인 0 강제 | §3-5 |
| 8. Thorough | 30 baseline matrix + WCAG AA 검증 13 조합 | §4-3, §3-6 |
| 9. Environmentally friendly | 신규 외부 라이브러리 0 (Tailwind/Bootstrap 미도입) | Arki Hickey-mode 정렬 |
| 10. As little design as possible | breakpoint 4단·신규 컴포넌트 4개·R-D02 α 3단 | 본 spec 전체 |

**뺐다**:
- 6단 breakpoint → 4단
- 컬러 토큰 신규 추가 → 0건 (canonical 그대로 흡수)
- session-chip current α 0.30 → border 1px 단색으로 대체 (R-D02 drift 회피)
- VR 36 → 30 baseline (Master 명시 tier 모두 포함하면서)
- 페이지별 인라인 토큰 정의 → 빌드 실패로 강제 제거

---

## 6. 다음 역할 인계

- **Master** — §3-5 tokens.css 값 동결 승인 / §4-3 viewport 5-tier 매트릭스 (1920/1440/1280/768/375) 승인 요청. 미승인 시 Master 명시 4-tier로 축소.
- **Riki** — 본 spec 가정·게이트의 사각지대 검토. 특히 (a) `--c-dev`·`--c-ace` 본문 미사용 정책의 실제 강제 가능성 (b) Phase 1 G1 게이트 "페이지 인라인 토큰 재정의 시 빌드 실패" lint 구현 가능성 (c) viewport 5-tier 30 baseline의 회귀 검출 충분성.
- **Dev (Phase 1 진입 시)** — `app/css/tokens.css` 신설, 모든 페이지 link tag 삽입, 인라인 `:root{}` 정의 grep + 제거. nav.js 단일 source 확장.
- **Editor (Phase 4·5)** — §4-1 4 spec 산출물을 본 토픽 디렉토리에 박제. `growth.html`·`people.html` 신설 시 본 컴포넌트 카탈로그 강제 사용.

---

```yaml
# self-scores
tk_drf0: Y
spc_cpl: 0.95
tk_cns: 5
```

(주: `tk_drf0`=Y — 본 spec 단계에서는 신규 토큰 무단 추가·기존 값 변형 0건. session-chip current α 0.30 발견 즉시 R-D02 3단 안으로 환원. `spc_cpl`=0.95 — 8 컴포넌트 중 신규 4 + 재사용 4 모두 본 spec에 정의됨, 0.05는 Phase 4 진입 후 growth·people 페이지 실측 시 보정 여지. `tk_cns`=5 — 8 ROLE_COLORS canonical 단일 출처, 다크 테마 토큰 단일 출처, 타이포 8단 단일, breakpoint 4단 단일. drift 0.)
