---
session: session_103
topic: topic_108
role: dev
rev: 1
date: 2026-04-25
---

# Dev 구현 — PD-041 test-regression MVP

## 변경 파일
- 신규: `scripts/test-regression.ts` (132 lines)
- 신규: `tests/fixtures/regression/01_empty/{registry.json, self_scores.jsonl, expected_compute.json}`
- 신규: `tests/fixtures/regression/02_baseline_n3/{registry.json, self_scores.jsonl, expected_compute.json}`

## Scope-out 준수
- `scripts/auto-push.js` 수정 없음 (hook 미편입)
- `scripts/compute-signature-metrics.ts` 수정 없음
- `feature_flags.json` regression 항목 없음
- `--update` 플래그 미구현 (Unknown flag → process.exit(2))

## 설계 원칙
- `export function runRegression(fixturesDir, update): RegressionResult[]` callable 구조
- fixture enumerate via `/^\d{2}_/` 정규식 — 코드 zero-hardcode
- `NON_DETERMINISTIC_FIELDS` Set: computedAt·durationMs·slaBreached·slaWarnMs·sourceJsonl 제외
- canonical diff: key 정렬 + 비결정 필드 제외 JSON.stringify

## 런타임 검증 (3단)
- (a) fresh run: `PASS 01_empty` + `PASS 02_baseline_n3`, exit=0 ✅
- (b) mean 80→81 주입: `FAIL 02_baseline_n3` line 8/20/32 정확 검출, exit=1 ✅
- (c) 원복 후 재실행: `PASS` 복귀, exit=0 ✅

## PD-041 resolveCondition
- "구현 완료" ✅
- "fixture 5종 PASS" → MVP 합의로 2종 (Master 승인) ✅
- 의도적 회귀 FAIL 검출 ✅

selfScores: {impl_complexity: 70, test_coverage: 75, scope_adherence: 90}
