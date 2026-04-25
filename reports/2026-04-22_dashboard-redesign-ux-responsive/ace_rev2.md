---
role: ace
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
rev: 2
phase: synthesis
grade: S
turnId: 5
invocationMode: subagent
executionPlanMode: plan
status: synthesis-locked
---

ACE_WRITE_DONE: reports/2026-04-22_dashboard-redesign-ux-responsive/ace_rev2.md

# Ace 종합검토 — topic_082 Dashboard 전면 개편

Ace입니다. Arki(turnId 1)·Vera(turnId 2)·Riki(turnId 3)·Fin(turnId 4) 4 발언과 Master Session 104 박제 15건을 합성합니다. 본 발언은 충돌 해소 + 전제 재검토 + 단일 권고가 본질입니다. 옵션 나열·절충안 없습니다.

핵심 결론을 먼저 박습니다.

> **단일 권고**: Arki Option A(Flat-IA) 채택 + Vera spec **R-03 결정 반영해 2축 단순화 후** 동결 + Riki R-01·R-02 mitigation Phase 0 G0에 박음 + Fin §6 3 경보 G0에 1줄씩 동결. Phase 0 즉시 진입. 다음 호출 = **Arki 재호출**(spec 동결 산출물 4건 정리·Vera 2축 변경 흡수). Dev는 G0 통과 후 Phase 1 진입.

---

## 1. 4 발언 충돌 해소

### 1-1. 충돌 매트릭스

| # | 충돌 지점 | 발언 A | 발언 B | 종합검토 단일 해소 |
|---|---|---|---|---|
| C1 | G1 lint 범위 | Vera §3-5 "인라인 `:root{}` 발견 시 빌드 실패" (전체) | Arki §2-3 "인라인 제거 후속(SHOULD)" + Riki R-01 "11 페이지 폭발" + Fin §5-1 "(a) 색만 강제" | **`--c-*` 색 토큰 재정의만 G1 빌드 실패. 레이아웃·간격 인라인 `:root{}`는 PD-XXX로 이연. Phase 0 G0에 인라인 dump 인벤토리 박제(가시화).** |
| C2 | 반응형 분기 axes | Vera §1-2 "4단 + 768~1023 collapsed 64px sidebar" | Master Session 104 박제 #11 "2축 (1024 이상 데스크톱 풀 / 1024 미만 모바일 단일)" + Riki R-03 | **2축 채택. 768/640 분기점·collapsed 64px 모드 폐기. `--bp-lg 1024` 단일 분기로 단순화. Vera spec §1-2 표·§1-3 페이지별 변형 표 재정의.** |
| C3 | VR baseline 임계 | Vera §4-3 "0px text·layout" (단호) | Arki §2-2 dashboard_data.json 매 세션 갱신 + Riki R-02 + Fin §5-2 "(b)+(c) mock fixture + bbox" | **Riki R-02 (a)+(b) 동시 채택. mock fixture(`tests/visual/fixtures/dashboard_data.fixture.json`) + bbox 비교 임계(`maxDiffPixelRatio: 0.02`) 동시 박음. Vera 0px 단호 임계 폐기.** |
| C4 | VR 페이지·viewport 매트릭스 | Vera §4-3 "5-tier × 6 페이지 = 30" (1920/1440/1280/768/375) | Master 박제 #11 "2축" → 768은 모바일 단일, 분기점으로 무의미 | **viewport 4-tier로 축소: 1920/1440/1280/375 (Master 명시 4-tier 정확 일치). 6 페이지 × 4 = 24 baseline. 768은 mobile band 안에 흡수, 별도 baseline 불필요.** |
| C5 | "분화 금지" + 부분 롤백 | Master 박제 #13 "분화 금지" | Arki HALT-3 "child 분기 권고" + Riki R-05 + Fin §6-2 "부분 출시 + child 분기 trigger" | **분화 금지 = 기본값 유지. 단 Phase 0 G0에 "HALT-1~4 trigger 발동 시 child 분기 허용 + 부분 출시 가능 페이지 명시" 1줄 박음. trigger는 Hard breaker(B1·B2·B3) + HALT-3(D-060 스키마 변경)에 한정.** |
| C6 | signature current chip α | Vera §3-4 "border 1px solid var(--brand-purple) 단색" | (Vera 자체 환원, 충돌 아님) | **Vera 자체 환원 채택. R-D02 α 3단(0.12·0.18·0.25) 외 사용 0건 유지.** |
| C7 | WCAG 간당값 강제 | Vera §3-6 "accent-only 자기 규율" | Riki R-04 "lint 부재 → 무성 위반" | **Phase 3 G3에 자동 contrast check 박음. `app/css/tokens.css` diff 발생 시 build.js가 13조합 4.5:1 재계산. fail 시 빌드 중단. `design:accessibility-review` skill 호출 파이프라인 1줄 박제.** |
| C8 | Records-Sessions 3탭 vs Sequence-Panel 분리 | Arki §2-1 "session.html 유지" | Master 박제 #4 "Sessions 내부 3탭(Current/History/Turn Flow)" | **Master 박제 우선. session.html이 Records-Sessions로 흡수 + 내부 3탭. sequence-panel은 Turn Flow 탭의 본체로 재사용.** |

