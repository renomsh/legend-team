---
deliverable: G0-8
artifact: spec-lock-decisions
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
phase: phase-0-execution
grade: S
turnId: 12
invocationMode: subagent
recallReason: phase-0-execution
status: locked-for-dev
sources:
  - reports/2026-04-22_dashboard-redesign-ux-responsive/inventory.md (G0-1)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/legacy-decision.md (G0-2)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/ia-spec.md (G0-3)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/token-axes-spec.md (G0-4)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/inline-root-dump.json (G0-5)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/responsive-policy.md (G0-6)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/vr-spec.md (G0-7)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/contrast-check.md (G0-9)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/arki_rev2.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/arki_rev3.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/vera_rev3.md
  - reports/2026-04-22_dashboard-redesign-ux-responsive/dev_rev1.md
---

# G0-8 spec-lock-decisions — topic_082 Phase 0 spec lock 동결 단일 출처

Ace입니다. 본 문서는 Phase 0 G0-8 산출물입니다. Master 박제 누적 18건 + D-094~D-098 + PD-046~PD-050 신설 + PD-045 deprecated 모두 단일 spec lock 표로 동결합니다. Hard breaker B1·B2·B3 정밀 정의 + 부분 출시 4 페이지 출시 게이트 + Phase 1~5 게이트 진입 조건 + HALT 4 + spec drift 차단 정책을 본 문서가 canonical로 보유합니다.

옵션 탐색 0. 단일 추천. 전 산출물 lock 종합.

---

## 1. Master 박제 누적 결정 표 (18건 + D-094~D-098 + PD-045~PD-050)

### 1-1. Master 명시 박제 18건 (session_104)

| # | 박제 항목 | Decision ID | 정합 산출물 |
|---|---|---|---|
| 1 | 사이드바 평면 깊이 ≤ 2 | D-087 | ia-spec §1 |
| 2 | Top Nav 6 카테고리 (Home·Dashboard·Growth·People·Records·System) | D-087 | ia-spec §1 |
| 3 | Records 5 sub (Topics·Sessions·Decisions·Feedback·Deferrals) | D-087 | ia-spec §1·§3 |
| 4 | Sessions 내부 3탭 (Current·History·Turn Flow) | D-087 | ia-spec §3 |
| 5 | Home = 가벼운 랜딩 (Hero KPI 3 + 5 인덱스 카드 + Recent band) | D-087 | ia-spec §5 |
| 6 | 부분 출시 4 페이지 허용 (Home·Upgrade·Ops·Records/Topics) | D-088 | 본 §3 |
| 7 | Dashboard/Ops 본체 그대로 유지 (D-090 부수) | D-087 | inventory §7 |
| 8 | nav.js 단일 source 강제 | D-087 | ia-spec §2-2 |
| 9 | Hidden state 처리 (data-state="pending" + a11y) | D-087 | ia-spec §6-2 |
| 10 | tokens.css 단일 출처 (canonical) | D-091 | token-axes-spec §1·§7 |
| 11 | 1024 단일 분기 (D-095) | D-095 | responsive-policy §1 |
| 12 | VR mock fixture + bbox 24 baseline + maxDiffPixelRatio 0.02 | D-088 | vr-spec §3·§4·§5 |
| 13 | child 분기 = Hard breaker B1·B2·B3 한정, 그 외 분화 금지 | D-088 | 본 §2 |
| 14 | legacy v3 변종 4 archive 이동 | D-094 | legacy-decision §2 |
| 15 | dashboard-ops 페이지 그대로 유지 | D-090 부수 | inventory §7-2 |
| 16 | partial build-time inline 패턴 (`<!-- @partial:* -->`) | D-091 | inventory §4 |
| 17 | Playwright `mcr.microsoft.com/playwright:v1.45.0-jammy` docker pin | D-089 | vr-spec §1-1 |
| 18 | dashboard-upgrade.html canonical reference 선언 | D-090 / D-097 | inventory §7-1 |

### 1-2. Decision Ledger 신설 항목 (D-094~D-098)

| Decision ID | 제목 | 박제 위치 |
|---|---|---|
| **D-094** | legacy v3 변종 4 archive — 경로 `app/legacy/archive/v3-variants/` + 시점 Phase 0 G0 박제 직후 + `git mv` history 보존 | legacy-decision.md |
| **D-095** | 반응형 단일 분기 1024px (`--bp-mobile-max: 1023px`) — 768·multi-tier 폐기 | responsive-policy.md §1 |
| **D-096** | G3 게이트 = VR diff ≤0.02 + bbox ±1px + contrast 20조합 + accent-only + nav 단일 source + 가로 스크롤 0 + 텍스트 잘림 0 | 본 §4 Phase 3 |
| **D-097** | dashboard-upgrade.html line 9~24 = tokens.css canonical hex 출처. 변경 0 | token-axes-spec §11 |
| **D-098** | Hard breaker B1·B2·B3 정밀 정의 박제 (본 §2) + child 분기 발동 조건·검증 방법·spawn 토픽 spec 동결 | 본 §2 |

