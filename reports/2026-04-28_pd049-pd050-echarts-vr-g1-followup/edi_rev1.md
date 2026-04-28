---
role: edi
rev: 1
turnId: 4
invocationMode: subagent
topic: topic_119
session: session_120
grade: B
date: 2026-04-28
parentTopic: topic_104 (D-089/D-091)
parentDecision: D-102
accessed_assets:
  - memory/shared/topic_index.json#topic_119
  - memory/shared/decision_ledger.json#D-102
  - memory/shared/evidence_index.json
  - memory/shared/glossary.json
sourceContributions:
  - reports/2026-04-28_pd049-pd050-echarts-vr-g1-followup/arki_rev1.md
  - reports/2026-04-28_pd049-pd050-echarts-vr-g1-followup/riki_rev1.md
  - reports/2026-04-28_pd049-pd050-echarts-vr-g1-followup/vera_rev1.md
  - reports/2026-04-28_pd049-pd050-echarts-vr-g1-followup/arki_rev2.md
---

# Edi rev1 — PD-049 / PD-050 통합 산출물 (spec lock, 구현 인계)

본 문서는 토픽 119 spec 동결 시점의 통합 산출물입니다. 새로운 전략·결정은 만들지 않고, Arki·Riki·Vera 발언과 D-102 결정을 단일 문서로 정리합니다.

---

## 1. Executive Summary

PD-049(ECharts 동적 색 주입 G1 lint 보완) + PD-050(VR fixture axis label 확장) 두 잔여 항목을 본 토픽에서 spec 동결합니다. 위반 5건(dashboard-upgrade.html 4건 + index.html 1건, 합 5건) 모두 신규 토큰 6종 + JS helper 1종으로 1:1 마이그레이션 가능하며, 검출은 esprima 부분 AST 기반 lint로 좁게 잡고, VR fixture는 axis label·category·계열길이 3축 freeze로 결정성을 박제합니다. WARN 단계는 동일 세션 내 ERROR 승격을 시한 박제하여 alert fatigue를 차단합니다.

구현은 본 토픽 후속 세션이 Phase 1(tokens.css 6종)부터 진입합니다. 게이트 G1~G8 + G-final, 전제 P-1~P-5, 중단 조건 C-1~C-6은 §6에 명시. 본 토픽 안에서 framing→구현 완결 원칙(no premature topic split) 정합.

---

## 2. Context

### 2.1 배경
- **Parent**: topic_104 (D-089 VR 인프라 / D-091 G1 lint 정착) — 본 토픽은 두 결정의 잔여 PD 처리.
- **PD-049**: G1 lint가 CSS 측 inline hex는 잡지만 `<script>` 내 `new echarts.graphic.LinearGradient(...)` 인수의 hex/rgba literal은 무차단 → 디자인 토큰 단일 출처 원칙 누수.
- **PD-050**: D-089 VR 인프라가 KPI 숫자·세션배열은 freeze하지만 axis label 결정성은 명시적 보장 없음 → 시간·랜덤 의존 코드 추가 시 회귀 미감지 위험.

### 2.2 Master 메모리 정합
- `feedback_dashboard_upgrade_template_canonical` — dashboard-upgrade.html은 viewer canonical
- `feedback_no_premature_topic_split` — 본 토픽 안에서 끝까지
- `feedback_implementation_within_3_sessions` — 구현 토픽 3세션 이내 완결
- `feedback_low_friction_no_redundant_gate` — 결정 불필요 사항 자동 진행

---

## 3. Master 결정 (4축 + Vera)

| 축 | 결정 | 의미 |
|---|---|---|
| **A** (PD-049 검출 범위) | **A1** 좁음 | hex/rgba literal + ECharts 호출 컨텍스트만. 변수/template literal/theme spread는 본 토픽 범위 외 |
| **B** (PD-049 출력 등급) | **B1** WARN-only + 동일 세션 내 ERROR 승격 시한 박제 | alert fatigue 방지를 위한 sunset 강제 |
| **C** (PD-050 fixture 범위) | **C1** axis label만 (3축 freeze 동반) | 범례·tooltip 미커버는 의도. 단 fixture가 색·axis category data·계열 길이 3축 모두 freeze |
| **D** (토픽 분화) | **D1** 단일 토픽 안에서 framing→구현 완결 | child 분화 없음, 본 토픽 후속 세션이 Phase 1~8 실행 |
| **Vera** | **Y** | gradient stop을 단일 색 토큰으로 분해 (옵션 a). theme JSON·합성 gradient 변수 모두 기각 |

D-102 박제 (`memory/shared/decision_ledger.json` 최상단).

---

