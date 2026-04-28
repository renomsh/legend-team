---
role: arki
rev: 2
turnId: 3
invocationMode: subagent
recallReason: post-decision-execution-plan
topic: topic_119
session: session_120
grade: B
date: 2026-04-28
parentDecision: D-102 (drafting)
scope: PD-049/PD-050 실행계획 — Phase 분해·의존 그래프·게이트·롤백·중단 조건
mode: execution-plan
---

# Arki rev2 — 실행계획 (D-102 박제 직전)

구조 설계자 Arki입니다. D-102 안 (esprima 부분 AST + 6 토큰 + helper + fixture 3축 freeze + WARN→ERROR 시한) 기반 실행계획. 금지어 v0 절대 준수.

---

## 0. 전제 (깨지면 계획 무효)

| # | 전제 | 검증 방법 |
|---|---|---|
| P-1 | esprima(또는 acorn) 의존성 추가 가능 — 본 토픽 내 npm 설치 허용 | `package.json` devDependencies에 추가, build.js 환경 영향 0 |
| P-2 | tokens.css 신규 6 토큰값이 기존 hex와 1:1 동일 (Riki R-4 1단계) | Vera spec rev1 §3 매핑표 확인 — `#F472B6`, `#8B5CF6`, `#14B8A6`, `#0891B2` 동일 / α `.20→.33`은 의도된 변경 1건 |
| P-3 | dashboard-upgrade.html이 canonical 템플릿 — 색·구조 변경은 토큰화 swap만 | Master 메모리 [feedback_dashboard_upgrade_template_canonical] 정합 |
| P-4 | VR 기존 baseline 24장이 손상 없이 보존 | `tests/vr/baseline/` 디렉토리 존재 확인, `.bak` 백업 권장 |
| P-5 | `getComputedStyle(documentElement)` 호출 시점에 tokens.css `<link>` 가 이미 파싱 완료 | dashboard-upgrade.html `<head>` 내 link 위치 확인 — `<script>` 차트 init은 `defer` 또는 본문 끝 |

P-1~P-5 모두 충족되지 않으면 Phase 1 진입 전 재프레이밍.

---

## 1. Phase 분해

### Phase 1 — Token 정의 (tokens.css 6종 추가)
- **What**: Vera rev1 §3 명세 그대로 `app/css/tokens.css`에 6종 추가 (`--c-chart-bar-from/to`, `--c-chart-bar2-from/to`, `--a-chart-area-from/to`).
- **구조**: 기존 `--c-*` / `--grad-*` 블록 다음 줄에 신규 그룹 `chart gradient stops` 주석 헤더 + 6라인. 기존 토큰 변경 0.
- **Out**: `--grad-*` 4종은 그대로 유지 — CSS background용도. 차트용은 별도 차원.

### Phase 2 — Helper 도입 (chart-tokens.js 신설)
- **What**: `app/js/chart-tokens.js` 신규 — Vera rev1 §4.2 helper 6 함수 + `window.CHART_TOKENS` export.
- **구조**: 단일 파일 ~40 lines, ESM·전역 둘 다 지원(`window.CHART_TOKENS = ...` 노출). dashboard-upgrade.html / index.html `<script src="js/chart-tokens.js">` 태그 추가 — **차트 init `<script>`보다 위**에 위치 (P-5 정합).
- **방어 조항**: `cssVar()` 가 빈 문자열 반환 시 `console.error` + fallback hex 반환 (개발 시 즉시 인지 가능).

### Phase 3 — 호출부 6건 치환
- **What**: Vera rev1 §4.3 매핑표 그대로 6건 swap.
- **순서**: index.html:340 → dashboard-upgrade.html:662 → :686 → :716 → :792 (단순→복합). spark()(:792)이 제일 마지막인 이유: 변수 색 인자 받는 함수형 케이스라 helper 검증 우선 완료 후 적용.
- **검증 단계 끼움**: 각 swap 직후 dashboard-upgrade 페이지 수동 렌더 → 차트 시각 비교 (Phase 7 전에 broken-chart 조기 발견).

