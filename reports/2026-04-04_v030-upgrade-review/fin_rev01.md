---
topic: v0.3.0 업그레이드 항목 검토
role: fin
revision: 1
date: 2026-04-05
status: reviewed
accessed_assets:
  - file: reports/2026-04-04_v030-upgrade-review/arki_rev01.md
    scope: 저장소 진실
  - file: reports/2026-04-04_v030-upgrade-review/ace_rev02.md
    scope: 재프레이밍
---

# FIN — 비용 / 리턴 / 자원 평가

## 평가 전제

이번 v0.3.0: 신규 기능 없음, 인프라 변경 없음. 모든 비용 = Claude Code 세션 시간.

## 항목별 비용·리턴

| 항목 | 비용 | 리턴 | 판정 |
|---|---|---|---|
| P-01 config 수정 | 극소 | 높음 | 즉시 실행 |
| P-02 JSON 오류 수정 | 극소 | 높음 | 즉시 실행 |
| P-03 감사 trail 보완 | 극소 | 중 | 즉시 실행 |
| C-01 session:start 연결 | 소 | 높음 | CLAUDE.md 수정 |
| C-02 closure step 삽입 | 소 | 높음 | CLAUDE.md 수정 |
| C-03 validate 연결 | 소 | 중 | CLAUDE.md 수정 |
| S-01 preferences 갱신 | 소 | 중 | 정보 기입 |
| S-02 메모리 동기화 | 소 | 중 | 정보 기입 |
| run-debate.ts legacy | 극소 | 낮음(리스크 관리) | 주석 추가 |
| build-report.ts 재설계 | 다음 토픽 | — | 역할 정의 완료 후 별도 |

## 핵심 발견

P/C/S + run-debate 항목 합산 반 세션 이내. build-report.ts 재설계만 비용 미정이었으나
역할 정의(D-012) 확정으로 다음 토픽 분리 결정. v0.3.0 전체 비용 구조 명확해짐.

## Fin 권고

모든 즉시 실행 항목 이번 세션 처리. build-report.ts 재설계는 별도 토픽.
