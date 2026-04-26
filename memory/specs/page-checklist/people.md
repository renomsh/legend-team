---
page: app/people.html
spec_source: ia-spec.md §1 (People Phase 4 신설) + §5-1 H3 (People 인덱스 카드)
canonical_ref: app/dashboard-upgrade.html
spec_version: 1.0
spec_completeness: minimal
required_selectors:
  - selector: 'aside.sidebar'
    min_count: 1
  - selector: '.card'
    min_count: 1
required_keywords:
  - "People"
canonical_class_min_usage:
  '.card': 1
sidebar_entry:
  menu: "People"
  path: "people.html"
---

# People (`app/people.html`) — page checklist (minimal)

## Spec source 인용

- ia-spec.md §1 line 43~44 — "People → /people.html [Phase 4 신설] (signature.html 합류, 4×2 grid)".
- ia-spec.md §5-1 line 148 — H3 People 인덱스 카드 "8 역할 활성도 1줄".
- Vera wireframe: People 페이지 wireframe 미작성 (R7 mitigation 박제 — Phase A 산출물에 포함하되 spec source 빈약 명시).

## Spec completeness

**minimal**: Vera wireframe 미작성. 파일은 topic_112 Phase 2에서 signature.html → people.html 통째 이동으로 신설(8 역할 시그니처 카드 뷰어 그대로). 4×2 panel 구조 골격만 박제. Phase 4에서 Vera wireframe 보강 후 `spec_completeness: full` 승격 + `.card` ≥ 8 / 역할별 시그니처 selector 추가 예정.

## R7 mitigation 메모

People은 spec source 빈약하나 Phase A 산출물에 포함하기로 결정 (topic_110 P-3, R7). spec gap이 명시 박제되었으므로 향후 fill-in 추적 가능.

## sidebar_entry

`menu: People` / `path: people.html` (ia-spec.md §2-1 line 74).
