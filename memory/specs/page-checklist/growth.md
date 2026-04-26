---
page: app/growth.html
spec_source: ia-spec.md §1 (Growth Phase 3 활성) + §2-1 (라우팅) + D-060 안 β (3축 헤더 + 4×2 panel)
canonical_ref: app/dashboard-upgrade.html
spec_version: 1.1
spec_completeness: full
required_selectors:
  - selector: 'aside.sidebar'
    min_count: 1
  - selector: '.card'
    min_count: 1
  - selector: '.axis-row'
    min_count: 1
  - selector: '.axis-card'
    min_count: 3
  - selector: '.panel-grid'
    min_count: 1
required_keywords:
  - "Growth"
  - "L1"
  - "L2"
  - "L3"
canonical_class_min_usage:
  '.card': 1
  '.axis-card': 3
  '.panel-card': 1
sidebar_entry:
  menu: "Growth"
  path: "growth.html"
---

# Growth (`app/growth.html`) — page checklist (full)

## Spec source 인용

- ia-spec.md §1 line 47~49 — "Growth → /growth.html (D-060 안 β + 3축 헤더 + 4×2 panel)".
- ia-spec.md §2-1 line 80 — 라우팅 path === `/growth.html`.
- D-060 안 β — 3축: L1 누적학습(learning) / L2 적중률(judgment-consistency) / L3 자율성(execution-transfer).
- topic_112 Phase 3 (session_109) — Master Q2: Growth 페이지는 수치 + 지표 표시 (실데이터 연결).

## Spec completeness

**full**: topic_112 Phase 3에서 활성. 3축 헤더(.axis-card ×3) + 4×2 panel(.panel-grid 안 .panel-card 4개 × {all, recent10} 2 view).

## 4×2 panel 슬롯 매핑

| # | metricId | axis | role | shortKey |
|---|---|---|---|---|
| 1 | ace.angle_novelty | learning (L1) | ace | ang_nov |
| 2 | ace.orchestration_hit_rate | judgment-consistency (L2) | ace | orc_hit |
| 3 | dev.gate_pass_rate | execution-transfer (L3) | dev | gt_pas |
| 4 | session.health_score | quality (supporting) | session | hlth |

각 슬롯 = 2 cell(all view + recent10 view) → 4 metric × 2 view = 4×2 panel. 데이터 없는 metric은 `panel-card.empty` + "Phase 4+ 채울 예정" 라벨.

## 데이터 출처

- `memory/growth/metrics_registry.json` — 지표 정의 + lifecycleState (build 시 `data/memory/growth/`로 매핑)
- `memory/growth/signature_metrics_aggregate.json` — view별 aggregate (all/recent10/recent3)
- `memory/shared/feature_flags.json` — `signatureMetricsEnabled` flag

## sidebar_entry

`menu: Growth` / `path: growth.html` (ia-spec.md §2-1 line 80). `data-state="pending"` 제거됨 (Phase 3 활성).
