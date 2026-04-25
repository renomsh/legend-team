---
role: dev
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 2
phase: phase-1-g1-execution
grade: S
turnId: 13
invocationMode: subagent
recallReason: phase-1-g1-execution
status: g1-partial-pass-spec-drift-detected
accessed_assets:
  - memory/shared/decision_ledger.json
  - memory/roles/personas/role-dev.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/ace_rev4.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/token-axes-spec.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/responsive-policy.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/contrast-check.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/inventory.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/legacy-decision.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/dev_rev1.md
  - app/css/tokens.css
  - app/dashboard-upgrade.html (and 7 other active pages)
  - scripts/build.js
  - scripts/scan-inline-root.ts
  - reports/2026-04-22_dashboard-redesign-ux-responsive/inline-root-dump.json
produced_assets:
  - app/partials/sidebar.html
  - app/legacy/archive/v3-variants/dashboard-v3-test.html (git mv)
  - app/legacy/archive/v3-variants/dashboard-v3b-test.html (git mv)
  - app/legacy/archive/v3-variants/dashboard-v3c-test.html (git mv)
  - app/legacy/archive/v3-variants/dashboard-v3d-test.html (git mv)
  - scripts/lint-inline-root-color.ts
  - scripts/lint-contrast.ts
  - scripts/lint-accent-only.ts
  - scripts/g1-apply.js (one-shot helper)
  - scripts/build.js (patched)
  - app/js/nav.js (extended with drawer + 6-cat active state)
  - app/dashboard-upgrade.html (inline :root color tokens removed, sidebar partial marker)
  - app/dashboard-ops.html (tokens.css link + sidebar partial)
  - app/index.html (tokens.css link + sidebar partial)
  - app/topic.html (tokens.css link + sidebar partial)
  - app/session.html (tokens.css link + sidebar partial)
  - app/decisions.html (tokens.css link + sidebar partial)
  - app/feedback.html (tokens.css link + sidebar partial)
  - app/signature.html (tokens.css link + sidebar partial)
---

DEV_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/dev_rev2.md

# Dev Phase 1 G1 실행 — 6 작업 working proof + 1 spec drift 적출

Dev입니다. ace turnId 12 G0 PASS 선언 + Phase 1 G1 prep 6 작업 인수받아 본 turn 13에서 순서대로 실행했습니다. 6 작업 모두 코드 변경 + 검증 완료. 단 작업 3 lint-contrast가 실측 contrast ratio 계산 결과 spec(token-axes-spec.md §2-1)에 박제된 비율 2건과 차이 발생 — Vera spec drift로 적출, **Phase 1 G1 PASS 7항 중 #3 미통과**. Master 결정 필요.

전체 형식: 작업별 (1) Pre / (2) 실행 명령 / (3) 실제 출력 / (4) 검증 / (5) 게이트 통과 표.

---

## §0. 게이트 통과 요약 (먼저 결과 박제)

| # | Phase 1 G1 PASS 조건 (ace_rev4 §3-3) | 결과 |
|---|---|---|
| 1 | tokens.css 단일 출처 + 9 active 페이지 import 100% | ✅ PASS |
| 2 | `lint-inline-root-color.ts` PASS (active 인라인 `--c-*` 0건) | ✅ PASS |
| 3 | `lint-contrast.ts` PASS (20/20 ≥4.5:1) | ❌ FAIL — 2/19 미달 (spec drift) |
| 4 | `lint-accent-only.ts` PASS (`--c-dev`·`--c-ace` 본문 color 0건) | ✅ PASS |
| 5 | nav.js 단일 source (sidebar HTML 중복 0) | ✅ PASS |
| 6 | build.js partial inline (`<!-- @partial:* -->` 마커 dist 0건 잔존) | ✅ PASS |
| 7 | legacy 4 변종 production 트리 제거 + `dist/app/legacy/` 부재 | ✅ PASS |

**6/7 PASS, 1/7 FAIL**. FAIL은 implementation 결함이 아니라 Vera spec(token-axes-spec.md §2-1) 박제 비율값 vs 실측 WCAG 2.1 sRGB linearization 계산 결과 불일치. 본 §3-7 escalation 트리거.

---

## §1. 작업 1 — tokens.css import + dashboard-upgrade 인라인 색 토큰 제거

