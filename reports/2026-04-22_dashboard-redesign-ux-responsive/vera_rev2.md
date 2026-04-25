---
role: vera
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 2
phase: visual-system-spec-update
grade: S
turnId: 7
invocationMode: subagent
raterId: vera
recallReason: post-synthesis
status: spec-lock-pending
---

VERA_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/vera_rev2.md

# Vera 비주얼 시스템 갱신 — Arki rev2 §7(자기감사 라운드 2) 디자인 영역 보강

Vera입니다. Arki rev2의 자기감사 라운드 2(§7) 8건 중 디자인 영역 결함을 갱신본에 흡수하고, Master 박제 #11·#12와 1024 단일 분기 정책에 따라 vera_rev1 spec 일부를 폐기·재정렬합니다. 새 옵션 탐색 0건. 단일 추천 + 수치 근거.

본 발언이 vera_rev1(turnId 2) spec 갱신본. Phase 0 G0-4·G0-6·G0-7·G0-9 산출물의 디자인 영역 채움값으로 직접 인계.

---

## 0. vera_rev1 → vera_rev2 변경 요약 표

| 항목 | rev1 | rev2 | 사유 |
|---|---|---|---|
| 반응형 분기 | 4단(640/768/1024/1440) | **1024 단일 분기** | Master 박제 #11 |
| 사이드바 모드 | drawer / 64px collapsed / 220px expanded 3단 | **drawer overlay / 220px expanded 2단** | 768·collapsed 폐기 |
| 모바일 사이드바 | drawer overlay (≤640) + collapsed 전환 | **off-canvas drawer (좌측 슬라이드) + backdrop** 단일 추천 | overlay 패턴 단일화 |
| VR baseline | 30 (5 viewport × 6 페이지) | **24 (4 viewport × 6 페이지)** | Master 박제 #12, 768 viewport 폐기 |
| VR 임계 | 0px (text·layout) + ±2% AA | **maxDiffPixelRatio 0.02 + bbox 비교 + threshold 0.2** | 0px false-positive 폭발 회피 |
| WCAG 13조합 | 검증 표 캡처만 | **G3 자동 contrast check pipeline + accent-only lint** | Master 승인 #10 |
| 텍스트 처리 7규칙 | 7개 동급 나열 | **1024 분기 기준 desktop·mobile 매트릭스로 재정렬** | 1단 분기 정합 |
| Edi 인계 산출물 | 4건 | **+VR mock fixture spec / +bbox 정의 표 / +contrast lint config = 7건** | Arki §7 #5·#7·#10 흡수 |
| nav-item active α | 0.18 + box-shadow 0.30 | **0.18 + 1px solid border --brand-purple** | rev1 §3-4 R-D02 drift 회피 정책 그대로 유지 |

---

## 1. Arki rev2 §7 결함 5건 디자인 영역 판정 + mitigation (A. 본문)

