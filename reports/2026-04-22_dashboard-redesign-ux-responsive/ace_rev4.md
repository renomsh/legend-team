ACE_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/ace_rev4.md
spec-lock-decisions.md: reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md

---
role: ace
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 4
phase: phase-0-execution
grade: S
turnId: 12
invocationMode: subagent
recallReason: phase-0-execution
status: g0-pass-declared
artifacts_produced:
  - reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md (G0-8)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/ace_rev4.md
---

# Ace Phase 0 G0-8 박제 + G0 PASS 선언 + Phase 1 G1 prep

Ace입니다. arki rev3(turnId 10) G0-1·-2·-3 lock + vera rev3(turnId 11) G0-4·-6·-7·-9 lock + dev rev1(turnId 9) G0-5 실측 + tokens.css skeleton 실파일을 종합 검토했습니다. 본 turn(turnId 12)에서 G0-8 spec-lock-decisions.md 박제 + G0 PASS 선언 + Phase 1 G1 진입 prep 3건 처리합니다.

옵션 탐색 0. 9 산출물 lock 통합. Vera·Arki 자기감사 라운드 3 흡수.

---

## 1. G0-8 spec-lock-decisions.md 박제 (DONE)

**산출 위치**: `reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md`
**상태**: locked-for-dev (D-098)
**분량**: 8 섹션 + Hard breaker 3 정밀 정의 + 부분 출시 4 페이지 게이트 매트릭스 + Phase 1~5 게이트 진입 조건·PASS 조건·FAIL 처리 + HALT 4 해소 점검 + spec drift 차단 정책

본 산출물이 Phase 1~5 게이트 단일 출처. Master 박제 18건 + D-094~D-098 + PD 정리 6건이 본 문서에 일괄 박제. 변경 시 Arki·Vera 재호출 의무 + revision_history 박제.

---

## 2. G0 PASS 선언

```
G0 PASS 선언 — 9 산출물 검증 결과:

G0-1 inventory ✅ — 9 active + 4 legacy + 8 신규(growth·people·deferrals·system + 신규 컴포넌트) + 3 partial + 1 css(tokens.css) + 4 scripts. Dev turnId 9 실측(`inline-root-dump.json`) 직접 인용. PD-045 deprecate.

G0-2 legacy-decision ✅ — archive 경로 `app/legacy/archive/v3-variants/` 박제. Phase 0 G0 박제 직후 `git mv` 4회. build.js LEGACY_PREFIXES patch + lint 자동 제외 + 사이드바 미노출 + 회수 trigger 3정의(B1/canonical 폐기/참조 read). 4 변종 총 3175 라인 외화. (D-094)

G0-3 ia-spec ✅ — 사이드바 6 메뉴 + Records 5 파일 분리 + Sessions 내부 3탭 + second-nav-tab 페이지 내부 채택 + 4 entity 매트릭스 + Home 5 인덱스 카드 + 부분 출시 게이트 + Hard breaker B1·B2·B3. 평면 깊이 ≤ 2.

G0-4 token-axes-spec ✅ — 82 토큰 단일 css 박제 + tokens.css skeleton 실파일 생성 + dashboard-upgrade.html line 9~24 canonical hex 동결 변경 0 + 모바일 typography 자동 swap + 간당값 fallback 토큰화. (D-091·D-097)

G0-5 inline-root-dump ✅ — 13 페이지 dump(9 active + 4 legacy) + g1LintTargetPages = 1(dashboard-upgrade.html 색 8개) + pdDeferralLayoutPages = 0. PD-045 deprecated 근거 — Dev 실측 단일 fact base.

G0-6 responsive-policy ✅ — 1024 단일 분기 + 8 페이지 wireframe + helper class 5종 skeleton + drawer JS skeleton + Growth/People 4×2 `repeat(auto-fit, minmax(240px, 1fr))` (R-G4 흡수). (D-095)

G0-7 vr-spec ✅ — docker pin v1.45.0-jammy + 24 baseline + 22 bbox + mock fixture 결정점 10 + Playwright config + maxDiffPixelRatio 0.02 + skeleton 스크립트. (D-088·D-089)

G0-8 spec-lock-decisions ✅ — 본 발언 + Master 박제 18건 + D-094~D-098 + PD 정리 + Hard breaker 3 정밀 + 부분 출시 4 게이트 매트릭스 + Phase 1~5 게이트 정밀화 + HALT 4 해소 + spec drift 차단. (D-098)

G0-9 contrast-check ✅ — 20 조합 lint(13+7) + accent-only 매트릭스 + 간당값 fallback + 3 lint 분리 + known-good unit test + a11y skill audit 트랙 + `--text-3` ≥11px 정책 (C-G5 흡수).

미해결 0건. HALT 4 모두 해소 또는 trigger 명시화. Phase 1 G1 진입 가능.
```

