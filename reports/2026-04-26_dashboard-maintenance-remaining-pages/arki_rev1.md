---
role: arki
session: session_111
topic: dashboard-maintenance-remaining-pages
date: 2026-04-26
rev: 1
---

# Arki 구조 진단 — 대시보드 7페이지 아키 변경 필요 항목

## 1. 컴포넌트 발산도 분석

### .card 3중 정의
| 위치 | 배경 | border-radius | padding | 판정 |
|---|---|---|---|---|
| components.css §6 | var(--panel) solid | 16px | 22px | ✅ canonical |
| style.css | linear-gradient (--surface) | var(--radius-md) | var(--space-md) 18px | ❌ 제거 |
| growth.html inline | var(--panel) solid | 14px | 20px | ❌ 제거 |

- .s-main/.s-crumb/.s-h1: components.css §10 canonical — 정상
- sidebar/nav CSS: decisions/feedback/deferrals/topic/session 5페이지에 동일 복사본 중복

## 2. 페이지 카테고리 분류

| 카테고리 | 페이지 | 레이아웃 패턴 | 판정 |
|---|---|---|---|
| Records | decisions/feedback/deferrals | s-main + chip/list | 정상 |
| Analysis | growth/people | kpi-row + panel-grid | 정상 |
| Detail | session/topic | tab-bar + card | 정상 |

## 3. CSS 단일화 우선순위

1. G0: .card 3중 정의 해소 → components.css §6 단일화
2. G1: decisions/feedback sidebar CSS 중복 제거
3. G2: .badge/.table → components.css §13~§14 공통화
4. G3: deferrals/people/topic sidebar CSS 제거 + tab-bar → §11
5. G4: session.html sidebar CSS 제거
6. G5: version bump 일괄

## 4. 구조적 실행계획

```
G0 (.card 단일화)
  ↓
G1 (decisions/feedback <style> 제거)
  ↓
G2 (badge/table components.css 흡수)
  ↓
G3 (deferrals/people/topic 정리)
  ↓
G4 (session.html 정리)
  ↓
G5 (version bump + build)
```

의존 그래프: G0 → G1~G4 (병렬 가능) → G5
검증 게이트: 각 단계 후 preview_snapshot으로 nav/content 렌더링 확인
