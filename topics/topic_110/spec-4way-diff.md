---
artifact: spec-4way-diff
topic: topic_110
session: session_107
date: 2026-04-26
authoredBy: dev
phase: phase-A-spec-lock
sources:
  - memory/specs/ia-spec.md (canonical, D-100)
  - app/dashboard-upgrade.html (canonical 컴포넌트 카탈로그)
  - memory/shared/decision_ledger.json D-094, D-097 (derived after D-100)
  - reports/2026-04-22_dashboard-redesign-ux-responsive/vera_rev1.md ~ vera_rev4.md (latest = rev4)
---

# Spec 4-way diff — topic_110 Phase A

정본(memory/specs/ia-spec.md) ↔ canonical(app/dashboard-upgrade.html) ↔ ledger(D-094/D-097) ↔ vera_rev1~rev4 4 source 간 의미 충돌 점검.

## 결과

**drift 0건** (의미 충돌 수준).

## 점검 항목별 메모 (no-drift 근거)

| 점검 축 | ia-spec.md | dashboard-upgrade.html | D-094 / D-097 | vera_rev1~rev4 | 판정 |
|---|---|---|---|---|---|
| 사이드바 6 메뉴 (Home/Dashboard/Growth/People/Records/System) | §1 line 28~57 | partials/sidebar.html 6 메뉴 모두 존재 | D-094 axis "Records 정문 = Topics, People 4×2, Growth D-060 안 β" 정합 | vera_rev2 §7-2 second-nav 페이지 내부 탭 정합 | no drift |
| Records 5 sub | §1 line 46~53 / §2-1 line 75~79 | (ops 페이지가 아니므로 직접 노출 X — sidebar partial이 5 sub 모두 link) | D-094 정합 | vera wireframe 정합 | no drift |
| canonical 클래스 카탈로그 `.kpi-row` / `.section-grid` / `.card` / `.flow-row` | §6-1 line 183 "canonical 본체 무회귀" | 실측 `.kpi-row` ≥1, `.section-grid` ≥1, `.card` 30+ 사용 | D-097 axis "kpi-row/section-grid/card/flow-row 표준 카탈로그" 정합 | vera_rev2 §3-4·§7 nav-item active α 0.18 spec과 카탈로그 충돌 없음 | no drift |
| Hero KPI 3 (`[N sessions] [N topics] [N decisions]`) | §5-2 line 154~158 | (Home 영역, dashboard-upgrade에는 적용 X — Home이 채택 페이지) | D-094 axis "Home 가벼운 랜딩" 정합 | vera_rev2 §7-1 wireframe 정합 | no drift |
| Phase 4 hidden state (Growth/People/Deferrals/System) | §6-2 line 187~189 | sidebar partial이 `data-state="pending" aria-disabled="true" tabindex="-1"` 마킹 | D-094 정합 | vera 미언급 (Phase 4 시점) | no drift |
| token / contrast (vera_rev4 정정 대상) | (ia-spec scope 외) | tokens.css 단일 출처 | D-097 "tokens.css 단일 출처" | vera_rev4 §0 `--text-3` hex swap + WCAG 재계산 | no drift (token scope는 IA 외) |
| second-nav 위치 (사이드바 expand vs 페이지 내부 탭) | §2-3 line 92 "페이지 내부 second-nav-tab 채택" | (실제 구현은 Phase 1 G1 진행 중) | D-094 미명시 (low-level) | vera_rev1·rev2 §7-2 정합 | no drift |

## 주의 (drift는 아니지만 추적 필요)

- **People wireframe 미작성** — ia-spec §5-1 H3 "8 역할 활성도 1줄"은 한 줄 정의뿐. Vera rev1~rev4에서 People 페이지 wireframe 별도 박제 없음. drift는 아니나 spec gap. → page-checklist/people.md `spec_completeness: minimal` 마킹으로 흡수.
- **growth.html / people.html / system.html 파일 부재** — Phase 4 신설 페이지로 정상. Phase B에서 골격 작성 또는 hidden state 처리 일관 검증.

## 정본 우선 정책 (drift 발생 시 적용)

향후 drift 발견 시:
1. memory/specs/ia-spec.md를 canonical 정본으로 우선
2. dashboard-upgrade.html canonical 카탈로그가 IA spec과 충돌 시 spec 우선, dashboard-upgrade 본체에 패치 + revision_history 박제
3. D-094/D-097은 STATUS inline tag로 derived 강등 완료 (D-100) — 충돌 시 정본 우선
4. vera_rev*는 산출물 트레이서빌리티 (소급 수정 금지), drift 발생 시 새 vera_rev 박제로 정합화

## 현재 시점 결론

drift 0건. 정본 3종 박제 직후 시점이므로 자연스러운 결과. Phase B 6페이지 PASS report에서 spec ↔ 실측 drift 재탐지 예정.
