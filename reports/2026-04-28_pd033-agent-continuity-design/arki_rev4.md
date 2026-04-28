---
role: arki
session: session_123
topic: topic_121
topicSlug: pd033-agent-continuity-design
turnId: 8
invocationMode: subagent
grade: A
executionPlanMode: plan
date: 2026-04-28
rev: 4
recallReason: post-master
splitReason: "Ace rev4 인계 후 spec 정식화"
---

# Arki — Spec 정식화 (Dev 인계용 동결)

Arki입니다. Ace rev4의 5축 골격·자산 인벤토리 5건·미결 K6/K7/K8/K9 위에서 spec을 정식화합니다. 본 발언은 **Dev 인계 직전 spec 동결**이 가치. Master 추가 결정 게이트 없이 spec_lck=Y 선언합니다. Hickey 의무 — 추가 신설은 0(Ace rev4 5건 그대로 유지, 부풀림 없음).

---

## Sec 1. 본 호출 자가 검증 (다축 4건 실측)

`feedback_arki_full_system_view` 의무. 본 호출에서 직접 실측한 결과:

### (a) `.claude/settings.json` — PreToolUse 미등록 재확인
```json
"hooks": {
  "SessionEnd": [{ "command": "node scripts/auto-push.js ..." }],
  "PostToolUse": [{ "matcher": "Task", "command": "node .claude/hooks/post-tool-use-task.js" }]
}
```
- **PreToolUse 0건**. 본 spec의 자산 #1·#5는 *신설 등록 의무*임을 코드로 확정.
- PostToolUse(Task)는 단일 hook 등록. 자산 #2(함수 +1)는 *기존 hook 본문 확장*이며 settings.json 변경 불요.

### (b) `topics/topic_121/` — turn_log·context_brief 부재 재확인
실측 8개 파일: `agenda.md / debate_log.json / decisions.json / master_feedback.json / open_issues.json / revision_history.json / speculative_options.json / topic_meta.json`. **turn_log.jsonl 부재 + context_brief.md 부재** (Riki R-1 실측 재현). 자산 #5(소급 manual)의 read 대상이 본 토픽엔 없음을 spec 전제로 박제.

### (c) `.claude/hooks/post-tool-use-task.js` — turn 박제만 처리
- 본문 145줄. stdin tool_input → `subagent_type` 추출 → `current_session.json.turns[]` push만 수행.
- **`turn_log.jsonl` write 호출 0건** (grep 결과). 자산 #2(`writeTurnLogEntry` 함수 +1)는 *순 신설 함수*. 기존 hook 행위에 부작용 0.

### (d) `scripts/write-turn-log.ts` — programmatic API 실존·작동
- export `appendTurnLogEntry(topicId, entry)` — validateTurnLogEntry 통과 후 jsonl append.
- export `readTurnLog(topicId, sessionId?)` — 인덱스 read.
- topic_063·topic_113 backfill 데이터 실존(실측 — `topics/topic_063/turn_log.jsonl` 존재, `topics/topic_113/context_brief.md`·`session_contributions/` 존재).
- **결론**: 자산 #2 hook 함수가 `require('../../scripts/write-turn-log')` 한 줄로 즉시 사용 가능. ts-node 우회 위해 `tsc` precompile 또는 `child_process.execSync` 1회 호출 둘 다 후보 — Phase 2 G2 spike.

**다축 검증 통과**. Ace rev4 §3 인벤토리 5건이 실측 사실관계와 일치. 본 spec은 환각 없이 박제 가능.

---

## Sec 2. Spec 정식화 — 5건 자산 각각

### Sec 2.1 Asset #1 — PreToolUse(Task) hook 신규

**파일 경로**:
- 코드: `.claude/hooks/pre-tool-use-task.js` (신규)
- 등록: `.claude/settings.json` `hooks.PreToolUse[]` 항목 추가

**입력** (Claude Code hook protocol — stdin JSON):
```json
{
  "tool_name": "Task" | "Agent",
  "tool_input": { "subagent_type": "role-arki", "description": "...", "prompt": "..." },
  "cwd": "...",
  "session_id": "..."
}
```

**출력 계약 (K6 분기)**:
- **K6 PASS (mutation 허용)**: stdout으로 `{ "tool_input": { ...mutated, "prompt": "<prepended>\n" + originalPrompt } }` JSON 반환. Claude Code가 mutated input으로 Task 실행.
- **K6 FAIL (mutation 미허용)**: spec_lck partial — 본 hook은 *경보 출력만*(stderr) 후 `process.exit(0)`. 호출은 원본 prompt로 진행. Phase 2 G1에서 분기 처리.

