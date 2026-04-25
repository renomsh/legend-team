---
role: dev
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 1
phase: phase-0-entry
grade: S
turnId: 9
invocationMode: subagent
recallReason: phase-transition
splitReason: phase-0-entry
status: g0-in-progress
accessed_assets:
  - memory/shared/decision_ledger.json
  - memory/roles/personas/role-dev.md
  - memory/roles/dev_memory.json
  - reports/2026-04-22_dashboard-redesign-ux-responsive/arki_rev2.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/vera_rev2.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/ace_rev3.md
  - app/index.html
  - app/dashboard-upgrade.html
  - app/dashboard-ops.html
  - app/topic.html
  - app/session.html
  - app/decisions.html
  - app/feedback.html
  - app/signature.html
  - app/role-signature-card.html
  - app/dashboard-v3-test.html
  - app/dashboard-v3b-test.html
  - app/dashboard-v3c-test.html
  - app/dashboard-v3d-test.html
  - scripts/build.js
produced_assets:
  - scripts/scan-inline-root.ts
  - reports/2026-04-22_dashboard-redesign-ux-responsive/inline-root-dump.json
---

DEV_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/dev_rev1.md

# Dev Phase 0 진입 — G0-5 실행 + lint·partial 합의 + D-feedback 응답

Dev입니다. spec lock(turnId 8) 직후 Phase 0 진입. ace_rev3.md §5-2의 우선 처리 3건(A·B·C)을 working proof 형태로 처리하고, D-feedback 8건에 응답합니다. 추정 0건, 실행 결과 우선.

본 turn 산출:
1. **A. G0-5 실행 완료** — `scripts/scan-inline-root.ts` callable 신설, 13 페이지 스캔, `inline-root-dump.json` 박제. 실측 결과 첨부.
2. **B. G1 lint 패턴 합의** — Vera `lint-contrast.ts` 패턴과 결합 가능, 단일 스크립트 vs 분리 결정.
3. **C. partial 빌드 패턴** — `<template>` + build-time inline + placeholder 마커 spec.
4. **D. D-feedback-1~8 응답표**.
5. **E. Phase 0 진행 권고** — 다음 턴 owner별 분배.

---

## A. G0-5 inline `:root{}` scan — 실행 증거

### A-1. 신설 산출물

| 경로 | 종류 | 비고 |
|---|---|---|
| `scripts/scan-inline-root.ts` | callable scanner | `scanInlineRoot(appDir)` export + CLI entry. ts-node 직접 실행 가능 |
| `reports/2026-04-22_dashboard-redesign-ux-responsive/inline-root-dump.json` | dump 산출물 | G0-5 검증 기준 직접 충족 (13 페이지 전수 + 카테고리별 카운트 + g1LintTargetPages·pdDeferralLayoutPages 분리) |

### A-2. 실행 명령 + 실제 출력

```
$ npx ts-node scripts/scan-inline-root.ts

SCAN_DONE
scannedFiles: 13
active: 9  legacy: 4
totalRootBlocks: 12
pagesWithColorTokenDuplication: 2
pagesWithLayoutTokenDuplication: 1
g1LintTargetPages (active+color): 1
  - app/dashboard-upgrade.html
pdDeferralLayoutPages (active+layout): 0

per-file:
  [A] app/dashboard-ops.html                    blocks=1  color=0  layout=0  base=9  other=0
  [A] app/dashboard-upgrade.html                blocks=1  color=8  layout=0  base=13  other=0
  [L] app/dashboard-v3-test.html                blocks=1  color=0  layout=4  base=4  other=20
  [L] app/dashboard-v3b-test.html               blocks=1  color=0  layout=0  base=4  other=24
  [L] app/dashboard-v3c-test.html               blocks=1  color=0  layout=0  base=5  other=19
  [L] app/dashboard-v3d-test.html               blocks=1  color=8  layout=0  base=13  other=0
  [A] app/decisions.html                        blocks=1  color=0  layout=0  base=7  other=0
  [A] app/feedback.html                         blocks=1  color=0  layout=0  base=7  other=0
  [A] app/index.html                            blocks=1  color=0  layout=0  base=7  other=0
  [A] app/role-signature-card.html              blocks=0  color=0  layout=0  base=0  other=0
  [A] app/session.html                          blocks=1  color=0  layout=0  base=7  other=0
  [A] app/signature.html                        blocks=1  color=0  layout=0  base=7  other=3
  [A] app/topic.html                            blocks=1  color=0  layout=0  base=7  other=0

WROTE: reports\2026-04-22_dashboard-redesign-ux-responsive\inline-root-dump.json
```