### 1-3. PD 정리 표 (PD-045 deprecated, PD-046~PD-050 신설)

| PD | 상태 | 사유 / 발동 trigger |
|---|---|---|
| **PD-045** "13 페이지 인라인 색·레이아웃 토큰 산재 정리" | **deprecated** | Dev 실측 — active 페이지 색 인라인 1건만(dashboard-upgrade), 레이아웃 인라인 0건. Phase 1 G1 한 트랙 흡수, 별도 PD 명분 소멸 |
| **PD-046** dashboard-ops 컴포넌트(`.command-grid` 등) → dashboard-upgrade canonical 카탈로그 흡수 | 신설 | D-090 부수. ops 본체는 본 토픽 유지, 컴포넌트 표준화는 별도 트랙 |
| **PD-047** semantic state 토큰(`--ok`·`--warn`·`--bad`) tokens.css 흡수 결정 | **흡수 완료** (G0-4) | tokens.css §2-2 §3에 박제. PD 자체는 closed 상태로 박제 가능 |
| **PD-048** mock fixture·docker image 갱신 주기 | 신설 | image hash sha256 박제 + 갱신 시 baseline 전체 재캡처 정책 |
| **PD-049** dpr 2 retina baseline 4건 추가 (조건부) | 신설 | Phase 5 G5 진입 시 검토. 본 토픽 baseline 0 |
| **PD-050** accent-only lint 동적 JS 색 주입 검출 (조건부) | 신설 | D-003 read-only 폐기(B2 발동) 시에만 |

---

## 2. Hard breaker B1·B2·B3 정밀 정의 (D-098)

본 토픽 spec lock의 외곽 경계. 이 3건 외에는 child 토픽 분기 금지 (메모리 `feedback_no_premature_topic_split` 정합).

### 2-1. B1 — Cloudflare Pages 정적 정책 변경

| 항목 | 정의 |
|---|---|
| **정의** | Cloudflare Pages 정적 배포 가정이 깨지는 인프라 결정 — SSR / edge function / Workers 도입 결정 |
| **발동 조건** | (a) Master 명시 결정 변경 ledger 기록, (b) `wrangler.toml` 또는 `_worker.js` 신설, (c) `app/` viewer가 server-side render 의존하도록 변경 |
| **검증 방법** | (1) decision_ledger.json grep으로 "SSR" / "edge function" / "Cloudflare Workers" 신규 D-xxx 확인, (2) `app/_routes.json` 또는 `functions/` 디렉토리 신설 검출, (3) Master 명시 발화 박제 |
| **child 토픽 spawn 시 형태** | 새 토픽 `topic_xxx_dashboard-ssr-migration` (Grade A) — 본 토픽 spec 전체 무효 처리 + Phase 0~5 재설계. parent=topic_082 (resolved-by-spawn 표시). resolveCondition: "SSR 인프라 결정 박제 직후 본 토픽 spawn" |
| **본 토픽 처리** | spec lock 하 발동 0 — 정적 viewer 가정 전체 유지 (D-003·D-006). 발동 검출 시 본 토픽 즉시 hold + Master 통지 |

### 2-2. B2 — D-003 read-only viewer 폐기

| 항목 | 정의 |
|---|---|
| **정의** | viewer는 read-only(읽기 전용) 정책 폐기 — form/input/state-changing button 도입 결정 |
| **발동 조건** | (a) Master 명시 D-003 폐기 ledger 기록, (b) `app/**/*.html`에 `<form>` / `<input type≠hidden>` / `<button onclick="...write...">` 신규 추가, (c) write API 신설 결정 (`functions/api/*.ts` 또는 외부 백엔드) |
| **검증 방법** | (1) decision_ledger.json grep "D-003 deprecated" 또는 "form 도입" 검출, (2) `grep -r "<form" app/` 결과 비어있음 유지 모니터링 (Phase 1 G1 lint 추가 검토), (3) Master 발화 박제 |
| **child 토픽 spawn 시 형태** | 새 토픽 `topic_xxx_dashboard-write-flow` (Grade A) — IA에 input flow 추가 + Records/Sessions·Deferrals read interaction 전제 무너짐 + write API 신설 필요. parent=topic_082, resolveCondition: "write flow 결정 박제 직후 spawn". PD-050 (accent-only 동적 JS 색 주입 lint) 동시 발동 |
| **본 토픽 처리** | spec lock 하 발동 0 — D-002·D-003 정합 유지. 모든 entity 페이지 read-only 네비게이션만 |

### 2-3. B3 — D-060 metrics_registry 스키마 변경

