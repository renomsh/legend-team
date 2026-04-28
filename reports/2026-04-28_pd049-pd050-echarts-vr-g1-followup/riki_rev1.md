---
role: riki
topic: topic_119
session: session_120
turnId: 1
invocationMode: subagent
date: 2026-04-28
rev: 1
---

# Riki — PD-049/050 리스크 감사

Riki입니다. Master 결정(A1·B1·C1·D1·Vera=Y)에 대해 확신 있는 리스크만 4건. 나머지 후보(theme 전환, dark/light 모드, fixture 자동 갱신, lint perf)는 본 토픽 결정에 영향 약하거나 추측성이라 의도적 제외.

---

### 🔴 R-1. PD-049 A1 검출 사각지대 — `new echarts.graphic.LinearGradient(...)` 내부 hex literal은 잡히지만 동적 주입 패턴은 무차단

**원문 인용 (`app/dashboard-upgrade.html:686`)**:
```
itemStyle:{borderRadius:[3,3,0,0],color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#14B8A6'},{offset:1,color:'#0891B2'}])}
```

A1 (hex/rgba literal만)은 위 라인을 잡는다 — OK. 그러나 다음 회피 패턴은 lint를 통과한다:

1. **변수 인용**: `const c='#14B8A6'; ... color:c` — literal이 색 문자열로 인식되지 않을 위치(JS 변수 선언)에 있으면 ECharts option 객체에서는 토큰 룩업처럼 보인다. lint가 JS 컨텍스트를 안 본다면 declaration line에서 잡힘. 그러나 import/외부 모듈에서 받아오면 무차단.
2. **template literal 합성**: `` color:`#${hex}` `` — A1이 정규식 `#[0-9A-Fa-f]{6}` 라면 `#${...}` 패턴은 미스.
3. **theme 객체 spread**: `color: theme.gradient` — theme이 JS object로 hex를 품고 있으면 사용 시점엔 lint 통과.
4. **배열/객체 분리**: `const stops=[{offset:0,color:'#F472B6'},...]; ...color:new LinearGradient(0,0,0,1,stops)` — stops 라인은 잡히지만 분리 정도가 깊으면 lint rule이 ECharts API 호출 컨텍스트가 아닌 일반 hex로 분류 → 메시지가 부정확해 무시될 위험.

**파손 범위**: 281건의 hex/rgba 중 진짜 ECharts 동적 주입은 일부. 나머지 정적 CSS literal은 PD-049 범주가 아닌데 같은 룰에 잡혀 노이즈만 늘고, 정작 회피 패턴(`'#${hex}'`, theme 객체)은 통과.

**완화 조건**:
- (a) lint rule scope를 ECharts API 호출 인근(±3 line)으로 제한해 false-positive 줄이기. 또는
- (b) literal hex 전수가 아니라 `new echarts.graphic.*` / `option.color` / `itemStyle.color` AST 매칭 우선. A1 "좁음"이 표면 정규식이 아니라 **AST 기반 좁음**이어야 의미.

Master에게 확인 필요: A1 = "정규식 hex/rgba" 인가, "ECharts API 컨텍스트 hex/rgba" 인가. 후자가 아니면 R-1 발현.

---

### 🟡 R-2. B1 WARN-only + 위반 5건+ 잔존 = "alert fatigue" → 사실상 무시

WARN만 출력하면 빌드 통과 → CI green → 누구도 안 본다. 특히 5건 이상이면 첫 출력만 보고 "원래 있던 것" 처리. 6개월 후 신규 violation이 묻혀 베이스라인이 늘어나는 패턴은 lint 시스템 일반 실패 모드.

**완화 조건 (둘 중 하나 필수)**:
- (a) **baseline 락**: 현재 위반 N건을 `.lint-baseline.json`에 박제, 그 이상 늘면 ERROR 승격. 줄어들면 baseline 자동 갱신 PR.
- (b) **시한 ERROR 승격**: WARN 단계 D+30(또는 N세션 후) 자동 ERROR. 결정문에 sunset 박제.

둘 다 없으면 B1 = "결정 박제했지만 효과 없음" 죽은 룰. Master에게 (a)/(b) 중 택1 권장.

---

### 🟡 R-3. C1 axis-only fixture — 범례·tooltip 미커버는 정당하나, axis label 자체의 데이터 의존성이 anchor를 깰 위험

