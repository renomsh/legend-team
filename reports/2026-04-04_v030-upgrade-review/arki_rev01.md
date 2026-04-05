---
topic: v0.3.0 업그레이드 항목 검토
role: arki
revision: 1
date: 2026-04-05
status: reviewed
accessed_assets:
  - file: scripts/validate-output.ts
    scope: full
  - file: scripts/session-log.ts
    scope: full
  - file: scripts/build-report.ts
    scope: partial (first 40 lines)
  - file: scripts/generate-dashboard.ts
    scope: partial (first 60 lines)
  - file: scripts/auto-push.js
    scope: full
  - file: scripts/build.js
    scope: full
  - file: config/output.json
    scope: full
  - file: config/workflow.json
    scope: full
  - file: memory/sessions/session_index.json
    scope: full
  - file: memory/master/master_feedback_log.json
    scope: full
  - file: package.json
    scope: full
  - file: app/index.html
    scope: partial
---

# ARKI — 저장소 진실 확인

## 운영 중인 것

| 항목 | 파일 | 상태 |
|---|---|---|
| Cloudflare 빌드 | build.js | 가동 중 — memory/ + reports/ + logs/ 전체 dist/ 복사 |
| 세션 종료 push | auto-push.js | 가동 중 — session-end 연결됨 |
| 다중 페이지 뷰어 | app/*.html + app/js/ | 배포 중 — 5페이지 |

## 파일은 있으나 연결 끊긴 것

| 항목 | 파일 | 실제 상태 |
|---|---|---|
| 세션 시작 로그 | session-log.ts start | session_index.json 빈 배열. start 한 번도 호출 안 됨 |
| 출력 검증 | validate-output.ts | 수동 호출만. CI/pre-commit 연결 없음 |

## 사실상 폐기 상태

| 항목 | 파일 | 이유 |
|---|---|---|
| 리포트 빌드 | build-report.ts | debate_log.json 참조 — 현재 구조에 없음. D-002와 불일치 |
| 토론 실행 | run-debate.ts | 동일 원인 |
| 대시보드 생성 | generate-dashboard.ts | viewer npm script에서만 호출(로컬). build.js 배포 파이프라인과 무관 |
| legacy viewer | app/internal-viewer.html | build.js가 명시적 skip |

## Config 드리프트 확인

| 항목 | config/output.json | validate-output.ts | 실제 파일 |
|---|---|---|---|
| 필드명 | "agent" (오류) | "role" (정상) | role: |
| status 값 | 4개 | 6개 | — |

## master_feedback_log.json JSON 오류

MF-002와 MF-003 사이 중괄호 초과 — invalid JSON 상태.

## 메모리 드리프트

| 파일 | 마지막 업데이트 | 경과 |
|---|---|---|
| master_preferences.json | 2026-04-03 | 2 sessions 미반영 |
| evidence_index.json | 2026-04-03 | 동일 |
| glossary.json | 2026-04-03 | 동일 |
| session_index.json | — | 항상 비어있음 |

## Arki 판정

"자동화가 없어서 만들어야 한다"가 아니라 "연결 끊김 + config 드리프트 + 폐기 미처리"가 진단.
