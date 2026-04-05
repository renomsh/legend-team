# /close — 레전드팀 토픽 종료

사용자가 토픽 종료를 요청했습니다. 아래 Session End 체크리스트를 순서대로 실행하세요.

## 체크리스트

1. `memory/sessions/current_session.json` 읽기 — 현재 열린 세션 확인. 열린 세션이 없으면 Master에게 알림.
2. 에이전트 출력물 저장:
   - 세션 중 생성된 역할별 출력을 `reports/{YYYY-MM-DD}_{topic-slug}/{role}_rev{n}.md`에 저장
   - 이미 저장된 것은 건너뜀
3. `memory/shared/decision_ledger.json` — 세션 중 내려진 새 의사결정 추가
4. `memory/shared/topic_index.json` — 토픽 status 변경 (closed/suspended), outcome 기록
5. `memory/sessions/current_session.json` 업데이트:
   - status: "closed"
   - closedAt: 현재 시각 (ISO 8601)
   - 세션 중 발생한 notes, gaps 기록
6. Master feedback이 있었으면 `memory/master/master_feedback_log.json`에 추가
7. 역할별 학습사항이 있으면 `memory/roles/{role}_memory.json` 업데이트
8. `memory/sessions/session_index.json`에 세션 기록 추가
9. 세션 로그 기록: `ts-node scripts/session-log.ts end <topic-slug>` 실행
10. GitHub push: `node scripts/auto-push.js "session end: <topic-slug>"` 실행 (D-008)

## 규칙
- 각 단계 완료 시 체크 표시하며 진행
- 스킵된 항목이 있으면 `current_session.json`의 gaps에 기록
- push 실패 시 Master에게 수동 push 필요 알림
- 사용자가 "$argument"에 추가 메모를 포함했으면 notes에 반영
