---
deliverable: G2-spec-3
artifact: kpi-fallback-spec
topic: Dashboard 개편 — UX + 반응형 (Phase 2)
topicId: topic_082
session: session_105
date: 2026-04-25
phase: phase-2-spec-lock
grade: A
turnId: 1
invocationMode: subagent
status: locked-for-dev
sources:
  - reports/2026-04-22_dashboard-redesign-ux-responsive/responsive-policy.md §2 KPI auto-fit (G0-6)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/vera_rev3.md W-G3 적출
  - reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md §4-2 (Phase 2 G2 박제)
parent_spec: reports/2026-04-22_dashboard-redesign-ux-responsive/spec-lock-decisions.md
---

# G2-spec-3 kpi-fallback-spec — KPI auto-fit 1024~1280 fallback 동결 spec

Arki입니다. 본 문서는 Phase 2 G2 게이트 5 산출물의 **단일 출처**입니다. Vera W-G3 적출(KPI 카드 1024~1280 구간 3-col fallback 미보장 위험)을 흡수하여 Dev 실 검증 가능한 CSS·viewport 매트릭스로 박제합니다.

옵션 탐색 0. responsive-policy §2 KPI auto-fit 단일 추천 정합.

---

## 1. KPI auto-fit fallback 정의

### 1-1. 적용 페이지·표준값 (responsive-policy §2 carry)

| 페이지 | KPI 영역 | grid template | min card width | 1024~1280 표준 col 수 |
|---|---|---|---|---|
| Home | Hero KPI 3 (running·resolved·pending) | `repeat(auto-fit, minmax(220px, 1fr))` | 220px | 3-col |
| Upgrade | **KPI 5 (Decisions·Avg Size·Cache Hit·I/O Tokens·Sessions) — rev2 실측 정정 (rev1 KPI 4 가정 폐기)** | `repeat(4, minmax(180px, 1fr))` (1024~1279) → `repeat(5, ...)` (1280+) | 180px | 4-col → 5-col |
| Ops | KPI 5~6 (commits·hooks·builds·…) | `repeat(auto-fit, minmax(180px, 1fr))` | 180px | 4~5-col |
| Growth | 3축 KPI | `repeat(auto-fit, minmax(220px, 1fr))` | 220px | 3-col |

**핵심 fallback 케이스 (rev2)**: Upgrade KPI 5. 1280+에서 5-col, 1024~1279에서 4-col + 5번째 wrap. Riki R-2 적출 흡수 → `[data-kpi-count="5"]`에 명시 분기 필수 (auto-fit + 1fr wrap 시 5번째 단독 카드 거대화 방지).

### 1-2. fallback CSS 의사코드 (`app/css/components.css` §3)

```css
/* KPI auto-fit fallback — Phase 2 G2 박제 */
/* Vera W-G3 흡수: 1024~1280 구간 3-col 유지 보장 */

.kpi-row {
  display: grid;
  gap: var(--sp-4);                                  /* 16px 표준 */
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

/* Upgrade KPI 4 — Vera R-V10 정정: 명시 분기 (auto-fit + 1fr wrap 시 4번째 단독 카드 거대화 방지) */
.kpi-row[data-kpi-count="4"] {
  /* 기본(데스크톱 1024~1279): 3-col 강제, 4번째 카드 자연 wrap (220px 단독) */
  grid-template-columns: repeat(3, minmax(220px, 1fr));
}
@media (min-width: 1280px) {
  .kpi-row[data-kpi-count="4"] {
    grid-template-columns: repeat(4, minmax(220px, 1fr));
  }
}

/* Upgrade/Ops KPI 5 — Riki R-2 정정: 명시 분기 (rev2) */
.kpi-row[data-kpi-count="5"] {
  grid-template-columns: repeat(4, minmax(180px, 1fr));
}
@media (min-width: 1280px) {
  .kpi-row[data-kpi-count="5"] {
    grid-template-columns: repeat(5, minmax(180px, 1fr));
  }
}

/* Ops KPI 6 — minmax 축소 */
.kpi-row[data-kpi-count="6"] {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

/* 모바일 분기 (D-095) — 1col stack */
@media (max-width: 1023px) {
  .kpi-row,
  .kpi-row[data-kpi-count="4"],
  .kpi-row[data-kpi-count="5"],
  .kpi-row[data-kpi-count="6"] {
    grid-template-columns: 1fr;
  }
}

/* KPI 카드 내부 — .kpi-num 정합 (components-spec §1 helper) */
.kpi-card {
  padding: var(--sp-4);
  background: var(--panel-2);
  border-radius: var(--r-3);
  min-width: 0;                                      /* ellipsis 보장 */
}
.kpi-card .kpi-label {
  font-size: var(--fs-meta);
  letter-spacing: var(--ls-eyebrow);
  color: var(--text-2);
}
.kpi-card .kpi-value {
  /* @apply .kpi-num — class 직접 부여 */
}
```

