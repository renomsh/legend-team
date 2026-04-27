---
session: session_114
topic: dashboard-home-layout-unification
role: dev
rev: 1
date: 2026-04-27
---

## 변경 내역

### app/css/components.css

1. `.mini-row` grid-template-columns: `1.2fr 1fr 1fr` → `1fr 1fr 1fr`
   - Recent Activity / Pending Deferrals / Cost & Tokens 3패널 균등 폭 적용

2. `.defer-row` 간격 통일:
   - `margin-bottom: 10px` 제거 (`.mini-list gap: 8px`에 위임)
   - `padding: 12px` → `padding: 10px 12px`
   - `gap: 14px` → `gap: 12px`
   - `.mini-item`과 padding/gap 수치 일치

### 검증
- panelWidths: [392.7, 392.7, 392.7] (균등)
- deferRow: { gap: 12px, marginBottom: 0px, padding: 10px 12px }
- miniItem: { gap: 12px, padding: 10px 12px }
