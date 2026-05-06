---
topicId: topic_174
role: vera
rev: 1
turnId: 2
invocationMode: subagent
createdAt: 2026-05-06
title: "Growth 페이지 시각 개편 — 토큰 기반 일관성 정리 (PD-029 실사례 1건)"
---

# Vera — Growth 페이지 시각 개편

## 변경 전 시각 문제점

- **role-card hover 하드코딩**: `rgba(139,92,246,.35)` — `--c-ace` hex 직접 사용, ALARM 색 규칙 위반
- **role-card border JS 하드코딩**: `rgba(139,92,246,.25)` renderRoles 함수 내 직접 주입
- **axis-val 폰트 비토큰**: `font-size:32px; letter-spacing:-1px` 인라인 — `--fs-*` 미사용
- **role-score 폰트 비토큰**: `font-size:28px; font-weight:800; letter-spacing:-1px` — `font-variant-numeric` 미선언
- **spacing 비토큰값**: `gap:16px`, `gap:12px`, `gap:8px`, `margin-bottom:28px` 등 `--sp-*` 미사용
- **border-radius 비토큰**: `16px`, `12px`, `10px` 등 `--r-*` 미사용
- **font-size 소소한 값 비토큰**: `10px`, `11px`, `12px`, `14px` — `var(--fs-meta/label/body)` 미사용
- **`const ROLE_COLOR` fallback ace hex**: `'#8B5CF6'` — ALARM 색 직접 사용
- **Current Session 인라인 스타일 100%**: JS innerHTML에 style 속성 직접 주입 (padding, border-radius, font-size, color 모두)
- **Agent Progress 인라인 스타일 100%**: flex, gap, border, background 전부 인라인
- **HTML 구조**: `cur-sess-grid`에 인라인 `style="display:grid;..."`, `agent-progress-label`에 인라인 style

---

## 개편 결정 내용

### §1. 토큰화 원칙
- 모든 spacing → `--sp-*` (4px 베이스)
- 모든 border-radius → `--r-*`
- 모든 font-size → `--fs-*`, letter-spacing → `--ls-*`, line-height → `--lh-*`
- font-variant-numeric 명시 (axis-val, role-score 모두)

### §2. hover border — Riki R-1 반영
- `rgba(139,92,246,.35)` 제거
- `.role-card:hover` → `color-mix(in srgb, var(--c-ace-fallback) 35%, var(--line))`
  - `--c-ace-fallback: #9F75F8` (5.97:1, margin 1.47) — ALARM 해소
  - `--c-ace-rgb` 미존재 토큰 패턴(Arki 초안) 사용하지 않음

### §3. role-card border (JS)
- `rgba(139,92,246,.25)` → `color-mix(in srgb, ${roleColor} 30%, var(--line))`
  - 각 role 고유 색 기반 — 시각 다양성 + ALARM 색 의존 제거

### §4. axis-val 폰트
- `font-size:32px` → `var(--fs-h1)` (28px) — typography 위계 정합
- `letter-spacing:-1px` → `var(--ls-h1)`
- `font-variant-numeric: tabular-nums` + `font-feature-settings: 'tnum' 1` 명시

### §5. role-score 폰트
- `font-size:28px` → `var(--fs-h2)` (20px) — `.kpi-num`(48px)은 과대, fs-h2가 카드 밀도에 적합
- tabular-nums 명시

### §6. Current Session 전면 CSS 클래스화
- `.cur-card` + `--cur-accent` CSS custom property 패턴 → 인라인 style 완전 제거
- `.agent-row` / `.agent-dot` / `.agent-label` / `.agent-badge` 클래스 신설
- `--agent-accent`, `--agent-dot-color`, `--agent-label-color` custom property로 JS color 주입
- badge: `.agent-badge.done` / `.pending` / `.skipped` 토큰 기반 색상

### §7. `const ROLE_COLOR` fallback ace 색
- `'#8B5CF6'` (ALARM) → `'#9F75F8'` (`--c-ace-fallback`, 5.97:1) 로 교체

### §8. HTML 구조 정리
- `<div id="curSessGrid" style="...">` → `<div class="cur-sess-grid" id="curSessGrid">`
- `<div style="font-size:12px;...">Agent Progress</div>` → `<div class="agent-progress-label">Agent Progress</div>`
- `margin-top:32px` → `margin-top:var(--sp-8)`

---

## 주요 CSS diff 요약

| 항목 | Before | After |
|---|---|---|
| `.role-card:hover border-color` | `rgba(139,92,246,.35)` | `color-mix(in srgb, var(--c-ace-fallback) 35%, var(--line))` |
| `.axis-val font-size` | `32px` | `var(--fs-h1)` |
| `.axis-val letter-spacing` | `-1px` | `var(--ls-h1)` |
| `.role-score font-size` | `28px` | `var(--fs-h2)` |
| spacing (gap/margin) | `16px`, `12px`, `8px` 등 | `var(--sp-*)` |
| border-radius | `16px`, `12px`, `10px` 등 | `var(--r-4)`, `var(--r-3)`, `var(--r-3)` 등 |
| Current Session 카드 | 100% 인라인 style | `.cur-card` + `--cur-accent` custom prop |
| Agent Progress | 100% 인라인 style | `.agent-row/.agent-badge` 클래스 |
| fallback ace color | `#8B5CF6` (ALARM) | `#9F75F8` (`--c-ace-fallback`) |

---

## 제약 준수 확인

- [x] tokens.css `:root{}` 재정의 없음
- [x] `--c-ace` 텍스트/배경 주 색상 사용 없음 (border/accent only → `--c-ace-fallback` 사용)
- [x] JS fetch 경로 변경 없음
- [x] JS 데이터 처리 로직 변경 없음
- [x] `--c-ace-rgb` 미존재 토큰 참조 없음 (Riki R-1 반영)
- [x] lint 수동 실행 필요: `npx ts-node scripts/lint-contrast.ts && npx ts-node scripts/lint-inline-root-color.ts` (Riki R-2)

---

VERA_WRITE_DONE: reports/2026-05-06_vera-claude-design-pd029-review/vera_rev1.md

[ROLE:vera]
# self-scores
tk_drf0: Y
spc_cpl: 0.88
tk_cns: 5