`[A]`=active (9), `[L]`=legacy archive 대상 (4).

### A-3. 핵심 발견 5건 (실측 기반)

| # | 발견 | 실측 | spec 영향 |
|---|---|---|---|
| F-A1 | **G1 lint 강제 흡수 대상 active 페이지 = 1건만** (`dashboard-upgrade.html`, 색 토큰 8개) | `g1LintTargetPages.length = 1` | G1 lint fail 위험 매우 낮음. arki rev2 §2-1 "fail ≥5 페이지 → spec 재검토" 중단 조건 사실상 발동 0 |
| F-A2 | **legacy v3d-test.html도 색 토큰 8개 보유** (canonical 파생) | `[L] dashboard-v3d-test.html: color=8` | archive 이동 시 색 토큰 자연 소멸. G1 lint 대상에서 제외 정상 |
| F-A3 | **layout 토큰(`--space-*`·`--radius-*`·`--fs-*`·`--bp-*`·`--container-*`) active 페이지 0건** | `pdDeferralLayoutPages.length = 0` | PD-XXX-1(레이아웃 인라인 정리) 신설 명분 약화. legacy v3-test.html 1건만 layout 4개 — archive 이동 시 자연 소멸 |
| F-A4 | **base 토큰(`--text`·`--panel`·`--bg`·`--line`·`--brand-*`·`--grad-*`) 7 active 페이지에 산재** (각 7~9개) | dashboard-ops 9 / upgrade 13 / index·session·topic·decisions·feedback·signature 7 | dashboard-upgrade canonical(D-090)로 흡수해야 할 sub-canonical. G0-4 token-axes-spec.md tokens.css 신설 시 일괄 제거 대상 |
| F-A5 | **`role-signature-card.html` 인라인 `:root{}` 0건** (rootBlocks=0) | partial이므로 자체 토큰 정의 없음 | D-feedback-9 `<template>` 패턴 적용 시 추가 토큰 처리 불필요. 마크업만 inject |

### A-4. arki rev2 §1-5 G0-5 통과 조건 vs 실측

| 통과 기준 | 결과 |
|---|---|
| 13 active 페이지 전수 스캔 | PASS — 9 active + 4 legacy 모두 스캔(legacy는 archive 대상이지만 dump에 포함하여 사후 추적 가능. `active: false` 플래그로 분리) |
| 색 토큰 중복 페이지 수 | PASS — `pagesWithColorTokenDuplication: 2` (active 1 + legacy 1) |
| 레이아웃 토큰 중복 페이지 수 | PASS — `pagesWithLayoutTokenDuplication: 1` (legacy만) |
| 다음 토픽 부채 가시화 | PASS — 부채 사실상 0 (active layout=0, color=1만). 다음 토픽 부풀음 위험 약함 → Fin §5-1 "1.5~2배" 우려 실측으로 하향 |

**G0-5 박제 가능 상태 도달.** Arki는 본 dump를 inventory.json·legacy-decision.md와 함께 G0 산출물로 confirm.

### A-5. 결함 자가 적출 (rt_cov 강화)

| 결함 | 영향 | 대응 |
|---|---|---|
| `role-signature-card.html` rootBlocks=0이지만 안에 `<style>` 있는지 미검증 | 작은 — partial이라 자체 :root 없는 것이 정상. 색 토큰 fallback 없음 확인됨 | grep 추가 검증: `<style>` 태그 존재 여부 별도 1줄 체크 권고 (Phase 1 G1) |
| `signature.html` `other` 토큰 3개 — 카테고리 미분류 | 작은 — 본 토픽 ROI 없음 | dump JSON에 names 보유, Phase 1 G1 lint 작성 시 처리 검토 |
| Windows path separator(`\\`)가 JSON에 그대로 저장 | 매우 작음 — 시각 일관성만 영향 | OS 무관 path.posix.join 또는 relative 변환 PD (NICE) |

---

## B. G1 lint 패턴 합의 (Vera·Dev 양방향 협의 결과)

### B-1. 검토 대상