### 1-3. data-kpi-count 부여 규칙 (HTML)

```html
<!-- Upgrade (rev2 실측: 5장) -->
<div class="kpi-row" data-kpi-count="5" data-vr-bbox="upgrade-kpi-grid">
  <div class="kpi-card">…</div>
  …(5개: Decisions·Avg Size·Cache Hit·I/O Tokens·Sessions)
</div>

<!-- Ops -->
<div class="kpi-row" data-kpi-count="5" data-vr-bbox="ops-kpi-grid">…</div>
```

`data-kpi-count` 미부여 시 기본 220px minmax 적용 (Home·Growth는 부여 불필요).

---

## 2. 검증 viewport 매트릭스 (4 포인트)

### 2-1. 4-포인트 정밀 측정

| viewport | width | sidebar 220 제외 main width | KPI 4 (220 minmax) col 수 | KPI 5 (180 minmax) col 수 |
|---|---|---|---|---|
| desktop-sm 경계 | 1024 | 804 | 3 (4번째 wrap, 잔여 144) | 4 (잔여 60) |
| 중간 1 | 1100 | 880 | 3 (잔여 220 → 4번째 단독) | 4 (잔여 136) |
| 중간 2 | 1200 | 980 | 3 (잔여 320 → 4번째 + 여백) | 5 (잔여 16) |
| desktop-sm baseline | 1280 | 1060 | **4** (동일 grid 4-col 유지) | 5 (잔여 96) |

**3-col 유지 구간**: 1024 ≤ width ≤ ~1240. **4-col 전환점**: width ≥ ~1244 (220×4 + 16×3 = 928 + sidebar 220 = 1148, but main padding 36×2=72 추가 → 약 1244).

### 2-2. 검증 절차 (G2 게이트 5 PASS 조건)

| Step | 동작 | 검증 |
|---|---|---|
| K1 | Playwright 호스트 모드 또는 docker로 Upgrade 페이지 4 viewport(1024·1100·1200·1280) 수동 캡처 | 4 PNG 생성 |
| K2 | 1024·1100·1200에서 KPI col 수 = 3 (4번째 wrap) | DevTools elements panel 또는 `page.locator('.kpi-card').first().boundingBox()` 비교 |
| K3 | 1280에서 KPI col 수 = 4 | 동일 |
| K4 | 모든 viewport에서 gap = `--sp-4` (16px) 일관 | computed style |
| K5 | 모든 viewport에서 padding `--sp-4` 일관 | computed style |
| K6 | wrap된 4번째 카드의 width = 220px 이상 (최소 minmax 보장) | boundingBox().width ≥ 220 |
| K7 | 텍스트 잘림 0 (kpi-num·kpi-label) | helper class `.title-1l` 미적용 시 wrap 허용, 적용 시 ellipsis 검증 |

### 2-3. 자동화 viewport 검증 스크립트 (선택)

```ts
// scripts/verify-kpi-fallback.ts — Phase 2 G2 박제 (선택)
import { chromium } from '@playwright/test';

const VIEWPORTS_KPI = [
  { width: 1024, expectedCols: 3 },
  { width: 1100, expectedCols: 3 },
  { width: 1200, expectedCols: 3 },
  { width: 1280, expectedCols: 4 },
];

async function main() {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS_KPI) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: 800 },
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8788/dashboard-upgrade.html');
    await p.waitForLoadState('networkidle');
    const cards = await p.locator('.kpi-row[data-kpi-count="4"] .kpi-card').all();
    const ys = await Promise.all(cards.map(c => c.boundingBox().then(b => b!.y)));
    const firstRow = ys.filter(y => y === ys[0]).length;
    if (firstRow !== vp.expectedCols) {
      throw new Error(`KPI fallback FAIL @ ${vp.width}px: expected ${vp.expectedCols}-col, got ${firstRow}-col`);
    }
    console.log(`PASS @ ${vp.width}: ${firstRow}-col`);
    await ctx.close();
  }
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
```

---

## 3. 토큰 의존

| 토큰 | 용도 | 출처 |
|---|---|---|
| `--sp-4` | KPI gap·padding (16px) | tokens.css §spacing |
| `--panel-2` | KPI 카드 배경 | tokens.css §panel |
| `--r-3` | KPI 카드 모서리 (12px card 등급) | tokens.css §radius |
| `--fs-meta` | KPI label 폰트 (11px) | tokens.css §typography |
| `--ls-eyebrow` | KPI label letter-spacing (0.14em) | tokens.css §typography |
| `--text-2` | KPI label 색 | tokens.css §text |
| `--fs-display` | KPI value 폰트 (helper `.kpi-num` 경유) | tokens.css §typography |

---

## 4. Vera W-G3 적출 흡수 명시

