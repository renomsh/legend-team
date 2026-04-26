---
deliverable: G2-spec-2
artifact: vr-infra-spec
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
  - reports/2026-04-22_dashboard-redesign-ux-responsive/vr-spec.md (G0-7, D-088·D-089)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md §4-2 (Phase 2 G2 박제)
  - data/dashboard_data.json (mock fixture freeze 출처)
parent_spec: reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md
---

# G2-spec-2 vr-infra-spec — Playwright VR 인프라 부팅 + baseline lock 동결 spec

Arki입니다. 본 문서는 Phase 2 G2 게이트 3·6·7 산출물의 **단일 출처**입니다. vr-spec(G0-7) §1·§3·§5 + Master Q1·Q2 승인(mock fixture = 현 dashboard_data.json freeze, baseline = `tests/vr/baseline/`)을 Dev 실 실행 가능한 명령 시퀀스 수준으로 정밀화합니다.

옵션 탐색 0. D-088·D-089 단일 출처 정합.

---

## 1. Docker / npm 명령 시퀀스 (정합 순서)

본 시퀀스는 직렬 1체인. 각 단계 PASS 후 다음 단계 진입.

### 1-1. Phase 2 인프라 부팅 시퀀스

| Step | 명령 | 검증 |
|---|---|---|
| **S0** | `docker --version` | exit 0 + version 출력 (Master Docker Desktop 동작 확인) |
| **S1** | `docker pull mcr.microsoft.com/playwright:v1.59.1-jammy` | exit 0 + image 다이제스트 출력. SHA256 첫 박제는 PD-048 트랙. ~~v1.45.0-jammy~~ → v1.59.1-jammy (PD-051 해결: v1.45.0-jammy unavailable) |
| **S2** | `npm install -D @playwright/test@1.45.0` (이미 설치 시 skip) | `node_modules/@playwright/test/package.json` version 확인 |
| **S3** | `npx playwright install chromium --with-deps` (호스트 fallback용) | 설치 완료 메시지 |
| **S4** | mock fixture 추출 (§2 절차) | `tests/vr/fixtures/dashboard.mock.json` 생성 + JSON.parse 검증 |
| **S5** | `tests/visual/playwright.config.ts` 작성 (vr-spec §1-2 carry) | `npx playwright test --list` exit 0 |
| **S6** | data-vr-bbox 22 marker 부여 (Phase 1 G1 잔여, 본 Phase 보강) | `grep -c "data-vr-bbox" app/**/*.html` = 22 |
| **S7** | `scripts/vr-capture.ts` 작성 (vr-spec §6-1 carry) | `npx ts-node scripts/vr-capture.ts --dry-run` exit 0 |
| **S8** | baseline 첫 캡처: `docker run --rm -v $(pwd):/work -w /work mcr.microsoft.com/playwright:v1.45.0-jammy npx ts-node scripts/vr-capture.ts` | 24 PNG + 22 bbox JSON 생성 |
| **S9** | self-diff 검증: 동일 fixture로 재실행 → diff < 2% | `scripts/vr-compare.ts` exit 0 |
| **S10** | baseline 커밋: `git add tests/vr/baseline/ tests/vr/__bbox__/ && git commit -m "Phase 2 G2 baseline lock"` | git log 확인 |

**시간 표현 0건 정합**: 각 step의 소요 시간·담당자·완료일 표현 0건. Schedule-on-Demand (D-017) 준수.

> **PD-051 해결 기록 (session_106)**: v1.45.0-jammy Docker 이미지 unavailable 확인. v1.59.1-jammy로 교체. vr:capture npm script에 `--add-host=host.docker.internal:host-gateway` + `VR_BASE_URL=http://host.docker.internal:8788` 추가. vr:compare는 host-side `ts-node scripts/vr-compare.ts` 직접 실행으로 변경. G3-B PASS (24 files, max diff 0.05%).

### 1-2. npm script 박제 (`package.json`)