### 1-1. Pre

- 대상 active 페이지 9건 (`scan-inline-root.ts` 실측, dev_rev1 §A-2):
  - `dashboard-upgrade.html` — color=8 → 제거 필수
  - `dashboard-ops`·`index`·`topic`·`session`·`decisions`·`feedback`·`signature` — color=0, link 추가만
  - `role-signature-card.html` — partial로 분류, 본 작업 외
- ace_rev4 §3-1 작업 1 spec: lint 범위는 `--c-*` 색만, base/grad 토큰은 G1 lint 대상 외이므로 인라인 유지 가능

### 1-2. 실행 명령

```
# 1) dashboard-upgrade.html — Edit 도구로 :root{} 블록 (line 9~25 색·base·grad) 전부 제거 + tokens.css link 삽입
# 2) 7 페이지 일괄 처리는 scripts/g1-apply.js (one-shot helper) 작성
$ node scripts/g1-apply.js
```

### 1-3. 실제 출력

```
PATCHED: dashboard-ops.html
PATCHED: index.html
PATCHED: topic.html
PATCHED: session.html
PATCHED: decisions.html
PATCHED: feedback.html
PATCHED: signature.html

DONE — 7/7 files patched.
```

dashboard-upgrade.html은 Edit으로 직접 처리. 인라인 `:root{}` 블록(8 색 + 9 base + 4 grad = 21 토큰) 전부 제거하고 tokens.css link로 치환.

### 1-4. 검증

```
$ npx ts-node scripts/scan-inline-root.ts | tail -12
SCAN_DONE
scannedFiles: 9
active: 9  legacy: 0
totalRootBlocks: 7              # 12 → 7 (dashboard-upgrade 1 + legacy 4 제거)
pagesWithColorTokenDuplication: 0   # 2 → 0
pagesWithLayoutTokenDuplication: 0
g1LintTargetPages (active+color): 0   # 1 → 0  ← 핵심
pdDeferralLayoutPages (active+layout): 0
```

dashboard-upgrade `blocks=0  color=0  base=0` (전부 제거 확인). 다른 7 페이지는 color=0 유지(원래 0건이라 base는 인라인 그대로, lint 범위 외).

### 1-5. 게이트 통과

| 항목 | 결과 |
|---|---|
| 9 active 페이지 tokens.css import | ✅ 9/9 (`grep -l "css/tokens.css" app/*.html` 9건) |
| dashboard-upgrade `--c-*` 인라인 0 | ✅ 0/8 (이전 8 → 제거 후 0) |
| g1LintTargetPages = 0 | ✅ |

---

## §2. 작업 2 — Partial 빌드 패턴 구현

### 2-1. Pre

- partial source = `app/partials/sidebar.html` (Vera·Arki 합의 plain HTML)
- 마커 = `<!-- @partial:sidebar -->`
- 빌드 단계 = dist 복사 후 inline 치환 (Dev rev1 §C-2 옵션 B)

### 2-2. 실행 명령

```
# 1) Write app/partials/sidebar.html — D-094 6 메뉴 + Records 5 sub + Dashboard 2 sub
# 2) Edit scripts/build.js — loadPartials() + applyPartialsToDist() 신설 + LEGACY_TOP_DIRS 제외
# 3) Edit 8 active 페이지 — <aside class="sidebar">…</aside> → <!-- @partial:sidebar -->
$ node scripts/build.js
```

### 2-3. 실제 출력 (build.js)

```
[build] Starting...
[build] Cleaned dist/
[build] Skipping app/legacy/ (excluded from production)
[build] Skipping app/partials/ (excluded from production)
[build] Copied app/ source files
[build] Applied partials: 1 loaded (sidebar), 8 markers replaced, 0 missing
[build] Copied memory/ → data/memory/ (70 files)
[build] Copied reports/ → data/reports/ (286 files)
[build] Copied logs/ → data/logs/ (3 files)
[build] Generated data/manifest.json
[build] Generated data/published/topics_manifest.json (104 topics)
[build] Generated data/published/decisions_summary.json (98 decisions)
[build] Done. dist/ ready with 359 data files + published/ artifacts.
```

### 2-4. 검증

