# Session 005 — v0.3.0 운영 부채 폐쇄 명령서

작업 라운드: v0.3.0 운영 부채 폐쇄
중요: 이번 라운드는 "확장"이 아니라 "닫기"다.

## 작업 원칙
1. root/main 기준 현재 상태만 본다. 과거 프레이밍 재인용 금지.
2. 이미 해결된 항목을 다시 아젠다로 올리지 않는다.
3. 판단보다 실행. 파일 단위 수정으로 끝낸다.
4. build/publish/viewer 계약을 바꾸는 작업 금지.
5. 닫을 것은 "독립적 / 가역적 / 세션 내 검증 가능 / 배포 의미를 바꾸지 않는 것"만.

## 실행 항목
- A. OP-01 — master_feedback_log.json 정리
- B. OP-03 — run-debate.ts deprecated 처리
- C. OP-04 — session 실행 확인 루프 (이번 세션 반드시 닫기)
- D. OP-05 — limited frontmatter migration
- E. OP-06 — session_index gap 기록
- F. evidence 1줄 기록
- G. master_preferences 기록만

## 실행 순서
1. OP-04 / OP-06
2. OP-01
3. OP-03
4. OP-05
5. Evidence
6. master_preferences

## 보강 지시 (Master 추가)
1. OP-04: 신규 파일 생성보다 session-log.ts 확장 우선. 별도 스크립트 불가피 시 사유 1줄 명시.
2. OP-01: D-007 불일치 필드 목록화 → 수정 → diff 요약 순서.
3. OP-05: status 통일 = `approved`. `master-approved` → `approved`. `partial (...)` → `partial` + note 필드.
4. OP-04 검증: session_index.json에 이번 세션 엔트리 정상 기록 = pass, 아니면 fail + 원인.
5. F/G 스키마: master_preferences 신규 필드 추가 허용, 기존 필드 삭제/이름변경 금지. evidence_index 엔트리 추가만 허용.

## 금지 사항
- OP-02 코드 재작업, published 흐름 변경
- evidence_index 강제 프로토콜
- master_preferences 자동 반영 구조
- viewer 신규 기능/전략 논의
- frontmatter 전면 migration
- build/publish/viewer 계약 변경
