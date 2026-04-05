---
topic: v0.3.0 업그레이드 항목 검토 (운영 부채 청산)
role: fin
revision: 1
date: 2026-04-05
status: draft
accessed_assets:
  - file: reports/2026-04-05_v030-upgrade-review/arki_rev01.md
    scope: OP 항목 전체
---

# FIN — 비용·리소스·실행 부담 평가

## 항목별 실행 비용 평가

| ID | 항목 | 실행 비용 | 복구 비용 | 우선순위 |
|---|---|---|---|---|
| OP-01 | feedback_log JSON fix + D-007 보정 | 낮음 | 낮음 | 즉시 |
| OP-03 | run-debate.ts archive | 낮음 | 낮음 | 즉시 |
| OP-05 | frontmatter migration | 중간 | 중간 | 즉시 |
| OP-06 | session_index gap 기록 | 낮음 | 낮음 | 즉시 |
| OP-04 | session 확인 루프 | 중간 | 중간 | 다음 순서 |
| OP-02 | build-report.ts 재설계 | 높음 | 높음 | 마지막 |

## Master 피드백

비용 레이블 프레임이 이 국면에서 부적절. "지금 닫을 것 / 다음으로 넘길 것 / 손대면 번지는 것" 분류가 맞음.
→ Riki 검토로 위임.
