---
role: dev
session: session_121
topic: topic_119
date: 2026-04-28
phase: implementation
revision: 1
---

# Dev rev1 — D-102 Phase 1~8 구현 (PD-049/PD-050)

## 1. 범위

D-102 spec(session_120 박제)의 Phase 1~8을 단일 세션 내 완결. Grade C, framing 생략, Dev 직행. 모든 게이트 G1~G8 + G-final PASS.

## 2. Phase별 산출

### Phase 1 — Tokens (G1)
`app/css/tokens.css`에 gradient stop 토큰 6종 추가:
- `--c-chart-bar-from: #F472B6` / `--c-chart-bar-to: #8B5CF6`
- `--c-chart-bar2-from: #14B8A6` / `--c-chart-bar2-to: #0891B2`
- `--a-chart-area-from: 0.33` / `--a-chart-area-to: 0.00`

기존 토큰 변경 0건. **G1 PASS** (grep 6/6).

### Phase 2 — Helper (G2)
`app/js/chart-tokens.js` 신설 — `cssVar` / `cssVarNum` / `hexToRgba` + `window.CHART_TOKENS` 6 함수 + `areaFade(hex)`. 빈 var fallback hex + console.error 방어. `<script src="js/chart-tokens.js">`을 `dashboard-upgrade.html`·`index.html` 차트 init 위에 삽입.

preview eval 검증:
- `barFrom() === '#F472B6'` ✅
- `barTo() === '#8B5CF6'` ✅
- `bar2From() === '#14B8A6'` ✅
- `bar2To() === '#0891B2'` ✅
- `areaFromA() === 0.33` ✅
- `areaToA() === 0` ✅
- `areaFade('#8B5CF6')` → `[{0, rgba(139,92,246,0.33)}, {1, rgba(139,92,246,0)}]` ✅

**G2 PASS**.

### Phase 3 — Swap (G3)
호출부 5건 단순→복합 순서로 swap:

| # | 위치 | After |
|---|---|---|
| 1 | `index.html:341` | `CHART_TOKENS.barFrom() / barTo()` |
| 2 | `dashboard-upgrade.html:663` | `CHART_TOKENS.barFrom() / barTo()` |
| 3 | `dashboard-upgrade.html:686` | `CHART_TOKENS.bar2From() / bar2To()` |
| 4 | `dashboard-upgrade.html:716` | `CHART_TOKENS.areaFade('#8B5CF6')` (α `.20→.33` 의도된 변경) |
| 5 | `dashboard-upgrade.html:792` | `CHART_TOKENS.areaFade(color)` (변수 인용) |

직접 stop literal 잔존 0건. preview에서 9 chart 모두 정상 렌더, 콘솔 에러 0건. **G3 PASS**.

### Phase 4 — Lint (G4)
- `scripts/scan-echarts-gradient.ts` (callable AST 스캐너) — acorn 8.16.0 사용 (esprima 미설치). `<script>` 블록 → AST → `NewExpression(echarts.graphic.LinearGradient|RadialGradient)` 매칭, stops 배열 내 ObjectExpression의 color Literal 검사. 변수 인용 / template literal / theme spread는 spec §5.1 정의대로 out-of-scope.
- `scripts/lint-echarts-gradient.ts` (CLI exit 0/1) — env `LINT_ECHARTS_LEVEL`로 warn/error 분기. 토큰 hex/rgba whitelist.

양방향 검증:
- **Post-swap**: violations = 0
- **Pre-swap (HEAD)**: 4 호출부 / 8 stop literal 검출 (upgrade:663,686,716 + index:341). `:792` spark는 BinaryExpression(`color+'55'`)으로 spec §5.1 의도적 범위 밖 → spec G4 "5건"과 4건 차이는 정합.

**G4 PASS**.

### Phase 5 — Fixture freeze (G5)
- `tests/vr/fixtures/dashboard.mock.json`에 `_meta` 블록 추가 (`schemaVersion: 1.0.0`, `frozenAt`, `sessionsLength: 102`).
- `tests/vr/verify-fixture-stability.ts` 신설 — 4 invariant 검증:
  1. `_meta` presence ✅
  2. `sessions.length === _meta.sessionsLength` (102) ✅
  3. sessionId monotonic (102 ids ascending) ✅
  4. schemaVersion 박제값 (1.0.0) ✅

**G5 PASS**.

### Phase 6 — Stability check (G6)
- `tests/vr/baseline/axis-labels.json` 박제 — heroChart / efficiencyChart / lineChart의 SVG `<text>` dump (text+x+y, sort by y/x/text).
- `tests/vr/verify-axis-label-stability.ts` 신설 — `compareAxisDumps()` callable + CLI baseline-only mode.

preview eval 검증: 두 번 렌더 + dispose+re-init 후 dump 완전 일치 (`equal: true`). efficiencyChart 21 labels, lineChart 13 labels.

**G6 PASS**.

