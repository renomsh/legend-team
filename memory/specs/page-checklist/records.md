---
page: app/topic.html
spec_source: ia-spec.md §1 (Records 5 sub) + §3 (Sessions 내부 3탭) + §4 (4 entity 링크)
canonical_ref: app/dashboard-upgrade.html
spec_version: 1.0
spec_completeness: full
required_selectors:
  - selector: 'aside.sidebar'
    min_count: 1
  - selector: '.card'
    min_count: 1
required_keywords:
  - "Topics"
canonical_class_min_usage:
  '.card': 1
sidebar_entry:
  menu: "Topics"
  path: "topic.html"
---

# Records 5 sub — 통합 page checklist

Records는 단일 페이지가 아닌 5 sub의 통합 navigation entry. 본 파일은 Records / Topics(default)의 page checklist이며, 나머지 4 sub는 아래 섹션별 selector spec으로 분리 박제.

## frontmatter scope

frontmatter는 default sub인 **Records / Topics (`app/topic.html`)** 기준. g0_5-spec-check.mjs는 frontmatter의 `page`만 검증. 나머지 4 sub는 별도 selector 섹션을 future-extension 슬롯으로 둔다 (Phase B에서 sub별 page-checklist 분화 가능).

## Spec source 인용

- ia-spec.md §1 line 46~53 — Records 5 sub 트리.
- ia-spec.md §2-1 line 75~79 — 5 sub 라우팅 표.
- ia-spec.md §3 — Sessions 내부 3탭 (current/history/turnflow).
- ia-spec.md §4-1 — 4 entity 상호 링크 매트릭스.
- ia-spec.md §6-3 — Records 부분 출시 처리 (Topics 1차, Sessions·Decisions·Feedback 자동, Deferrals 신설).

---

## Sub selector 정의 (future-extension)

### Records / Topics — `app/topic.html` (default, full)
- required_selectors: `aside.sidebar` ≥ 1, `.card` ≥ 1
- required_keywords: "Topics"
- 컴포넌트: topic-card + session-chip-row (Phase 1 G1 신규)

### Records / Sessions — `app/session.html` (full)
- required_selectors: `aside.sidebar` ≥ 1, `.card` ≥ 1
- required_keywords: "Sessions"
- hash routing: `#tab=current` / `#tab=history` / `#tab=turnflow`

### Records / Decisions — `app/decisions.html` (full)
- required_selectors: `aside.sidebar` ≥ 1, `.card` ≥ 1
- required_keywords: "Decisions"
- 딥링크: `?id=D-xxx`

### Records / Feedback — `app/feedback.html` (full)
- required_selectors: `aside.sidebar` ≥ 1, `.card` ≥ 1
- required_keywords: "Feedback"
- 딥링크: `?id=F-xxx`

### Records / Deferrals — `app/deferrals.html` (full, Phase 4 신설이지만 파일 존재 확인됨)
- required_selectors: `aside.sidebar` ≥ 1, `.card` ≥ 1
- required_keywords: "Deferrals"
- 딥링크: `?id=PD-xxx`
- D3 dependsOn 그래프는 Phase 4 보강

## sidebar_entry

frontmatter 기준 `menu: Topics` / `path: topic.html` (Records 그룹 default).