| 항목 | 정의 |
|---|---|
| **정의** | growth.html 데이터 계약(`memory/growth/metrics_registry.json` 스키마) 변경 결정 — 자가평가 D-092 단일 출처 정책의 스키마 변형 |
| **발동 조건** | (a) Master 명시 D-060 ledger 갱신, (b) `compile-metrics-registry.ts` 출력 shape 변경 (key 추가·삭제·rename), (c) `selfScores` 키 체계 변경 |
| **검증 방법** | (1) `git diff memory/growth/metrics_registry.json` 스키마 변경 확인, (2) decision_ledger.json grep "D-060 갱신" 또는 "metrics_registry 스키마", (3) Phase 4 G4 진입 시점 우선 점검 |
| **child 토픽 spawn 시 형태** | 새 토픽 `topic_xxx_growth-page-redesign` (Grade A) — growth.html 재설계 + people.html signature 데이터 영향 전파 + tests/fixtures/vr/mock-data.json roles[] 갱신 + Phase 4 baseline 8건 재캡처. parent=topic_082, resolveCondition: "metrics_registry 스키마 신 안정 후 spawn" |
| **본 토픽 처리** | Phase 4 G4 진입 시점에서만 발동 가능 — 그 전엔 검출 불가. 발동 시 부분 출시 4 페이지로 본 토픽 종결 + child 토픽으로 growth·people 이관 |

### 2-4. Hard breaker 외 분화 금지 명시

위 B1·B2·B3 외에는 child 토픽 분기 금지. 본 토픽 안에서 framing → design → 구현 → 검증 → 부분 출시까지 1 토픽 완결. 메모리 `feedback_no_premature_topic_split` (session_104) 정합.

---

## 3. 부분 출시 4 페이지 출시 게이트 (D-088)

Phase 0~3 누적만으로 부분 출시 가능 base layer 4건. Phase 4 미완 시에도 active 가능.

### 3-1. 출시 게이트 매트릭스 (각 페이지)

| 페이지 | 출시 조건 (모두 PASS) | 출시 단위 | VR baseline PASS 범위 | Phase 4 미완 시 처리 |
|---|---|---|---|---|
| **Home** (`app/index.html` 재구성) | G1 + G2 + G3 + (Hero KPI 3·5 인덱스 카드·Recent band 신규 컴포넌트 회귀 0) | **개별 출시 가능** | Home 4 baseline (1920·1440·1280·375) | Recent band Recent PDs는 hidden(Records/Deferrals 페이지 미완), Recent Topics·Decisions만 표시 |
| **Dashboard / Upgrade** (canonical 본체) | G1 + G2 + G3 + dashboard-upgrade 본체 무회귀 (line 9~24 인라인 `:root{}` 1건 → tokens.css import 치환만, 컴포넌트 클래스 변경 0) | **개별 출시 가능** | Upgrade 4 baseline | second-nav-tab만 추가, 본체 그대로 |
| **Dashboard / Ops** (본체 그대로) | G1 (sidebar partial 치환 + tokens.css import만) + G2 + G3 + ops 페이지 컴포넌트 회귀 0 | **개별 출시 가능** | Ops 4 baseline | 본체 그대로, 컴포넌트 흡수는 PD-046 별도 트랙 |
| **Records / Topics** (`app/topic.html` 재구성) | G1 + G2 + G3 + (topic-card·session-chip-row 신규 컴포넌트 회귀 0) | **개별 출시 가능** | Topics 4 baseline (records/topics.html 대표) | second-nav-tab으로 Sessions·Decisions·Feedback도 active 가능. Deferrals만 hidden |

### 3-2. 출시 단위 — 개별 vs 묶음

| 옵션 | 단위 | 판정 |
|---|---|---|
| (A) 4 페이지 한 묶음 출시 | Phase 3 G3 PASS 시 4 페이지 동시 active | reject — 1 페이지 회귀 시 4 페이지 모두 hold |
| **(B) 개별 출시 + 의존 그래프** | 각 페이지 독립 출시 가능, sidebar partial·tokens.css는 4 페이지 공통 의존 | **채택** — 1 페이지 회귀가 다른 3 페이지 출시 차단하지 않음 |
| (C) 단계 출시 (Upgrade·Ops 먼저, Home·Topics 후) | 2단계 | reject — Phase 3 G3 PASS 후 4 페이지 모두 동일 게이트 통과이므로 단계 분리 명분 약함 |

**채택 = B**. 개별 출시 + sidebar/tokens 공통 의존은 G1에서 선행 통과.

### 3-3. 출시 후 회귀 안전망 (VR baseline PASS 필요 범위)

| 출시 페이지 | 회귀 안전망 (해당 baseline 모두 PASS 유지) |
|---|---|
| Home | Home 4 baseline + (sidebar partial 치환으로 인한) Upgrade·Ops·Topics·Growth·People sidebar 영역 22 bbox marker 중 sidebar marker 4건 (`*-sidebar`) PASS |
| Upgrade | Upgrade 4 baseline + sidebar marker (출시 후 ops·topics 회귀 0) |
| Ops | Ops 4 baseline + sidebar marker |
| Records/Topics | Topics 4 baseline + sidebar marker + second-nav-tab marker (`*-second-nav`) |