Arki rev2 §7(자기감사 라운드 2)에는 신규 결함 8건(#3~#10)이 있습니다. 그중 "5건 신규 결함" 표현은 §0 변경 요약 + §7 라운드 2 명시 8건 중 흡수 가시 5건(#3·#4·#5·#7·#10)을 의미하는 것으로 해석합니다(#6·#8·#9는 NICE 또는 spec 비충돌). 디자인 영역 매핑:

| # | 결함 | 영역 판정 | Vera mitigation |
|---|---|---|---|
| #3 | `app/deferrals.html` Phase 4 산출물 표 누락 → 흡수됨 | Arki 영역(스펙 분해), Vera 무관여 | 영역 외. 단 deferrals D3 그래프 색·타이포·간격은 Vera 책임 → §3-3에서 명시 |
| #4 | inline-root-dump 스캔 대상 13 active 페이지 한정 | Dev/Arki 영역(빌드 lint), Vera 무관여 | 영역 외 |
| #5 | `role-signature-card.html` partial 로딩 패턴 미정 (fetch+innerHTML vs build inline) | **Vera+Dev 공동 영역** — 시각 일관성·FOUC·접근성 영향 | **§4-1 단일 추천**: `<template>` element + 빌드시 inline (no FOUC, no fetch latency, no SEO-blank) |
| #7 | Phase 2 + Phase 4 baseline 라운드 환경 차이(Playwright 버전·OS 폰트 hinting) | **Vera 영역** — VR baseline 환경 일관성 = 디자인 토큰의 시각적 검증 토대 | **§3 본문**: docker 이미지 핀 + font-rendering 환경 변수 단일화 spec |
| #10 | 부분 출시 4페이지 중 Records/Topics만 신규 컴포넌트 회귀 위험 단독 부담 | **Vera 영역** — 신규 컴포넌트(topic-card·session-chip-row) spec 정밀도 책임 | **§5**: topic-card·session-chip-row spec 정밀화 + Phase 2 baseline 박제 시점 명시 |

### Master 결정 필요 항목 (별도)

| 항목 | 추천 | Master 결정 필요 사유 |
|---|---|---|
| `role-signature-card` partial 로딩 — `<template>` + build-time inline | 채택 | Dev 구현 패턴 직결, 빌드 파이프라인 영향 |
| Playwright docker image 핀 버전 | `mcr.microsoft.com/playwright:v1.45.0-jammy` | CI 비용·이미지 갱신 주기 영향 |

---

## 2. 반응형 1024 단일 분기 정합 갱신 (B. 본문)

### 2-1. 폐기 항목 명시 (vera_rev1 대비)

| rev1 항목 | 폐기 사유 |
|---|---|
| `--bp-sm: 640px` 분기 정책 | 단일 분기 1024 (Master #11) |
| `--bp-md: 768px` 분기 정책 | 단일 분기 1024 |
| `--bp-xl: 1440px` 분기 정책 | 단일 분기 1024 (max-width 1440은 container 토큰으로 분리) |
| 64px collapsed sidebar 모드 | Riki R-03 + Master #11 |
| 4 breakpoint 매트릭스 | 2 column(mobile/desktop) 매트릭스로 압축 |
| iPad Pro 가로 1024 분기 정합 근거 | 그대로 유지 (Master 정책과 충돌 없음) |

토큰 보유는 유지(`--bp-sm/md/xl`을 미세 조정용으로 tokens.css에 둠). 단 정책 분기 사용 0.

### 2-2. 1024 단일 분기 데스크톱/모바일 단일 추천 spec

#### 사이드바 — 단일 추천: off-canvas drawer (좌측 슬라이드)

| 모드 | 폭 | 동작 | 근거 |
|---|---|---|---|
| **mobile (<1024)** | drawer 280px | 좌측 슬라이드 in/out + backdrop dim 50% | 280px = nav-item label 가독 보장(13px font + 10px padding + icon 16px = 39px 좌 padding 9 + 5 nav-item) 6 카테고리 모두 ellipsis 0 |
| **desktop (≥1024)** | 220px 고정 | 항상 노출 | rev1 §1-1 그대로. iPad Pro 가로 1024 기준 정합 |

**off-canvas vs overlay vs hamburger top-bar** 비교:

| 옵션 | 장점 | 단점 | 판정 |
|---|---|---|---|
| **off-canvas drawer** (추천) | 데스크톱 사이드바와 시각·기능 동일, transition 단순(`transform: translateX`), backdrop 클릭 close 표준 | hamburger 아이콘 영역 필요(48×48 top-left) | **채택** |
| overlay (centered modal) | 노출 영역 큼 | 데스크톱과 시각적 단절, 사이드바 정체성 상실 | reject |
| hamburger top-bar (안 펼침) | 공간 절약 | 6 카테고리 + Dashboard·Records sub 탐색 비용 폭증 | reject |

**transition spec**:
```
transform: translateX(-100%);  /* closed */
transform: translateX(0);      /* open */
transition: transform 220ms cubic-bezier(0.4, 0.0, 0.2, 1);
backdrop: position fixed inset 0, bg rgba(0,0,0,0.5), opacity 0→1 220ms
z-index: drawer 50 / backdrop 49 / hamburger 51
```

**hamburger 아이콘**:
```
position: fixed top 16px left 16px (mobile only)
size: 40×40, padding 8px (icon 24×24)
icon: 3-line bars, --text color
hidden: ≥1024
aria-label: "메뉴 열기" / open 시 "메뉴 닫기"
```

#### 컨텐츠 영역 grid 단일 추천

| 영역 | mobile (<1024) | desktop (≥1024) |
|---|---|---|
| 컨테이너 | 100vw, padding `20px 16px 56px` | max-width 1440px centered, padding `28px 36px 64px`, sidebar 220px 좌 고정(margin-left 220px on main) |
| KPI grid | `grid-template-columns: 1fr` | `grid-template-columns: repeat(4, minmax(220px, 1fr))` gap 16px |
| Role grid (People) | `grid-template-columns: 1fr` | `grid-template-columns: repeat(4, 1fr)` gap 20px (4×2) |
| Index card grid (Home) | `grid-template-columns: 1fr` | `grid-template-columns: repeat(3, 1fr)` (5번째 카드 col 1~2 span) gap 20px |
| Recent band (Home) | stack | `grid-template-columns: 1fr 1fr` gap 20px |
| Chart cards | `grid-template-columns: 1fr` | `grid-template-columns: 1fr 1fr` gap 20px |
| Deferrals | stack(PD list 위·graph 아래 360px) | `grid-template-columns: 60% 40%` gap 20px, graph sticky top 28px height 560px |

**rev1의 4단 매트릭스 폐기, 2 column으로 압축**.

### 2-3. 텍스트 깨짐 방지 7 규칙 — 1024 분기 기준 재정렬

| # | 규칙 | mobile (<1024) | desktop (≥1024) |
|---|---|---|---|
| 1 | 카드 title 1-line | `text-overflow: ellipsis; white-space: nowrap; min-width: 0` | 동일 (타이틀 길이 더 김) |
| 2 | 본문 줄바꿈 | `word-break: keep-all; overflow-wrap: anywhere` | 동일 |
| 3 | KPI 숫자 | `font-variant-numeric: tabular-nums` + `font-size: --fs-display(36px)` | 동일 + `--fs-display(48px)` |
| 4 | chip-row | `flex-wrap: nowrap; overflow-x: auto` + 우측 mask fade | 동일 (단 visible chip 수 더 많음) |
| 5 | 표 | `overflow-x: auto` wrapper + `min-width: 560px` | 표 native 폭 |
| 6 | 본문 최소 폰트 | 11px (eyebrow·meta까지). 본문은 13px 이상 | 동일 |
| 7 | 가로 스크롤 | viewport 가로 스크롤 0 (chip-row·표 제외 컨테이너) | 동일 |

**Master 원칙 정합**: 데스크톱 기준 + 모바일 안 깨짐 (가로 스크롤·텍스트 잘림 0). 7 규칙 모두 가로 스크롤·잘림 차단으로 정렬됨.

---

## 3. VR 24 baseline 환경 일관성 spec (C. 본문 — Arki §7 결함 #7 흡수)

### 3-1. 환경 변수 단일화 — 단일 추천

baseline 캡처 시 변동 요소 제거 spec. **docker image 핀 + font-rendering 단일화**가 핵심.

| 환경 변수 | 값 (단일 추천) | 근거 |
|---|---|---|
| Playwright image | `mcr.microsoft.com/playwright:v1.45.0-jammy` | Phase 2 + Phase 4 동일 이미지 강제. ICC profile·font hinting 일치 |
| OS | Ubuntu 22.04 LTS (jammy) | image 내장. 로컬 OS 변동 차단 |
| Browser | Chromium (Playwright 번들) | Firefox/WebKit 별도 baseline 0 (24 baseline은 Chromium 단일) |
| Browser zoom | 1.0 (default) | viewport 기준 정합 |
| deviceScaleFactor | 1 (375 mobile은 2 권고이나 baseline 일관성 위해 1 고정) | 확장 시 dpr 2 별도 baseline은 PD |
| Color scheme | `dark` (`prefers-color-scheme: dark`) | 본 디자인은 다크 단일. light theme baseline 0 |
| Font rendering | `font-smooth: never` 강제 추가(headless) | sub-pixel anti-alias 변동 최소화 |
| Animation | `reducedMotion: 'reduce'` (Playwright option) | transition·loading spinner 변동 0 |
| Locale | `ko-KR` | 한국어 줄바꿈·숫자 포맷 일관 |
| Timezone | `Asia/Seoul` | 시각 표시 변동 0 |

```ts
// tests/visual/playwright.config.ts
use: {
  baseURL: 'http://localhost:8788',
  viewport: { width: 1280, height: 800 },  // per-test override
  deviceScaleFactor: 1,
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
}
expect: {
  toHaveScreenshot: { maxDiffPixelRatio: 0.02, threshold: 0.2 }
}
```

**Phase 2와 Phase 4 동일 image hash 강제** — package.json에 image digest sha256 박제(이미지 갱신 시 PD).

### 3-2. mock fixture data 결정점 (변동 요소 고정값)

baseline 변동의 가장 큰 원천은 데이터(KPI 숫자·날짜·세션 ID). `tests/visual/fixtures/dashboard_data.fixture.json` 단일 fixture로 동결.

| 데이터 카테고리 | 고정값 spec | 근거 |
|---|---|---|
| KPI 숫자 | 5자리 한도 고정값 (예: 12,345 / 1,234) | 자릿수 변동 시 width 변동 → diff |
| 날짜 표시 | 모든 페이지 `2026-04-25` 단일 | 시각 표시 변동 0 |
| 세션 ID | `session_104` 단일 | chip-row baseline 일관 |
| Topic ID | `topic_082` 외 5건 (082·081·080·079·078) | session-chip 5개 노출 baseline |
| Decision ID | `D-074·D-067·D-060` 3건 | topic-card decision row baseline |
| 역할 색 매핑 | tokens.css canonical 그대로 | drift 0 |
| 사용자 이름·아바타 | 8 역할 단일 (Ace/Arki/Fin/Riki/Dev/Vera/Edi/Nova) | 변동 0 |
| Loading spinner | reduced motion + fixture에 `loaded: true` 강제 | spinner 캡처 0 |
| Chart 데이터 | seed 고정 deterministic random (seed: 42) | ECharts 렌더 일관 |
| Time-since-now ("3시간 전") | 절대 시각으로 치환 ("2026-04-25 09:00") | 시간 흐름 변동 0 |

**fixture 갱신 trigger**:
- 신규 페이지 추가 (Phase 4 시점) → fixture에 페이지별 data 항목 추가, 기존 항목 불변
- KPI 카테고리 변경 → PD 박제 후 fixture 갱신 + baseline 재캡처

### 3-3. bbox 비교 영역 정의 표

페이지별 안정 영역(static layout) vs 동적 영역(차트·D3 그래프). bbox 비교는 **안정 영역만** 적용. 동적 영역은 maxDiffPixelRatio 0.02로만 검증.

| 페이지 | 안정 영역 (bbox 검증) | 동적 영역 (pixel ratio만) |
|---|---|---|
| Home | sidebar / hero band / index card grid 외곽 (5 card bbox) / recent band 외곽 | hero KPI 숫자 영역(±2px), recent topic chip 내부 |
| Dashboard/Upgrade | sidebar / second-nav / filter-bar / KPI 4 card 외곽 | KPI 숫자 영역 / chart card 내부 (ECharts canvas) |
| Dashboard/Ops | sidebar / KPI grid 외곽 | KPI 숫자 영역 / chart canvas |
| Records/Topics | sidebar / filter-bar / topic-card 외곽(상위 3 card bbox) | session-chip-row 내부(chip 5개 외곽 bbox는 안정), decision row text |
| Growth | sidebar / 3축 KPI grid 외곽 / signature panel 4×2 외곽 | signature panel 내 metrics row |
| People | sidebar / role card grid 4×2 외곽 | role card 내부 metric row, status badge |

**bbox 추출 방식**:
```ts
// tests/visual/bbox-compare.ts
const bbox = await page.locator('[data-vr-bbox="kpi-grid"]').boundingBox();
expect(bbox).toMatchObject({ x: ..., y: ..., width: ..., height: ... });
// tolerance: ±1px (anti-alias absorption)
```

각 안정 영역 컨테이너에 `data-vr-bbox="<region-id>"` 속성을 Phase 2 진입 시 부여. Dev 합의 사항.

### 3-4. maxDiffPixelRatio 0.02 검증 기준

| 항목 | 값 | 근거 |
|---|---|---|
| `maxDiffPixelRatio` | 0.02 (2% 픽셀 차이 허용) | 1920×1080 viewport ≈ 2백만 픽셀 중 4만 픽셀 변동 허용. 폰트 sub-pixel·gradient 미세 변동 흡수 |
| `threshold` | 0.2 | 픽셀 단위 색 차이 허용폭 (0~1, 0=동일·1=완전 다름). Playwright 권장 |
| `animations` | 'disabled' | toHaveScreenshot 옵션, transition 동결 |
| `caret` | 'hide' | input caret blink 변동 차단 (D-003 read-only지만 focus 가능 영역 방어) |
| 통과 조건 | 24 baseline 모두 PASS | Phase 3 G3 게이트 |
| FAIL 시 | 차이 영역 PNG diff 자동 생성 → reports/visual-regression/{date}/ | Edi 인계 가능 형태 |

---

## 4. WCAG G3 자동 contrast check 토큰 spec (D. 본문)

### 4-1. rev1 13조합 → G3 자동 lint pipeline 박제

build.js 실행 시 자동 발동:

```js
// scripts/lint-contrast.ts (신규)
import { rgbToContrast } from './lib/contrast.ts';
const COMBINATIONS = [
  ['--text', '--panel', 4.5],   // [fg, bg, minRatio]
  ['--text', '--bg', 4.5],
  ['--text-2', '--panel', 4.5],
  ['--text-3', '--panel', 4.5],
  ['--text-3', '--bg', 4.5],
  ['--c-vera', '--panel', 4.5],
  ['--c-arki', '--panel', 4.5],
  ['--c-fin', '--panel', 4.5],
  ['--c-nova', '--panel', 4.5],
  ['--c-dev', '--panel', 4.5],   // 4.7 간당
  ['--c-riki', '--panel', 4.5],
  ['--c-ace', '--panel', 4.5],   // 4.8 간당
  ['--c-editor', '--panel', 4.5],
];
// tokens.css 파싱 → 각 조합 ratio 계산 → 미달 시 build fail + 조합 명시
```

**발동 trigger**:
- `app/css/tokens.css` 변경 (git diff 감지)
- `scripts/build.js` 실행 (CF Pages 빌드 진입 시)
- Phase 3 G3 게이트 (수동 트리거)
- Phase 4 신규 페이지 추가 시 (growth·people·deferrals)

**FAIL 출력 spec**:
```
[contrast-lint] FAIL: --c-dev (#3B82F6) on --panel (#0B0B0D) = 4.32:1, requires ≥4.5:1
[contrast-lint] HINT: --c-dev를 #4F8FF7로 변경 시 5.1:1
build aborted.
```

### 4-2. accent-only lint 적용 범위

`--c-dev`(4.7) / `--c-ace`(4.8)는 간당값. 본문 텍스트로 사용 시 미세 색 조정만으로도 4.5:1 깨질 위험. **accent·border·icon 전용 강제**.

| 컴포넌트 | --c-* 사용 허용 속성 | 차단 속성 |
|---|---|---|
| nav-item.active | `box-shadow inset 0 0 0 1px var(--c-ace)` (border 대용) | `color: var(--c-*)` 본문 텍스트 |
| kpi-card top accent | `background: var(--grad-violet)` (3px bar) | text 본문 |
| role-card | `background-color: rgba(var(--c-*) α)` , `border-color`, icon `fill` | description text color |
| topic-card grade-pill | `background: var(--grad-rose)` (S grade) | text는 `--text` 또는 `--bg`(대비 위해) |
| sequence-panel node | `fill: var(--c-*)` | label text는 `--text` 단일 |
| chart legend | `background-color`, `border-color` | legend text는 `--text-2` |

**lint 구현**:
```js
// scripts/lint-accent-only.ts
const RESTRICTED_TOKENS = ['--c-dev', '--c-ace'];
const FORBIDDEN_PROPERTIES = ['color'];
// 모든 .css·인라인 <style> grep → color: var(--c-dev|--c-ace) 발견 시 build fail
// 단 .small-text(font-size <13px) 안에서는 모든 --c-* 차단 (대비 보장 어려움)
```

### 4-3. --c-dev 4.7 / --c-ace 4.8 간당값 모니터링

향후 색 미세 조정 발생 시 4.5:1 무너지는 방어:

| 항목 | 현재값 | safety margin | 방어 spec |
|---|---|---|---|
| `--c-dev` `#3B82F6` | 4.7:1 | 0.2 | 토큰 변경 시 contrast lint 자동 차단 |
| `--c-ace` `#8B5CF6` | 4.8:1 | 0.3 | 동일 |
| 권고 fallback | `--c-dev #4F8FF7` (5.1:1) / `--c-ace #9F75F8` (5.2:1) | 0.6+ | 향후 색 보강 시 swap candidate |

**Riki R-04 정합** (rev1 §3-6에서 이미 검토):
- R-04 "WCAG 자동 contrast check 정합성" → G3 자동 lint pipeline + accent-only 두 단으로 박음
- 13 조합 + 2 lint = 단일 build에서 자동 통과/실패 판정
- 본 spec으로 R-04 cover 완전 흡수

---

## 5. Records/Topics 신규 컴포넌트 spec 정밀화 (Arki §7 #10 흡수)

부분 출시 4 페이지 중 Records/Topics는 신규 컴포넌트(topic-card·session-chip-row) 회귀 위험을 단독 부담. Phase 2 baseline 박제 시점에서 신규 컴포넌트가 production에 들어가므로 spec 정밀도 강화.

### 5-1. topic-card spec 정밀화 (rev1 §2-2 갱신)

| 속성 | 값 | 정밀화 사항 |
|---|---|---|
| padding | `20px 24px` | 변동 없음 |
| radius | `12px` | 변동 없음 |
| border | `1px solid var(--line)` | 변동 없음 |
| bg | `var(--panel)` | 변동 없음 |
| min-height | **`88px` 추가** | bbox 안정 영역 확보. title row 24px + chip row 24px + padding 40px = 88px 최소 |
| title-row grid | `grid-template-columns: auto 1fr auto auto; gap: 12px` | 변동 없음 |
| title font | `var(--fs-h3)` (16px) | 변동 없음 |
| status-badge 위치 | row 우측 첫 번째 (3rd col) | 변동 없음 |
| grade-pill 위치 | row 우측 두 번째 (4th col) | 변동 없음 |
| session-chip-row | 별도 §5-2 spec | 변동 없음 |
| `data-vr-bbox` 추가 | `data-vr-bbox="topic-card-{id}"` | bbox 비교 대상 마킹 |

### 5-2. session-chip-row spec 정밀화

| 속성 | 값 | 정밀화 |
|---|---|---|
| display | `flex` | 변동 없음 |
| gap | `6px` | 변동 없음 |
| overflow-x | `auto` | 변동 없음 |
| flex-wrap | `nowrap` | rev1 §2-3 흡수, 명시 |
| padding-top | `12px` | 변동 없음 |
| margin-top | `12px` | 변동 없음 |
| border-top | `1px solid var(--line)` | 변동 없음 |
| chip 폭 | `auto` (최소 52px, 최대 80px) | session_104 같은 ID 7자리 대응 |
| chip height | `24px` | 변동 없음 |
| mask | `mask-image: linear-gradient(to right, #000 92%, transparent)` | 변동 없음 |
| `data-vr-bbox` | row 외곽만 마킹 | 내부 chip은 동적 영역으로 분류 |

### 5-3. baseline 박제 시점

**Arki vr-spec.md §G0-7에 흡수 권고**:
- Phase 2 baseline 16건 = 4 페이지 × 4 viewport
- 그중 `topics` 페이지 baseline 4건은 **신규 컴포넌트 적용 후** 박는 것을 명시 (`data-vr-bbox` 마킹·신규 component CSS class 적용 완료 후)
- 박제 시점: Phase 2 종료 직전 (G2 게이트 통과 직후)

---

## 6. Editor 인계 산출물 갱신 (E. — rev1 4건 → rev2 7건)

### 6-1. 산출물 표 (rev1 §4 갱신)

| # | 산출물 | rev1 위치 | rev2 변경 |
|---|---|---|---|
| 1 | `topics/topic_082/token-axes-spec.md` | 그대로 | tokens.css 채움값 동일, G1 색 토큰 한정 1줄 추가 |
| 2 | `topics/topic_082/component-catalog.md` | 그대로 | topic-card·session-chip-row §5 정밀화 흡수 + `data-vr-bbox` 마킹 spec 추가 |
| 3 | `topics/topic_082/responsive-policy.md` | 그대로 | 4단 매트릭스 → 2 column 매트릭스로 갱신, off-canvas drawer spec 추가 |
| 4 | `topics/topic_082/wireframes.md` | 그대로 | **rev1 4단 wireframe 폐기 → 1024 단일 분기 wireframe로 갱신** (§7 본문) |
| 5 | **NEW** `topics/topic_082/vr-mock-fixture.spec.md` | — | §3-2 mock fixture 결정점 표 + JSON 골격 |
| 6 | **NEW** `topics/topic_082/bbox-regions.md` | — | §3-3 bbox 정의 표 + `data-vr-bbox` 마킹 가이드 |
| 7 | **NEW** `topics/topic_082/contrast-lint.config.md` | — | §4-1 13 조합 + §4-2 accent-only 룰 + 구현 스크립트 위치 |

### 6-2. 산출물 #5 — vr-mock-fixture.spec.md 골격

```md
# VR Mock Fixture Spec

## 데이터 결정점
(§3-2 표 그대로)

## 동결 JSON 골격
{
  "kpis": { "sessions": 12345, "topics": 87, "decisions": 92 },
  "currentSession": "session_104",
  "currentDate": "2026-04-25",
  "topics": [
    { "id": "topic_082", "title": "Dashboard 개편", "grade": "S", "status": "active",
      "sessions": ["session_104","103","102","101","100"],
      "decisions": ["D-074","D-067","D-060"], "pds": 2 }
    // 5건 동결
  ],
  "roles": [...8건],
  "loaded": true,
  "seed": 42
}

## 갱신 trigger
(§3-2 그대로)
```

### 6-3. 산출물 #6 — bbox-regions.md 골격

```md
# Bbox 비교 영역 정의

## 페이지별 안정 영역 표
(§3-3 표 그대로)

## data-vr-bbox 마킹 가이드
- 모든 안정 영역 컨테이너 최외곽 div에 `data-vr-bbox="<page>-<region>"` 속성 부여
- 예: `<aside data-vr-bbox="home-sidebar">`, `<section data-vr-bbox="upgrade-kpi-grid">`
- bbox 비교 헬퍼: tests/visual/bbox-compare.ts
- tolerance: ±1px

## 페이지별 마킹 위치 (HTML)
- index.html: 6 marker
- dashboard-upgrade.html: 5 marker
- dashboard-ops.html: 3 marker
- topics.html: 4 marker
- growth.html: 4 marker (Phase 4)
- people.html: 2 marker (Phase 4)
```

### 6-4. 산출물 #7 — contrast-lint.config.md 골격

```md
# Contrast Lint Config

## 13 조합 표
(§4-1 표 그대로)

## accent-only 룰
(§4-2 표 그대로)

## 구현 스크립트
- scripts/lint-contrast.ts (신규, Phase 1)
- scripts/lint-accent-only.ts (신규, Phase 1)
- scripts/build.js 진입 시 자동 발동

## FAIL 메시지 spec
(§4-1 출력 형식 그대로)

## 간당값 모니터링
(§4-3 표 그대로)
```

---

## 7. 1024 단일 분기 wireframe 갱신 (rev1 §1-3 4단 wireframe 폐기)

페이지별 mobile/desktop 2 column wireframe.

### 7-1. Home

```
< 1024 (mobile)                           ≥ 1024 (desktop)
┌─[☰]─────────────────┐                  ┌──────┬─────────────────────────────────┐
│ Hero band (96-h)    │                  │ side │ Hero band (120-h)               │
│ ● running           │                  │ 220  │ ● running    [104][87][92]      │
│ [104][87][92] 1col  │                  │ -px  ├─────────────────────────────────┤
├─────────────────────┤                  │      │ Index cards 3col (5 + span)     │
│ Index cards 1col    │                  │ nav  │ ┌─────┐ ┌─────┐ ┌─────┐         │
│ ┌─────┐             │                  │      │ │Dash │ │Grow │ │Peop │         │
│ │ Dash│             │                  │      │ └─────┘ └─────┘ └─────┘         │
│ └─────┘             │                  │      │ ┌─────────┐ ┌─────┐             │
│ ┌─────┐             │                  │      │ │ Records │ │ Sys │             │
│ │ ... │             │                  │      │ └─────────┘ └─────┘             │
├─────────────────────┤                  │      ├─────────────────────────────────┤
│ Recent stack        │                  │      │ Recent 2col (Topics | Decisions)│
└─────────────────────┘                  └──────┴─────────────────────────────────┘
```

### 7-2. Dashboard/Upgrade

```
< 1024                                     ≥ 1024
┌─[☰]─────────────────┐                   ┌──────┬─────────────────────────────────┐
│ [Upgrade][Ops] tab  │                   │ side │ [Upgrade][Ops] second-nav      │
├─────────────────────┤                   │ 220  ├─────────────────────────────────┤
│ filter-bar          │                   │      │ filter-bar (sticky)             │
├─────────────────────┤                   │      ├─────────────────────────────────┤
│ KPI 1col (4 stack)  │                   │      │ KPI 4col                        │
├─────────────────────┤                   │      ├─────────────────────────────────┤
│ Chart 1col          │                   │      │ Chart 2col                      │
└─────────────────────┘                   └──────┴─────────────────────────────────┘
```

### 7-3. Records/Topics (신규 컴포넌트 단독 회귀 페이지)

```
< 1024                                     ≥ 1024
┌─[☰]─────────────────┐                   ┌──────┬─────────────────────────────────┐
│ [Topics][..][..] 5  │                   │ side │ [Topics][Sessions][..] 5tab     │
├─────────────────────┤                   ├──────┼─────────────────────────────────┤
│ filter (status·gr.) │                   │      │ filter-bar (sticky)             │
├─────────────────────┤                   │      ├─────────────────────────────────┤
│ ┌──[topic-card]──┐  │                   │      │ ┌──[topic-card]──────────────┐  │
│ │ topic_082 ... S│  │                   │      │ │ topic_082  Dashboard ...  S│  │
│ │ ─────────────  │  │                   │      │ │ ─────────────────────────  │  │
│ │ chip→→ scroll  │  │                   │      │ │ chip chip chip chip chip → │  │
│ └────────────────┘  │                   │      │ └────────────────────────────┘  │
│ ┌──[topic-card]──┐  │                   │      │ ┌──[topic-card]──────────────┐  │
│ │ ...            │  │                   │      │ │ ...                        │  │
│ └────────────────┘  │                   │      │ └────────────────────────────┘  │
└─────────────────────┘                   └──────┴─────────────────────────────────┘
```

### 7-4. Records/Deferrals

```
< 1024                                     ≥ 1024
┌─[☰]─────────────────┐                   ┌──────┬─────────────────────────────────┐
│ [..][..][Deferr] 5  │                   │ side │ [Decisions][Feedback][Deferr]   │
├─────────────────────┤                   ├──────┼──────────────────┬──────────────┤
│ PD list stack       │                   │      │ PD list (60%)    │ Graph (40%)  │
│ ┌──[pd-card]─────┐  │                   │      │ ┌──[pd-card]──┐  │  ●─→●        │
│ │ PD-034 visual..│  │                   │      │ │ PD-034 ...  │  │   ↓          │
│ └────────────────┘  │                   │      │ └─────────────┘  │  ●─→●        │
├─────────────────────┤                   │      │ ┌──[pd-card]──┐  │              │
│ Graph (360h)        │                   │      │ │ ...         │  │  sticky      │
│ ●─→●                │                   │      │ └─────────────┘  │  560h        │
│ ↓                   │                   │      │                  │              │
│ ●─→●                │                   │      │                  │              │
└─────────────────────┘                   └──────┴──────────────────┴──────────────┘
```

People/Growth/Dashboard-Ops/System wireframe은 vera_rev1 §1-3 골격 그대로 + 1024 단일 분기 적용. 본 갱신본에서 별도 재작성하지 않음 (변경 없음).

---

## 8. 자기감사 (재호출, F. 본문)

### 8-1. vera_rev1 대비 본 갱신본 변경 항목 명시

| 영역 | rev1 | rev2 | 변경 사유 |
|---|---|---|---|
| 반응형 분기 | 4단 | 1단 | Master #11 |
| 사이드바 mobile mode | drawer overlay (≤640) | off-canvas drawer (<1024) 단일 추천 | 1024 단일 분기 정합 |
| VR baseline | 30 (5×6) | 24 (4×6) | Master #12 |
| VR 임계 | 0px+±2% | 0.02 + bbox + 0.2 | false-positive 폭발 회피 |
| VR 환경 spec | 미정 | docker image 핀 + font-rendering 단일 | Arki §7 #7 흡수 |
| WCAG | 표 캡처만 | 자동 lint pipeline + accent-only | Master #10 + Riki R-04 |
| topic-card | spec 있음 | min-height 88 + data-vr-bbox 마킹 추가 | Arki §7 #10 흡수 |
| session-chip-row | spec 있음 | flex-wrap nowrap 명시 + chip 폭 max 80px | rev1 §2-3 명시화 |
| Editor 산출물 | 4건 | 7건 (mock fixture·bbox·contrast lint config 추가) | §3·§4 spec 인계 가능 형태로 박제 |
| nav-item active | α 0.18 + box-shadow 0.30 | α 0.18 + 1px solid border (rev1 §3-4) | rev1 §3-4 정책 그대로 유지 |
| role-signature-card partial | 미정 | `<template>` + build-time inline 단일 추천 | Arki §7 #5 흡수 |

### 8-2. 본 갱신본 신규 결함 자가 적출

| # | 결함 | 영역 | ROI | 대응 |
|---|---|---|---|---|
| V-1 | off-canvas drawer 폭 280px가 360px 미만 화면(예: iPhone SE 320 가로)에서 화면의 87.5% 점유 → backdrop 시각적 영향 약함 | 반응형 | NICE | 320px 이하 viewport는 baseline 외(375 최소). 무대응 |
| V-2 | `data-vr-bbox` 속성을 신규 컴포넌트뿐 아니라 기존 페이지에도 부여해야 → Phase 1·2에서 grep·삽입 작업량 약 30곳 (Dev 인계). 작업량 spec에 부재 | VR 인프라 | SHOULD | §6-3 bbox-regions.md에 마킹 위치 6 페이지 카운트 명시 (총 24 marker)로 흡수 |
| V-3 | mock fixture seed 42 deterministic random이 ECharts 내부 randomness(예: 라벨 placement)까지 잡지 못할 가능성 | VR 데이터 | SHOULD | Phase 2 G2 게이트에서 첫 baseline 캡처 시 ECharts label placement 변동 확인 → 발견 시 fixture에 chart option `animation: false` 추가 PD 박제 |
| V-4 | accent-only lint가 인라인 style attribute(`style="color: var(--c-ace)"`)는 grep으로 잡지만 동적 JS 주입(`element.style.color = ...`)은 못 잡음 | contrast 방어 | NICE | D-003 read-only viewer 정책상 동적 색 주입 가능성 낮음. 발견 시 PD |
| V-5 | desktop 1024~1280 사이는 sidebar 220px + main max 1440 적용 시 main 실폭 804~1060px → KPI 4col이 220px 최소를 못 채워 가로 잘림 가능 | 반응형 | MUST_NOW | KPI grid `repeat(4, minmax(220px, 1fr))` → `repeat(auto-fit, minmax(220px, 1fr))`로 변경 권고. 1024~1280 구간에서 자동 3col fallback |

V-5만 즉시 수정 권고: §2-2 KPI grid spec 갱신.

```
KPI grid (desktop ≥1024): grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))
                          gap: 16px
                          // 1024~1280: 자동 3col / 1280~1660: 3~4col / ≥1660: 4col
```

이 변경으로 Master 원칙 "데스크톱 기준 + 모바일 안 깨짐 (가로 스크롤·텍스트 잘림 0)" 정합 강화.

### 8-3. scopeDriftCheck

rev1 → rev2 변경량: 약 1.15배 (산출물 4 → 7, baseline 30 → 24, 분기 4단 → 1단). 원 spec 1배 내(Master 박제 흡수)이므로 통과. PD 분할 제안 0.

---

## 9. 다음 역할 인계

- **Master** — §1 결정 필요 항목 2건 (partial 로딩 패턴 `<template>` 채택 / Playwright docker image 핀 버전) 1줄 답 부탁. 답 후 G0-4·G0-7 산출물 동결 트리거.
- **Arki (재호출 불필요 시 pass)** — §1 #5·#7·#10 디자인 영역 mitigation 흡수. vr-spec.md §G0-7에 "Phase 4 baseline 추가 시 Phase 2와 동일 docker image 강제" 1줄 + "topics 페이지 baseline은 신규 컴포넌트 적용 후 박음" 1줄 추가.
- **Dev (Phase 1 진입 시)** — §3-1 Playwright config + §4 lint 스크립트 2건(lint-contrast.ts·lint-accent-only.ts) 신규 구현 합의. §6 산출물 7건 인계 받음. `<template>` partial 로딩 패턴 D-feedback-9 합의.
- **Edi (Phase 5)** — §6 산출물 7건 박제 + release notes에 1024 단일 분기·24 baseline·G3 자동 lint 3건 명시.

---

```yaml
# self-scores
tk_drf0: Y
spc_cpl: 0.97
tk_cns: 5
```

(주: `tk_drf0`=Y — 본 갱신본에서 신규 토큰 추가 0, 기존 색·간격·타이포 토큰 변형 0. KPI grid `repeat(4, ...)` → `repeat(auto-fit, ...)`로 변경은 토큰 drift가 아닌 grid 함수 변경이므로 무관. `spc_cpl`=0.97 — rev1 §1-4 8 컴포넌트 + §5 신규 컴포넌트 정밀화 + §6 7 산출물 + §3 환경 spec + §4 lint pipeline 모두 정의됨. 0.03은 Phase 4 진입 후 growth·people 실측 시 보정 여지. `tk_cns`=5 — 8 ROLE_COLORS canonical 단일 출처 + 다크 토큰 단일 + 1024 단일 분기 + accent-only 강제 + 13 조합 자동 lint. drift 0 강화.)
