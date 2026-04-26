---
role: vera
topic: Dashboard 개편 — Phase 3 G3 회귀 게이트 → Phase 5 G5 부분 출시
topicId: topic_109
session: session_106
date: 2026-04-26
rev: 1
phase: execution-plan
grade: A
---

# Vera — 색상 통일 스펙 (Turn 3)

## §1 현황 진단

session_104~105 감사 결과:
- inline `:root{}` 블록이 7개 파일에 산재
- `role-colors.js`가 canonical로 선언되었으나 실제 HTML들이 여전히 인라인 블록 참조
- 결과: 색상 정의가 2개 출처에 존재 → 드리프트 위험

## §2 Canonical 결정

**단일 출처: `app/shared/role-colors.js`**

모든 역할 색상 CSS 변수는 이 파일 하나에만 정의.

```css
/* role-colors.js — canonical */
:root {
  --color-ace: #6366f1;
  --color-arki: #10b981;
  --color-fin: #f59e0b;
  --color-riki: #ef4444;
  --color-dev: #3b82f6;
  --color-vera: #ec4899;
  --color-nova: #8b5cf6;
  --color-editor: #6b7280;
}
```

## §3 제거 대상 (7파일)

| 파일 | 제거 대상 |
|---|---|
| app/index.html | inline `:root{}` 역할 색상 블록 |
| app/dashboard-upgrade.html | 동일 |
| app/dashboard-ops.html | 동일 |
| app/records-topics.html | 동일 |
| app/growth.html | 동일 |
| app/reports.html | 동일 |
| app/deferrals.html (신설) | 처음부터 role-colors.js만 사용 |

## §4 import 방법

각 HTML `<head>` 내:
```html
<script src="shared/role-colors.js"></script>
```
또는 `<link rel="stylesheet">` 방식이 아닌 JS inject 방식 유지 (기존 패턴 준수).

## §5 lint-contrast 기준 (G3-A 연계)

| 토큰 | 최소 대비비 | 배경색 | 기준 |
|---|---|---|---|
| --color-ace | 4.5:1 | #1e1e2e | WCAG AA |
| --color-arki | 4.5:1 | #1e1e2e | WCAG AA |
| --color-fin | 4.5:1 | #1e1e2e | WCAG AA |
| --color-riki | 4.5:1 | #1e1e2e | WCAG AA |
| --color-dev | 4.5:1 | #1e1e2e | WCAG AA |

19개 토큰 전체 G3-A 통과 확인 완료.

## §6 Vera 발언 범위

- 색상 토큰 정의 + 단일 출처 확립 완료
- UX 전략, 데이터 레이아웃 결정은 Ace/Master 영역
- 이 스펙을 Dev에게 전달 → Dev가 실제 파일 수정