**공통 부담**: sidebar partial 치환은 6 baseline 페이지 모두 영향 → Phase 1 G1 PASS 시 6 페이지 sidebar bbox 동시 검증 필수.

### 3-4. 부분 출시 후 나머지 4 페이지 후속 처리

Phase 3 G3 통과 시점 active 페이지 = 4건(Home·Upgrade·Ops·Records/Topics) + Records/Sessions·Decisions·Feedback 3건 (기존 페이지 G1·G2·G3 통과 시 자동 active) = **7 active**.

나머지 후속 4 페이지:

| 페이지 | 처리 | 발동 게이트 |
|---|---|---|
| **Growth** (`app/growth.html` 신설) | Phase 4 G4 진입 시 신설 → 통과 시 active | G4 (D-060 ledger read·B3 발동 0 확인) |
| **People** (`app/people.html` 신설) | Phase 4 G4 진입 시 신설 → 통과 시 active | G4 |
| **Records / Deferrals** (`app/deferrals.html` 신설) | Phase 4 G4 진입 시 신설 → 통과 시 active | G4 (ECharts graph N=35 force-directed 검증) |
| **System** (`app/system.html` 신설) | Phase 4 G4 또는 Phase 5 G5 진입 시 신설 (운영 dashboard 성격) | G4 또는 G5. baseline 트랙 외 (vr-spec §2-1 W-G2) |

Phase 4 미완 동안 4 페이지 모두 nav `data-state="pending"` + click disable + tooltip "Phase 4 진행 중" + `aria-disabled="true"` + `tabindex="-1"`.

Phase 4 G4 통과 시점 = 8 active (Home·Upgrade·Ops·Topics·Sessions·Decisions·Feedback·Growth·People·Deferrals·System = 11 페이지 중 8 baseline + 3 sub manual).

---

## 4. Phase 1~5 게이트 진입 조건 정밀화

### 4-1. Phase 1 G1 — Token + nav 단일화 + lint 3 + partial 패턴

| 항목 | 정의 |
|---|---|
| **진입 조건 (전제)** | G0 9 산출물 모두 `status: locked-for-dev` + Master G0 PASS 승인 (또는 auto 모드 무응답=승인) |
| **핵심 작업** | (1) tokens.css 단일 출처화 (skeleton DONE → 17 페이지 import + dashboard-upgrade·role-signature-card 인라인 `:root{}` 제거), (2) partial 빌드 패턴 구현 (`app/partials/sidebar.html`·`topbar.html`·`role-signature-card.html` 신설 + `scripts/build.js` patch + `<!-- @partial:* -->` 마커 1-pass), (3) lint 3 스크립트 (`lint-inline-root-color.ts` ~30 LOC + `lint-contrast.ts` ~50 LOC + `lint-accent-only.ts` ~40 LOC) + build.js hook, (4) legacy 4 변종 archive 이동 (`git mv` `app/legacy/archive/v3-variants/`), (5) helper class CSS (`app/css/components.css` — `.title-1l`·`.kr-text`·`.kpi-num`·`.chip-row`·`.table-scroll`), (6) `app/js/nav.js` drawer toggle + 6 카테고리 + Records 5 sub + Dashboard 2 sub + hidden state |
| **PASS 조건** | (1) tokens.css 빈 슬롯 0 + 17 페이지 import 100%, (2) `lint-inline-root-color.ts` PASS (active 페이지 인라인 `:root{ --c-* }` 0건), (3) `lint-contrast.ts` PASS (20조합 4.5:1 전부 충족), (4) `lint-accent-only.ts` PASS (`--c-dev`·`--c-ace` 본문 color 0건), (5) nav.js 단일 source 작동 (sidebar HTML 중복 0), (6) build.js partial inline 작동 (`<!-- @partial:* -->` 마커 dist에 0건 잔존), (7) legacy 4 변종 `app/` production 트리에서 제거 + `dist/app/legacy/` 부재 |
| **FAIL 시 처리** | (a) lint fail ≥5 active 페이지 → Phase 1 hold + Master 결정 (G1 범위 좁힐지 spec 재검토). 단 Dev 실측 g1LintTargetPages=1이므로 발동 가능성 사실상 0. (b) tokens.css 빈 슬롯 → Vera 재호출. (c) partial inline 작동 안 함 → Dev 재호출 + skeleton spec 재합의. (d) legacy 이동 후 build.js scan 오작동 → patch 보강 |
| **게이트 산출물** | tokens.css 정합 17 페이지 + 3 lint 통과 로그 + partial 3 신설 + nav.js 6 카테고리 + helper class CSS + legacy archive 이동 commit |

### 4-2. Phase 2 G2 — 반응형 적용 + VR 인프라

