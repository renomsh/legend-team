---
topic: v0.3.0 업그레이드 항목 검토 (운영 부채 청산)
role: riki
revision: 1
date: 2026-04-05
status: master-approved
accessed_assets:
  - file: reports/2026-04-05_v030-upgrade-review/arki_rev01.md
    scope: OP 항목 전체
  - file: reports/2026-04-05_v030-upgrade-review/fin_rev01.md
    scope: 비용 분류 검토
  - file: scripts/build.js
    scope: auto-push 영향 범위
---

# RIKI — 리스크 검토 및 실행 분류

## 분류 기준

"지금 닫을 것 / 다음으로 넘길 것 / 손대면 번지는 것"

## 지금 닫을 것 (🟢)

### OP-01 — master_feedback_log.json JSON 수정 + D-007 보정
- feedback.html 이미 깨진 상태. 배포 중 운영 손실 발생 중.
- 범위: JSON 두 곳 수정. 의존성 없음.

### OP-03 — run-debate.ts 처리
- 참조 0 확인 시 즉시 _archived/ 이동.
- 참조 존재 시 deprecated 주석만 추가 + 다음 세션 이동.
- topics/topic_001/ 디렉토리: 삭제 금지. 다음 세션 Master 판단.

### OP-05 — frontmatter migration (범위 한정)
- status: partial → draft (ace_rev01 v030-upgrade-review)
- approved → master-approved (해당 파일)
- retroactive: true 등 비표준 필드: 현상 유지 (번지는 것)

### OP-06 — session_index.json gap 기록
- 소급 불가. gap 사실 자체를 기록으로 종결.

## 다음으로 넘길 것 → Master 수정으로 이번 세션 처리 (🟡→🟢)

### OP-04 — session 확인 루프
- current_session.json에 sessionLogCalled 플래그 추가 (임시)
- CLAUDE.md 세션 체크리스트 업데이트
- 이번 세션 종료 시 session-log.ts 직접 호출로 검증

## 마지막 (한 번에 완주, OP-01~05 완료 후)

### OP-02 — build-report.ts 재설계
- 중단 시 D-008 auto-push로 반완성 코드가 main에 반영됨.
- 착수 조건: OP-01~05 완료 후 한 번에 완주.

## 손대면 번지는 것 (🔴)

- OP-05 중 비표준 필드 (retroactive: true 등) — 스키마 확장으로 번짐
- topic.html path fallback 정리 — OP-02 완료 전 손대면 viewer 파괴
- topics/topic_001/ 정리 — v0.1 history + _archived/ 이동 기준 미정

## Fin 프레이밍 반박

OP-02 "착수까지만" 분류는 중단 리스크 과소평가.
반쪽 완성 + auto-push = 배포 파이프라인 반완성 상태 main 반영.
착수 조건 강제 필요.

## Master 확정 사항

- OP-04: 이번 세션 처리 + 세션 종료 시 직접 검증 ✓
- OP-03: 참조 0 확인 후 즉시 이동, 아니면 deprecate + 다음 세션 ✓
- 전체 분류 방식 채택 ✓
