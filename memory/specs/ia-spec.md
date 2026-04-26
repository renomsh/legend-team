---
status: canonical
since: 2026-04-26 (D-100 by topic_110)
spec_version: 1.0
derived_from: null
---

---
role: arki
topic: Dashboard 개편 — 인터페이스 UX + 반응형 프레임 (전면 IA 개편)
topicId: topic_082
session: session_104
date: 2026-04-25
artifact: G0-3 ia-spec
turnId: 10
invocationMode: subagent
recallReason: phase-0-execution
status: locked-for-dev
sources:
  - reports/2026-04-22_dashboard-redesign-ux-responsive/ace_rev3.md §1-2 / §3-1
  - reports/2026-04-22_dashboard-redesign-ux-responsive/arki_rev2.md §1-3 / §1-8 / §3
  - reports/2026-04-22_dashboard-redesign-ux-responsive/vera_rev2.md §7
  - reports/2026-04-22_dashboard-redesign-ux-responsive/inventory.md §3
  - Master 박제 #1·#2·#3·#4·#5·#6·#13·#14·#15
---

# G0-3 IA Spec — topic_082 Dashboard 개편 정보 구조

Arki입니다. 본 문서는 Phase 0 G0-3 산출물. 사이드바 6 메뉴 + Records 5 sub + Dashboard 2 sub + Sessions 내부 3탭 + 4 entity 상호 링크 + 부분 출시 게이트 B1·B2·B3을 단일 spec으로 동결합니다. 평면 깊이 ≤ 2 보장.

---

## 1. 사이드바 트리 (canonical)

```
Top Nav (단일 source = app/js/nav.js + app/partials/sidebar.html)
│
├─ Home                        → /index.html
│                                (Hero KPI 3 + 5 인덱스 카드 + Recent band)
│
├─ Dashboard       (second-nav 2탭)
│   ├─ Upgrade                 → /dashboard-upgrade.html         [default]
│   │                           (canonical reference, D-090)
│   └─ Ops                     → /dashboard-ops.html
│                               (본체 그대로 유지, D-087·Master#15)
│
├─ Growth                      → /growth.html             [Phase 4 신설]
│                                (D-060 안 β + 3축 헤더 + 4×2 panel)
│
├─ People                      → /people.html            [Phase 4 신설]
│                                (signature.html 합류, 4×2 grid)
│
├─ Records         (second-nav 5탭)
│   ├─ Topics                  → /topic.html                     [default]
│   │                           (topic-card + session-chip-row)
│   ├─ Sessions                → /session.html
│   │                           (내부 3탭: Current / History / Turn Flow)
│   ├─ Decisions               → /decisions.html
│   ├─ Feedback                → /feedback.html
│   └─ Deferrals               → /deferrals.html         [Phase 4 신설]
│                               (PD 카드 + D3 dependsOn 그래프)
│
└─ System                      → /system.html            [Phase 4 신설]
                                 (Config / Log / Charter version)
```

**평면 깊이 = 2** (Top Nav 1차 6개 / Dashboard·Records 2차 7개). Sessions 내부 3탭은 페이지 내부 탭으로 깊이에 포함하지 않음 (페이지 내 routing).

---

## 2. 메뉴 항목별 라우팅·active 표시

### 2-1. 라우팅 단일 표

| 사이드바 항목 | URL | hash/query | active 표시 규칙 |
|---|---|---|---|
| Home | `/index.html` | — | path === `/index.html` 또는 `/` |
| Dashboard / Upgrade | `/dashboard-upgrade.html` | — | path === `/dashboard-upgrade.html` |
| Dashboard / Ops | `/dashboard-ops.html` | — | path === `/dashboard-ops.html` |
| Growth | `/growth.html` | — | path === `/growth.html` |
| People | `/people.html` | — | path === `/people.html` |
| Records / Topics | `/topic.html` | (선택) `?status=active`·`?grade=A` 등 filter | path === `/topic.html` |
| Records / Sessions | `/session.html` | `#tab=current` (default) / `#tab=history` / `#tab=turnflow` | path === `/session.html`. 내부 탭은 hash 변경만으로 전환, active state는 nav.js가 직접 관여 안 함 (페이지 내부 탭 컴포넌트 책임) |
| Records / Decisions | `/decisions.html` | (선택) `?id=D-087` 딥링크 | path === `/decisions.html` |
| Records / Feedback | `/feedback.html` | (선택) `?id=F-013` 딥링크 | path === `/feedback.html` |
| Records / Deferrals | `/deferrals.html` | (선택) `?id=PD-046` 딥링크 | path === `/deferrals.html` |
| System | `/system.html` | (선택) `#section=log` 등 | path === `/system.html` |

