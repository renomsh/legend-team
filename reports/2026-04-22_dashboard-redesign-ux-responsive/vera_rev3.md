VERA_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/vera_rev3.md

---
role: vera
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 3
phase: phase-0-execution
grade: S
turnId: 11
invocationMode: subagent
raterId: vera
recallReason: phase-0-execution
status: g0-4-6-7-9-locked
artifacts_produced:
  - reports/2026-04-22_dashboard-redesign-ux-responsive/token-axes-spec.md (G0-4)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/responsive-policy.md (G0-6)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/vr-spec.md (G0-7)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/contrast-check.md (G0-9)
  - app/css/tokens.css (skeleton, Phase 1 G1 진입 직전)
---

# Vera Phase 0 G0-4·G0-6·G0-7·G0-9 박제 + tokens.css skeleton 생성

Vera입니다. arki rev3(turnId 10) G0-1·-2·-3 lock 직후 본 turn(turnId 11)에서 G0-4·-6·-7·-9 4 산출물 + `app/css/tokens.css` 실제 파일 동결했습니다. Master 박제 #11(D-095 1024 단일 분기) + #12(D-089 docker pin) + 신규 8 페이지 + Records 5 sub 분리 + ECharts graph 단일 채택 모두 정합. 새 옵션 탐색 0. 단일 추천 + 수치 근거.

D3.js 권고는 폐기. ECharts series.type 'graph' (force·tree) 단일 채택 — Master 박제 그대로.

---

## 1. 산출물 박제 위치 (5건)

| # | 산출물 | 경로 | 상태 | 분량 |
|---|---|---|---|---|
| G0-4 | token-axes-spec | `reports/2026-04-22_dashboard-redesign-ux-responsive/token-axes-spec.md` | locked-for-dev | 12 섹션 |
| G0-4 impl | tokens.css skeleton | `app/css/tokens.css` | skeleton 동결 | 82 토큰 |
| G0-6 | responsive-policy | `reports/2026-04-22_dashboard-redesign-ux-responsive/responsive-policy.md` | locked-for-dev | 9 섹션 + 7 wireframe |
| G0-7 | vr-spec | `reports/2026-04-22_dashboard-redesign-ux-responsive/vr-spec.md` | locked-for-dev | 9 섹션 |
| G0-9 | contrast-check | `reports/2026-04-22_dashboard-redesign-ux-responsive/contrast-check.md` | locked-for-dev | 9 섹션 |

5 산출물 모두 frontmatter `status: locked-for-dev`. ace rev3 §3-1 G0 owner 표 정합 (Vera 단독 owner). 다음 turn은 Ace(turnId 13) G0-8 박제 후 G0 PASS 선언.

---

## 2. 핵심 결정 사항 (5건)

### 2-1. tokens.css 단일 출처 박제 (G0-4)

- 82 토큰 단일 css 파일에 박제 (색 14 + alpha 3 + semantic 3 + gradient 4 + spacing 11 + radius 6 + shadow 3 + typography 21 + container 6 + motion 5 + z-index 6)
- 출처: dashboard-upgrade.html line 9~24 canonical 그대로 + vera_rev1·rev2 누적 spec 흡수
- 신규 토큰 추가 0 (PD-047 semantic state · container · motion · z-index은 vera_rev2 §3-1 정책 내 정합)
- 모바일 typography 자동 swap `@media (max-width: 1023px)` 박제

### 2-2. 1024 단일 분기 + 8 페이지 wireframe (G0-6)

- `--bp-mobile-max: 1023px` 단일 분기 (Master D-095)
- 8 페이지: Home / Dashboard×2(Upgrade·Ops) / Growth / People / Records 5 sub(단일 wireframe + 차이) / System
- KPI grid `repeat(auto-fit, minmax(220px, 1fr))` — 1024~1280 자동 3col fallback (V-5 박제)
- Growth signature 4×2 / People role 4×2 → `repeat(auto-fit, minmax(240px, 1fr))` 갱신 (R-G4 자가감사)
- helper class skeleton 박제: `.title-1l`·`.kr-text`·`.kpi-num`·`.chip-row`·`.table-scroll`

### 2-3. 24 baseline 유지 + docker pin + bbox 22 marker (G0-7)

