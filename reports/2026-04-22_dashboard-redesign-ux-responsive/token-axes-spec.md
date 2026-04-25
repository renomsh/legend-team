---
deliverable: G0-4
artifact: token-axes-spec
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
    scope: §2-1 / §2-2 / §2-3 contrast 비율 WCAG 2.1 표준 공식으로 재산출 + --text-3 hex swap (#6E6E78 → #82828C)
source: app/dashboard-upgrade.html (D-097 canonical)
implements: app/css/tokens.css
---

# G0-4 token-axes-spec — 디자인 토큰 단일 출처 정의

Vera입니다. 본 문서는 `app/css/tokens.css` 의 **명세 원본**입니다. 신규 토큰 추가·기존 값 변형 0 — dashboard-upgrade.html line 9~24 canonical 그대로 추출 + vera_rev1·rev2 누적 spec 흡수. Phase 1 G1 진입 전 spec lock skeleton.

옵션 나열 0. 단일 추천 + 수치 근거.

---

## 1. 토큰 축 (axis) 분류

| Axis | 토큰 prefix | 변경 영향 | 변경 시 발동 lint |
|---|---|---|---|
| Surface | `--bg`·`--panel*`·`--line*` | 전 페이지 시각적 변동 | `lint-contrast.ts` |
| Text | `--text`·`--text-2`·`--text-3` | 모든 본문 대비 | `lint-contrast.ts` |
| Role color | `--c-{role}` | role-card·signature·badge | `lint-contrast.ts` + `lint-accent-only.ts` |
| Gradient | `--grad-*` | hero·grade-pill | (자동 검증 0) |
| Alpha | `--alpha-{1,2,3}` | nav active·overlay | drift 0 강제 (3단 외 사용 금지) |
| Semantic | `--ok`·`--warn`·`--bad` | status badge·회수기 | `lint-contrast.ts` |
| Spacing | `--sp-*` | layout 전반 | (drift 0 강제) |
| Radius | `--r-*` | 카드·pill | (drift 0 강제) |
| Shadow | `--shadow-*` | hover·glow | (사용 최소 권고) |
| Typography | `--fs-*`·`--lh-*`·`--ls-*` | 위계 전체 | (drift 0 강제) |
| Container | `--sidebar-w`·`--drawer-w`·`--container-max`·`--bp-mobile-max` | 반응형 | G0-6 정합 |
| Motion | `--t-*`·`--ease-*` | transition | (reducedMotion 강제) |
| Z-index | `--z-*` | drawer·backdrop | drift 0 강제 |

**총 토큰 수**: 색 14 + alpha 3 + semantic 3 + gradient 4 + spacing 11 + radius 6 + shadow 3 + typography 21 + container 6 + motion 5 + z-index 6 = **82 토큰**.

---

## 2. 색 토큰 — 8 역할 + Surface (canonical hex 추출)

### 2-1. Role colors (8건)

dashboard-upgrade.html line 23~24 단일 출처. hex 변경 0. **비율은 vera rev4 (turnId 14) WCAG 2.1 sRGB linearization 실측으로 정정** (이전 rev3 표는 추정값 박제 — Dev rev2가 적출).

| 토큰 | hex | 역할 | --panel(#0B0B0D) 대비 | margin | rev3 박제 (정정 전) |
|---|---|---|---|---|---|
| `--c-ace` | `#8B5CF6` | Ace | **4.64:1** ALARM | 0.14 | 4.8 |
| `--c-arki` | `#06B6D4` | Arki | **8.10:1** | 3.60 | 6.9 |
| `--c-fin` | `#F59E0B` | Fin | **9.16:1** | 4.66 | 8.4 |
| `--c-riki` | `#EF4444` | Riki | **5.23:1** | 0.73 | 5.4 |
| `--c-nova` | `#10B981` | Nova | **7.75:1** | 3.25 | 6.5 |
| `--c-dev` | `#3B82F6` | Dev | **5.35:1** | 0.85 | 4.7 (간당 → 정정 후 안전) |
| `--c-vera` | `#F472B6` | Vera | **7.43:1** | 2.93 | 6.8 |
| `--c-editor` | `#9CA3AF` | Edi (raterId=editor) | **7.75:1** | 3.25 | 6.7 |

**ALARM 모니터** (rev4 정정): `--c-ace` 4.64:1 margin 0.14 (alarm 임계 0.2 하회) — accent-only 강제 (G0-9 §2 lint). `--c-dev`는 실측 5.35:1로 간당값 영역 해소.

### 2-2. Surface tokens (9건)

| 토큰 | hex | 용도 |
|---|---|---|
| `--bg` | `#000000` | page background |
| `--panel` | `#0B0B0D` | card surface (default) |
| `--panel-2` | `#141418` | nested panel·hover bg |
| `--panel-3` | `#1C1C22` | deep nested·active filter bg |
| `--line` | `#26262D` | default border 1px |
| `--line-2` | `#333340` | hover·focus border |
| `--text` | `#F5F5F7` | primary (대비 **18.06:1** on `--panel`, 19.29:1 on `--bg`) |
| `--text-2` | `#B8B8C0` | secondary (**9.98:1** on `--panel`, 9.32:1 on `--panel-2`) |
| `--text-3` | `#82828C` | tertiary (**5.17:1** on `--panel`, 5.52:1 on `--bg`, 4.83:1 on `--panel-2`) — vera rev4 hex swap (prev `#6E6E78` = 3.90:1 FAIL). 본문 11px 이상 사용 |

### 2-3. 간당값 fallback candidate (자동 swap 후보)

vera rev4 (turnId 14) WCAG 2.1 실측 정정.

| 토큰 | 현재 | fallback | fallback ratio (실측) |
|---|---|---|---|
| `--c-dev` | `#3B82F6` (5.35:1) | `--c-dev-fallback: #4F8FF7` | **6.19:1** (margin 1.69) |
| `--c-ace` | `#8B5CF6` (4.64:1 ALARM) | `--c-ace-fallback: #9F75F8` | **5.97:1** (margin 1.47) |

**swap trigger**: `lint-contrast.ts` FAIL → 자동 PR 제안(human review). 무단 swap 금지.

---

## 3. 레이아웃 토큰 — spacing·radius·shadow

### 3-1. Spacing scale (4px base, 11단)

| 토큰 | px | 용도 |
|---|---|---|
| `--sp-0` | 0 | reset |
| `--sp-1` | 4 | inline gap |
| `--sp-2` | 8 | nav-item icon gap |
| `--sp-3` | 12 | card title row gap |
| `--sp-4` | 16 | KPI grid gap·card padding inner |
| `--sp-5` | 20 | card padding·section gap |
| `--sp-6` | 24 | topbar margin |
| `--sp-7` | 28 | main padding desktop |
| `--sp-8` | 36 | hero padding x |
| `--sp-9` | 48 | section gap large |
| `--sp-10` | 64 | bottom padding desktop |

**중간값 사용 금지**. 디자인 시 `5px`·`10px`·`14px` 등은 drift — Vera spec 위반.

### 3-2. Radius (6단)

| 토큰 | px | 용도 |
|---|---|---|
| `--r-1` | 6 | chip·small button |
| `--r-2` | 8 | nav-item·input |
| `--r-3` | 12 | card·panel default |
| `--r-4` | 16 | large panel |
| `--r-5` | 20 | hero |
| `--r-pill` | 999 | pill·badge·status dot wrapper |

### 3-3. Shadow (3건, 사용 최소)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgba(0,0,0,.4)` | hover 1단 |
| `--shadow-2` | `0 4px 12px rgba(0,0,0,.5)` | drawer·tooltip |
| `--shadow-glow-violet` | `0 0 24px rgba(139,92,246,.25)` | hero accent only |

**원칙 (Rams)**: border가 1차 표현. shadow는 hover·overlay에만. drop-shadow chain 금지.

---

## 4. Typography 토큰 — 8단 위계 + 모바일 보정

### 4-1. Font scale (desktop / mobile 분리)

| 토큰 | desktop | mobile (<1024) | line-height | tracking | 용도 |
|---|---|---|---|---|---|
| `--fs-display` | 48 | 36 | `--lh-tight` (1.05) | `--ls-display` (-0.04em) | hero KPI 숫자 |
| `--fs-h1` | 28 | 24 | `--lh-heading` (1.2) | `--ls-h1` (-0.02em) | page title |
| `--fs-h2` | 20 | 18 | `--lh-heading` (1.2) | `--ls-h2` (-0.01em) | section title·hero meta value |
| `--fs-h3` | 16 | 15 | `--lh-heading` (1.2) | 0 | card title |
| `--fs-body` | 14 | 13 | `--lh-body` (1.5) | 0 | paragraph·nav label |
| `--fs-label` | 13 | 12 | `--lh-body` (1.5) | 0 | table label·chip |
| `--fs-meta` | 11 | 11 | `--lh-body` (1.5) | `--ls-eyebrow` (0.14em) | meta·pill·eyebrow |
| `--fs-mono-min` | 11 | 11 | — | — | 본문 최소선 — `--text-3` 사용 가능 lower bound |

**모바일 자동 swap**: `@media (max-width: 1023px)` 안에서 `--fs-display` 등이 `*-m` 값으로 swap. JS·인라인 폰트 사이즈 추가 금지.

### 4-2. Tracking 별표

| 토큰 | 값 | 용도 |
|---|---|---|
| `--ls-display` | `-0.04em` | hero KPI (음수 트래킹) |
| `--ls-h1` | `-0.02em` | h1 |
| `--ls-h2` | `-0.01em` | h2 |
| `--ls-body` | `0` | body |
| `--ls-eyebrow` | `0.14em` | uppercase eyebrow |
| `--ls-cap` | `0.18em` | hero h-eyebrow |

### 4-3. font-family·feature

```
font-family: -apple-system, 'SF Pro Display', 'Inter', 'Pretendard', sans-serif;
font-feature-settings: 'tnum' 1;   /* KPI 숫자 tabular-nums */
-webkit-font-smoothing: antialiased;
```

dashboard-upgrade.html line 27 carry. font-feature는 KPI grid·표·time stamp 영역에 명시 적용.

---

## 5. Alpha 3-tier (drift 차단)

vera_rev1 R-D02 정책 carry. **3단 외 사용 금지**.

| 토큰 | 값 | 용도 |
|---|---|---|
| `--alpha-1` | 0.12 | subtle background tint |
| `--alpha-2` | 0.18 | nav active bg / chip bg |
| `--alpha-3` | 0.25 | hover emphasis / border accent |

**금지 예**: `rgba(139,92,246,.30)`, `rgba(139,92,246,.20)` 등 — 0.18·0.25 외 alpha 값. lint 차단 대상(Phase 1 PD 가능).

---

## 6. Container·Motion·Z-index

### 6-1. Container

| 토큰 | 값 | 출처 |
|---|---|---|
| `--sidebar-w` | 220px | dashboard-upgrade line 31 |
| `--drawer-w` | 280px | vera_rev2 §2-2 |
| `--container-max` | 1440px | dashboard-upgrade `.main` carry |
| `--topbar-h` | 56px | 신규 (모바일 hamburger 영역) |
| `--hamburger-size` | 40px | vera_rev2 §2-2 |
| `--bp-mobile-max` | 1023px | Master 박제 #11 (D-095) |

### 6-2. Motion

| 토큰 | 값 | 용도 |
|---|---|---|
| `--t-fast` | 120ms | hover bg·color |
| `--t-base` | 220ms | drawer slide·fade |
| `--t-slow` | 320ms | section enter |
| `--ease-std` | `cubic-bezier(0.4, 0, 0.2, 1)` | drawer·dropdown |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | enter only |

**reducedMotion 정책**: VR baseline·접근성 모두 `prefers-reduced-motion: reduce` 시 transition 0 강제. tokens.css는 값만 보유, 실제 disable은 컴포넌트 CSS에서 `@media (prefers-reduced-motion: reduce)` 처리.

### 6-3. Z-index

| 토큰 | 값 | 용도 |
|---|---|---|
| `--z-base` | 1 | content default |
| `--z-sticky` | 10 | filter-bar sticky |
| `--z-backdrop` | 49 | drawer backdrop dim |
| `--z-drawer` | 50 | mobile off-canvas drawer |
| `--z-hamburger` | 51 | drawer 위로 닫기 버튼 노출 |
| `--z-tooltip` | 100 | 최상위 |

z-index 외부 정의 금지 — drift 시 layering 충돌.

---

## 7. Import 정책

### 7-1. 단일 출처 import

```html
<link rel="stylesheet" href="css/tokens.css">
```

- **모든 페이지** (Phase 4 8 페이지 + role-signature-card partial 포함) `tokens.css` import 필수
- `<style>` 인라인 `:root{}` 정의 금지 — Dev rev1 §F-1 `lint-inline-root-color.ts` 차단
- relative path `css/tokens.css` 통일 (sub-folder 페이지는 `../css/tokens.css`)

### 7-2. records 5 sub-folder 처리

`app/records/{topics,sessions,decisions,feedback,deferrals}.html` — `../css/tokens.css` 사용. build.js가 path resolve 검증.

### 7-3. 변경 절차

1. tokens.css 변경 PR
2. `git diff app/css/tokens.css` 감지 → `scripts/lint-contrast.ts` 자동 발동 (PASS 조건)
3. PASS 시 build.js → CF Pages 배포
4. FAIL 시 build abort + 변경 토큰 + 대체 후보 출력

---

## 8. drift 0 강제 (PD 0)

| 위반 유형 | 차단 메커니즘 | Phase |
|---|---|---|
| 인라인 `:root{}` 토큰 정의 | `lint-inline-root-color.ts` (Dev rev1 §F-1) | Phase 1 G1 |
| `--c-dev`·`--c-ace` 본문 텍스트 사용 | `lint-accent-only.ts` (G0-9 §2) | Phase 1 G1 |
| 4.5:1 미달 색 조합 | `lint-contrast.ts` (G0-9 §1) | Phase 1 G1 |
| 신규 토큰 무단 추가 | review (PR 단위 git diff) | 모든 phase |
| spacing/radius 중간값 | review (수동 — 자동 lint 미설계) | 모든 phase |
| alpha 3단 외 값 | review | 모든 phase |

자동 lint 3종 = `lint-inline-root-color`·`lint-contrast`·`lint-accent-only` (Dev rev1 §F 합의).

---

## 9. Phase 1 G1 인계 체크리스트 (Vera → Dev)

- [ ] `app/css/tokens.css` skeleton 생성 (본 G0-4 동결, 본문 §2~§6 그대로 박제) ← **DONE in G0-4**
- [ ] 모든 active 9 + 신규 8 = 17 page에 `<link rel="stylesheet" href="css/tokens.css">` 추가 (Phase 1 G1 작업)
- [ ] dashboard-upgrade.html 인라인 `:root{}` 제거 → tokens.css import로 치환
- [ ] role-signature-card.html partial 인라인 `:root{}` 제거 (Dev rev1 §A-3 실측 = 1건)
- [ ] `lint-inline-root-color.ts` 신규 구현 + build.js 발동 hook
- [ ] 변경 0 (token 값) 검증 — git diff로 hex·spacing 동일성 확인

---

## 10. self-audit (라운드 +1)

vera_rev2 대비 변경 항목:

| # | 변경 | rev2 | 본 G0-4 |
|---|---|---|---|
| V-A | spacing·radius·typography 토큰을 tokens.css에 명시 박제 | spec 산재 | 단일 css 파일에 11+6+21 토큰 박제 |
| V-B | `--c-dev-fallback`·`--c-ace-fallback` 토큰화 | 본문 박제만 | 실제 토큰 박제 (자동 swap 대상화) |
| V-C | semantic state `--ok`·`--warn`·`--bad` 박제 (PD-047 흡수) | 미반영 | 신설 |
| V-D | container·motion·z-index 토큰 박제 | 미반영 | 신설 |
| V-E | font-family·font-feature 명시 | 미반영 | §4-3 박제 |
| V-F | 모바일 typography 자동 swap @media | 미반영 | tokens.css 내 @media 박제 |

**신규 결함 자가 적출**:

| # | 결함 | ROI | 대응 |
|---|---|---|---|
| V-G1 | `--ls-cap` 0.18em vs `--ls-eyebrow` 0.14em 두 토큰 차이가 11px font 기준 ~0.4px — 실측 시각 차이 미미 | NICE | 합치지 않음. hero h-eyebrow는 0.18em 계열 정체성 유지 |
| V-G2 | `--shadow-glow-violet` 단일 색 종속 — Ace 색 변경 시 따라가지 않음 | SHOULD | Phase 1 G1에서 `--c-ace` 참조로 재작성 검토 (PD 가능) |
| V-G3 | typography 21 토큰은 다소 많음 — 모바일 *-m 분리가 본질 | NICE | swap 자동화로 사용처는 `--fs-*` 통일. 외부 사용처는 11 토큰만 보임 |

V-G2만 Phase 1 G1에서 검토 권고.

---

## 11. 출처 매핑 표 (감사 추적)

| 토큰 | 출처 | line |
|---|---|---|
| `--bg`·`--panel*`·`--line*` | dashboard-upgrade.html | 9~14 |
| `--text`·`--text-2`·`--text-3` | dashboard-upgrade.html | 15~17 |
| `--grad-*` | dashboard-upgrade.html | 19~22 |
| `--c-{role}` 8건 | dashboard-upgrade.html | 23~24 |
| `--alpha-*` | vera_rev1 R-D02 | — |
| `--ok`·`--warn`·`--bad` | PD-047 (arki rev3 §2) | — |
| `--sp-*`·`--r-*` | vera_rev1 §1 | — |
| `--fs-*`·`--lh-*`·`--ls-*` | vera_rev1 §2 + 본 G0-4 모바일 보정 | — |
| `--c-{dev,ace}-fallback` | vera_rev2 §D | — |
| container·motion·z-index | vera_rev2 §2-2 + 본 G0-4 신설 | — |

font-family는 dashboard-upgrade.html line 27. `font-feature: 'tnum'`은 본 G0-4에서 명시 박제(이전 산재).

---

## 12. lock 선언

본 G0-4 동결 = `app/css/tokens.css` skeleton 생성 + 본 spec 박제. Phase 1 G1 진입 시 17 페이지 import 작업 + 인라인 `:root{}` 제거가 Dev 인수 항목. tokens.css 자체 변경은 lint-contrast PASS 조건 하에서만.

다음 산출물: G0-6 responsive-policy.md / G0-7 vr-spec.md / G0-9 contrast-check.md (본 turn 동시 박제).
