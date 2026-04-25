---
role: arki
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
artifact: G0-1 inventory
turnId: 10
invocationMode: subagent
recallReason: phase-0-execution
status: locked-for-dev
sources:
  - reports/2026-04-22_dashboard-redesign-ux-responsive/inline-root-dump.json (Dev turnId 9 실측)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/dev_rev1.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/arki_rev2.md §1-1
  - reports/2026-04-22_dashboard-redesign-ux-responsive/ace_rev3.md §1-2 / §3-1
---

# G0-1 Inventory — topic_082 Dashboard 개편

Arki입니다. 본 문서는 Phase 0 G0-1 산출물. Dev turnId 9 실측(`scan-inline-root.ts`)과 직접 정렬해 active·legacy·신규·partial·css·script 인벤토리를 단일 표로 동결합니다. PD-045는 본 토픽에서 **deprecated** (Dev 실측 기반 — 이전 가정 "13 페이지에 인라인 색·레이아웃 토큰 산재"가 사실과 다름). PD-046~PD-050은 본 인벤토리에 격리.

---

## 0. 요약 (한눈)

| 카테고리 | 건수 | 메모 |
|---|---:|---|
| Active 페이지 (현 production) | 9 | 본 토픽 Phase 1~3 대상. partial 1건 포함 |
| Legacy 변종 (archive 이동) | 4 | `dashboard-v3·v3b·v3c·v3d-test.html` |
| 신규 신설 페이지 (Phase 4) | 7 | Home(재구성)·Growth·People·Records 5sub 중 Topics·Sessions·Decisions·Feedback은 기존 페이지를 흡수, Deferrals·Growth·People은 신설 |
| 신규 partial 파일 | 3 | `app/partials/sidebar.html` / `topbar.html` / `role-signature-card.html` |
| 신규 CSS 파일 | 1 | `app/css/tokens.css` (canonical) |
| 신규 scripts | 4 | `scan-inline-root.ts`(Dev DONE) + `lint-inline-root-color.ts` + `lint-contrast.ts` + `lint-accent-only.ts` |
| 신규 tests dir | 1 | `tests/visual/` (Phase 2 G2 산출) |

---

## 1. Active 페이지 9건 — 현 production

Dev turnId 9 `inline-root-dump.json` 직접 인용. 라인 수는 실측값. 인라인 `:root{}` 색·레이아웃·base 토큰 카운트 그대로 박제.