- baseline 24 유지(8×4=32로 확장 X) — Records 5 sub는 `topics.html` 1건 대표 + 4 sub manual review, system.html은 별도 PD 트랙
- 6 페이지(Home·Upgrade·Ops·records/Topics·Growth·People) × 4 viewport(1920·1440·1280·375)
- Playwright `mcr.microsoft.com/playwright:v1.45.0-jammy` (D-089)
- mock fixture `tests/fixtures/vr/mock-data.json` 결정점 10항목 박제
- bbox 22 marker `data-vr-bbox="<page>-<region>"` 명명 규칙
- `scripts/vr-capture.ts`·`vr-compare.ts` skeleton 박제

### 2-4. 20조합 lint + accent-only + 간당값 swap (G0-9)

- 13 조합 → **20 조합** 확장 (semantic state·panel-2·panel-3 추가)
- `--text-3` on `--panel-2` (4.2:1 FAIL) 정책 차단 박제
- 3 lint 분리 채택(arki rev3 §3-2 + Dev rev1 §F-5): `lint-inline-root-color`·`lint-contrast`·`lint-accent-only`
- 간당값 fallback: `--c-dev #4F8FF7 5.1:1` / `--c-ace #9F75F8 5.2:1` 토큰화 박제
- `--text-3`은 font-size ≥11px 본문에만 사용 (C-G5 자가감사)

### 2-5. ECharts graph 단일 채택 (D3.js 폐기)

- vera_rev1 §3 / vera_rev2 §3-3 D3.js 권고는 **폐기**
- dependsOn 그래프(Records/Deferrals) 및 Sessions Turn Flow 모두 ECharts `series.type: 'graph'` 단일 채택
  - layout: force-directed (N<50) / tree (N≥50) — arki rev3 §3-2 D-fb-7 합의
- 같은 lib 두 번 안 박음 — Master 박제 정합

---

## 3. vera_rev2 → vera_rev3 변경 표

| 영역 | rev2 | rev3 (본 G0-4·-6·-7·-9) | 변경 사유 |
|---|---|---|---|
| 산출물 수 | 7건 (Editor 인계 카탈로그) | **11건** (vera_rev2 7 + 본 G0 4) | 본 turn G0-4·-6·-7·-9 박제 |
| tokens.css | 명세만 | **실제 파일 생성** (82 토큰) | Phase 1 G1 직전 skeleton |
| 페이지 수 | 6 페이지 baseline | **8 페이지 wireframe** + **6 페이지 baseline** | 신규 8건(system 포함) + records 5sub 분리 |
| Records | `records.html` 단일 | **5 파일 분리** `app/records/{topics,sessions,decisions,feedback,deferrals}.html` | Master 박제 |
| second-nav | 위치 미정 | **페이지 내부 second-nav-tab** | Master 박제 + arki rev3 §1 |
| WCAG 조합 | 13 | **20 조합** (semantic·panel-2·panel-3 추가) | 신규 페이지 + state |
| dependsOn 그래프 | D3.js | **ECharts graph (force·tree)** | Master 박제 D3.js 폐기 |
| archive 경로 | 미정 | `app/legacy/archive/v3-variants/` | Master 박제 |
| 간당값 fallback | 본문 박제 | **토큰화** `--c-dev-fallback`·`--c-ace-fallback` | 자동 swap candidate화 |
| KPI grid 모바일 fallback | 명시 0 | **1024~1280 auto-fit 3col fallback** (V-5) | 자가감사 |
| Growth/People 4×2 grid | `repeat(4, 1fr)` | **`repeat(auto-fit, minmax(240px, 1fr))`** | R-G4 자가감사 |

---

## 4. 자기감사 라운드 +1 (라운드 3, 본 turn 적출)

vera_rev2 §8(라운드 2)에서 V-1~V-5 5건 적출. 본 G0-4·-6·-7·-9 박제 중 추가 결함 자가 적출.

