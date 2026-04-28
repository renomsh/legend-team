---
role: arki
rev: 1
turnId: 0
invocationMode: subagent
topic: topic_119
session: session_120
grade: B
date: 2026-04-28
parentDecision: D-089/D-091 (topic_104)
scope: PD-049 ECharts 동적 색 주입 + PD-050 VR fixture axis label 확장 (구조 분석)
mode: structure-only (실행계획은 종합검토 후 재호출)
---

# Arki rev1 — PD-049 / PD-050 / dashboard-upgrade 5건 위반 (구조 분석)

구조 설계자 Arki입니다. 축 결정(A1/B1/C1/D1) 전제로 단일 토픽 안에서 끝까지 가는 설계만 제시합니다. 실행계획은 종합검토 후 재호출 시 별도 박제.

---

## 0. 핵심 전제 (🔴 즉시 검증)

| 전제 | 검증 |
|---|---|
| dashboard-upgrade.html 5건 + index.html 1건 = 총 6건 위반이 PD-049 1차 타겟 | Grep 확인 — `LinearGradient(...)` 인수 안의 hex/rgba literal 6개 (제목에 5+1) |
| tokens.css는 이미 `--grad-violet/teal/amber/rose` 4종 보유 | 확인 — 단 ECharts가 CSS gradient 문자열을 직접 못 먹음 (stop[] 배열 필요) |
| VR fixture는 `tests/vr/fixtures/dashboard.mock.json` 1파일 + KPI 숫자/세션배열 위주 | 확인 — axis 카테고리는 `sessions[].sessionId` 파생, 정적 라벨은 거의 없음 |
| G1 lint 인프라 존재 (`scan-inline-root` → `lint-inline-root-color`) | 확인 — PD-049 lint도 같은 패턴으로 합류 가능 |

전제 모두 OK. 설계 진입.

---

## 1. PD-049 — ECharts 동적 색 주입 검출 패턴 (A1 좁음)

### 1-1. 검출 범위 정확히 못박기

**대상 위치 (3축 AND):**
1. **파일**: `app/*.html` 중 `dump.active === true` (legacy/archive 제외, 기존 lint와 동일 기준)
2. **컨테이너**: `<script>` 블록 내부만 (CSS·HTML 본문 제외 — 그쪽은 `lint-inline-root-color`가 담당)
3. **호출 지점**: `new echarts.graphic.LinearGradient(` 인수 리터럴 + `echarts.graphic.RadialGradient(` (방어용)

**범위 밖 (의도적):**
- `setOption({...})` 객체 전반의 모든 hex (axisLine·splitLine·tooltip 등) — A1 좁음 결정에 따라 **제외**.
- ECharts API 외부의 일반 hex literal (인라인 `style="background:#xxx"`) — 이미 다른 lint 또는 정책 밖.
- color 변수에 hex 할당 후 LinearGradient에 변수 전달하는 케이스 — A1 범위에서 **WARN만**, FAIL 아님.

이유: A1 좁음 = "확실한 실위반만 잡는다". setOption 전반 스캔은 false-positive 폭증 위험(`tooltip backgroundColor:'#0B0B0D'` 같이 디자인 토큰화 안 하기로 한 것까지 잡힘).

### 1-2. regex vs AST 옵션

| 옵션 | 장 | 단 | 권고 |
|---|---|---|---|
| **A. Pure regex** — `LinearGradient\([^)]*\)` 추출 후 내부에서 `#[0-9a-fA-F]{3,8}` / `rgba?\(` 매칭 | 의존성 0, 50줄 미만 | 다중 라인 LinearGradient 인수에서 `[^)]*`가 약함, 중첩 괄호 X | C |
| **B. 멀티라인 regex + balanced paren scanner** | 의존성 0, 정확도 향상, AST 학습비용 0 | 코드량 ~120줄, 코너케이스 직접 처리 | **권고** |
| **C. AST (acorn)** — `<script>` 추출 후 acorn parse, NewExpression('echarts.graphic.LinearGradient') 트리 워킹 | 정확, 변수추적 가능 | acorn 의존성 추가, HTML→script 추출 단계 필요, 단일 토픽 안 완결 어려움 | X |