## 4. Agent Contributions

### 4.1 Arki rev1 — 구조 분석
- 검출 옵션 3안(pure regex / 멀티라인 regex+balanced paren / AST) 비교, **권고 B → 종합검토에서 esprima 부분 AST(C변형)로 상향**.
- 화이트리스트: tokens.css `--c-*`/`--grad-*` 매칭 시 WARN, 외엔 FAIL.
- PD-050 옵션 3안(α fixture 확장 / β stability check / γ 짓지 않음) → **β 권고**, 코드 수정 0건.
- 위반 인벤토리 5건 + legacy 1건(범위 밖) 식별.
- Vera 결정 필요 3건(Q1 stop 토큰 / Q2 role 색 재사용 / Q3 alpha tier 정렬) 제기.
- 경계조건 6건 박제 — 특히 #1 tokens.css 로드 타이밍, #2 주석 내 hex.

### 4.2 Riki rev1 — 리스크 감사
4건 확신 리스크 (개수 채우기 금지 원칙으로 후보 4건 자발 제외).

| ID | 등급 | 핵심 |
|---|---|---|
| R-1 | 🔴 | A1 정규식 기반이면 변수 인용·template literal·theme spread·import 회피 패턴 무차단. → AST 기반 ECharts 컨텍스트 좁힘으로 mitigation |
| R-2 | 🟡 | WARN-only는 alert fatigue → baseline lock 또는 sunset ERROR 승격 시한 필수 |
| R-3 | 🟡 | axis label data가 동적이면 anchor 깨짐 → fixture 색·axis category·계열 길이 3축 freeze 명시 |
| R-4 | 🟡 | 토큰화 시 Vera 색 보정이 baseline 24장 시각 회귀 → 토큰값=기존 hex 1:1 동일, pixel-perfect diff 0 게이트 |

### 4.3 Vera rev1 — 색 토큰 spec
- 5건 위반을 3 의미군(G1 pink-violet bar / G2 cyan-teal bar / G3 area fade)으로 압축, 신규 토큰 **6종 확정**.
- 옵션 (b) 합성 gradient 변수, (c) theme JSON 분리 모두 기각 — ECharts API가 stop 객체 배열을 요구해 CSS gradient 문자열 재파싱이 토큰화 이득 상쇄.
- WCAG 비텍스트 3:1 대비 4건 모두 통과 (`#0B0B0D` 배경 기준 4.85~9.42:1).
- α 결정: `0x55/0xFF=0.333` ≠ `.20`, **canonical α=0.33**으로 수렴 (`:716` α `.20→.33` 의도된 변경 1건).
- R-D02 (connector α 3-tier 0.12/0.18/0.25)와 차원 분리 — chart area fade는 신규 의미 차원, R-D02 위반 아님.
- helper `window.CHART_TOKENS` 6 함수 + `areaFade(hex)` 합성기 spec 제공.

### 4.4 Arki rev2 — 실행계획 (post-decision recall)
- Phase 1~8 분해, 의존 그래프 단방향 + 병렬 가능 지점 2개(Phase 4 lint 작성을 Phase 3 swap과 병행 가능, Phase 5/6도 Phase 3 후 병행).
- 게이트 G1~G8 + G-final, 롤백 경로 8 phase별 박제.
- Self-audit 3 라운드 자발 재검토:
  1. setOption 화이트리스트 정밀화 — axisLine/tooltip 등은 PD-051 후보로 분리, 본 토픽 WARN으로만.
  2. lineChart α 의도 변경의 pixel diff allowance를 좌표 박스로 박제.
  3. Phase 4·3 병행 시 G4 양방향 검증(swap 이전 6건 검출 + 이후 0건 검출) 강화.
- 금지어 v0 준수 — 절대 시간·인력·공수 단위 0건. 구조적 선후 표현만.

---

## 5. Integrated Recommendation = D-102 spec

### 5.1 검출 (PD-049)
- **방식**: esprima 부분 AST. `<script>` 블록 → AST → `NewExpression(echarts.graphic.LinearGradient/RadialGradient)` 매칭 + `setOption({...})` 직속 인수의 `color`/`itemStyle.color`/`areaStyle.color` Literal 검사.
- **범위 외(의도)**: 변수 인용, template literal 합성, theme 객체 spread, 외부 모듈 import — Riki R-1 부분 mitigation. 미수용 부분은 별 토픽(PD-051 후보) 분리.
- **화이트리스트**: tokens.css의 `--c-chart-*` stop 4종 + 신규 6 토큰값 매칭 시 WARN, 그 외 FAIL.
- **출력 등급**: 환경변수 `LINT_ECHARTS_LEVEL=warn|error`. 기본 `warn`, Phase 8에서 `error` 승격.

