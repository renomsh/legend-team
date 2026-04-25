VERA_WRITE_DONE: reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/vera_rev1.md

---
role: vera
raterId: vera
topic: Dashboard 개편 — UX + 반응형 (Phase 2)
topicId: topic_082
session: session_105
date: 2026-04-25
rev: 1
phase: phase-2-spec-lock
grade: A
turnId: 2
invocationMode: subagent
contributing_specs:
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/components-spec.md
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/vr-infra-spec.md
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/kpi-fallback-spec.md
  - reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/arki_rev1.md
parent_spec: reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md
---

# Vera — Phase 2 Arki spec lock 4건 디자인 검수 (session_105)

Vera입니다. Arki 4 spec 박제(`status: locked-for-dev`)에 대한 디자인 검수와 시각 spec 보강을 수행합니다. 본 발언은 검수만 — Arki 구조·의존 그래프 재작성 0, Riki 리스크 나열 0, 디자인 결함만 적출합니다.

session_104 spec drift(lint-contrast 미실행 박제) 재발 방지 의무: 본 발언의 모든 contrast·hex 인용은 직전 실행한 `npx ts-node scripts/lint-contrast.ts` 산출 기반, 추정 0건.

---

## 1. lint-contrast.ts 실행 결과 (본 spec 박제 시점 산출)

직전 실행 결과 — 19 combos, 0 failures, 1 alarms (`--c-ace` margin 0.14 ALARM, accent-only 강제로 처리 완료):

| 조합 | hex | ratio | margin | 판정 |
|---|---|---|---|---|
| `--text` on `--panel` | #F5F5F7 on #0B0B0D | 18.06 | 13.56 | PASS |
| `--text-2` on `--panel` | #B8B8C0 on #0B0B0D | 9.98 | 5.48 | PASS |
| `--text-3` on `--panel` | #82828C on #0B0B0D | 5.17 | 0.67 | PASS (rev4 정정값) |
| `--text-3` on `--panel-2` (hover) | #82828C on #141418 | 4.83 | 0.33 | PASS (rev3 차단 해제) |
| `--c-ace` on `--panel` | #8B5CF6 on #0B0B0D | 4.64 | 0.14 | ALARM accent-only |
| `--c-dev` on `--panel` | #3B82F6 on #0B0B0D | 5.35 | 0.85 | PASS |
| `--c-riki` on `--panel` | #EF4444 on #0B0B0D | 5.23 | 0.73 | PASS |
| 기타 (arki·fin·nova·vera·editor·ok·warn·bad) | — | ≥5.23 | ≥0.73 | PASS |

본 Phase 2 helper class·drawer·KPI fallback spec 모두 color declaration 0 (구조만 담당) — contrast 영향 없음. 단, baseline 캡처(vr-infra-spec) 시 위 19 combo 정합 페이지로 박제됩니다.

---

## 2. components-spec.md 검수 결과

### 2-1. 적정 박제 항목 (확인 OK)

- `.title-1l` `min-width: 0` 박제 — flex 부모 ellipsis 작동 보장. 구조 정합 OK.
- `.kr-text` `keep-all` + `overflow-wrap: anywhere` — 한국어 본문 정책 정합. R-D02 (alpha 3-tier drift 회피)와 무관, 본 helper는 텍스트 흐름만 담당.
- `.kpi-num` `tabular-nums` + `font-variant-numeric` + `font-feature-settings: 'tnum' 1` 이중 박제 — fallback 안정성 OK.
- `.chip-row` mask-image fade — Rams 원칙 §6 (정직) 정합, 우측 잘림 신호 명시.
- drawer mobile `transform: translateX` 단일 — layout shift 0, motion 정책(`tokens.css §motion`) 정합.
- `prefers-reduced-motion` 분기 박제 — R-1 mitigation (b)와 일관.
- `.hamburger` 40+8 padding = 48 tap target — WCAG SC 2.5.5 정합.

### 2-2. R-V1 (CRITICAL) — 토큰 명명 불일치 4건