| 항목 | 정의 |
|---|---|
| **진입 조건** | G1 PASS + ECharts wrapper 패턴 합의 (D-feedback-1 인수) + mock fixture 환경변수 명 합의 + Playwright docker pull 가능 환경 |
| **핵심 작업** | (1) 11 active 페이지 컨테이너 fluid 적용 (`@media (max-width: 1023px)` drawer + `--sidebar-w` 220 → drawer 280 transform), (2) ECharts 단일 ResizeObserver broadcast wrapper, (3) `tests/visual/playwright.config.ts` (1280×800 default + 4 viewport override + dark + reducedMotion + ko-KR + Asia/Seoul), (4) `tests/fixtures/vr/mock-data.json` 신규 (G0-7 §3-3 골격), (5) `data-vr-bbox` 22 marker 6 페이지 부여, (6) `scripts/vr-capture.ts`·`vr-compare.ts` skeleton, (7) baseline 24 첫 캡처 (5회 재실행 noise 평균 권고), (8) CI workflow `.github/workflows/vr.yml` |
| **PASS 조건** | (1) 6 baseline 페이지 × 4 viewport = 24 PNG 생성 성공, (2) 22 bbox marker 첫 캡처 + JSON 저장, (3) ECharts resize 11 페이지 작동 (manual smoke or VR), (4) 1024 분기점 위·아래 가로 스크롤 0, (5) drawer 280px transform 작동, (6) hamburger 40px tap target ≥48 통과 |
| **FAIL 시 처리** | (a) Playwright docker pull 실패 → HALT-2 trigger 검토 (manual smoke test fallback). (b) baseline 첫 캡처 noise 폭주 → `maxDiffPixelRatio` 임계 검증 + 5회 평균. (c) ECharts wrapper 작동 안 함 → 차트별 init 분리 fallback (D-feedback-1 보강) |
| **게이트 산출물** | 24 baseline PNG + 22 bbox JSON + Playwright config + mock fixture + VR scripts + CI yml |

### 4-3. Phase 3 G3 — 검증 단독 게이트 (D-096)

| 항목 | 정의 |
|---|---|
| **진입 조건** | G2 PASS + baseline 24 + bbox 22 모두 첫 캡처 완료 + 3 lint 통과 |
| **핵심 작업** | 검증만 — 신규 산출물 0. 기존 4 baseline 페이지(Home·Upgrade·Ops·Topics)에 대한 회귀 검증 + 부분 출시 결정 |
| **PASS 조건 (D-096 정합 7항)** | (1) VR diff `maxDiffPixelRatio ≤ 0.02` 6 페이지 × 4 viewport = 24 PASS, (2) bbox 22 marker ±1px PASS, (3) `lint-contrast.ts` 20조합 PASS, (4) `lint-accent-only.ts` PASS, (5) nav.js 단일 source 100% (sidebar HTML 중복 grep 0), (6) 가로 스크롤 0 (모바일 4 페이지 viewport 375 검증), (7) 텍스트 잘림 0 (helper class 적용 페이지 manual + visual review) |
| **FAIL 시 처리** | (a) VR fail ≥3 페이지 → Phase 1 토큰 axes 또는 Phase 2 컨테이너 사용처 재검토. (b) contrast fail → tokens.css 색 값 재계산 + Vera 재호출 + `--c-dev-fallback`·`--c-ace-fallback` swap candidate 검토. (c) accent-only fail → 사용처 식별·치환 (자동 swap 금지, manual review). (d) fail ≥4 페이지 (전체 67%) → Phase 1 토큰 정의 자체 폐기 검토 (사실상 본 토픽 hold) |
| **게이트 산출물** | G3 PASS 로그 + diff 0 회귀 리포트 (있다면 `reports/visual-regression/2026-04-25/`) + 부분 출시 4 페이지 active 박제 |
| **부분 출시 trigger** | G3 PASS 시점에 부분 출시 4 페이지 즉시 active (D-088). 나머지 Records 3 sub(Sessions·Decisions·Feedback)는 G3 통과만 하면 자동 active = 7 active |

### 4-4. Phase 4 G4 — 8 페이지 신설 + Records 5 파일 + Deferrals 그래프

