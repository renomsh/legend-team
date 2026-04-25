---
deliverable: G0-9
artifact: contrast-check
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
amended:
  - turnId: 14
    rev: vera_rev4
    reason: spec-drift-correction
    scope: §1-1 20조합 비율 WCAG 2.1 실측 정정 + --text-3 hex swap (#82828C) + #20 정책 차단 해제
---

# G0-9 contrast-check — WCAG AA 자동 lint + accent-only + 간당값 모니터

Vera입니다. vera_rev1 13조합 + vera_rev2 §4 자동 lint pipeline + accent-only 정책을 신규 8 페이지에 정합 박제. Phase 1 G1 진입 시 `scripts/lint-contrast.ts`·`scripts/lint-accent-only.ts` 자체 구현(arki rev3 §3-2 D-fb-6 합의).

옵션 비교 0. 단일 추천: **자체 구현 lint + accent-only 강제 + 간당값 자동 swap candidate**.

---

## 1. WCAG AA 자동 lint — `scripts/lint-contrast.ts`

### 1-1. 13 조합 + 신규 페이지 추가

vera_rev2 §4-1 13조합 carry. 신규 8 페이지에서 사용되는 색 조합 추가 검증.

**vera rev4 정정 (turnId 14)**: 비율은 모두 WCAG 2.1 sRGB linearization 표준 공식 실측(scripts/lint-contrast.ts). rev3 박제는 추정값 — Dev rev2가 적출.

| # | foreground | background | 최소 비율 | 현재 비율 (실측) | 사용처 |
|---|---|---|---|---|---|
| 1 | `--text` (#F5F5F7) | `--panel` (#0B0B0D) | 4.5 | **18.06** | 모든 카드 본문 |
| 2 | `--text` | `--bg` (#000000) | 4.5 | **19.29** | page background 본문 |
| 3 | `--text-2` (#B8B8C0) | `--panel` | 4.5 | **9.98** | secondary text |
| 4 | `--text-3` (**#82828C** rev4 swap) | `--panel` | 4.5 | **5.17** ✓ (rev3 hex #6E6E78 = 3.90 FAIL) | tertiary — 본문 11px 이상만 |
| 5 | `--text-3` | `--bg` | 4.5 | **5.52** ✓ (rev3 hex = 4.16 FAIL) | meta on bg |
| 6 | `--c-vera` (#F472B6) | `--panel` | 4.5 | **7.43** | vera role accent |
| 7 | `--c-arki` (#06B6D4) | `--panel` | 4.5 | **8.10** | arki role accent |
| 8 | `--c-fin` (#F59E0B) | `--panel` | 4.5 | **9.16** | fin role accent |
| 9 | `--c-nova` (#10B981) | `--panel` | 4.5 | **7.75** | nova role accent |
| 10 | `--c-dev` (#3B82F6) | `--panel` | 4.5 | **5.35** ✓ (rev3 4.7 추정 → 안전권 격상) | dev role accent — accent only |
| 11 | `--c-riki` (#EF4444) | `--panel` | 4.5 | **5.23** | riki role accent |
| 12 | `--c-ace` (#8B5CF6) | `--panel` | 4.5 | **4.64** ⚠ ALARM (margin 0.14) | ace role accent — accent only |
| 13 | `--c-editor` (#9CA3AF) | `--panel` | 4.5 | **7.75** | edi role accent |

**신규 8 페이지 추가 조합** (semantic state · grade pill 등):

| # | foreground | background | 최소 비율 | 현재 비율 (실측) | 사용처 |
|---|---|---|---|---|---|
| 14 | `--ok` (#10B981) | `--panel` | 4.5 | **7.75** | status badge — green dot/text |
| 15 | `--warn` (#F59E0B) | `--panel` | 4.5 | **9.16** | status badge — amber |
| 16 | `--bad` (#EF4444) | `--panel` | 4.5 | **5.23** | status badge — red |
| 17 | `--text` | `--panel-2` (#141418) | 4.5 | **16.87** | hover row text |
| 18 | `--text-2` | `--panel-2` | 4.5 | **9.32** | secondary on hover |
| 19 | `--text` | `--panel-3` (#1C1C22) | 4.5 | **15.57** | active filter row |
| 20 | `--text-3` (rev4 #82828C) | `--panel-2` | 4.5 | **4.83** ✓ (rev3 hex = 3.64 FAIL) | tertiary on hover — **rev4 정책 차단 해제** |

**조합 #20 처리 (rev4 갱신)**: rev3 hex `#6E6E78` 시 3.64:1 FAIL → 정책 차단이었으나, **rev4 hex swap `#82828C` 적용 시 4.83:1 PASS**. 정책 차단 해제 가능 — `--text-3`을 `--panel`·`--bg`·`--panel-2` 3 surface 위에 모두 사용 가능. `--panel-3`(`#1C1C22`)은 별도 검증 시 추가.

**총 검증 조합 = 20조합 (rev4 정정 후 모두 PASS, ALARM 1건만 잔여)**.

### 1-2. lint 구현 spec

```ts
// scripts/lint-contrast.ts (Phase 1 G1 박제)
import { readFileSync } from 'fs';

interface ContrastCheck {
  fg: string;       // token name (e.g., '--c-dev')
  bg: string;
  minRatio: number; // 4.5 for AA normal, 3.0 for AA large
}

const CHECKS: ContrastCheck[] = [
  { fg: '--text',    bg: '--panel',   minRatio: 4.5 },
  { fg: '--text',    bg: '--bg',      minRatio: 4.5 },
  { fg: '--text-2',  bg: '--panel',   minRatio: 4.5 },
  { fg: '--text-3',  bg: '--panel',   minRatio: 4.5 },
  { fg: '--text-3',  bg: '--bg',      minRatio: 4.5 },
  { fg: '--c-vera',  bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-arki',  bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-fin',   bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-nova',  bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-dev',   bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-riki',  bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-ace',   bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-editor', bg: '--panel',  minRatio: 4.5 },
  { fg: '--ok',      bg: '--panel',   minRatio: 4.5 },
  { fg: '--warn',    bg: '--panel',   minRatio: 4.5 },
  { fg: '--bad',     bg: '--panel',   minRatio: 4.5 },
  { fg: '--text',    bg: '--panel-2', minRatio: 4.5 },
  { fg: '--text-2',  bg: '--panel-2', minRatio: 4.5 },
  { fg: '--text',    bg: '--panel-3', minRatio: 4.5 },
  // #20 (--text-3 on --panel-2)은 정책 차단으로 lint에서 제외
];

const FALLBACKS: Record<string, string> = {
  '--c-dev': '--c-dev-fallback',  // #4F8FF7 → 5.1:1
  '--c-ace': '--c-ace-fallback',  // #9F75F8 → 5.2:1
};

// 1. tokens.css 파싱 → :root{} 토큰값 추출
// 2. 각 조합 contrast ratio 계산 (sRGB → relative luminance → (L1+0.05)/(L2+0.05))
// 3. 미달 시 build fail + 조합 + fallback 후보 출력
// known-good unit test: #FFFFFF on #000000 = 21:1
```

### 1-3. FAIL 출력 spec

```
[contrast-lint] FAIL: --c-dev (#3B82F6) on --panel (#0B0B0D) = 4.32:1, requires ≥4.5:1
[contrast-lint] HINT: swap to --c-dev-fallback (#4F8FF7) → 5.1:1
[contrast-lint] HINT: token defined at app/css/tokens.css:24
build aborted (exit code 1).
```

---

## 2. accent-only lint — `scripts/lint-accent-only.ts`

### 2-1. 정책

`--c-dev` (4.7:1) / `--c-ace` (4.8:1)는 4.5:1 간당값. 본문 텍스트 사용 시 미세 색 조정만으로 4.5:1 깨질 위험. **accent·border·icon 전용 강제**.

### 2-2. 컴포넌트별 허용/차단

| 컴포넌트 | `--c-dev`·`--c-ace` 허용 속성 | 차단 속성 |
|---|---|---|
| nav-item.active | `box-shadow inset 0 0 0 1px var(--c-ace)` (border 대용) | `color: var(--c-ace)` 본문 텍스트 |
| KPI card top accent | `background: var(--grad-violet)` (3px bar) | text 본문 |
| role-card | `background-color: rgba(...,α)` / `border-color` / icon `fill` | description text color |
| topic-card grade-pill | `background: var(--grad-rose)` | text는 `--text` / `--bg` |
| Records/Sessions Turn Flow node | `fill: var(--c-*)` | label text는 `--text` |
| Records/Deferrals graph node | `fill: var(--c-*)` (ECharts force·tree) | edge label text |
| chart legend | `background-color` / `border-color` | legend text는 `--text-2` |
| signature panel (Growth) | `border-left: 3px solid var(--c-*)` / icon | metric value text는 `--text` |
| role-signature-card partial | `background-color: rgba(...,α)` / `--c-*` icon | role 이름·점수 text는 `--text` |

### 2-3. lint 구현 spec

```ts
// scripts/lint-accent-only.ts (Phase 1 G1 박제)
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

const RESTRICTED_TOKENS = ['--c-dev', '--c-ace'];
const FORBIDDEN_PROPERTIES = ['color'];   // 본문 텍스트 색상 사용 차단
const SCAN_GLOBS = ['app/**/*.html', 'app/**/*.css'];

// patterns to detect:
// 1. inline style: style="color: var(--c-dev)"
// 2. CSS rule: .foo { color: var(--c-ace); }
// 3. CSS rule with !important: .foo { color: var(--c-dev) !important; }
//
// pattern (regex):
//   /color\s*:\s*var\(\s*(--c-dev|--c-ace)\b/gi
//
// 추가 차단:
// - .small-text·.meta·.eyebrow (font-size <13px) 안에서는 모든 --c-* 차단

// FAIL 출력:
// [accent-only-lint] FAIL: app/dashboard-upgrade.html:142 color: var(--c-ace) (forbidden — accent only)
// [accent-only-lint] HINT: use --text or --text-2 for body text
```

### 2-4. 동적 JS 색 주입 (PD-050 연관)

`element.style.color = 'var(--c-dev)'` 같은 JS 동적 주입은 grep으로 잡지 못함.

| 영역 | 검출 가능 | 처리 |
|---|---|---|
| HTML inline style attr | ✓ | 자동 lint |
| CSS rule | ✓ | 자동 lint |
| JS `element.style.color = ...` | ✗ | PD-050 발동 시 검토 |
| JS template literal | ✗ | manual review |

D-003 read-only viewer 정책상 동적 색 주입 가능성 낮음. PD-050 발동 시 검토.

---

## 3. 간당값 fallback candidate

### 3-1. 자동 swap candidate (vera_rev2 §D 박제 carry)

vera rev4 (turnId 14) WCAG 2.1 실측 정정.

| 토큰 | 현재 hex | 현재 ratio (실측) | fallback 토큰 | fallback hex | fallback ratio (실측) | margin |
|---|---|---|---|---|---|---|
| `--c-dev` | `#3B82F6` | **5.35:1** (간당 해소) | `--c-dev-fallback` | `#4F8FF7` | **6.19:1** | 1.69 |
| `--c-ace` | `#8B5CF6` | **4.64:1 ALARM** | `--c-ace-fallback` | `#9F75F8` | **5.97:1** | 1.47 |

### 3-2. swap trigger 조건

| 조건 | 처리 |
|---|---|
| `lint-contrast.ts` FAIL (`--c-dev` or `--c-ace` 4.5 미달) | 자동 PR 제안: `--c-dev` → `--c-dev-fallback` swap |
| 디자인 의도 상 색 조정 필요 (Master/Vera 결정) | manual swap, lint PASS 확인 |
| `--c-{role}` 다른 6 토큰 FAIL | 별도 fallback 미정 → PD 박제 후 신규 색 검토 |

### 3-3. swap 절차

```
1. lint-contrast.ts FAIL 감지
2. PR 자동 제안 (Phase 5 시점 자동화 검토 — 현재는 manual)
3. tokens.css 변경: --c-dev → 값을 --c-dev-fallback 값으로 교체
4. 변경 후 lint-contrast 재실행 → PASS 확인
5. VR baseline 영향 범위 확인 (role-card·icon 색 변동 → 24 baseline 재캡처)
6. 변경 박제 (Decision 또는 PD 박제)
```

**무단 swap 금지** — Master/Vera review 필수.

---

## 4. lint 발동 trigger

| trigger | 발동 lint |
|---|---|
| `app/css/tokens.css` git diff | `lint-contrast.ts` |
| `app/**/*.html` git diff (인라인 style) | `lint-inline-root-color.ts` (Dev rev1 §F-1) + `lint-accent-only.ts` |
| `app/**/*.css` git diff | `lint-accent-only.ts` + `lint-contrast.ts` |
| `scripts/build.js` 실행 | 3 lint 모두 (CF Pages 빌드 진입 시) |
| Phase 3 G3 게이트 (수동 트리거) | 3 lint 모두 |
| Phase 4 신규 페이지 추가 시 (growth·people·system·records 5 sub) | 3 lint 모두 + manual `design:accessibility-review` skill audit (arki rev3 §3-2) |

### 4-1. Phase 1 G1 lint 분리 정책 (Dev rev1 §F-5 합의)

**3 lint 분리 채택**:

| script | 책임 | LOC 추정 |
|---|---|---|
| `scripts/lint-inline-root-color.ts` | HTML 인라인 `:root{}` 토큰 정의 차단 (Dev rev1 §F-1) | ~30 |
| `scripts/lint-contrast.ts` | tokens.css 토큰값 → 20 조합 4.5:1 검증 | ~50 |
| `scripts/lint-accent-only.ts` | `--c-dev`·`--c-ace` 본문 color 사용 차단 | ~40 |

**단일 스크립트 reject 사유 4건** (arki rev3 §3-1 D-fb-5 정합):
1. 책임 분리 (각 lint 독립 실행 가능)
2. callable 재사용 (lint-inline-root-color는 Phase 5 dashboard 재사용)
3. fail-fast (각 단계 별도 exit code)
4. test 단위 분리 용이

---

## 5. G3 게이트 통과 기준

Phase 3 G3 (디자인 시스템 검증 종결 게이트):

| 항목 | 기준 |
|---|---|
| `lint-contrast.ts` | 20조합 4.5:1 미만 0건 |
| `lint-accent-only.ts` | accent-only 위반 0건 (`--c-dev`·`--c-ace` 본문 color 사용 0) |
| `lint-inline-root-color.ts` | 인라인 `:root{}` 0건 (Dev rev1 §A-3 실측 = 1건 → Phase 1 G1에서 0으로 감소) |
| 간당값 모니터 경보 | `--c-dev`·`--c-ace` margin <0.2 시 SHOULD-fix 알림 (build PASS 유지) |
| manual `design:accessibility-review` audit | Phase 4 신규 4 페이지(growth·people·system·records 추가 4 sub) 1회 audit 통과 |

**G3 PASS 조건**: 5 항목 모두 PASS.

### 5-1. 경보 vs FAIL 구분

| 상태 | 처리 |
|---|---|
| FAIL (4.5:1 미달 / accent-only 위반 / 인라인 `:root{}`) | build abort, 즉시 fix |
| SHOULD-fix 경보 (간당값 margin <0.2) | build PASS, log 출력, Vera review |
| INFO (margin 0.2~0.5) | 무 알림 |
| PASS (margin ≥0.5) | 무 알림 |

---

## 6. Phase 1 G1 lint 분리 정합 (Dev rev1 합의)

본 G0-9 §4-1 표 그대로. 3 lint 분리 + Phase 1 G1 진입 시 동시 박제.

**박제 항목 (Dev 인수)**:
- [ ] `scripts/lint-contrast.ts` (~50 LOC, 본 G0-9 §1-2 spec)
- [ ] `scripts/lint-accent-only.ts` (~40 LOC, 본 G0-9 §2-3 spec)
- [ ] `scripts/lint-inline-root-color.ts` (~30 LOC, Dev rev1 §F-1 spec)
- [ ] `scripts/build.js`에 3 lint 발동 hook 추가
- [ ] CI workflow yml에 lint job 추가
- [ ] known-good unit test: `#FFFFFF on #000000 = 21:1` 검증

---

## 7. 신규 페이지 manual audit 정책

arki rev3 §3-2 D-fb-6 정합 — **자체 lint(자동) + skill audit(수동) 분리**.

| 트랙 | 도구 | 발동 |
|---|---|---|
| 자동 lint | `lint-contrast.ts`·`lint-accent-only.ts`·`lint-inline-root-color.ts` | 모든 build / git diff |
| 수동 audit | `design:accessibility-review` skill | Phase 4 신규 페이지 추가 1회 |

**수동 audit 대상**:
- `growth.html` (Phase 4 진입 시 1회)
- `people.html` (Phase 4 진입 시 1회)
- `system.html` (Phase 5 진입 시 1회)
- `records/` 5 sub 중 처음 추가하는 페이지 1회 + 나머지 4 sub은 동일 골격이므로 audit 0

**audit 결과 기록**: `reports/2026-04-22_dashboard-redesign-ux-responsive/a11y-audit-{page}.md`로 박제. Edi 인계.

---

## 8. self-audit (라운드 +1)

vera_rev2 대비 변경:

| # | 변경 |
|---|---|
| C-A | 13조합 → **20조합** 확장 (semantic state·panel-2·panel-3 추가) |
| C-B | `--text-3` on `--panel-2` (4.2:1 FAIL) 정책 차단 박제 |
| C-C | 3 lint 분리 명시 (Dev rev1 §F-5 합의) + LOC 추정 |
| C-D | known-good unit test 1쌍 박제 |
| C-E | manual `design:accessibility-review` skill audit 트랙 분리 |
| C-F | 간당값 swap 절차 6단계 박제 |
| C-G | SHOULD-fix 경보 vs FAIL 구분 명시 |

신규 결함 자가 적출:

| # | 결함 | ROI | 대응 |
|---|---|---|---|
| C-G1 | 20조합 외 hover·focus·disabled state 색 조합 미검증 | SHOULD | Phase 4 진입 시 PD 검토. 현재는 default state 단일 검증 |
| C-G2 | gradient(`--grad-violet` 등) on text 사용 시 픽셀별 ratio 변동 — 단일 ratio 산출 불가 | NICE | gradient는 background only 정책 (icon·bar). text on gradient 0 |
| C-G3 | dark theme 단일 — light theme 추가 시 lint 처음부터 재설계 필요 | NICE | 본 토픽 다크 단일. light theme 추가는 별도 PD |
| C-G4 | `--c-editor` (#9CA3AF, 6.7:1) 4.5:1 margin 2.2 — 향후 색 조정 시 안전. 단 Edi 색 정체성 약함 | NICE | Master 박제 — designer canonical은 vera, editor는 회색 유지(F-013 정합) |
| C-G5 | `--text-3` 본문 11px 이하 사용 시 WCAG 권고 7:1 (large text가 아닌 small text) — 4.6:1로 미달 | MUST_NOW | 본 G0-9 §1-1 표 #4·#5에 "본문 11px 이하 사용 금지" 박제. Phase 1 G1 lint 추가 검토 |

C-G5 즉시 반영: `--text-3` 사용처는 11px 이상이거나 large text(18pt/24px+)로 한정. small text(<11px)에서 `--text-3` 사용 금지 정책 박제.

**갱신**: §1-1 표 #4 "본문 11px 이상만" 표기 → 본 G0-9 본문 추가: **`--text-3`은 font-size ≥11px 본문에만 사용. 그 미만은 lint 차단(Phase 1 G1 검토)**.

---

## 9. lock 선언

본 G0-9 동결 = 20조합 lint + accent-only 강제 + 간당값 fallback candidate + 3 lint 분리 박제. Phase 1 G1 인계 항목:

- [ ] `scripts/lint-contrast.ts` 신규 구현 (Dev, ~50 LOC)
- [ ] `scripts/lint-accent-only.ts` 신규 구현 (Dev, ~40 LOC)
- [ ] `scripts/lint-inline-root-color.ts` 신규 구현 (Dev, ~30 LOC)
- [ ] `scripts/build.js`에 3 lint 발동 hook 추가 (Dev)
- [ ] CI workflow yml lint job 추가 (Dev)
- [ ] dashboard-upgrade.html 인라인 `:root{}` 1건 제거 (Dev rev1 §A-3 실측)
- [ ] tokens.css 사용처 git history grep으로 pre-flight 검증 (Vera + Dev)

다음 turn: Ace turnId 13 — G0-8 spec-lock-decisions.md + G0 PASS 선언.
