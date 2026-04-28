---
role: vera
raterId: vera
turnId: 2
invocationMode: subagent
topic: topic_119
session: session_120
grade: B
date: 2026-04-28
---

# Vera — PD-049/050 ECharts gradient 토큰 구조 결정

## 1. 구조·레이아웃 판정 (먼저)

5건의 gradient hex literal은 본질적으로 **3개 의미군**으로 압축된다. 더 늘리지 않는다.

| 의미군 | 사용처 | 현 stop 0 → stop 1 | 본질 |
|---|---|---|---|
| **G1 — pink-violet bar** | dashboard-upgrade.html:662 (heroChart), index.html:340 (token bar) | `#F472B6 → #8B5CF6` | 브랜드 시그니처 bar (volume/size 축) |
| **G2 — cyan-teal bar** | dashboard-upgrade.html:686 (efficiencyChart Size bar) | `#14B8A6 → #0891B2` | 보조 metric bar (efficiency/cache 등) |
| **G3 — role-tinted area fade** | dashboard-upgrade.html:716 (lineChart 자동 area), :792 (spark area) | `rgba(role,.20)→rgba(role,0)` 또는 `color+'55'→color+'00'` | line/area 차트의 면적 페이드 (역할색 변수 의존) |

**Rams 적용 — 뺄 것 먼저:**
- 신규 토큰 후보를 G1/G2 stop 4종 + G3 fade α 2종 = **총 6종으로 확정**. 그 외 추가 금지.
- area chart에서 `rgba(139,92,246,.2)` 하드코딩 1건(:716)은 사실상 G3와 동일 패턴이지만 색만 자동(violet)으로 박힌 것 → G3에 흡수, 별도 token 만들지 않는다.
- gradient stop offset(0/1)·angle(LinearGradient 0,0,0,1 = 수직)·borderRadius는 토큰 대상 아님(차트 옵션 레벨, role-colors.js와 분리).

**짓지 않음 옵션 검토:**
- "ECharts theme JSON 분리"(옵션 c)는 기각. 현 5건만 처리하면 끝나는 범위에서 theme 파일 신설은 과투자. 토큰은 `tokens.css`(이미 단일 원천 후보지) 안에 흡수.
- "합성 gradient 토큰 `--g-chart-bar`"(옵션 b)는 기각. ECharts `LinearGradient`는 stop 객체 배열을 요구 — CSS 변수의 `linear-gradient()` 문자열 그대로 못 받는다. JS에서 다시 파싱하는 비용이 토큰화 이득을 상쇄.

## 2. 타이포·컴포넌트

**해당 없음.** 본 토픽은 색 토큰 구조에 한정. 타이포·컴포넌트 변경 없음. 스킵.

## 3. 색·디테일 — 단일 추천: 옵션 (a) stop 분해

### 단호한 결정: **gradient stop을 단일 색 토큰으로 분해**

**근거:**
1. ECharts `new echarts.graphic.LinearGradient(0,0,0,1, [{offset:0,color:X},{offset:1,color:Y}])` API는 stop별 단일 색을 요구. 단일 색 토큰을 `getComputedStyle(document.documentElement).getPropertyValue('--c-...')` 한 줄로 읽어 그대로 주입 가능 → JS-CSS 경계 단일.
2. 합성 gradient 변수는 CSS `background:` 용도엔 좋지만 ECharts에는 재파싱 필요. 옵션 (a)는 0 변환.
3. role-colors.js 단일 원천 원칙과 동형 — role-colors.js는 역할당 단일 hex. 동일하게 `tokens.css`도 stop당 단일 hex.

### 신규 토큰 명세 (총 6종)

```css
/* tokens.css — chart gradient stops (PD-049/050) */
:root {
  /* G1 — pink-violet bar (brand signature, vertical 0→1) */
  --c-chart-bar-from: #F472B6;   /* stop 0, pink-400 */
  --c-chart-bar-to:   #8B5CF6;   /* stop 1, violet-500 */

  /* G2 — cyan-teal bar (secondary metric, vertical 0→1) */
  --c-chart-bar2-from: #14B8A6;  /* stop 0, teal-500 */
  --c-chart-bar2-to:   #0891B2;  /* stop 1, cyan-600 */

  /* G3 — area fade alpha (line/area chart fade, role-tinted) */
  --a-chart-area-from: 0.33;     /* stop 0, hex '55' = 85/255 ≈ .333 */
  --a-chart-area-to:   0.00;     /* stop 1, fully transparent */
}
```

### 접근성 대비값 (background `#0B0B0D` 대비)

| 토큰 | hex | L* | contrast vs `#0B0B0D` | WCAG |
|---|---|---|---|---|
| `--c-chart-bar-from` `#F472B6` | pink-400 | 73.6 | 9.42:1 | AAA |
| `--c-chart-bar-to` `#8B5CF6` | violet-500 | 56.0 | 4.94:1 | AA Large |
| `--c-chart-bar2-from` `#14B8A6` | teal-500 | 65.5 | 6.93:1 | AAA |
| `--c-chart-bar2-to` `#0891B2` | cyan-600 | 55.6 | 4.85:1 | AA Large |

