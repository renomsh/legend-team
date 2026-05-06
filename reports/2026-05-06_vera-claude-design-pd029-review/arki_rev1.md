---
topicId: topic_174
role: arki
rev: 1
turnId: 0
invocationMode: subagent
createdAt: 2026-05-06
title: "Growth 페이지 현황 파악 및 설계 제약 — Vera Claude Design 작업 준비"
---

# Arki — Growth 페이지 구조 분석

## §1. 현황 (파일 구조 + 데이터 소스)

### 파일 구조

```
app/
  growth.html              ← 단일 HTML (인라인 JS ~240줄 + CSS ~65줄)
  js/
    metrics-utils.js       ← renderTier3() 공유 유틸 (growth + people 공용)
    role-colors.js         ← ROLE_COLORS Proxy (tokens.css --c-* 런타임 읽기)
    nav.js                 ← sidebar partial
  css/
    tokens.css             ← 디자인 토큰 단일 출처 (Vera canonical)
    style.css              ← 전역 레이아웃
    components.css         ← 공유 컴포넌트 (drawer·KPI row·table 등)
```

현재 `app/growth.html`은 **JSX/React 없이 순수 HTML + 인라인 JS** 구조다. CLAUDE.md에서 "JSX, React 허용"이라고 했지만, 실제 app/ 디렉토리의 다른 페이지들도 동일한 vanilla HTML 방식이다. React 마이그레이션은 이번 범위 밖으로 판단한다.

### 데이터 소스 (fetch 경로 기준)

| 경로 | 용도 | 변경 가능 여부 |
|---|---|---|
| `data/memory/growth/metrics_registry.json` | 지표 정의 (51개 metric, registryVersion v1.1) | **불가** — `compile-metrics-registry.ts` 단일 빌드 |
| `data/memory/growth/signature_metrics_aggregate.json` | 집계값 (105 records, 3 view × role × metric) | **불가** — `compute-signature-metrics.ts` 자동 생성 |
| `data/memory/shared/role_registry.json` | 역할 목록 | **불가** — 공유 SOT |
| `data/memory/shared/feature_flags.json` | 기능 플래그 (`signatureMetricsEnabled`) | **불가** — 시스템 제어 |
| `data/memory/sessions/current_session.json` | 현재 세션 스냅샷 | **불가** — hook 자동 생성 |

**핵심 제약**: 모든 데이터는 외부 스크립트가 생성하는 JSON 파일이다. growth.html은 **read-only consumer**이며, 데이터 소스 경로나 스키마를 변경하면 스크립트 파이프라인이 깨진다.

---

## §2. 개편 가능 섹션 목록

growth.html의 5개 섹션 현황과 개편 방향:

### §1 Axis Pulse (L1/L2/L3 카드 3개)

**현재 상태:**
- 하드코딩된 3개 `<div class="axis-card">` HTML 블록
- 인라인 스타일: `--accent:var(--grad-violet/teal/amber)` 직접 박힘
- 숫자 표시: `renderAxis()` 함수가 `axisVal-{axis}` ID에 innerHTML 주입
- 토큰 부분 활용: `var(--panel)`, `var(--line)` 사용하지만 `--accent` 패턴은 인라인 정의

**개편 방향:**
- `axis-card.l1/l2/l3` CSS 클래스를 tokens.css 그라디언트 토큰으로 정렬 (`--grad-violet` 이미 있음)
- `axis-val` 숫자에 `.kpi-num` 클래스(components.css §1) 적용 → tabular-nums 통일
- 반응형: 현재 `@media (max-width:1023px)` 인라인 정의 → components.css 이동 가능

### §2 Role Cards (8개 그리드)

**현재 상태:**
- JS 동적 생성 (템플릿 리터럴)
- ROLE_COLOR 하드코딩 fallback 이중 정의 (growth.html 내 `const ROLE_COLOR` + role-colors.js `ROLE_COLORS`)
- 점수 폰트: `font-size:28px;font-weight:800` 인라인
- 카드 hover: `border-color:rgba(139,92,246,.35)` 하드코딩 (ace 색 직접 사용)