Vera vera_rev3 W-G3 적출 원문 흡수:
> "1024~1180 구간에서 KPI 4 grid가 3-col + 4번째 단독 wrap 시 4번째 카드가 화면 우측에 holistic 불균형. minmax(180px, 1fr) 변경 또는 명시적 `data-kpi-count` 분기 권고."

본 spec 채택 안 (Vera R-V10 정정 반영):
- **minmax 220px 유지** (Home·Upgrade·Growth 일관)
- `data-kpi-count="4"` 명시 부여 (페이지 의도 박제)
- **명시 분기 강제**: 1024~1279에서 `repeat(3, ...)` (4번째 카드 220px 단독 wrap, 잔여 영역 비워둠 → 시각 균형 양호), 1280부터 `repeat(4, ...)` (4-col 전환). `auto-fit + 1fr` 사용 시 wrap된 4번째 카드가 잔여 영역 전부 차지하여 거대화하는 결함 차단 (Vera 본인 W-G3 적출의 정확 흡수).

**미채택 안 (기각 사유)**:
- minmax 180px 강제 → Home·Growth와 불일치 → 시각 일관성 손실 (Master 메모리 `feedback_role_color_palette`·`feedback_no_premature_topic_split` 정합)
- container query (`@container`) → 본 토픽 spec lock 외 + browser 호환성 추가 검토 비용 (PD 별도 트랙)

---

## 5. 의존 그래프

```
tokens.css (--sp-4, --panel-2, --r-3, --fs-meta, --ls-eyebrow, --text-2, --fs-display, ...)
  └── components.css §1 .kpi-num (helper)
  └── components.css §3 .kpi-row + .kpi-card  ← 본 spec
        └── HTML data-kpi-count 부여 (Upgrade·Ops)
              └── verify-kpi-fallback.ts (선택)
                    └── Playwright 4 viewport 수동/자동 검증
                          └── G2 게이트 5 PASS
```

---

## 6. 검증 체크리스트 (Phase 2 G2 게이트 5 정합)

| # | 검증 | 게이트 |
|---|---|---|
| 1 | `app/css/components.css` `.kpi-row` declaration 존재 | G2-5 |
| 2 | `[data-kpi-count="4"]`·`[data-kpi-count="5"]` 분기 존재 | G2-5 |
| 3 | Upgrade·Ops HTML에 `data-kpi-count` 부여 완료 | G2-5 |
| 4 | 1024·1100·1200·1280 viewport 4 포인트 검증 PASS (수동 또는 verify-kpi-fallback.ts) | G2-5 |
| 5 | gap·padding 토큰 일관 (`--sp-4`) | G2-5 |
| 6 | 모바일 (<1024) 1col stack 작동 | G2-5 |
| 7 | KPI baseline PNG (24 baseline 中 Upgrade·Ops 8장)에서 fallback 시각 OK | G2-5 (vr-infra-spec 정합) |

---

## 7. 롤백 트리거

| trigger | 처리 |
|---|---|
| 1024에서 4-col 유지 (3-col 분기 실패) | minmax 값 검토 (220px이 너무 작음) + Vera 재호출 |
| 1280에서 5-col 발생 (4-col 초과) | sidebar width·main padding 재계산 + responsive-policy §2 갱신 |
| 모바일 1col stack 실패 | @media query 우선순위 검증 |
| KPI 카드 내부 텍스트 잘림 | helper class `.title-1l`·`.kr-text` 적용 점검 |

---

## 8. 중단 조건

- 4 viewport 검증 중 ≥2 viewport에서 fallback 실패 → Phase 2 정지, KPI grid 설계 자체 재검토 (Vera 재호출)
- container query 도입 압박 발생 → PD 별도 트랙 박제 (본 Phase 채택 금지)

---

## 9. lock 선언

본 kpi-fallback-spec = KPI auto-fit fallback CSS declaration + 4 viewport 검증 매트릭스 + Vera W-G3 흡수 + verify-kpi-fallback.ts skeleton + 롤백 트리거 + 중단 조건. Phase 2 G2 게이트 5 단일 출처. Dev 인계 직전 동결.

다음 turn: Vera (Dev 인계 전 spec lock 정합 디자인 검수).

---

## rev2 — Riki R-1·R-2 흡수 (session_105, 2026-04-25)

- **R-1 (셀렉터 통일)**: `.kpi-grid` → `.kpi-row` 전면 정정. dashboard-upgrade.html canonical 셀렉터 정합.
- **R-2 (data-kpi-count="5" 명시 분기)**: `auto-fit + 1fr` wrap 시 마지막 카드 거대화 차단. 1024~1279 4-col, 1280+ 5-col.
- **적용 페이지 매트릭스 정정**: Upgrade KPI 4장(가정) → 5장(실측). rev1 spec drift 1건(§1-1) 본 rev2에서 흡수.
- 본 rev2는 components.css(L126~153) + dashboard-upgrade.html(L70 인라인 width 제거 + L9 components.css link 추가) 실 산출과 정합.