**트리거**: Agent tool 호출 직전 (PreToolUse phase). matcher: `"Task"`.

**처리 알고리즘 (메인 로직)**:

1. stdin 파싱 → `tool_name in ["Task","Agent"]` 아니면 silent pass.
2. `tool_input.subagent_type`에서 role 추출 (`role-{role}` prefix). 추출 실패 시 silent pass.
3. **세션 layer 조립** (C4-α):
   - `memory/sessions/current_session.json` read.
   - `turns[]` 배열에서 같은 `topicId` (current_session.openTopics[0] 기준) 매칭 entry list.
   - 각 entry → reports/ 경로 추정: `reports/{date}_{topicSlug}/{role}_rev{?}.md` glob match → 마지막 mtime 1건. 추정 실패 시 skip + stderr warning.
4. **토픽 layer 조립** (C3-γ′):
   - `topics/{topicId}/turn_log.jsonl` read (부재 시 skip + warning).
   - `topics/{topicId}/context_brief.md` 존재 시 경로 1줄 inject.
   - `topics/{topicId}/session_contributions/` glob → 과거 세션별 .md list.
   - role 필터 정책: 호출 대상 role 본인 발언은 *전문 read 명령*(reports/ 경로), 타 역할은 *인덱스 1줄*(turn_log entry summary).
5. **dedup**: 세션 layer + 토픽 layer에서 같은 reports/ 경로 중복 제거 (Path 단일화). 정렬: turnIdx 오름차순.
6. **prepend 형식** (K8 분기):
   - **K8 PASS**: system message 영역에 `<dispatch-context>` 블록 prepend (페르소나 read 명령·경로 list·메타데이터). user prompt는 원본 유지.
   - **K8 FAIL**: user prompt 첫 부분에 동일 블록 합침. 페르소나 read 명령은 user 영역 자연어 명령으로 대체.
7. **부피 폭증 방지**:
   - 경로 list만 inject (전문 read는 서브가 selective). 경로 1줄 ≈ 80~120 토큰 / 50줄 cap (= ~6KB).
   - 50줄 초과 시: 호출 대상 role 본인 발언은 전부 유지, 타 역할은 *직전 phase 경계*까지 cap.
   - context_brief.md는 첫 200자만 inline 또는 경로만 inject (spec_lck 동결 시: 경로만, 호환 회복 후 inline 검토).
8. stdout: mutated tool_input JSON 단일 객체. process.exit(0).

**에러 처리**:
- stdin 파싱 실패 → silent pass (exit 0).
- current_session.json 부재 → silent pass.
- reports/ 경로 추정 실패 → 해당 entry skip, stderr warning.
- write/read 권한 차단 → silent pass + stderr.
- 타임아웃: 2초 (post-tool-use-task.js와 동일 정책).

**의존**:
- read: `memory/sessions/current_session.json`, `topics/{id}/turn_log.jsonl`, `topics/{id}/context_brief.md`, `topics/{id}/session_contributions/*.md`, `reports/*` glob.
- write 0.
- 다른 자산 의존: 자산 #2가 turn_log.jsonl을 자동 작성해야 토픽 layer가 본 토픽 이후부터 작동. 자산 #5(소급)는 본 토픽에만 일회성. 자산 #3(`/open` 1줄)은 신규 토픽에 한정.

### Sec 2.2 Asset #2 — PostToolUse(Task) hook 함수 +1

**파일 경로**: `.claude/hooks/post-tool-use-task.js` 본문 함수 추가.

**신규 함수 시그니처**:
```js
function writeTurnLogEntry(topicId, role, turnIdx, sessionId, summaryHash, reportsPath)
```

**입력**:
- `topicId` — current_session.openTopics[0] 또는 input.tool_input에서 추출.
- `role` — extractRole 결과 재활용.
- `turnIdx` — current_session.turns.length (push 직전).
- `sessionId` — sess.sessionId.
- `summaryHash` (선택) — tool_response 첫 200자 hash. nanoTimestamp 보강.
- `reportsPath` (선택) — agent 응답에서 추출 (`{ROLE}_WRITE_DONE: <path>` 첫 줄 매칭).

**출력**: `topics/{topicId}/turn_log.jsonl`에 1줄 append. JSON line.

