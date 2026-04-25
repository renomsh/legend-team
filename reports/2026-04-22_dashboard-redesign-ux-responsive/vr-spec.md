---
deliverable: G0-7
artifact: vr-spec
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

# G0-7 vr-spec — Visual Regression baseline 환경·매트릭스·fixture 단일 출처

Vera입니다. vera_rev2 §3 spec(24 baseline·docker pin·mock fixture·bbox)을 신규 8 페이지 + Master 박제(D-095 1024 단일 분기·D-089 docker pin)에 정합하도록 재계산·박제합니다.

옵션 비교 0. 단일 추천: **24 baseline 유지** (32로 확장 X — 사유 §2 박제).

---

## 1. Playwright 환경 단일화

### 1-1. docker image 핀

```yaml
# .github/workflows/vr.yml (또는 package.json scripts)
image: mcr.microsoke.com/playwright:v1.45.0-jammy
# 정확 표기:
image: mcr.microsoft.com/playwright:v1.45.0-jammy
```

- **버전**: `v1.45.0-jammy` (D-089 Master 박제, vera_rev2 §3-1)
- **OS**: Ubuntu 22.04 LTS (jammy, image 내장)
- **Browser**: Chromium 단일 (Firefox·WebKit baseline 0)
- **갱신 주기**: PD-048 박제. 분기별 review.

### 1-2. Playwright config

```ts
// tests/visual/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  use: {
    baseURL: 'http://localhost:8788',
    viewport: { width: 1280, height: 800 },   // per-test override
    deviceScaleFactor: 1,                     // PD-049 dpr 2 retina는 별도 baseline
    colorScheme: 'dark',                      // 다크 단일
    reducedMotion: 'reduce',                  // animation 동결
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
    },
  },
});
```

| 환경 변수 | 값 | 사유 |
|---|---|---|
| Playwright image | `mcr.microsoft.com/playwright:v1.45.0-jammy` | font hinting·ICC 일치 |
| viewport | per-test override (4종, §2) | baseline 매트릭스 |
| deviceScaleFactor | 1 | dpr 2 retina는 PD-049 |
| colorScheme | `dark` | 다크 단일 (light theme baseline 0) |
| reducedMotion | `reduce` | transition 0 |
| locale | `ko-KR` | 줄바꿈·숫자 포맷 |
| timezoneId | `Asia/Seoul` | 시각 표시 |
| font-smooth | (기본) | image 내장 정합 |
| caret | `hide` | input caret blink 차단 |

---

## 2. baseline 매트릭스 — 24 vs 32 결정

### 2-1. 단일 추천: **24 baseline 유지**

| 옵션 | baseline 수 | 판정 |
|---|---|---|
| **24 (6 페이지 × 4 viewport)** | 24 | **채택** |
| 32 (8 페이지 × 4 viewport) | 32 | reject |
| 28 (7 페이지 × 4 viewport) | 28 | reject |

**근거 3건**:

1. **Records 5 sub는 동일 wireframe 골격** — G0-6 §5-6에서 단일 wireframe + 5 sub 차이로 압축. VR은 `records/topics.html` 1 페이지로 대표 baseline. 나머지 4 sub는 Phase 4 G4에서 manual visual review만.
2. **System 페이지는 Phase 5 진입 시 박제** — 본 토픽(IA 개편) 핵심은 Home·Dashboard×2·Records·Growth·People = 6 페이지. `system.html`은 운영 dashboard 성격으로 별도 baseline 트랙(PD 신설 가능).
3. **24 baseline = Phase 2 G2 게이트 비용 적정** — 8×4=32은 baseline 갱신·diff review 비용 33% 증가. 신규 8 페이지 모두 동시 baseline 진입 시 false-positive 폭발 위험.

**24 baseline 페이지 6선 + 4 viewport**:

| viewport | width × height | 용도 | 기준 |
|---|---|---|---|
| `desktop-xl` | 1920 × 1080 | 데스크톱 max | 본문 max-width 1440 검증 |
| `desktop-md` | 1440 × 900 | 데스크톱 표준 | KPI 4col 풀 노출 |
| `desktop-sm` | 1280 × 720 | 데스크톱 최소 | KPI auto-fit fallback (3col) 검증 |
| `mobile` | 375 × 667 | 모바일 표준 (iPhone SE) | drawer·1col stack 검증 |