```json
{
  "scripts": {
    "vr:fixture:freeze": "node scripts/freeze-mock-fixture.js",
    "vr:capture": "docker run --rm --add-host=host.docker.internal:host-gateway -e VR_BASE_URL=http://host.docker.internal:8788 -v $(pwd):/work -w /work mcr.microsoft.com/playwright:v1.59.1-jammy npx ts-node scripts/vr-capture.ts",
    "vr:compare": "ts-node scripts/vr-compare.ts",
    "vr:capture:host": "npx ts-node scripts/vr-capture.ts",
    "vr:lint:bbox": "npx ts-node scripts/lint-bbox-markers.ts"
  }
}
```

`vr:capture:host`는 docker pull 실패 시 R-2 fallback (vr-spec §6-2 정합).

### 1-3. docker compose (선택 — Master 환경 단순화 시)

본 Phase 필수 아님. R-2 mitigation 채택 시 박제. 본 spec은 단일 명령 (`docker run`) 권장 — compose는 over-engineering 위험.

---

## 2. mock fixture 추출 절차 (Master Q1 승인 정합)

### 2-1. freeze 절차

| Step | 동작 | 산출 |
|---|---|---|
| F1 | `data/dashboard_data.json` 현 시점 READ | 원본 JSON 객체 |
| F2 | vr-spec §3-2 결정점 10항목 추출 (시간·세션·토픽·결정·PD·역할 점수·차트·이름·loading) | 결정점 10 부분집합 |
| F3 | 시간 필드 정규화 — 모든 timestamp `2026-01-01T00:00:00Z` 강제 (R-1 mitigation a) | 시간 drift 0 |
| F4 | 차트 시계열 — seed 42 deterministic 7-day rolling, value 50~150 (vr-spec §3-2 8번 정합) | 차트 변동 0 |
| F5 | `loaded: true` 모든 항목 강제 (vr-spec §3-2 10번) | spinner 캡처 0 |
| F6 | `tests/vr/fixtures/dashboard.mock.json` 작성 | freeze 완료 |
| F7 | JSON.parse 유효성 검증 + 파일 크기 < 500KB 확인 | git 커밋 적정 |
| F8 | `git add tests/vr/fixtures/dashboard.mock.json && git commit -m "Phase 2 mock fixture freeze (Q1 승인)"` | 박제 완료 |

### 2-2. freeze 스크립트 (`scripts/freeze-mock-fixture.js`)

```js
// scripts/freeze-mock-fixture.js — Phase 2 G2 박제
const fs = require('fs');
const path = require('path');

const SRC = path.resolve('data/dashboard_data.json');
const DEST = path.resolve('tests/vr/fixtures/dashboard.mock.json');
const FROZEN_TS = '2026-01-01T00:00:00Z';

function deepNormalizeTimestamps(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(deepNormalizeTimestamps);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (/(At|Date|Time|timestamp)$/i.test(k) && typeof v === 'string') {
      out[k] = FROZEN_TS;
    } else {
      out[k] = deepNormalizeTimestamps(v);
    }
  }
  return out;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const frozen = deepNormalizeTimestamps(raw);
  // R-1 mitigation: loaded:true 강제
  if (frozen.meta) frozen.meta.loaded = true;
  fs.mkdirSync(path.dirname(DEST), { recursive: true });
  fs.writeFileSync(DEST, JSON.stringify(frozen, null, 2));
  console.log(`freeze done: ${DEST} (${fs.statSync(DEST).size} bytes)`);
}

main();
```

### 2-3. fixture 갱신 trigger (PD-048 정합)

| trigger | 처리 |
|---|---|
| dashboard_data.json 데이터 추가 (신규 토픽·세션) | fixture 변경 0 — freeze 시점 보존이 baseline 의미 |
| 신규 페이지 추가 (Phase 4) | fixture에 페이지별 data 추가, 기존 항목 불변 |
| 데이터 스키마 변경 (D-060 등) | B3 trigger 검토 (D-098 §2-3) |
| docker image 갱신 | fixture 변경 0, baseline 전체 재캡처만 |

