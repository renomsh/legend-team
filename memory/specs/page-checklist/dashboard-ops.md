---
page: app/dashboard-ops.html
spec_source: ia-spec.md §1 + §2-1 (Dashboard / Ops) + §6-1 출시 게이트
canonical_ref: app/dashboard-upgrade.html
spec_version: 1.0
spec_completeness: full
required_selectors:
  - selector: 'aside.sidebar'
    min_count: 1
  - selector: '.card'
    min_count: 2
required_keywords:
  - "Ops"
canonical_class_min_usage:
  '.card': 2
sidebar_entry:
  menu: "Ops"
  path: "dashboard-ops.html"
---

# Dashboard / Ops (`app/dashboard-ops.html`) — page checklist

## Spec source 인용

- ia-spec.md §1 line 37~38 — "Dashboard / Ops → /dashboard-ops.html (본체 그대로 유지, D-087·Master#15)".
- ia-spec.md §6-1 line 184 — "G1 (sidebar partial 치환만) + G2 + G3 + ops 페이지 그대로 검증".

## Selector 도출 근거

- 본체 그대로 유지 정책 — 최소 sidebar partial 적용 + canonical `.card` 사용 ≥ 3 (PD-046 흡수 후 점진 정합).
- 강제 selector는 최소화 (자유도 확보), `.command-grid` 등 ops-specific 클래스는 lint scope 외.

## sidebar_entry

`menu: Ops` / `path: dashboard-ops.html` (ia-spec.md §2-1 line 72).