**개편 방향 (Vera 작업 핵심):**
- 카드 hover 색을 `rgba(var(--c-ace-rgb), var(--alpha-3))` 패턴으로 토큰화 (또는 `var(--c-ace)` + alpha)
- role-score 숫자에 `.kpi-num` 통일
- `ROLE_COLOR` 이중 정의 제거 → role-colors.js `ROLE_COLORS` 단일 소스로 통합
- `.badge` 스타일(ok/warn/bad)을 components.css §semantic으로 이전

### §3 Drill Table (역할별 지표)

**현재 상태:**
- `renderDrill()` 함수가 table을 innerHTML 주입
- `.table` 클래스 사용 (이미 style.css/components.css 정의된 공유 클래스)
- `role-select` 셀렉터 인라인 스타일 있음

**개편 방향:**
- 현재 가장 잘 구조화된 섹션. 개편 범위 최소
- `role-select` 스타일을 `select.role-select`에서 공통 form 컴포넌트로 이전 가능

### §4 Raw Aggregates (`<details>`)

**현재 상태:**
- `.raw-details > summary` 스타일 인라인 정의
- `renderTier3()` 함수는 metrics-utils.js에 이미 분리됨 (good)

**개편 방향:**
- `<details>/<summary>` 아코디언 패턴 → components.css로 이전 (다른 페이지에도 재사용 가능)
- 토큰 정렬 필요: summary hover `var(--panel-2)` 이미 토큰 사용 중

### §5 Current Session 섹션

**현재 상태:**
- `renderCurrentSession()` 전체 인라인 JS + 인라인 스타일 (style attr 직접 주입)
- Agent Progress 행: 인라인 스타일 100% — 토큰 미사용
- 카드들이 `border-top:3px solid ${c}` 하드코딩 패턴

**개편 방향 (Vera 작업 2순위):**
- Agent Progress 행을 CSS 클래스로 추출 (`.agent-row`, `.agent-badge`)
- 세션 메타 카드를 components.css `.kpi-row` 패턴과 통일
- 이 섹션은 "보조 정보"로 현재 주석 처리됨 → Vera가 시각 위계 재정의 필요

---

## §3. 설계 제약 (Vera에게 전달할 Boundary Conditions)

### A. 데이터 소스 — 변경 불가 항목

1. **fetch 경로 4개** (`metrics_registry`, `signature_metrics_aggregate`, `role_registry`, `feature_flags`, `current_session`) — 경로 구조는 build.js가 `data/` 아래 복사. 경로 변경 = 파이프라인 파손
2. **JSON 스키마 필드** — `a.mean`, `a.n`, `a.ci95`, `a.alert.level`, `m.shortKey`, `m.axis`, `m.lifecycleState` 등 렌더링 함수에서 직접 참조. 스키마 변경 없음
3. **P3 hidden policy** — `hasData(a)` 조건(`n>0 && mean!==null`) 위반 시 카드 미렌더. 이 비즈니스 로직은 UI 리디자인 후에도 보존 필수
4. **axis 3종** (`quality`, `judgment-consistency`, `execution-transfer`) — `AXIS_DEF` 하드코딩. 신규 축 추가 = JS 변경 필요 (이번 범위 외)

### B. 토큰 시스템 — 준수 의무

1. **tokens.css 단일 출처** — 인라인 `:root{}` 재정의 금지. `lint-inline-root-color.ts`가 차단
2. **role color = `--c-{role}` 토큰** — role-colors.js `ROLE_COLORS` Proxy가 runtime에 tokens.css 읽음. 하드코딩 hex 직접 사용 금지 (JS 동적 생성 부분에서 혼용 현재 존재 — 개편 시 정리 필요)
3. **`--c-ace` ALARM 상태** — 4.64:1 (margin 0.14). **accent-only 강제** — 본문 텍스트·배경으로 사용 금지. hover border accent 용도만 허용
4. **spacing 토큰 `--sp-*`** — 중간값(ex: 10px, 6px) 직접 사용 금지. 단, growth.html 현재 gap:6px, gap:8px 등 토큰 미사용 인라인 혼용 존재 → 개편 시 정렬 필요
5. **contrast 검증** — `scripts/lint-contrast.ts` 자동 발동. 새 색 도입 시 WCAG 2.1 sRGB linearization 통과 필수