### 2-2. active 표시 메커니즘 (D-feedback-2 정합)

- nav.js 단일 source가 페이지 진입 시 `window.location.pathname`을 읽어 해당 nav-item에 `data-active="true"` 마킹
- CSS 셀렉터: `[data-active="true"]` (class swap보다 specificity 안정)
- second-nav 활성 카테고리(Dashboard / Records)는 부모 항목도 `data-parent-active="true"` 마킹 → expand 또는 highlight
- desktop(≥1024): second-nav는 페이지 상단 second-nav-tab 컴포넌트로 노출 (사이드바 expand가 아닌 페이지 내부 탭 형태). 사유: 사이드바 평면 깊이 ≤ 1 유지, 모바일 동일 패턴
- mobile(<1024): off-canvas drawer 안에서 second-nav도 동일 second-nav-tab 컴포넌트가 페이지 상단에 노출

### 2-3. second-nav 위치 결정 (Vera rev1·rev2 §7-2 정합)

> **second-nav는 사이드바 expand가 아닌 페이지 상단 탭으로 통일**.

| 옵션 | 처리 | 판정 |
|---|---|---|
| (A) 사이드바 expand sub-list | mobile drawer 내부에서 expand 시 nav 길이 폭증 | reject |
| (B) **페이지 내부 second-nav-tab** | 데스크톱·모바일 동일 패턴, 사이드바 평면 유지 | **채택** |

채택 사유: 모바일 drawer 안 nested expand는 가로 폭 280px 안에서 nav-item 들여쓰기 + 6 카테고리 expand 시 스크롤 필요 → 평면 nav 일관성 깨짐. second-nav를 페이지 안 탭으로 분리하면 사이드바는 6 항목 평면 유지, second-nav는 페이지 본문 진입 직후 sticky 탭으로 노출.

---

## 3. Sessions 내부 3탭 라우팅 (Master #4)

| 탭 | URL hash | 컨텐츠 | 컴포넌트 |
|---|---|---|---|
| Current | `#tab=current` (default) | 진행 중 세션 (status=active) + 최근 turns 타임라인 | sequence-panel v1.1 (재사용) |
| History | `#tab=history` | 과거 세션 인덱스 (status=closed) + 검색·필터 | session-list (재사용) |
| Turn Flow | `#tab=turnflow` | 최근 N 세션의 turn 흐름 D3 시각화 | turn-flow-chart (Phase 4 신규 또는 sequence-panel 확장) |

탭 전환 = hash 변경만으로 처리 (페이지 reload 0). session.html이 hash change listener 등록 → 탭 컴포넌트 toggle. 딥링크 가능: `/session.html#tab=turnflow&sessionId=session_104`.

---

## 4. 4 Entity 상호 링크 매트릭스

Topic / Session / Decision / PD 4 entity 간 상호 점프 정의. **읽기 전용 viewer (D-003)** 정합 — 모든 링크는 read-only 네비게이션.

### 4-1. 점프 매트릭스

| FROM \ TO | Topic | Session | Decision | PD (Deferral) |
|---|---|---|---|---|
| **Topic 카드** (topic.html) | (자기 자신) | session-chip-row → `/session.html?sessionId=<id>` | decision row → `/decisions.html?id=<D-xxx>` | (선택) PD-link badge → `/deferrals.html?id=<PD-xxx>` |
| **Session 카드** (session.html Current·History) | topicId chip → `/topic.html?id=<topic_xxx>` | (자기 자신) | session 내부 결정 chip → `/decisions.html?id=<D-xxx>` | session 내부 PD 신설 chip → `/deferrals.html?id=<PD-xxx>` |
| **Decision** (decisions.html) | topicId 링크 → `/topic.html?id=<topic_xxx>` | sessionId 링크 → `/session.html?sessionId=<id>` | (자기 자신) related PDs → `/deferrals.html?id=<PD-xxx>` | resolveCondition target PD → `/deferrals.html?id=<PD-xxx>` |
| **PD** (deferrals.html) | parentTopicId → `/topic.html?id=<topic_xxx>` | sourceSessionId → `/session.html?sessionId=<id>` | resolved-by D-xxx → `/decisions.html?id=<D-xxx>` | dependsOn 그래프 노드 클릭 → `/deferrals.html?id=<PD-xxx>` |
| **Home** (index.html Recent band) | recent topic 카드 → topic.html | recent session 카드 → session.html | recent decision 카드 → decisions.html | recent PD 카드 → deferrals.html |