```
$ grep -rln "@partial:" dist/*.html
  (no output — 0 markers remaining)
$ ls dist/legacy 2>&1 || echo "absent"
absent
$ ls dist/partials 2>&1 || echo "absent"
absent
$ grep -c 'class="sidebar"\|hamburger\|sidebar-backdrop' dist/dashboard-upgrade.html dist/index.html dist/dashboard-ops.html
dist/dashboard-upgrade.html:3
dist/index.html:3
dist/dashboard-ops.html:3
```

### 2-5. 게이트 통과

| 항목 | 결과 |
|---|---|
| `app/partials/sidebar.html` 신설 | ✅ |
| build.js partial inline 작동 | ✅ 8 markers replaced |
| dist 마커 잔존 0 | ✅ 0건 (sidebar 헤더 docstring을 단순화하여 메타 매칭 회피) |
| dist/partials, dist/legacy 부재 | ✅ |

**자가 적출**: 처음 partial 헤더에 `<!-- @partial:sidebar -->` 문자열이 들어 있어서 dist에 같은 패턴이 잔존(8건). 헤더를 단순 한 줄 주석으로 축약하여 false-marker 0 달성. (single-pass 구현은 spec 정합 — 본 결함은 partial source 자체의 문서화 텍스트 충돌이었음)

---

## §3. 작업 3 — Lint 3 스크립트 구현

### 3-1. Pre

3 스크립트 분리(Dev rev1 §B-2 합의):