### C. 컴포넌트 분리 원칙

1. **`renderTier3()`는 metrics-utils.js 소속** — growth 페이지만의 로직이 아님. 변경 시 people 페이지 등 공유 소비자 영향 확인 필수
2. **공유 클래스 `.table`, `.kpi-row`, `.gx-section*` 변경 금지** — 다른 페이지에서 재사용 중
3. **page-local CSS는 growth.html `<style>` 블록에** — components.css에 growth-specific 스타일 추가 금지
4. **JS 함수 분리 기준**: growth.html 내 인라인 JS에서 공유 유틸로 이전 시 metrics-utils.js 또는 신규 growth-utils.js. 단, growth-specific 렌더링 로직(renderAxis, renderRoles, renderDrill, renderCurrentSession)은 growth.html 유지 권고 (분리 ROI 낮음)

### D. 현재 존재하는 기술 부채 (개편 시 정리 대상)

| 항목 | 위치 | ROI 라벨 |
|---|---|---|
| `const ROLE_COLOR` 이중 정의 | growth.html L174 vs role-colors.js | `MUST_NOW` — 개편과 동시 제거 |
| hover color 하드코딩 `rgba(139,92,246,.35)` | role-card CSS | `MUST_NOW` — 토큰화 |
| `.axis-card .axis-val` 폰트 인라인 | growth.html L28~29 | `MUST_BY_N=10` — .kpi-num 통일 |
| Current Session 인라인 스타일 100% | renderCurrentSession() | `MUST_BY_N=10` |
| spacing 비토큰 값 (gap:6px, gap:8px 등) | growth.html `<style>` | `SHOULD` |
| 반응형 media query 인라인 정의 | growth.html L68~74 | `SHOULD` |

---

## §4. 구조적 실행계획

### Phase 분해

```
Phase 0: 준비 (병렬 가능)
  0-A. Vera → Claude Design으로 Growth 페이지 시각 시안 작성
         Input: 이 문서 §2(섹션 목록) + §3 B(토큰 제약)
         Output: 섹션별 before/after mockup + 컴포넌트 spec
  0-B. Dev → ROLE_COLOR 이중 정의 제거 + hover color 토큰화 (D부채 MUST_NOW)
         선제 정리로 Vera 시안과 충돌 방지

Phase 1: Vera 시안 검토 (0-A 완료 후)
  1. Arki + Master → 시안 리뷰
         기준: §3 A(데이터 소스) 위반 없음, §3 B(토큰) 준수, P3 hidden policy 유지
  2. Master 승인 → Edi 구현 인계 spec 박제

Phase 2: 구현 (1 완료 후)
  2-A. Dev → 인라인 JS 렌더링 함수 개선 (토큰 정렬, .kpi-num 통일)
  2-B. Dev → Current Session 섹션 CSS 클래스 추출
  → Gating: lint-contrast.ts 통과 + 브라우저 렌더링 확인
```

### 의존 그래프

```
0-B (독립) ──────────────────────────────────────────────► Phase 2
0-A (독립) ──► 1(리뷰) ──► spec 박제 ──► Phase 2-A/B (병렬)
```

### 검증 게이트

| Gate | 기준 |
|---|---|
| G0 | `lint-inline-root-color.ts` 통과 — 인라인 :root{} 없음 |
| G1 | `lint-contrast.ts` 통과 — 새 색 WCAG AA 통과 |
| G2 | P3 hidden policy 유지 확인 (hasData 조건 변경 없음) |
| G3 | fetch 경로 4개 변경 없음 (data/ 경로 그대로) |
| G4 | 데스크톱(≥1024) + 모바일(<1024) 브라우저 렌더 확인 |

### 롤백 경로

- CSS만 변경 시: tokens.css·components.css git revert
- JS 변경 시: growth.html의 인라인 JS는 단일 파일 → git revert growth.html
- metrics-utils.js 변경 시: 공유 소비자(people 페이지 등) 확인 후 revert