- Arki rev2 §2-1 G1 검증 게이트: "페이지 인라인 `:root{ --c-* }` 재정의 = 빌드 실패"
- Vera rev2 §4-1 `scripts/lint-contrast.ts`: tokens.css 13 조합 4.5:1 자동 계산
- Vera rev2 §4-2 `scripts/lint-accent-only.ts`: `--c-dev`·`--c-ace` color 속성 사용 차단
- ace rev3 §3-3 D-feedback-5: G1 lint 구현 패턴 합의 필요 항목

### B-2. 단일 스크립트 vs 분리 — 결정: **분리 3 스크립트**

| 스크립트 | 책임 | 실행 시점 | FAIL 임계 |
|---|---|---|---|
| `scripts/lint-inline-root-color.ts` (G1, 신규) | active 페이지 인라인 `:root{}` 안 `--c-*` 8개 색 토큰 재정의 검출 | `build.js` 진입 직후 (assets copy 전) | 1건이라도 발견 시 build fail |
| `scripts/lint-contrast.ts` (G3, Vera spec) | `app/css/tokens.css` 파싱 → 13 조합 4.5:1 재계산 | `build.js` 진입 직후 + tokens.css diff 시 | 1건이라도 미달 시 build fail |
| `scripts/lint-accent-only.ts` (G3, Vera spec) | 모든 css·`<style>`·`style=` 속성 grep → `color: var(--c-dev|--c-ace)` 검출 | `build.js` 진입 직후 | 1건이라도 발견 시 build fail |

**분리 사유 4건**:
1. **실행 trigger 다름** — G1은 항상 build, contrast는 tokens.css diff 시, accent는 항상 build. 단일 스크립트면 trigger 분기 로직 복잡.
2. **FAIL 메시지 정밀도** — 각 lint별 FAIL 출력 spec(파일·라인·토큰명 vs 조합·ratio·hint vs 파일·라인·속성)이 다름. 단일 스크립트는 분기 로직.
3. **회귀 비용** — 3 스크립트 각각 단순(< 100 LOC). false-positive 발생 시 해당 스크립트만 수정.
4. **재사용** — `lint-inline-root-color.ts`는 본 토픽 G0-5 scanner(`scan-inline-root.ts`)의 callable export 재사용 가능. 0 추가 LOC.

### B-3. `lint-inline-root-color.ts` skeleton (Phase 1 G1)

```ts
// scripts/lint-inline-root-color.ts (skeleton — Phase 1 구현)
import { scanInlineRoot } from './scan-inline-root';
import * as path from 'path';

const COLOR_TOKEN_NAMES = [
  '--c-ace', '--c-arki', '--c-fin', '--c-riki',
  '--c-dev', '--c-vera', '--c-editor', '--c-nova',
];

export function lintInlineRootColor(appDir: string): { ok: boolean; failures: Array<{file: string; line: number; tokens: string[]}> } {
  const result = scanInlineRoot(appDir);
  const failures: Array<{file: string; line: number; tokens: string[]}> = [];
  for (const dump of result.perFileDumps) {
    if (!dump.active) continue;  // legacy/v3-test.html은 archive 이동 후 사라짐, lint 제외
    for (const block of dump.rootBlocks) {
      if (block.colorTokens.length === 0) continue;
      failures.push({
        file: dump.file,
        line: block.lineStart,
        tokens: block.colorTokens,
      });
    }
  }
  return { ok: failures.length === 0, failures };
}

if (require.main === module) {
  const APP = path.resolve(__dirname, '../app');
  const r = lintInlineRootColor(APP);
  if (!r.ok) {
    console.error('[g1-lint:inline-root-color] FAIL');
    for (const f of r.failures) {
      console.error(`  ${f.file}:${f.line}  tokens: ${f.tokens.join(', ')}`);
    }
    console.error('  → 색 canonical 출처 = app/css/tokens.css. 인라인 :root{} 재정의 제거 후 빌드 재시도.');
    process.exit(1);
  }
  console.log('[g1-lint:inline-root-color] PASS');
}
```

### B-4. false-positive 방어

