# /close — 레전드팀 토픽 종료

사용자가 토픽 종료를 요청했습니다. 아래 Session End 체크리스트를 순서대로 실행하세요.

## 체크리스트

1. `memory/sessions/current_session.json` 읽기 — 현재 열린 세션 확인. 열린 세션이 없으면 Master에게 알림.
2. 에이전트 출력물 저장:
   - 세션 중 생성된 역할별 출력을 `reports/{YYYY-MM-DD}_{topic-slug}/{role}_rev{n}.md`에 저장
   - 이미 저장된 것은 건너뜀
3. `memory/shared/decision_ledger.json` — 세션 중 내려진 새 의사결정 추가
4. `memory/shared/topic_index.json` — 토픽 status 변경. **허용 값은 `memory/shared/status_catalog.json`의 statuses[].id만** (현재: open / in-progress / completed / suspended). `closed`는 legacy alias → 반드시 `completed`로 기록. outcome 기록.
5. `memory/sessions/current_session.json` 업데이트:
   - status: "closed"
   - closedAt: 현재 시각 (ISO 8601)
   - 세션 중 발생한 notes, gaps 기록
6. Master feedback이 있었으면 `memory/master/master_feedback_log.json`에 추가
7. 역할별 학습사항이 있으면 `memory/roles/{role}_memory.json` 업데이트
8. **[자동]** `memory/sessions/session_index.json` 세션 기록 추가 — `session-end-finalize.js` hook이 `current_session.json` status=closed 확인 시 자동 append (agentsCompleted·decisions·note 포함). 수동 실행 불필요. (PD-009)
9. **[자동]** `memory/shared/system_state.json` 재계산 — `sync-system-state.ts`가 hook 체인에서 자동 실행 (lastSessionId·nextSessionId·openTopics·recentDecisions 갱신). pendingDeferrals는 수동 관리.
10. **[자동]** `memory/sessions/token_log.json` 토큰 집계 — `session-end-tokens.js` hook이 transcript 파싱하여 append.
11. **[자동]** `memory/shared/dashboard_data.json` 재계산 — `compute-dashboard.ts`가 hook 체인에서 자동 실행.
12. **[자동]** `dist/` 빌드 — `build.js`가 hook 체인에서 자동 실행 (Cloudflare Pages 반영).
13. 세션 로그 기록: `ts-node scripts/session-log.ts end <topic-slug>` 실행
14. GitHub push: `node scripts/auto-push.js "session end: <topic-slug>"` 실행 (D-008)

## SessionEnd Hook 체인 (.claude/settings.json)
```
session-end-tokens.js → session-end-finalize.js → compute-dashboard.ts → build.js
```
Hook 발동 진단 로그: `logs/hook-diagnostics.log` 확인. 미발동 시 수동 실행:
- `npx ts-node scripts/sync-system-state.ts`
- `npx ts-node scripts/compute-dashboard.ts && node scripts/build.js`

## 규칙
- 각 단계 완료 시 체크 표시하며 진행
- 스킵된 항목이 있으면 `current_session.json`의 gaps에 기록
- push 실패 시 Master에게 수동 push 필요 알림
- 사용자가 "$argument"에 추가 메모를 포함했으면 notes에 반영