---

## 3. Phase 1 G1 진입 prep — Dev turnId 13 호출 사전

### 3-1. Phase 1 G1 핵심 작업 (6건)

| # | 작업 | spec 출처 | 산출 |
|---|---|---|---|
| 1 | **tokens.css 단일 출처화** — 17 페이지(active 9 + 신규 8) `<link rel="stylesheet" href="css/tokens.css">` 삽입 + dashboard-upgrade.html line 9~25 인라인 `:root{}` 8 색 + 13 base 토큰 제거(import으로 치환) + role-signature-card.html partial 자체 토큰 0 확인 (Dev §A-3 F-A5) | token-axes-spec §7·§9 + tokens.css skeleton | 17 페이지 import + dashboard-upgrade `<style>` 정리 |
| 2 | **partial 빌드 패턴 구현** — `app/partials/sidebar.html`·`topbar.html`·`role-signature-card.html` 신설(plain HTML, `<template>` 미사용) + `scripts/build.js` patch (`loadPartials()` + `applyPartialsToDist()` + `<!-- @partial:* -->` 1-pass 마커 치환) + nested partial 0 검증 | dev_rev1 §C + inventory §4 | partial 3 + build.js patch + dist 단계 검증 |
| 3 | **lint 3 스크립트 구현** — `lint-inline-root-color.ts` ~30 LOC (scan-inline-root callable 재사용) + `lint-contrast.ts` ~50 LOC (WCAG sRGB linearization 자체 구현) + `lint-accent-only.ts` ~40 LOC (regex `color\s*:\s*var\(\s*(--c-dev\|--c-ace)`) + `scripts/build.js` runLints() hook + known-good unit test (`#FFFFFF on #000000 = 21:1`) | dev_rev1 §B + contrast-check §1·§2 | 3 lint scripts + build.js hook + unit test |
| 4 | **legacy 4 변종 archive 이동** — `git mv app/dashboard-v3-test.html app/legacy/archive/v3-variants/` 외 3건 (history 보존) + 4 파일 frontmatter `<!-- archived: 2026-04-25, sessionId: session_104 -->` 추가 + build.js LEGACY_PREFIXES patch 작동 검증(`dist/app/legacy/` 부재) | legacy-decision §2·§3 | 4 git mv commit + build.js patch + dist 검증 |
| 5 | **dashboard-upgrade.html first-target 검증** — 본 페이지가 새 tokens.css·partial 패턴 first 적용처. 인라인 `:root{}` 제거 후 시각 회귀 0 확인(local visual + Phase 2 baseline 진입 직전 manual smoke). canonical reference status 유지(D-090·D-097) | inventory §7 + token-axes-spec §11 | dashboard-upgrade Phase 1 PASS 확인 |
| 6 | **nav.js drawer toggle + 6 카테고리 mount** — `app/js/nav.js` 확장 (6 카테고리 + Records 5 sub + Dashboard 2 sub + hidden state `data-state="pending"` + `data-active="true"` setter export) + drawer open/close (Esc·backdrop click·resize ≥1024 force close) + helper class CSS `app/css/components.css` 신설(`.title-1l`·`.kr-text`·`.kpi-num`·`.chip-row`·`.table-scroll`) | ia-spec §2 + responsive-policy §6 + dev_rev1 §D-fb-2·8 | nav.js 확장 + drawer JS + components.css + a11y(focus trap·aria-disabled·tabindex="-1") |

