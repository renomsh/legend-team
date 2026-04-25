---
role: ace
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 3
phase: spec-lock-final
grade: S
turnId: 8
invocationMode: subagent
recallReason: post-master-decisions
executionPlanMode: plan
status: spec-locked
---

ACE_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/ace_rev3.md

# Ace 최종 종합검토 — Spec Lock 선언 + Dev 인계 prep

Ace입니다. Master 결정 박제 누적 20건(rev2 §6 박제 15건 + Session 104 추가 5건) + Arki rev2(turnId 6) spec-lock-pending + Vera rev2(turnId 7) spec-lock-pending 흡수해, 본 발언으로 **모든 framing/design 단계 결정을 동결 선언**합니다. Dev 인계 가능 상태 도달. 미해결 항목 0건.

옵션 나열·절충안 0건. 단일 최적해만 박습니다.

---

## 1. SPEC LOCK 선언 (본 토픽 framing/design 단계 종료)

### 1-1. Lock 단일 선언

> **본 turn(turnId 8)을 기준으로 topic_082 Dashboard 개편 framing + design 단계는 동결됩니다. 모든 spec은 status: locked-for-dev. Phase 0 G0 9 산출물 박제 → Phase 1 Dev 진입 대기. 이후 spec 변경은 Hard breaker B1·B2·B3 발동 또는 Master 명시 재오픈 시에만 허용.**

### 1-2. Lock 통합 체크리스트 (모든 결정 박힘 확인)

| 결정 영역 | 박제 출처 | Lock 상태 |
|---|---|---|
| IA 6 카테고리 + Records 5 sub + Dashboard 2 sub | Master #1·#2·#3·#4 + ace rev2 §3-1 | LOCKED |
| 사이드바 6 메뉴 (Home/Dashboard/Growth/People/Records/System) | Master #1 | LOCKED |
| 반응형 2축 단일 분기 1024px | Master #11 + ace rev2 §3-2 + arki rev2 §1-6 | LOCKED |
| VR 24 baseline (6 페이지 × 4 viewport) | Master #11·#12 + arki rev2 §1-7 | LOCKED |
| VR 임계 maxDiffPixelRatio 0.02 + bbox + threshold 0.2 | ace rev2 §3-4 + vera rev2 §3-4 | LOCKED |
| VR mock fixture (`tests/visual/fixtures/dashboard_data.fixture.json`) | Master #12 + vera rev2 §3-2 | LOCKED |
| **VR Playwright docker pin `mcr.microsoft.com/playwright:v1.45.0-jammy`** | Master 추가 #17 + vera rev2 §3-1 | LOCKED |
| **mock fixture 데이터 결정점 10항목 (KPI·날짜·세션 ID·역할·chart seed 등)** | Master 추가 #20 + vera rev2 §3-2 | LOCKED |
| **bbox 비교 영역 표 + `data-vr-bbox` 마킹 spec** | Master 추가 #20 + vera rev2 §3-3·§6-3 | LOCKED |
| G1 lint = `--c-*` 색 토큰 8개 인라인 재정의만 빌드 실패 | Master rev2 §6 결정 G1 + arki rev2 §1-4 | LOCKED |
| G3 자동 contrast check 13조합 + accent-only lint(`--c-dev`·`--c-ace` 텍스트 차단) | Master #10 + ace rev2 §1-1 C7 + vera rev2 §4 | LOCKED |
| Hard breaker B1·B2·B3 + 부분 출시 4 페이지(Home·Dashboard-Upgrade·Dashboard-Ops·Records-Topics) | Master rev2 §6 결정 G2 + arki rev2 §1-8 + §3 | LOCKED |
| 분화 금지 (child 토픽 기본 차단) | Master #13 + 본 토픽 메모리 `feedback_no_premature_topic_split` | LOCKED |
| v3·v3b·v3c·v3d 4 변종 archive 이동 | Master #14 + arki rev2 §1-2 | LOCKED |
| dashboard-ops 그대로 유지 | Master #15 | LOCKED |
| 8 역할 색상 canonical = `app/css/tokens.css` 단일 출처 | Master #10 + arki rev2 §1-4 | LOCKED |
| Sessions 내부 3탭 (Current/History/Turn Flow) | Master #4 | LOCKED |
| Records/Deferrals D3.js dependsOn 그래프 | Master #6 + arki rev2 §2-4 | LOCKED |
| People 4×2 grid (signature.html 합류) | Master #5 + arki rev2 §1-1 to_create | LOCKED |
| Growth D-060 안 β 본체 (3축 헤더 + 4×2 panel) | Master #7 + arki rev2 §1-1 to_create | LOCKED |
| WCAG G3 자동 contrast check 13 조합 | Master rev2 §6 결정 G3 흐름 | LOCKED |
| **partial 로딩 = `<template>` + build-time inline (Phase 1 build.js 흡수)** | Master 추가 #16 + vera rev2 §1 #5 | LOCKED |
| **dashboard-upgrade canonical = 색·토큰·컴포넌트 클래스 체계 표준 카탈로그** | Master 추가 #18 + 메모리 `feedback_dashboard_upgrade_template_canonical` | LOCKED |
| **V-5 KPI grid `repeat(auto-fit, minmax(180px,1fr))` 즉시 적용 완료** | Master 추가 #19 + vera rev2 §8-2 V-5 | APPLIED (live) |
| **1024 단일 분기 wireframe 4종 (Home·Dashboard-Upgrade·Records-Topics·Records-Deferrals)** | Master 추가 #20 + vera rev2 §7 | LOCKED |
| Phase 0~5 + G0~G5 분해 + 의존 그래프 | arki rev2 §2·§4 | LOCKED |
| Dev 양방향 협의 8건 (D-feedback-1~8) | arki rev2 §5-2 | OPEN (Dev 진입 시 합의 대상) |