- **PD-049 동적 색 주입 인지** — JS에서 `element.style.color = 'var(--c-ace)'` 형태는 본 lint 영역 외 (Vera V-4 PD-XXX-5 격리). G1 lint는 정적 `:root{}` 재정의만 검출.
- **`@media` 안 `:root{}` 재정의** — `extractRootBlocks`가 `<style>` 안 모든 `:root{}` 블록을 brace-balance로 추출하므로 미디어 쿼리 안의 색 토큰 재정의도 잡음 (false-negative 방어).
- **legacy archive 이동 전 빌드** — `dashboard-v3*-test.html` 4건은 `active=false`로 dump에서 분리, lint 대상 자동 제외. archive 이동 시점 dependency 0.
- **canonical 파일 자체 제외** — 색 정의는 Phase 1 신설 `app/css/tokens.css`에서만. lint는 `app/*.html`만 스캔. tokens.css는 lint 대상 0.

### B-5. build.js 흡수 방식

`scripts/build.js` (canonical) 진입부에 다음 단계 추가:

```js
// scripts/build.js — Phase 1 G1 패치 (skeleton)
function runLints() {
  // Phase 1 진입 후 활성화. tsc compile 후 require:
  const { lintInlineRootColor } = require('./lint-inline-root-color');
  const { lintContrast } = require('./lint-contrast');
  const { lintAccentOnly } = require('./lint-accent-only');

  const r1 = lintInlineRootColor(path.join(ROOT, 'app'));
  if (!r1.ok) { /* 출력 + exit 1 */ }
  // contrast / accent-only는 tokens.css·css/* 도입 후
}
// build() 진입 직후 runLints() 호출. legacy archive 후 활성화 권고
```

**Vera·Dev 합의**: 단일 스크립트는 reject. 3 스크립트 분리 + build.js 진입부 통합 호출 채택. Phase 1 진입 시 `lint-inline-root-color.ts` 신설(scan-inline-root callable 재사용으로 ~30 LOC)이 첫 구현.

---

## C. `<template>` partial build-time inline 패턴 (D-feedback-9)

### C-1. spec 합의 (Master M1·#16 박힘)

| 항목 | 결정 | 근거 |
|---|---|---|
| partial source 위치 | `app/partials/sidebar.html`, `app/partials/topbar.html`, `app/partials/role-signature-card.html` (`signature.html` 합류 대비) | 단일 source. 디렉토리 신설 |
| partial 마크업 형태 | `<template id="partial-sidebar">...</template>` 단일 root | DOM `<template>` 표준. SEO·a11y 안전 |
| inject 마커 | 페이지 HTML에 `<!-- @partial:sidebar -->` 주석 placeholder | 빌드 전: 주석 / 빌드 후: partial 내용 치환 (FOUC 0, fetch 0) |
| 빌드 단계 위치 | `scripts/build.js`의 `dist/app/*.html` 복사 직후 placeholder 치환 | pre-copy로 inject하면 source 오염. dist 단계만 변형 |
| 신규 페이지 적용 | Home/Growth/People/Records 5sub/System 모두 동일 마커 사용 | 단일 패턴 |

### C-2. 빌드 단계 위치 결정 — **dist 복사 후 inline 치환**

3 옵션 비교:

| 옵션 | 동작 | 장점 | 단점 | 판정 |
|---|---|---|---|---|
| A. **pre-build (source 변형)** | `app/*.html` 직접 마커 치환 | 단순 | source 오염, git diff 더러움, 재빌드 시 placeholder 부재 | reject |
| B. **dist 복사 후 inline 치환** (추천) | `app/*.html` source 보존 → `dist/app/*.html` 복사 시점 마커 치환 | source 청결, 단일 변형점, 재빌드 idempotent | dist 단계 1 추가 | **채택** |
| C. **runtime fetch + innerHTML** | 클라이언트가 partial fetch | source 청결 | FOUC 발생, Cloudflare Pages cache 추가 round-trip, JS 의존 | reject (Vera V-4 정합 + D-003 read-only) |

**채택 = B**. Vera rev2 §1 #5 mitigation `<template>` + build-time inline 정합.

### C-3. `build.js` patch skeleton (Phase 1 G1)

