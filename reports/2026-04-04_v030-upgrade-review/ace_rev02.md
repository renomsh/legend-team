---
topic: v0.3.0 업그레이드 항목 검토
role: ace
revision: 2
date: 2026-04-05
status: master-approved
accessed_assets:
  - file: reports/2026-04-04_v030-upgrade-review/ace_rev01.md
    scope: prior framing
  - file: reports/2026-04-04_v030-upgrade-review/arki_rev01.md
    scope: 저장소 진실 확인
  - file: memory/shared/decision_ledger.json
    scope: D-001~D-009
---

# ACE — 재프레이밍 (Arki 저장소 진실 반영)

## 수정된 상황 인식

v0.3.0의 질문은 "무엇을 새로 만들 것인가"가 아니다. 이미 스크립트 대부분이 존재한다.
**진짜 질문: 있는 것들이 왜 연결이 안 돼 있는가, 그것을 연결하는 것이 v0.3.0인가 아니면 그 이상인가.**

## 카테고리 재분류

| 카테고리 | 항목 | 작업 성격 |
|---|---|---|
| 연결 | C-01: session-log.ts start 체크리스트 연결 | 연결 (신규 코드 아님) |
| 연결 | C-02: validate-output.ts 세션 종료 연결 | 연결 |
| 정리 | P-01: config/output.json "agent"→"role", status 통일 | 1줄 수정 |
| 정리 | P-02: master_feedback_log.json JSON 오류 수정 | 1줄 수정 |
| 정리 | P-03: run-debate.ts/build-report.ts 처분 | 결정 작업 |
| 동기화 | S-01: master_preferences.json v0.3.0 + 운용 필드 | 정보 기입 |
| 동기화 | S-02: evidence_index, glossary 최신화 | 정보 기입 |

## 확정된 의사결정 축

### 축 1: A — 정리 + 연결 (D-010)
신규 기능 없음. N-항목 v0.4.0 이연.

### 스크립트 disposition (D-011)
- build-report.ts: publish compiler로 역할 정의 후 재설계
- run-debate.ts: 삭제 예정 legacy
- generate-dashboard.ts: 변경 없음
- session-log.ts: 세션 프로토콜 연결
- validate-output.ts: 세션 종료 체크리스트 연결

### build-report.ts 역할 정의 (D-012, Master 확정)
build-report.ts는 topic_index와 reports/{dir}의 canonical report files를 읽어,
viewer/publish 레이어가 소비하는 topic별 manifest와 summary metadata를 생성하는 publish compiler다.

## OUT-OF-SCOPE
- generate-dashboard.ts 수정
- React/JSX, 새 에이전트, 외부 연동
- validate strict 구현 (정책 결정 후 별도 토픽)
- build-report.ts 실제 재설계 코딩 (역할 정의 완료, 실행은 별도 토픽)