### 5.2 토큰 + Helper (Vera spec)
```css
/* tokens.css 신규 — chart gradient stops (PD-049/050) */
:root {
  --c-chart-bar-from:  #F472B6;   /* G1 stop 0, pink-400 */
  --c-chart-bar-to:    #8B5CF6;   /* G1 stop 1, violet-500 */
  --c-chart-bar2-from: #14B8A6;   /* G2 stop 0, teal-500 */
  --c-chart-bar2-to:   #0891B2;   /* G2 stop 1, cyan-600 */
  --a-chart-area-from: 0.33;      /* G3 stop 0, hex 0x55/0xFF */
  --a-chart-area-to:   0.00;      /* G3 stop 1, transparent */
}
```

`app/js/chart-tokens.js` 신규 (Vera §4.2):
- `cssVar(name)` / `cssVarNum(name)` / `hexToRgba(hex,a)`
- `window.CHART_TOKENS = { barFrom, barTo, bar2From, bar2To, areaFromA, areaToA, areaFade(hex) }`
- 방어: `cssVar()` 빈 문자열 반환 시 `console.error` + fallback hex.

### 5.3 VR Fixture 3축 Freeze (Riki R-3)
- `tests/vr/fixtures/dashboard.mock.json`에 `_meta` 노드 추가: `{ sessionsLength, schemaVersion, frozenAt }`.
- `tests/vr/verify-fixture-stability.ts` — length·monotonic 검증.
- xAxis category·계열길이는 sessions 배열에서 deterministic 파생.
- yAxis name 코드 inline literal은 Phase 4 lint가 함께 검출.

### 5.4 Snapshot Stability Check (PD-050 β)
- `tests/vr/verify-axis-label-stability.ts` — 두 번 렌더 후 SVG `<text>` 노드 텍스트+위치(x,y) 추출 → JSON dump diff.
- 첫 dump를 `tests/vr/baseline/axis-labels.json`에 박제.

### 5.5 회귀 게이트 (Riki R-4)
- 토큰값 = 기존 hex 1:1 동일 (P-2). α `.20→.33` 1건만 의도된 변경.
- Phase 7에서 `baseline.bak/` vs 신규 `baseline/` pixel diff 0 강제. lineChart `:716` 영역만 좌표 박스로 화이트리스트.

---

## 6. Phase 1~8 실행계획 (Arki rev2 압축)

### 6.1 Phase 표

| Phase | What | Gate | Rollback |
|---|---|---|---|
| **1** Tokens | tokens.css에 6종 추가 (기존 `--c-*`/`--grad-*` 변경 0) | **G1**: build PASS + git diff 기존 토큰 변경 0 | 6 라인 revert |
| **2** Helper | `app/js/chart-tokens.js` 신설, HTML `<script>` 태그를 차트 init 위에 위치 | **G2**: 콘솔에서 `CHART_TOKENS.barFrom() === '#F472B6'` 등 6 함수 PASS | helper 삭제 + 태그 제거 |
| **3** Swap | 호출부 5건 단순→복합 순서로 swap (index:340 → upgrade:662 → :686 → :716 → :792) | **G3**: `grep` ECharts LinearGradient 인수 hex 잔존 0건 | 라인별 `git checkout` |
| **4** Lint | esprima 부분 AST `scan-echarts-gradient.ts` + `lint-echarts-gradient.ts` 신설 | **G4**: 양방향 — swap 이전 5건 검출 + 이후 0건 검출 | scope 좁힘(NewExpression만), lint 자체는 유지 |
| **5** Fixture freeze | fixture `_meta` 추가 + `verify-fixture-stability.ts` | **G5**: length·monotonic PASS | `_meta` 제거 |
| **6** Stability check | `verify-axis-label-stability.ts` + `baseline/axis-labels.json` 박제 | **G6**: 두 번 렌더 dump diff 0 | C-2 발동 — PD-050 부분 종결 |
| **7** Baseline 재캡처 | `baseline.bak/` 백업 → 재캡처 → pixel diff | **G7**: pixel diff 0 (lineChart `:716` 영역 박스 제외) | Phase 3 swap revert (helper·tokens 보존) |
| **8** Lint 통합 + ERROR 승격 | build.js lint chain에 추가 + `LINT_ECHARTS_LEVEL=error` | **G8**: lint chain 4단 통합 + build PASS | `warn` 복귀 + 잔존 위반 별 토픽 분리(gap 박제) |

**G-final**: G1~G8 모두 통과 + D-102 ledger 박제 + 시각 회귀 0 (`:716` α 의도 변경 외).

