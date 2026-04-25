---
topic: PD-023 구현 점검
session: session_100
role: arki
phase: structural-analysis
revision: 1
date: 2026-04-25
report_status: superseded
session_status: closed
accessed_assets:
  - self-scores-schema.ts
  - session-end-finalize.js
  - role_registry.json
---

# Arki rev1 — PD-023 구현 매트릭스 + 잔여 분해

## 매트릭스 (코드 evidence 기반)

| Phase | 상태 | Evidence | 비고 |
|---|---|---|---|
| P0a self_scores.jsonl 스키마 | done | scripts/lib/self-scores-schema.ts | Ajv 통과 |
| P0b 8역할 카드 spec | done | memory/roles/personas/role-*.md | 8/8 |
| P1 finalize hook YAML 추출 | done | .claude/hooks/session-end-finalize.js | regex extract |
| P2 default-fallback 차단 | done | D-065 B 조치, allowDefaultFallback=false | propagation 0 |
| P3 yaml-block 기록률 | partial | 70 records / 86% default | 운영 KPI 미달 |
| P3-supp persona instruction | done | 8/8 페르소나 mention 확인 (PD-035) | C7 |
| P4 dashboard 집계 SLA | done | compute-dashboard.ts <3ms | SLA 통과 |
| P5 signature.html 통합 | partial | base form 배포 완료 / nav 통합 대기 | topic_082 의존 |

## 잔여 분해

- followup-A: tests/regression/ baseline 잠금 (test-regression.ts 자동화)
- followup-B: signature.html main nav 통합 (topic_082 closed 후 promote)
- Quick-win: scripts/batch-score-helper.ts + scripts/validate-self-scores.ts

## 구조 권고

- "코드 done / 운영 KPI open" 이원화. statusNote에 KPI 미달 명시.
- PD-031의 "재활성화 protocol 설계 필요" 항목은 PD-023 P3 운영 KPI 잔여로 흡수 가능 — 트랙 중복.
