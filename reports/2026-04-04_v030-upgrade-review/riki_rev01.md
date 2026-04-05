---
topic: v0.3.0 업그레이드 항목 검토
role: riki
revision: 1
date: 2026-04-05
status: reviewed
accessed_assets:
  - file: reports/2026-04-04_v030-upgrade-review/arki_rev01.md
    scope: 저장소 진실
  - file: reports/2026-04-04_v030-upgrade-review/ace_rev02.md
    scope: 재프레이밍
  - file: reports/2026-04-04_v030-upgrade-review/fin_rev01.md
    scope: 비용 평가
  - file: memory/sessions/session_index.json
    scope: 호출 이력 확인
  - file: logs/app.log
    scope: 실행 이력 확인
---

# RIKI — 리스크 감사 · 가정 검증 · 실행 왜곡

## R-01 🔴 build-report.ts "재설계" 범위 미정의

결정이 아니라 다음 세션으로의 이연 위험. → **해소: D-012로 역할 한 문장 정의 확정.**

## R-02 🔴 체크리스트 추가 ≠ 실행 보장

session_index.json이 비어있는 것은 체크리스트가 없어서가 아님.
세션 종료 체크리스트가 있었지만 session_002 이후 한 번도 실행 안 됨.
→ **해소: D-013 closure step — session_index 검증을 세션 종료에 추가.**

## R-03 🟡 master_feedback_log.json 파급 범위

invalid JSON 상태로 방치. viewer feedback 섹션 영향 가능성.
→ **해소: P-02 수정 완료. 구조 blocker 아님, 운영 신뢰도 이슈.**

## R-04 🟡 D-007 감사 trail 불일치

decision_ledger D-007 revised vs master_feedback_log MF-002 원본 불일치.
→ **해소: MF-002 개정 이력 보완 완료.**

## R-05 🟡 run-debate.ts 삭제 기준 이미 충족

"legacy 보존"보다 "삭제 예정"이 더 정확.
→ **해소: D-011 삭제 예정 legacy 표기. 다음 세션 첫 항목으로 실제 삭제.**

## R-06 🟢 S-01/N-02 중복

같은 파일에 두 작업명. → **해소: S-01로 통합 처리.**

## R-07 🟢 strict 적용 정책 미정

validate strict 기능 자체가 없음. "적용 정책" 정의 필요.
→ **다음 토픽 분리. validate strict 구현 = X-02.**