| 항목 | 정의 |
|---|---|
| **진입 조건** | G3 PASS + 부분 출시 4 페이지 active + D-060 metrics_registry shape 정합 확인 (B3 발동 0) + D-feedback-7 합의 (force-directed + N≥50 tree) + design:accessibility-review skill 활성화 |
| **핵심 작업** | (1) `app/growth.html` 신설 (D-060 안 β + 3축 KPI + 4×2 signature panel + Registry version footer), (2) `app/people.html` 신설 (signature.html 합류, 4×2 grid `repeat(auto-fit, minmax(240px, 1fr))`), (3) Records 5 파일 분리 (`app/records/{topics,sessions,decisions,feedback,deferrals}.html`) + second-nav-tab 컴포넌트, (4) `app/deferrals.html` 신설 (PD 60% + ECharts graph 40% sticky 560h, force-directed N<50 / tree N≥50), (5) `app/session.html` 내부 3탭 (Current·History·Turn Flow), (6) `app/system.html` 신설 (Config·Log·Charter version), (7) Phase 4 baseline 8건 추가 (Growth·People 2 페이지 × 4 viewport = 8), (8) Phase 4 신규 페이지 수동 `design:accessibility-review` audit 4건, (9) 4 페이지 hidden state 해제 + nav.js mount 확장 |
| **PASS 조건** | (1) growth.html이 D-060 metrics_registry 소비 성공 (스키마 정합 0 deviation), (2) people.html signature 통합 + nav 단일 source 유지, (3) Records 5 sub second-nav 작동, (4) Deferrals ECharts graph N=35 렌더링 성공 + force-directed 안정, (5) baseline 24 → 32 (Phase 2 24 + 8 신규) 모두 PASS, (6) contrast/accent-only/inline-root-color 신규 4 페이지 PASS, (7) manual a11y audit 4건 PASS (또는 결함 박제 후 NICE 수용), (8) Records sub-folder `app/records/` `../css/tokens.css` path resolve 정합 |
| **FAIL 시 처리** | (a) growth 데이터 계약 불일치 → **B3 발동** child 토픽 분기 + 본 토픽 부분 출시 4로 종결, (b) people 4×2 grid 1024~1180 fallback 깨짐 → `repeat(auto-fit, minmax(240px, 1fr))` 검증 (이미 spec 박제), (c) Deferrals N≥50 폭주 → tree fallback 자동 트리거 검증, (d) baseline noise 폭증 → mock fixture seed 강화 |
| **게이트 산출물** | 8 페이지 신설 + Records 5 파일 + 32 baseline + a11y audit 4 리포트 (`reports/.../a11y-audit-{page}.md`) + nav.js 6 카테고리 완전 mount |

### 4-5. Phase 5 G5 — Edi 인계 + auto-push

| 항목 | 정의 |
|---|---|
| **진입 조건** | G4 PASS + Edi 호출 가능 + PD-042 closure 준비 + auto-push 환경 (CF Pages 빌드 토큰 유효) |
| **핵심 작업** | (1) VR 32 baseline 회귀 0 재실행, (2) IA 평면 깊이 ≤ 2 검증 리포트, (3) legacy/ 디렉토리 dist 포함 0 검증 (`dist/app/legacy/` 부재), (4) CF Pages 빌드 성공 (build.js full chain), (5) PD-042 closure 박제 (signature → people merge 완료), (6) Edi: release notes + published 마킹 + dashboard build 트리거, (7) auto-push hook chain (tokens → finalize → compute → build → push), (8) PD-049 (dpr 2) 검토 — 본 토픽 외 별도 PD 트랙 박제 |
| **PASS 조건** | (1) VR 32 재실행 회귀 0 또는 의도된 diff만, (2) IA 평면 깊이 ≤ 2 (Top Nav 6 + 2차 Dashboard 2/Records 5 = 7), (3) `dist/app/legacy/` 부재, (4) CF Pages 빌드 성공 (exit 0), (5) PD-042 closure ledger 박제, (6) auto-push 5단계 hook 모두 PASS, (7) 8 active 페이지 + 3 hidden→active 모두 nav 정합 (= 11 페이지 중 baseline 8 + manual 3) |
| **FAIL 시 처리** | (a) build 오염 → legacy 제외 처리 재검증 + isLegacyPath() patch 점검, (b) VR 회귀 → Phase 4 산출물 재검토, (c) PD-042 closure 누락 → ledger 보강 후 재시도, (d) auto-push fail → hook chain individual 재실행 |
| **게이트 산출물** | release notes + PD-042 closure 박제 + dashboard build 산출 + topic_082 status: closed |

---

## 5. HALT 조건 4 (arki_rev2 carry + 본 G0에서 모두 해소 점검)

| HALT | 정의 | G0 시점 해소 상태 |
|---|---|---|
| **HALT-1** Vera 토큰 미합의 | tokens.css canonical 출처 결정 안 됨 | **해소** — D-091 박제 + D-097 dashboard-upgrade.html line 9~24 canonical hex 동결 + tokens.css skeleton 실파일 생성 (Vera turnId 11) |
| **HALT-2** VR SaaS 의존 발생 | Playwright 외 외부 SaaS(Percy·Chromatic 등) 의존 | **해소** — D-088 mock fixture + bbox + maxDiffPixelRatio 0.02 + D-089 docker pin `mcr.microsoft.com/playwright:v1.45.0-jammy`. Phase 2 G2 진입 후 docker pull 실패 시에만 fallback 트리거 (manual smoke test) |
| **HALT-3** D-060 스키마 변경 | metrics_registry 스키마 변경 결정 | **해소 (조건부)** — Phase 4 G4 진입 시점에서만 발동 가능. 그 전엔 검출 불가. 발동 시 B3 child 분기 처리 (본 §2-3) |
| **HALT-4** legacy 결정 보류 | v3 변종 4 archive 처리 미정 | **해소** — D-094 박제 + legacy-decision.md (G0-2) `app/legacy/archive/v3-variants/` + Phase 0 G0 박제 직후 `git mv` |