ECharts 범례는 series 변경 시 자동 갱신이라 fixture에 박제할 anchor가 불안정 — Master 결정 C1(axis label만)은 합리적. 그러나:

**원문 인용 (`app/dashboard-upgrade.html:679`)**:
```
xAxis:{type:'category',data:ids,axisLine:{lineStyle:{color:'#26262D'}},axisLabel:{color:'#6E6E78',fontSize:9,rotate:45}}
```

여기서 `data:ids`는 동적 세션 ID 배열. axis label 텍스트가 매 빌드마다 달라지면 VR baseline diff에 axis label 영역이 항상 다름 → fixture로 anchor 못 잡음.

**완화 조건**:
- fixture 모드에서 `data:ids`를 고정 stub(예: `['s001','s002',...,'s012']`)으로 주입하는 데이터 freeze 메커니즘 필요. 그렇지 않으면 "fixture로 axis label drift 잡는다"는 PD-050 목표가 무효.
- `tests/vr/fixtures/dashboard.mock.json`이 이미 존재하는데, 색 토큰뿐 아니라 axis category data까지 freeze하는지 확인 필요. 단순 색 매핑만 mock하면 R-3 발현.

Dev/Vera 작업 시 **fixture가 색·축 데이터·계열 길이 3축 모두 freeze**해야 한다고 명시할 것.

---

### 🟡 R-4. D1 단일 토픽 + 위반 5건 즉시 토큰화 → dashboard-upgrade VR 24 baseline 재캡처 필수, 회귀 위험 누적

Master 메모리 인용: "구현은 3세션 이내 원칙" + "dashboard-upgrade 템플릿 canonical".

본 토픽 작업 합산:
- PD-049 lint rule 신규 + tokens.css 확장
- PD-050 fixture 추가 + fixture freeze 메커니즘(R-3)
- 위반 5건+ 즉시 토큰화 (gradient hex 포함)
- index.html 5건 role-card linear-gradient 수정
- dashboard-upgrade ECharts itemStyle 2건 수정
- VR 24 baseline 전수 재캡처 (gradient pixel diff 발생)
- Vera = 색 토큰 정의 책임

**파손 범위**: 토큰 값이 기존 `#14B8A6` → `var(--teal-500)` 매핑인데 Vera가 토큰 값을 살짝 조정하면(예: `#14B8A6` → `#15B7A8`) baseline 24장 전수 재캡처 + 시각 회귀 가능성. Master canonical 페이지 색이 바뀌는 셈.

**완화 조건**:
- **1단계**: Vera 토큰 정의는 **기존 hex 값과 1:1 동일**해야 한다. 색 보정·재디자인은 본 토픽 out-of-scope. 별도 토픽.
- **2단계**: 토큰화 후 첫 번째 baseline 캡처 직후 **pixel-perfect diff 0** 검증 게이트. 1px이라도 다르면 토큰 값 오류 → rollback.
- 3세션 내 완결 가능성: lint(1세션) + 토큰화·baseline(1세션) + fixture·검증(1세션) — 빠듯하지만 Vera 색 결정이 1단계 제약(기존값 동일)이면 가능. Vera에게 "신규 디자인 금지, 추출만" 명시 필요.

---

## 의도적 제외 (개수 채우기 금지)

- **dark/light 테마 전환 영향**: 본 토픽 범주 아님, 추측성.
- **lint 성능**: hex 정규식 280건 매칭은 ms 단위. 무의미.
- **theme.json 도입 권유**: D1 단일 토픽 결정 위반, 본 토픽에선 out.
- **A1 vs A2 재논쟁**: Master 결정 끝남.

확인된 추가 리스크 없음. 위 4건이 실제 리스크.

---

## 종합 권고

Master 결정 4건은 방향 OK. 단 **R-1·R-2 mitigation 없으면 PD-049는 통과해도 효과 없음**. Ace 종합검토 단계에서 두 mitigation을 결정문에 함께 박제 권장:

1. A1 scope = AST 기반 ECharts 컨텍스트 좁힘 (단순 정규식 아님)
2. B1 = baseline lock 또는 sunset ERROR 승격 시한 명시
3. C1 fixture = 색·axis 데이터·계열 길이 3축 freeze
4. D1 토큰화 = 기존 hex 값 1:1 동일, 색 재정의는 별도 토픽

```yaml
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.20
```