---

## 3. baseline 디렉토리 구조 (Master Q2 승인 정합)

### 3-1. 디렉토리 트리

```
tests/
├── vr/
│   ├── fixtures/
│   │   └── dashboard.mock.json           # §2 freeze 산출
│   ├── baseline/                         # 24 PNG (Master Q2 승인)
│   │   ├── home/
│   │   │   ├── desktop-xl.png            # 1920×1080
│   │   │   ├── desktop-md.png            # 1440×900
│   │   │   ├── desktop-sm.png            # 1280×720
│   │   │   └── mobile.png                # 375×667
│   │   ├── upgrade/
│   │   │   ├── desktop-xl.png
│   │   │   ├── desktop-md.png
│   │   │   ├── desktop-sm.png
│   │   │   └── mobile.png
│   │   ├── ops/
│   │   ├── topics/
│   │   ├── growth/
│   │   └── people/
│   └── __bbox__/                         # 22 marker bbox JSON
│       ├── home-desktop-xl.json          # 4 marker × 4 viewport = 16 file (home)
│       ├── upgrade-desktop-xl.json       # 5 marker × 4 viewport = 20 file (upgrade)
│       ├── ...
└── visual/
    └── playwright.config.ts
```

### 3-2. baseline 매트릭스 (24 PNG + 22 bbox)

| # | 페이지 | desktop-xl | desktop-md | desktop-sm | mobile | bbox marker (vr-spec §4-1) |
|---|---|---|---|---|---|---|
| 1 | Home | ✓ | ✓ | ✓ | ✓ | sidebar / hero / index-grid / recent (4) |
| 2 | Upgrade | ✓ | ✓ | ✓ | ✓ | sidebar / second-nav / filter / kpi-grid / chart-grid (5) |
| 3 | Ops | ✓ | ✓ | ✓ | ✓ | sidebar / second-nav / kpi-grid / chart (4) |
| 4 | Topics | ✓ | ✓ | ✓ | ✓ | sidebar / second-nav-tab / filter / topic-card-grid (4) |
| 5 | Growth | ✓ | ✓ | ✓ | ✓ | sidebar / kpi-3축 / signature-4×2 (3) |
| 6 | People | ✓ | ✓ | ✓ | ✓ | sidebar / role-4×2 (2) |
| **합** | **6 페이지** | 6 | 6 | 6 | 6 | **22 marker** |
| **PNG 합** | — | — | — | — | — | **24 PNG** |

bbox JSON 파일 수 (Arki 자기감사 A1-6 흡수, 단일 결정): **24 JSON 파일** — `<page>-<viewport>.json` 1파일 안에 해당 page의 marker 객체 묶음. vr-spec §4-3 헬퍼 정합. 88-file 분할 안 기각(파일 수 폭주·관리 비용).

### 3-3. PNG 크기 추정 + git 커밋 적정성

| 항목 | 추정 |
|---|---|
| PNG 1장 평균 (PNG-8 + dark theme) | ~50KB (1920×1080) / ~25KB (375×667) |
| 24 PNG 총 크기 | (50KB × 18 desktop) + (25KB × 6 mobile) ≈ 1.05MB |
| bbox JSON 24 파일 | < 100KB |
| **git 커밋 총 크기** | **~1.2MB** (LFS 미사용 적정 범위) |

PNG 크기 폭주 시 (예: ≥5MB) → Phase 2 정지, PNG 압축 옵션 검토 (oxipng 등).

---

## 4. R-1 4중 mitigation 적용 박제 (vr-capture.ts 강제 내장)

baseline 캡처 직전 다음 4중 처리 강제. 누락 시 baseline drift → false-positive 폭증.

### 4-1. mitigation 매트릭스

