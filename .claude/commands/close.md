# /close — 레전드팀 토픽 종료

사용자가 토픽 종료를 요청했습니다. 아래 Session End 체크리스트를 순서대로 실행하세요.

## 체크리스트

1. `memory/sessions/current_session.json` 읽기 — 현재 열린 세션 확인. 열린 세션이 없으면 Master에게 알림.
1.5. **[D-131 / D-166] Zero→Edi 호출 게이트 (Grade S/A/B 전용)**
   - `current_session.json.grade`가 `S/A/B`인 경우:
     1. **Zero 서브에이전트 먼저 호출** — D.Condense 게이트 실행: `reports/{reportPath}/condensed.md` + `_zero_condense.json` 마커 작성. prompt 첫 줄 `## ROLE: zero` 명시.
     2. Zero 완료 후 → **Edi 서브에이전트 호출**하여 `edi_rev1.md` 작성 후 Step 2 진행.
   - **Grade C/D는 본 게이트 면제** — Edi 직행. mechanical fallback만 박제.
   - skip 시 hook(`auditEdiLlmInvocation`)이 다축 4신호(gaps + openMasterAlerts + master_feedback_log + log) 자동 박제. fallback은 `edi_auto_rev1.md`로 별도 박제됨.
   - **참고**: hook 자체는 LLM 호출 못 하므로 본 step은 skill 차원 권고. 실제 enforcement는 hook의 다축 신호(`auditEdiLlmInvocation`) + Zero Condense 게이트(`evaluateZeroCondenseGate`).
2. 에이전트 출력물 저장:
   - 세션 중 생성된 역할별 출력을 `reports/{YYYY-MM-DD}_{topic-slug}/{role}_rev{n}.md`에 저장
   - 이미 저장된 것은 건너뜀
   - Edi 호출됐으면 `edi_rev1.md` (LLM authorship). hook이 호출 누락 시 `edi_auto_rev1.md` 별도 박제 (D-131)
3. `memory/shared/decision_ledger.json` — 세션 중 내려진 새 의사결정 추가.
   - **[G1 — 전문 읽기 금지]** decision_ledger.json 전문(48K tokens) Read 금지. 대신 스냅샷만 참조:
     ```
     npx ts-node scripts/get-ledger-snapshot.ts <topicId>
     ```
     스냅샷은 "현 topicId 관련 결정 전체 + 최근 30건" 합집합. 충돌 여부 판단 시 이 범위 기준으로 결정 박제.
   - **[escape hatch]** 결정 충돌이 의심되거나 스냅샷이 불충분하다고 판단될 경우 `memory/shared/decision_ledger.json` 전문 Read 허용. 스냅샷 우선, 전문은 예외 경로.
4. `memory/shared/topic_index.json` — 토픽 status 변경. **허용 값은 CLAUDE.md §Topic Lifecycle의 7종 enum (D-B): `open | framing | design-approved | implementing | completed | suspended | cancelled`**. `closed`는 legacy alias → 반드시 `completed`로 기록. outcome 기록.
   - **[G2 — 전문 읽기 금지]** `topic_index.json` 전문을 Read 도구로 읽지 말 것 (31K tokens 낭비). 현 topicId 항목만 `scripts/lib/topic-status.ts`의 `updateTopicStatus()` 헬퍼를 통해 갱신: `npx ts-node -e "import {updateTopicStatus} from './scripts/lib/topic-status'; const r=updateTopicStatus(process.cwd(),'<topicId>',{status:'completed'}); console.log(JSON.stringify(r))"`.
   - PD resolveCondition 매칭은 hook 체인의 `resolve-pending-deferrals.ts` (dry-run) 및 `auto-close-topics.ts`가 담당 — LLM 개입 불필요.
5. `memory/sessions/current_session.json` 업데이트:
   - status: "closed"
   - closedAt: 현재 시각 (ISO 8601)
   - 세션 중 발생한 notes, gaps 기록
   - **`oneLineSummary` 필드를 1줄(≤100자)로 작성하고 Edit 툴로 기록** (예: "topic-slug 구현 완료: 핵심 변경 3개, D-087 박제"). 없으면 finalize hook이 placeholder 자동 삽입 (안전장치 있음)
6. Master feedback이 있었으면 `apply-feedback.ts` CLI로 기록:
   - **[G3 — 전문 읽기 금지]** `master_feedback_log.json` 전문(~19K tokens) Read 금지. CLI 위임:
     ```
     npx ts-node scripts/apply-feedback.ts <topicId> <phase> "<feedback>" "<directive>"
     ```
     - 첫 인수 `topicId`는 `current_session.json.topicId` 값을 반드시 전달
     - CLI 실행 후 exit code 0 확인. 비 0이면 escape hatch: `memory/master/master_feedback_log.json` 전문 Read 후 수동 Edit 허용
   - Master feedback 없었으면 스킵
7. 역할별 학습사항이 있으면 `memory/roles/{role}_memory.json`의 `lessonLog[]`에 append:
   - **[G4 — 전문 읽기 금지]** 역할 파일 전문 Read 금지. append-only Edit 원칙:
     기존 `"lessonLog": [` 배열 끝 `]` 직전에 아래 형태로 추가:
     ```json
     {"session": "<sessionId>", "learning": "<학습 내용>"}
     ```
   - **[escape hatch]** 역할 파일 구조 확인이 필요하거나 lessonLog 위치 불명확 시 전문 Read 허용
   - 학습사항 없었던 역할은 스킵
8. **[자동]** `memory/sessions/session_index.json` 세션 기록 추가 — `session-end-finalize.js` hook이 `current_session.json` status=closed 확인 시 자동 append (agentsCompleted·decisions·note 포함). 수동 실행 불필요. (PD-009)
   - **[G5 — LLM 직접 Read 금지]** `session_index.json`은 hook이 전담한다. LLM이 이 파일을 Read 도구로 직접 읽는 것은 금지 — 불필요한 78K tokens 소비 방지. 참조가 필요하면 `current_session.json`의 `sessionId`로 충분하다.
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