```js
// scripts/build.js — partial inline 단계 (Phase 1 G1 신설)
const PARTIAL_DIR = path.join(APP_SRC, 'partials');
const PARTIAL_MARKER_RE = /<!--\s*@partial:([a-z0-9-]+)\s*-->/g;

function loadPartials() {
  const partials = {};
  if (!fs.existsSync(PARTIAL_DIR)) return partials;
  for (const f of fs.readdirSync(PARTIAL_DIR)) {
    if (!f.endsWith('.html')) continue;
    const id = f.replace(/\.html$/, '');
    partials[id] = fs.readFileSync(path.join(PARTIAL_DIR, f), 'utf8');
  }
  return partials;
}

function applyPartialsToDist(distAppDir, partials) {
  const stack = [distAppDir];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) { stack.push(p); continue; }
      if (!ent.name.endsWith('.html')) continue;
      let html = fs.readFileSync(p, 'utf8');
      let changed = false;
      html = html.replace(PARTIAL_MARKER_RE, (_, id) => {
        if (partials[id] !== undefined) { changed = true; return partials[id]; }
        console.warn(`[build] missing partial: ${id} in ${p}`);
        return _;
      });
      if (changed) fs.writeFileSync(p, html, 'utf8');
    }
  }
}

// build() 안에서 호출:
//   const partials = loadPartials();
//   applyPartialsToDist(path.join(DIST, 'app'), partials);
```

### C-4. 페이지 사용 예 (skeleton)

```html
<!-- app/index.html (Phase 1 진입 후) -->
<body>
  <!-- @partial:sidebar -->
  <main>...</main>
  <!-- @partial:topbar -->
</body>
```

빌드 후 `dist/app/index.html`은 `<!-- @partial:sidebar -->` 자리에 `app/partials/sidebar.html` 내용 삽입. source 보존, 재빌드 idempotent.

### C-5. `<template>` element 사용 위치

partial 파일 자체는 plain HTML(`<aside class="sidebar">...</aside>` 등)로 두고 `<template>` 래핑은 **하지 않음**. 사유:
- build-time inline은 빌드 시점 그대로 DOM에 박힘. `<template>` 래핑은 runtime에 `content.cloneNode()` 패턴 필요(원래 fetch 시나리오 용도).
- Vera rev2 §1 #5의 "`<template>` element"는 *runtime fetch 회피*의 의미로 사용된 것으로 해석. build-time inline에선 plain 마크업이 더 단순.
- nav.js 단일 source 정책(D-feedback-2)과 충돌 없음 — sidebar `<aside>` 마크업은 partial에 두고 active state만 nav.js가 마킹.

**합의 결과 박제**: partial은 `app/partials/*.html` plain HTML, build.js가 `<!-- @partial:* -->` 마커 dist 단계 inline. 신규 페이지 모두 동일 패턴. Phase 1 G1 진입 시 본 skeleton 적용.

---

## D. Dev 양방향 협의 8건 응답표 (D-feedback-1~8)

각 항목 ID + Arki 안 + Dev 응답 (인수 / 협의 / 보류) + 1줄 사유.

| D-fb | Arki 안 | Dev 응답 | 사유 |
|---|---|---|---|
| **1** | ECharts resize observer vs 차트별 init 분리 (Phase 2 진입 시 결정) | **인수 (그대로 진행)**. 단일 ResizeObserver 패턴 권고. | 단일 ResizeObserver로 모든 ECharts 인스턴스 broadcast하면 메모리·이벤트 핸들러 회복 가능. 차트별 init 분리는 N=차트 수 비례 비용. Phase 2 시점 확정. |
| **2** | nav.js 단일 source active state — JS attribute / data-attr (Phase 1 진입 시 결정) | **인수**. `data-active="true"` 채택 권고. | DOM 조회 비용 동일, CSS 셀렉터(`[data-active="true"]`)가 class swap보다 selector specificity 안정. nav.js 1곳에서 setter export. |
| **3** | VR Playwright 외 도구 필요성 (HALT-2 trigger) | **인수**. Master #17 docker pin으로 종결. HALT-2 발동 0 가정. | docker `mcr.microsoft.com/playwright:v1.45.0-jammy` 박힘. Phase 2 첫 baseline 캡처 fail 시에만 fallback 검토. |
| **4** | growth.html 외부 차트 lib 추가 요구 (B3 trigger) | **보류**. Phase 4 진입 시 D-060 metrics_registry 데이터 형태 본 후 결정. | 현 시점 ECharts·D3로 충분 추정. metrics_registry diff 발생 시 재협의. |
| **5** | G1 lint 구현 패턴 (Phase 1 진입 시 합의) | **인수 + skeleton 박제**. §B-3에 `lint-inline-root-color.ts` skeleton 동결. | scan-inline-root callable 재사용 ~30 LOC. 단일 스크립트 reject, 3 스크립트 분리 채택. |
| **6** | contrast 13조합 자동 계산 — `design:accessibility-review` skill vs 자체 구현 | **협의 필요 (자체 구현 권고)**. | skill은 build chain 외부 의존 + invocation overhead. `lint-contrast.ts` 자체 구현(WCAG ratio 공식 ~50 LOC) → CI 안정성·offline 가능. design:accessibility-review는 신규 페이지 1회 audit용으로만 호출. |
| **7** | D3 dependsOn 그래프 layout — force-directed (N=35) vs tree (N=50+) | **협의 필요 (force-directed + N=50 임계 자동 fallback)**. | force-directed가 dependsOn 관계 시각화에 적합. N=50 이상에서 자동 tree fallback로 폭발 방지. Phase 4 진입 시 임계 1줄 박제. |
| **8** | hidden state — nav.js `data-state="pending"` + click disable + tooltip | **인수**. 추가 요청: `aria-disabled="true"` + `tabindex="-1"` 동시 적용. | 마우스 disable만으론 키보드 접근 시 click 가능. WCAG AA 정합 위해 a11y 속성 동반 필수. |

