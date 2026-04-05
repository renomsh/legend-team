---
topic: v0.3.0 업그레이드 항목 검토 (운영 부채 청산)
role: ace
revision: 2
date: 2026-04-05
status: master-approved
accessed_assets:
  - file: reports/2026-04-05_v030-upgrade-review/arki_rev01.md
    scope: 구조 설계 전체
  - file: reports/2026-04-05_v030-upgrade-review/fin_rev01.md
    scope: 비용 평가 (프레임 교체됨)
  - file: reports/2026-04-05_v030-upgrade-review/riki_rev01.md
    scope: 리스크 분류 전체
  - file: memory/shared/decision_ledger.json
    scope: D-001~D-009
---

# ACE — 종합검토 (rev02)

## 역할별 기여 교차검증

| 역할 | 핵심 기여 | 채택 여부 |
|---|---|---|
| Ace rev02 | 범위를 "운영 부채 청산"으로 재정의. OP-01~06 도출. | 채택 |
| Arki | 레이어 단절 구조 진단. build-report.ts 새 계약 설계. standalone+packaging 분리. | 채택 (Master 확정) |
| Fin | 비용 레이블 프레임 — 이 국면에서 부적절. | 프레임 교체됨 |
| Riki | "닫을 것/넘길 것/번지는 것" 3분류. OP-02 착수 조건 강제. 번지는 항목 명시. | 채택 (Master 수정 포함) |

## 충돌 해소

- OP-03: Arki 즉시 이동 권고 → Riki 조건부 처리(참조 0 확인)로 확정
- OP-05 비표준 필드: 현상 유지 (정책 결정 선행 필요)
- OP-02 착수 조건: OP-01~05 완료 후 강제 게이트

## 최종 실행 리스트

```
게이트 1 (즉시 닫기)
  OP-01  master_feedback_log.json JSON 수정 + D-007 보정
  OP-03  run-debate.ts 참조 확인 → 이동 or deprecated
  OP-05  status 필드 migration (비표준 필드 현상 유지)
  OP-06  session_index.json gap 기록

게이트 2 (이번 세션 종료 시 검증)
  OP-04  sessionLogCalled 플래그 + CLAUDE.md 갱신 + session-log.ts 직접 검증

게이트 3 (게이트 1+2 완료 후 완주)
  OP-02  build-report.ts 재설계 + published/ + build.js + data-loader.js + 배포 검증
```

## 손대지 않는 것

- retroactive: true 등 비표준 필드
- topic.html path fallback (OP-02 완료 전)
- topics/topic_001/ 디렉토리

## 의사결정 기록 권고

- D-010: build-report.ts = standalone publish compiler. build.js = packaging only. published/ 신설.
- D-011: frontmatter status = master-approved 단일화.
- D-012: session 확인 = sessionLogCalled 플래그(임시) + session_index.json 원장(최종).