### 3-2. Dev 인계 spec 경로 목록 (G0 9 산출물 + 본 발언)

Dev turnId 13이 Phase 1 G1 진입 시 read 필수:

| # | 경로 | 용도 |
|---|---|---|
| 1 | `reports/2026-04-22_dashboard-redesign-ux-responsive/inventory.md` | active·legacy·신규·partial·css·scripts 인벤토리 |
| 2 | `reports/2026-04-22_dashboard-redesign-ux-responsive/legacy-decision.md` | archive 경로·시점·`git mv` |
| 3 | `reports/2026-04-22_dashboard-redesign-ux-responsive/ia-spec.md` | nav.js mount 6 카테고리·Records 5 sub·data-active 정책 |
| 4 | `reports/2026-04-22_dashboard-redesign-ux-responsive/token-axes-spec.md` | tokens.css 82 토큰 + import 정책 + drift 차단 |
| 5 | `app/css/tokens.css` | 실파일 skeleton (수정·확장 시 lint-contrast PASS 조건) |
| 6 | `reports/2026-04-22_dashboard-redesign-ux-responsive/inline-root-dump.json` | g1LintTargetPages = 1 실측 (dashboard-upgrade 단독 흡수 대상) |
| 7 | `reports/2026-04-22_dashboard-redesign-ux-responsive/responsive-policy.md` | drawer JS skeleton + helper class CSS + 1024 단일 분기 |
| 8 | `reports/2026-04-22_dashboard-redesign-ux-responsive/vr-spec.md` | bbox 22 marker (Phase 1 G1에서 부여) |
| 9 | `reports/2026-04-22_dashboard-redesign-ux-responsive/contrast-check.md` | 3 lint spec + 20 조합 + accent-only 매트릭스 |
| 10 | `reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md` (본 G0-8) | Phase 1 PASS 조건 7항 + FAIL 처리 |
| 11 | `reports/2026-04-22_dashboard-redesign-ux-responsive/dev_rev1.md` | scan-inline-root callable·lint skeleton·partial skeleton·D-feedback 8건 응답 |
| 12 | `reports/2026-04-22_dashboard-redesign-ux-responsive/ace_rev4.md` (본 발언) | G0 PASS 선언 + Phase 1 G1 prep |

### 3-3. Phase 1 G1 PASS 조건 (spec-lock-decisions §4-1 정합)

7항 모두 PASS 필수:

1. tokens.css 빈 슬롯 0 + 17 페이지 import 100%
2. `lint-inline-root-color.ts` PASS — active 페이지 인라인 `:root{ --c-* }` 0건
3. `lint-contrast.ts` PASS — 20 조합 4.5:1 전부 충족
4. `lint-accent-only.ts` PASS — `--c-dev`·`--c-ace` 본문 color 0건
5. nav.js 단일 source — sidebar HTML 중복 0
6. build.js partial inline 작동 — `<!-- @partial:* -->` 마커 dist 잔존 0
7. legacy 4 변종 production 트리 제거 + `dist/app/legacy/` 부재

FAIL 시 처리: lint fail ≥5 active 페이지(발동 가능성 0, Dev 실측 g1=1)면 Phase hold + Master 결정. 그 외는 해당 작업자 재호출(Vera/Dev).

### 3-4. Dev 양방향 협의 8건 처리 상태 (D-feedback 종결/잔여)