**6 페이지** (baseline 트랙 진입):

| # | 페이지 | 경로 | baseline 수 |
|---|---|---|---|
| 1 | Home | `app/index.html` | 4 |
| 2 | Dashboard/Upgrade | `app/dashboard-upgrade.html` | 4 |
| 3 | Dashboard/Ops | `app/dashboard-ops.html` | 4 |
| 4 | Records/Topics (대표) | `app/records/topics.html` | 4 |
| 5 | Growth | `app/growth.html` (신규) | 4 |
| 6 | People | `app/people.html` (신규) | 4 |
| — | **합** | | **24** |

**baseline 외 페이지** (manual review 트랙):
- `records/sessions.html`·`decisions.html`·`feedback.html`·`deferrals.html` 4건 — 같은 second-nav-tab + 같은 sidebar 골격. 5 sub 변동은 sub-content 영역만이므로 manual visual review로 흡수.
- `system.html` — 운영 dashboard, 본 토픽 외 PD 트랙.

### 2-2. dpr 2 retina (PD-049 별도)

본 spec 외. PD-049 박제: "Phase 5 G5 진입 시 dpr 2 baseline 4건(desktop-md·mobile × 핵심 2 페이지) 추가 검토". 본 토픽 베이스라인 0.

### 2-3. ECharts label fixture (PD-050 연관)

본 spec과 연관:
- §3-2 mock fixture에 ECharts series 데이터 deterministic seed 박제
- 단 ECharts 내부 label placement 알고리즘 변동은 fixture로 제어 불가
- Phase 2 G2 진입 시 첫 baseline 캡처에서 label 변동 0 확인 → 변동 발견 시 PD-050 발동(`animation: false` + `label.position` 강제)

---

## 3. mock fixture data 결정점

### 3-1. fixture 파일 위치

```
tests/fixtures/vr/mock-data.json
```

vera_rev2 §3-2 위치(`tests/visual/fixtures/dashboard_data.fixture.json`)에서 **변경**. 이유: tests 하위 통일(`tests/fixtures/vr/`).

### 3-2. 결정점 10항목

| # | 데이터 카테고리 | 고정값 spec | 사유 |
|---|---|---|---|
| 1 | KPI 숫자 | sessions=`12345` / topics=`87` / decisions=`92` / pds=`12` (5자리 한도) | 자릿수 변동 시 width 변동 → diff |
| 2 | 날짜 표시 | 모든 페이지 `2026-04-25` 단일 | 시각 표시 변동 0 |
| 3 | 세션 ID | `session_104` (현재) + 최근 5건 (`104·103·102·101·100`) | chip-row baseline 일관 |
| 4 | 토픽 ID | 5건 (`topic_082·081·080·079·078`) | 5장 카드 baseline |
| 5 | 결정 ID | 3건 (`D-095·D-089·D-074`) | topic-card decision row baseline |
| 6 | PD ID | 3건 (`PD-046·PD-047·PD-048`) | deferrals 페이지 baseline |
| 7 | 역할 점수 (signature) | 8 역할 단일 점수 (`Ace=4.6 / Arki=4.4 / Fin=4.2 / Riki=4.5 / Nova=3.8 / Dev=4.7 / Vera=4.6 / Edi=4.0`) | growth·people baseline |
| 8 | 차트 데이터 (시계열) | seed 42 deterministic, 7-day rolling, value 범위 50~150 | ECharts canvas baseline |
| 9 | 사용자 이름·아바타 | 8 역할 (이미지 없음, 색·이니셜만) | 변동 0 |
| 10 | Loading state | 모든 fixture에 `loaded: true` 강제 | spinner 캡처 0 |

### 3-3. fixture JSON 골격