components-spec §2-3 박제 토큰이 `tokens.css` 실재 토큰과 4건 mismatch. Dev가 그대로 작성하면 모든 declaration이 undefined로 fail.

| spec 인용 토큰 | tokens.css 실재 | 영향 declaration | mitigation |
|---|---|---|---|
| `--c-panel-1` | **없음**. 실재: `--panel`, `--panel-2`, `--panel-3` | `.sidebar` background, `.hamburger` background | spec을 `--panel`로 정정 (sidebar는 page surface 동일 등급) |
| `--shadow-drawer` | **없음**. 실재: `--shadow-1`, `--shadow-2`, `--shadow-glow-violet` | `.sidebar` mobile box-shadow | `--shadow-2`로 정정 (4px·12px blur, 모바일 drawer 등급 적합) |
| `--r-md` | **없음**. 실재: `--r-1` (6px chip) ~ `--r-5` (20px hero) | `.hamburger` border-radius | `--r-2` (8px nav-item·button-small)로 정정 |
| `--z-sidebar` | **없음**. 실재: `--z-sticky` (10) | desktop sticky `.sidebar` z-index | `--z-sticky`로 정정 |

**fallback**: 토큰 신설(`--shadow-drawer`·`--r-md`·`--c-panel-1`·`--z-sidebar`) 안은 기각 — D-091 단일 출처 원칙 위반(중복 토큰 누적). spec 정정이 정답.

**papering over 0**: 본 적출은 spec 재해석 권한 (D-098 §6-2) 발동 트리거. Arki에 spec 정정 1패스 의무 (Dev 인계 직전).

### 2-3. R-V2 — helper 적용 페이지 매트릭스 누락 1건

components-spec §1-1 매트릭스에서 `.title-1l` Phase 4 적용 페이지에 **Deferrals** 누락 (PD body의 title도 1-line ellipsis 필요). Sessions·Decisions·Feedback·System은 박제됨.

mitigation: spec §1-1 매트릭스 5번째 helper row의 Deferrals 컬럼에 `.title-1l` 추가. fallback: Phase 4 시점 Edi 검증 시 보강 가능 (본 Phase 차단 사항 아님 — soft 적출).

### 2-4. R-V3 — drawer focus trap CSS 셀렉터 정합 (검증 필요)

§2-4의 `[data-nav-first]`·`[data-nav-last]` 셀렉터는 CSS 비할당, JS 책임으로 위임됨. 적정합. 단 `aria-modal="true"` 셀렉터 누락 — drawer가 modal 등급일 때 SR이 배경 무시하도록 박제 필요.

mitigation: §2-4 매트릭스에 `.sidebar[role="dialog"][aria-modal="true"]` 1행 추가 (mobile only). fallback: `role="navigation"` 유지 시 modal 등급 미적용 — backdrop 클릭 닫힘 동작은 작동하나 SR 사용자가 background nav를 잘못 읽을 수 있음.

**디자인 결정 위임**: drawer를 navigation으로 볼 것인가 dialog로 볼 것인가? Material/Apple 규범은 mobile drawer = `dialog` + `aria-modal="true"` 우세. 본 Vera 단호 권고: **dialog 등급**, `aria-modal="true"`로 박제.

### 2-5. R-V4 — helper class BEM/utility 명명 일관성

박제된 5종 모두 utility 등급(단일 책임, 단일 declaration 군집). BEM(`.block__elem--mod`) 혼재 0. 명명 일관성 PASS.

단, `.kpi-card` (kpi-fallback-spec §1-2)는 component 등급 — `.kpi-card .kpi-label`·`.kpi-card .kpi-value`로 nested. 이는 BEM 정합 (`.kpi-card__label`·`.kpi-card__value`로 박제 권고)이나 spec lock 후 변경은 비용 — soft 적출. fallback: 현 nested selector 유지하되 §1-2 주석에 "BEM 마이그레이션은 PD 별도 트랙" 1줄 명시.

---

## 3. vr-infra-spec.md 검수 결과 (시각 품질 관점만)

