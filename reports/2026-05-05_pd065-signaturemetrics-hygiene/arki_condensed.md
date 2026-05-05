---
title: "PD-065 signatureMetrics 잔재 위생 — Arki 구조 분석 (condensed)"
role: arki
topicId: topic_168
date: 2026-05-05
turnId: 3
invocationMode: subagent
condensedBy: zero
sourceFile: arki_rev1.md
---

# Arki — PD-065 구조 분석 (condensed)

## 스캔 결과

50개 파일, 약 130+건 (reports 디렉터리 70건 포함)

---

## 수정 판단 요약

### 수정 불가 — 런타임 하드 참조 4개

| 파일 | 이유 |
|---|---|
| `app/growth.html` | `signatureMetricsEnabled` 직접 조회 — 키 변경 시 feature flag 파탄 |
| `memory/shared/feature_flags.json` | `signatureMetricsEnabled`/`signatureMetricsCardsVisible` — app + test 양쪽 직접 assert |
| `scripts/compile-metrics-registry.ts` (L93-94) | dead-key migration warn 안전망 — 제거 시 마이그레이션 누락 감지 불가. 주석(L3/L88/L115)은 수정 가능 |
| `scripts/test-p0b-smoke.ts` | `signatureMetricsEnabled === true` 직접 assert — 키 변경 시 즉시 fail |

### 보존 필수 — 역사 기록 41개

세션 보고서(`session_contributions/`), 토픽 메타, `decision_ledger.json`, `session_index.json` 전체. 수정 시 역사 왜곡.

### 별도 결정 필요 1개

`scripts/seed-signature-metrics.ts` — 구 스키마(`signatureMetrics`) write. one-time bootstrap 목적이나 명시적 deprecated 선언 부재.

### 수정 대상 5개

| # | 파일 | 우선순위 | 변경 내용 |
|---|---|---|---|
| 1 | `memory/roles/personas/role-vera.md` | MUST_NOW | L8: `signatureMetrics` → `metrics(구 signatureMetrics)` |
| 2 | `memory/growth/phase_dod.json` | MUST_NOW | L34: `signatureMetrics 8역할` → `metrics 8역할 (구 signatureMetrics, D-092)` |
| 3 | `memory/growth/composite_inputs.json` | SHOULD | `_comment` 1줄: `signatureMetrics 배열에는 미포함` → `metrics 배열에는 미포함 (구 signatureMetrics)` |
| 4 | `memory/growth/rollback_playbook.md` | SHOULD | 코멘트에 "feature_flags.json 런타임 키" 명시. 키 이름 자체 유지 |
| 5 | `memory/specs/page-checklist/growth.md` | NICE | `signatureMetricsEnabled` 설명에 "(feature_flags.json key — 런타임 분기용)" 보강 |

---

## 구조적 경계 조건

- `feature_flags.json` 키 rename = 별도 토픽 필요 (app + test 동시 변경)
- `compile-metrics-registry.ts` L93-94 warn 로직 유지 권장 (향후 실수 방어)
