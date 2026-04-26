---
page: app/index.html
spec_source: ia-spec.md §5 (Home 페이지 5 인덱스 카드 진입점) + §1 (사이드바 트리)
canonical_ref: app/dashboard-upgrade.html
spec_version: 1.0
spec_completeness: full
required_selectors:
  - selector: '.kpi-row'
    min_count: 1
  - selector: '.kpi-row .kpi'
    min_count: 3
  - selector: '.section-grid'
    min_count: 1
  - selector: '.card'
    min_count: 5
  - selector: 'aside.sidebar'
    min_count: 1
required_keywords:
  - "Dashboard"
  - "Growth"
  - "People"
  - "Records"
  - "System"
canonical_class_min_usage:
  '.kpi-row': 1
  '.section-grid': 1
  '.card': 5
sidebar_entry:
  menu: "Home"
  path: "index.html"
---

# Home (`app/index.html`) — page checklist

## Spec source 인용

- ia-spec.md §5-1 5 인덱스 카드 정의 표 — "H1 Dashboard / H2 Growth / H3 People / H4 Records / H5 System" 5건 모두 카드로 노출 (line 144~150).
- ia-spec.md §5-2 Hero KPI 3 — `[N sessions] [N topics] [N decisions]` 가로 1행 (line 154~158).
- ia-spec.md §5-3 Recent band — Recent Topics + Recent Decisions 2-section (line 164~168).

## Selector 도출 근거

- `.kpi-row` ≥ 1 + `.kpi-row .kpi` ≥ 3 → Hero KPI 3을 canonical `.kpi-row` 컴포넌트로 노출 (D-097 카탈로그 기준).
- `.section-grid` ≥ 1 → 5 인덱스 카드를 grid layout으로 배치 (Vera rev2 §7-1 wireframe).
- `.card` ≥ 5 → 5 인덱스 카드 (H1~H5).
- `aside.sidebar` ≥ 1 → §1 sidebar partial 적용 확인.

## Required keywords

5 인덱스 카드 텍스트로 메뉴 5개 모두가 innerText에 노출되어야 함.

## sidebar_entry

`menu: Home` / `path: index.html` (ia-spec.md §1 line 31, §2-1 line 70).