**권고: B (멀티라인 regex + balanced paren scanner)**

근거 — 검출 대상이 **하나의 함수 호출 패턴 1종**으로 좁혀져 있음(`LinearGradient`). AST의 가치가 발휘되는 것은 변수 추적·call graph 분석이 필요할 때인데, A1 좁음 결정으로 그 부분이 잘려나감. Rich Hickey 식: "AST는 단순함이 아니라 쉬움(easy). 짓지 않을 수 있으면 짓지 않는다."

스캔 흐름:
```
1. <script>...</script> 블록 추출 (기존 scan-inline-root 인프라 재사용 가능)
2. 블록 내부에서 `new echarts.graphic.LinearGradient(` 시작점 찾기
3. 시작점부터 괄호 균형 카운트로 인수 종료 위치 확정
4. 그 인수 substring에서:
   - `#[0-9a-fA-F]{3,8}\b` → FAIL (단, 화이트리스트 토큰값과 일치하면 WARN)
   - `rgba?\([^)]*\)` → FAIL
   - `color\+'[0-9a-fA-F]{2}'` 같은 alpha 첨가 패턴 → WARN (B1 — 변수 기반은 OK이나 alpha 리터럴 직삽은 의심)
5. line 번호 추적 (LinearGradient 시작 line)
```

### 1-3. literal 패턴 명세

| 패턴 | regex | 등급 | 비고 |
|---|---|---|---|
| Hex 3·6·8자 | `#[0-9a-fA-F]{3}\b\|#[0-9a-fA-F]{6}\b\|#[0-9a-fA-F]{8}\b` | FAIL | 8자(alpha) 포함 |
| rgb/rgba | `rgba?\(\s*\d+` | FAIL | 함수형 색 |
| Named color | (제외) | — | 사용 사례 0건, scope creep 차단 |
| 변수 + alpha 첨가 (`color+'55'`) | `\w+\s*\+\s*['"][0-9a-fA-F]{2}['"]` | WARN | dashboard-upgrade.html:792 spark() 케이스 |

named color는 코드베이스에 없음(grep 확인). 짓지 않음 옵션 채택.

### 1-4. tokens.css 화이트리스트 매칭

**동작**: 검출된 hex가 tokens.css의 `--c-*` / `--grad-*` stop hex 와 동일하면 WARN으로 강등 (FAIL 아님).

**파싱 방식**: tokens.css를 정규식으로 line scan — `--([a-z][\w-]*)\s*:\s*#[0-9a-fA-F]+`. CSS parser 도입 X. linear-gradient 내부 hex도 같은 regex가 잡음.

**효과**:
- `#8B5CF6` (= `--c-ace`) 직접 사용 → WARN (이미 토큰 등록된 색이므로 마이그레이션 1:1 자명)
- `#F472B6` (= `--c-vera`) → WARN
- `#0891B2` (= `--grad-teal` stop 0) → WARN
- 토큰에 없는 hex → FAIL (Vera에게 토큰 추가 의사결정 필요 신호)

이 등급 분리가 Vera 인계 우선순위 자동 정렬을 만든다. WARN은 Dev 단순 swap, FAIL은 Vera 토큰 spec 의사결정 필요.

### 1-5. 짓지 않음 옵션 (검토 후 기각)

"PD-049 자체 폐기 — gradient 6건 그냥 hex 둔다."
- 폐기 사유 후보: 6건 = 작음, gradient는 디자인 토큰 1차 타겟 아님(stop 배열은 ECharts 전용 문법).
- 기각 이유: D-089(VR 인프라)·D-091(G1 lint)이 이미 "단일 출처" 원칙을 박았는데, `new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#14B8A6'},{offset:1,color:'#0891B2'}])`는 그 원칙의 **가장 가시적 위반**. 토큰 시스템을 들였는데 차트 색만 예외인 것은 시스템 신뢰도 훼손. 진행.

---

## 2. PD-050 — VR fixture axis label 확장 (C1 axis label만)

### 2-1. 현 fixture 구조 진단

`tests/vr/fixtures/dashboard.mock.json` (단일 파일, 102 sessions × ~15 fields) 확인.
- 정적: `totalSessions`, `metrics.avgMasterTurns`, `gradeDistribution.{S,A,B,C}` 등 KPI 숫자
- 동적: `sessions[].sessionId` 배열 → ECharts xAxis category가 여기서 파생됨
- 정적 axis label 텍스트는 fixture에 **없음** (heroChart는 `axisLabel: { show: false }`, efficiencyChart는 `name:'Size'/'Cache%'` 가 코드 inline literal)

### 2-2. ECharts 차트별 axis label 분류

| 차트 | 위치 | xAxis label 출처 | yAxis label 출처 | 결정점(deterministic) |
|---|---|---|---|---|
| heroChart | dashboard-upgrade:653 | `sessions[].sessionId.slice(-3)` (fixture 의존) | show:false | sessions 배열 길이·끝 3자리 |
| efficiencyChart | dashboard-upgrade:669 | sessionId.slice(-3) (fixture) | name:'Size'/'Cache%' (코드 inline) | sessions 배열 + name 문자열 |
| lineChart | dashboard-upgrade:696 | sessionId.replace('session_','S') (fixture) | (없음) | sessions 배열 |
| spark (다수) | dashboard-upgrade:780 | show:false | show:false | 없음(미니 차트) |
| index hero bar | index.html:334 | sessions 파생 | show:false | sessions 배열 |

### 2-3. axis label fixture 추가 위치 명세

C1 좁음 = "axis label만". 두 부류로 분리:

**(가) 데이터 의존 axis label (xAxis category)**
- 이미 fixture sessions[]에서 deterministic하게 나옴. **추가 작업 없음.**
- VR 스냅샷에서 깜빡임이 있다면 fixture sessions 배열을 102개로 고정한 것이 원인이 아니라 차트 렌더 타이밍 문제 — 이건 PD-050 범위 밖.

**(나) 코드 inline 정적 label (yAxis name 등)**
- `name:'Size'`, `name:'Cache%'`, markLine `formatter: avg ${avg}` 등.
- 이것들이 **고정 텍스트라면** fixture 안 거치고 그대로 둠 (deterministic).
- `avg ${avg}` 같이 데이터 의존 동적 텍스트 → fixture `metrics.avgMasterTurns` 이미 고정되어 있어 OK.

**결론**: PD-050 실작업은 **"fixture에 axis label 전용 섹션 추가"가 아니라 "현 fixture가 axis label을 deterministic하게 결정하는지 검증·박제"**. 본질이 검출(detection)임.

### 2-4. 설계 옵션 (3개)

| 옵션 | 내용 | 장 | 단 | 권고 |
|---|---|---|---|---|
| **α. Fixture 확장형** | fixture에 `axisLabels: { hero: [...], efficiency: {...} }` 신규 노드 추가, 차트 코드를 fixture-aware로 리팩터 | 명시적, 데이터 driven 일관성 | 코드 수정 범위 큼, A1 좁음 정신과 충돌(C1도 좁음) | X |
| **β. Snapshot stability check** | 새 스크립트 `verify-axis-label-stability.ts` — fixture 로드된 페이지 두 번 렌더해서 axis label 추출이 동일한지 비교만 | 코드 수정 0건, fixture 1줄도 안 건드림, 본질 검증 | "추가"가 아니라 "검증"이라 작업 라벨이 PD-050 표제와 미묘하게 어긋남 | **권고** |
| **γ. 짓지 않음** | PD-050 폐기, "현 fixture로 충분"이라고 박제 | 최소 작업 | D-089 VR 인프라가 axis label 결정성을 명시적으로 보장한 적 없음, 추후 회귀 위험 | 차선 |

**권고: β (Snapshot stability check)**

근거:
- "Master 결정 C1 = axis label만"의 의도를 가장 좁게 해석. fixture를 바꾸지 않고 axis label deterministic 여부만 박제.
- 코드 수정 0건 → topic_119 단일 세션 완결 가능성 ↑ (구현은 3세션 이내 원칙, session_094 피드백).
- 부산물: 이 스크립트가 PD-049 변경 후 회귀 테스트로도 재사용됨 (gradient 토큰화하면 axis label에 영향 없음을 자동 검증).

### 2-5. deterministic anchor 정의

- **xAxis category**: `JSON.stringify(fixture.sessions.map(s=>s.sessionId.slice(-3)))` 가 두 번 호출에서 동일
- **yAxis name**: 코드 literal — 정의상 deterministic, 검증 불필요
- **markLine label**: `fixture.metrics.avgMasterTurns` 단일 값 → deterministic
- **time-based label 없음 확인**: `new Date()` / `Date.now()` 가 chart label 형성에 쓰이는지 grep — 0건이어야 PASS

stability check가 잡을 수 있는 실 위험: 누군가 `axisLabel: { formatter: () => new Date().toLocaleString() }` 같은 시간 의존 코드를 추가하는 경우.

---

## 3. dashboard-upgrade 5건 + index 1건 = 총 6건 위반 조치 구조 (Vera 인계 spec)

### 3-1. 위반 hex 인벤토리

| 파일:line | LinearGradient 용도 | stop 0 | stop 1 | 토큰 매핑 후보 |
|---|---|---|---|---|
| dashboard-upgrade:662 | heroChart bar (size) | `#F472B6` | `#8B5CF6` | `--c-vera` → `--c-ace` (역할 색 재사용 OK?) |
| dashboard-upgrade:686 | efficiencyChart bar (size) | `#14B8A6` | `#0891B2` | `--grad-teal` 의 두 stop |
| dashboard-upgrade:716 | lineChart areaStyle (자동) | `rgba(139,92,246,.2)` | `rgba(139,92,246,0)` | `--c-ace` + alpha 12/0 (3-tier alpha와 어긋남) |
| dashboard-upgrade:792 | spark areaStyle (재사용) | `color+'55'` | `color+'00'` | 변수 기반(WARN) — alpha hex 직삽이 문제 |
| dashboard-upgrade:534† | (legacy archive) | — | — | 범위 밖 |
| index:340 | hero bar | `#F472B6` | `#8B5CF6` | line 662와 동일 패턴 — 공통 helper 후보 |

†: legacy/archive는 active=false라 lint 범위 밖. 정합 차원 언급만.

### 3-2. 핵심 spec 질문 (Vera 의사결정 필요 — 종합검토에서 박제)

**Q1. gradient stop 토큰 vs 단일 색 토큰?**

옵션 분석:
- **(i)** 기존 `--grad-teal`(CSS linear-gradient 문자열) 재사용 → ECharts가 CSS gradient 문자열 못 먹어서 **불가**. 같은 hex를 두 번 정의하게 됨.
- **(ii)** stop 단위 토큰 신설: `--c-grad-teal-0: #14B8A6; --c-grad-teal-1: #0891B2;` → ECharts에서 `getComputedStyle(document.documentElement).getPropertyValue('--c-grad-teal-0').trim()` 으로 주입 가능. tokens.css가 단일 출처 유지.
- **(iii)** JS 측에 gradient 헬퍼: `function echGrad(name) { ... }` — tokens.css에서 stop hex 읽어 LinearGradient 객체 빌드.

**권고: (ii) + (iii) 결합.** stop 토큰을 tokens.css에 박고, helper 함수 1개로 호출부 통일. 호출부 6건이 `echGrad('teal')` 1줄로 줄어듦.

**Q2. role color를 gradient stop으로 재사용 OK?**

- heroChart의 `#F472B6`(=`--c-vera`) + `#8B5CF6`(=`--c-ace`) 조합 — Vera·Ace 두 역할 색의 시맨틱 의미가 hero 차트 그라디언트와 무관함. 이것이 **의미적 noise**인가 **단순 색 재사용**인가가 Vera 결정 사항.
- 권고: hero용 **별도 gradient 토큰** (`--c-grad-hero-0/1`) 신설. role 색은 role 차트(역할 빈도 막대)에만 의미 부여. 같은 hex값이라도 토큰 이름이 시맨틱을 결정.

**Q3. alpha 3-tier(0.12/0.18/0.25)와 lineChart areaStyle alpha(.2/0)의 충돌?**

- 현 코드 `rgba(139,92,246,.2)` = alpha 0.2 → 3-tier에 없음(0.18 또는 0.25 중 하나로 정렬 필요)
- 권고: 0.18로 정렬 (alpha-2). gradient 끝점은 0(완전 투명) 유지 — 이건 alpha tier 밖.

### 3-3. spec 동결 가능 항목 (Phase 분해 직전 단계)

종합검토 후 Vera 결정만 받으면 다음을 spec 동결할 수 있음:

```
tokens.css 추가 (안):
  --c-grad-hero-0:    #F472B6   /* heroChart bar stop 0 */
  --c-grad-hero-1:    #8B5CF6   /* heroChart bar stop 1 */
  --c-grad-teal-0:    #14B8A6   /* efficiencyChart bar stop 0 */
  --c-grad-teal-1:    #0891B2   /* efficiencyChart bar stop 1 */
  --c-grad-auto-fade: #8B5CF6   /* lineChart areaStyle base (= c-ace 동일) */
  /* alpha는 --alpha-2 (0.18) 재사용, gradient 끝점은 0 */

JS helper (app/js/echarts-tokens.js 신설):
  export function echGrad(stop0Var, stop1Var) {
    const cs = getComputedStyle(document.documentElement);
    return new echarts.graphic.LinearGradient(0,0,0,1,[
      { offset: 0, color: cs.getPropertyValue(stop0Var).trim() },
      { offset: 1, color: cs.getPropertyValue(stop1Var).trim() }
    ]);
  }
  export function echFade(varName, alphaVar) { ... }
```

호출부 6건 마이그레이션 1:1 매핑 자명. spec lock 가능.

---

## 4. G1 lint·VR 인프라 통합 지점

### 4-1. lint 측 통합

기존 `scripts/lint-inline-root-color.ts` 옆에 신설:
- `scripts/scan-echarts-gradient.ts` — 재사용 가능 callable export (scan-inline-root와 대칭)
- `scripts/lint-echarts-gradient.ts` — 위 호출, exit 0/1

**병합 옵션 검토**: 단일 lint(`lint-design-tokens.ts`)로 통합? — 권고 X. 두 lint는 검출 도메인이 다름(`<style>:root{}` vs `<script>` ECharts API 호출). Hickey 원칙: 분리된 책임은 분리 유지. 호출부에서 두 개 차례로 부르면 됨(build.js).

### 4-2. VR 인프라 측 통합

PD-050의 stability check는 D-089 VR 인프라 위에 얹기:
- `tests/vr/verify-axis-label-stability.ts` — 두 번 렌더 후 axis label DOM 추출(`.echarts-tooltip` 제외, `<text>` SVG 노드만), 비교
- 기존 `tests/vr/baseline/` 디렉토리 활용 — baseline에 axis label JSON dump도 같이 박제하면 회귀 추적 자동화

### 4-3. 의존 그래프 (구조적 선후만, 시간 표현 X)

```
Vera spec lock(Q1/Q2/Q3) 
   ↓
tokens.css gradient/fade 추가 + echarts-tokens.js helper 신설
   ↓
호출부 6건 swap (호출부 1줄로 축소)
   ↓
scan-echarts-gradient.ts + lint-echarts-gradient.ts 작성
   ↓
build.js에 lint 체인 추가 (lint-inline-root-color → lint-echarts-gradient → lint-contrast → lint-accent-only)
   ↓
verify-axis-label-stability.ts 작성 (병행 가능, swap 후 회귀 검증으로 재사용)
   ↓
6건 swap 결과 lint PASS 확인 + VR baseline 갱신 (의도된 시각적 변화 0)
```

---

## 5. 경계 조건 (구조가 깨지는 조건)

| # | 조건 | 영향 |
|---|---|---|
| 1 | `getComputedStyle(document.documentElement)` 가 ECharts init 시점에 tokens.css 미로드 | hex 빈 문자열 → ECharts 검은색 fallback. 대응: helper 안에서 빈 값일 경우 throw + tokens.css `<link>` 가 차트 init보다 먼저인지 build.js에서 검증 |
| 2 | 다중 라인 LinearGradient 인수에 주석으로 `#000` 포함 | regex가 주석 내부 hex를 FAIL로 잡음. 대응: 인수 substring에서 `//` `/* */` 1차 strip |
| 3 | tokens.css 화이트리스트가 stop hex를 잡으려면 `linear-gradient(...)` 내부도 스캔해야 함 | 단순 line regex로 충분 (linear-gradient 함수 안 hex도 동일 line) — 현 권고 OK |
| 4 | A1 좁음 결정의 후행 압박: 1개월 후 setOption 전반 hex도 잡자 결정될 가능성 | 별 토픽으로 분리 (PD-051 후보). 본 토픽 안 끝까지 가는 원칙(D-074 B grade) 준수 |
| 5 | `color+'55'` WARN 케이스 대응을 미루면 spark() 함수 안 alpha 직삽이 잔존 | WARN으로만 두면 build PASS — Master 결정 B1(WARN) 정합. 후행 토픽 또는 본 세션 내 보너스 swap 둘 다 가능 |
| 6 | VR stability check가 baseline에 의존하는데 baseline이 손상된 상태 | `tests/vr/baseline.bak` 존재 확인 — 복구 가능 |

---

## 6. 권고 요약 (Master 의사결정 직전 체크리스트)

- **PD-049 검출 방식**: 옵션 B (멀티라인 regex + balanced paren), AST는 짓지 않음
- **PD-049 화이트리스트**: tokens.css `--c-*` / `--grad-*` stop 매칭 시 WARN, 외엔 FAIL
- **PD-050 방식**: 옵션 β (snapshot stability check), fixture 추가 0건
- **6건 위반 조치**: stop 단위 토큰 + `echGrad(varA, varB)` helper, 호출부 1줄로 축소
- **Vera 결정 필요 3건**: Q1(stop 토큰 명명), Q2(role 색 재사용 의미), Q3(alpha 3-tier 정렬)
- **lint 통합**: 기존 lint와 병렬 신설(병합 X)
- **경계조건 6건** 박제 — 특히 #1(tokens.css 로드 타이밍), #2(주석 내 hex)

종합검토 후 재호출 시 Phase 분해·게이트·롤백 박제 예정. 본 발언은 구조 분석까지.

---

```yaml
# self-scores
aud_rcl: N
str_fd: 4
spc_lck: Y
sa_rnd: 1
```

- `aud_rcl: N` — Master 재호출 압박 없음(첫 발언)
- `str_fd: 4` — 발견 4건: ① CSS gradient 문자열 ECharts 부적합, ② role color noise, ③ alpha 3-tier 불일치, ④ tokens.css 로드 타이밍 boundary
- `spc_lck: Y` — Vera 결정 3건만 받으면 즉시 spec 동결 가능 단계까지 도달
- `sa_rnd: 1` — 짓지 않음 옵션(PD-050 γ, lint 병합) 자발적 재검토 1라운드
