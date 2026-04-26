---
role: dev
topic: topic_110
session: session_107
phase: execution-plan
rev: 1
---

# Dev — Phase A 산출 보고

## 작성/변경 파일

- `memory/specs/ia-spec.md` — 신규(정본). canonical frontmatter prepend.
- `memory/specs/page-checklist/index.md` — Home (full)
- `memory/specs/page-checklist/dashboard-upgrade.md` — canonical 자기 (full)
- `memory/specs/page-checklist/dashboard-ops.md` — Ops (full, .card min=2 lower bound)
- `memory/specs/page-checklist/growth.md` — minimal (Phase 4 신설)
- `memory/specs/page-checklist/people.md` — minimal (R7 mitigation)
- `memory/specs/page-checklist/records.md` — Topics(default) full + 5 sub future-extension
- `scripts/g0_5-spec-check.mjs` — 신규. ESM, no external deps, --mode=report|enforce
- `memory/shared/decision_ledger.json` — D-094/D-097 STATUS inline + D-100 추가
- `topics/topic_110/spec-4way-diff.md` — drift 0건

## g0_5-spec-check.mjs --mode=report 결과

- [PASS] dashboard-ops.md → app/dashboard-ops.html
- [PASS] dashboard-upgrade.md → app/dashboard-upgrade.html (canonical sanity 통과)
- [WARN] growth.md (파일 부재, minimal)
- [FAIL] index.md (.kpi-row/.kpi/.section-grid 0건, "Growth/People/Records" 키워드 미발견)
- [WARN] people.md (파일 부재, minimal)
- [FAIL] records.md → app/topic.html (.card 0건, canonical 미적용)

합계: PASS 2 / WARN 2 / FAIL 2 (report 모드 exit 0)

## 4-way diff 결과

drift 0건. 정본 ↔ canonical ↔ ledger ↔ vera_rev1~4 정합. People wireframe gap은 spec gap → people.md `spec_completeness: minimal`로 흡수.

## 자가검토

records.md 5 sub 통합 frontmatter `page` topic.html 1개 처리가 unsure — Phase B에서 5 sub 분화 필요 시 분해 비용 발생 가능. 현재 R6 컨벤션 침습 최소화 우선 (Master Q6=a 채택으로 통합 유지 확정).
