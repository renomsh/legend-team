---
topic: v0.3.0 업그레이드 항목 검토
role: editor
revision: 1
date: 2026-04-05
status: final
accessed_assets:
  - file: reports/2026-04-04_v030-upgrade-review/ace_rev01.md
    scope: session_004 프레이밍
  - file: reports/2026-04-04_v030-upgrade-review/arki_rev01.md
    scope: 저장소 진실
  - file: reports/2026-04-04_v030-upgrade-review/ace_rev02.md
    scope: 재프레이밍
  - file: reports/2026-04-04_v030-upgrade-review/fin_rev01.md
    scope: 비용 평가
  - file: reports/2026-04-04_v030-upgrade-review/riki_rev01.md
    scope: 리스크 감사
  - file: memory/shared/decision_ledger.json
    scope: D-010~D-013
---

# v0.3.0 업그레이드 항목 검토 — 최종 산출물

## 확정 결정 (session_005)

| 결정 ID | 내용 |
|---|---|
| D-010 | v0.3.0 범위: 정리 + 연결. 신규 기능 없음. |
| D-011 | 스크립트 처분: build-report.ts 재설계, run-debate.ts 삭제 예정, 나머지 연결 |
| D-012 | build-report.ts 역할: topic_index + canonical reports → topic manifest + summary metadata (publish compiler) |
| D-013 | 세션 로깅 closure step: session_index.json 검증을 세션 종료에 추가 |

## 이번 세션 실행 완료 항목

| ID | 작업 | 파일 |
|---|---|---|
| P-01 | config/output.json "agent"→"role", status 통일 | config/output.json |
| P-02 | master_feedback_log.json JSON 오류 수정 | memory/master/master_feedback_log.json |
| P-03 | D-007 감사 trail 보완 (MF-002 개정 이력 추가) | memory/master/master_feedback_log.json |
| P-04 | run-debate.ts 삭제 예정 legacy 표기 | scripts/run-debate.ts |
| C-01 | CLAUDE.md 세션 시작에 session:start 추가 | CLAUDE.md |
| C-02 | CLAUDE.md 세션 종료에 closure step 추가 | CLAUDE.md |
| C-03 | CLAUDE.md 세션 종료에 validate 연결 추가 | CLAUDE.md |
| S-01 | master_preferences.json v0.3.0 기록 + 운용 필드 실질화 | memory/master/master_preferences.json |
| S-02 | evidence_index.json, glossary.json 세션003/004/005 반영 | memory/shared/ |

## 다음 토픽 분리 항목

| ID | 작업 |
|---|---|
| X-01 | build-report.ts 실제 재설계 코딩 (D-012 정의 기준) |
| X-02 | validate strict 적용 정책 결정 및 구현 |
| X-03 | run-debate.ts 실제 삭제 (다음 세션 첫 항목) |

## v0.3.0 선언

정리 + 연결 완료. 운영 부채 청산, config 드리프트 해소, 세션 프로토콜 실행 고리 확보.