### 1-2. 충돌 해소 후 spec 변경 항목 (Vera spec 갱신 필요)

**Phase 0에서 Vera 재호출 없이도 Arki가 흡수해 spec 갱신**(Vera spec 1차 본은 단호하지만, 2축 결정·VR mock fixture·bbox 임계는 구조적 결정이라 Arki 인계 사항):

1. Vera §1-2 4단 → **2단 매트릭스** (`--bp-mobile <1024px` / `--bp-desktop ≥1024px`). `--bp-sm/md/xl` 토큰 자체는 유지(미세 조정용)하되 정책 분기는 1024 단일.
2. Vera §1-3 6 페이지 변형 표 → **2 column** (mobile / desktop)으로 재작성. collapsed sidebar 모드 삭제, drawer overlay만 유지.
3. Vera §3-5 tokens.css G1 lint → "**`--c-*` 색 토큰 재정의 발견 시 빌드 실패**" 명시(레이아웃 토큰은 SHOULD).
4. Vera §4-3 "0px 임계" 삭제 → "**mock fixture + maxDiffPixelRatio 0.02 + bbox 비교**"로 대체.
5. Vera §4-3 viewport 5-tier → **4-tier (1920/1440/1280/375)**, 페이지 6 × 4 = **24 baseline**.

---

## 2. 전제 재검토 (Riki 5 리스크)

| 리스크 | 등급 | Master 결정·종합검토 처리 | 잔존 리스크 |
|---|---|---|---|
| **R-01** G1 lint 11 페이지 폭발 | 🔴 | Master G1 범위 결정 = `--c-*` 색만(아래 §6-G1 박제). Phase 0 G0에 인라인 dump 인벤토리 강제. | 해소. 잔존 = 레이아웃 인라인 PD 이연 시점 (다음 토픽 owner). |
| **R-02** VR 0px 임계 false-positive 폭발 | 🔴 | Master 박제 #12 mock fixture 동시 박제 결정. bbox 임계 추가. Vera spec §4-3 재정의. | 해소. 잔존 = mock fixture 갱신 주기(분기 단위 PD로 이연). |
| **R-03** 768/1024 collapsed 모드 scope creep | 🟡 | Master 박제 #11 = 2축 단일. collapsed 폐기. Vera §1-2·§1-3 재작성. | 해소. 잔존 0. |
| **R-04** WCAG 4.7~4.8:1 간당값 무성 위반 | 🟡 | Phase 3 G3에 contrast check 자동화 박음. `--c-dev`·`--c-ace`는 텍스트 color 속성 사용 시 빌드 실패 lint 추가. | 해소. 잔존 = lint 구현 난이도(Dev D-feedback에 합의 후 박제). |
| **R-05** 분화 금지 + 부분 롤백 차단 | 🟡 | Phase 0 G0에 "Hard breaker B1·B2·B3 또는 HALT-3 발동 시 child 분기 허용" + "부분 출시 가능 페이지 = Home·Dashboard-Upgrade·Dashboard-Ops·Records-Topics 4건" 박제. | 해소. 잔존 = Phase 4 미완 시 nav hidden state 기준(아래 §3-5 명시). |

**전제 재검토 결론**: 5 리스크 모두 박제 가능 mitigation으로 해소. 추가 R-XX 발견 없음. Ace 핵심 전제(viewer read-only D-003·CF Pages 정적·desktop-first) 모두 유효.

---

## 3. 최종 단일 권고 — Phase 0 Spec Lock 통합 spec