### Phase 4 — Lint rule 신설 (esprima 부분 AST)
- **What**: `scripts/scan-echarts-gradient.ts` (callable export) + `scripts/lint-echarts-gradient.ts` (CLI exit 0/1) 신규.
- **구조**:
  1. HTML 입력 → `<script>` 블록 추출 (정규식 `/<script\b[^>]*>([\s\S]*?)<\/script>/g`)
  2. 각 블록 `esprima.parseScript(src, { loc: true })` — 실패 시(syntax error) 해당 블록 skip + warn (defensive).
  3. AST 워킹: `NewExpression` 노드 중 `callee` 가 `MemberExpression` 형태로 `echarts.graphic.LinearGradient` / `RadialGradient` 매칭.
  4. 인수 4번째(`arguments[3]`) = stop 배열 `ArrayExpression`. 각 element `ObjectExpression` 의 `color` property `Literal.value` 추출.
  5. 또한 `setOption({...})` 호출 인수 객체 트리에서 `color` / `itemStyle.color` / `areaStyle.color` property의 `Literal` 값이 hex 문자열이면 검출 (D-102 안 — setOption 정적 hex literal 포함).
  6. 검출된 hex가 tokens.css 화이트리스트(`--c-chart-*` stop 4종 + 6 토큰값)에 있으면 WARN, 외엔 FAIL 후보.
  7. WARN/ERROR 모드 환경변수 `LINT_ECHARTS_LEVEL=warn|error` (기본 warn — D-102 안 1세션 내 토큰화 후 `error` 승격).
- **Out (의도적)**: 변수 인용·template literal·theme spread·외부 모듈 import — Riki R-1 (b)안 부분 적용. 변수 추적까지 가지 않음 (esprima 부분 AST = 호출 컨텍스트 + 직접 literal까지). Master D-102 결정.

### Phase 5 — VR fixture 3축 freeze (axis label·category·계열길이)
- **What**: `tests/vr/fixtures/dashboard.mock.json` 의 sessions 배열 길이를 **고정값**으로 박제 — 현 102 → 검증용 12로 단축 또는 102 그대로 유지(Master 결정 필요지만 D-102 안에 명시 없음 → 안전책: **현 102 유지 + 길이 검증만 추가**).
- **구조**:
  1. fixture에 `_meta` 노드 추가: `{ sessionsLength: 102, schemaVersion: "v2-3axis-freeze", frozenAt: "2026-04-28" }`. 페이지는 `_meta` 무시.
  2. `tests/vr/verify-fixture-stability.ts` 신설 — fixture 로드 후 `sessions.length === _meta.sessionsLength` + `sessions[].sessionId` 단조성 검증.
  3. xAxis category·계열길이는 sessions 배열에서 deterministic 파생 → 별도 박제 불필요.
  4. axis label은 코드 inline literal(`name:'Size'`, `name:'Cache%'`) — 정의상 deterministic. 변경 시 lint가 잡도록 **Phase 4 lint에 yAxis name literal 검출도 포함**.

### Phase 6 — Snapshot stability check
- **What**: `tests/vr/verify-axis-label-stability.ts` 신설 — fixture 로드된 페이지 두 번 렌더해서 SVG `<text>` axis label 노드 추출 비교.
- **구조**:
  1. 입력: dashboard-upgrade.html, index.html 두 페이지.
  2. 각 페이지 두 번 렌더 → DOM의 `.echarts-instance text` 노드 텍스트 + 위치(x,y) 추출 → JSON dump.
  3. 두 dump diff 0 PASS, 1+ FAIL.
  4. 부산물: 첫 dump를 `tests/vr/baseline/axis-labels.json` 으로 박제 (회귀 추적용).