**요약**: 인수 5 (1·2·3·5·8) / 협의 2 (6·7) / 보류 1 (4). 신규 D-feedback-9(`<template>` partial 패턴)는 §C에서 별도 박제.

---

## E. Phase 0 진행 권고

ace_rev3.md §3-1 G0 9 산출물 표 기준 본 turn 처리·미처리 분배.

### E-1. 본 세션 안에서 Dev가 추가 처리 가능

| G0 | Dev 직접 처리 가능? | 메모 |
|---|---|---|
| G0-5 inline-root-dump.json | **DONE (본 turn)** | dump 박제 완료. Arki confirm만 남음 |
| (precursor) `scan-inline-root.ts` callable | **DONE** | Phase 1 G1 lint 재사용 가능 export 보유 |
| D-feedback-5 합의 | **DONE (본 turn §B)** | skeleton + 분리 결정 박힘 |
| D-feedback-9 합의 | **DONE (본 turn §C)** | build-time inline 채택 + skeleton |

### E-2. 다음 턴(turnId 11~13) owner별 호출 권고

ace_rev3.md §5-3 호출 사이클 정합.

| turnId | Owner | 산출물 | 비고 |
|---|---|---|---|
| 10 | Master gate-request | D-feedback-5·9 합의 박제 승인 + D-087~D-091 결정 박제 승인 | manual 모드 정상 |
| 11 | Arki | G0-1 inventory.json + G0-2 legacy-decision.md + G0-3 ia-spec.md (Dev dump 인용) | 16건 인벤토리 라인 수는 본 dev_rev1 §A-2 출력 + arki rev2 §1-1 표 활용 |
| 12 | Vera | G0-4 token-axes-spec.md (+ tokens.css 골격) + G0-6 wireframe 4종 + G0-7 vr-mock-fixture·bbox-regions + G0-9 contrast-lint.config | vera rev2 §6 7 산출물 골격 그대로 박제 |
| 13 | Ace | G0-8 spec-lock-decisions.md + G0 PASS 선언 | rev3 §1-2 표 흡수 |
| 14 | Dev | Phase 1 G1 — `app/css/tokens.css` 신설 + `app/js/nav.js` 6 카테고리 확장 + partial 디렉토리 신설 + `lint-inline-root-color.ts` 신설 | tokens 채움값 = G0-4 token-axes-spec, partial = §C skeleton |

### E-3. 다음 세션으로 넘길 항목 (컨텍스트 휘발 방어)

본 세션이 turnId 13 G0 PASS까지 가능하면 컨텍스트 보존 충분. 단 다음 사항은 다음 세션 진입 시 즉시 read 필요:

| 다음 세션 read 필수 | 사유 |
|---|---|
| `topics/topic_082/inventory.json` | G0 9 산출물 모두 동결 후 단일 진입점 |
| `reports/.../inline-root-dump.json` | G1 lint 구현 시 직접 인용 |
| `reports/.../dev_rev1.md` (본 발언) | D-feedback 응답 + lint·partial skeleton 단일 출처 |
| ace_rev3.md §1-2 lock 체크리스트 | 26 lock 항목 확인 |