### 6.2 의존 그래프
```
P-1~P-5 검증 → Phase 1 → Phase 2 → Phase 3 ─┬─ Phase 4 (병행 가능, swap 검증 도구 재사용)
                                              ├─ Phase 5 (병행 가능)
                                              └─ Phase 6 (병행 가능)
                                              ↓
                                          Phase 7 (pixel diff 게이트)
                                              ↓
                                          Phase 8 (ERROR 승격)
                                              ↓
                                          G-final
```

### 6.3 전제 P-1~P-5
| # | 전제 |
|---|---|
| P-1 | esprima(또는 acorn) npm 설치 가능 |
| P-2 | tokens.css 6종 값이 기존 hex와 1:1 동일 (α `.20→.33` 1건만 의도) |
| P-3 | dashboard-upgrade.html이 canonical (Master 메모리 정합) |
| P-4 | VR baseline 24장 손상 없음, `.bak` 백업 권장 |
| P-5 | tokens.css `<link>`가 차트 init `<script>`보다 먼저 파싱 |

### 6.4 중단 조건 C-1~C-6
| # | 조건 | 대응 |
|---|---|---|
| C-1 | esprima/acorn 설치 거부 | 옵션 B(멀티라인 regex+balanced paren) 폴백, R-1 부분 미수용 — Master 재확인 |
| C-2 | Phase 6에서 axis label 비결정성 발견 | PD-052 분리, PD-050 부분 종결 |
| C-3 | Phase 7 pixel diff > 0, 1세션 초과 디버깅 예상 | Phase 3 revert + 본 토픽 framing 재분류 |
| C-4 | Vera 토큰값 ↔ 호출부 hex 불일치 | Phase 3 진입 전 Vera 재소집 |
| C-5 | tokens.css 로드 타이밍 위반 (P-5) | helper fallback hex + `<head>` 위치 lint |
| C-6 | WARN 중 신규 위반 발생 | 즉시 ERROR 승격 강제 |

---

## 7. Unresolved Questions / 본 토픽 후속 인계

### 7.1 본 토픽 후속 세션 인계 (구현)
- **첫 진입점**: Phase 1 (tokens.css 6종 추가)
- **Dev 첫 작업**: Vera spec rev1 §3 블록 그대로 `app/css/tokens.css`에 추가
- **검증 우선**: 전제 P-1~P-5 검증을 Phase 1 진입 전 완료
- **게이트 순서**: G1 → G2 → G3 → (G4·G5·G6 병행) → G7 → G8 → G-final
- **금지**: 시간/인력/공수 단위 박제, Vera 색 재정의(토큰값=기존 hex 1:1), child 토픽 분화
- **Vera 재소집 트리거**: C-4 (토큰값 ↔ 호출부 hex 불일치 발견 시)

### 7.2 본 토픽 범위 외 (별 토픽 후보)
- **PD-051 후보**: setOption 전반의 axisLine/tooltip/splitLine hex literal 토큰화 (현재 Phase 4 lint에서 WARN으로만 잡힘)
- **PD-052 후보**: axis label 비결정성 코드(시간/랜덤 의존 발견 시 Phase 6 C-2에서 분리)
- **R-1 미수용 부분**: 변수 인용·template literal·theme spread·import 회피 패턴 — A1 좁음 결정 정합

### 7.3 Gap / Contradiction (paper over 금지)
- **Gap-1**: Arki rev1은 위반 6건(legacy 1건 포함)으로 셈, Vera는 5건(active만), 본 통합 문서는 active 5건 기준. legacy는 `dump.active === false` 기준 lint 범위 밖이라 정합.
- **Gap-2**: Arki rev1 §3-2 Q3은 alpha 3-tier(0.12/0.18/0.25)에 0.18 정렬을 권고했으나 Vera는 R-D02와 차원 분리하여 `0.33` canonical 채택. 최종 결정은 **Vera 기준** (D-102 = Vera Y). Arki rev1 권고는 R-D02 차원 혼동에서 발생 — Vera 분리 논거가 우선.
- **Gap-3**: Arki rev1은 토큰 명명을 `--c-grad-hero-0/1`, `--c-grad-teal-0/1` 등 8종으로 제안했으나 Vera는 의미군 압축으로 6종(`--c-chart-bar-from/to`, `--c-chart-bar2-from/to`, `--a-chart-area-from/to`)으로 결정. 최종은 **Vera 6종**. Arki rev1 명명은 호출부 시맨틱(hero/teal)에 묶인 반면 Vera는 차트 역할(bar/area)에 묶음 — 후자가 재사용성 ↑.
- **Contradiction 없음**: Riki R-1~R-4 mitigation은 모두 D-102 spec에 반영(R-1=AST, R-2=ERROR sunset, R-3=3축 freeze, R-4=pixel diff 0).

