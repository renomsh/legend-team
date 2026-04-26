---
page: app/dashboard-upgrade.html
spec_source: ia-spec.md §1 + §2-1 (Dashboard / Upgrade default) + D-097 canonical 카탈로그
canonical_ref: app/dashboard-upgrade.html
spec_version: 1.0
spec_completeness: full
required_selectors:
  - selector: '.kpi-row'
    min_count: 1
  - selector: '.section-grid'
    min_count: 1
  - selector: '.card'
    min_count: 10
  - selector: 'aside.sidebar'
    min_count: 1
required_keywords:
  - "Upgrade"
canonical_class_min_usage:
  '.kpi-row': 1
  '.section-grid': 1
  '.card': 10
sidebar_entry:
  menu: "Upgrade"
  path: "dashboard-upgrade.html"
---

# Dashboard / Upgrade (`app/dashboard-upgrade.html`) — page checklist

## Spec source 인용

- 본 페이지 자체가 D-097 canonical 컴포넌트 카탈로그의 reference (`.kpi-row`, `.section-grid`, `.card`, `.flow-row` 등 표준 클래스의 단일 출처).
- ia-spec.md §1 line 35~36 — "Dashboard / Upgrade [default] (canonical reference, D-090)".
- ia-spec.md §6-1 출시 게이트 표 line 183 — "canonical 본체 무회귀".

## Selector 도출 근거

- canonical 자기 자신이므로 자가검증의 lower bound: `.kpi-row` ≥ 1, `.section-grid` ≥ 1, `.card` ≥ 10 (실측 ≈ 30+).
- 본 페이지가 PASS 못 하면 spec 자체가 캐치 미스 — sanity gate.

## sidebar_entry

`menu: Upgrade` (Dashboard 그룹 하위) / `path: dashboard-upgrade.html` (ia-spec.md §2-1 line 71).