| # | 파일 경로 | 라인 | 사이드바 위치 (현) | 사이드바 위치 (신, D-087) | inline `:root{}` blocks | color tokens (`--c-*`) | layout tokens (`--space-*`·`--radius-*`·`--fs-*`·`--bp-*`) | base/grad tokens | other tokens | partial 의존성 (현→신) | 메모 |
|---:|---|---:|---|---|---:|---:|---:|---:|---:|---|---|
| 1 | `app/index.html` | 205 | Home (랜딩) | **Home** (`/index.html`) — 가벼운 Hero KPI 3 + 5 인덱스 카드 + Recent band | 1 | 0 | 0 | 7 | 0 | nav inline → `app/partials/sidebar.html` | Phase 4에서 재구성. 부분 출시 4 페이지 1번 |
| 2 | `app/dashboard-upgrade.html` | 943 | Dashboard | **Dashboard / Upgrade** (second-nav default) | 1 | **8** | 0 | 13 | 0 | nav inline → sidebar partial | **canonical reference** (D-090). 색 토큰 8개가 G1 lint 강제 흡수 대상 = active 페이지 中 유일 |
| 3 | `app/dashboard-ops.html` | 329 | (없음, 분리 운영) | **Dashboard / Ops** (second-nav 2번) | 1 | 0 | 0 | 9 | 0 | nav inline → sidebar partial | 본체 그대로 유지 (D-087, Master #15). 컴포넌트(`.command-grid` 등) 흡수는 PD-046 |
| 4 | `app/topic.html` | 181 | Records (현 1뎁스) | **Records / Topics** (second-nav default) | 1 | 0 | 0 | 7 | 0 | nav inline → sidebar partial | Phase 4에서 topic-card + session-chip-row 신규 컴포넌트 적용. 부분 출시 4 페이지 4번 |
| 5 | `app/session.html` | 367 | Sessions (현 1뎁스) | **Records / Sessions** (내부 3탭: Current·History·Turn Flow) | 1 | 0 | 0 | 7 | 0 | nav inline → sidebar partial | Phase 4 내부 3탭 합류 |
| 6 | `app/decisions.html` | 121 | Decisions (현 1뎁스) | **Records / Decisions** (second-nav 3번) | 1 | 0 | 0 | 7 | 0 | nav inline → sidebar partial | Records 합류 |
| 7 | `app/feedback.html` | 86 | Feedback (현 1뎁스) | **Records / Feedback** (second-nav 4번) | 1 | 0 | 0 | 7 | 0 | nav inline → sidebar partial | Records 합류 |
| 8 | `app/signature.html` | 269 | Signature (현 1뎁스) | **People** (`/people.html`로 합류·rename 또는 컴포넌트 이전) | 1 | 0 | 0 | 7 | 3 (`--ok`·`--warn`·`--bad`) | `role-signature-card.html` partial 사용 → `app/partials/role-signature-card.html` | PD-029 흡수 트리거. Phase 4에서 people.html로 합류 또는 그대로 두고 nav만 변경 |
| 9 | `app/role-signature-card.html` | 81 | (페이지 아님) | **partial → `app/partials/role-signature-card.html`** | 0 | 0 | 0 | 0 | 0 | partial 자체. Home·People·Growth 위젯에서 재사용 | Dev §A-3 F-A5: 자체 `:root{}` 0건 확인. `<template>` 래핑 불필요(build-time inline 채택) |

### 1-1. Active 페이지 핵심 발견 (Dev 실측 기반)

- **G1 lint 강제 흡수 대상 active 페이지 = 1건만** (`dashboard-upgrade.html`). Arki rev2 §2-1 "fail ≥5 페이지 → spec 재검토" 중단 조건 발동 가능성 0에 수렴.
- **레이아웃 토큰(`--space-*`·`--radius-*`·`--fs-*`·`--bp-*`·`--container-*`) active 페이지 인라인 0건**. PD-045 (`레이아웃 인라인 정리`) 명분 소멸 → **deprecated** 박제.
- **base/grad 토큰(`--bg`·`--panel`·`--panel-*`·`--line`·`--line-2`·`--text`·`--text-*`·`--grad-*`)이 7 active 페이지에 산재** (각 7~13개). Phase 1 `tokens.css` canonical 신설 시 모든 페이지에서 일괄 제거 대상. **PD 신설 불필요** — Phase 1 G1 같은 트랙에서 처리.
- `signature.html`의 `--ok`·`--warn`·`--bad` 3 토큰 — semantic state 토큰 후보. `tokens.css`에 흡수할지 별도 토픽으로 분리할지 → **PD-047**(아래) 신설 권고.

---

## 2. Legacy 4 변종 — archive 대상

| # | 파일 | 라인 | inline color tokens | inline layout tokens | inline base tokens | inline other tokens | archive 이동 경로 (단일 추천) | 처리 시점 (단일 추천) |
|---:|---|---:|---:|---:|---:|---:|---|---|
| L1 | `app/dashboard-v3-test.html` | 1004 | 0 | 4 (`--radius-*`) | 4 | 20 (`--surface-*`·`--cyan-*`·`--blue-*`·`--green-*`·`--amber-*`·`--red-*`·`--purple-*`·`--rose-*`) | `app/legacy/archive/v3-variants/` | **Phase 0 G0 박제 직후** (Dev turnId 14 직전, Phase 1 진입 전) |
| L2 | `app/dashboard-v3b-test.html` | 820 | 0 | 0 | 4 | 24 (cyan·lime·blue·purple·rose·amber·green dim 시리즈 + `--r-*`) | `app/legacy/archive/v3-variants/` | 동일 |
| L3 | `app/dashboard-v3c-test.html` | 775 | 0 | 0 | 5 (`--text`·grad-*) | 19 (card·border·white·muted·dim·cyan·purple·green·amber·red·rose·lime·blue + `--r-*`) | `app/legacy/archive/v3-variants/` | 동일 |
| L4 | `app/dashboard-v3d-test.html` | 576 | **8** (`--c-ace`·…·`--c-vera`) | 0 | 13 | 0 | `app/legacy/archive/v3-variants/` | 동일 |

**총 라인 합 = 3175**. archive 이동 시 production app에서 사라지고, G1 lint·contrast lint·VR baseline 대상에서 자동 제외.

상세 처리 spec은 `legacy-decision.md`(G0-2) 참조.

---

## 3. 신규 신설 페이지 7건 (Phase 4 대상)

ace rev3 §1-2 + arki rev2 §1-1 to_create 흡수 + Records 5 sub 정확한 파일 경로 결정.

### 3-1. 파일 경로 결정 단일 추천

Records 5 sub은 **second-nav 탭** 방식(Vera rev1·rev2 §7-3 wireframe 정합)으로 처리. 즉 `records-*.html` 5 파일 분리가 아닌, **`records.html` 단일 + 5 탭 + 페이지 내부 hash 라우팅**도 옵션이지만, Records의 4 entity가 각자 IA 깊이가 다르고(Sessions는 내부 3탭 추가) 서버측 라우팅·SEO·딥링크 일관성·정적 파일 build 단순성 측면에서 **5 파일 분리 채택**.

| # | 파일 (단일 추천) | 신설/재구성 | 사이드바 위치 (D-087) | 부모 페이지(있는 경우) | Phase 4 산출 spec 출처 |
|---:|---|---|---|---|---|
| N1 | `app/index.html` (재구성) | 재구성 | Home | — | Vera rev2 §7-1 (1024 단일 분기 wireframe) |
| N2 | `app/growth.html` | **신설** | Growth | — | D-060 안 β + 3축 헤더 KPI + 4×2 panel + Registry version footer (arki rev2 §1-1 to_create) |
| N3 | `app/people.html` | **신설** (signature.html 합류·rename) | People | — | 4×2 grid (md 2×4 / sm 1col). signature.html은 Phase 4 G4 통과 후 archive 또는 redirect |
| N4 | `app/topic.html` (재구성) | 재구성 + 컴포넌트 신설 | Records / Topics (default) | Records second-nav | topic-card + session-chip-row 신규 컴포넌트 (vera rev2 §5) |
| N5 | `app/session.html` (재구성) | 재구성 + 내부 3탭 | Records / Sessions | Records second-nav | 내부 3탭 (Current/History/Turn Flow). sequence-panel 재사용 |
| N6 | `app/decisions.html` (재배치) | 재배치 (위치만 변경) | Records / Decisions | Records second-nav | 흡수 — 페이지 자체 변경 최소 |
| N7 | `app/feedback.html` (재배치) | 재배치 | Records / Feedback | Records second-nav | 흡수 — 페이지 자체 변경 최소 |
| N8 | `app/deferrals.html` | **신설** | Records / Deferrals | Records second-nav | PD 카드 60% + D3.js dependsOn 그래프 40% (sticky 560h on desktop) |
| N9 | `app/system.html` | **신설** | System | — | Config + Log + Charter version footer (가벼운 단일 페이지) |

**※ 이 표의 "7건 신설"은 신설(N2·N3·N8·N9 = 4) + 재구성(N1·N4·N5 = 3) 합. N6·N7은 "재배치"로 신설/재구성 양쪽 카운트 외.**

`records.html` 단일 라우터 vs 5 파일 분리 — 본 인벤토리 단일 추천: **5 파일 분리** (위 표). 재호출 시 변경 가능.

### 3-2. Phase 4 미완 시 hidden state 처리 (D-087 spec-lock-decisions 정합)

| 페이지 | Phase 4 미완 시 처리 |
|---|---|
| `growth.html` | nav.js `data-state="pending"` + click disable + tooltip "Phase 4 진행 중" + `aria-disabled="true"` + `tabindex="-1"` (Dev §D D-feedback-8 a11y 보강 흡수) |
| `people.html` | 동일 |
| `deferrals.html` | 동일 |
| `system.html` | 동일 |

부분 출시 4 페이지(Home·Dashboard-Upgrade·Dashboard-Ops·Records-Topics)는 Phase 3 G3 통과 후 즉시 active. 나머지 4 페이지는 Phase 4 G4 통과 후 active.

---

## 4. 신규 partial 파일 (Phase 1 신설)

Dev turnId 9 §C build-time inline 패턴 정합. `<!-- @partial:<id> -->` 마커를 `build.js`가 dist 단계에서 치환.

| 파일 | 사용 페이지 | 산출 시점 | spec 출처 |
|---|---|---|---|
| `app/partials/sidebar.html` | 모든 active + 신규 페이지(11+) | Phase 1 G1 | nav.js 6 카테고리 + Records 5 sub + Dashboard 2 sub. plain HTML(`<aside class="sidebar">…</aside>`). active state는 nav.js가 `data-active="true"` 마킹 (D-feedback-2 인수) |
| `app/partials/topbar.html` | 모바일 hamburger 영역 (mobile <1024 only) | Phase 1 G1 | Vera rev2 §2-2 hamburger spec. `position: fixed top:16 left:16; size:40×40`. desktop 숨김 |
| `app/partials/role-signature-card.html` | Home·People·Growth 위젯 | Phase 1 G1 (Phase 4에서 사용처 확장) | 기존 `app/role-signature-card.html` 마이그레이션. 자체 `:root{}` 없음(Dev §A-3 F-A5 확인). build-time inline으로 FOUC 0 |

partial 디렉토리는 `app/partials/`로 신설. nested partial 0 (Dev §F #4 — 1-pass 제한, nested 발생 시 PD).

---

## 5. 신규 CSS 파일

| 파일 | 산출 시점 | 책임 | spec 출처 |
|---|---|---|---|
| `app/css/tokens.css` | Phase 1 G1 | **canonical 단일 출처**. 8 역할 색(`--c-*`) + base 토큰 + brand + gradient + spacing 8px scale + radius + type + breakpoint(`--bp-mobile`·`--bp-desktop`) + container | arki rev2 §1-4 / vera rev2 §1 / D-087·D-090·D-091 |

`app/css/` 디렉토리 자체가 신설. `tokens.css` 외 추가 css 파일은 본 토픽 scope 외 (PD 후보).

---

## 6. 신규 scripts (lint·scan·partial 처리)

| 파일 | 산출 시점 | 상태 | 책임 |
|---|---|---|---|
| `scripts/scan-inline-root.ts` | Phase 0 G0-5 | **DONE (Dev turnId 9)** | 13 페이지 인라인 `:root{}` 스캔 + 카테고리별 카운트. callable export `scanInlineRoot(appDir)` |
| `scripts/lint-inline-root-color.ts` | Phase 1 G1 | TODO | G1 lint = active 페이지 인라인 `:root{ --c-* }` 재정의 검출. `scan-inline-root` callable 재사용 ~30 LOC. 1건 발견 시 build fail (Dev §B-3 skeleton 박제) |
| `scripts/lint-contrast.ts` | Phase 1 G1 (run은 G3에서) | TODO | G3 contrast = `tokens.css` 13 조합 4.5:1 자동 계산. 자체 구현(WCAG ratio ~50 LOC, Dev §D D-feedback-6 협의 결과: 자체 구현 채택) |
| `scripts/lint-accent-only.ts` | Phase 1 G1 (run은 G3에서) | TODO | G3 accent-only = `--c-dev`·`--c-ace` `color` 속성 사용 검출. 1건 발견 시 build fail |
| `scripts/build.js` (patch) | Phase 1 G1 | EXISTING + patch | `runLints()` 진입부 추가 + `applyPartialsToDist()` dist 단계 추가 (Dev §B-5·§C-3 skeleton) |

---

## 7. dashboard-upgrade vs dashboard-ops 정리 계획

### 7-1. 결정 (D-090 박힘)

`app/dashboard-upgrade.html`을 디자인 reference canonical로 선언. 색·gradient 토큰뿐 아니라 컴포넌트 클래스 체계도 표준 카탈로그.

### 7-2. dashboard-ops 처리

| 항목 | 처리 |
|---|---|
| 페이지 자체 | **그대로 유지** (D-087, Master #15) |
| 위치 | Dashboard / Ops second-nav 2번 |
| 사이드바 적용 | Phase 1 G1에서 partial sidebar로 치환만 |
| `tokens.css` 참조 | Phase 1 G1에서 인라인 base 토큰 9개 제거 + `<link rel="stylesheet" href="css/tokens.css">` 삽입 |
| 컴포넌트(`.command-grid` 등) | **본 토픽 scope 외**. PD-046로 격리 → 별도 트랙에서 dashboard-upgrade canonical 카탈로그(`.kpi-row`·`.section-grid`·`.card`·`.flow-row`·`.cost-row`·`.wide-grid`·`.defer-row`·`.alarm-item`·`.autonomy-banner`)로 흡수 |

### 7-3. canonical 카탈로그 (참고용 — Vera G0-4 owner)

dashboard-upgrade 본체에 정의된 컴포넌트 클래스. Phase 4 신규 페이지(growth·people·deferrals·system)와 ops 흡수 시 본 카탈로그 따름.

| 컴포넌트 클래스 | 용도 |
|---|---|
| `.kpi-row` | 상단 KPI 4col grid wrapper |
| `.section-grid` | 본문 2col 섹션 |
| `.card` | 단일 카드 컨테이너 |
| `.flow-row` | 흐름·시퀀스 row |
| `.cost-row` | 비용·메트릭 row |
| `.wide-grid` | 와이드 grid |
| `.defer-row` | PD/이연 row |
| `.alarm-item` | 알람·경보 row |
| `.autonomy-banner` | 자율성 배너 |

Phase 4 진입 시 Vera가 G0-4 token-axes-spec.md에 본 카탈로그 박제. 본 인벤토리는 위치만 명시.

---

## 8. 새 PD 격리 (PD-045 deprecate, PD-046~PD-050 신설/유지)

| PD | 상태 | 사유 |
|---|---|---|
| **PD-045** "13 페이지 인라인 색·레이아웃 토큰 산재 정리" | **deprecated** | Dev 실측 기반 — active 페이지 색 토큰 인라인 1건만(dashboard-upgrade), 레이아웃 토큰 인라인 0건. Phase 1 G1이 색 1건 + base 토큰 산재 7건을 한 트랙에서 흡수. 별도 PD 명분 소멸 |
| **PD-046** dashboard-ops 컴포넌트(`.command-grid` 등)를 dashboard-upgrade canonical 카탈로그로 흡수 | 신설 | D-090 부수. ops 페이지 자체는 본 토픽에서 그대로 유지, 컴포넌트 표준화는 별도 트랙 |
| **PD-047** semantic state 토큰(`--ok`·`--warn`·`--bad`) tokens.css 흡수 여부 결정 | 신설 | signature.html 인라인 3 토큰 처리. tokens.css에 흡수할지 별도 시맨틱 레이어로 분리할지 결정 필요 |
| **PD-048** mock fixture 갱신 주기 + Playwright docker image 갱신 주기 | 신설 | D-089 인프라 결정의 운영 PD. image 갱신 시 baseline 재캡처 트리거 |
| **PD-049** font dpr 2 viewport baseline (375 deviceScaleFactor 2) 추가 | 신설 (조건부) | Vera §3-1 dpr 1 고정 결정의 부수. retina baseline 확장 — Phase 5 이후 |
| **PD-050** accent-only lint 동적 JS 색 주입 검출 | 신설 (조건부) | Vera V-4. inline grep으론 잡히지 않음. D-003 read-only 폐기 시(B2 발동) |

---

## 9. 인벤토리 통과 조건 (G0-1 PASS 체크)

| 통과 기준 | 결과 |
|---|---|
| Active 9 페이지 라인 수·역할·IA 매핑 | PASS — §1 표 9건 박제 |
| Legacy 4 변종 archive 결정 + 라인 수 | PASS — §2 표 4건 박제 (총 3175 라인) |
| 신규 신설 7건 파일 경로 + Phase 4 spec 출처 | PASS — §3 표 N1~N9 박제 |
| 신규 partial 파일 위치 + 사용처 | PASS — §4 표 3건 박제 |
| 신규 css 파일 + scripts | PASS — §5·§6 표 |
| dashboard-upgrade vs dashboard-ops 정리 계획 | PASS — §7 박제. canonical은 D-090, 컴포넌트 흡수는 PD-046 |
| inline-root-dump 인용 정합 | PASS — Dev turnId 9 dump 직접 인용 (color=8 / layout=0 / base 산재) |

**G0-1 인벤토리 동결**. 다음 산출물: `legacy-decision.md`(G0-2), `ia-spec.md`(G0-3).