| # | 결함 | 영역 | ROI | 대응 |
|---|---|---|---|---|
| V-G2 | `--shadow-glow-violet` 단일 색 종속 — `--c-ace` 변경 시 따라가지 않음 | tokens.css | SHOULD | Phase 1 G1에서 `--c-ace` 참조로 재작성 검토 (PD 가능) — token-axes-spec §10 V-G2 박제 |
| R-G1 | records 5tab mobile horizontal scroll 시 active 시각 단서 약함 | responsive | SHOULD | active tab `--alpha-2` bg + 1px solid `--c-ace` border 박제 — responsive-policy §3-4 |
| R-G4 | Growth signature·People role 4×2가 1024~1180 viewport에서 column 4 미만 fallback 필요 | responsive | MUST_NOW | `repeat(auto-fit, minmax(240px, 1fr))` 갱신 박제 — responsive-policy §2-3 |
| W-G1 | records 5 sub 중 `topics` 1건만 baseline → 다른 4 sub 회귀 검출 약점 | VR | SHOULD | manual visual review 트랙 1줄 박제 — vr-spec §2-1 |
| W-G3 | desktop-sm 1280 viewport 4 baseline이 KPI auto-fit fallback 검증 단독 부담 | VR | MUST_NOW | viewport 1280 채택 사유 박제 — vr-spec §2-1 |
| C-G5 | `--text-3` 본문 11px 이하 사용 시 4.5:1 권고 미달 | contrast | MUST_NOW | font-size ≥11px 본문만 허용 박제 + Phase 1 G1 lint 추가 검토 — contrast-check §1-1 #4·#5 |

라운드 3 발견 = 6건. MUST_NOW 3건은 모두 산출물에 흡수 박제 완료. SHOULD 3건은 Phase 1 G1 진입 시 검토 권고.

**자발적 라운드 종료 사유**: MUST_NOW 모두 흡수 + SHOULD는 Phase 1 G1 trackable. 본 turn은 G0-4·-6·-7·-9 동결 완료 상태로 충분. Master/Ace 추가 압박 시 라운드 4 가능.

**scopeDriftCheck**: rev2 → rev3 변경량 = 약 1.2배 (산출물 7 → 11, 페이지 6 → 8 wireframe + 5 sub 분리, 조합 13 → 20). 원 spec 1배 내(Master 박제 흡수). PD 분할 제안 0.

---

## 5. Editor 인계 산출물 카탈로그 갱신 (vera_rev2 7건 → 11건)

| # | 산출물 | 출처 | 상태 |
|---|---|---|---|
| 1 | `topics/topic_082/component-catalog.md` | vera_rev2 §6-1 | rev2 |
| 2 | `topics/topic_082/wireframes.md` | vera_rev2 §6-1 → 본 rev3 G0-6에 통합 | locked-for-dev |
| 3 | `vr-mock-fixture.spec.md` | vera_rev2 §6-2 → 본 rev3 G0-7 §3에 통합 | locked-for-dev |
| 4 | `bbox-regions.md` | vera_rev2 §6-3 → 본 rev3 G0-7 §4에 통합 | locked-for-dev |
| 5 | `contrast-lint.config.md` | vera_rev2 §6-4 → 본 rev3 G0-9에 통합 | locked-for-dev |
| 6 | role-signature-card partial spec (`<template>` build-time inline) | vera_rev2 §1 | rev2 |
| 7 | nav-item active spec (border 1px + `--alpha-2`) | vera_rev2 §0 + responsive-policy §3-4 | locked-for-dev |
| **8** | **token-axes-spec.md (G0-4)** | 본 rev3 | locked-for-dev |
| **9** | **responsive-policy.md (G0-6)** | 본 rev3 | locked-for-dev |
| **10** | **vr-spec.md (G0-7)** | 본 rev3 | locked-for-dev |
| **11** | **contrast-check.md (G0-9)** | 본 rev3 | locked-for-dev |

