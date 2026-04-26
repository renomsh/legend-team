---
page: app/growth.html
spec_source: ia-spec.md §1 (Growth Phase 4 신설) + §5-1 H2 (Growth 인덱스 카드)
canonical_ref: app/dashboard-upgrade.html
spec_version: 1.0
spec_completeness: minimal
required_selectors:
  - selector: 'aside.sidebar'
    min_count: 1
  - selector: '.card'
    min_count: 1
required_keywords:
  - "Growth"
canonical_class_min_usage:
  '.card': 1
sidebar_entry:
  menu: "Growth"
  path: "growth.html"
---

# Growth (`app/growth.html`) — page checklist (minimal)

## Spec source 인용

- ia-spec.md §1 line 41~42 — "Growth → /growth.html [Phase 4 신설] (D-060 안 β + 3축 헤더 + 4×2 panel)".
- ia-spec.md §6-2 hidden state — Phase 4 미완 시 `data-state="pending"` + click disable.

## Spec completeness

**minimal**: Phase 4 미진입. 파일 부재 가능 → enforce 모드에서도 warn 처리 (g0_5-spec-check.mjs 정책). 향후 Phase 4 진입 시 `spec_completeness: full`로 승격하며 selector 보강.

## sidebar_entry

`menu: Growth` / `path: growth.html` (ia-spec.md §2-1 line 73).