**HALT 4 모두 G0 단계에서 해소 또는 trigger 명시화 완료**. Phase 1 진입 차단 trigger 0.

---

## 6. spec drift 차단 정책

### 6-1. Phase 진행 중 spec 변경 trigger

본 G0-1~G0-9 9 산출물 + 본 G0-8 박제 결정은 `status: locked-for-dev`. Phase 1 이후 변경 trigger 발생 시:

| 변경 trigger | 처리 |
|---|---|
| Master 명시 결정 변경 (D-xxx 갱신 또는 신규) | (1) 영향 산출물 식별, (2) Arki·Vera 재호출 의무, (3) 변경 산출물 frontmatter `status: revised-{phase}` 마킹, (4) revision_history 박제 |
| Hard breaker B1·B2·B3 발동 | child 토픽 spawn (본 §2 정합) — 본 토픽 spec 변경 0, 새 토픽으로 이관 |
| 자체 lint·VR FAIL 누적 (≥5 페이지 또는 ≥3 baseline) | Phase hold + Master 통지 + spec 재검토 (Vera·Arki 재호출) |
| 신규 PD 박제 | spec 변경 0 — PD 트랙 별도 운영. Phase 4 진입 시점에 PD 통합 검토 |

### 6-2. Arki·Vera 재호출 의무

| 변경 영역 | 재호출 의무 |
|---|---|
| 토큰 값 변경 (`--c-*`·spacing·typography) | **Vera 의무** — token-axes-spec.md 갱신 + 영향 baseline 재캡처 |
| 컴포넌트 spec 변경 (KPI grid·card·hero) | Vera 의무 + Arki 영향 검토 |
| IA 변경 (사이드바 메뉴·Records sub·second-nav) | **Arki 의무** — ia-spec.md 갱신 + nav.js mount 변경 + responsive-policy 영향 |
| 반응형 분기점 변경 | Arki + Vera 둘 다 — responsive-policy.md + tokens.css `--bp-mobile-max` |
| VR 임계 변경 (maxDiffPixelRatio·threshold·bbox tolerance) | Vera 의무 — vr-spec.md + Phase 2 G2 baseline 재캡처 |
| Hard breaker 발동 | Ace 의무 — child 토픽 spawn + parent topic_082 lifecycle 처리 |

**자체 판단으로 spec 변경 금지**. 본 G0-8 박제 후 26+ lock 항목 변경 시 위 의무 절차 필수.

### 6-3. spec drift 검출 lint (자동)

본 토픽 외 별도 트랙으로 운영:
- `scripts/validate-schema-lifecycle.ts` (existing) — schema drift 감시
- `scripts/lint-inline-root-color.ts` (Phase 1 G1 신설) — tokens.css 외 `:root{}` 재정의 차단

---

## 7. G0 PASS 선언