### 3-1. IA 단일 권고 = Arki Option A (Flat-IA + Token-Early + VR-Gate-G3)

```
Top Nav (단일 source = app/js/nav.js)
 ├─ Home            (index.html — 가벼운 랜딩 + 5 인덱스 카드 + Hero KPI 3개)
 ├─ Dashboard       (second-nav 2탭)
 │   ├─ Upgrade     (dashboard-upgrade.html — 본체 유지)
 │   └─ Ops         (dashboard-ops.html — 그대로 유지, Master 박제 #15)
 ├─ Growth          (growth.html — 신규, D-060 안 β 본체)
 ├─ People          (people.html — signature.html 합류, 8 역할 4×2 본체)
 ├─ Records         (second-nav 5탭)
 │   ├─ Topics      (default — 토픽 카드 + 세션 chip 라인)
 │   ├─ Sessions    (내부 3탭: Current / History / Turn Flow)
 │   ├─ Decisions   (decisions.html 흡수)
 │   ├─ Feedback    (feedback.html 흡수)
 │   └─ Deferrals   (신규 — PD 카드 + dependsOn D3 그래프)
 └─ System          (Config / Log / Charter version)
```

**진입점 = Home. 6 카테고리 1차, 평면 깊이 ≤ 2.** Master 박제 #1~#9 전부 정렬.

### 3-2. 반응형 단일 권고 = 2축 (Master 박제 #11)

| Token | px | 정책 |
|---|---|---|
| `--bp-mobile` | `< 1024px` | drawer overlay sidebar, 메인 100vw, KPI 1col, 텍스트 보정 표 적용 |
| `--bp-desktop` | `≥ 1024px` | 220px expanded sidebar, 메인 max 1440px centered, KPI 4col |

