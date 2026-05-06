---
topicId: topic_174
role: vera
rev: 2
turnId: 3
invocationMode: subagent
createdAt: 2026-05-06
title: "Growth 페이지 design-critique 반영 — 토큰 완성도 보완"
---

# Vera — Growth 페이지 critique 반영 (rev2)

## 변경 파일

- `app/css/tokens.css` — 토큰 3개 추가
- `app/growth.html` — 변경 8건

## tokens.css 추가 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| `--ls-eyebrow-sm` | `0.08em` | compact uppercase eyebrow (섹션 h2, role-tag, agent-label) |
| `--sp-dot` | `8px` | role-dot 크기 (role-card) |
| `--sp-dot-sm` | `6px` | agent-dot 크기 (agent-row) |

## growth.html 변경 내용

| # | 우선순위 | 항목 | Before | After |
|---|---|---|---|---|
| 1 | 🔴 Critical | JS 드릴 테이블 metric id 폰트 | `font-size:10px` | `font-size:var(--fs-meta)` |
| 2 | 🟡 Moderate | `.gx-section-h h2` letter-spacing | `.08em` | `var(--ls-eyebrow-sm)` |
| 3 | 🟡 Moderate | `.role-tag` letter-spacing | `.08em` | `var(--ls-eyebrow-sm)` |
| 4 | 🟡 Moderate | `.agent-progress-label` letter-spacing | `.08em` | `var(--ls-eyebrow-sm)` |
| 5 | 🟡 Moderate | `.cur-card-label` letter-spacing | `.10em` | `var(--ls-eyebrow-sm)` |
| 6 | 🟡 Moderate | `.role-dot` width/height | `8px` | `var(--sp-dot)` |
| 7 | 🟡 Moderate | `.agent-dot` width/height | `6px` | `var(--sp-dot-sm)` |
| 8 | 🟢 Minor | drill 섹션 레이블 | `role` | `역할 선택:` |

## skip 항목

- agent-badge rgba 하드코딩 유지 (CSS color-level-4 브라우저 지원 제한 — 지시대로 skip)

## 제약 준수 확인

- [x] tokens.css `:root{}` 재정의 없음
- [x] 신규 토큰 drift 없음 (기존 네이밍 규칙 `--ls-*`, `--sp-*` 준수)
- [x] JS fetch 경로·데이터 처리 로직 변경 없음
- [x] 하드코딩 잔존값 없음 (grep 검증 완료)

## lint 수동 실행 필요 (Riki R-2)

```bash
npx ts-node scripts/lint-contrast.ts && npx ts-node scripts/lint-inline-root-color.ts
```

[ROLE:vera]
# self-scores
tk_drf0: Y
spc_cpl: 0.95
tk_cns: 5