### 중단 조건

- lint-contrast.ts ALARM 해소 불가 + tokens.css에 fallback 후보 없음 → Vera에게 색 재설계 요청
- Vera 시안이 P3 hidden policy 위반(데이터 없는 카드 강제 렌더) → 리디자인 요청
- fetch 경로 변경 요구 발생 → Nexus에 scope 재정의 요청

---

## 자기감사 (3라운드)

### 1차 감사 — 발견 4개 / 각 축 최소 3지점 검사

**structuration:**
- [1] ROLE_COLOR 이중 정의 (growth.html L174 + role-colors.js) — 설계 오염. `MUST_NOW`
- [2] renderCurrentSession() 내 인라인 스타일이 렌더링 로직과 혼재 — 관심사 미분리. `MUST_BY_N=10`
- [3] growth.html `<style>` 블록 내 반응형 정의가 components.css 공유 패턴과 중복. `SHOULD`

**hardcoding:**
- [4] `rgba(139,92,246,.35)` ace 색 직접 하드코딩 in CSS. `MUST_NOW`
- [5] `28px` / `32px` 폰트 인라인 (tokens.css fs-h3/kpi-num 미적용). `MUST_BY_N=10`
- [6] `gap:8px`, `gap:6px` spacing 토큰 미적용. `SHOULD`

**efficiency:**
- [7] `topMetricForRole()` 내 filter+concat 이중 루프 — N<20이므로 ROI 낮음. `NICE`
- [8] innerHTML 전체 재생성(renderRoles) vs 증분 업데이트 — view 전환 빈도 낮으므로 `DEFER`
- No issue: 데이터 로딩은 병렬 fetch 없이 순차 — 파일 4개, 총 크기 소형이므로 허용

**extensibility:**
- [9] AXIS_DEF 하드코딩 3개 — 신규 axis 추가 시 JS 수정 필요. `SHOULD` (현재 3축 고정 정책)
- [10] badge 패턴(ok/warn/bad)이 alertBadge() 함수로 고정 — alert.level 스키마 변경 시 취약. `SHOULD`
- No issue: feature_flags.json gate 구조는 올바름 (signatureMetricsEnabled 체크)

### 2차 감사 — 발견 2개 (전환: 설계 옵션 리뷰)

**P3 hidden policy 재검토:**
- [11] `hasData()` 조건이 `n>0 && mean!==null` — mean=0인 정상 데이터도 통과함. 단, scale이 0-5이므로 mean=0은 실측값. 문제없음.
- [12] `topMetricForRole()` fallback(데이터 없는 metric 반환) 시 카드가 미렌더되지만 `roleCount` 카운터가 `shown` 기준으로 정확히 동작. 일관성 확인됨.

**데이터 경로 re-check:**
- growth.html은 `data/memory/...` 경로를 fetch함. `build.js`가 `memory/` → `app/data/memory/` 복사 여부 확인 필요. 현재 코드에서 검증 못했으나 기존 동작 전제 (현황 파악 단계 — 변경 없음).

### 3차 감사 — 발견 1개

**scope drift 체크:**
- spec 내용이 "현황 파악 + 설계 제약"으로 원래 정의에 맞음. Phase 계획이 실행 설계 포함되었으나 토픽 Grade A framing 단계에 적합. 추가 범위 없음.
- [13] `renderCurrentSession()`의 AGENT_ORDER/AGENT_LABELS 하드코딩 — `role_registry.json` 데이터와 중복. `SHOULD` — 단, current_session specific 표시 순서이므로 registry 완전 의존은 과도. 유지 가능.

**종료 판정:** 3차 발견 1개, 모두 SHOULD/DEFER 이하. 감사 종료.

---

selfScores:
- arch_cov: 0.88  (데이터 파이프라인 upstream 코드 미직접 확인, build.js 경로 복사 로직 미검증)
- risk_cnt: 6  (설계 제약 섹션 §3 A/B/C/D에서 식별된 하드 제약: 데이터경로4 + 토큰규칙5 + 컴포넌트분리4 + 기술부채6, 주요 boundary 6개)