---

## 8. Appendices

### A. 위반 5건 위치 표

| # | 파일:line | 용도 | before | after (D-102 spec) |
|---|---|---|---|---|
| 1 | dashboard-upgrade.html:662-663 | heroChart bar | `#F472B6 → #8B5CF6` | `CHART_TOKENS.barFrom() → barTo()` |
| 2 | dashboard-upgrade.html:686 | efficiencyChart Size bar | `#14B8A6 → #0891B2` | `CHART_TOKENS.bar2From() → bar2To()` |
| 3 | dashboard-upgrade.html:716 | lineChart 자동 area fade | `rgba(139,92,246,.2) → rgba(139,92,246,0)` | `areaStyle.color = LinearGradient(0,0,0,1, CHART_TOKENS.areaFade('#8B5CF6'))` (α `.20→.33` 의도된 변경) |
| 4 | dashboard-upgrade.html:792 | spark area (변수 색 인자) | `color+'55' → color+'00'` | `CHART_TOKENS.areaFade(color)` |
| 5 | index.html:340-341 | hero token bar | `#F472B6 → #8B5CF6` | `CHART_TOKENS.barFrom() → barTo()` |

`dashboard-upgrade.html:534†` legacy archive는 `dump.active === false`로 lint 범위 밖.

### B. 토큰 매핑표 (의미군 ↔ 토큰 ↔ hex)

| 의미군 | 토큰 | hex/value | WCAG vs `#0B0B0D` |
|---|---|---|---|
| G1 — pink-violet bar | `--c-chart-bar-from` | `#F472B6` | 9.42:1 AAA |
| G1 — pink-violet bar | `--c-chart-bar-to` | `#8B5CF6` | 4.94:1 AA Large |
| G2 — cyan-teal bar | `--c-chart-bar2-from` | `#14B8A6` | 6.93:1 AAA |
| G2 — cyan-teal bar | `--c-chart-bar2-to` | `#0891B2` | 4.85:1 AA Large |
| G3 — area fade α | `--a-chart-area-from` | `0.33` (= 0x55/0xFF) | non-text |
| G3 — area fade α | `--a-chart-area-to` | `0.00` | transparent |

### C. Lint 체인 통합 순서 (Phase 8)
```
build.js lint chain:
  lint-inline-root-color  →  lint-echarts-gradient (NEW)  →  lint-contrast  →  lint-accent-only
```

### D. 신규 파일 인벤토리
| 경로 | 역할 | Phase |
|---|---|---|
| `app/css/tokens.css` (수정) | 6 토큰 추가 | 1 |
| `app/js/chart-tokens.js` (신규) | helper 6 함수 | 2 |
| `scripts/scan-echarts-gradient.ts` (신규) | callable AST 스캐너 | 4 |
| `scripts/lint-echarts-gradient.ts` (신규) | CLI lint exit 0/1 | 4 |
| `tests/vr/fixtures/dashboard.mock.json` (수정) | `_meta` 노드 추가 | 5 |
| `tests/vr/verify-fixture-stability.ts` (신규) | length·monotonic 검증 | 5 |
| `tests/vr/verify-axis-label-stability.ts` (신규) | 두 번 렌더 dump diff | 6 |
| `tests/vr/baseline/axis-labels.json` (신규) | axis label 회귀 박제 | 6 |
| `tests/vr/baseline.bak/` (백업) | Phase 7 안전망 | 7 |

---

```yaml
# self-scores
src_int: 1.00       # 4개 source(Arki rev1·rev2, Riki, Vera) 전부 통합, 누락 0
gap_dis: 3          # Gap-1·2·3 명시 (paper over 금지 준수)
spec_lk: Y          # PD-049/050 spec 동결, Phase 1 진입 가능
ast_qry: 4          # accessed_assets 4종 명시
```

- `src_int: 1.00` — 4개 source contribution 모두 §4에 요약 + §5/6/8에 통합. 누락·왜곡 0.
- `gap_dis: 3` — Arki rev1 ↔ Vera 간 토큰 개수(8 vs 6), 명명 축(시맨틱 vs 차트역할), α 정렬(0.18 vs 0.33) 3건 명시 후 우선순위 박제.
- `spec_lk: Y` — D-102 박제 완료, 본 토픽 후속 세션이 Phase 1부터 직접 진입 가능.
- `ast_qry: 4` — frontmatter `accessed_assets`에 topic_index/decision_ledger/evidence_index/glossary 4종 명시.