```jsonl
{"ts":"<ISO>","topicId":"topic_121","sessionId":"session_123","turnIdx":8,"role":"arki","phase":"structural-design","reportsPath":"reports/2026-04-28_pd033-agent-continuity-design/arki_rev4.md","summaryHash":"<sha256-12char>"}
```

**트리거**: 기존 PostToolUse hook의 `turns.push(newTurn)` 직후 — 같은 hook 본문 안에서 함수 호출.

**구현 방식 (K7 분기)**:
- **K7 PASS**: `require('../../scripts/write-turn-log')`로 programmatic import. ts-node precompile 또는 `tsc --outDir .claude/hooks/dist`로 .js artifact 빌드.
- **K7 FAIL** (require 불가): inline 구현 — `appendFileSync(turnLogPath, JSON.stringify(entry) + '\n')` 직접. validateTurnLogEntry 우회 (단순 schema check 1~2줄로 갈음).

**에러 처리**:
- write 권한 차단 → stderr warning + exit 0 (turn 박제 자체는 push 완료된 상태).
- topicId 추출 실패 → skip turn_log write, turns push만.
- jsonl append race: append-only + nanoTimestamp 필드. dedup은 finalize 시 자산 #4 함수가 cross-check.
- 디렉토리 부재: `fs.mkdirSync(topicDir, { recursive: true })`로 자동 생성 (write-turn-log.ts 패턴 그대로).

**의존**:
- 자산 #5 보충에서 `topics/{id}/` 디렉토리 존재 보장 (소급 manual로 본 토픽 채움). 신규 토픽은 자산 #3(`/open`)이 디렉토리 생성.

### Sec 2.3 Asset #3 — `/open` skill 1줄 추가

**파일 경로**: `.claude/skills/open/SKILL.md` 또는 그 skill이 호출하는 `scripts/lib/open-topic.ts` 류.

**입력**: 신규 topicId (open skill 입력).

**출력**:
- `topics/{topicId}/context_brief.md` 초기 템플릿 1회 write.
- (선택) `topics/{topicId}/turn_log.jsonl` 빈 파일 touch — 자산 #2 hook 첫 호출 전 디렉토리 보장.

**템플릿** (context_brief.md 초기 골격):
```markdown
# Topic {topicId} — {topicTitle}

## 토픽 개요
(Master·Ace 프레이밍 시점에 생성. 본 파일은 토픽 layer 자동 read 대상.)

## 누적 결정
- (resolveCondition·D-NNN 매칭 시 finalize hook가 append)

## 누적 finding
- (F-NNN 박제 시 finalize hook가 append)

## 진행 단계
- session_NNN: <phase>
```

**트리거**: `/open` skill 실행 시 1회 (멱등성 — 이미 존재하면 skip).

**에러 처리**:
- write 실패 → skill 본문 자체에는 영향 없음 (warning만). open 흐름 차단 X.
- 멱등 보장 → 재오픈 시 덮어쓰기 X.

**의존**:
- open skill 호출 → topic_meta.json 작성과 동일 phase에서 추가.
- 본 토픽엔 적용 안 됨 — 자산 #5 소급 manual로 보충.

### Sec 2.4 Asset #4 — finalize 함수 +1 (`validateInlineRoleHeaders`)

**파일 경로**: `.claude/hooks/session-end-finalize.js` 본문 함수 추가.

**신규 함수 시그니처**:
```js
function validateInlineRoleHeaders(reportsDir, turns)
```

**입력**:
- `reportsDir` — `reports/{date}_{topicSlug}/` 경로 list (현 세션 분).
- `turns` — `current_session.turns[]`.