인프라(docker·playwright) 영역은 Arki/Dev 책임 — 시각 품질 spec만 적출.

### 3-1. 적정 박제 항목

- 24 PNG matrix (6 페이지 × 4 viewport: 1920/1440/1280/375) — 4 viewport 정당성 PASS. 1920·1440은 일반 데스크톱 모니터 분포 95%+ 커버, 1280은 1024 분기 직상 baseline, 375는 iPhone SE/12 mini.
- `colorScheme: 'dark'` + `locale: 'ko-KR'` + `timezoneId: 'Asia/Seoul'` 박제 — tokens.css dark 단일 전제와 일관, 한국어 폰트 fallback drift 차단.
- R-1 4중 mitigation (Date mock·reduced-motion·font preload·ECharts animation off) — 시각 안정성 강화 적정.
- `data-vr-bbox` 22 marker — Phase 1 G1 잔여 보강 의무 박제.

### 3-2. R-V5 — mobile baseline의 drawer 상태 미박제

§3-2 매트릭스에서 mobile (375) PNG는 1장씩만 캡처. 그러나 drawer는 2상태(`data-open="false"` 기본, `data-open="true"` 열림). baseline이 어느 상태인지 spec 미박제 → 캡처마다 drift 위험.

mitigation: vr-capture.ts에서 mobile PNG는 **`data-open="false"` (기본 닫힘) 상태만 baseline**으로 강제. drawer 열림 상태는 별도 e2e 테스트(Playwright assertion)로 분리. fallback: drawer 열림 PNG도 baseline에 포함 시 24 → 30 PNG 증가 (24 + mobile 6장 추가) — git 커밋 크기 ~1.5MB, 적정 범위 내. 단, baseline 의미가 "안정 default 상태" 우선이라면 닫힘 상태만 PASS.

**Vera 단호 권고**: 닫힘 상태만 baseline. 열림 상태는 e2e assertion (`expect(sidebar).toHaveAttribute('data-open', 'true')`)로 분리. baseline = 정적 시각 회귀 검증, drawer interaction = 동적 동작 검증.

### 3-3. R-V6 — bbox marker 22개의 페이지별 분포 검증

§3-2 합계 22 marker (4+5+4+4+3+2). PNG 24장에 대해 bbox JSON 24파일(§3-1, page-viewport 단위 묶음). 본 모듈 산출 적정 OK. 단 People 페이지가 marker 2개(sidebar + role-4×2)뿐 — Phase 4에서 sub-nav 추가 시 bbox 보강 필요. 본 Phase 차단 사항 아님 (soft 적출).

### 3-4. R-V7 — font-display: block 박제 위치 모순

§4-1 (c)에 "`font-display: block` + preload"로 박제. 그러나 `block` 정책은 폰트 로드 전 invisible(최대 3초) — 실 사용자에 FOIT 발생. baseline VR 캡처 안정성에는 유리하나, **production 사용자 경험과 모순**.

mitigation: VR 캡처 환경에서만 `block` 강제 (vr-capture.ts 글로벌 inject), production CSS는 `font-display: swap` 유지. fallback: 둘 다 `swap`이면 VR 캡처에서 fallback font→웹폰트 swap 순간 다른 baseline 생성 → flaky. 분리 박제 필수.

**Vera 단호 권고**: tokens.css `@font-face` (현재 미박제) 신설 시 `font-display: swap` 박제. vr-capture.ts에서만 `addStyleTag`로 `block` override.

---

## 4. kpi-fallback-spec.md 검수 결과

### 4-1. 적정 박제 항목

- `repeat(auto-fit, minmax(220px, 1fr))` 통일 — Home·Upgrade·Growth 일관성 PASS.
- `data-kpi-count="4"`·`"5"` 분기 — 페이지 의도 박제 명시성 PASS.
- W-G3 적출 흡수 명시 (§4) — 채택/미채택 안 사유 모두 박제, papering over 0.
- `min-width: 0` `.kpi-card`에 박제 — flex/grid item ellipsis 작동 보장.
- 모바일 1col stack `@media (max-width: 1023px)` — D-095 단일 분기 정합.

