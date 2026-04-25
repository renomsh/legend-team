---
session: session_102
topic: maintenance-d087-pd036-metrics-fix
grade: D
role: dev
date: 2026-04-25
---

# D 단발 — 유지보수 3건

## A-1: decision_ledger D-087~D-091
이미 동기화 완료 상태. D-087(session_098)~D-091(session_100) 전 항목 decision+value 필드 존재 확인.

## A-2: PD-036 resolved 전이
session_097 구현 완료 + 3세션 summary 생성 확인 + /open 3.5-b 동작 → resolved.

## A-5: compile-metrics-registry schema fix
- `editor.gap_pinning_accuracy`: settlementOffset/settlementStrategy → `_reserved` 이동
- `nova.promotion_rate`: deprecated/deprecatedAt/replacedBy → lifecycleState:"deprecated"/supersededBy/_reserved 재매핑
- 결과: Ajv E-006 additional properties 오류 해소, compile-metrics-registry OK