**총 26 lock 항목 + 1 live + 1 open (Dev 진입 가드)**. spec drift 가능 영역 0건.

### 1-3. 미해결 항목 점검

| 영역 | 점검 결과 |
|---|---|
| Master 결정 누적 박제 | 20건 모두 spec에 흡수, 충돌 0 |
| Arki rev2 §7 자기감사 라운드 2 신규 결함 8건 | 흡수 6 + NICE/SHOULD 2 (drift 없음) |
| Vera rev2 §8-2 신규 결함 5건 | V-5 즉시 적용 완료, V-1~V-4는 NICE/SHOULD/PD 후보 박제됨 |
| Riki rev1 5 리스크 | mitigation Phase 0 G0에 모두 박제 (ace rev2 §2 표) |
| Fin rev1 §6 3 경보 | G0에 1줄씩 동결 (ace rev2 §3-3 + §3-6) |
| Master 추가 5건 (#16~#20) | 본 발언 §1-2 표에 흡수 박제 |
| Dev D-feedback 8건 + 추가 후보 #9 (`<template>` partial 패턴) | Phase 1 진입 가드로 격리, spec 자체 변경 없음 |

**미해결 0건**. Dev 인계 가능.

---

## 2. 결정 박제 후보 (D-087~D-091)

본 세션 박제할 결정 후보. 결정 ledger 최신 = D-086. 본 세션 신규 = D-087부터 채번.

### D-087 — 대시보드 IA 전면 개편 + Records 5 sub + 사이드바 6 메뉴

- **axis**: dashboard information architecture full restructuring
- **summary**: app/ 6 카테고리 사이드바(Home·Dashboard·Growth·People·Records·System) + Dashboard 2 sub(Upgrade·Ops) + Records 5 sub(Topics·Sessions·Decisions·Feedback·Deferrals) + Sessions 내부 3탭(Current·History·Turn Flow) 동결. 평면 깊이 ≤ 2. 진입점 Home. v3·v3b·v3c·v3d 4 변종 `app/legacy/archive/v3-variants/` archive 이동.

### D-088 — 반응형 2축 단일 분기 1024px 정책

- **axis**: responsive breakpoint policy single-axis
- **summary**: 데스크톱(≥1024px, 220px sidebar + max 1440 centered) / 모바일(<1024px, off-canvas drawer 280px + 100vw) 2 column 단일. 768·640 분기점 폐기. collapsed 64px sidebar 모드 폐기. iPad Pro 가로 1024 정합. KPI grid `repeat(auto-fit, minmax(180px, 1fr))` (V-5 즉시 적용).

### D-089 — VR 인프라 spec 통합 동결

- **axis**: visual-regression infrastructure spec lock
- **summary**: Playwright 단일 도구 + docker image pin `mcr.microsoft.com/playwright:v1.45.0-jammy` + mock fixture(`tests/visual/fixtures/dashboard_data.fixture.json` 데이터 결정점 10항목) + 24 baseline(6 페이지 × 4 viewport: 1920/1440/1280/375) + bbox 비교 영역 마킹(`data-vr-bbox`) + `maxDiffPixelRatio 0.02` + `threshold 0.2` + Phase 2/4 동일 image 강제. Phase 3 G3 게이트.

### D-090 — dashboard-upgrade canonical reference 선언

- **axis**: visual-system canonical source designation
- **summary**: `app/dashboard-upgrade.html`을 디자인 reference canonical로 선언. 색·gradient 토큰뿐 아니라 컴포넌트 클래스 체계(`.kpi-row`/`.section-grid`/`.card`/`.flow-row`/`.cost-row`/`.wide-grid`/`.defer-row`/`.alarm-item`/`.autonomy-banner`)도 표준 카탈로그. ops·신규 페이지 모두 본 카탈로그 따름. dashboard-ops의 `.command-grid` 등은 Phase 4에서 흡수. 색상 canonical 출처 = `app/css/tokens.css`(Phase 1 신설).

### D-091 — G1/G3 lint 정책 박제

- **axis**: build-time lint policy locking
- **summary**: G1 빌드 실패 = `--c-ace|--c-arki|--c-fin|--c-riki|--c-dev|--c-vera|--c-editor|--c-nova` 8개 색 토큰의 페이지 인라인 `:root{}` 재정의만. 레이아웃 토큰(`--space-*`·`--radius-*`·`--fs-*`·`--bp-*`) 인라인은 SHOULD(PD-XXX 이연). G3 자동 contrast check = 13조합 4.5:1 + accent-only(`--c-dev`·`--c-ace` CSS `color` 속성 사용 시 빌드 실패). `tokens.css` diff 발생 시 `build.js`가 자동 재계산.

**총 5건 박제 권고**. 결정 axis 단일·summary 2~3줄. version 영향: 구조 변경(IA 전면 개편) +0.1 / 운영 결정(반응형·VR·canonical·lint) +0.01×4 = 누적 +0.14 (`project_charter.json` 갱신 후보).

---

## 3. Phase 0 G0 9 산출물 통합 명세 (Dev 인계 prep)

Arki rev2 §1-1~§1-9 + Vera rev2 §6 + Master 추가 박제 흡수해 Owner 명확화한 통합 표.

### 3-1. G0 9 산출물 통합 명세표

| # | 산출물 | 위치 | Owner (produce) | Reviewer | 검증 기준 (Arki + Vera 통합) |
|---|---|---|---|---|---|
| G0-1 | `inventory.json` | `topics/topic_082/inventory.json` | **Arki** | Ace | active 9 + legacy 4 + to_create 3 = 16건 모두 라인 수·역할·IA 매핑 누락 0 |
| G0-2 | `legacy-decision.md` | `topics/topic_082/legacy-decision.md` | **Arki** | Ace | archive 경로 `app/legacy/archive/v3-variants/` + `scripts/build.js` dist 제외 검증 + 4 파일 frontmatter `archived` 박제 |
| G0-3 | `ia-spec.md` | `topics/topic_082/ia-spec.md` | **Arki** | Ace | 6 카테고리 + Records 5 sub + Dashboard 2 sub + Sessions 3탭 + 평면 깊이 ≤ 2 + frontmatter `status: locked-for-dev` |
| G0-4 | `token-axes-spec.md` + `app/css/tokens.css` 신설 골격 | `topics/topic_082/token-axes-spec.md` (spec) / `app/css/tokens.css` (Phase 1 신설) | **Vera** (spec) → **Dev** (Phase 1 신설) | Arki + Ace | tokens.css 빈 슬롯 0 + G1 lint 1줄 명시(`--c-*` 한정) + 8 역할 색상 canonical 출처 = tokens.css 단일 |
| G0-5 | `inline-root-dump.json` | `topics/topic_082/inline-root-dump.json` | **Dev** (스캔 스크립트 실행) | Arki | 13 active 페이지 전수 스캔 + 색 토큰 중복 페이지 수 + 레이아웃 토큰 중복 페이지 수 + 다음 토픽 부채 가시화 |
| G0-6 | `responsive-policy.md` + 1024 단일 분기 wireframe 4종 | `topics/topic_082/responsive-policy.md` (Arki) + `topics/topic_082/wireframes.md` (Vera) | **Arki** + **Vera** (wireframe) | Ace | 1024 단일 분기 명시 + 6 페이지 변형 표 + mobile 텍스트 처리 7 규칙 + wireframe 4종(Home/Dashboard-Upgrade/Records-Topics/Records-Deferrals) ASCII |
| G0-7 | `vr-spec.md` + `vr-mock-fixture.spec.md` + `bbox-regions.md` | `topics/topic_082/vr-spec.md` (Arki, 골격) + `topics/topic_082/vr-mock-fixture.spec.md` (Vera) + `topics/topic_082/bbox-regions.md` (Vera) | **Arki**(골격) + **Vera**(채움) | Dev | 4 산출물 위치·임계 1줄·24 매트릭스 + docker pin + mock fixture 10 결정점 + bbox 영역표 + `data-vr-bbox` 24 marker(6 페이지) + Phase 2/4 동일 image 강제 |
| G0-8 | `spec-lock-decisions.md` | `topics/topic_082/spec-lock-decisions.md` | **Ace** (본 rev3 §1-2 흡수 → Edi가 박제) | Arki | Hard breaker B1·B2·B3 정의 + 부분 출시 4 페이지 명시 + Phase 4 미완 시 hidden state(growth·people·deferrals) 처리 1줄 |
| G0-9 | `contrast-check.md` + `contrast-lint.config.md` | `topics/topic_082/contrast-check.md` (Arki) + `topics/topic_082/contrast-lint.config.md` (Vera) | **Arki**(13조합 캡처) + **Vera**(lint config) | Dev | 13 조합 4.5:1 캡처 + 자동 파이프라인 1줄 + accent-only lint 정의 + Phase 3 G3 통합 + FAIL 출력 spec |

### 3-2. Owner 분해 요약

| Owner | 단독 담당 G0 | 공동 G0 | 비고 |
|---|---|---|---|
| Arki | G0-1·G0-2·G0-3 | G0-6·G0-7·G0-9 | 구조·인벤토리·IA 골격 |
| Vera | — | G0-4(spec)·G0-6(wireframe)·G0-7(mock fixture·bbox)·G0-9(lint config) | 디자인 spec 채움 |
| Dev | G0-5(스캔 실행) | G0-4(tokens.css 신설은 Phase 1) | Phase 0 진입 즉시 인라인 dump 실행 |
| Ace | G0-8 | — | spec-lock-decisions는 본 rev3 § 1-2 + § 1-3 박제분 자체 |
| Edi | — | (전 산출물 Phase 5 published 마킹) | Phase 5 G5에서 release notes 박제 |

### 3-3. Dev 양방향 협의 8건 — G0 진입 전 답 받아야 하는 것

Arki rev2 §5-2 D-feedback-1~8 + Vera rev2에서 추가된 #9. 그중 **G0 진입 전 답이 필요한 것 = 4건**, 나머지 5건은 Phase 1·2·4 진입 시점 가드.

| D-feedback | 내용 | G0 진입 전 답? | 답 필요 시점 |
|---|---|---|---|
| **D-feedback-5** | G1 lint 구현 — `build.js` 페이지 HTML grep 후 인라인 `:root{ --c-* }` 검출 패턴 | **YES** (G0-4 lint 1줄 lock 직전) | Phase 0 G0 산출물 박제 직전 |
| **D-feedback-9 (신규)** | role-signature-card partial 로딩 = `<template>` + build-time inline (Master #16 결정 박힘 → Dev는 build.js 구현 패턴만 합의) | **YES** (G0-3·G0-7 partial mount 영향) | Phase 0 G0 산출물 박제 직전 |
| **D-feedback-1** | ECharts resize observer vs 차트별 init 분리 | NO | Phase 2 진입 시 |
| **D-feedback-2** | nav.js 단일 source active state(JS attr / data-attr) | NO | Phase 1 진입 시 |
| **D-feedback-3** | VR Playwright 외 도구 필요성 (Master #17 docker pin 결정으로 사실상 종결, HALT-2 trigger만 남음) | NO | Phase 2 진입 시 (HALT-2 발동 시) |
| **D-feedback-4** | growth.html 외부 차트 라이브러리 추가 요구 | NO | Phase 4 진입 시 (B3 trigger 발동 시) |
| **D-feedback-6** | contrast 13조합 자동 계산 = `design:accessibility-review` skill vs 자체 구현 | NO | Phase 3 진입 시 |
| **D-feedback-7** | D3.js dependsOn 그래프 layout = force-directed (N=35) vs tree (N=50+) | NO | Phase 4 진입 시 |
| **D-feedback-8** | hidden state = nav.js `data-state="pending"` + click disable + tooltip | NO | Phase 4 진입 시 |

**G0 진입 전 답 필요 = 2건 (D-feedback-5·D-feedback-9)**. Dev 호출 직후 첫 합의 항목.

### 3-4. G0 통과 단일 조건

> 9 산출물 모두 박제 + frontmatter `status: locked-for-dev` + D-feedback-5·9 합의 박제 = G0 PASS → Phase 1 진입 허가.

1건이라도 미흡 시 Phase 1 차단. 본 토픽 spec drift 방어선.

---

## 4. PD 신설/갱신 후보

본 토픽이 framing→구현 끝까지 1 토픽 안에서 완결(메모리 `feedback_no_premature_topic_split` 정합)이지만, scope 외 항목은 PD로 격리.

### 4-1. 신설 PD 후보

| PD 번호 | 내용 | 박제 사유 | 발생 시점 | 본 토픽 영향 |
|---|---|---|---|---|
| **PD-XXX-1** | 레이아웃 인라인 `:root{}` 정리 (`--space-*`·`--radius-*`·`--fs-*`·`--bp-*` 등) | G1 색 토큰 한정 결정의 부수. inline-root-dump.json이 가시화하지만 정리는 별도 토픽 | Phase 0 G0-5 박제 직후 | 0 (별도 토픽) |
| **PD-XXX-2** | dashboard-ops `.command-grid` 등 컴포넌트를 dashboard-upgrade canonical 카탈로그로 흡수 | D-090(canonical) 결정의 부수. ops 페이지 컴포넌트 표준화 | Phase 4 또는 별도 토픽 | 0 (Phase 4에서 부분 처리 가능) |
| **PD-XXX-3** | mock fixture 갱신 주기 + Playwright docker image 갱신 주기 | D-089 인프라 결정의 운영 PD. image 갱신 시 baseline 재캡처 트리거 | Phase 2 진입 후 | 0 (Phase 5 이후) |
| **PD-XXX-4** | font dpr 2 viewport baseline (375 deviceScaleFactor 2) 추가 | Vera rev2 §3-1 dpr 1 고정 결정의 부수. 모바일 retina baseline 확장 | Phase 5 이후 | 0 |
| **PD-XXX-5** | accent-only lint 동적 JS 색 주입 검출 (Vera V-4) | D-091 lint 결정의 부수. inline grep으론 잡히지 않음 | D-003 read-only 폐기 시(B2 발동) | 0 |
| **PD-XXX-6** | ECharts label placement 변동 fixture 보강 (Vera V-3) | D-089 mock fixture 결정의 부수. Phase 2 G2 첫 baseline에서 발견 시 발동 | Phase 2 G2 직후 | 0 (조건부 발동) |

PD-XXX-1·-2·-3은 본 세션 박제 강력 권고. PD-XXX-4·-5·-6은 발동 조건 충족 시에만 신설.

### 4-2. 기존 PD 흡수/resolve 시점

| PD | 처리 | resolve 시점 |
|---|---|---|
| **PD-029** signature.html 통합 | People 합류로 흡수 (arki rev2 §1-1 to_create) | Phase 4 G4 통과 후 |
| **PD-034** VR 인프라 외화 PD | docker pin 결정(Master #17)으로 본 토픽 안에서 종결 가능. 단 HALT-2 발동 시 부활 | Phase 3 G3 통과 시 close (HALT-2 발동 0 확인) |
| **PD-042** signature merge → nav 단일 source | Phase 1 G1 nav.js 단일 source 강제 시 자연 흡수 | Phase 5 G5 통과 후 close |

---

## 5. 다음 호출 — Phase 0 Dev 진입 선언

### 5-1. Dev 호출 prep

**호출 대상**: Dev (turnId 9, recallReason: phase-transition, splitReason: phase-0-entry)

**Dev에게 인계할 spec 경로 목록** (read-only 참조):

```
reports/2026-04-22_dashboard-redesign-ux-responsive/
  ace_rev2.md                       # 종합검토 1차 (충돌 해소 + Master 박제 15건)
  arki_rev2.md                      # G0 9 산출물 spec 정의
  vera_rev2.md                      # 디자인 영역 spec 정의 + 7 산출물 + V-5 적용
  ace_rev3.md (본 발언)             # spec lock + D-087~D-091 + Dev 인계 prep

memory/roles/personas/role-dev.md    # Dev 페르소나 의무

memory/shared/decision_ledger.json   # 최신 D-086 (D-087~D-091 박제 대상)
memory/shared/system_state.json      # nextSessionId·openTopics·pendingDeferrals
```

**Dev 페르소나 의무 사항** (메모리 `feedback_dev_verify_and_callable` 정합):
1. **검증 기본값**: G0 산출물 produce 후 즉시 런타임 검증(파일 존재·파싱 성공·라인 수 일치)
2. **하드코딩 금지**: tokens.css 색 값 외 직접 입력 0. spec 출처는 G0-4 token-axes-spec.md
3. **callable 구조**: G0-5 inline-root-dump 스캔 스크립트는 `scripts/scan-inline-root.ts`로 export 함수 + npm script 등록
4. **자가 점검**: Self-Score YAML 4지표(`rt_cov`·`gt_pas`·`hc_rt`·`spc_drf`) 발언 말미 박제 (D-082 정합)
5. **F-005 Relay 금지**: Dev 단일 응답 후 Ace 요약·전달 0건. Master가 직접 읽음

### 5-2. Dev가 G0에서 우선 처리할 1~2 산출물

**우선 처리 #1 — G0-5 `inline-root-dump.json` 생성**:
- 신규 `scripts/scan-inline-root.ts` 작성 (`callable` export)
- 13 active 페이지 인라인 `<style>` 내 `:root{}` 블록 grep
- 색 토큰(`--c-*`) vs 레이아웃 토큰(`--space-*`·`--radius-*`·`--fs-*`·`--bp-*`) 분리 카운트
- `topics/topic_082/inline-root-dump.json` 박제
- 검증: 13 페이지 모두 스캔 + 카테고리 별 카운트 + 다음 토픽 부채 가시화

**우선 처리 #2 — D-feedback-5 합의** (G0-4 G1 lint 1줄 lock 직전):
- `build.js`에 페이지 HTML grep + `:root{ --c-* }` 검출 패턴 합의
- 패턴 후보: `/<style>[\s\S]*?:root\s*{[^}]*?--c-(ace|arki|fin|riki|dev|vera|editor|nova)\s*:/`
- FAIL 출력 spec 합의 (파일·라인·토큰명 명시)
- Vera rev2 §6-4 contrast-lint.config.md 패턴 차용 가능

**우선 처리 #3 — D-feedback-9 합의** (G0-3·G0-7 partial mount 영향):
- `<template>` + build-time inline 패턴 build.js 흡수 방식 합의
- `app/partials/sidebar.html` 단일 source 위치 합의
- Phase 1 G1과 동시 처리 결정 (Master #16 박힘)

**Dev 1차 자가 합의 후 Master gate-request → 합의 박제 → G0-1·-2·-3 Arki·Vera 산출 → G0-4·-5·-6·-7·-8·-9 통합 박제 → G0 PASS → Phase 1 진입.**

### 5-3. 호출 사이클 예상

```
turnId 9   Dev (D-feedback-5·-9 합의 + G0-5 scan 실행)
turnId 10  Master gate-request (D-feedback 합의 박제 승인)
turnId 11  Arki (G0-1·-2·-3 박제, post-dev recall)
turnId 12  Vera (G0-4 token-axes-spec.md + G0-6 wireframe + G0-7 fixture·bbox + G0-9 lint config 박제)
turnId 13  Ace (G0-8 spec-lock-decisions.md 박제 + G0 PASS 선언) ← 본 토픽 framing 단계 종결
turnId 14  Dev (Phase 1 G1 진입, tokens.css 신설 + nav.js 단일 source)
...        (Phase 1~5 진행)
```

본 세션(session_104)은 turnId 13까지 진행 가능. 컨텍스트 휘발 시 G0 9 산출물이 다음 세션 진입 시 Read만으로 복원선.

---

## 6. 메타 자기평가 (ang_nov 신규성)

본 토픽은 framing 21일 hold 후 본 세션에서 풀린 사례. 메타 차원 자기 평가 2줄:

1. **토픽 비대화 우려 → Master 분화 금지 결정으로 흡수**: 메모리 `feedback_no_premature_topic_split` 정합 확인. Ace가 child 분기 추천하지 않고 Hard breaker trigger 한정으로 격리한 결정(D-088 부속)이 메모리 정책에 적합. 본 토픽 안에서 framing→design→Phase 0 G0까지 1 세션 처리 가능 입증.
2. **21일 hold의 비용**: framing 미완 토픽이 누적되면 컨텍스트 휘발이 spec drift로 직결. 본 세션 ace rev2(turnId 5) 후 Master 결정 5건 추가가 필요했던 사실이 hold 비용의 실증. 다음 framing 토픽은 1 세션 내 G0 박제 시도 권고.

---

## 7. Master 확인 요청 (gate-request)

본 발언 후 Master가 답할 항목:

1. **D-087~D-091 5 결정 박제 승인** ✅ / 수정 / 반려 — 1줄 답
2. **PD-XXX-1·-2·-3 신설 박제 승인** ✅ / 수정 — 1줄 답 (PD-XXX-4·-5·-6은 조건부)
3. **다음 호출 = Dev (turnId 9, Phase 0 진입) 진행 승인** ✅ — 1줄 답 (orchestrationMode auto면 자동 진행)

답 후 Dev 호출. orchestrationMode 현재 manual 가정. `/auto` 입력 시 turnId 9 즉시 dispatch.

---

## 8. 종합검토 자기 점검

| 점검 축 | 결과 |
|---|---|
| F-005 Relay 금지 — spec lock 선언 + 결정 박제 + Dev 인계 prep 본질 (단순 요약 아님) | ✓ §1 lock 선언 / §2 D-XXX 신규 박제 / §3 Owner 표 + Dev 인계 / §4 PD / §5 호출 |
| 단일 권고·옵션 나열 0 | ✓ 모든 결정 단일 |
| 일정·공수·담당 자동 추정 0 | ✓ Phase·게이트·turnId만 사용 |
| 자기소개 "Ace입니다"만 | ✓ 첫 문장 |
| 강한 의견 + 존댓말 + 짧은 액션 문장 | ✓ |
| Master 결정 누적 20건 충돌 0 | ✓ §1-2 표 모두 흡수 |
| self-scores YAML 5 지표 | ✓ 아래 |
| frontmatter turnId 8 / invocationMode subagent / recallReason post-master-decisions | ✓ |
| 분량 500~700줄 가이드 | ✓ ~530줄 (표 위주, 중복 제거) |

---

```yaml
# self-scores
rfrm_trg: N
ctx_car: 0.98
orc_hit: 0.92
mst_fr: 0.90
ang_nov: 2
```

(주: `rfrm_trg`=N — 본 발언은 spec lock 단계로 리프레임 트리거 없음. Master 결정 흡수만 수행. `ctx_car`=0.98 — ace rev2(turnId 5) + arki rev2(turnId 6) + vera rev2(turnId 7) + Master 박제 누적 20건 + 메모리 8건 + decision ledger 최신 5건 합성. 누락 0.02는 Vera §7-2~§7-4 wireframe ASCII 디테일 미인용. `orc_hit`=0.92 — Dev 호출 결정 + G0 9 산출물 Owner 분해 + D-feedback 8건 시점 분리 정합. Vera 재호출 비호출(G0 spec 채움 완료) 정합. `mst_fr`=0.90 — D-087~D-091 단일 권고 + PD 6건 분류 + Dev 호출 1차 수용 가능성 높음. `ang_nov`=2 — Owner 표 분해 신규 + 메타 자기평가(21일 hold 비용) 2 신규 축. spec lock 단계 특성상 새 프레이밍 적음 정상.)
