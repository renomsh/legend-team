---
role: arki
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 1
phase: structural-analysis
grade: S
turnId: 1
invocationMode: subagent
executionPlanMode: plan
status: in-progress
---

ARKI_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/arki_rev1.md

# Arki 구조 분석 — topic_082 Dashboard 전면 개편

Arki입니다. 본 토픽은 IA 전면 + 반응형 + 시각회귀 + nav 통합 4개 축이 한 토픽 안에서 framing→구현까지 묶이는 Grade S입니다. Rich Hickey 관점으로 "짓지 않을 수 있는 것"부터 정렬한 뒤, 현 viewer의 구조와 D-060 Growth Board(안 β)를 어떻게 단일 IA로 수렴시킬지를 설계합니다.

---

## 1. 기술적 성립 여부 — 4개 축 동시 처리 가능한가

### 1-1. 핵심 전제(Ace 🔴) 즉검증
| 전제 | 검증 결과 | 근거 |
|---|---|---|
| 🔴 viewer read-only 정책 유지 (D-003) | **성립** | 본 토픽은 페이지 구조 재배치·CSS·반응형·nav 통합만 다룸. form/input 도입 없음. |
| 🔴 Cloudflare Pages 정적 배포 유지 | **성립** | 모든 산출물이 정적 HTML+CSS+JS+JSON. 빌드 파이프라인(`scripts/build.js`) 그대로 재사용. |
| 반응형 = desktop-first + graceful shrink | **성립** | 고정픽셀 ECharts 캔버스를 컨테이너 fluid로 감싸는 패턴이 viewer 전체에 일관 적용 가능. |

### 1-2. 4축 동시성 평가

```
   IA 개편 ───┐
              ├──→ 같은 페이지 골격 위에서 동시 적용 가능 (의존)
   반응형 ────┘
   
   signature nav 통합 ──→ IA 산출물이고 동시 처리 자연스러움 (포함)
   
   시각회귀 인프라 ────→ IA·반응형의 검증 도구 (직교)
```

**결론**: 4축은 직교가 아니라 "IA·반응형 = 본체 / nav 통합 = IA의 일부 / 시각회귀 = 본체의 검증게이트"로 위계가 있다. 한 토픽 안에서 처리할 수 있다. **단, 시각회귀 인프라를 본 토픽 안에서 박는다는 결정(PD-034 흡수)은 토픽을 비대화시킬 위험이 있어 §5 실행계획에서 Phase를 분리해 단계 차단(gate)으로 다룬다.**

### 1-3. 짓지 않음 옵션 검토 (Hickey-mode)

| 후보 | 짓지 않을 수 있나 | 판단 |
|---|---|---|
| 새 CSS 프레임워크(Tailwind/Bootstrap) | **짓지 않는다** | 현 `app/css/style.css` 1개 파일 + 페이지별 인라인 `<style>` 패턴 유지. 디자인 토큰만 CSS 변수로 추출. |
| 라우터/SPA | **짓지 않는다** | 정적 HTML 다중 페이지가 viewer 정책에 정렬. 딥링크는 해시 기반으로 충분. |
| 빌드툴(Vite/Webpack) | **짓지 않는다** | 현 `scripts/build.js` 단일 빌더 유지. CSS·JS는 vanilla 그대로. |
| JS 컴포넌트 시스템 | **짓지 않는다** | `js/data-loader.js`·`js/nav.js`·`js/sequence-panel.js` 패턴(함수 모듈) 그대로 확장. |
| **신규 시각회귀 툴체인** | **부분만 짓는다** | Playwright는 이미 architecture 렌더링에 사용중(arki_memory). 같은 도구로 viewport 매트릭스 스냅샷만 추가. Percy/Chromatic 등 외부 SaaS 도입은 기각. |

핵심 원칙: **새 추상화 0개 추가**. 기존 정적 viewer 골격 위에 (a) IA 재배치 (b) CSS 토큰화 (c) 컨테이너 쿼리 (d) Playwright 스냅샷 4가지만 얹는다.

---

## 2. 프로토콜 호환성 — 기존 시스템과의 충돌 지점

### 2-1. 현 viewer 페이지 인벤토리