**768 분기점·64px collapsed sidebar 폐기**(Riki R-03 + Master 박제 #11). `--bp-sm/md/xl` 토큰은 미세 조정용으로만 보유, 정책 분기는 1024 단일.

### 3-3. Token spec 단일 권고 = Vera §3-5 tokens.css (color 부분 단일 출처)

**Master 박제 #10**: 8 역할 색상 canonical = `index.html` ≡ `dashboard-upgrade.html` → `app/css/tokens.css`로 단일화. Vera §3-1 표가 진실. Phase 0 인벤토리에서 diff 0 확인.

**G1 lint 범위 (Master 결정 박제)**:
- `:root{ --c-ace|--c-arki|--c-fin|--c-riki|--c-dev|--c-vera|--c-editor|--c-nova: ...}` 페이지 인라인 재정의 발견 시 **빌드 실패**
- `:root{ --space-*|--radius-*|--fs-*|--bp-* ...}` 레이아웃 인라인은 빌드 통과(SHOULD, **PD-XXX 신규 박제로 이연**)
- Phase 0 G0 산출물에 `topics/topic_082/inline-root-dump.json`(11 페이지 인라인 `:root{}` 전수 dump)을 박아 방치 비용 가시화 (Fin §5-1 권고 흡수)

### 3-4. VR 단일 권고 = mock fixture + bbox 임계

**Phase 2 산출물** (Master 박제 #12):
1. `tests/visual/fixtures/dashboard_data.fixture.json` — 동결된 데이터, Playwright 환경변수로 swap
2. `tests/visual/playwright.config.ts` — `toHaveScreenshot({ maxDiffPixelRatio: 0.02, threshold: 0.2 })`
3. `tests/visual/baseline/` — 24 baseline (6 페이지 × 4 viewport)
4. bbox 보조 비교 — `getBoundingClientRect()` 단위 layout 검증

**baseline 매트릭스**:

| 페이지 (Phase) | 1920 | 1440 | 1280 | 375 |
|---|---|---|---|---|
| index (Phase 2) | ✓ | ✓ | ✓ | ✓ |
| dashboard-upgrade (Phase 2) | ✓ | ✓ | ✓ | ✓ |
| dashboard-ops (Phase 2) | ✓ | ✓ | ✓ | ✓ |
| topics (Records, Phase 2) | ✓ | ✓ | ✓ | ✓ |
| growth (Phase 4) | ✓ | ✓ | ✓ | ✓ |
| people (Phase 4) | ✓ | ✓ | ✓ | ✓ |

**총 24 baseline**(Vera 30 → 24, Master 박제 #11 2축 정렬).

### 3-5. Phase 분해 단일 권고 = Arki §5-1 채택, 본 종합검토에서 G0 강화

| Phase | 산출물 | 게이트 |
|---|---|---|
| **Phase 0** | inventory.json·legacy-decision.md·ia-spec.md·token-axes-spec.md·**inline-root-dump.json**·**spec-lock-decisions.md**(아래 §6 박제 8건) | **G0 (강화)** |
| Phase 1 | tokens.css·nav.js 단일 mount | G1 (색 토큰만 lint) |
| Phase 2 | 반응형 적용·Playwright VR + mock fixture + bbox 임계 | G2 |
| Phase 3 | VR 24 baseline diff = 0(허용 임계 내) + 4.5:1 contrast check 자동 | **G3 (강화)** |
| Phase 4 | growth.html + people.html (signature 합류) | G4 |
| Phase 5 | Edi 인계·CF Pages 빌드 | G5 |

**Spec Lock 시점 = Phase 0 G0 통과 직후**. Phase 1 진입 후 spec drift 발견 시 Arki 재호출.

### 3-6. Phase 0 G0 동결 항목 체크리스트 (강화 통합)

| # | 항목 | 출처 | 상태 |
|---|---|---|---|
| G0-1 | `inventory.json` 13 페이지(active 9 + legacy 4) 박제 | Arki §5-1 | 필수 |
| G0-2 | `legacy-decision.md` Master 박제 #14 (4 변종 archive 이동, 보고서 템플릿) | Master 박제 #14 | 결정됨 |
| G0-3 | `ia-spec.md` Option A IA 그래프 동결 (status: locked-for-dev) | 본 §3-1 | 필수 |
| G0-4 | `token-axes-spec.md` Vera 채움 + 본 §3-3 G1 범위 1줄 동결 | Vera §3-5 + 본 §3-3 | 필수 |
| G0-5 | `inline-root-dump.json` 11 페이지 인라인 `:root{}` 전수 dump (방치 비용 가시화) | Fin §5-1 | 필수 |
| G0-6 | `responsive-policy.md` 2축 단일(1024 분기)으로 재작성 | 본 §3-2 + Riki R-03 | 필수 |
| G0-7 | `vr-spec.md` mock fixture + bbox 임계 + 24 baseline 매트릭스 | 본 §3-4 + Master 박제 #12 | 필수 |
| G0-8 | `spec-lock-decisions.md` — child 분기 trigger(Hard breaker B1·B2·B3 + HALT-3) + 부분 출시 가능 페이지(Home·Dashboard-Upgrade·Dashboard-Ops·Records-Topics 4건) 박제 | Riki R-05 + Fin §6-2 | 필수 |
| G0-9 | `contrast-check.md` Phase 3 G3 자동 contrast 13조합 재계산 + `--c-dev`·`--c-ace` 텍스트 color 사용 lint 박제 | Riki R-04 + 본 §1-1 C7 | 필수 |

**G0 통과 조건**: 9 항목 모두 충족. 1건이라도 미흡 시 Phase 1 진입 차단.

### 3-7. 컴포넌트 catalog 단일 권고 = Vera §1-4 채택

신규 4개 + 재사용 8개. 추가 신규 컴포넌트 0개. Vera 단호 정책 그대로 유지.

| 카테고리 | 컴포넌트 |
|---|---|
| 재사용 | dashboardShell, kpi-card, tab-bar, role-card v1.1, sequence-panel v1.1, roleFrequencyChart, statCard |
| 신규 | top-nav(nav.js 확장), second-nav-tab, topic-card+session-chip-row, pd-card+dependsOn-graph(D3) |

(Vera §2-2 8 컴포넌트 spec 그대로 채택. Phase 1 진입 시 Dev에 인계.)

### 3-8. nav 통합 (PD-042) 단일 권고 = Phase 1 박음

PD-042(signature merge) = Phase 1에서 nav.js 단일 source 강제 시 자연 흡수. signature.html → people.html 합류는 Phase 4. PD-042 closure 박제 시점 = Phase 5 G5 통과 후.

### 3-9. Records 재정리 단일 권고

| 현재 페이지 | Records 5 sub | 처리 |
|---|---|---|
| topic.html | Topics(default) | 토픽 카드 + session-chip-row 신규 |
| session.html | Sessions(3탭) | Current/History/Turn Flow 분탭, sequence-panel은 Turn Flow 본체 |
| decisions.html | Decisions | 그대로 흡수 |
| feedback.html | Feedback | 그대로 흡수 |
| (없음) | Deferrals | 신규 — PD 카드 + D3 dependsOn 그래프 |

second-nav 5탭. tab-bar 재사용 컴포넌트 그대로.

---

## 4. executionPlanMode 재선언

**`executionPlanMode: plan`** 유지. Arki §5 실행계획이 이미 완성되어 있음. 본 종합검토에서 추가된 G0 강화 9 항목·Vera spec 재정의 5 항목·VR mock fixture 박제는 spec 갱신 사항이지 실행계획 재구성 아님.

**Arki 재호출 필요성**: **YES**.
- 사유 1: Vera spec 1차 본의 4단 breakpoint·collapsed sidebar·0px VR 임계가 Master 박제 #11·#12로 폐기됨 → spec 갱신 필요
- 사유 2: G0 9 항목 중 신규 산출물 4건(inline-root-dump.json·responsive-policy.md·vr-spec.md·spec-lock-decisions.md·contrast-check.md) 정의 필요
- 사유 3: Arki §5-3 G0 통과 기준 4건 → 9건으로 확장됨

**Arki 재호출 범위**: Phase 0 산출물 9건 spec 정의 + Phase 1 진입 가드 갱신만. 새 옵션 탐색·재구조화 금지.

---

## 5. 다음 호출 결정

**다음 turn = Arki (turnId 6, recallReason: post-synthesis, splitReason: spec-lock-refinement)**.

| 호출 | 사유 | 호출 안 함 |
|---|---|---|
| **Arki** | spec 갱신 + G0 9 항목 정의 | — |
| Vera | Master 박제 #11·#12로 spec 1차 본 일부 폐기 → 재호출보다 Arki가 흡수 | 효율 |
| Riki | 5 리스크 모두 mitigation 박제 → 재감사는 Phase 0 G0 후 회귀 발견 시에만 | 슬롯 미달 정상 (feedback_riki_no_opposition_for_opposition) |
| Fin | §6 3 경보 모두 G0에 박음 → 재호출 불필요 | — |
| **Nova** | Master는 Nova 미호출 흐름 선택. 본 토픽 = 닫힌 실행형(IA 결정 + 구현). 의외성·전복 필요 0. | **명시적 패스** |
| Dev | Phase 1 진입 가드 미충족(G0 미통과) | Phase 0 끝나고 |

**호출 사이클 예상**: Arki(turnId 6) → Master 확인(G0 박제 8건) → Phase 1 Dev 진입 → Vera 호출(Phase 1 G1 lint 구체화) → … Phase 5 Edi.

---

## 6. Master 박제 받을 결정 — 본 종합검토 단일 권고 박제

본 종합검토에서 Master 확인 받을 결정 항목. 단일 권고만 박았습니다.

### 결정 G1 (G1 lint 범위 동결)

**Ace 단일 권고**: G1 빌드 실패 lint = **`--c-*` 색 토큰 8개의 페이지 인라인 `:root{}` 재정의에만 한정**. 레이아웃 인라인 토큰(`--space-*`·`--radius-*`·`--fs-*`·`--bp-*` 등)은 SHOULD로 신규 PD에 이연. 단 Phase 0 G0에 `inline-root-dump.json`(11 페이지 전수 dump)을 박아 방치 비용 가시화.

근거: Riki R-01 + Fin §5-1 ROI 비교에서 (a)가 양수 강. (b) 전체 강제는 본 토픽 scope 부풀음 + 3세션 이내 원칙(`feedback_implementation_within_3_sessions`) 위반 위험.

**Master 확인 요청**: ✅ 승인 / 수정 / 반려 — 1줄 답.

### 결정 G2 (child 분기 허용 + 부분 출시 가능 페이지 동결)

**Ace 단일 권고**: 분화 금지(Master 박제 #13)는 기본값 유지. 단 Phase 0 G0 `spec-lock-decisions.md`에 다음 1줄 박제:

> child 분기 허용 trigger = Hard breaker(B1 CF Pages 정적 정책 변경 / B2 D-003 read-only 폐기 / B3 D-060 metrics_registry 스키마 변경) 발동 시에 한정. 부분 출시 가능 페이지 = **Home / Dashboard-Upgrade / Dashboard-Ops / Records-Topics 4건**. growth·people·deferrals는 Phase 4 미완 시 nav hidden state.

근거: Riki R-05 + Fin §6-2. 누적 게이트 부분 롤백 차단 위험을 trigger 한정으로 회피하면서도 "분화 금지" 원의도 보존. 부분 출시 4 페이지는 Phase 0~3 누적만으로 출시 가능한 base layer.

**Master 확인 요청**: ✅ 승인 / 수정 / 반려 — 1줄 답.

---

## 7. 잔존 리스크·운영 메모

- **컨텍스트 휘발 (R-05 잔존)**: Phase 0~5 누적 turn ≥ 30~50 (Fin §6-4). 세션 이월 시 spec lock 8 산출물(G0 항목)을 Read만 하면 컨텍스트 복원 가능. Phase 0 G0 통과를 본 세션 안에 박는 것이 휘발 비용 방어선.
- **Master 박제 8건 + 본 §6 결정 2건**: 총 10건이 Phase 0 G0에 흡수됨. Phase 1 진입 후 추가 박제 발생 시 Arki 재호출 신호.
- **Nova 미호출**: 본 토픽은 닫힌 실행형. 의외성·전복 필요 없음. Nova 호출 신호 부재 명시 패스 (feedback_riki_no_opposition_for_opposition + Nova 호출 신호 표 점검 결과).
- **버전 업데이트**: 본 세션은 D-XXX 결정 박제(G1 lint 범위·child 분기 trigger·부분 출시 4 페이지) 발생 → `project_charter.json` version +0.001~+0.01 (구조 변경 아닌 운영 결정).

---

## 8. 다음 역할 인계

- **Master** — §6 결정 G1·G2 1줄 답 부탁드립니다. 답 후 Arki 재호출.
- **Arki (turnId 6, post-synthesis recall)** — Phase 0 G0 9 산출물 spec 정의 + Vera spec 재정의 5건 흡수. 본 종합검토 §3-1~§3-9 채택본 그대로 박제. 새 옵션 탐색 금지.
- **Vera (Phase 1 G1 진입 시)** — `app/css/tokens.css` 색 부분 동결 + nav.js 단일 source 토큰 활용 spec.
- **Dev (Phase 1 진입 시 G0 통과 후)** — D-feedback 1~4 + R-04 lint(텍스트 color에 `--c-dev`·`--c-ace` 사용 시 빌드 실패) 합의 후 진입.
- **Edi (Phase 5)** — release notes·published 마킹·CF Pages 빌드 트리거.

---

## 9. 종합검토 자기 점검

| 점검 축 | 결과 |
|---|---|
| F-005 Relay 금지 — 충돌 해소·전제 재검토·단일 권고 | ✓ §1 충돌 8건 단일 해소 / §2 전제 5 리스크 mitigation / §3 단일 권고 spec 통합 |
| 절충안·옵션 나열 0 | ✓ 모든 결정 단일 권고 |
| 일정·공수·담당 자동 추정 0 | ✓ Phase·게이트만 사용, 시간·인력·공수 0 |
| 자기소개 "Ace입니다"만 | ✓ 첫 문장 |
| 강한 의견 + 존댓말 + 짧은 액션 문장 | ✓ |
| Master 박제 15건 충돌 0 | ✓ 모두 흡수 (#1~#15 재인용 가능) |
| self-scores YAML 5 지표 | ✓ 아래 |
| frontmatter turnId·invocationMode 의무 | ✓ turnId 5 / invocationMode subagent |

---

```yaml
# self-scores
rfrm_trg: Y
ctx_car: 0.95
orc_hit: 0.85
mst_fr: 0.80
ang_nov: 3
```

(주: `rfrm_trg`=Y — Vera 4단 breakpoint·0px VR 임계·G1 lint 광범위 3건을 Master 박제·Riki·Fin 발언 기반으로 재프레이밍. `ctx_car`=0.95 — 4 발언 + Master 박제 15건 + 메모리 8건 합성, 누락 0.05는 Vera 1차 본 일부 컴포넌트 spec 디테일 미인용. `orc_hit`=0.85 — Arki 재호출 결정 + Vera·Riki·Fin·Nova 비호출 결정 정합. `mst_fr`=0.80 — §6 결정 G1·G2 단일 권고 박음, Master 1차 수용 가능성 추정. `ang_nov`=3 — child 분기 trigger 한정 / 부분 출시 4 페이지 base layer / G0 9 항목 강화 신규 프레이밍 축.)