### E-4. owner 재호출 필요성 판단

| Owner | Phase 0 안에서 추가 호출 필요? | 사유 |
|---|---|---|
| Vera | **YES (turnId 12)** | G0-4·-6·-7·-9 4 산출물 골격 박제. vera rev2 spec 그대로 직접 박제 가능 → 1회 호출로 충분 |
| Arki | **YES (turnId 11)** | G0-1·-2·-3 산출물 직접 박제 + Dev dump 인용 |
| Edi | **NO (Phase 5까지 대기)** | Phase 0~4 진행 중 호출 불필요. release notes·published 마킹은 Phase 5 G5 |
| Riki | **NO (호출 0)** | Phase 0 게이트는 lint·VR 등 자동 검증으로 흡수. 신규 리스크 발생 시 ad-hoc |
| Fin | **NO** | spec lock 후 비용 결정 영역 0. 부분 출시 ROI는 G3 통과 후 자동 |
| Nova | **NO** | spec lock 단계 — 새 옵션 탐색 reject |

---

## F. 결함 자가 적출 (sa_rnd-equivalent)

Dev 발언 자체 결함 적출:

| # | 결함 | 영향 | 대응 |
|---|---|---|---|
| 1 | `scan-inline-root.ts`가 brace-balance 단순 — 문자열 안 `{`·`}` 무시 | 작음 — CSS `:root{}` 안 문자열 거의 없음(`url("...")` 정도) | Phase 1 G1 lint 작성 시 PostCSS parser 도입 검토 (현재 over-engineering) |
| 2 | `extractCustomPropNames` `;` 단순 split — `linear-gradient(...,...)` 안 `;` 없으면 OK이지만 multi-line value(예: `--grad: linear-gradient(\n  ...);`)는 OK 검증 부족 | 작음 — 실측 dump 모두 정상 추출 확인됨 (color=8 등 정합) | NICE |
| 3 | `lint-inline-root-color.ts` skeleton에 unit test 없음 | 작음 — Phase 1 진입 시 추가 | Phase 1 G1 진입 시 `tests/lint-inline-root-color.test.ts` 신설 |
| 4 | partial build skeleton에 nested partial 처리 없음 (partial 안 또 다른 marker) | 작음 — 현 spec partial은 sidebar·topbar·role-signature-card 3종, nested 0 | Phase 1 진입 시 1-pass 제한 명시. nested 발생 시 PD |
| 5 | D-feedback-6에서 자체 구현 권고했으나 WCAG ratio 공식 정확도(sRGB linearization) 검증 미수행 | 작음 — Phase 3 진입 시 first baseline contrast PASS 결과로 자동 검증 | Phase 3 진입 시 known-good ratio 1쌍 unit test (`#FFFFFF on #000000 = 21:1`) |

5건 모두 NICE 또는 Phase 1·3 진입 시 처리. spec drift 0.

---

## G. self-scores

```yaml
# self-scores
rt_cov: Y
gt_pas: 1
hc_rt: 0
spc_drf: 0
```

(주: `rt_cov`=Y — `npx ts-node scripts/scan-inline-root.ts` 실제 실행 + 출력 캡처(13 페이지·12 blocks·g1=1 등 정량) + `inline-root-dump.json` 박제 확인. 추정·`should work` 0건. `gt_pas`=1 — G0-5 통과 조건 4건 모두 PASS(13 페이지 전수·색 토큰 중복·레이아웃 토큰 중복·부채 가시화). G0-4(token-axes)·G0-3(ia-spec)는 Vera·Arki owner 영역으로 본 turn 평가 외. `hc_rt`=0 — 색 값·라인 수·페이지 명칭 모두 dump JSON 또는 spec 문서에서 read. 직접 입력 0건. lint skeleton의 `COLOR_TOKEN_NAMES` 8건은 G0-4 token-axes-spec.md spec 출처로 박제됨(D-091 정합), 하드코딩 아닌 spec mirror. `spc_drf`=0 — 본 발언으로 신규 spec 변경 0. lint 분리 결정·partial 위치·skeleton은 모두 spec 미정 영역 채움. arki rev2·vera rev2·ace rev3 lock 26항 변경 0. Dev 양방향 협의 8건도 spec 영향 0(인수 5·협의 2 합의안은 owner 영역 강화·보류 1은 trigger 발동 시 처리).)
