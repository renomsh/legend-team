---
title: "PD-065 signatureMetrics 잔재 위생 — Riki 리스크 감사 (condensed)"
role: riki
topicId: topic_168
date: 2026-05-05
turnId: 1
invocationMode: subagent
condensedBy: zero
sourceFile: riki_rev1.md
---

# Riki — PD-065 리스크 감사 (condensed)

## Arki 판단 검증 결과

4개 "수정 불가" 파일 전부 직접 확인 — 모두 정확. 뒤집을 항목 없음.

---

## 리스크 보고

### 🟡 R-1. seed-signature-metrics.ts 재실행 리스크 (실재)

Arki가 "별도 결정 유보"로 분류한 이 스크립트는 현재도 `mem.signatureMetrics = metrics`(구 키)로 write한다.
재실행 시: 8개 역할 메모리의 `metrics` 키 누락 → `compile-metrics-registry.ts`가 건너뜀 → `metrics_registry.json` 0건 → growth 대시보드 빈 화면.

**완화**: 파일 상단에 deprecated 주석 1줄 추가 (`// DEPRECATED — D-092 이후 재실행 금지`). 별도 결정 불필요.

### 🟢 R-2·R-3 — 패스

역사 기록 보존(41개)·page-checklist NICE 수정 모두 실재하는 파손 경로 없음. Arki 판단 지지.

---

## 수정 대상 최종 의견 (Riki 추가 항목 포함)

| # | 파일 | 우선순위 |
|---|---|---|
| 1 | `memory/roles/personas/role-vera.md` | MUST_NOW |
| 2 | `memory/growth/phase_dod.json` | MUST_NOW |
| 3 | `memory/growth/composite_inputs.json` | SHOULD |
| 4 | `memory/growth/rollback_playbook.md` | SHOULD |
| 5 | `memory/specs/page-checklist/growth.md` | NICE |
| **6** | **`scripts/seed-signature-metrics.ts`** | **SHOULD** (deprecated 주석 1줄) |