### Phase 7 — VR baseline 재캡처 + pixel-perfect diff 게이트
- **What**: 토큰화 후 dashboard-upgrade 24 baseline 재캡처 (Riki R-4 2단계).
- **구조**:
  1. 기존 baseline → `baseline.bak/` 백업.
  2. 신규 baseline 캡처 (현 D-089 인프라 사용).
  3. `tests/vr/diff-baseline.ts` 실행 — `baseline.bak/` vs `baseline/` pixel diff.
  4. **diff 0 PASS** = 토큰값이 기존 hex와 1:1 동일 검증됨. **1+ pixel FAIL** = 토큰화 오류 → Phase 3 rollback.
  5. 단, lineChart areaStyle α `.20 → .33`(:716)은 **의도된 변경 1건** — 해당 영역만 화이트리스트 처리(diff allowance 박제 또는 캡처 시 해당 차트만 별도 baseline).

### Phase 8 — Lint rule 통합 + WARN→ERROR 승격
- **What**: `scripts/build.js` lint 체인에 `lint-echarts-gradient` 추가 + `LINT_ECHARTS_LEVEL=error` 승격.
- **구조**:
  1. build.js의 lint 체인 순서: `lint-inline-root-color` → `lint-echarts-gradient` → `lint-contrast` → `lint-accent-only`.
  2. Phase 3 swap 완료 + Phase 7 PASS 후 → 환경변수 기본값 `error` 로 변경.
  3. Phase 8 완료 시점이 D-102의 "WARN→ERROR 승격 시한 — 1세션 내" 이행.

---

## 2. 의존 그래프

```
P-1~P-5 전제 검증
        ↓
   Phase 1 (tokens.css 6종)
        ↓
   Phase 2 (chart-tokens.js helper)
        ↓
   Phase 3 (호출부 6건 swap)  ←──┐
        ↓                       │
   Phase 4 (esprima lint, WARN) │ Phase 4는 Phase 3과 병행 가능
        ↓                       │ (lint dry-run 으로 swap 잔존 검증)
        └───────────────────────┘
        ↓
   Phase 5 (fixture _meta freeze)  ──┐
        ↓                            │ Phase 5·6은 Phase 3 완료 후 병행 가능
   Phase 6 (axis label stability)  ──┘
        ↓
   Phase 7 (VR baseline 재캡처 + pixel-perfect diff 게이트)
        ↓
   Phase 8 (lint chain 통합 + WARN→ERROR 승격)
        ↓
   D-102 박제 + 토픽 종결
```

병렬화 가능 지점: Phase 4 (lint 작성)는 Phase 3 (swap)와 동시 진행 가능 — lint dry-run이 swap 완료 검증 도구로 자동 재사용. Phase 5·6은 Phase 3 직후 병행.

---

## 3. 검증 게이트

| Gate | Phase | 통과 기준 |
|---|---|---|
| **G1** | Phase 1 | `app/css/tokens.css` 신규 6 토큰 등록 + `build.js` dist build PASS (CSS syntax 무결) + 기존 `--c-*` `--grad-*` 변경 0 (`git diff` 검증) |
| **G2** | Phase 2 | `app/js/chart-tokens.js` 신규, 브라우저 콘솔에서 `CHART_TOKENS.barFrom() === '#F472B6'` 등 6 함수 반환값 검증 PASS |
| **G3** | Phase 3 | 호출부 6건 swap 완료 + `grep -nE "LinearGradient\([\s\S]*?#[0-9A-Fa-f]" app/dashboard-upgrade.html app/index.html` 잔존 0건 |
| **G4** | Phase 4 | `lint-echarts-gradient.ts` dry-run — Phase 3 이전 6건 검출 / 이후 0건 검출. 즉 lint 자체 정확성 양방향 확인 |
| **G5** | Phase 5 | fixture `_meta.sessionsLength` 추가 + `verify-fixture-stability.ts` PASS (length·monotonic) |
| **G6** | Phase 6 | `verify-axis-label-stability.ts` 두 번 렌더 dump diff 0 PASS + `baseline/axis-labels.json` 박제 |
| **G7** | Phase 7 | `baseline.bak/` vs 신규 `baseline/` pixel diff 0 (lineChart :716 영역 제외 — α 의도 변경) |
| **G8** | Phase 8 | `LINT_ECHARTS_LEVEL=error` 상태에서 `build.js` 전체 PASS + lint 체인 4단 통합 |