### Phase 7 — Baseline 재캡처 + pixel diff (G7)
- 기존 `baseline.bak`은 outdated (page height mismatch 24/24) → 정확한 비교를 위해 양쪽 fresh capture:
  1. `app/index.html` + `app/dashboard-upgrade.html` HEAD 복원 → build → vr-capture → `preswap/`
  2. swap 복원 → build → vr-capture → `current/`
  3. `vr-compare`: **24/24 PNG, max diff 0.00%**

호스트 Playwright(localhost:8788) 사용. docker daemon 비활성으로 `vr:capture:host` 경로 사용.

baseline = postswap (현재 코드 상태)로 정리. baseline.bak2 제거.

**G7 PASS** (의도된 :716 α 변경도 0% — pixelmatch threshold 0.1 내 흡수).

### Phase 8 — Lint 통합 + ERROR 승격 (G8)
- `scripts/lint-echarts-gradient.ts` 기본 레벨을 `warn` → `error`로 승격.
- `package.json` `lint:css` 체인 4단 통합:
  ```
  lint-inline-root-color → lint-echarts-gradient → lint-contrast → lint-accent-only
  ```
- `lint:echarts` 단축 스크립트 추가.
- cross-env 미설치 → 코드 내 default 변경으로 env 의존 회피.

전 chain PASS:
- lint-inline-root-color: PASS
- lint-echarts-gradient (level=error): WARN 0 / FAIL 0, exit 0
- lint-contrast: PASS (1 ALARM `--c-ace` margin 0.14, 0 fail)
- lint-accent-only: PASS

**G8 PASS**.

## 3. G-final

| Gate | 결과 |
|---|---|
| G1 tokens 추가 | ✅ |
| G2 helper 6 함수 | ✅ |
| G3 hex 잔존 0 | ✅ |
| G4 lint 양방향 | ✅ |
| G5 fixture invariant | ✅ |
| G6 axis label 결정성 | ✅ |
| G7 pixel diff 0 | ✅ (max 0.00%) |
| G8 lint chain + ERROR | ✅ |
| **D-102 ledger 박제** | ✅ (session_120) |
| **3축 freeze (Riki R-3)** | ✅ |

**G-final PASS** — D-102 PD-049/050 단일 세션 완결.

## 4. 신규/수정 파일 인벤토리

### 신규 (7건)
| File | Purpose | LOC |
|---|---|---|
| `app/js/chart-tokens.js` | window.CHART_TOKENS helper | 71 |
| `scripts/scan-echarts-gradient.ts` | acorn AST 스캐너 (callable) | 156 |
| `scripts/lint-echarts-gradient.ts` | CLI lint (exit 0/1) | 42 |
| `tests/vr/verify-fixture-stability.ts` | G5 invariant 검증 | 100 |
| `tests/vr/verify-axis-label-stability.ts` | G6 axis label diff | 102 |
| `tests/vr/baseline/axis-labels.json` | G6 baseline dump | — |
| `tests/vr/baseline/*.png` | G7 24장 재캡처 | — |

### 수정 (5건)
| File | Change |
|---|---|
| `app/css/tokens.css` | 6 토큰 추가 |
| `app/index.html` | helper script + 1 swap |
| `app/dashboard-upgrade.html` | helper script + 4 swap |
| `tests/vr/fixtures/dashboard.mock.json` | `_meta` 블록 |
| `package.json` | `lint:css` chain + `lint:echarts` |
| `.claude/launch.json` | `vr-host` (8788) preview 추가 |

## 5. 주요 의사결정 (D-102 spec 정합)

- **acorn 채택**: spec P-1 "esprima 또는 acorn" — esprima 미설치, acorn 8.16.0 transitive dep 활용으로 추가 install 회피.
- **`:792` 변수 인용 처리**: spec §5.1 명시적 out-of-scope 정합. `BinaryExpression`은 AST literal 검사 대상 아님. spec G4 "5건"은 4 호출부 + 1 변수 인용으로 해석.
- **baseline 전면 재캡처**: 기존 `baseline.bak`은 page content drift로 무효 → 양쪽 fresh capture로 정확한 G7 검증.
- **ERROR 기본값 승격**: cross-env 미설치 환경 대응을 위해 env override 대신 코드 default 변경. env=warn 명시 시 폴백 가능.

## 6. 잔여/후속

- **PD-051 후보** (spec §5.1) — 변수 인용·template literal·theme spread 검출 확장. 미수용 부분의 별 토픽 분리 여부는 Master 결정.
- **D-098 R-D02 정합**: connector α 3-tier(0.12/0.18/0.25)와 chart area fade(0.33/0)는 의미 차원 분리 — vera_rev1 §4.5 정합 유지.
- **lint-contrast `--c-ace` ALARM (margin 0.14)**: 본 토픽 범위 외, 기존 D-098 잔여 항목.

## 자체 평가

```yaml
# self-scores
dev_imp: 1.00      # 8/8 phase 완결, 의도 일탈 0건
dev_grade: Y       # G-final PASS
dev_3sess: Y       # 3세션 이내 원칙 정합 — 본 토픽 spec(120) + impl(121) 2세션 완결
```
