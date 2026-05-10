# /open — 레전드팀 토픽 오픈

Session Start 체크리스트 순서대로 실행.

## 체크리스트

1. `memory/sessions/current_session.json` — 이전 세션 미종결 시 Master에게 알림
1-a. **pending_turns orphan scan** — `memory/sessions/pending_turns_*.jsonl` 파일 열거. 직전 세션ID(`system_state.lastSessionId`)와 다른 파일명 = orphan. 발견 시: `memory/sessions/pending_turns_archive/`로 이동 + Master에게 "orphan detected: {파일명}, {lines}줄" 알림. 없으면 스킵.
2. `memory/shared/system_state.json` (fast-path) — nextSessionId, openTopics, recentDecisions, pendingDeferrals
2-b. `memory/shared/nexus_memory_open.json` — Nexus 오케스트레이션 지침 (gradeDispatch, antiPatterns, autoModelSwitch)
3. **이연 항목 List-up** — openTopics + pendingDeferrals 브리핑
3-a. `node scripts/dist/load-context-briefs.js` — hold=null 토픽의 context_brief.md 자동 로드 (pre-compiled; dist 없으면 `npm run build:scripts` 먼저 실행)
3-b. **이전 세션 Edi 보고서** (분기 A 또는 진행중 토픽 존재 시) — `topics/{topicId}/session_contributions/*_edi_report.md` 최신 1~2건 요약
3-c. **최근 3세션 요약** — `system_state.recentSessionSummaries[]` 브리핑
3-d. **Master-first audit** — `logs/master-first-audit.md` 마지막 5행 (없으면 스킵)
4. 다음 sessionId = `system_state.json.nextSessionId` (step 2에서 이미 로드됨 — session_index.json Read 불필요)
5. **Grade 판정** — CLAUDE.md `Topic Grade System` 참조. 기본값 A.
6. `current_session.json` 갱신: sessionId, topic, topicSlug, status="open", startedAt(ISO), mode="observation", grade, framingLevel=0, framingSkipped=true, operationType="structured", phase="framing"
7. **토픽 ID 분기**

   **분기 A — 기존 토픽 재사용** (`/open topic_NNN ...`):
   - topic_index에서 엔트리 확인 (없으면 오류)
   - current_session.topicId/topic/topicSlug = 기존 값, reportPath = 새 날짜 반영
   - topic_index 해당 엔트리 status를 `"open"`으로 갱신 (Edit)
   - `create-topic.ts` 실행 금지

   **분기 B — 신규 토픽 생성** (토픽 ID 미명시):
   - `node scripts/dist/create-topic.js "<title>" <slug>` 실행 (topic_index 등록·정렬·Asset #4 init 자동; pre-compiled)
   - 출력 topic_id를 current_session.topicId에 기록
   - 별도 Edit으로 해당 엔트리에 `grade: "<S|A|B|C>"` 추가

8. 세션 오픈 보고 후 Grade에 따라 첫 주자 진입 (자동 framing 없음 — `/jobs-framing` 명시 호출 시만 Jobs 발동). 단, Master 메시지 불충분 시 의도·scope 먼저 질문 (`nexus_memory_open.json §orchestration.intentConfirm` 참조)

## Grade 명시 파싱

- `/open topic_NNN [grade] ...` 또는 `/open [grade] <title>` — 단일 문자 S/A/B/C 선두 시 grade로 인식
- 미명시 시 키워드 추론 (CLAUDE.md `Grade 선언 규칙` 참조)

## 규칙

- 기본 모드: Observation
- 이전 세션 미종결 시 경고 후 Master 판단 대기
- grade 판정 결과를 오픈 보고에 명시
