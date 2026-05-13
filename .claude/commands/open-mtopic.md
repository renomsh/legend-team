# /open-mtopic — 레전드팀 mtopic(병행세션 임시 buffer) 오픈

PD-079 / D-181 Phase 2. 워크트리 격리 mtopic 생성·재오픈 전용 슬래시 커맨드.

mtopic은 worktree-local 임시 buffer (D1 결정). 본 커맨드는 `m_topic_index_{wid}.json` 만 갱신.
`topic_index.json` (공식 SOT) · `topics/{id}/` 컨트롤플레인 디렉토리는 **사용하지 않음**.

## 마이그 트리거 위치 (P6 확정, 2026-05-13)

본 커맨드는 마이그를 트리거하지 않습니다. 자동-1 silent 마이그는 **`/open` (공식 토픽 오픈) step 7-c**에서만 발동 (D-181 정합).
- mtopic 생성·재오픈은 워크트리-로컬 임시 buffer 조작만 수행
- mtopic close 후 다음 `/open` 시점에 마이그 1회 — 공식 SOT 승격

## 체크리스트

1. `memory/sessions/current_session.json` — 이전 세션 미종결 시 Master에게 알림
2. `getWorktreeId()` 호출 → `wid` 확정. 본 커맨드의 모든 read/write 는 `m_*_${wid}.json` 한정.
3. `mNamespacePaths(wid)` 로 경로 단일 출처 사용. 하드코딩 금지.
4. **분기 처리** (아래 7번 참조).
5. `current_session.json` 갱신: sessionId, mtopicId, topic(=title), topicSlug, status="open", startedAt(ISO), mode="observation", grade, framingLevel=0, framingSkipped=true, operationType="structured", phase="framing"
6. Grade 판정 — CLAUDE.md `Topic Grade System` 참조. 기본값 A.
7. **mtopic ID 분기**

   **분기 A — 기존 mtopic 재오픈** (`/open-mtopic mtopic_NNN_W{hash} ...`):
   - `m_topic_index_{wid}.json` read → entry 확인 (없으면 오류)
   - entry.status를 `"open"`으로 갱신, `lastUpdated` 갱신
   - `atomicWriteJSON` 으로 저장
   - `current_session.mtopicId/topic/topicSlug` = 기존 값. reportPath = 새 날짜 반영.
   - `create-mtopic.ts` 실행 금지

   **분기 B — 신규 mtopic 생성** (mtopic ID 미명시):
   - `npx ts-node scripts/create-mtopic.ts "<title>" <slug> [grade]` 실행
   - stdout 첫 줄에 발급된 mtopicId 출력됨 → capture 후 `current_session.mtopicId` 기록

8. 세션 오픈 보고 후 Grade에 따라 첫 주자 진입 (자동 framing 없음 — `/jobs-framing` 명시 호출 시만 Jobs 발동). Master 메시지 불충분 시 의도·scope 먼저 질문.

## SOT 명시 (공식 토픽과 분리)

| 자산 | 공식 SOT | mtopic 임시 buffer |
|---|---|---|
| topic index | `memory/shared/topic_index.json` | `memory/shared/m_topic_index_{wid}.json` |
| decision ledger | `memory/shared/decision_ledger.json` | `memory/shared/m_decision_ledger_{wid}.json` |
| pending deferrals | `memory/shared/pending_deferrals.json` | `memory/shared/m_pending_deferrals_{wid}.json` |
| control plane | `topics/{id}/` | **미사용** (D1) |

## Grade 명시 파싱

- `/open-mtopic mtopic_NNN_W{hash} [grade] ...` 또는 `/open-mtopic [grade] <title>` — 단일 문자 S/A/B/C 선두 시 grade로 인식
- 미명시 시 키워드 추론 (CLAUDE.md `Grade 선언 규칙` 참조)

## 규칙

- 기본 모드: Observation
- 이전 세션 미종결 시 경고 후 Master 판단 대기
- mtopic은 임시 buffer — 공식 SOT 오염 금지 (D-181 마이그 트리거가 Phase 5에서 자동-1 silent 처리)
- R-1 hash 접미사 정합: 발급된 mtopicId는 `mtopic_\d{3}_W[0-9a-f]{8}` 패턴
- R-2 동시 오픈 차단: `checkMtopicAvailable()` 가 cross-worktree scan + 같은 wid 내 status='open' 거부