```json
{
  "kpis": {
    "sessions": 12345,
    "topics": 87,
    "decisions": 92,
    "pds": 12
  },
  "currentSession": "session_104",
  "currentDate": "2026-04-25",
  "topics": [
    {"id":"topic_082","title":"Dashboard 개편","grade":"S","status":"active",
     "sessions":["session_104","session_103","session_102","session_101","session_100"],
     "decisions":["D-095","D-089","D-074"],"pds":2},
    {"id":"topic_081","title":"...","grade":"A","status":"active","sessions":[],"decisions":[],"pds":0},
    {"id":"topic_080","title":"...","grade":"A","status":"closed","sessions":[],"decisions":[],"pds":0},
    {"id":"topic_079","title":"...","grade":"B","status":"closed","sessions":[],"decisions":[],"pds":0},
    {"id":"topic_078","title":"...","grade":"C","status":"closed","sessions":[],"decisions":[],"pds":1}
  ],
  "decisions": [
    {"id":"D-095","title":"1024 단일 분기","date":"2026-04-25"},
    {"id":"D-089","title":"docker pin","date":"2026-04-25"},
    {"id":"D-074","title":"Topic Grade","date":"2026-04-24"}
  ],
  "pds": [
    {"id":"PD-046","title":"dashboard-ops 컴포넌트","status":"open"},
    {"id":"PD-047","title":"semantic state token","status":"open"},
    {"id":"PD-048","title":"docker image 갱신","status":"open"}
  ],
  "roles": [
    {"id":"ace","color":"#8B5CF6","score":4.6},
    {"id":"arki","color":"#06B6D4","score":4.4},
    {"id":"fin","color":"#F59E0B","score":4.2},
    {"id":"riki","color":"#EF4444","score":4.5},
    {"id":"nova","color":"#10B981","score":3.8},
    {"id":"dev","color":"#3B82F6","score":4.7},
    {"id":"vera","color":"#F472B6","score":4.6},
    {"id":"editor","color":"#9CA3AF","score":4.0}
  ],
  "chartSeries": {
    "seed": 42,
    "days": 7,
    "range": [50, 150]
  },
  "loaded": true
}
```

### 3-4. fixture 갱신 trigger

| trigger | 처리 |
|---|---|
| 신규 페이지 추가 (Phase 4) | fixture에 페이지별 data 항목 추가, 기존 항목 불변 |
| KPI 카테고리 변경 | PD 박제 후 fixture 갱신 + baseline 재캡처 |
| 역할 점수 스키마 변경 (D-060) | B3 trigger 발동 검토. fixture roles[] 형태 변경 |
| docker image 갱신 (PD-048) | fixture 변경 0, baseline 전체 재캡처만 |

---

## 4. bbox 비교 영역 정의

### 4-1. 페이지별 안정/동적 영역 표

| 페이지 | 안정 영역 (bbox 검증, ±1px) | 동적 영역 (pixel ratio만) |
|---|---|---|
| Home | sidebar / hero band 외곽 / index card grid 외곽 / recent band 외곽 (4 marker) | hero KPI 숫자 / recent topic chip 내부 |
| Dashboard/Upgrade | sidebar / second-nav / filter-bar / KPI grid 외곽 / chart card 외곽 (5 marker) | KPI 숫자 / chart canvas 내부 |
| Dashboard/Ops | sidebar / second-nav / KPI grid 외곽 / chart canvas 외곽 (4 marker) | KPI 숫자 / chart canvas 내부 |
| Records/Topics | sidebar / second-nav-tab / filter-bar / topic-card grid 외곽 (상위 3 card bbox) (4 marker) | session-chip-row 내부 / decision row text |
| Growth | sidebar / 3축 KPI 외곽 / signature 4×2 외곽 (3 marker) | signature 내 metrics row |
| People | sidebar / role 4×2 외곽 (2 marker) | role card 내 metric row |
| **합** | **22 marker** | — |

### 4-2. `data-vr-bbox` 마킹 가이드

**Phase 1 G1 진입 시 Dev 작업** — 22 marker HTML 부여.

```html
<!-- 예: Home -->
<aside class="sidebar" data-vr-bbox="home-sidebar">...</aside>
<section class="hero" data-vr-bbox="home-hero">...</section>
<div class="index-grid" data-vr-bbox="home-index-grid">...</div>
<div class="recent-band" data-vr-bbox="home-recent">...</div>

<!-- 예: Dashboard/Upgrade -->
<aside data-vr-bbox="upgrade-sidebar">...</aside>
<nav data-vr-bbox="upgrade-second-nav">...</nav>
<div class="filter-bar" data-vr-bbox="upgrade-filter">...</div>
<div class="kpi-grid" data-vr-bbox="upgrade-kpi-grid">...</div>
<div class="chart-grid" data-vr-bbox="upgrade-chart-grid">...</div>
```

