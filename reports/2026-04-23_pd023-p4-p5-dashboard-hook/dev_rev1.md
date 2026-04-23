---
title: "PD-023 P4/P5 Dev 구현 — compute + dashboard + hook 등록"
session: session_084
topic: topic_090
parentTopic: topic_088
date: 2026-04-23
author: dev
status: completed
---

# PD-023 P4/P5 Implementation Report

PD-023 canonical spec ([reports/2026-04-23_pd023-self-scores-thin-impl/arki_rev1.md](../2026-04-23_pd023-self-scores-thin-impl/arki_rev1.md)) §6 Phase P4/P5 + hook chain 등록 통합.

## 산출물

### P4 — compute + resolve + SLA
- [scripts/compute-signature-metrics.ts](../../scripts/compute-signature-metrics.ts)
  - 3뷰 집계 (all / recent10 / recent3)
  - stratified-by-grade (drill-down용 stratum row 별도)
  - derived weighted-mean (lower-better polarity 자동 변환)
  - alerts (redBelow / yellowBelow / trendDropPct)
  - SLA 측정 + warnings (E-010, E-016)
  - 출력: `memory/growth/signature_metrics_aggregate.json`
- [scripts/resolve-deferred-scores.ts](../../scripts/resolve-deferred-scores.ts)
  - dry-run / --apply 2-mode
  - ready=true OR trivial condition만 flush, 나머지는 still-pending 리포트

### P5 — dashboard 3-tier + 카드 템플릿
- [app/signature.html](../../app/signature.html)
  - Tier1: 8 역할 카드 (role_registry.json 동적 렌더, 하드코딩 X)
  - Tier2: per-role metric 표 (axis · mean · n · CI95 · alert)
  - Tier3: drill (raw aggregates 88 rows)
  - view selector (all / recent10 / recent3)
  - integrity 배지 (registry 버전 · record count · SLA · warnings · feature flag)
  - baseline state UI (n < baselineSessions → "baseline" 배지 + dim border)
- [app/role-signature-card.html](../../app/role-signature-card.html)
  - 단일 카드 임베드 템플릿 (`?role=ace&view=all`)

### Hook Chain 등록
[scripts/auto-push.js:71-80](../../scripts/auto-push.js):
```
session-end-tokens.js
→ session-end-finalize.js
→ finalize-self-scores.ts          # NEW
→ resolve-deferred-scores.ts --apply # NEW
→ compute-signature-metrics.ts      # NEW
→ compute-growth.ts
→ compute-dashboard.ts
→ build.js
```

### Fixture
- [tests/fixtures/signature-metrics/full-30/self_scores.jsonl](../../tests/fixtures/signature-metrics/full-30/self_scores.jsonl) — 840 records / 30 sessions / grades S·A·B·C 분포

## Gates Passed

| Gate | 조건 | 실측 |
|---|---|---|
| G4 (P4 DoD) | 3뷰 fixture diff 0 | baseline-10 mean=78.0 spec 일치 ✓ |
| G4 (P4 SLA) | < 3000ms | 1ms (live 7 records) / 3ms (full-30 840 records) ✓ |
| G5 (P5 DoD) | dist/ 빌드 + 8 카드 노출 | 246 files build OK · 8 cards (Ace, Arki, Fin, Riki, Nova, Dev, Vera, Edi) ✓ |
| G5 (Master 검수) | 수동 승인 | "단순해서 판단 여지 없음" → 승인 ✓ |
| 회귀 | smoke 29/29 + roundtrip 11/11 | 통과 ✓ |
| 회귀 | finalize audit non-null ≥ 95% | 100% ✓ |

## 차기 세션 준비

- PD-023 G6 Tier A trigger: 5토픽 누적 + Grade A·B·C 중 ≥ 2종. 현재 1토픽(B). 4토픽 추가 누적 필요.
- 회귀 baseline 잠금: 향후 P4/P5 변경 시 baseline-10 mean=78.0 · full-30 SLA<3s 회귀 점검 필수.
- PD-027 trigger 모니터링: self_scores.jsonl ≥ 100세션 + compute SLA > 2초 3회 발생 시.

## Self-Scores

```yaml
# self-scores
gt_pas: 1   # 모든 게이트 1패스
spc_drf: 0  # 스펙 드리프트 없음
reg_zr: Y   # 회귀 0
```