| 파일 | 라인 | 역할 | 상태 | 통합 후 운명 |
|---|---|---|---|---|
| `app/index.html` | 205 | Home — 역할 카드 + Charter 요약 | active | **Home**으로 유지, 통합 nav·반응형 적용 |
| `app/dashboard-upgrade.html` | 943 | 업그레이드 메인 대시보드 (KPI·차트) | active, primary | **Dashboard-Upgrade**로 유지, 헤더 nav 합류 |
| `app/dashboard-ops.html` | 329 | 운영 메트릭 보드 | active | 유지, nav 합류 |
| `app/decisions.html` | 121 | 결정 리스트 + 상세 | active | 유지 |
| `app/session.html` | 367 | 세션 인덱스 + 타임라인 | active | 유지, sequence-panel 반응형 손봄 |
| `app/topic.html` | 181 | 토픽 인덱스 + 상태 | active | 유지, 부모-자식 트리 추가 여부는 이 토픽 scope **밖**(Ace Tier1 #2와 별개) |
| `app/feedback.html` | 86 | Master 피드백 로그 | active | 유지 |
| `app/signature.html` | 269 | role signature card | active, **PD-042 통합 대상** | **main nav에 합류**, `role-signature-card.html`은 partial로 흡수 |
| `app/role-signature-card.html` | 81 | signature partial | partial | signature.html에 흡수 또는 Home 카드 컴포넌트로 재사용 |
| `app/dashboard-v3-test.html` | 1004 | 테스트 변종 | **legacy** | **삭제 또는 `legacy/` 이동** |
| `app/dashboard-v3b-test.html` | 820 | 테스트 변종 | **legacy** | **삭제 또는 `legacy/` 이동** |
| `app/dashboard-v3c-test.html` | 775 | 테스트 변종 | **legacy** | **삭제 또는 `legacy/` 이동** |
| `app/dashboard-v3d-test.html` | 576 | 테스트 변종 | **legacy** | **삭제 또는 `legacy/` 이동** |
| (신규) `app/growth.html` | — | D-060 Growth Board (안 β) | **신설 대상** | 본 토픽 안에서 신설 |

**구조 결함 #1 (str_fd)**: v3/v3b/v3c/v3d 테스트 변종 4개(총 3175라인)가 production app에 잔류. 이 토픽 안에서 정리 결정 필요.

**구조 결함 #2 (str_fd)**: `index.html` 사이드바 nav가 페이지마다 손으로 복제되어 있을 가능성(20행 hardcoded list 발견). 단일 source `app/js/nav.js`로 강제 통일하지 않으면 nav 통합(PD-042) 후 재발.

### 2-2. 데이터 흐름 정합성

```
file-based JSON  ──→ scripts/compute-dashboard.ts ──→ memory/shared/dashboard_data.json ──→ js/data-loader.js ──→ HTML pages
```

| 데이터 원천 | 소비자 | 변경 영향 |
|---|---|---|
| `memory/shared/dashboard_data.json` | 모든 dashboard 페이지 | 본 토픽에서 schema 변경 0건 — IA만 재배치 |
| `memory/shared/topic_index.json` | topic.html, session.html | 변경 없음 |
| `memory/shared/decision_ledger.json` | decisions.html | 변경 없음 |
| `memory/roles/*_memory.json` + `signal_registry.json` | signature.html, growth.html(신규) | growth.html 신설 시 `derived_metrics.json`/`composite_inputs.json`/`metrics_registry.json` 소비 추가 |

**프로토콜 호환성 결론**: 데이터 스키마는 건드리지 않는다. 본 토픽은 **rendering layer 전용**. 단 growth.html 신설은 D-060 시 정의된 metrics_registry를 새로 소비할 뿐이고, 데이터 계약은 이미 D-060에서 동결됨.

### 2-3. 충돌 지점 매핑

| 충돌 | 발생 위치 | 해소 |
|---|---|---|
| nav 중복 정의 | 각 HTML 파일에 sidebar block 복제 | nav.js로 단일화 강제. HTML은 `<aside id="nav-mount">`만 둠 |
| ECharts 고정픽셀 vs 컨테이너 fluid | dashboard-upgrade·ops·v3 변종 | ECharts `responsive: true` + `resize` observer 패턴 일괄 적용 |
| 인라인 `<style>` 페이지마다 산재 | index.html 등 | CSS 변수 토큰만 `style.css`로 추출, 페이지별 인라인은 한 라운드로는 제거 못함(범위 외) |
| signature.html 독립 nav | 별도 진입점 | main nav 합류 후 신규 카테고리 추가 |
| v3 테스트 페이지 dist 포함 여부 | build.js | legacy 이동 시 build 산출물에서 제외 확인 |

---

## 3. 설계 옵션 — 최대 3안

옵션은 **IA 그래프 × 반응형 토큰 axes × 시각회귀 위치 × signature 통합 지점** 4축의 조합. 옵션 간 차이는 주로 (a) Growth Board의 위계 (b) 토큰 정의 시점 (c) 시각회귀 게이트 위치.

### Option A — "Flat-IA + Token-Early + VR-Gate-G3" (권고)

**IA 그래프**:

```
                         ┌─────────────────────┐
                         │  Top Nav (단일 source)│
                         └─────────────────────┘
                                   │
       ┌──────────┬─────────────┬──┴──────┬──────────┬───────────┐
       │          │             │         │          │           │
    Home      Dashboard      Growth    Records    People      System
   (index)   ├─Upgrade      (growth)  ├─Topics   ├─Signature  ├─Feedback
             ├─Ops                    ├─Sessions │            │
             │                        ├─Decisions│            │
                                                              
   진입점: Home → 6개 카테고리 / 각 카테고리는 1~3 페이지 평면 배치
```

**반응형 토큰 axes** (Vera 몫 — Arki는 *어떤 토큰이 필요한지*만 명시):
- `--bp-sm`, `--bp-md`, `--bp-lg`, `--bp-xl` (breakpoint 4단)
- `--space-1`~`--space-8` (spacing scale)
- `--radius-sm/md/lg` (radius)
- `--font-size-{xs,sm,base,lg,xl,2xl,3xl}` (type scale)
- `--container-{sm,md,lg,xl}` (container max-width)
- `--grid-cols-{2,3,4,12}` (grid template helpers)
- 색상은 기존 `style.css` `:root` 변수 유지, Vera가 정합 검증

**시각회귀 위치**: G3 검증 게이트(반응형 적용 직후, signature 통합 직전). Playwright로 viewport 4단(360/768/1024/1440) × 페이지 9개 = 36 스냅샷.

**signature 통합 지점**: People 카테고리 신설하여 합류. `role-signature-card.html` partial은 Home 위젯 재사용.

- 장: IA 깊이 ≤2, 데이터 원천이 분리된 6 카테고리 매핑이 명확. 토큰 일찍 박아 반응형·신규 페이지(Growth)가 같은 토큰 사용. VR 게이트 G3 위치가 회귀 발견 즉시 차단 가능.
- 단: 6 카테고리가 중장기에 확장(예: Vera Design System 메뉴) 시 평면이 비대해질 수 있음.

### Option B — "Hub-IA + Token-Late + VR-Gate-G5"

**IA 그래프**:

```
                        Home (Hub: 오늘의 상태 + Alarm)
                                   │
              ┌────────┬───────────┼───────────┬────────┐
           Dashboard  Growth    Records      People   System
           (탭 묶음)  (탭 묶음) (탭 묶음)
              │          │          │
           Upgrade/Ops  안β      Topics/Sessions/Decisions
```

- 토큰 정의는 Phase 마지막(VR 직전)으로 미룸. 페이지별 인라인 스타일 우선 정착 후 추출.
- VR 게이트는 G5(Edi 직전 최종) 1회.
- 장: Home이 진짜 hub로 강해짐. Master 첫 진입 후 1클릭에 도달.
- 단: 토큰 늦게 박으면 페이지마다 다른 magic number 정착 → 추출 비용 ↑. VR이 마지막에 1회면 회귀 발견 시 되돌릴 거리가 멀다(롤백 비용 ↑). **권고 안 함.**

### Option C — "Layered-IA + Token-Centralized + VR-Continuous"

**IA 그래프**:

```
   Home ─→ Layer 1: 9 페이지 평면 (현 구조 그대로 + Growth + Signature 합류)
            └─ Layer 2: 페이지 내부에서 탭/세션 분할 자유
```

- Phase 0에서 토큰을 단독 산출물(`app/css/tokens.css`)로 분리.
- VR을 매 Phase 끝(G1·G2·G3·G4)마다 적용해 회귀 발견 즉시 차단.
- 장: 토큰 변경이 1파일로 격리. VR이 모든 게이트에 연결되어 회귀 0 보장.
- 단: VR 4번 돌리는 비용. 9 페이지 × 4 viewport × 4 라운드 = 144 스냅샷 비교. 실측 회귀 비율 낮을 가능성 — 과투자 의심.

### 옵션 비교 표

| 항목 | A (권고) | B | C |
|---|---|---|---|
| IA 깊이 | 2 (평면) | 2 (hub+탭) | 1 (평면) |
| 토큰 정의 시점 | Phase 1 (early) | Phase 5 (late) | Phase 0 (centralized) |
| VR 게이트 | G3 1회 | G5 1회 | G1·G2·G3·G4 4회 |
| 신규 코드량 | 중 | 중 | 중-고 |
| 회귀 차단 위치 | 적용 직후 | 출구 | 매단계 |
| 롤백 거리 | 짧음 | 김 | 0~짧음 |
| 운영 비용 | 낮음 | 낮음 | 중-높음 |
| Hickey 점수 | 높음 (적게 짓고 한 번 차단) | 중 (Home 비대) | 중 (검증 인플레) |

**권고: Option A.** Hickey 원칙(짓지 않음·복원 포인트 보존)에 가장 정렬. 토큰 일찍 박아서 후속 페이지(Growth) 일관성 확보. VR 1회 게이트로 회귀 비용·검증 비용 균형.

---

## 4. 경계 조건 — 설계가 깨지는 조건

### 4-1. Hard breakers (즉시 설계 무효)
- **B1.** Cloudflare Pages 정적 정책 변경 → SSR/edge function 도입 요구. 본 설계는 정적만 가정.
- **B2.** D-003 read-only 폐기 + form 도입 결정 → IA가 input flow를 포함해야 함. 본 설계는 read interaction만 다룸.
- **B3.** D-060 Growth Board(안 β) 데이터 계약 변경 → metrics_registry 스키마 변경 시 growth.html 재설계 필요.

### 4-2. Soft breakers (Phase 단위 재설계 트리거)
- **S1.** 페이지 수 9 → 14+ 증가 (예: Vera Design System 메뉴, Cost Report 별도 등). Top Nav 재구성 필요.
- **S2.** ECharts → 다른 차트 lib 교체 결정. responsive 패턴 재작성.
- **S3.** Cloudflare Access 추가 인증 게이트 변경. 진입점 IA 영향.
- **S4.** Vera 토큰 axes가 Phase 1 합의 후 Phase 3에서 재정의됨. 토큰 사용처 일괄 갱신 필요.

### 4-3. Drift 신호 (모니터링 대상)
- 페이지마다 인라인 `<style>` 추가량 증가 → 토큰 우회 진행
- nav.js 외 sidebar block hardcode 발견 → 단일 source 위반
- VR 스냅샷 baseline 1개월 이상 미갱신 → false negative 누적
- legacy v3 변종 4개가 다시 active로 회귀

---

## 5. 실행계획 (executionPlanMode = plan)

본 토픽은 **framing→구현 한 토픽 종결**(Master 명시, feedback_no_premature_topic_split). Phase 0~5로 분해. Vera 토큰 정의는 Phase 1, signature 통합은 Phase 4, VR 인프라는 Phase 2 박고 Phase 3 게이트로 작동.

### 5-1. Phase 분해

#### Phase 0 — 인벤토리 동결 + Spec Lock
**산출물**:
- `topics/topic_082/inventory.json` — 9 페이지 + legacy 4 페이지 인벤토리, 각 페이지의 데이터 원천·nav 위치·반응형 상태(현재) 박제
- `topics/topic_082/legacy-decision.md` — v3/v3b/v3c/v3d 4 변종 처리 결정(삭제/이동) Master 합의
- `topics/topic_082/ia-spec.md` — Option A IA 그래프 spec 동결 (frontmatter `status: locked-for-dev`)
- `topics/topic_082/token-axes-spec.md` — Vera에 인계할 토큰 축 정의(값은 빈 슬롯, Vera 채움)

**구조**: 인벤토리 우선 → 결함 #1·#2 노출 → spec 동결 후 Dev/Vera 인계

#### Phase 1 — Token 정의 + nav 단일화
**산출물**:
- `app/css/tokens.css` (신규) — Vera가 채운 값으로 CSS 변수 박제
- `app/js/nav.js` 확장 — 모든 페이지 sidebar 단일 source로 강제, signature·growth 메뉴 슬롯 추가
- 각 HTML 파일에서 sidebar block을 `<aside id="nav-mount"></aside>`로 치환

**의존**: Phase 0 spec 동결 → Vera 토큰 값 채움 → Dev nav 단일화

#### Phase 2 — 반응형 적용 + 시각회귀 인프라 박음
**산출물**:
- 9 페이지 컨테이너 fluid + 컨테이너 쿼리 적용
- ECharts wrapper 함수: viewport resize observer + chart.resize() 호출
- `tests/visual/` 디렉토리 신설 — Playwright 스크립트 (viewport 매트릭스 360/768/1024/1440)
- `tests/visual/baseline/` — 첫 스냅샷 baseline

**의존**: Phase 1 토큰·nav 완료 → 반응형 적용 → VR 인프라 박제(작동 검증)

#### Phase 3 — 시각회귀 G3 게이트 + 페이지 통합 검증
**검증 게이트 G3**:
- 모든 페이지 × 4 viewport에서 가로 스크롤 0, 텍스트 잘림 0
- VR 스냅샷 diff = baseline (변경 의도 외)
- nav 단일 source 100%

**의존**: Phase 2 산출물 → G3 통과 → Phase 4 진입 허가

#### Phase 4 — Growth Board 신설 + signature 통합
**산출물**:
- `app/growth.html` — D-060 안 β 구현. 공통 3층(학습누적/적중률/자율성) + 역할별 signature panel + Registry/Rubric versioning view
- `app/signature.html` main nav 합류, `role-signature-card.html`을 People 카테고리 위젯으로 재사용
- PD-042 closure 박제

**의존**: Phase 3 G3 통과 → Phase 1 토큰 사용 → D-060 metrics_registry 데이터 소비

#### Phase 5 — 최종 검증 + Edi 인계
**검증 게이트 G5 (모든 통과 필수)**:
- VR 재실행: 신규 growth.html + 통합 signature.html 포함 매트릭스 회귀 0
- IA 평면 카운트 ≤2 (Option A 준수)
- legacy v3 변종 dist 포함 0
- Cloudflare Pages 빌드 성공

**산출물**: Edi가 release notes·published 마킹·dashboard build 트리거

### 5-2. 의존 그래프 (ASCII)

```
                     [Phase 0: Inventory + Spec Lock]
                                   │
                  ┌────────────────┴────────────────┐
                  │                                  │
            (Vera: 토큰 값)                  (Master: legacy 결정)
                  │                                  │
                  └────────────────┬────────────────┘
                                   ▼
            [Phase 1: tokens.css + nav.js 단일화]
                                   │
                                   ▼
            [Phase 2: 반응형 적용 + VR 인프라 박음]
                                   │
                                   ▼
                       ┌─────[ G3 ]─────┐
                       │   PASS         │ FAIL → Phase 2 회귀
                       ▼                │
            [Phase 4: growth.html      │
              + signature 통합]         │
                       │                │
                       ▼                │
                       └────[ G5 ]──────┘
                              │
                       PASS   │   FAIL → Phase 4·2 회귀
                              ▼
                    [Phase 5: Edi 인계]
```

(Phase 3 = G3 게이트 단독, Phase 2와 Phase 4 사이의 검증 노드)

### 5-3. 검증 게이트

| 게이트 | 위치 | 통과 기준 |
|---|---|---|
| **G0** | Phase 0 끝 | inventory.json 동결, legacy 결정 Master 승인, ia-spec frontmatter `locked-for-dev`, token-axes-spec Vera 인계 완료 |
| **G1** | Phase 1 끝 | tokens.css 모든 토큰값 채워짐 (빈 슬롯 0), nav.js가 모든 페이지에서 단일 mount로 작동 (sidebar HTML 중복 0) |
| **G2** | Phase 2 끝 | VR 스크립트가 베이스라인 생성 성공, ECharts resize observer 9 페이지 작동 |
| **G3** | Phase 3 | 4 viewport × 9 페이지 = 36 스냅샷 — 가로 스크롤 0, 텍스트 잘림 0, diff = baseline 또는 의도된 변경만 |
| **G4** | Phase 4 끝 | growth.html이 D-060 metrics_registry 소비 성공, signature 통합 후 nav 단일 source 유지 |
| **G5** | Phase 5 끝 | VR 회귀 0, IA 평면 ≤2, legacy dist 포함 0, CF Pages 빌드 성공 |

### 5-4. 롤백 경로

| 실패 게이트 | 롤백 |
|---|---|
| G1 실패 (토큰 빈 슬롯) | Vera 재호출, Phase 1 보강 |
| G1 실패 (nav 중복 잔존) | nav.js 단일화 미완 페이지 식별 후 재적용 |
| G2 실패 (VR 작동 안 함) | Playwright 환경 격리 디버깅, 안되면 VR 인프라를 PD-034 별도 토픽으로 외화(본 토픽 scope 축소) |
| G3 실패 (회귀) | 원인 페이지 식별, Phase 2 컨테이너/토큰 사용처 수정. 회귀 ≥3 페이지면 Phase 1 토큰 axes 재논의 |
| G4 실패 (growth 데이터 계약 불일치) | D-060 metrics_registry 빌드 재확인. 본 토픽에서 스키마 변경 금지(범위 외) — 데이터 빌드 재실행만 허용 |
| G5 실패 (build/dist 오염) | legacy v3 변종 dist 제외 처리 재확인. 인덱스 페이지 빌드 산출물 검증 |

### 5-5. 중단 조건 (본 토픽 hold/abort 트리거)

- **HALT-1.** Phase 1에서 Vera 토큰 axes 합의가 1라운드 안에 동결되지 않음 → Vera 디자인 토픽으로 분기 권고(이번 토픽 hold). Master 결정 필요.
- **HALT-2.** Phase 2에서 VR 인프라가 Playwright 외 SaaS 의존 발생 (D-003 정적 정책 위반 가능성) → 인프라를 PD-034 별도 토픽으로 외화 후 본 토픽은 VR 없이 G3을 manual smoke test로 대체.
- **HALT-3.** D-060 metrics_registry 스키마 변경 필요 발견 → 본 토픽 scope 위반. growth.html 신설을 child 토픽으로 분기.
- **HALT-4.** legacy v3 변종 4개 처리에 Master 결정 보류 → Phase 0 진입 불가. legacy 결정만 미니 토픽으로 선분기.

### 5-6. spec 동결 (str_lck)

Phase 0 종료 시 다음 3 spec을 frontmatter `status: locked-for-dev`로 동결:
1. `topics/topic_082/ia-spec.md` (Option A IA 그래프)
2. `topics/topic_082/token-axes-spec.md` (토큰 축 정의 + Vera가 채운 값)
3. `topics/topic_082/inventory.json` (9 페이지 + legacy 처리 결정)

Phase 1 진입 후 spec 변경 발생 시: Arki 재호출 후 spec 갱신 → 영향 게이트 재통과. Dev가 spec drift를 발견하면 즉시 에스컬레이션.

### 5-7. 전제 조건 (각 Phase 진입 가드)

| Phase | 전제 |
|---|---|
| Phase 0 | Master 재호출 확정, topic_082 hold released (이미 충족) |
| Phase 1 | G0 통과, Vera 호출 가능, Dev 호출 가능 |
| Phase 2 | G1 통과, ECharts wrapper 패턴 합의 |
| Phase 3 | G2 통과, VR 베이스라인 존재 |
| Phase 4 | G3 통과, D-060 metrics_registry 빌드 산출물 정합 |
| Phase 5 | G4 통과, Edi 호출 가능 |

---

## 6. Dev 양방향 협의 포인트 (선제 표시)

다음 항목은 Dev가 구현 시 거부권 행사 가능. Arki는 구조만 제시하고 Dev 피드백 수용 후 재설계.

- **D-feedback-1**: ECharts resize observer 패턴 — Dev가 "차트별 init 함수 분리가 더 안전하다" 제안 시 수용.
- **D-feedback-2**: nav.js 단일화 시 페이지별 active state 처리 — JS attribute로 할지 data-attr 할지 Dev 선택.
- **D-feedback-3**: VR 인프라가 Playwright만으로 충분한가 — Dev가 추가 도구 필요 시 HALT-2 검토.
- **D-feedback-4**: growth.html이 외부 차트 라이브러리 추가 요구 시 → 본 토픽 scope 위반, 별도 토픽 분기.

---

## 7. 자기감사 (sa_rnd 라운드 1)

| 축 | 발견 | ROI |
|---|---|---|
| structuration | 결함 #1: legacy v3 변종 4개(3175라인) 잔존 처리 미정 | MUST_NOW |
| structuration | 결함 #2: nav.js 단일 source 미강제 — sidebar HTML 페이지마다 복제 | MUST_NOW |
| structuration | growth.html 데이터 계약은 D-060 산출물에 의존 — 본 토픽에서 절대 변경 금지 명시 | MUST_NOW |
| hardcoding | 페이지별 인라인 `<style>` 산재 — 본 토픽은 토큰만 추출, 인라인 제거는 후속(SHOULD) | SHOULD |
| hardcoding | role-colors.js 색 정의가 있는데 페이지마다 재정의 — Phase 1 토큰화 시 흡수 권고 | MUST_BY_N=10 |
| efficiency | VR 9 페이지 × 4 viewport = 36 스냅샷 — 매 Phase가 아니라 G3·G5 2회만 (Option A 채택 시) | (이미 적용) |
| efficiency | Playwright 외 SaaS 도입은 0 — 짓지 않음 원칙 | (이미 적용) |
| extensibility | Top Nav 6 카테고리 — 14+ 페이지 시 재구성 필요(S1) → token axes에 `--nav-overflow` 슬롯 예약 권고 | NICE |
| extensibility | growth.html 신설 시 Multi-scale·Regime marker view는 본 토픽 안에서 다 박지 말고 안 β 메인 1뷰만 — 확장은 child 토픽 | MUST_NOW |

**Round 1 발견 9건. 라운드 2는 Master/Ace 압박 시 수행. 자발적 라운드 종료 사유: scopeDriftCheck 위반 없음(원 spec 정의 1배 내), 모든 발견 Phase 분해에 흡수됨.**

**scopeDriftCheck 결과**: 본 발언이 Ace가 정의한 scope(IA·반응형·VR·signature 통합) 안에 머무는지 — 통과. 단 §5.1 Phase 4의 "growth.html 신설"은 Master 명시("본 토픽 안에서 framing→구현 끝까지")에 따른 흡수이며 D-060 데이터 계약 변경을 동반하지 않음을 §4.1 B3로 게이트화함.

---

## 8. 다음 역할 인계

- **Fin** — 본 실행계획 §5에 금지어(D+N일·N주차·MM/DD·담당자·N시간/N일/공수) 사용 여부 감사. Phase 분해와 검증 게이트만 있고 절대 시간·인력 배정·공수 단위 없음을 확인 요청.
- **Riki** — 4축 동시성 가정·HALT 조건·G3 single-gate 정책의 사각지대 검토 요청. 특히 "VR 인프라를 본 토픽 안에서 박는다"가 PD-034를 흡수했지만 회귀·롤백 비용 평가 검증 부탁.
- **Vera (Phase 1 진입 시)** — `token-axes-spec.md` 빈 슬롯 채워주십시오. Arki는 *어떤 토큰이 필요한지*만 정의했고 *값*은 Vera 몫.
- **Dev (Phase 1 진입 시)** — D-feedback-1~4 합의 후 spec 동결 트리거.

---

```yaml
# self-scores
aud_rcl: N
str_fd: 4
spc_lck: N
sa_rnd: 1
```

(주: `aud_rcl`은 Riki cross-review 후 deferred 채점. `spc_lck`은 Phase 0 종료 시 Y로 갱신 예정. 본 발언은 라운드 1.)