마킹 규칙:
- 안정 영역 컨테이너 **최외곽** div에만 부여
- 명명: `{page-slug}-{region}` (kebab-case)
- 동적 영역(차트 canvas·chip 내부)은 마킹 0

### 4-3. bbox 비교 헬퍼

```ts
// scripts/vr-bbox-compare.ts (Phase 2 G2 박제)
import type { Page, Locator } from '@playwright/test';

export async function compareBbox(page: Page, marker: string, expected: BBox, tolerance = 1) {
  const bbox = await page.locator(`[data-vr-bbox="${marker}"]`).boundingBox();
  if (!bbox) throw new Error(`marker not found: ${marker}`);
  const dx = Math.abs(bbox.x - expected.x);
  const dy = Math.abs(bbox.y - expected.y);
  const dw = Math.abs(bbox.width - expected.width);
  const dh = Math.abs(bbox.height - expected.height);
  if (dx > tolerance || dy > tolerance || dw > tolerance || dh > tolerance) {
    throw new Error(`bbox drift: ${marker} dx=${dx} dy=${dy} dw=${dw} dh=${dh}`);
  }
}

export interface BBox { x: number; y: number; width: number; height: number; }
```

baseline bbox는 첫 캡처 시 자동 저장(`tests/visual/__bbox__/<page>-<viewport>.json`).

---

## 5. 임계 기준

| 항목 | 값 | 근거 |
|---|---|---|
| `maxDiffPixelRatio` | 0.02 (2%) | 1920×1080 ≈ 2백만 픽셀 중 4만 픽셀 변동 허용 — 폰트 sub-pixel·gradient 미세 변동 흡수 |
| `threshold` | 0.2 | Playwright 권장. 픽셀 단위 색 차이 (0~1) |
| `animations` | `'disabled'` | toHaveScreenshot 옵션, transition 동결 |
| `caret` | `'hide'` | input caret blink 차단 |
| bbox tolerance | ±1px | anti-alias 흡수 |
| 통과 조건 | 24 baseline 모두 PASS + 22 bbox PASS | Phase 3 G3 게이트 |
| FAIL 시 | diff PNG 자동 생성 → `reports/visual-regression/{date}/` | Edi 인계 가능 형태 |

---

## 6. VR 실행 스크립트 skeleton

### 6-1. baseline 캡처 — `scripts/vr-capture.ts`

Phase 2 G2 진입 시 박제. Dev 인수.

```ts
// scripts/vr-capture.ts
import { chromium } from '@playwright/test';
import { writeFileSync } from 'fs';
import { join } from 'path';

const PAGES = [
  { slug: 'home', path: '/' },
  { slug: 'upgrade', path: '/dashboard-upgrade.html' },
  { slug: 'ops', path: '/dashboard-ops.html' },
  { slug: 'topics', path: '/records/topics.html' },
  { slug: 'growth', path: '/growth.html' },
  { slug: 'people', path: '/people.html' },
];

const VIEWPORTS = [
  { name: 'desktop-xl', width: 1920, height: 1080 },
  { name: 'desktop-md', width: 1440, height: 900 },
  { name: 'desktop-sm', width: 1280, height: 720 },
  { name: 'mobile',     width: 375,  height: 667 },
];

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    deviceScaleFactor: 1,
  });
  for (const p of PAGES) {
    for (const v of VIEWPORTS) {
      const page = await ctx.newPage();
      await page.setViewportSize({ width: v.width, height: v.height });
      await page.goto(`http://localhost:8788${p.path}`);
      await page.waitForLoadState('networkidle');
      const buf = await page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
      writeFileSync(join('tests/visual/__baseline__', `${p.slug}-${v.name}.png`), buf);
      // bbox snapshot
      const bboxes: Record<string, any> = {};
      for (const el of await page.locator('[data-vr-bbox]').all()) {
        const marker = await el.getAttribute('data-vr-bbox');
        bboxes[marker!] = await el.boundingBox();
      }
      writeFileSync(join('tests/visual/__bbox__', `${p.slug}-${v.name}.json`), JSON.stringify(bboxes, null, 2));
      await page.close();
    }
  }
  await browser.close();
}
main();
```

### 6-2. diff 비교 — `scripts/vr-compare.ts`

```ts
// scripts/vr-compare.ts
// 1. baseline PNG vs current PNG : maxDiffPixelRatio 0.02 + threshold 0.2 (pixelmatch lib)
// 2. baseline bbox JSON vs current bbox : ±1px tolerance
// 3. FAIL 시 reports/visual-regression/{date}/ 에 diff png + bbox drift json 출력
// (Phase 2 G2 진입 시 Dev 박제)
```

### 6-3. CI hook

```yaml
# .github/workflows/vr.yml (Phase 2 G2)
on:
  pull_request:
    paths:
      - 'app/**'
      - 'app/css/tokens.css'