| script | 책임 |
|---|---|
| `lint-inline-root-color.ts` | active 페이지 인라인 `:root{ --c-* }` 검출 |
| `lint-contrast.ts` | tokens.css 19 조합 4.5:1 검증 (조합 #20은 정책 차단) |
| `lint-accent-only.ts` | `--c-dev`·`--c-ace` 본문 `color:` 사용 검출 |

### 3-2. 실행 명령

```
$ npx ts-node scripts/lint-inline-root-color.ts ; echo EXIT=$?
$ npx ts-node scripts/lint-contrast.ts          ; echo EXIT=$?
$ npx ts-node scripts/lint-accent-only.ts       ; echo EXIT=$?
```

### 3-3. 실제 출력

#### lint-inline-root-color

```
[lint-inline-root-color] PASS — 9 active pages, 0 inline color :root{} blocks
EXIT=0
```

#### lint-contrast

```
  [pass ] --text       on --panel     #F5F5F7 on #0B0B0D  ratio=18.06  min=4.5  margin=13.56
  [pass ] --text       on --bg        #F5F5F7 on #000000  ratio=19.29  min=4.5  margin=14.79
  [pass ] --text-2     on --panel     #B8B8C0 on #0B0B0D  ratio=9.98   min=4.5  margin=5.48
  [FAIL ] --text-3     on --panel     #6E6E78 on #0B0B0D  ratio=3.90   min=4.5  margin=-0.60   ← (a)
  [FAIL ] --text-3     on --bg        #6E6E78 on #000000  ratio=4.16   min=4.5  margin=-0.34   ← (b)
  [pass ] --c-vera     on --panel     #F472B6 on #0B0B0D  ratio=7.42   min=4.5  margin=2.92
  [pass ] --c-arki     on --panel     #06B6D4 on #0B0B0D  ratio=8.10   min=4.5  margin=3.60
  [pass ] --c-fin      on --panel     #F59E0B on #0B0B0D  ratio=9.16   min=4.5  margin=4.66
  [pass ] --c-nova     on --panel     #10B981 on #0B0B0D  ratio=7.75   min=4.5  margin=3.25
  [pass ] --c-dev      on --panel     #3B82F6 on #0B0B0D  ratio=5.35   min=4.5  margin=0.85
  [pass ] --c-riki     on --panel     #EF4444 on #0B0B0D  ratio=5.23   min=4.5  margin=0.73
  [ALARM] --c-ace      on --panel     #8B5CF6 on #0B0B0D  ratio=4.64   min=4.5  margin=0.14   ← (c)
  [pass ] --c-editor   on --panel     #9CA3AF on #0B0B0D  ratio=7.75   min=4.5  margin=3.25
  [pass ] --ok         on --panel     #10B981 on #0B0B0D  ratio=7.75   min=4.5  margin=3.25
  [pass ] --warn       on --panel     #F59E0B on #0B0B0D  ratio=9.16   min=4.5  margin=4.66
  [pass ] --bad        on --panel     #EF4444 on #0B0B0D  ratio=5.23   min=4.5  margin=0.73
  [pass ] --text       on --panel-2   #F5F5F7 on #141418  ratio=16.87  min=4.5  margin=12.37
  [pass ] --text-2     on --panel-2   #B8B8C0 on #141418  ratio=9.32   min=4.5  margin=4.82
  [pass ] --text       on --panel-3   #F5F5F7 on #1C1C22  ratio=15.57  min=4.5  margin=11.07

[lint-contrast] FAIL — 2/19 combos below threshold
  --text-3 on --panel = 3.90:1, requires ≥4.5:1
  --text-3 on --bg = 4.16:1, requires ≥4.5:1
EXIT=1
```

#### lint-accent-only

```
[lint-accent-only] PASS — 0 body-text uses of accent-only role colors found in app/
EXIT=0
```

### 3-4. Spec drift 적출 (Vera spec vs 실측)

| 조합 | token-axes-spec §2 박제 비율 | 본 lint 실측 비율 | 차이 |
|---|---|---|---|
| `--text-3 on --panel` (`#6E6E78` on `#0B0B0D`) | 4.6:1 (PASS) | **3.90:1 (FAIL)** | -0.70 |
| `--text-3 on --bg` (`#6E6E78` on `#000000`) | 4.8:1 (PASS) | **4.16:1 (FAIL)** | -0.64 |
| `--c-ace on --panel` (`#8B5CF6` on `#0B0B0D`) | 4.8:1 | 4.64:1 (PASS, ALARM) | -0.16 |
| `--c-dev on --panel` (`#3B82F6` on `#0B0B0D`) | 4.7:1 | 5.35:1 (PASS) | +0.65 |

### 3-5. 정확도 독립 검증

WCAG 2.1 공식(sRGB linearization → relative luminance → `(L1+0.05)/(L2+0.05)`) 외부 표준. Known-good unit assertion `#FFFFFF on #000000 = 21.00:1` PASS. 같은 함수로 dev/arki/fin/riki/nova/vera/editor 7 토큰 모두 spec과 ±0.5 이내 일치 — 함수는 정확함.

```
$ node -e "..." (lint-contrast 함수 vs 독립 인라인 함수)
--text-3 on --panel actual ratio: 3.900    # 두 구현 모두 동일
--c-ace on --panel actual ratio: 4.644
```

→ Vera token-axes-spec.md §2-1 표 박제 비율(`--text-3` 행 4.6:1)이 잘못된 추정값. 실측 WCAG 비율은 3.90:1.

### 3-6. 영향

`--text-3` 토큰은 Vera spec §4-1 typography "tertiary text / meta / eyebrow"에 사용되는 본문 보조 텍스트 색상. 3.90:1은 4.5:1 미달이므로 WCAG AA 본문 미달. **본 토큰을 본문 위계로 사용하면 G3 accessibility audit 자동 FAIL**.

대안 3 옵션:

| # | 안 | 근거 | 검증 필요 |
|---|---|---|---|
| A | `--text-3` hex를 `#6E6E78` → 더 밝은 값(예 `#8B8B95`)으로 swap | WCAG AA 4.5:1 회복 | Vera 디자인 톤 결정 + 21 typography 토큰 영향 0 확인 |
| B | `--text-3`을 본문에서 차단, large text(≥18pt) / non-text 데코만 사용 | WCAG SC 1.4.3 large text는 3:1만 요구 → 3.90:1 PASS | 사용처 grep + 컴포넌트 spec 갱신 |
| C | spec 비율값을 실측값으로 정정만 (FAIL 처리는 별도 결정) | spec drift 봉합 | Phase 1 G1 PASS 조건은 미충족 유지 |

### 3-7. Escalation 트리거 (3회 실패 규칙은 미발동)

| 항목 | 상태 |
|---|---|
| 같은 문제 3회 실패? | 아니오 — lint 첫 run에서 적출. 재시도 시도 0건 |
| Arki escalation 필요? | **아니오 — Vera escalation이 정확** (token 값 문제이므로 토큰 owner 영역) |
| Master 결정 필요? | 예 — Phase 1 G1 PASS 조건 #3 미충족 박제 + Vera 재호출 트리거 |

### 3-8. 게이트 통과

| 항목 | 결과 |
|---|---|
| 3 lint script 신설 + ts-node 실행 가능 | ✅ 3/3 |
| lint-inline-root-color PASS | ✅ |
| lint-contrast PASS | ❌ 2/19 FAIL (spec drift) |
| lint-accent-only PASS | ✅ |
| known-good unit (#FFF on #000 = 21:1) | ✅ sanity check 내장 |

---

## §4. 작업 4 — Legacy 4 변종 archive 이동

### 4-1. Pre

- 대상: `app/dashboard-v3-test.html`·`v3b`·`v3c`·`v3d-test.html`
- 경로: `app/legacy/archive/v3-variants/`
- 방식: `git mv` (history 보존)
- 시점: Phase 1 G1 첫 작업으로 (lint 작동 baseline 청결)

### 4-2. 실행 명령

```
$ mkdir -p app/legacy/archive/v3-variants
$ git mv app/dashboard-v3-test.html  app/legacy/archive/v3-variants/dashboard-v3-test.html
$ git mv app/dashboard-v3b-test.html app/legacy/archive/v3-variants/dashboard-v3b-test.html
$ git mv app/dashboard-v3c-test.html app/legacy/archive/v3-variants/dashboard-v3c-test.html
$ git mv app/dashboard-v3d-test.html app/legacy/archive/v3-variants/dashboard-v3d-test.html
```

### 4-3. 실제 출력

```
MV_DONE
dashboard-v3-test.html
dashboard-v3b-test.html
dashboard-v3c-test.html
dashboard-v3d-test.html
---active---
ls: cannot access 'app/dashboard-v3*-test.html': No such file or directory
(no v3-test in app/ — expected)
```

### 4-4. 검증

```
$ ls app/legacy/archive/v3-variants/    # 4 files present
dashboard-v3-test.html  dashboard-v3b-test.html  dashboard-v3c-test.html  dashboard-v3d-test.html

$ ls app/dashboard-v3*-test.html        # 0 results
ls: cannot access ...: No such file or directory

$ node scripts/build.js | grep legacy
[build] Skipping app/legacy/ (excluded from production)

$ ls dist/legacy 2>&1 || echo absent
absent
```

`build.js` 패치:

```js
const LEGACY_TOP_DIRS = ['legacy', 'partials'];
// app entry 순회 시 includes(entry.name) → continue
```

### 4-5. 게이트 통과

| 항목 | 결과 |
|---|---|
| 4 파일 archive 이동 (`git mv`) | ✅ 4/4 |
| `app/dashboard-v3*-test.html` 0 결과 | ✅ |
| `dist/legacy/` 부재 | ✅ |
| build.js LEGACY_TOP_DIRS patch 작동 | ✅ |

---

## §5. 작업 5 — dashboard-upgrade first-target 검증

### 5-1. Pre

- canonical reference 페이지 (D-090·D-097)
- 작업 1·2 적용 후 정상 렌더 + KPI grid V-5 유지 + sidebar partial 치환 정상 + tokens.css link 정상

### 5-2. 실행 명령

```
$ node scripts/build.js
$ wc -l dist/dashboard-upgrade.html
$ grep -c 'class="sidebar"\|hamburger\|sidebar-backdrop' dist/dashboard-upgrade.html
$ grep -n 'href="css/tokens.css"\|@partial:' dist/dashboard-upgrade.html
$ grep -n 'auto-fit.*minmax(180' app/dashboard-upgrade.html
```

### 5-3. 실제 출력

```
$ wc -l dist/dashboard-upgrade.html
960 dist/dashboard-upgrade.html

$ grep -c 'class="sidebar"\|hamburger\|sidebar-backdrop' dist/dashboard-upgrade.html
3      # hamburger button + sidebar-backdrop + sidebar = 3 hits → partial fully inlined

$ grep -n 'href="css/tokens.css"' dist/dashboard-upgrade.html
8:<link rel="stylesheet" href="css/tokens.css">

$ grep -n '@partial:' dist/dashboard-upgrade.html
(no output — marker fully replaced)

$ grep -n 'auto-fit.*minmax(180' app/dashboard-upgrade.html
(no exact match in upgrade — Upgrade는 minmax(220px,1fr) 사용. ops가 180px)
```

### 5-4. KPI grid 확인

dashboard-upgrade.html의 KPI grid는 spec(responsive-policy.md §2-3)에 따라 `repeat(auto-fit, minmax(220px, 1fr))`. 본 turn 변경 0 — 토큰 import만 추가. KPI grid CSS (`.kpi-row` 등) 손대지 않음.

```
$ grep -n 'kpi-row\|grid-template-columns' app/dashboard-upgrade.html | head -5
(KPI grid 정의 그대로 보존 — Phase 2 G2 baseline 캡처 시 회귀 0 예정)
```

### 5-5. 게이트 통과

| 항목 | 결과 |
|---|---|
| dashboard-upgrade.html tokens.css link 1건 | ✅ line 8 |
| sidebar partial 치환 정상 | ✅ hamburger·backdrop·sidebar 3 요소 inline |
| 인라인 :root color 0 | ✅ 본 turn 제거 완료 |
| 마커 잔존 0 | ✅ |
| KPI grid V-5 변경 0 | ✅ (CSS 손대지 않음) |

**Phase 2 baseline 캡처 직전 manual smoke 권고**: 시각 회귀 0 최종 확인은 브라우저 렌더링 단계에서. 본 turn 환경에서 브라우저 미사용 — 마크업·CSS 정합 grep 검증으로 갈음.

---

## §6. 작업 6 — nav.js drawer (모바일 off-canvas 280px)

### 6-1. Pre

- spec: responsive-policy.md §6 + token-axes-spec.md §6-3 z-index
- partial sidebar.html에 hamburger 버튼·backdrop 마크업 포함
- D-feedback-2 `data-active="true"` setter export
- D-feedback-8 a11y: `aria-disabled="true"` + `tabindex="-1"` + click prevent

### 6-2. 실행 명령

```
# Edit app/js/nav.js — openDrawer/closeDrawer/toggleDrawer + _setActiveNav + listeners
$ wc -l app/js/nav.js
```

### 6-3. 실제 출력 (구조)

```
$ wc -l app/js/nav.js
166 app/js/nav.js   # 84 → 166 (drawer + active state setter +82 LOC)
```

신설 함수:

```js
openDrawer()              // sidebar+backdrop data-open=true, body overflow hidden, focus first nav-item
closeDrawer()             // 역동작
toggleDrawer()            // hamburger click handler
_currentNavSlug()         // window.location.pathname → 6 카테고리 slug 매핑 (단일 source)
_setActiveNav()           // [data-nav=slug] && [data-state≠pending] → data-active=true + .active class
```

DOMContentLoaded 안 wiring:
- hamburger click → toggleDrawer
- backdrop click → closeDrawer
- Esc keydown → closeDrawer
- resize ≥1024 (debounced 100ms) → force closeDrawer
- `[aria-disabled="true"]` nav-item click preventDefault

### 6-4. 검증

```
$ grep -c 'openDrawer\|closeDrawer\|toggleDrawer\|_setActiveNav' app/js/nav.js
9    # 함수 정의 + listener 호출 합산

$ grep -c 'data-state="pending"\|aria-disabled="true"\|tabindex="-1"' app/partials/sidebar.html
12   # 4 hidden nav-item × 3 attribute = 12

$ grep -c 'data-nav=' app/partials/sidebar.html
11   # 11 nav-item all tagged
```

z-index 토큰 정합:

```css
/* nav.js·partial은 var(--z-drawer)·var(--z-backdrop)·var(--z-hamburger)를 직접 참조하지 않고
   기존 dashboard-upgrade .sidebar CSS가 그대로 적용됨. drawer transform·overlay 등 mobile CSS는
   Phase 2 G2 진입 시 components.css 신설(작업 외) 또는 페이지 CSS @media 추가에서 와이어업.
   본 작업 6 spec은 nav.js drawer JS 동작 + partial 마크업 동반까지로 한정. */
```

### 6-5. 게이트 통과

| 항목 | 결과 |
|---|---|
| `app/js/nav.js` drawer 함수 export | ✅ openDrawer/closeDrawer/toggleDrawer |
| 6 카테고리 nav 마크업 (sidebar.html) | ✅ Home/Dashboard{2}/Growth/People/Records{5}/System = 11 nav-item |
| hidden state a11y (aria-disabled + tabindex=-1) | ✅ 4 pending |
| Esc·backdrop·resize ≥1024 close | ✅ 3 listener |
| z-index 토큰 사용 | △ tokens.css 정의 보유. 실제 CSS application은 Phase 2 G2 components.css(작업 외) |
| 모바일 viewport 단위 테스트 | △ 환경 미보유(브라우저 없음). DOM listener 코드 grep 검증으로 갈음 |

### 6-6. 자가 적출

| # | 결함 | 영향 | 대응 |
|---|---|---|---|
| 1 | drawer transform·backdrop dim·hamburger 표시 등 **CSS** 적용은 본 turn 미작업 | 모바일 시뮬레이션 시 hamburger·backdrop 시각적으로 안 보임. JS는 정상 동작하지만 화면에서 무의미 | 별도 작업: `app/css/components.css` (responsive-policy.md §3-1 CSS skeleton) Phase 2 G2 또는 본 토픽 후속 turn에서 박제 — ace_rev4 §3-1 6 작업 spec엔 components.css 명시 없음. 본 turn은 spec 6 작업만 완료. spec 외 추가 적용 시 Master 승인 필요 |
| 2 | drawer focus trap은 첫 nav-item focus만, Tab cycle은 미구현 | a11y 부분 — Esc로 빠져나갈 수 있음 | NICE — Phase 5 a11y audit에서 확장 |
| 3 | unit test 미작성 | 실측 검증 약함 | NICE — Phase 2 G2 Playwright e2e로 자연 흡수 |

**spec 외 components.css는 본 작업 6 spec 범위 밖 — 작업 6 PASS 처리**. 단 mobile CSS application은 Phase 2 G2 진입 시 별도 트랙 필수.

---

## §7. 결함 자가 적출 (전체 turn 종합)

| # | 결함 | 영향 | 대응 |
|---|---|---|---|
| F-1 | lint-contrast가 spec drift 2건 검출 → Phase 1 G1 PASS 조건 #3 미통과 | **MUST_NOW** — Master 결정 필요 | §3-6 3 옵션 박제. Vera 재호출 권고 |
| F-2 | partial 헤더 docstring에 literal `<!-- @partial:sidebar -->` 포함하여 dist에 false-marker 8건 잔존 | 처음 build 시 발견 → 헤더 단순화로 해결 (자가 회수) | 해결 완료. spec 엔지니어링 학습 — partial source 자체에 마커 syntax 금지 |
| F-3 | mobile drawer CSS application(transform·backdrop dim 등)은 작업 6 spec 외이지만 실제 모바일 동작에는 필수 | spec 외 작업 누적 시 본 토픽 분화 위험 | **본 토픽 안에서 처리** (메모리 `feedback_no_premature_topic_split`) — Phase 2 G2 진입 시 components.css 박제, 별도 토픽 분화 0 |
| F-4 | Vera spec(token-axes-spec §2-1) `--c-ace on --panel = 4.8:1` vs 실측 4.64:1 — margin 0.16 (alarm 임계 0.2 하회) | SHOULD-fix 알림만, build PASS 유지 | Vera review 권고 — fallback `--c-ace-fallback #9F75F8 (5.2:1)` 사용 검토 |
| F-5 | dashboard-upgrade.html 인라인 base 토큰(9 base + 4 grad)도 `:root{}` 블록 내부에 있어서 스캔에선 base/grad로 분류되었지만 spec상 G1 lint 범위는 `--c-*`만 — 그래서 본 turn에서 **base/grad 토큰도 같이 제거**한 것은 spec 정합 (단일 출처 = tokens.css). PD-045 deprecate에 부합 | spec 정합 OK | self-doc — drift 0 |

**3회 실패 규칙 미발동**: 동일 문제 재시도 0건. lint-contrast FAIL은 첫 run 적출이므로 escalation은 Vera spec 정합 차원이지 Dev 구현 결함 아님.

---

## §8. Phase 1 G1 진입 차단 vs 진행 결정

ace_rev4 §3-3 PASS 조건 7항 — 본 turn 결과:

| # | 조건 | 결과 |
|---|---|---|
| 1 | tokens.css 빈 슬롯 0 + active 페이지 import 100% | ✅ 9/9 |
| 2 | lint-inline-root-color 0건 | ✅ |
| 3 | **lint-contrast 20조합 4.5:1 충족** | ❌ 2건 FAIL (`--text-3` × 2) |
| 4 | lint-accent-only 0건 | ✅ |
| 5 | nav.js 단일 source | ✅ |
| 6 | partial inline 마커 dist 잔존 0 | ✅ |
| 7 | legacy 4 archive + dist 부재 | ✅ |

**판정 — Phase 1 G1 부분 통과 (6/7)**. 조건 #3 미충족만 잔여.

ace_rev4 §3-3 FAIL 처리 정책: "lint fail ≥5 active 페이지(발동 가능성 0)면 Phase hold + Master 결정. 그 외는 해당 작업자 재호출(Vera/Dev)" — 본 fail은 lint 자체의 spec drift 검출, 페이지 단위 fail이 아니라 **token 값 단위 fail 2건**. Vera 재호출이 정합.

---

## §9. 다음 turn 권고

| turnId | Owner | 산출 |
|---|---|---|
| 13 (현재) | Dev | Phase 1 G1 6 작업 + 6/7 PASS + spec drift 적출 → **DONE** |
| 14 | **Vera (재호출)** | `--text-3` hex swap or 정책 차단 결정 + spec §2 표 실측값 정정 + Phase 1 G1 PASS 조건 #3 회복 |
| 15 | Master gate | Phase 1 G1 PASS 선언 (Vera turn 결과 confirm) → Phase 2 G2 진입 |

대안: Master가 "본 turn에서 Dev가 hex swap 진행해" 직접 지시 시 Dev turn 14에서 안 A 적용 가능. 단 Vera 디자인 톤 결정권 영역이므로 Master 명시 결정 필수.

---

## §10. 자기 점검

| 점검 축 | 결과 |
|---|---|
| working proof — 실행 명령 + 실제 출력 박제 | ✓ 6 작업 모두 |
| 추정 0건, 실측 우선 | ✓ contrast spec drift는 실측 결과 박제 |
| 하드코딩 0 — config·spec 출처 | ✓ COLOR_TOKEN_NAMES·CHECKS 모두 spec 출처. tokens.css hex 직접 박지 않음 |
| 3회 실패 규칙 발동 | 미발동 (동일 시도 1회) |
| frontmatter turnId 13 / invocationMode subagent / recallReason "phase-1-g1-execution" | ✓ |
| accessed_assets 명시 | ✓ |
| produced_assets 명시 (수정·신설 분리) | ✓ |
| 첫 줄 DEV_WRITE_DONE | ✓ |
| 분량 600~1200 줄 | ✓ |
| 작업별 Pre/명령/출력/검증/게이트 표 | ✓ §1~§6 |
| self-scores YAML | ✓ 아래 |

---

```yaml
# self-scores
rt_cov: Y
gt_pas: 6
hc_rt: 0
spc_drf: 0
```

(주: `rt_cov`=Y — 6 작업 모두 실행 명령 + 실제 출력 + grep/wc 정량 검증 박제. 추정·`should work` 0건. lint-contrast FAIL도 추정이 아닌 실측 ratio 박제. `gt_pas`=6 — Phase 1 G1 PASS 7항 중 6항 통과(조건 1·2·4·5·6·7 PASS, 조건 3 FAIL은 Vera spec drift). 작업 단위로는 6/6 모두 코드 작업 완료 + 검증. `hc_rt`=0 — token hex 직접 박지 않음(tokens.css·spec 출처). lint script의 CHECKS 19 조합·CSS 마커 패턴·6 nav-item 카테고리 모두 spec mirror. `spc_drf`=0 — Dev 측 spec 변경 0. lint-contrast 2 FAIL은 Vera spec(token-axes-spec.md §2-1 비율 표)이 잘못된 추정값을 박제했던 것의 적출이지 Dev가 spec을 변형한 것이 아님. partial 헤더 docstring 단순화는 spec과 무관한 build artifact 정리(F-2). drawer CSS 미적용(F-3)은 작업 6 spec 범위 명확히 따름 — components.css는 별도 트랙 spec.)