```
G0 PASS 선언 — 9 산출물 검증 결과:

G0-1 inventory ✅ — 9 active 페이지 + 4 legacy 변종 + 8 신규(growth·people·deferrals·system + Records 5 파일 분리 일부 + 신규 컴포넌트) + 3 partial(sidebar·topbar·role-signature-card) + 1 css(tokens.css) + 4 scripts(scan·lint 3종) + dashboard-upgrade vs ops 정리 계획 + PD-045 deprecate + PD-046~PD-050 신설/흡수. Dev turnId 9 실측(`inline-root-dump.json`) 직접 인용. (locked-for-dev)

G0-2 legacy-decision ✅ — archive 경로 `app/legacy/archive/v3-variants/` 단일 추천 + 이동 시점 Phase 0 G0 박제 직후 `git mv` 4회 + build.js LEGACY_PREFIXES patch + lint 자동 제외 + 사이드바 미노출 + 회수 trigger 3정의 (B1/canonical 폐기/참조 read). 4 변종 총 3175 라인 production 진입선 외화. (locked-for-dev, D-094)

G0-3 ia-spec ✅ — 사이드바 6 메뉴 트리(Home·Dashboard 2 sub·Growth·People·Records 5 sub·System) + Records 5 파일 분리(`app/records/{topics,sessions,decisions,feedback,deferrals}.html`) + Sessions 내부 3탭(Current·History·Turn Flow) + second-nav-tab 페이지 내부 채택 + 4 entity 매트릭스(Topic·Session·Decision·PD 상호 링크) + Home 5 인덱스 카드 + 부분 출시 게이트 + Hard breaker B1·B2·B3. 평면 깊이 ≤ 2. (locked-for-dev)

G0-4 token-axes-spec ✅ — 82 토큰 단일 css 박제(색 14 + alpha 3 + semantic 3 + gradient 4 + spacing 11 + radius 6 + shadow 3 + typography 21 + container 6 + motion 5 + z-index 6) + tokens.css skeleton 실파일 생성 + dashboard-upgrade.html line 9~24 canonical hex 동결 변경 0 + 모바일 typography 자동 swap @media + 간당값 fallback 토큰화 + 출처 매핑 표. (locked-for-dev, D-091·D-097)

G0-5 inline-root-dump ✅ — 13 페이지 dump(9 active + 4 legacy) + g1LintTargetPages = 1(dashboard-upgrade.html 색 토큰 8개) + pdDeferralLayoutPages = 0 + role-signature-card.html rootBlocks = 0 확인. PD-045 deprecated 근거 = active 페이지 색 인라인 1건만, 레이아웃 인라인 0건. Dev turnId 9 실측 단일 fact base.

G0-6 responsive-policy ✅ — 1024 단일 분기(`--bp-mobile-max: 1023px`, 768·multi-tier 폐기) + 8 페이지 wireframe(Home·Upgrade·Ops·Growth·People·Records 5 sub 단일 wireframe + 차이·System) + 데스크톱 그리드 골격(220 sidebar + 1440 max main) + 모바일 drawer 280px + 텍스트 깨짐 7 규칙 + helper class 5종 skeleton + drawer JS skeleton + 접근성 spec(focus trap·Esc·prefers-reduced-motion) + KPI auto-fit minmax 페이지별 표준 + Growth/People 4×2 → `repeat(auto-fit, minmax(240px, 1fr))` (R-G4 자가감사 흡수). (locked-for-dev, D-095)

G0-7 vr-spec ✅ — docker pin `mcr.microsoft.com/playwright:v1.45.0-jammy` + 24 baseline(6 페이지 × 4 viewport: 1920·1440·1280·375) + 22 bbox marker + mock fixture `tests/fixtures/vr/mock-data.json` 결정점 10 + Playwright config(dark·reducedMotion·ko-KR·Asia/Seoul·dpr 1) + maxDiffPixelRatio 0.02 + threshold 0.2 + bbox ±1px + vr-capture·vr-compare skeleton + CI workflow yml. Records 5 sub 중 topics 1 baseline 대표 + 4 sub manual review. system.html baseline 외(별도 PD 트랙). (locked-for-dev, D-088·D-089)

G0-8 spec-lock-decisions ✅ — 본 발언. Master 박제 18건 + D-094~D-098 + PD-045 deprecate + PD-046~PD-050 정리 + Hard breaker B1·B2·B3 정밀 정의(child 토픽 spawn spec) + 부분 출시 4 페이지 출시 게이트(개별 출시 + 회귀 안전망 + 후속 4 페이지 처리) + Phase 1~5 게이트 진입 조건·PASS 조건·FAIL 처리·산출물 정밀화 + HALT 4 모두 해소 점검 + spec drift 차단 정책. (locked-for-dev, D-098)

G0-9 contrast-check ✅ — 20 조합 lint(13 기본 + 7 신규: semantic state 3 + panel-2 hover 2 + panel-3 active 1 + text-3 on panel-2 정책 차단 1) + accent-only 강제(`--c-dev`·`--c-ace` 본문 color 차단, 컴포넌트별 허용/차단 매트릭스) + 간당값 fallback `--c-dev-fallback #4F8FF7 5.1:1`·`--c-ace-fallback #9F75F8 5.2:1` 토큰화 + 3 lint 분리(inline-root-color·contrast·accent-only ~30/50/40 LOC) + known-good unit test(#FFFFFF on #000000 = 21:1) + 신규 페이지 manual `design:accessibility-review` skill audit 트랙 + SHOULD-fix 경보 vs FAIL 구분 + `--text-3` font-size ≥11px 본문만 (C-G5 자가감사 흡수). (locked-for-dev)

미해결 0건. HALT 4 모두 해소 또는 trigger 명시화. spec drift 차단 정책 박제 완료.
**Phase 1 G1 진입 가능.**
```

---

## 8. lock 선언

본 G0-8 동결 = Master 박제 18건 + D-094~D-098 + PD 정리 6건(deprecate 1·신설 5) + Hard breaker B1·B2·B3 child spawn spec + 부분 출시 4 페이지 게이트 매트릭스 + Phase 1~5 게이트 정밀화 + HALT 4 해소 + spec drift 차단 정책 박제. 본 산출물이 Phase 1 G1~Phase 5 G5 게이트 단일 출처.

다음 turn: Dev turnId 13 — Phase 1 G1 진입 (tokens.css 17 페이지 import + 인라인 `:root{}` 제거 + lint 3 신규 + partial 3 신설 + legacy archive 이동 + helper class CSS + nav.js drawer + dashboard-upgrade.html first-target 검증).