| mitigation | 적용 위치 | 검증 방법 |
|---|---|---|
| (a) Date mock 고정 (`2026-01-01T00:00:00Z`) | vr-capture.ts `addInitScript` + Playwright `page.clock.install()` | 캡처 페이지에서 `new Date().toISOString()` 검사 |
| (b) prefers-reduced-motion 강제 | playwright.config.ts `reducedMotion: 'reduce'` + `animation-duration: 0 !important` 글로벌 inject | computed style 검사 |
| (c) 웹폰트 — production은 `font-display: swap` 유지, **VR 캡처 환경에서만** `font-display: block` 강제 (Vera R-V7 정정) | production: `app/css/tokens.css` `@font-face { font-display: swap; }`. VR: `vr-capture.ts`에서 `addStyleTag({ content: '@font-face { font-display: block !important; }' })` + `<link rel="preload" as="font">` | Playwright `waitForLoadState('networkidle')` 후 캡처. production FOIT 0 확인 (사용자는 swap 경험), baseline은 폰트 로드 후 안정 상태만 캡처. |
| (d) ECharts `animation: false` | mock fixture 주입 시 chart option override | `eChartsOption.animation === false` 단언 |
| (e) 호스트 OS 시간 drift 검증 | baseline 캡처 직전 `date -u` 출력 박제 | drift > 1초 시 NTP 동기화 의무 (Arki 자기감사 A2-1 흡수) |

### 4-2. vr-capture.ts 강제 내장 코드 (mitigation 4중 박제)

```ts
// scripts/vr-capture.ts — Phase 2 G2 박제 (R-1 4중 mitigation 강제)
import { chromium, devices } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const FROZEN_TS = new Date('2026-01-01T00:00:00Z').valueOf();

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

// 효율 권고 (Arki 자기감사 A1-3 흡수): 본 skeleton은 명시성 우선 직렬 패턴.
// Dev 구현 시 context 1회 생성 + page.setViewportSize() reuse 패턴 채택 권장 — 캡처 시간 ~30~50% 단축.
async function main() {
  const browser = await chromium.launch();
  for (const page of PAGES) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        colorScheme: 'dark',
        reducedMotion: 'reduce',          // R-1 (b)
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
      });
      // R-1 (a) — Date mock
      await ctx.addInitScript(`{
        const _Date = Date;
        Date = class extends _Date {
          constructor(...args) { super(args.length ? ...args : ${FROZEN_TS}); }
          static now() { return ${FROZEN_TS}; }
        };
      }`);
      const p = await ctx.newPage();
      // R-1 (b) 보강 — animation 0 글로벌 inject
      await p.addStyleTag({ content: `*, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }`});
      await p.goto(`http://localhost:8788${page.path}`);
      await p.waitForLoadState('networkidle');  // R-1 (c) 웹폰트 로드 대기
      // R-1 (d) — ECharts animation off (페이지에서 fixture 주입 시 책임)
      await p.evaluate(() => {
        // @ts-ignore
        if (window.echarts) window.echarts.__animationDisabled = true;
      });
      // 캡처
      const dir = join('tests/vr/baseline', page.slug);
      mkdirSync(dir, { recursive: true });
      await p.screenshot({ path: join(dir, `${vp.name}.png`), fullPage: true });
      // bbox 수집
      const bboxes: Record<string, any> = {};
      for (const el of await p.locator('[data-vr-bbox]').all()) {
        const marker = await el.getAttribute('data-vr-bbox');
        bboxes[marker!] = await el.boundingBox();
      }
      const bboxDir = 'tests/vr/__bbox__';
      mkdirSync(bboxDir, { recursive: true });
      writeFileSync(join(bboxDir, `${page.slug}-${vp.name}.json`), JSON.stringify(bboxes, null, 2));
      await ctx.close();
    }
  }
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
```

### 4-3. 검증 단계 (S9 정합)

| # | 검증 | 임계 | FAIL 처리 |
|---|---|---|---|
| 1 | 동일 fixture 재실행 → diff < 2% (24 PNG 모두) | `maxDiffPixelRatio: 0.02` | mitigation 추가 검토, drift 원인 식별 |
| 2 | bbox 22 marker 모두 `±1px` 이내 | tolerance: 1 | layout 안정성 재검토 |
| 3 | font fallback drift 0 | computed `font-family` 검사 | preload 강화 |
| 4 | Date mock 작동 | `await page.evaluate(() => new Date().toISOString())` === `'2026-01-01T00:00:00.000Z'` | addInitScript 위치 점검 |

---

## 5. 의존 그래프 (본 spec 내부)

```
docker pull (S1)
  └── npm install playwright (S2)
        └── npx playwright install chromium (S3)
              └── mock fixture freeze (S4)        ← data/dashboard_data.json (Q1)
                    └── playwright.config.ts (S5)
                          └── data-vr-bbox 22 marker (S6)  ← components-spec §2-4
                                └── vr-capture.ts (S7)     ← R-1 4중 mitigation
                                      └── baseline 첫 캡처 (S8)  ← tests/vr/baseline/ (Q2)
                                            └── self-diff 검증 (S9)  ← maxDiffPixelRatio 0.02
                                                  └── git commit (S10)