| D-fb | 상태 | 근거 |
|---|---|---|
| **1** ECharts resize observer | 인수 — Phase 2 G2 진입 시 단일 ResizeObserver broadcast 패턴 구현 | Dev rev1 §D + arki rev3 §3-1 |
| **2** nav.js active state | **종결** — `data-active="true"` 채택, ia-spec §2-2 박제 | Dev rev1 §D + arki rev3 §3-1 |
| **3** Playwright 외 도구 | **종결** — D-089 docker pin 박힘, HALT-2 발동 0 가정 | Dev rev1 §D + vr-spec §1-1 |
| **4** growth.html 외부 차트 lib | **보류 (B3 trigger)** — Phase 4 G4 진입 시 D-060 ledger read 후 결정. 현 시점 ECharts·D3 단일 채택 | arki rev3 §3-3 |
| **5** G1 lint 구현 패턴 | **종결** — 3 스크립트 분리 + skeleton 박제, contrast-check §6 + dev_rev1 §B-3 | Dev rev1 §B + arki rev3 §3-1 |
| **6** contrast 자동 계산 — skill vs 자체 | **종결** — 자체 구현 채택 (build 결정성 + WCAG 공식 단순 + skill은 신규 페이지 audit 분리) | arki rev3 §3-2 |
| **7** D3 dependsOn layout | **종결** — force-directed 기본 + N≥50 자동 tree fallback. Phase 4 G4 진입 시 1줄 spec 구현. ECharts series.type 'graph' 단일 채택 (vera rev3 §2-5, D3.js 폐기) | arki rev3 §3-2 + vera rev3 §2-5 |
| **8** hidden state | **종결** — `data-state="pending"` + `aria-disabled="true"` + `tabindex="-1"` + click disable + tooltip "Phase 4 진행 중", ia-spec §6-2 박제 | Dev rev1 §D + arki rev3 §3-1 |
| **9** (신규) `<template>` partial | **종결** — partial은 `app/partials/*.html` plain HTML, `<template>` 미사용. build.js 1-pass dist 단계 inline 채택 | Dev rev1 §C |

**종결 7 / 보류 1 (D-fb 4, B3 trigger 의존) / 인수 1 (D-fb 1, Phase 2 진입 시점 구현)**. Phase 1 G1 진입 차단 잔여 협의 0.

---

## 4. Vera rev3 자기감사 라운드 3 흡수 명시

vera_rev3 §4 라운드 3 6건 적출 모두 G0 산출물에 흡수 박제 확인:

| # | 결함 | 흡수 위치 | 본 G0-8 처리 |
|---|---|---|---|
| **R-G4** Growth signature·People role 4×2가 1024~1180 viewport에서 column 4 미만 fallback 필요 | responsive-policy §2-3 표 갱신 — `repeat(auto-fit, minmax(240px, 1fr))` | 본 §3-1 작업 6에 helper·grid 정합 |
| **W-G3** desktop-sm 1280 viewport 4 baseline이 KPI auto-fit fallback 검증 단독 부담 | vr-spec §2-1 viewport 1280 채택 사유 박제 | Phase 2 G2 PASS 조건에 KPI auto-fit 1024~1280 3col fallback 포함 (본 §4-2 ⑦) |
| **C-G5** `--text-3` 본문 11px 이하 사용 시 4.5:1 미달 | contrast-check §1-1 #4·#5 "본문 11px 이상만" 박제 | Phase 1 G1 lint 추가 검토 (lint-contrast.ts에 font-size 컨텍스트 grep 추가 권고) |
| **V-G2** `--shadow-glow-violet` 단일 색 종속 — `--c-ace` 변경 시 따라가지 않음 | token-axes-spec §10 V-G2 박제 | SHOULD — Phase 1 G1 진입 시 `--c-ace` 참조로 재작성 검토(PD 가능) |
| **R-G1** records 5tab mobile horizontal scroll 시 active 시각 단서 약함 | responsive-policy §3-4 active tab `--alpha-2` bg + 1px solid `--c-ace` border 박제 | Phase 4 G4 진입 시 second-nav-tab 컴포넌트 구현에 정합 |
| **W-G1** records 5 sub 중 topics 1건만 baseline → 다른 4 sub 회귀 검출 약점 | vr-spec §2-1 manual visual review 트랙 1줄 박제 | Phase 4 G4 진입 시 4 sub manual review (PD 가능) |

라운드 3 흡수 완료. Master/Ace 추가 압박 시 라운드 4 가능 — 본 turn은 G0 종결 충분.