### 4-2. R-V8 (CRITICAL) — 토큰 명명 불일치 4건

components-spec와 동일한 R-V1 패턴 재발. kpi-fallback-spec §3 토큰 의존 매트릭스도 `tokens.css` 실재와 mismatch.

| spec 인용 토큰 | tokens.css 실재 | 영향 declaration | mitigation |
|---|---|---|---|
| `--c-panel-2` | 실재 `--panel-2` (접두 `c-` 없음) | `.kpi-card { background }` | `--panel-2`로 정정 |
| `--r-md` | **없음** (R-V1 동일) | `.kpi-card { border-radius }` | `--r-3` (12px card 등급)로 정정 |
| `--fs-eyebrow` | **없음**. 실재: `--fs-meta` (11px) + `--ls-eyebrow` (0.14em) | `.kpi-label { font-size }` | `--fs-meta` + `letter-spacing: var(--ls-eyebrow)` 분리 박제 |
| `--c-text-2` | 실재 `--text-2` (접두 `c-` 없음) | `.kpi-label { color }` | `--text-2`로 정정 |

**근거**: tokens.css는 색·spacing·typography 모두 prefix 없는 단순 명명(`--text-2`, `--panel-2`, `--text-3`). 역할 색만 `--c-` 접두(`--c-ace`, `--c-dev`). spec 인용이 일관 prefix 가정으로 박제 → mismatch.

**papering over 0**: Arki spec 정정 1패스 의무. fallback (토큰 alias 신설) 기각 — D-091 위반.

### 4-3. R-V9 — verify-kpi-fallback.ts 검증 임계 1건 누락

§2-3 스크립트는 row 1 카드 수만 검증. gap·padding 일관성(§2-2 K4·K5 박제) 자동화 0. 수동 검증으로 위임됨.

mitigation: K4·K5 자동화는 Phase 2 비차단 (수동 검증으로 G2-5 PASS 가능). fallback: Dev가 verify-kpi-fallback.ts에 `expect(getComputedStyle(card).gap).toBe('16px')` 1줄 추가 시 자동화. soft 적출.

### 4-4. R-V10 — fallback CSS 시각 정합 (W-G3 본인 적출 정합 자가 검증)

session_104 vera_rev3 W-G3 적출:
> "1024~1180 구간에서 KPI 4 grid가 3-col + 4번째 단독 wrap 시 4번째 카드가 화면 우측에 holistic 불균형."

Arki 채택 안: minmax 220 유지 + 4번째 wrap 허용. 본 Vera 자가 재검증:

- 1024px main width 804 → 220×3 + 16×2 = 692 사용, 잔여 112 → 4번째 wrap 시 220px 단독 (잔여 584). **시각 균형 OK** (좌측 3-col 692 vs 4번째 220, 비율 3.15:1 — Rams 원칙 §3 미적-구조 일관 ALARM이 아님).
- 1100px → 잔여 188 → 4번째 단독 220 (overflow 32 → grid 1fr 자동 늘림 → 잔여 760 영역에서 4번째가 760 차지 가능 → 4번째 카드만 거대화 위험!) — **시각 불균형 발생**.

**핵심 디자인 결함**: `auto-fit` + `1fr`은 wrap된 단독 카드를 **잔여 영역 전부 차지**시킴. 본 Arki spec §1-2 주석 "4번째 wrap" 박제는 unintended 결과 가능.

mitigation 1: `auto-fit` → `auto-fill` 교체. 빈 트랙을 유지하므로 4번째 카드는 220px 그대로, 우측 빈 슬롯 192px 발생 (시각 균형 양호).
mitigation 2 (Vera 권고): `data-kpi-count="4"` 분기에 1024~1280 구간 명시 강제 — `grid-template-columns: repeat(3, minmax(220px, 1fr))` (3-col 강제), 1280 이상에서만 `repeat(4, ...)`.