**처리**:
1. 각 reports/*.md frontmatter parse → `{ role, turnId }` 추출.
2. turns[]와 cross-check: frontmatter `turnId` 값이 turns[turnId].role와 일치하는지.
3. mismatch 시: `current_session.json.gaps[]`에 `{type:"inline-role-header-mismatch", file, expected, actual}` 박제. 차단 X.
4. 본문 H1 헤더(`# {ROLE} —`)와 frontmatter role 불일치도 동일 박제 (PD-043 사칭 검출).

**트리거**: session-end-finalize.js 본문에서 turns 전파 직후 호출.

**에러 처리**:
- frontmatter parse 실패 → 해당 파일 skip + warning.
- reports/ 디렉토리 부재 → silent pass.

**의존**:
- 기존 finalize 본문 turns 전파 함수 직후 위치. 회귀 0.

### Sec 2.5 Asset #5 — 본 토픽 소급 manual (turn_log + context_brief)

**파일 경로**:
- `topics/topic_121/turn_log.jsonl`
- `topics/topic_121/context_brief.md`

**입력**: 본 세션 turns 0~8 + 각 reports/ 발언 frontmatter.

**처리**:
- turn_log.jsonl: 0~8 entry append (ace×4, arki×4, riki×1).
- context_brief.md: Sec 2.3 템플릿 + Master 비전·5축 권고·spec 동결 요약.

**트리거**: Phase 2 spec 동결 후 1회 (Dev가 manual write — 또는 hook 활성화 후 자동 backfill 스크립트).

**에러 처리**:
- 멱등성: 이미 존재하면 덮어쓰기 X (Master 명시 승인 필요).
- backfill script 실패 → manual write fallback.

**의존**:
- 자산 #2가 작동하기 전 본 토픽 read source 보장. 1회성.

---

## Sec 3. Phase 분해 (executionPlanMode=plan)

**Phase 1 — Spec 동결** ← 본 발언 시점에 G1 진입 직전
- 진입 조건: Ace rev4 인계 + Master 비전 정합 확인.
- 산출물: 본 spec(arki_rev4.md) + spec_lck=Y 선언.
- 완료 조건: Sec 2 자산 5건 spec 명시 + Sec 5 게이트 명시 + 금지어 v0 0건 검증.

**Phase 2 — K 게이트 spike (G1)**
- 진입 조건: Phase 1 완료 + Master 무응답=spec 동결 승인 (저마찰 정합) 또는 명시 진행.
- 산출물: K6/K7/K8/K9 4건 PASS/FAIL 판정.
- 완료 조건: 4건 모두 명시 결과. 1건이라도 ambiguous면 Phase 2 재실행.

**Phase 3 — 신설 자산 구현** ← Phase 2 결과별 분기
- **3-PASS** (K6 PASS + K7 PASS + K8 자유 + K9 PASS): 자산 #1~#5 전부 구현.
- **3-PARTIAL** (K6 FAIL): C1-α 자산 #1을 *경보-only* 모드로 구현 (mutation 시도 + 실패 시 stderr). 자산 #2·#4·#5는 그대로. 자산 #3은 그대로. PD-033 partial-resolved.
- **3-PARTIAL** (K7 FAIL only): 자산 #2 구현을 inline appendFileSync로 fallback. 나머지 그대로.
- **3-PARTIAL** (K9 FAIL only): 자산 #3은 빈 파일 touch만. 본문 골격은 finalize hook에서 누적 append로 fallback.

**Phase 4 — Dry-run 검증 (G2)**
- 진입 조건: Phase 3 완료.
- 산출물: 본 세션 안에서 자산 #1 dry-run — Arki 5번째 호출 시 직전 turns 9~10 reports/ 경로 자동 prepend 확인. Riki 2차 호출 시 Arki rev4 인지 확인.
- 완료 조건: dry-run 결과 reports/ 경로 inject 확인 1건 이상.

**Phase 5 — 결정 박제 + finalize**
- 진입 조건: Phase 4 G2 PASS (또는 partial로 명시 박제 가능).
- 산출물: D-NNN(자산 5건) 박제 + PD-033 resolved 또는 partial-resolved + (조건부) PD-NNN 신규 박제 + 자산 #5 소급 backfill.
- 완료 조건: decision_ledger 갱신 + topic_index status 변경 + session-end-finalize hook 자동 실행.

**Phase 6 — auto-push hook chain**
- 진입 조건: Phase 5 완료.
- 자동 (auto-close 트리거 — `feedback_auto_close_session`).

**금지어 v0 자가 검증**: 본 Sec에 `D+N일`/`N주차`/`MM/DD`/`담당자:`/`N시간`/`공수` 0건. Phase N 명·완료 조건·진입 조건만 사용 ✅.

---

## Sec 4. 의존 그래프

```
Phase 1 (spec 동결) ── 본 발언
    │
    ▼
Phase 2 — G1 spike
    ├─ K6 (PreToolUse mutation): 정적(spec doc) → 동적(더미 hook test)
    ├─ K7 (write-turn-log require 가능): require resolution + ts-node·tsc 분기
    ├─ K8 (system prepend): K6 시 동시 확인 (차선만 영향)
    └─ K9 (/open context_brief 자동 생성): 작은 path/template write 1회 실측
    │
    ▼ [Phase 2 결과별 분기]
    │
    ├── ALL PASS ──→ Phase 3-PASS
    │                자산 #1·#2·#3·#4·#5 전부 구현
    │
    ├── K6 FAIL ──→ Phase 3-PARTIAL(K6)
    │              자산 #1을 경보-only 모드, 나머지는 그대로
    │              partial-resolved + PD-NNN 분기 박제
    │
    ├── K7 FAIL ──→ Phase 3-PARTIAL(K7)
    │              자산 #2를 inline appendFileSync fallback, 나머지 그대로
    │
    └── K9 FAIL ──→ Phase 3-PARTIAL(K9)
                   자산 #3은 빈 파일 touch만, 본문 finalize에 위임
    │
    ▼
Phase 3 (자산 구현)
  ├─ 자산 #1 → settings.json 등록 (자산 #2와 병렬 가능)
  ├─ 자산 #2 → post-tool-use-task.js 함수 추가 (자산 #1과 병렬 가능)
  ├─ 자산 #4 → session-end-finalize.js 함수 추가 (병렬 가능)
  ├─ 자산 #3 → /open skill 1줄 (병렬 가능)
  └─ 자산 #5 → 소급 manual (자산 #2 spec 동결 후 의존)
    │
    ▼
Phase 4 (G2 dry-run)
    │  자산 #1 작동 확인 — Arki 5번째 호출 또는 후속 Riki 호출에서 inject 검증
    ▼
Phase 5 (결정 박제 + auto-close)
    │
    ▼
Phase 6 (auto-push hook chain — 자동)
```

**Critical Path**: Phase 1 → Phase 2(K6) → Phase 3 자산 #1·#2 → Phase 4 dry-run → Phase 5. K6가 단일 결정점 — K6 FAIL 시 critical path 분기.

**병렬 가능 노드**:
- Phase 2의 K6/K7/K8/K9 4건 동시 spike 가능 (단 K8은 K6에 종속 — 같은 hook 등록 1회로 두 분기 동시 실측).
- Phase 3의 자산 #1·#2·#3·#4 4건 병렬 구현 가능. 자산 #5만 자산 #2 spec 동결 후 진입.

**선행/후행 관계**:
- 자산 #2 → 자산 #5: turn_log 자동 작성 함수가 spec 동결되어야 backfill 형식 결정 가능.
- 자산 #1 → 자산 #4(검증): finalize 함수가 inject 결과의 누락 여부도 검증 대상에 포함 가능 (옵션).

---

## Sec 5. 검증 게이트 (실측 가능 only)

자가평가 폐기 영역(D-092) 회피. 모든 게이트는 PASS/FAIL 명시 출력으로 판정.

### G1 — Phase 2 spike (K 게이트 4건)

**G1.1 K6 PASS 기준**:
- (a) 정적: Claude Code hook docs 또는 spec에서 PreToolUse mutation/return value 처리 명시 확인. 결과: yes/no/ambiguous.
- (b) 동적: `.claude/hooks/pre-tool-use-task-spike.js` 더미 hook 등록 → 임의 Task 호출 → stdout return된 mutated input이 실제 서브에 전달되는지 실측. 검증: 더미 prompt에 sentinel 문자열 prepend → 서브 응답에서 sentinel 인용 확인. PASS = sentinel 인용 1건 이상.

**G1.2 K7 PASS 기준**:
- `.claude/hooks/post-tool-use-task.js`에서 `require('../../scripts/write-turn-log')` 호출 → exception 없이 함수 import. ts-node 미설치 환경 가정 시 `tsc --outDir`로 .js artifact 빌드 후 require. PASS = require 성공 + appendTurnLogEntry 호출 1회 성공 (test topicId 사용).

**G1.3 K8 PASS 기준**:
- G1.1 동적 spike에서 system message vs user prompt 영역 구분이 stdout 반환 형식에 반영되는지 확인. PASS/FAIL 모두 자산 #1 본질 영향 없음 (차선만 잃음). FAIL 시 자산 #1 spec의 prepend 형식은 user 영역 합침 모드.

**G1.4 K9 PASS 기준**:
- `/open` skill 또는 그 호출 스크립트가 `topics/{newId}/context_brief.md` write 권한 있는지 spike. test topicId 한 개 open → 파일 생성 확인. PASS = 멱등 1회 write 성공.

### G2 — Phase 4 dry-run

**G2.1 세션 layer dry-run**:
- 본 세션 후속 호출(Arki 5번째 또는 Riki 2번째 등)에서 prompt에 `arki_rev4.md` 경로가 자동 prepend됐는지 확인.
- PASS 기준: 후속 호출 응답 본문이 본 발언의 sentinel(예: "spec_lck: Y" 또는 "Sec 2.1 PreToolUse")을 인용. FAIL = 인용 0.

**G2.2 토픽 layer dry-run** (자산 #5 backfill 후):
- 본 세션 종료 후 `topics/topic_121/turn_log.jsonl` read → 9 entry 매칭 확인.
- PASS 기준: jsonl line 수 ≥ 9 (turns 0~8) + 각 line의 reportsPath가 reports/ 실파일과 매칭.

**G2.3 finalize 함수 작동**:
- 자산 #4 함수가 본 세션 reports/ frontmatter ↔ turns[] cross-check 완료.
- PASS 기준: gaps[] 박제 0건 (또는 의도된 mismatch만 — 본 세션은 0 기대).

### G3 — Phase 5 박제 검증

- decision_ledger.json에 D-NNN(자산 5건) entry 존재.
- topic_index.json에서 topic_121 status가 closed 또는 in-progress→partial 분기 명시.
- pendingDeferrals.json에서 PD-033 status가 resolved 또는 partial-resolved.

**자동화 가능 검증** (실측 명시):
- G1.2·G1.4·G2.2·G2.3·G3 = 스크립트 1회 실행으로 PASS/FAIL 판정 가능.
- G1.1·G1.3·G2.1 = 자연어 응답 검사 필요 (semi-automated — sentinel 매칭).

---

## Sec 6. 롤백 경로

각 Phase 실패 시 복귀 절차:

### Phase 2 (G1) 롤백
- **K6 FAIL** → Phase 3-PARTIAL(K6) 진입. 자산 #1 경보-only. 데이터 손실 0 (등록 안 한 hook은 작동도 0).
- **K7 FAIL** → 자산 #2 inline 구현. 데이터 손실 0.
- **K9 FAIL** → 자산 #3 빈 파일 touch. 데이터 손실 0.
- 검증: settings.json·hook 본문·skill 본문 git diff 확인.

### Phase 3 (자산 구현) 롤백
- 자산 #1 등록 후 prompt mutation이 실 호출에서 부작용 (서브 호출 차단·prompt 손상) → settings.json revert. `git checkout .claude/settings.json`. hook 본문은 유지(미등록 상태).
- 자산 #2 함수 추가 후 post-tool-use-task.js 기존 turn 박제 회귀 → 함수 호출 라인만 주석 처리. turn 박제 자체는 그대로 작동.
- 자산 #4 함수 추가 후 finalize 회귀 → 함수 호출 라인 주석. 기존 finalize 그대로.
- 자산 #3 변경 → /open skill diff revert.
- 자산 #5 manual → topics/topic_121/turn_log.jsonl 삭제. context_brief.md 삭제. 토픽 자체는 영향 없음.
- 검증: 본 세션의 turns 박제 정상 작동 + 다음 세션 /open 정상 작동.

### Phase 4 (G2) 롤백
- 모든 G2 FAIL → Phase 3 자산 1개씩 재검사. dry-run sentinel 추가/변경.
- 회귀 발생(서브 호출 자체 차단 등) → 즉시 자산 #1 settings.json revert.
- 데이터 손실: 본 세션 일부 turn이 turn_log.jsonl 누락 가능성 — 자산 #5 backfill 보강 의무.

### 데이터 손실 위험 매트릭스
| 자산 | rollback 시 손실 | 보강 |
|---|---|---|
| #1 | 0 (read-only hook) | — |
| #2 | turn_log.jsonl 한 줄 누락 가능 | 자산 #5 backfill |
| #3 | 신규 토픽 context_brief.md 부재 | manual write 후 backfill |
| #4 | finalize gap 박제 누락 | 다음 세션 finalize에서 재실행 |
| #5 | manual 작성 분 영구 손실 | 재작성 (1회성) |

---

## Sec 7. 중단 조건

다음 중 하나 발생 시 spec 무효화 + Master 게이트:

1. **K6 + K7 + K9 동시 FAIL**: 자산 #1·#2·#3 모두 partial 모드 — 본 세션 결정 박제가 비전 미충족 분량이 임계치 초과. PD-033 partial-resolved + PD-NNN 분기 박제 후 본 토픽 종결. Master 명시 진행 동의 시에만 partial 박제 진행.
2. **자산 #1 등록 후 실 서브 호출 차단** (regression): 즉시 settings.json revert + Phase 3 동결. PD-033 partial 상태로 회귀.
3. **Master 자연어 개입**: orchestrationMode auto → manual 자동 복귀. 현재 spec은 보류, Master 명시 우선.
4. **본 spec의 자산 5건이 환각으로 드러나는 경우** (실측 결과와 spec 불일치): spec_lck 해제 + Arki rev5 호출. 환각 fix 후 재spec 동결.
5. **PreToolUse hook이 spec에는 있으나 Claude Code 환경에서 실제 등록 시 invalid hook type 에러**: K6 FAIL 케이스로 흡수. 분기 처리.

**partial-resolved 처리 spec**:
- PD-033 status = `partial-resolved-by-{C1α(경보-only) + C2γ + C3γ′(turn_log fallback) + C4α + C5α}`.
- statusNote = "Phase 2 G1 K6 FAIL — PreToolUse hook prompt mutation 미허용. C1-α 강제 인프라 보강 별도 PD로 분기."
- PD-NNN 신규: title="PreToolUse hook prompt mutation 환경 도입 또는 동등 강제 인프라 spike", parentPD="PD-033", externalDependency=true.

---

## Sec 8. R-2 정합 — K6 미허용 시 분기 spec

본 세션 결정 0 가능성 정직 명시:

### 8.1 본 세션 결정 박제 가능 분량 (K6 분기별)

| K6 결과 | 결정 박제 가능 자산 | PD-033 status |
|---|---|---|
| **PASS** | #1 + #2 + #3 + #4 + #5 (5건) | `resolved-by-{C1α + C2γ + C3γ′ + C4α + C5α}` |
| **FAIL** | #2 + #3 + #4 + #5 (4건, #1은 경보-only) | `partial-resolved-by-{C1α(경보) + C2γ(세션 layer만) + C3γ′ + C4α + C5α}` + PD-NNN 분기 |

K6 FAIL이라도 **결정 4건 박제** 가능 — 본 세션이 결정 0으로 닫히지 않음(R-2 fallback 정합). C1-β 부활 0건 (비전 위반 fallback 부결 유지).

### 8.2 PD-NNN 신규 박제 spec (K6 FAIL 시)

```yaml
id: PD-NNN
title: "PreToolUse hook prompt mutation 환경 도입 또는 동등 강제 인프라 spike"
parentPD: PD-033
context: "PD-033 partial-resolved. 자산 #1 PreToolUse hook이 K6 FAIL로 경보-only 모드 진입. 메인 휘발성 차단을 위한 코드 강제 인프라 미충족."
resolveCondition: "(a) Claude Code spec이 PreToolUse mutation 지원 추가 또는 (b) 동등 강제 인프라(예: SDK middleware) 도입. 1회 falsification probe 통과."
externalDependency: true
priority: high
```

### 8.3 C1-β 부결 정합 재확인

C1-β("메인 dispatch 코드 표준화 + finalize 검증")는:
- ace_rev2 §C1에서 "메인 휘발성 의존, 비전 정면 충돌"로 부결.
- ace_rev3에서 fallback이라 적었으나 ace_rev4 R-2 정정에서 "비전 위반 fallback 부활 안 함" 확정.
- 본 spec에서도 K6 FAIL 시 *partial + PD-NNN 분기*가 올바른 처리 — C1-β 부활 0.
- 부결 근거 재기재: 메인이 매 호출 dispatch 표준 박제하라는 명령 자체를 휘발성 컨텍스트(메인)에 박는 모순. 비전 #2 "자동" 위반.

---

## Sec 9. Spec 동결 선언

### 9.1 spc_lck = Y 선언

본 발언으로 다음 사항 동결:

| # | 동결 항목 | 변경 가능 트리거 |
|---|---|---|
| 1 | 자산 5건 인벤토리 (Sec 2.1~2.5) | Phase 2 G1 결과 + Master 명시 변경 지시 |
| 2 | 자산 #1 알고리즘 (세션 layer + 토픽 layer + dedup + prepend 형식) | K6/K8 분기로만 변경 |
| 3 | 자산 #2 함수 시그니처 (`writeTurnLogEntry(topicId, role, turnIdx, sessionId, summaryHash?, reportsPath?)`) | K7 분기로만 변경 |
| 4 | Phase 1~6 분해 + 의존 그래프 | Master 비전 변경 시에만 |
| 5 | G1 K6/K7/K8/K9 PASS/FAIL 기준 | 변경 불가 (실측 정의) |
| 6 | G2 dry-run sentinel 매칭 정책 | 변경 불가 |
| 7 | 롤백 경로 (Sec 6 매트릭스) | 변경 불가 |
| 8 | 중단 조건 5건 (Sec 7) | Master 명시 추가 트리거 시에만 확장 |
| 9 | K6 FAIL 시 partial-resolved + PD-NNN 분기 spec (Sec 8) | 변경 불가 |
| 10 | C1-β 부활 부결 (Sec 8.3) | 변경 불가 (비전 정합) |

### 9.2 Dev 인계 사항

Dev가 본 spec 위에서 진행할 사항:
- Phase 2 G1 spike 4건 실측 (자동화 스크립트 1개 작성 가능 — `scripts/spike-pre-tool-use.ts`).
- Phase 3 자산 #1~#5 구현 (Phase 2 결과별 분기).
- Phase 4 dry-run sentinel 매칭 검증.
- Phase 5 결정 박제 (auto-close hook chain 의존).

### 9.3 변경 불가 영역

본 spec은 spec_lck=Y 선언 후 다음 변경은 *Master 명시 승인 없이 불가*:
- 자산 5건 → 추가 신설 (자산 #6 신설 금지).
- 비전 위반 fallback 도입 (C1-β 부활 등).
- 금지어 v0 위반.
- spec 동결 후 Dev가 임의로 자산 1건 누락.

### 9.4 자기감사 결과 (sa_rnd=4)

본 발언이 라운드 4 자기감사:
1. 다축 검증 4축 실측 (Sec 1) ✅
2. mitigation+fallback 병기 (Sec 6 + Sec 7) ✅
3. 금지어 v0 0건 ✅
4. 짓지 않음 검토 — 자산 5건 외 추가 신설 0 (Hickey 의무 충족) ✅
5. Dev 양방향 협의 — Phase 2 G1 spike 결과로 자산 1·2 분기 정의 ✅
6. 단일 강한 권고 — spec 1개 동결, 옵션 분기 0 (`feedback_no_middle_ground`) ✅
7. K6 미허용 시 정직 명시 — 본 세션 결정 4건만 박제 가능, 비전 미충족 분량 명시 ✅

**자가 점검 결함 0건**. 단 Dev에 "Phase 2 G1 spike script(`scripts/spike-pre-tool-use.ts`) 신규 작성"을 명시 의무로 박제. spec 동결 후 가변 영역은 Dev 구현 디테일.

---

## 메인 보고용 요약

- **Spec 동결 (spec_lck=Y)**: 자산 5건 인벤토리·알고리즘·시그니처·Phase 1~6·G1/G2/G3 게이트·롤백·중단조건 모두 정식화.
- **다축 4축 실측 통과** (Sec 1): settings.json(PreToolUse 0건) + topic_121/(turn_log·context_brief 부재) + post-tool-use-task.js(turn 박제만, turn_log 호출 0) + write-turn-log.ts(programmatic API 살아있음). Ace rev4 인벤토리와 사실관계 일치 — 환각 0.
- **K6 분기 spec 정합**: PASS 시 결정 5건, FAIL 시 결정 4건(partial-resolved) + PD-NNN 신규. 본 세션 결정 0 회피.
- **C1-β 부활 부결 재확인** (Sec 8.3): 비전 위반 fallback 부결 유지.
- **Master 추가 결정 게이트 0건** — 본 spec은 Ace rev4 인계 brief 직접 정식화. 무응답=Dev 인계 진행 (`feedback_low_friction_no_redundant_gate` 정합).

---

```yaml
# self-scores
aud_rcl: Y
str_fd: 0
spc_lck: Y
sa_rnd: 4
```

**다음 발언자 추천**: **Dev 직행** (Phase 2 G1 spike script 작성 + 자산 #1·#2 구현 진입). Master 게이트 불요 — Ace rev4가 이미 brief 인계 + 본 spec 동결로 결정 필요 0건 (`feedback_low_friction_no_redundant_gate` 직접 적용). Master 자연어 개입 시 즉시 manual 복귀 + 그쪽 우선.