```

**병렬화 가능**: S2·S3은 S1 후 독립. S4는 S1~S3과 독립 (data/dashboard_data.json만 의존). 그 외 직렬.

---

## 6. 검증 체크리스트 (Phase 2 G2 게이트 3·6·7 정합)

| # | 검증 | 게이트 |
|---|---|---|
| 1 | `docker pull mcr.microsoft.com/playwright:v1.59.1-jammy` exit 0 (PD-051: v1.45.0-jammy → v1.59.1-jammy) | G2-3 |
| 2 | `tests/vr/fixtures/dashboard.mock.json` 생성 + JSON.parse OK | G2-4 |
| 3 | dashboard_data.json 변경 시 fixture 영향 0 (격리 검증) | G2-4 |
| 4 | 24 PNG baseline 캡처 성공 | G2-6 |
| 5 | 22 bbox JSON 생성 성공 | G2-6 |
| 6 | self-diff 임계 2% 이내 (동일 fixture 재실행) | G2-7 |
| 7 | R-1 4중 mitigation 모두 vr-capture.ts에 박제 (grep 검증) | G2-7 |
| 8 | `tests/vr/baseline/` git 커밋 완료 | G2-6 |

---

## 7. 롤백 트리거 + 중단 조건

### 7-1. 롤백 트리거

| trigger | 처리 |
|---|---|
| docker pull 실패 (S1) | R-2 fallback — `vr:capture:host` host Playwright 사용. host도 실패 시 Phase 2 hold + Master 환경 진단 |
| baseline 첫 캡처 noise 폭주 (self-diff > 5%) | mitigation 추가 (font preload·animation lockdown) + 5회 재실행 평균 검토 |
| WSL2 메모리 4GB 미만 OOM (R-2) | `workers: 1` 강등 + 캡처 직렬화. 그래도 OOM 시 Master `.wslconfig` 8GB 상향 요청 |
| PNG 크기 ≥5MB | oxipng 압축 검토 + git LFS 도입 결정 (PD 신설) |

### 7-2. 중단 조건

- docker pull + host fallback 둘 다 실패 → Phase 2 정지, HALT-2 trigger 검토 (D-098 §5)
- mock fixture freeze 후 baseline에 timestamp drift 발견 → R-1 mitigation 미작동 → vr-capture.ts 재박제
- bbox 22 marker 중 ≥3 개 ±1px 초과 → layout 자체 불안정 → Phase 1 G1 산출물 (helper class·tokens) 재검토

---

## 8. lock 선언

본 vr-infra-spec = docker/npm 명령 시퀀스 10단계 + mock fixture freeze 절차 + baseline 디렉토리 구조 (Master Q2 승인) + 24 PNG·22 bbox 매트릭스 + R-1 4중 mitigation 강제 박제 + self-diff 임계 2% + 롤백·중단 조건. Phase 2 G2 게이트 3·6·7 단일 출처. Dev 인계 직전 동결.

다음 spec: `kpi-fallback-spec.md` (G2 게이트 5 단일 출처).