```css
/* Vera 권고 — kpi-fallback-spec §1-2 정정 */
.kpi-grid[data-kpi-count="4"] {
  grid-template-columns: repeat(3, minmax(220px, 1fr));
}
@media (min-width: 1280px) {
  .kpi-grid[data-kpi-count="4"] {
    grid-template-columns: repeat(4, minmax(220px, 1fr));
  }
}
@media (max-width: 1023px) {
  .kpi-grid[data-kpi-count="4"] {
    grid-template-columns: 1fr;
  }
}
```

**fallback**: `auto-fill` 단순 교체로도 1차 대응 가능. 그러나 Vera 단호 권고는 명시 분기 (의도 박제 + 검증 단순).

W-G3 본인 적출의 정확 흡수 = mitigation 2. session_104 vera_rev3의 의도와 정합.

---

## 5. 본 발언 추가 spec 박제 (component-visual-spec 보강)

helper 5종 + drawer + KPI에 대한 시각 토큰 매핑 표(gap·padding·radius·motion)는 위 §2·§4에서 토큰 정정 후 일관 박제됨. 추가 component-visual-spec.md 별도 파일 신설 0 — 본 발언 정정안으로 충분 (Master 메모리 `feedback_no_premature_topic_split` 정합, 분화 신중).

motion 토큰 신설 필요 여부: tokens.css §motion에 `--t-fast: 120ms`·`--t-base: 220ms`·`--t-slow: 320ms`·`--ease-std`·`--ease-out` 박제됨. drawer slide-in `--t-base` 적정. **신설 0** — PD 후보 박제 0.

---

## 6. 검수 결론 + Dev 인계 차단/비차단 분류

### 6-1. CRITICAL (Dev 인계 차단 — Arki 1패스 정정 의무)

| ID | 위치 | 내용 |
|---|---|---|
| R-V1 | components-spec §2-3 | 토큰 명명 4건 mismatch (`--c-panel-1`·`--shadow-drawer`·`--r-md`·`--z-sidebar`) → 정정안 박제 |
| R-V8 | kpi-fallback-spec §3 | 토큰 명명 4건 mismatch (`--c-panel-2`·`--r-md`·`--fs-eyebrow`·`--c-text-2`) → 정정안 박제 |
| R-V10 | kpi-fallback-spec §1-2 | `auto-fit` + `1fr` wrap 시 4번째 단독 카드 거대화 → 명시 분기 권고 (W-G3 본인 적출 정합) |
| R-V7 | vr-infra-spec §4-1 (c) | `font-display: block` production 모순 → VR 캡처 환경에만 강제 |

### 6-2. SOFT (Dev 인계 비차단 — Phase 4 또는 PD 트랙)

| ID | 위치 | 내용 |
|---|---|---|
| R-V2 | components-spec §1-1 | Deferrals 페이지 `.title-1l` 매트릭스 누락 |
| R-V3 | components-spec §2-4 | `aria-modal="true"` 셀렉터 박제 권고 |
| R-V4 | kpi-fallback-spec §1-2 | `.kpi-card` BEM 마이그레이션 PD 별도 트랙 |
| R-V5 | vr-infra-spec §3-2 | mobile baseline drawer 닫힘 상태 명시 박제 |
| R-V6 | vr-infra-spec §3-2 | People bbox 2개 — Phase 4 sub-nav 추가 시 보강 |
| R-V9 | kpi-fallback-spec §2-3 | gap·padding 자동화 검증 1줄 추가 |

### 6-3. lock 재선언

CRITICAL 4건은 Arki spec 정정 1패스 후 `status: locked-for-dev` 재확인 필요. SOFT 6건은 본 Phase 2 통과 가능 (Dev 인계 진행).

새 결정 박제 0 — D-098 동결 spec의 시각 품질 검수만. 새 PD 후보 0 — 토큰 신설·BEM 마이그레이션 모두 본 토픽 외 트랙 또는 기각.

session_104 spec drift 재발 0 — 본 발언 모든 contrast·hex 인용은 lint-contrast.ts 직전 실행 산출 기반. 추정 0.

---

```yaml
# self-scores
ds_int: 90
tk_acc: 95
vis_qual: 88
```