### 4-2. 링크 일관 규칙

- 모든 entity 딥링크는 query string `?id=<id>` 또는 `?<entityKey>=<id>` 사용 (hash는 페이지 내부 상태에만)
- 링크 click 시 `target="_self"` (새 창 0)
- 링크 hover style은 vera_rev2 §3-4 nav-item active α 0.18 + 1px solid border 정합
- 모든 entity 페이지가 query 진입 시 자동 스크롤 + 카드 highlight 1.5초 (Phase 4 진입 시 spec)

---

## 5. Home 페이지 5 인덱스 카드 진입점

Vera rev2 §7-1 wireframe 정합. Home은 Hero KPI 3 + 5 인덱스 카드 + Recent band 3-section.

### 5-1. 5 인덱스 카드 정의

| # | 카드 | 진입 경로 | 카드 내용 (요약) |
|---|---|---|---|
| H1 | Dashboard | `/dashboard-upgrade.html` (default Upgrade) | 최신 KPI 1줄 + "Upgrade·Ops" 표시 |
| H2 | Growth | `/growth.html` | 이번 분기 성장 지표 1줄 (Phase 4 미완 시 disabled tooltip) |
| H3 | People | `/people.html` | 8 역할 활성도 1줄 (Phase 4 미완 시 disabled) |
| H4 | Records | `/topic.html` (default Topics) | 활성 토픽 수 + 최근 결정 수 |
| H5 | System | `/system.html` (Phase 4 미완 시 `data-state="pending"`) | Charter version + 최근 log 1줄 |

**5번째 카드 grid 처리** (desktop ≥1024): 3-column grid에서 5번째 카드는 `grid-column: 1 / span 2` 또는 마지막 row 1col만. Vera 결정 영역.

### 5-2. Hero KPI 3 (Vera rev2 §7-1 정합)

```
● running (현재 세션 상태 dot)
[104 sessions]   [87 topics]   [92 decisions]
```

3 KPI 모두 read-only 표시. 클릭 시 각 카테고리 카드(H4·H4·H4)로 점프 (Records 페이지). 최신 값은 `dashboard_data.json` 또는 `system_state.json`에서 read.

### 5-3. Recent band

| 영역 | 컨텐츠 | 진입 |
|---|---|---|
| Recent Topics (좌) | 최근 5 topic chip-row | chip 클릭 → `/topic.html?id=<id>` |
| Recent Decisions (우, desktop only) | 최근 5 decision 카드 | 카드 클릭 → `/decisions.html?id=<D-xxx>` |

mobile (<1024): Topics·Decisions 세로 stack. Recent PDs는 본 토픽 scope 외 (Records/Deferrals 페이지 직접 접근).

---

## 6. 부분 출시 4 페이지 출시 게이트

ace rev3 §1-2 + arki rev2 §1-8 정합. Phase 0~3 누적만으로 출시 가능 base layer 4건.

### 6-1. 출시 게이트 표

| 페이지 | 출시 게이트 (모두 통과 필수) | 통과 시 active 시점 |
|---|---|---|
| **Home** (index.html 재구성) | G1(tokens.css 신설·nav 단일·partial sidebar) + G2(반응형 1024 적용·VR 인프라) + G3(VR diff PASS·contrast 13조합 PASS·accent-only PASS·가로 스크롤 0·텍스트 잘림 0) | Phase 3 G3 통과 직후 |
| **Dashboard / Upgrade** (canonical 본체 무회귀) | G1 + G2 + G3 + dashboard-upgrade 본체 회귀 0 (rev2 §G3 정합) | 동일 |
| **Dashboard / Ops** (그대로 유지) | G1 (sidebar partial 치환만) + G2 + G3 + ops 페이지 그대로 검증 | 동일 |
| **Records / Topics** (topic-card·session-chip-row 신규 컴포넌트) | G1 + G2 + G3 + 신규 컴포넌트 회귀 0 (Phase 2 baseline은 신규 컴포넌트 적용 후 박제) | 동일 |

