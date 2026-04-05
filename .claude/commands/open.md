# /open — 레전드팀 토픽 오픈

사용자가 토픽 오픈을 요청했습니다. 아래 Session Start 체크리스트를 순서대로 실행하세요.

## 체크리스트

1. `memory/sessions/current_session.json` 읽기 — 이전 세션이 열려있는지 확인. 열려있으면 먼저 닫아야 한다고 Master에게 알림.
2. `memory/shared/topic_index.json` 읽기 — 기존 토픽 현황 확인
3. `memory/shared/decision_ledger.json` 읽기 — 기존 의사결정 로드
4. `memory/sessions/session_index.json` 읽기 — 마지막 session ID 확인하여 다음 ID 생성
5. Master에게 토픽 제목과 모드(Observation/Compressed/Report) 확인 (사용자가 이미 제시했으면 그대로 사용)
6. `current_session.json`을 새 세션 정보로 업데이트:
   - 새 sessionId (session_NNN)
   - topic, topicSlug
   - status: "open"
   - startedAt: 현재 시각 (ISO 8601)
   - mode: 확인된 모드 (기본값: observation)
7. `topic_index.json`에 새 토픽 추가 (기존 토픽 재개인 경우 status를 "in-progress"로 변경)
8. 세션 오픈 완료를 Master에게 보고하고, Ace부터 시작

## 규칙
- 기본 모드는 Observation Mode (역할별 순차 발언)
- 사용자가 "$argument"에 토픽 제목을 포함했으면 그대로 사용
- 이전 세션이 닫히지 않았으면 경고 후 Master 판단 대기