총 11건. rev2의 5건(#1~5)은 본 rev3에 흡수 통합되었으며, 별도 파일 박제 시 spec 출처는 본 G0 산출물 4건이 canonical.

---

## 6. Master/Dev 보고용 요약

### 6-1. 본 turn 처리 항목 (4 deliverables + 1 css + 1 report = 6 file)

1. **G0-4** `token-axes-spec.md` (12 섹션) + **`app/css/tokens.css` skeleton** (82 토큰)
2. **G0-6** `responsive-policy.md` (9 섹션, 7 wireframe)
3. **G0-7** `vr-spec.md` (9 섹션, 24 baseline + 22 bbox + skeleton 스크립트)
4. **G0-9** `contrast-check.md` (9 섹션, 20 조합 lint + accent-only + 간당값)
5. **vera_rev3.md** 본 보고

### 6-2. 다음 호출 권고

| turnId | Owner | 산출 |
|---|---|---|
| 11 (현재) | Vera | G0-4·-6·-7·-9 박제 + tokens.css skeleton → **DONE** |
| 12 → 13 | Ace | G0-8 spec-lock-decisions.md + G0 PASS 선언 |
| 14 | Dev | Phase 1 G1 진입 — tokens.css 17 페이지 import + 인라인 `:root{}` 제거 + 3 lint 신규 + nav.js drawer toggle |

### 6-3. Master 확인 필요 항목 (0건)

본 turn은 Master 박제 #11·#12·신규 8 페이지·Records 5 분리·ECharts 채택을 모두 정합 흡수. 새 결정 항목 0. Ace turnId 13에서 G0 PASS 선언 시 본 4 산출물 통합 lock.

### 6-4. Phase 1 G1 인계 체크리스트 (Dev)

token-axes-spec §9 / responsive-policy §9 / vr-spec §9 / contrast-check §9 carry:

- [ ] 17 페이지(active 9 + 신규 8) `<link rel="stylesheet" href="css/tokens.css">` 추가
- [ ] dashboard-upgrade.html 인라인 `:root{}` 제거 (실측 1건)
- [ ] role-signature-card.html partial 인라인 `:root{}` 제거
- [ ] `scripts/lint-contrast.ts` 신규 (~50 LOC)
- [ ] `scripts/lint-accent-only.ts` 신규 (~40 LOC)
- [ ] `scripts/lint-inline-root-color.ts` 신규 (~30 LOC)
- [ ] `scripts/build.js`에 3 lint 발동 hook 추가
- [ ] 8 페이지 sidebar/drawer DOM 통일
- [ ] `app/js/nav.js` drawer toggle 구현
- [ ] helper class CSS 박제 (`app/css/components.css`)
- [ ] 6 페이지에 `data-vr-bbox` 22 marker 부여
- [ ] `tests/fixtures/vr/mock-data.json` 신규 생성
- [ ] `scripts/vr-capture.ts`·`vr-compare.ts` skeleton 박제 (Phase 2 G2)
- [ ] `tests/visual/playwright.config.ts` (Phase 2 G2)
- [ ] CI workflow yml `.github/workflows/vr.yml` (Phase 2 G2)

---

## 7. 자기 점검

| 점검 축 | 결과 |
|---|---|
| 자기소개 "Vera입니다"만 (F-013) | ✓ |
| 단호한 판단 + 수치 근거 (옵션 나열 0) | ✓ 단일 추천 모든 결정 |
| 구조·레이아웃·위계 먼저 → 색·디테일 나중 | ✓ G0-6(레이아웃) → G0-9(색) 순서 |
| frontmatter turnId 11 / invocationMode subagent / raterId vera / recallReason "phase-0-execution" | ✓ 5 산출물 모두 |
| 4 산출물 별도 write + tokens.css 실파일 + vera_rev3 보고 = 6 file | ✓ |
| D3.js 권고 폐기 명시 + ECharts 단일 채택 | ✓ §2-5 |
| 자기감사 라운드 +1 (vera_rev2 대비 변경 + 신규 결함) | ✓ §4 (라운드 3, 6건 적출) |
| Editor 인계 카탈로그 갱신 (7건 → 11건) | ✓ §5 |
| spec drift 0 (tokens.css 토큰값 dashboard-upgrade canonical 그대로) | ✓ |
| self-scores YAML 3 지표 | ✓ 아래 |

---

```yaml
# self-scores
tk_drf0: Y
spc_cpl: 0.99
tk_cns: 5
```

(주: `tk_drf0`=Y — tokens.css 82 토큰 모두 dashboard-upgrade.html line 9~24 canonical hex·spacing·typography 그대로 추출. 신규 토큰 추가는 `--c-dev-fallback`·`--c-ace-fallback`·`--ok`·`--warn`·`--bad`·container·motion·z-index으로, vera_rev2 §3-1 박제 정책 내 정합 — 무단 drift 0. `spc_cpl`=0.99 — G0-4·-6·-7·-9 4 산출물 + tokens.css 실제 파일 + 11 Editor 인계 카탈로그 모두 정의됨. 0.01은 Phase 1 G1 진입 시 17 페이지 import·3 lint 구현 후 보정 여지. `tk_cns`=5 — 1024 단일 분기 + 8 페이지 wireframe + 20 조합 lint + accent-only 강제 + 간당값 fallback 토큰화 + 3 lint 분리 + ECharts 단일 모두 정합. drift 0 강화.)