### 6-2. Phase 4 미완 시 hidden state 페이지 (2건)

Deferrals / System. nav.js가 `data-state="pending"` 마킹 + click disable + tooltip "Phase 4 진행 중" + `aria-disabled="true"` + `tabindex="-1"` (Dev D-feedback-8 a11y 보강 흡수). 사이드바에는 표시되지만 click 0.

※ People은 topic_112 Phase 2(session_109)에서 signature.html 흡수로 active 승격됨.
※ Growth는 topic_112 Phase 3(session_109)에서 D-060 안 β(3축 헤더 + 4×2 panel) 신설로 active 승격됨.

### 6-3. Records 5 sub 부분 출시 처리

- Records / Topics는 부분 출시 1차 (Phase 3 통과 후)
- Records / Sessions·Decisions·Feedback는 기존 페이지(session.html·decisions.html·feedback.html)가 G1 G2 G3 통과만 하면 자동 active. 단 second-nav-tab 컴포넌트 적용 필요 → Phase 1 G1에서 처리
- Records / Deferrals는 신설이므로 Phase 4 미완 시 hidden state

따라서 **Phase 3 통과 시점에 active 페이지 = Home + Dashboard×2 + People + Records 4(Topics·Sessions·Decisions·Feedback) = 8건** (People은 topic_112 Phase 2에서 활성화). Phase 4 통과 시점에 3건 추가(Growth·Deferrals·System).

---

## 7. Hard Breaker B1·B2·B3 정의 (재확인)

arki rev2 §3 + ace rev3 §1-2 lock 정합. 본 산출물에서 명시 박제.

| Hard breaker | 정의 | 발동 조건 | 발동 시 영향 | 본 토픽 spec 처리 |
|---|---|---|---|---|
| **B1** — Cloudflare Pages 정적 정책 변경 | SSR / edge function 도입 결정 | Master 또는 인프라 결정 변경 | 본 IA spec 무효 — 정적 viewer 가정 전체 재설계. 모든 Phase·G0~G5 재검토 | child 토픽 분기 허용 (Hard breaker 발동 시에만) |
| **B2** — D-003 read-only viewer 정책 폐기 | form / input 도입 결정 | Master 명시 결정 변경 | IA에 input flow 추가 필요. Records / Sessions·Deferrals 등 read interaction 전제가 무너짐. write API 신설 필요 | child 토픽 분기 허용 |
| **B3** — D-060 metrics_registry 스키마 변경 | growth.html 데이터 계약 변경 결정 | D-060 ledger 갱신 | growth.html 재설계. People signature 데이터 영향 가능. Phase 4 child 분기 | child 토픽 분기 허용 (Phase 4 진입 시점에서 발동) |

**B1·B2·B3 외에는 child 토픽 분기 금지** (메모리 `feedback_no_premature_topic_split` + Master 박제 #13). 본 토픽 안에서 framing → design → 구현 → 검증 → 부분 출시까지 1 토픽으로 완결.

---

## 8. 통과 조건 (G0-3 PASS 체크)

| 통과 기준 | 결과 |
|---|---|
| 사이드바 6 메뉴 트리 ASCII | PASS — §1 |
| 각 메뉴 라우팅 (파일 경로 + URL hash/query + active 규칙) | PASS — §2-1 표 |
| second-nav 계층 결정 (사이드바 expand vs 페이지 내부 탭) | PASS — 페이지 내부 second-nav-tab 채택 (§2-3) |
| Sessions 내부 3탭 라우팅 | PASS — §3 |
| 4 entity 상호 링크 매트릭스 | PASS — §4-1 |
| Home 5 인덱스 카드 진입점 | PASS — §5 |
| 부분 출시 4 페이지 출시 게이트 + Hard breaker B1·B2·B3 | PASS — §6 + §7 |
| 평면 깊이 ≤ 2 | PASS — Top Nav 1차 6 / second-nav 2차 7 / Sessions 3탭은 페이지 내부 routing |
| frontmatter `status: locked-for-dev` | PASS — 본 frontmatter |

**G0-3 동결**. Vera G0-6 wireframe과 직접 정합. Dev Phase 1 G1 nav.js 6 카테고리 + partial sidebar 구현의 단일 spec 출처.
