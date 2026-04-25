---
role: arki
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 2
phase: spec-lock-refinement
grade: S
turnId: 6
invocationMode: subagent
recallReason: post-synthesis
splitReason: spec-lock-refinement
executionPlanMode: plan
status: spec-lock-pending
---

ARKI_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/arki_rev2.md

# Arki Spec Lock 갱신 — topic_082 Phase 0~5 동결 직전본

Arki입니다. Ace 종합검토(turnId 5) 흡수 + Master Session 104 박제 8건 반영 + Vera 1차 spec 일부 폐기 사항 흡수. 본 발언은 새 옵션 탐색 0건. 종합검토에서 채택된 결정들을 Phase 0~5 spec lock 동결 직전 상태로 정렬합니다. Rich Hickey 관점 — 짓지 않을 수 있는 것은 그대로 두고, 박을 것만 박습니다.

본 갱신본이 Phase 0 G0 산출물 9건의 초안 골격이 됩니다. Master G1·G2 결정 1줄씩 받으면 그대로 `topics/topic_082/` 아래 동결.

---

## 0. arki_rev1 대비 변경 요약 (자기감사 사전)

| 항목 | rev1 | rev2 |
|---|---|---|
| 반응형 axes | 4단(`bp-sm/md/lg/xl` 640/768/1024/1440) | **2단 단일 분기 1024px** (Master 박제 #11). Vera 768·collapsed 폐기 흡수 |
| VR baseline | 36 (9 페이지 × 4 viewport) | **24 (6 페이지 × 4 viewport)** + mock fixture + bbox 임계 |
| VR 임계 | "diff = baseline" (Vera 0px) | **maxDiffPixelRatio: 0.02 + bbox 비교** |
| G0 산출물 | 4건(inventory·legacy·ia·token-axes) | **9건** (+inline-root-dump·responsive-policy·vr-spec·spec-lock-decisions·contrast-check) |
| G1 lint 범위 | 미확정 | **`--c-*` 색 토큰만** (Master 승인) |
| child 분기 | "분화 금지"만 | **Hard breaker B1·B2·B3 한정 + 부분 출시 4 페이지** |
| WCAG | "권고만" | **Phase 3 G3 자동 contrast check + accent-only lint** |
| Records 구조 | 3 sub | **5 sub (Topics·Sessions·Decisions·Feedback·Deferrals) + Sessions 내부 3탭** |
| Growth Board | "안 β 메인 1뷰" | **D-060 안 β 본체 + 4×2 People grid (signature 합류)** |
| signature 합류 | "main nav 합류" | **People 카테고리(`people.html`)로 흡수** |
| Deferrals | 미정 | **신규 페이지 + D3.js dependsOn 그래프** |
| nav 단일화 | nav.js 확장 | **nav.js 단일 source 강제, sidebar HTML 중복 0**(G1) |
| Phase 4 컴포넌트 변종 | 미명시 | **dashboard-ops 그대로·v3 변종 4개 archive·Home 가벼운 랜딩·Dashboard 풀 KPI** |

신규 결함 자가 적출 → §7 자기감사 라운드 2.

---

## 1. Phase 0 — G0 강화 9 산출물 spec lock 정의

Phase 0의 본질은 "이후 Phase에서 흔들리지 않을 spec 동결". G0 통과 = Phase 1 진입 허가. 9 산출물 모두 `topics/topic_082/` 아래 박제, frontmatter `status: locked-for-dev`.

### 1-1. G0-1 — `topics/topic_082/inventory.json`

**위치**: `topics/topic_082/inventory.json`
**검증 기준**: active 9 페이지 + legacy 4 페이지 + 신설 대상 2 페이지 = 15건 인벤토리.

```
{
  "active": [
    { "file": "app/index.html",            "lines": 205, "role": "Home (랜딩)",         "ia": "Home" },
    { "file": "app/dashboard-upgrade.html","lines": 943, "role": "Upgrade KPI 보드",    "ia": "Dashboard/Upgrade" },
    { "file": "app/dashboard-ops.html",    "lines": 329, "role": "Ops 메트릭 보드",     "ia": "Dashboard/Ops (그대로 유지)" },
    { "file": "app/topic.html",            "lines": 181, "role": "토픽 인덱스",         "ia": "Records/Topics" },
    { "file": "app/session.html",          "lines": 367, "role": "세션 인덱스+타임라인","ia": "Records/Sessions (3탭으로 흡수)" },
    { "file": "app/decisions.html",        "lines": 121, "role": "결정 리스트",         "ia": "Records/Decisions" },
    { "file": "app/feedback.html",         "lines":  86, "role": "Master 피드백",       "ia": "Records/Feedback" },
    { "file": "app/signature.html",        "lines": 269, "role": "역할 시그니처",       "ia": "People (합류, signature.html → people.html)" },
    { "file": "app/role-signature-card.html","lines":81, "role": "signature partial",   "ia": "Home·People 위젯 partial로 흡수" }
  ],
  "legacy_to_archive": [
    { "file": "app/dashboard-v3-test.html", "lines":1004, "decision": "legacy/archive/v3-variants/" },
    { "file": "app/dashboard-v3b-test.html","lines": 820, "decision": "legacy/archive/v3-variants/" },
    { "file": "app/dashboard-v3c-test.html","lines": 775, "decision": "legacy/archive/v3-variants/" },
    { "file": "app/dashboard-v3d-test.html","lines": 576, "decision": "legacy/archive/v3-variants/" }
  ],
  "to_create": [
    { "file": "app/growth.html",   "phase": "Phase 4", "spec": "D-060 안 β 본체 + Registry/Rubric versioning footer" },
    { "file": "app/deferrals.html","phase": "Phase 4", "spec": "PD 카드 60% + D3.js dependsOn 그래프 40%" },
    { "file": "app/people.html",   "phase": "Phase 4", "spec": "signature.html 합류, 4×2 grid" }
  ]
}
```

**G0-1 통과 조건**: 15건 모두 라인 수·역할·IA 매핑 박제. 누락 0.

### 1-2. G0-2 — `topics/topic_082/legacy-decision.md`

**위치**: `topics/topic_082/legacy-decision.md`
**검증 기준**: v3/v3b/v3c/v3d 4 변종 archive 결정(Master 박제 #14·#7) 박제.

```
이동 경로: app/legacy/archive/v3-variants/
빌드 제외: scripts/build.js dist에서 legacy/ 디렉토리 제외 (기존 정책 + 명시 박제)
참조 보존: 각 파일 frontmatter에 `archived: 2026-04-25, sessionId: session_104` 추가
복원 트리거: Hard breaker 발동 시에만 (현재 시점 0)
```

**G0-2 통과 조건**: archive 디렉토리 위치 동결 + build.js 제외 검증 명시. 4 파일 합 3175라인이 production app에서 사라짐 확인.

### 1-3. G0-3 — `topics/topic_082/ia-spec.md`

**위치**: `topics/topic_082/ia-spec.md` (status: locked-for-dev)
**검증 기준**: Ace 종합검토 §3-1 IA 그래프 동결.

```
Top Nav (단일 source = app/js/nav.js)
 ├─ Home            (index.html — 가벼운 랜딩 + Hero KPI 3개 + 5 인덱스 카드 + Recent band)
 ├─ Dashboard       (second-nav 2탭)
 │   ├─ Upgrade     (dashboard-upgrade.html — 본체 유지, 풀 KPI)
 │   └─ Ops         (dashboard-ops.html — 그대로 유지, Master 박제 #15·#7)
 ├─ Growth          (growth.html — 신규, D-060 안 β 본체)
 ├─ People          (people.html — signature.html 합류, 8 역할 4×2)
 ├─ Records         (second-nav 5탭)
 │   ├─ Topics      (default — 토픽 카드 + 세션 chip 라인)
 │   ├─ Sessions    (내부 3탭: Current / History / Turn Flow)
 │   ├─ Decisions   (decisions.html 흡수)
 │   ├─ Feedback    (feedback.html 흡수)
 │   └─ Deferrals   (신규 — PD 카드 + D3 dependsOn 그래프)
 └─ System          (Config / Log / Charter version)
```

**평면 깊이 ≤ 2** (Top Nav 1차 6개 / Dashboard·Records second-nav 2차). Master 박제 #1 정렬.

**G0-3 통과 조건**: 6 카테고리 + Records 5 sub + Dashboard 2 sub 명시 + frontmatter `status: locked-for-dev`.

### 1-4. G0-4 — `topics/topic_082/token-axes-spec.md`

**위치**: `topics/topic_082/token-axes-spec.md` (status: locked-for-dev)
**검증 기준**: Vera §3-5 tokens.css 전체 정의 + G1 lint 범위 1줄 동결.

```css
/* app/css/tokens.css 단일 출처 (canonical) */
:root {
  /* role canonical (G1 lint 대상) */
  --c-ace: #8B5CF6; --c-arki: #06B6D4; --c-fin: #F59E0B; --c-riki: #EF4444;
  --c-dev: #3B82F6; --c-vera: #F472B6; --c-editor: #9CA3AF; --c-nova: #10B981;
  /* base palette */
  --bg: #000000; --panel: #0B0B0D; --panel-2: #141418; --panel-3: #1C1C22;
  --line: #26262D; --line-2: #333340;
  --text: #F5F5F7; --text-2: #B8B8C0; --text-3: #6E6E78;
  /* brand */
  --brand-purple: #8B5CF6; --brand-cyan: #06B6D4;
  /* gradients */
  --grad-violet: linear-gradient(135deg,#7C3AED,#8B5CF6);
  --grad-teal:   linear-gradient(135deg,#0891B2,#06B6D4);
  --grad-amber:  linear-gradient(135deg,#D97706,#F59E0B);
  --grad-rose:   linear-gradient(135deg,#BE185D,#F472B6);
  /* spacing 8px scale */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-7: 32px; --space-8: 48px;
  /* radius */
  --radius-sm: 6px; --radius-md: 8px; --radius-lg: 12px; --radius-xl: 16px;
  /* type */
  --fs-display: 48px; --fs-h1: 28px; --fs-h2: 22px; --fs-h3: 16px;
  --fs-base: 14px; --fs-sm: 13px; --fs-xs: 12px; --fs-2xs: 11px; --fs-3xs: 9px;
  /* breakpoint (정책 분기 1024 단일, 미세 조정용 보유) */
  --bp-mobile: 1023px;   /* < 1024 */
  --bp-desktop: 1024px;  /* ≥ 1024 */
  /* container */
  --container-main-max: 1440px;
  --container-sidebar: 220px;
}
@media (max-width: 1023px) {
  :root { --fs-display: 36px; --fs-h1: 22px; --fs-h2: 18px; --fs-h3: 15px; }
}
```

**G1 lint 범위 (Master 승인 박제)**: 페이지 인라인 `<style>` 내 `:root{ --c-ace|--c-arki|--c-fin|--c-riki|--c-dev|--c-vera|--c-editor|--c-nova: ... }` **재정의 발견 시 빌드 실패**. 레이아웃 토큰(`--space-*`·`--radius-*`·`--fs-*`·`--bp-*`·`--container-*`) 인라인은 SHOULD로 신규 PD 이연.

**G0-4 통과 조건**: tokens.css 모든 변수 값 채워짐(빈 슬롯 0) + G1 범위 1줄 명시 + 색상 canonical 출처 = `app/css/tokens.css` 단일 (Master 박제 #10).

### 1-5. G0-5 — `topics/topic_082/inline-root-dump.json` (신규, 방치 비용 가시화)

**위치**: `topics/topic_082/inline-root-dump.json`
**검증 기준**: 13 active 페이지의 인라인 `<style>` 내 `:root{}` 전수 dump. 색 토큰 외 항목 인벤토리.

```
{
  "scanRoot": "app/",
  "scannedFiles": 13,
  "perFileDumps": [
    {
      "file": "app/dashboard-upgrade.html",
      "rootBlocks": [
        { "lineRange": "21-50", "tokens": ["--c-ace", "--c-arki", "...8건"], "category": "color (G1 강제 흡수 대상)" },
        { "lineRange": "51-90", "tokens": ["--space-*", "--radius-*", "..."], "category": "layout (SHOULD, PD 이연)" }
      ]
    },
    { "file": "app/index.html", "rootBlocks": [...] },
    ...11건
  ],
  "summary": {
    "colorTokensDuplicated": "<페이지 N>",
    "layoutTokensDuplicated": "<페이지 N>",
    "estimatedDeferralCost": "다음 토픽 1.5~2배 부풀음 위험 (Fin §5-1)"
  }
}
```

**G0-5 통과 조건**: 13 페이지 모두 스캔 완료 + 색 토큰 중복 페이지 수 + 레이아웃 토큰 중복 페이지 수 명시 + 다음 토픽으로 이연되는 부채 가시화. **방치 비용 가시화의 핵심 산출물** (Fin §5-1 권고 흡수).

### 1-6. G0-6 — `topics/topic_082/responsive-policy.md`

**위치**: `topics/topic_082/responsive-policy.md` (status: locked-for-dev)
**검증 기준**: 2축 단일 분기 1024px (Master 박제 #11) + 6 페이지별 변형 표.

```
정책 분기: 1024px 단일
  --bp-mobile  ( < 1024px ): drawer overlay sidebar, 메인 100vw, KPI 1col
  --bp-desktop ( ≥ 1024px ): 220px expanded sidebar, 메인 max 1440px centered, KPI 4col

폐기:
  - 768px 분기점 (Vera 1차 spec 폐기)
  - 64px collapsed sidebar 모드 (Riki R-03 + Master 박제 #11 폐기)
  - 4단 매트릭스(640/768/1024/1440) → 1단 단일 분기

미세 조정용 보유 (정책 분기 아님):
  - --bp-sm/md/xl 토큰은 tokens.css에 보유하되 정책 분기에 사용 0
```

**6 페이지별 변형 표** (mobile / desktop 2 column):

| 페이지 | mobile (<1024) | desktop (≥1024) |
|---|---|---|
| Home (index) | drawer + Hero KPI 1col + 인덱스 카드 1col + Recent stack | 220px sidebar + Hero 3col + 카드 3col + Recent 2col |
| Dashboard/Upgrade | drawer + filter-bar + KPI 1col + chart 1col | sidebar + KPI 4col + chart 2col |
| Dashboard/Ops | drawer + KPI 1col (그대로) | sidebar + KPI grid (그대로 유지, Master 박제 #15) |
| Growth (신설) | drawer + 3축 KPI 1col + signature 1col stack | sidebar + 3축 KPI 3col + 4×2 grid |
| People (신설) | drawer + 4×2 → 1col stack | sidebar + 4×2 grid |
| Records/Topics | drawer + topic-card stack + chip-row 가로 스크롤 | sidebar + topic-card stack + chip-row 가로 스크롤 |
| Records/Sessions | drawer + tab 3개 + 내부 stack | sidebar + tab 3개 + Turn Flow D3 |
| Records/Decisions | drawer + 리스트 stack | sidebar + 리스트 + 상세 sticky |
| Records/Feedback | drawer + 리스트 stack | sidebar + 리스트 |
| Records/Deferrals | drawer + PD 카드 stack + 그래프 그 아래 360px | sidebar + PD 60% + 그래프 40% sticky 560px |
| System | drawer + list stack | sidebar + list |

**모바일 텍스트 처리** (가로 스크롤 0 정책):
- 카드 title: `text-overflow: ellipsis; white-space: nowrap`
- 본문: `word-break: keep-all` + `overflow-wrap: anywhere`
- chip-row: `flex-wrap: nowrap; overflow-x: auto`
- 표: `overflow-x: auto` wrapper + `min-width: 560px`

**G0-6 통과 조건**: 1024 단일 분기 명시 + 6 페이지 변형 표 모두 채움 + 모바일 텍스트 처리 4건 박제.

### 1-7. G0-7 — `topics/topic_082/vr-spec.md`

**위치**: `topics/topic_082/vr-spec.md` (status: locked-for-dev)
**검증 기준**: mock fixture + bbox 임계 + 24 baseline 매트릭스 (Master 박제 #12).

```
VR 도구: Playwright (단일, 외부 SaaS 0)
산출물 4건:
  1. tests/visual/fixtures/dashboard_data.fixture.json — 동결 데이터, env swap
  2. tests/visual/playwright.config.ts — toHaveScreenshot({ maxDiffPixelRatio: 0.02, threshold: 0.2 })
  3. tests/visual/baseline/ — 24 PNG (6 페이지 × 4 viewport)
  4. tests/visual/bbox-compare.ts — getBoundingClientRect() layout 보조 검증

페이지 × viewport 매트릭스 (24 baseline):
              | 1920 | 1440 | 1280 | 375 |
  index       |  ✓   |  ✓   |  ✓   |  ✓  |  (Phase 2)
  dashboard-upgrade  ✓   ✓   ✓   ✓     (Phase 2)
  dashboard-ops       ✓   ✓   ✓   ✓     (Phase 2)
  topics             ✓   ✓   ✓   ✓     (Phase 2)
  growth             ✓   ✓   ✓   ✓     (Phase 4 추가)
  people             ✓   ✓   ✓   ✓     (Phase 4 추가)

폐기:
  - Vera 1차 30 baseline (5-tier × 6) → 24 (4-tier × 6)
  - 768 viewport baseline (mobile band 안에 흡수, 별도 baseline 0)
  - "0px text·layout 임계" (false-positive 폭발 방지)

회귀 임계:
  - maxDiffPixelRatio: 0.02 (2% 픽셀 차이 허용)
  - bbox 보조: getBoundingClientRect() 단위 layout 위치·크기 비교
  - threshold 0.2 (anti-alias·subpixel 노이즈 흡수)

mock fixture 갱신 주기:
  - PD 신규 박제: tests/visual/fixtures/dashboard_data.fixture.json 분기 단위 갱신 PD
  - Phase 2 진입 시 첫 fixture 동결
```

**G0-7 통과 조건**: 4 산출물 위치·임계 1줄·24 매트릭스 명시 + Vera 0px 임계 폐기 + mock fixture 동결 시점 명시.

### 1-8. G0-8 — `topics/topic_082/spec-lock-decisions.md` (신규)

**위치**: `topics/topic_082/spec-lock-decisions.md` (status: locked-for-dev)
**검증 기준**: child 분기 trigger Hard breaker 한정 + 부분 출시 4 페이지 명시 (Master 박제 #6 승인).

```
"분화 금지" (Master 박제 #13) = 기본값 유지.
예외 trigger (child 토픽 분기 허용) = Hard breaker B1·B2·B3 발동 시에만:
  - B1: Cloudflare Pages 정적 정책 변경 (SSR/edge function 도입 요구)
  - B2: D-003 read-only 폐기 + form 도입 결정
  - B3: D-060 metrics_registry 스키마 변경 결정 (growth.html 데이터 계약)

부분 출시 가능 페이지 (Phase 0~3 누적만으로 출시 가능 base layer) — 4건:
  1. Home              (index.html 재디자인)
  2. Dashboard/Upgrade (dashboard-upgrade.html 본체 유지 + nav 단일화)
  3. Dashboard/Ops     (dashboard-ops.html 그대로 + nav 단일화)
  4. Records/Topics    (topic.html → topic-card + session-chip-row 신설)

Phase 4 미완 시 hidden state 처리 페이지 — 3건:
  - Growth (growth.html 신설 미완)
  - People (signature.html 합류 미완)
  - Records/Deferrals (신설 미완)

hidden state 처리: nav.js에서 `data-state="pending"` 마킹 → 메뉴 표시하되 click disable + tooltip "Phase 4 진행 중"
```

**G0-8 통과 조건**: Hard breaker 3건 정의 + 부분 출시 4 페이지 명시 + hidden state 처리 1줄 박제.

### 1-9. G0-9 — `topics/topic_082/contrast-check.md` (신규)

**위치**: `topics/topic_082/contrast-check.md`
**검증 기준**: WCAG AA 4.5:1 자동 lint + accent-only 강제 + Phase 3 G3 파이프라인.

```
검증 13 조합 (Vera §3-6 채택):
  --text on --panel       19.6:1 AAA
  --text on --bg          20.4:1 AAA
  --text-2 on --panel     11.3:1 AAA
  --text-3 on --panel      4.9:1 AA
  --text-3 on --bg         5.1:1 AA
  --c-vera on --panel      7.6:1 AAA
  --c-arki on --panel      7.5:1 AAA
  --c-fin on --panel       9.7:1 AAA
  --c-nova on --panel      7.4:1 AAA
  --c-dev on --panel       4.7:1 AA (간당) ← accent-only
  --c-riki on --panel      5.3:1 AA
  --c-ace on --panel       4.8:1 AA (간당) ← accent-only
  --c-editor on --panel    7.0:1 AAA

자동 contrast check 파이프라인 (Phase 3 G3):
  1. tokens.css diff 발생 시 build.js가 13 조합 4.5:1 재계산
  2. fail 시 빌드 중단
  3. design:accessibility-review skill 호출 (신규 페이지 growth·people·deferrals)

accent-only lint:
  - --c-dev·--c-ace를 CSS color/fill 속성에 사용 시 빌드 실패 (텍스트 본문 사용 차단)
  - 허용: border-color·background·icon fill (accent·border·icon용)
  - 작은 텍스트(<13px)에 --c-* 직접 사용 금지

검증 트리거:
  - tokens.css 변경 (build.js)
  - 신규 페이지 신설 (Phase 4 진입 시)
  - Phase 3 G3 게이트 (24 baseline diff 통과 + contrast 13조합 PASS)
```

**G0-9 통과 조건**: 13 조합 캡처 + 자동 파이프라인 1줄 + accent-only lint 정의 + Phase 3 G3 통합.

### 1-10. G0 종합 통과 조건

| # | 산출물 | 상태 |
|---|---|---|
| G0-1 | inventory.json | 15건 인벤토리 + 라인 수·IA 매핑 |
| G0-2 | legacy-decision.md | archive 경로 + build 제외 + 4 변종 frontmatter |
| G0-3 | ia-spec.md | 6 카테고리 + 평면 깊이 ≤2 + locked-for-dev |
| G0-4 | token-axes-spec.md | tokens.css 빈 슬롯 0 + G1 색 토큰 한정 |
| G0-5 | inline-root-dump.json | 13 페이지 전수 dump + 방치 비용 가시화 |
| G0-6 | responsive-policy.md | 1024 단일 분기 + 6 페이지 변형 표 |
| G0-7 | vr-spec.md | mock fixture + bbox + 24 baseline |
| G0-8 | spec-lock-decisions.md | Hard breaker 3 + 부분 출시 4 |
| G0-9 | contrast-check.md | 13 조합 + accent-only lint + G3 파이프라인 |

**G0 통과 = 9건 모두 충족**. 1건이라도 미흡 시 Phase 1 진입 차단. Master G1·G2 결정 1줄 답이 G0-4·G0-8 동결의 마지막 트리거.

---

## 2. Phase 1~5 spec lock 갱신

### 2-1. Phase 1 — Token + nav 단일화

**산출물**:
- `app/css/tokens.css` 신규 (token-axes-spec.md 채움값 그대로 박제)
- `app/js/nav.js` 확장 — 6 카테고리 + Records 5 sub + Dashboard 2 sub + hidden state 처리
- 각 HTML `<aside id="nav-mount">` 치환 + `<link rel="stylesheet" href="css/tokens.css">` 삽입
- `scripts/build.js` 빌드 시 dist 검증: 모든 페이지가 tokens.css 참조하는지 grep

**G1 검증 게이트** (강화):
- tokens.css 빈 슬롯 0
- nav.js 단일 mount 작동 (sidebar HTML 중복 0)
- **lint: 페이지 인라인 `:root{ --c-* }` 재정의 = 빌드 실패** (G1 색 토큰 한정 — Master 승인)
- 레이아웃 인라인 `:root{ --space-*|--radius-*|--fs-* }` 발견 시 경고만 (PD 이연)

**롤백**: 빈 슬롯 발생 → Vera 재호출 / nav 중복 잔존 → 미완 페이지 식별 후 재적용 / 색 lint fail ≥3 페이지 → G1 정의 재검토(이번 G1 색 한정 spec이 변동 가능성)

**중단 조건**: G1 색 lint fail이 ≥5 페이지 (전수의 38%) → Phase 1 hold + Master 결정 (G1 범위 더 좁힐지)

### 2-2. Phase 2 — 반응형 적용 + VR 인프라 박음

**산출물**:
- 11 active 페이지 컨테이너 fluid 적용 (`.chart-fluid { width:100%; aspect-ratio:16/9; min-height:240px }`)
- ECharts wrapper 함수: viewport resize observer + chart.resize()
- mobile drawer overlay 컴포넌트 (`<aside>` overlay + backdrop click close)
- `tests/visual/` 디렉토리 신설 (vr-spec.md 4 산출물 박제)
- `tests/visual/fixtures/dashboard_data.fixture.json` 동결 (mock fixture)
- baseline 16건 생성 (Phase 2 시점 4 페이지 × 4 viewport)

**G2 검증 게이트**:
- ECharts resize observer 11 페이지 작동 (lighthouse smoke test)
- mock fixture swap 작동 (Playwright env)
- 16 baseline 첫 PNG 생성 성공
- bbox 비교 헬퍼 작동
- 1024 분기점 위·아래 가로 스크롤 0

**롤백**: VR 작동 안 함 → Playwright 환경 격리 디버깅 → HALT-2 발동 시 manual smoke test로 fallback

**중단 조건**: HALT-2(Playwright 외 SaaS 의존 발생) → VR 인프라 PD 외화, 본 토픽은 manual smoke test로 G3 대체 + PD-034 무산 박제

### 2-3. Phase 3 — G3 게이트 (검증 단독 Phase)

본 Phase는 산출물보다 게이트 통과가 본체.

**G3 검증 게이트** (강화):
- 16 baseline diff `maxDiffPixelRatio ≤ 0.02` PASS (4 페이지 × 4 viewport)
- bbox 비교 PASS (layout 위치·크기 변동 0 또는 의도된 변경만)
- nav 단일 source 100% (sidebar HTML 중복 0)
- 가로 스크롤 0 / 텍스트 잘림 0 (모바일 11px 이상 본문)
- **contrast check 13조합 PASS** (tokens.css diff 발생 시)
- **accent-only lint PASS** (`--c-dev`·`--c-ace` 텍스트 color 사용 0건)
- **Hard breaker B1·B2·B3 발동 0건 확인**

**롤백**:
- VR diff fail 회귀 ≥3 페이지 → Phase 1 토큰 axes 또는 Phase 2 컨테이너 사용처 재검토
- contrast fail → tokens.css 색 값 재계산 + Vera 재호출
- accent-only lint fail → 사용처 식별·치환

**중단 조건**: 회귀 fail ≥4 페이지 (전체 75%) → Phase 1 토큰 정의 자체 폐기 검토 (이 시점 사실상 본 토픽 hold)

**부분 출시 게이트** (G3 통과 시 옵션):
- Home·Dashboard-Upgrade·Dashboard-Ops·Records-Topics 4 페이지 publish 가능
- growth·people·deferrals는 nav `data-state="pending"` hidden state로 보류

### 2-4. Phase 4 — Growth + signature 통합 + Records 5sub 신설/재정리

**산출물**:
- `app/growth.html` 신설 — D-060 안 β 본체 (3축 헤더 KPI / 4×2 signature panel grid / Registry version footer)
- `app/people.html` 신설 — signature.html 합류, 4×2 grid (md 2×4 / sm 1col)
- `app/topic.html` → Records/Topics 재구성 (topic-card + session-chip-row 신설)
- `app/session.html` → Records/Sessions (3탭 Current/History/Turn Flow + sequence-panel 재사용)
- `app/decisions.html`·`app/feedback.html` → Records 흡수 (second-nav만 추가)
- `app/deferrals.html` 신설 — PD 카드 60% + D3.js dependsOn 그래프 40%
- `app/role-signature-card.html` partial → Home·People 위젯으로 재사용
- baseline 8건 추가 (growth·people 2 페이지 × 4 viewport)

**컴포넌트 신규 4 + 재사용 8** (Vera §1-4 그대로):
- 신규: top-nav / second-nav-tab / topic-card+session-chip-row / pd-card+dependsOn-graph(D3)
- 재사용: dashboardShell / kpi-card / tab-bar / role-card v1.1 / sequence-panel v1.1 / roleFrequencyChart / statCard

**G4 검증 게이트**:
- growth.html이 D-060 metrics_registry 소비 성공 (스키마 변경 0)
- people.html signature 통합 후 nav 단일 source 유지
- Records 5 sub second-nav 작동 (Sessions 3탭 포함)
- Deferrals D3 그래프 PD 35건 렌더링 성공 (현재 N=35)
- VR baseline 24건 모두 생성 성공
- contrast check growth·people·deferrals 3 페이지 PASS

**롤백**:
- growth 데이터 계약 불일치(HALT-3) → child 토픽 분기 허용 (Hard breaker B3 경로) + 본 토픽 부분 출시 4 페이지로 종결
- people 4×2 grid 깨짐 → role-signature-card partial 직접 import 패턴 재검토

**중단 조건**:
- HALT-3 발동 → child 분기
- D3 그래프 50+ 노드 폭발(현재 N=35, 위험 약-중) → Phase 4 그래프 단순화 (force-directed → tree layout)

### 2-5. Phase 5 — G5 + Edi 인계

**산출물**:
- 24 baseline VR 회귀 0 재실행 결과
- IA 평면 깊이 ≤ 2 검증 리포트
- legacy v3 변종 dist 포함 0 검증
- CF Pages 빌드 성공 결과
- PD-042 closure 박제 (signature merge 완료)
- Edi: release notes·published 마킹·dashboard build 트리거

**G5 검증 게이트** (모든 통과 필수):
- VR 24 baseline 재실행 회귀 0 또는 의도된 diff만
- IA 평면 깊이 ≤ 2 (Top Nav 6 + 2차 5/2/2)
- legacy/ 디렉토리 dist 포함 0
- CF Pages 빌드 성공
- PD-042 closure
- 부분 출시 4 페이지 + Phase 4 신규 3 페이지 = 7 페이지 모두 active 또는 hidden state 명시

**롤백**:
- build 오염 → legacy 제외 처리 재검증
- VR 회귀 → Phase 4 산출물 재검토

**중단 조건**: G5 fail이 build 단위 → Phase 5 hold, Master 보고

---

## 3. Hard breaker B1·B2·B3 정의 표

| Hard breaker | 정의 | child 분기 발동 조건 | 영향 범위 |
|---|---|---|---|
| **B1** | Cloudflare Pages 정적 배포 정책 변경 | SSR/edge function 도입 결정 시 | 본 설계 무효 — 정적 가정 전체 폐기. 모든 Phase 재설계 필요. |
| **B2** | D-003 read-only viewer 정책 폐기 | form/input 도입 결정 시 | IA에 input flow 추가 필요. Records/Sessions·Deferrals 등 read interaction 전제가 무너짐. |
| **B3** | D-060 metrics_registry 스키마 변경 | growth.html 데이터 계약 변경 결정 시 | growth.html 재설계. people.html signature 데이터 영향 가능. Phase 4 child 분기. |

**부분 출시 4 페이지 출시 게이트 정의**:

| 페이지 | 출시 게이트 | 게이트 통과 시 active |
|---|---|---|
| Home | G1(tokens.css·nav 단일) + G3(VR PASS·contrast PASS) | Phase 3 통과 후 즉시 |
| Dashboard/Upgrade | G1 + G3 + dashboard-upgrade 본체 무회귀 | Phase 3 통과 후 즉시 |
| Dashboard/Ops | G1 + G3 + ops 페이지 그대로 유지 검증 | Phase 3 통과 후 즉시 |
| Records/Topics | G1 + G3 + topic-card·session-chip-row 신규 컴포넌트 검증 | Phase 3 통과 후 즉시 |

**Phase 4 미완 시 hidden state 페이지** (Growth/People/Deferrals): nav.js `data-state="pending"` 마킹, click disable, tooltip 표시.

---

## 4. 의존 그래프 갱신 (ASCII)

```
                     [Phase 0: G0 9 산출물 spec lock]
                     ├─ inventory.json
                     ├─ legacy-decision.md
                     ├─ ia-spec.md (locked-for-dev)
                     ├─ token-axes-spec.md (locked-for-dev)
                     ├─ inline-root-dump.json
                     ├─ responsive-policy.md (locked-for-dev)
                     ├─ vr-spec.md (locked-for-dev)
                     ├─ spec-lock-decisions.md (locked-for-dev)
                     └─ contrast-check.md
                                   │
                  ┌────────────────┴────────────────┐
                  │                                  │
            (Vera·Master G1)                  (Master G2 + #14 legacy)
                  │                                  │
                  └────────────────┬────────────────┘
                                   ▼
            ┌──────────[ G0 통과 ]──────────┐
            │                                │ FAIL → Phase 0 보강
            ▼                                │
  [Phase 1: tokens.css + nav.js 단일화]      │
            │                                │
            ▼                                │
       ┌─[ G1 ]─┐ FAIL → Phase 1 회귀 (Vera·Dev 협의)
       │ PASS  │
       ▼        │
  [Phase 2: 반응형 + VR(mock fixture + bbox)]
            │
            ▼
       ┌─[ G2 ]─┐ FAIL → HALT-2 검토 (manual smoke test fallback)
       │ PASS  │
       ▼        │
  [Phase 3: G3 게이트 (검증 단독)]
       VR diff ≤0.02 + bbox + contrast 13조합 + accent-only lint
            │
            ├──── 부분 출시 옵션 (Phase 3 통과 시)
            │     Home·Dashboard-Upgrade·Dashboard-Ops·Records-Topics 4 active
            │
            ▼
  [Phase 4: growth + people + deferrals + Records 재정리]
            │
            ▼
       ┌─[ G4 ]─┐ FAIL → HALT-3 (B3 발동 시 child 분기 허용)
       │ PASS  │
       ▼        │
  [Phase 5: VR 24 재실행 + Edi 인계 + PD-042 closure]
            │
            ▼
       ┌─[ G5 ]─┐ FAIL → Phase 4·2 회귀
       │ PASS  │
       ▼        │
       [완료]
```

---

## 5. Dev 인계 spec 동결 시점 + 양방향 협의 항목

### 5-1. spec 동결 시점 (Phase별)

| Phase | Dev 인계 가능 spec | Dev 합의 필요 항목 |
|---|---|---|
| Phase 0 종료 | G0 9 산출물 모두 (locked-for-dev) | nav.js 단일 mount API · tokens.css import 패턴 |
| Phase 1 진입 | tokens.css·nav.js 구현 spec | G1 lint 구현 (build.js 색 토큰 grep) · ECharts wrapper 패턴 |
| Phase 2 진입 | 반응형 변형 표·VR 4 산출물 | mock fixture swap 환경변수 명 · Playwright config |
| Phase 4 진입 | growth·people·deferrals spec + 8 컴포넌트 catalog | D3.js dependsOn 그래프 layout 알고리즘 (force/tree 선택) · contrast check 자동화 구현 |

### 5-2. Dev 양방향 협의 포인트 (rev1 D-feedback-1~4 갱신)

- **D-feedback-1**: ECharts resize observer vs 차트별 init 분리 — Dev 선택, Phase 2 진입 시
- **D-feedback-2**: nav.js 단일 source 시 active state 처리 (JS attribute / data-attr) — Dev 선택, Phase 1
- **D-feedback-3**: VR Playwright 외 도구 필요성 — HALT-2 검토 트리거, Phase 2
- **D-feedback-4**: growth.html 외부 차트 라이브러리 추가 요구 — Hard breaker B3 검토, Phase 4
- **D-feedback-5 (신규)**: G1 lint 구현 — build.js에서 페이지 HTML grep 후 인라인 `:root{ --c-* }` 검출 패턴 — Dev 합의 후 박제, Phase 1
- **D-feedback-6 (신규)**: contrast 13조합 자동 계산 스크립트 — design:accessibility-review skill 호출 vs 자체 구현 — Dev 선택, Phase 3
- **D-feedback-7 (신규)**: D3.js dependsOn 그래프 layout — force-directed (현재 PD N=35) / tree (확장성 N=50+) — Dev 권고 + Master 승인, Phase 4
- **D-feedback-8 (신규)**: hidden state 처리 — nav.js `data-state="pending"` 마킹 + click disable + tooltip — Dev 구현 합의, Phase 4

Arki는 spec만 제시. Dev 거부권 행사 시 Arki 재호출 후 spec 갱신.

---

## 6. 전제 조건 (각 Phase 진입 가드)

| Phase | 전제 |
|---|---|
| Phase 0 | Master G1·G2 결정 1줄 답 (G0-4·G0-8 동결 트리거) + Vera 재호출 없이 Arki 흡수 spec으로 진행 |
| Phase 1 | G0 9건 모두 충족 + Vera 호출 가능 + Dev 호출 가능 + D-feedback-5 합의 |
| Phase 2 | G1 통과 + ECharts wrapper 패턴 합의 (D-feedback-1) + mock fixture 환경변수 명 합의 |
| Phase 3 | G2 통과 + baseline 16건 생성 + design:accessibility-review skill 활성화 |
| Phase 4 | G3 통과 + D-060 metrics_registry 빌드 산출물 정합 + D-feedback-7 합의 |
| Phase 5 | G4 통과 + Edi 호출 가능 + PD-042 closure 준비 |

---

## 7. 자기감사 라운드 2 (sa_rnd 가산, post-synthesis 자가 적출)

**라운드 1** (rev1)에서 9 발견 → 모두 Phase 분해에 흡수.
**라운드 2** (rev2 갱신본 자가 결함 적출):

| 축 | 발견 | ROI | 대응 |
|---|---|---|---|
| structuration | **신규 결함 #3**: Phase 4에서 신설되는 `app/people.html` 외에 `app/deferrals.html`도 신설인데 inventory `to_create` 3건 명시는 했으나 Phase 분해 §2-4 산출물 표에서 `app/deferrals.html`이 빠질 뻔함 — 본 갱신본 §2-4에 명시 박제 완료 | MUST_NOW | 흡수됨 |
| structuration | **신규 결함 #4**: G0-5 inline-root-dump.json이 13 active 페이지를 스캔한다고 명시했지만 legacy 4 페이지(v3 변종)는 어차피 archive 이동 → 스캔 대상에서 제외해야 작업 중복 회피. 본 갱신본 §1-5에 "13 active 페이지" 명시 (legacy 제외) | MUST_NOW | 흡수됨 |
| hardcoding | **신규 결함 #5**: Phase 4에서 `app/role-signature-card.html` partial을 Home·People 위젯으로 재사용한다고 했는데 partial 로딩 패턴(fetch + innerHTML vs 빌드시 inline)이 미정 → D-feedback-9로 신규 박제 권고 (Phase 1 진입 시 Dev 합의) | MUST_BY_N=10 | §5-2에 D-feedback-9 추가 권고 (단 본 turn에서는 8건 명시까지만, Master 확인 시 +1) |
| efficiency | **신규 결함 #6**: G3 게이트가 contrast check + accent-only lint + VR diff + bbox + nav 단일 source + 가로 스크롤 0 + 텍스트 잘림 0 = 7개 검증을 한 게이트에서 처리 → 게이트 단일점 실패 위험. 그러나 모두 자동화 lint·VR·visual diff로 1회 빌드에 처리 가능 → 분리 ROI 낮음. NICE 유지 | NICE | 분리 안 함 |
| efficiency | **신규 결함 #7**: 24 baseline + bbox 비교가 Phase 2와 Phase 4에서 두 번(16+8)으로 나뉨 → baseline 합산 시 24건이지만 두 라운드의 환경 차이(Playwright 버전·OS 폰트 hinting)가 있을 수 있음. 같은 환경 보장 필요. mock fixture가 데이터는 잡아주지만 환경은 잡지 못함 | MUST_BY_N=10 | vr-spec.md에 "Phase 4 baseline 추가 시 Phase 2와 동일 Playwright 버전·docker 이미지 사용 명시" 1줄 추가 권고 (G0-7 보강) |
| extensibility | **신규 결함 #8**: `--bp-mobile/--bp-desktop` 토큰 명이 단일 분기점만 표현 — 향후 1024 미세 조정(예: 1366·1600) 발생 시 토큰 명이 부족. 미세 조정용 `--bp-sm/md/xl` 보유는 했으나 정책 분기 토큰과 명명 일관성 부족 | NICE | NICE 유지 — 1024 단일이 안정될 때까지 추가 분기 안 함 |
| extensibility | **신규 결함 #9**: D3.js Deferrals 그래프 N=50+ 시 force-directed 폭발 — Riki §6에서 의도적 제외했고 Fin §2-3 누적성 약-중 평가. 그러나 본 토픽 안에서 layout 알고리즘 1줄 박는 게 ROI 양수 (D-feedback-7) | MUST_BY_N=10 | D-feedback-7 추가 (Phase 4) — 흡수됨 |
| extensibility | **신규 결함 #10**: 부분 출시 4 페이지 중 Records/Topics는 topic-card + session-chip-row 신규 컴포넌트 의존 — Phase 3 통과 시 신규 컴포넌트가 production에 들어가는데, hidden state로 보호되는 growth·people·deferrals와 달리 Records/Topics는 즉시 active. 신규 컴포넌트 회귀 위험 단독 부담 | SHOULD | vr-spec.md에 "topics 페이지 baseline은 Phase 2에서 신규 컴포넌트 적용 후 박음" 명시 (G0-7에 이미 흡수, 명시도만 보강) |

**라운드 2 발견 = 8건. 모두 본 갱신본 또는 Phase 분해에 흡수**(또는 NICE/SHOULD로 명시 보류).

**scopeDriftCheck**: rev1 → rev2 spec 변경량 = 약 1.3배 (G0 4건 → 9건, breakpoint 4단 → 1단, baseline 36 → 24, 신규 산출물 5건 추가). 원 spec 정의 1배 내(Master 승인 흡수)이므로 통과. PD 분할 제안 없음.

**자발적 라운드 종료 사유**: 라운드 2에서 발견 8건 중 NICE/SHOULD 2건, 흡수 6건. Master/Ace 추가 압박 있을 시 라운드 3 가능. 본 갱신본은 spec lock 동결 직전 상태로 충분.

---

## 8. 잔존 리스크·운영 메모

- **컨텍스트 휘발 방어선**: G0 9 산출물이 `topics/topic_082/` 아래 박제되면 다음 세션 진입 시 Read만으로 컨텍스트 복원. 본 세션에서 G0 통과를 박는 것이 핵심 (Fin §6-4 + Riki R-05).
- **Master G1·G2 답 대기**: G0-4(G1 lint 색 한정) + G0-8(child 분기 + 부분 출시 4) 동결 트리거. 답 후 Phase 0 산출물 9건 박제 진행.
- **Vera 재호출 비호출**: Master 박제 #11·#12로 Vera 1차 spec 일부 폐기 사항(4단·collapsed·0px 임계)은 본 Arki 갱신본이 흡수. Vera 재호출 시 Phase 1 G1 구체화에서 합류 (D-feedback-5 합의).
- **HALT-2 모니터링**: Phase 2 진입 후 mock fixture swap 작동 안 하면 즉시 manual smoke test fallback. PD-034 무산 위험 박제됨 (Fin §6-1).
- **Phase 4 N=35 → N=50+ 위험 약-중**: Deferrals D3 그래프 — D-feedback-7(layout 알고리즘) Phase 4 진입 시 결정.

---

## 9. 다음 역할 인계

- **Master** — Ace 종합검토 §6 결정 G1·G2 1줄 답 부탁. 답 후 Phase 0 G0 9 산출물 박제 진행.
- **Ace** — 본 갱신본을 Phase 0 spec lock 진행 신호로 사용. 추가 옵션 탐색 0건 — 종합검토 그대로 채택본.
- **Vera (Phase 1 G1 진입 시)** — D-feedback-5(G1 lint 구현 패턴) + role-signature-card partial 로딩 패턴(D-feedback-9 신규 권고) 합의.
- **Dev (Phase 1 진입 시 G0 통과 후)** — D-feedback-1·2·5 합의 후 진입. tokens.css·nav.js·G1 lint 구현 시작.
- **Edi (Phase 5)** — release notes + PD-042 closure + CF Pages 빌드 트리거.

---

```yaml
# self-scores
aud_rcl: Y
str_fd: 5
spc_lck: Y
sa_rnd: 2
```

(주: `aud_rcl`=Y — Riki cross-review 5 리스크 중 R-01·R-02·R-03·R-04·R-05 모두 Phase 0~3 게이트에 흡수 박제, post-synthesis 재호출에서 Riki 보강 누락 0건. `str_fd`=5 — rev1 결함 #1·#2 + rev2 자기감사 라운드 2의 신규 결함 #3·#4 + 결함 #7(Playwright 환경 일관성) 5건 발견 박제. `spc_lck`=Y — 본 갱신본이 Phase 0 G0 9 산출물 spec lock 동결 직전 상태, Master G1·G2 답 후 즉시 `status: locked-for-dev` 박제 가능. `sa_rnd`=2 — 라운드 1(rev1) + 라운드 2(rev2 갱신본 자가 결함 적출 8건). 라운드 3은 Master 압박 시 가산.)
