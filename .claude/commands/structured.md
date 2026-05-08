# /structured — Structured 모드 전환

현재 세션의 `operationType`을 `structured`로 전환(또는 복귀)한다.

## 동작

1. `memory/sessions/current_session.json` 읽기
2. `operationType` 필드를 `"structured"`으로 갱신
3. `phase` 필드를 `"open"`으로 초기화 (discussion phase 체인 비활성화)
4. 변경 사항을 current_session.json에 저장
5. 전환 보고:
   ```
   [Structured 모드 전환]
   operationType: discussion → structured
   phase: open
   /ace-synthesis 사용 가능
   ```

## 규칙

- discussion 모드에서 복귀하는 주 용도
- 전환 후 일반 역할 순차 발언 모드 재개
- `/ace-synthesis` 사용 가능 상태로 복귀
- discussion 모드로 전환: `/discussion`
- 결정: D-170 (2026-05-07)