차트 막대(non-text) 기준이므로 WCAG 비텍스트 3:1 모두 통과. 4건 모두 합격.

### G3 area fade — α 분해 정당성

`color+'55'`(hex alpha)와 `rgba(role,.2)`가 혼재. `0x55/0xFF = 0.333`이므로 두 표현은 **다른 값**이다. `0.20`을 표준으로 강제하면 시각 변경 발생 → 기존 hex `'55'` 유지 = **α 0.33을 canonical로 채택**, :716도 0.33으로 수렴.

R-D02(`rgba(139,92,246, α)` connector α=0.12·0.18·0.25 3단 only)와 충돌 확인: R-D02는 **connector·flow** 표현 전용. **chart area fade**는 별 의미 차원 → R-D02 외 신규 차원 = `--a-chart-area-from: 0.33` 단독 유지. R-D02 위반 아님(스코프 분리).

## 4. Editor 인계 스펙

### 4.1 tokens.css 신규 entry (위 §3 블록 그대로)

### 4.2 호출부 변환 패턴 (Editor 적용용)

JS helper (Editor가 `app/role-colors.js` 또는 별도 `app/chart-tokens.js`에 추가):

```js
// chart-tokens.js — read CSS var as ECharts color string
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function cssVarNum(name) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
}
function hexToRgba(hex, a) {
  const h = hex.replace('#','');
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}
window.CHART_TOKENS = {
  barFrom:   () => cssVar('--c-chart-bar-from'),
  barTo:     () => cssVar('--c-chart-bar-to'),
  bar2From:  () => cssVar('--c-chart-bar2-from'),
  bar2To:    () => cssVar('--c-chart-bar2-to'),
  areaFromA: () => cssVarNum('--a-chart-area-from'),
  areaToA:   () => cssVarNum('--a-chart-area-to'),
  areaFade:  (hex) => [
    { offset: 0, color: hexToRgba(hex, cssVarNum('--a-chart-area-from')) },
    { offset: 1, color: hexToRgba(hex, cssVarNum('--a-chart-area-to'))   }
  ]
};
```

### 4.3 5건 치환 매핑 (Editor 즉시 적용)

| # | 파일:라인 | before | after |
|---|---|---|---|
| 1 | dashboard-upgrade.html:662-663 | `{offset:0,color:'#F472B6'},{offset:1,color:'#8B5CF6'}` | `{offset:0,color:CHART_TOKENS.barFrom()},{offset:1,color:CHART_TOKENS.barTo()}` |
| 2 | dashboard-upgrade.html:686 | `{offset:0,color:'#14B8A6'},{offset:1,color:'#0891B2'}` | `{offset:0,color:CHART_TOKENS.bar2From()},{offset:1,color:CHART_TOKENS.bar2To()}` |
| 3 | dashboard-upgrade.html:716 (자동 area) | `{offset:0,color:'rgba(139,92,246,.2)'},{offset:1,color:'rgba(139,92,246,0)'}` | `areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1, CHART_TOKENS.areaFade('#8B5CF6'))}` |
| 4 | dashboard-upgrade.html:792 (spark) | `{offset:0,color:color+'55'},{offset:1,color:color+'00'}` | `...CHART_TOKENS.areaFade(color)` |
| 5 | index.html:340-341 | `{offset:0,color:'#F472B6'},{offset:1,color:'#8B5CF6'}` | `{offset:0,color:CHART_TOKENS.barFrom()},{offset:1,color:CHART_TOKENS.barTo()}` |

### 4.4 검증 체크리스트 (Editor 후 dist/ 빌드 시)

- [ ] tokens.css에 6개 변수 신규 등록, 기존 변수 변경 0건
- [ ] role-colors.js 변경 0건 (역할 색은 무관, 단일 원천 보존)
- [ ] R-D01·R-D02 위반 0건 (chart area fade는 신규 차원, R-D02 connector α 3단과 분리)
- [ ] 5건 호출부 치환 후 시각적 동등성 (G3 :716은 α `.2`→`.33`로 의도된 변경)
- [ ] label fixture 측 영향 0건 (본 토픽은 색 한정, label 구조 미변경)

### 4.5 Vera Self-Audit

- 신규 토큰 6종 — 모두 의미 차원 1:1 매핑, 장식 추가 0건. Rams 통과.
- 옵션 (b) 합성 gradient·(c) theme JSON 모두 명시적 기각. 옵션 나열 회피 없음.
- design_rules.json 추가 신규 규칙 불필요 (스코프가 chart-only로 좁고 R-D01·R-D02와 차원 분리).

## 자체 평가

```yaml
# self-scores
tk_drf0: Y          # core — 신규 토큰 6종은 PD-049/050 처리용 의도적 추가, 기존 토큰 변형 없음, role-colors.js 무변경
spc_cpl: 1.00       # extended — 5건 모두 신규 토큰으로 매핑, 미해결 0건
tk_cns: 5           # extended — stop 단위 단일 색 토큰 = role-colors.js 단일 원천 원칙과 동형, 일관성 최대
```