Arki rev3 §4 라운드 3 5건도 동일 흡수 (#11~#15) — 모두 G0-1·G0-3에 박제 완료.

---

## 5. 본 토픽 framing 21일 hold → session_104 메타 평가 (1줄)

본 토픽은 2026-04-04 framing 후 21일 hold(framing-only) 상태였으나 session_104(2026-04-25)에서 dev turnId 9 실측·spec lock 26+ 항목 동결·G0 9 산출물 박제·G0 PASS 선언까지 단일 세션 완결 — Master 메모리 `feedback_implementation_within_3_sessions`(3세션 이내) + `feedback_no_premature_topic_split`(분화 신중) 2 원칙 정합으로 본 토픽 framing→구현 1 토픽 완결 노선 박제됨.

---

## 6. 다음 turn 권고 + Master 확인 필요 항목

### 6-1. 다음 호출 (turnId 13)

| turnId | Owner | 산출 |
|---|---|---|
| 12 (현재) | Ace | G0-8 박제 + G0 PASS 선언 + Phase 1 G1 prep → **DONE** |
| 13 | **Dev** | Phase 1 G1 진입 — 본 §3-1 6 작업 + 본 §3-3 7 PASS 조건 |
| 14 | Vera·Arki (조건부) | Phase 1 G1 lint fail ≥5 또는 spec drift 발생 시 재호출 |

### 6-2. Master 확인 필요 항목

orchestrationMode 정합 — 본 세션 manual 모드면 Master G0 PASS 승인 후 Phase 1 진입, auto 모드면 자동 진행.

| # | 항목 | 답 형식 |
|---|---|---|
| 1 | G0 9 산출물 모두 PASS, Phase 1 G1 진입 승인 | ✅ / 수정 |
| 2 | spec-lock-decisions.md Hard breaker B1·B2·B3 정밀 정의 + child spawn spec 박제 승인 | ✅ / 수정 |
| 3 | 부분 출시 4 페이지 = 개별 출시 채택 (옵션 B) 승인 | ✅ / 수정 |
| 4 | Phase 1 G1 작업 6건 + PASS 조건 7항 = Dev turnId 13 인수 spec | ✅ / 수정 |

답 후 Dev turnId 13 dispatch.

---

## 7. 자기 점검

| 점검 축 | 결과 |
|---|---|
| 자기소개 "Ace입니다"만 (F-013) | ✓ |
| 강한 의견 + 존댓말 + 단일 최적해 + 옵션 나열 0 | ✓ 부분 출시 단일 채택(B), Phase 1~5 게이트 단일 spec |
| F-005 Relay 금지 (단일 sub 응답 직후 Ace 요약 0) | ✓ — 본 turn은 종합 검토 + 박제 (relay 아님) |
| frontmatter turnId 12 / invocationMode subagent / recallReason "phase-0-execution" | ✓ |
| spec-lock-decisions.md 별도 write + ace_rev4.md 본 보고 = 2 file | ✓ |
| ace_rev4.md 첫 줄 ACE_WRITE_DONE + spec-lock-decisions.md 경로 명시 | ✓ |
| G0 PASS 선언 9건 모두 | ✓ §2 |
| Phase 1 G1 prep 6 작업 + 12 spec 경로 + 7 PASS 조건 + D-feedback 종결 표 | ✓ §3 |
| Vera rev3 / Arki rev3 자기감사 라운드 3 흡수 명시 | ✓ §4 |
| 21일 hold 메타 평가 1줄 | ✓ §5 |
| self-scores YAML | ✓ 아래 |

---

```yaml
# self-scores
g0_pas: Y
spc_lck: Y
hb_def: 3
phs_gt: 5
```

(주: `g0_pas`=Y — G0 9 산출물 모두 검증 완료 PASS 선언, 미해결 0건. `spc_lck`=Y — Master 박제 18건 + D-094~D-098 + PD 정리 6건이 본 G0-8에 박제, status: locked-for-dev. `hb_def`=3 — Hard breaker B1(Cloudflare 정적)·B2(D-003 read-only)·B3(D-060 스키마) 모두 정의/발동 조건/검증 방법/child spawn spec 4축 박제. `phs_gt`=5 — Phase 1 G1·Phase 2 G2·Phase 3 G3·Phase 4 G4·Phase 5 G5 모두 진입 조건·핵심 작업·PASS 조건·FAIL 처리·게이트 산출물 5축 박제.)