jobs:
  vr:
    runs-on: ubuntu-22.04
    container: mcr.microsoft.com/playwright:v1.45.0-jammy
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npx ts-node scripts/vr-compare.ts
```

---

## 7. PD 연관 명시

| PD | 본 spec 관계 |
|---|---|
| **PD-048** docker image 갱신 주기 | 본 spec §1-1 image hash sha256 박제 정책. 갱신 시 baseline 전체 재캡처 |
| **PD-049** dpr 2 retina baseline | 본 spec 외 별도 트랙. Phase 5 G5 진입 시 4건 추가 검토 |
| **PD-050** ECharts label fixture | 본 spec §2-3 연관. Phase 2 G2 첫 baseline에서 label 변동 발견 시 발동 |

---

## 8. self-audit (라운드 +1)

vera_rev2 대비 변경:

| # | 변경 |
|---|---|
| W-A | baseline 24 유지 결정 + 단일 추천 사유 3건 명시 |
| W-B | baseline 6 페이지 + 4 viewport 표 박제 (records/topics 대표 채택) |
| W-C | mock fixture 위치 `tests/fixtures/vr/mock-data.json`로 변경 |
| W-D | mock fixture 결정점 10항목 (vera_rev2 carry + roles signature 점수 + PD 추가) |
| W-E | bbox 22 marker 표 박제 + `data-vr-bbox` 명명 규칙 박제 |
| W-F | `scripts/vr-capture.ts`·`vr-compare.ts` skeleton 박제 |
| W-G | CI hook yml skeleton |

신규 결함 자가 적출:

| # | 결함 | ROI | 대응 |
|---|---|---|---|
| W-G1 | records 5 sub 중 `topics` 1건만 baseline → 다른 4 sub 회귀 검출 약점 | SHOULD | manual visual review 트랙 1줄 박제(§2-1 단서). Phase 4 G4에서 4 sub 캡처 추가 PD 가능 |
| W-G2 | `system.html` baseline 외 → 회귀 검출 0 | NICE | 본 토픽(IA 개편) 핵심 외. 운영 dashboard PD 트랙 분리 |
| W-G3 | 1280 viewport에서 KPI auto-fit 3col → desktop-sm baseline 1건이 fallback 검증 부담 단독 | MUST_NOW | desktop-sm 4 baseline은 모두 fallback 검증 책임. 본 spec 박제로 흡수 — viewport 1280 채택 사유 §2-1에 명시 |
| W-G4 | 24 baseline·22 bbox 합 = Phase 3 G3 게이트에서 46 PASS 필요 — false-positive 1건만 발생해도 게이트 멈춤 | SHOULD | maxDiffPixelRatio 0.02 + threshold 0.2 + bbox ±1px 임계가 false-positive 흡수. 첫 baseline 캡처 시 5회 재실행으로 noise 평균 권고(Phase 2 G2 단계 박제 예정) |

W-G3은 §2-1 표에 desktop-sm 채택 사유 명시 추가됨.

---

## 9. lock 선언

본 G0-7 동결 = 24 baseline 매트릭스 + docker pin + mock fixture 결정점 10 + bbox 22 marker + maxDiffPixelRatio 0.02 박제. Phase 1 G1 인계 항목:

- [ ] `app/` 6 페이지에 `data-vr-bbox` 22 marker 부여 (Dev)
- [ ] `tests/fixtures/vr/mock-data.json` 신규 생성 (Vera 본 spec §3-3 골격 → Dev 채움)
- [ ] `scripts/vr-capture.ts`·`vr-compare.ts` skeleton 박제 (Dev, Phase 2 G2)
- [ ] `tests/visual/playwright.config.ts` skeleton (Dev, Phase 2 G2)
- [ ] CI workflow yml (Dev, Phase 2 G2)

다음 산출물: G0-9 contrast-check.md (본 turn 동시 박제).