**최종 게이트 G-final**: G1~G8 모두 통과 + D-102 ledger 박제 + dashboard 시각 회귀 0 (lineChart :716 의도 변경 외).

---

## 4. 롤백 경로

| Phase | 실패 시 롤백 |
|---|---|
| Phase 1 (G1 FAIL) | `tokens.css` 신규 6 라인 revert. 영향 범위 0. |
| Phase 2 (G2 FAIL) | `chart-tokens.js` 삭제 + HTML `<script>` 태그 제거. 영향 범위 0. |
| Phase 3 (G3 FAIL or 시각 broken) | 해당 호출부만 `git checkout -- <file>`로 라인별 되돌림 (전체 X). helper·tokens는 잔존 — 다음 시도 가능. |
| Phase 4 (G4 FAIL — false-positive 폭증) | scan 모듈 scope를 좁힘 (NewExpression 매칭만, setOption 검출은 별 옵션으로 분리). lint 자체는 유지. |
| Phase 5 (G5 FAIL) | fixture `_meta` 노드만 제거. sessions 배열 무변경. |
| Phase 6 (G6 FAIL — diff 1+) | 차트 init 시 비결정성(타이밍·랜덤·시간 의존) 발견 → 원인 코드 수정 또는 중단 조건 발동(§5 #C-2). |
| Phase 7 (G7 FAIL — pixel diff > 0 예상 외) | Phase 3 swap 전체 revert. tokens.css·helper는 보존 (재시도용). 토큰값과 hex literal 불일치 디버깅 후 재진입. |
| Phase 8 (G8 FAIL — error 승격 후 미검출 위반 발견) | `LINT_ECHARTS_LEVEL=warn` 복귀 + 잔존 위반 별 토픽 분리 박제. D-102의 "1세션 내 ERROR 승격" 시한 미달 — gap 박제. |

**전체 catastrophic rollback 트리거**: VR baseline.bak 손상 + Phase 7 pixel diff > 0 → 토픽 중단 + Master 재소집.

---

## 5. 중단 조건 (재프레이밍 트리거)

| # | 조건 | 대응 |
|---|---|---|
| C-1 | esprima 또는 acorn 모두 npm 설치 거부 (P-1 위반) | 옵션 B (멀티라인 regex + balanced paren) 폴백 — Riki R-1 부분 미수용. Master 재확인 필요. |
| C-2 | Phase 6에서 axis label이 매번 다른 값으로 출력 (시간·랜덤 의존 코드 발견) | 본 토픽 범위 밖 — 별 토픽 분리 (PD-052 후보). PD-050는 "현 fixture로 stability 보장 불가" 박제 후 부분 종결. |
| C-3 | Phase 7에서 pixel diff > 0 (의도 외) 발생, 원인 디버깅이 1세션 초과 예상 | Phase 3 swap 전체 revert + 본 토픽을 framing으로 재분류, child 구현 토픽 분화. Master 메모리 [no_premature_topic_split] 정합 위해 우선 본 세션 내 fix 시도 후 분기. |
| C-4 | Vera spec rev1 §3 토큰값과 실제 호출부 hex 불일치 발견 (P-2 위반) | Phase 3 진입 전 Vera 재소집. spec 재검증 후 tokens.css 수정. |
| C-5 | tokens.css `<link>` 로드가 차트 init보다 늦어 빈 문자열 반환 (P-5 위반) | helper에서 fallback hex 사용 + dashboard-upgrade.html `<head>` 내 link 위치 강제 검증 lint 추가 (보너스 작업, 본 Phase 우선순위 외). |
| C-6 | WARN 단계에서 신규 위반 (Phase 3 swap 후 누군가 hex 직삽) 발견 | Phase 8의 ERROR 승격을 즉시 강제. 1세션 시한이 무의미해진 케이스. |

---

## 6. Self-Audit (sa_rnd 1라운드)

자발적 재검토 1회 — Master 압박 없음.

**재검토 포인트 1: Phase 4의 setOption 정적 hex 검출 범위가 너무 넓은가?**

D-102 안은 "setOption 정적 hex literal" 포함을 명시했으나, dashboard-upgrade.html에 `axisLine.lineStyle.color: '#26262D'`, `tooltip.backgroundColor: '#0B0B0D'` 등 토큰화 대상이 아닌 hex literal이 다수 존재. 이를 모두 FAIL로 잡으면 false-positive 폭증.

**대응**: Phase 4 §6에서 화이트리스트 확장 — tokens.css의 모든 `--c-*` / `--bg-*` / `--text-*` 정의 hex를 화이트리스트에 포함시키되, **차트 컨텍스트 내(`new echarts.graphic.*` + `setOption({...})` 직속 인수)**의 hex만 검사. axisLine 색 등은 토큰화 대상이지만 본 토픽 PD-049 범위 밖 → 별 토픽(PD-051 후보) 분리. WARN으로만 둠.

**재검토 포인트 2: Phase 7의 lineChart α 의도 변경(.20 → .33) 화이트리스트 처리가 자의적인가?**

pixel diff allowance 박제는 회귀 검증 약화 위험 — 누군가 "화이트리스트 영역" 안에 다른 변경을 묻혀 통과시킬 수 있음.

**대응**: 화이트리스트 영역을 **lineChart areaStyle 영역만으로 좌표 박스 박제** (예: `region: { x: 16, y: 320, w: 260, h: 80 }` JSON). 그 밖 영역은 pixel diff 0 강제. 박스 좌표는 기존 baseline의 lineChart 위치에서 추출.

**재검토 포인트 3: 의존 그래프에서 Phase 4를 Phase 3과 병행하는 게 위험한가?**

Phase 4 lint가 Phase 3 swap 검증 도구로 재사용된다는 점은 합리적이나, lint 자체가 미완성인 상태에서 swap 검증에 쓰면 false-negative로 swap 잔존을 놓칠 수 있음.

**대응**: Phase 4의 G4 게이트를 **"swap 이전 6건 검출 + 이후 0건 검출"** 양방향 검증으로 강화 (이미 §3에 반영). 단방향(swap 이후만)으로는 부족.

---

## 7. 권고 요약 (D-102 박제 직전 체크리스트)

- Phase 1~8 분해 완료, 의존 그래프 단방향 + 병렬 가능 지점 2개 박제
- 게이트 G1~G8 + G-final 통과 기준 명시 (특히 G3 grep 잔존 0건, G7 pixel diff 0 — 의도 변경 박스 제외)
- 롤백 경로 8 Phase 별 박제 — Phase 7 catastrophic 트리거만 토픽 중단
- 중단 조건 6건 — 특히 C-1(esprima 거부 시 regex 폴백), C-3(pixel diff > 0 시 framing 재분류 옵션)
- Self-audit 3 라운드 자발적 재검토 — setOption 화이트리스트 정밀화, pixel diff 영역 박스 박제, Phase 4 양방향 검증
- 금지어 v0 준수 — 절대 시간·인력·공수 단위 0건. 구조적 선후 표현만.

D-102 박제 후 Edi 인계.

---

```yaml
# self-scores
aud_rcl: N
str_fd: 5
spc_lck: Y
sa_rnd: 1
```

- `aud_rcl: N` — Master 재호출 압박 없음. 본 재호출은 executionPlanMode=conditional 흐름.
- `str_fd: 5` — 발견 5건: ① Phase 4 setOption scope 정밀화 필요(self-audit #1), ② lineChart α 의도 변경의 pixel diff allowance 영역 박스화(self-audit #2), ③ Phase 4·3 병행 시 G4 양방향 검증 필요(self-audit #3), ④ tokens.css `<link>` 로드 타이밍 (P-5 + C-5), ⑤ WARN→ERROR 1세션 시한 무력화 케이스 C-6.
- `spc_lck: Y` — 본 발언으로 실행계획 spec 동결. Edi 인계 가능 단계.
- `sa_rnd: 1` — §6 자발적 재검토 3 포인트 1라운드 수행.
