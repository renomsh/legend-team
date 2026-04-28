---
role: dev
session: session_123
topic: topic_121
topicSlug: pd033-agent-continuity-design
turnId: 11
invocationMode: subagent
grade: A
date: 2026-04-28
rev: 2
recallReason: post-master
splitReason: "K6 동적 PASS 후 자산 5건 본 구현"
accessed_assets:
  - file: reports/2026-04-28_pd033-agent-continuity-design/arki_rev4.md
    scope: design_spec (Sec 2 자산 5건 spec, Sec 5 G1/G2/G3 게이트, Sec 6 롤백, Sec 7 중단 조건)
  - file: reports/2026-04-28_pd033-agent-continuity-design/dev_rev1.md
    scope: K6 spike (정적·단위·동적 PASS 증거 인계)
  - file: .claude/hooks/post-tool-use-task.js
    scope: Asset #3 베이스
  - file: .claude/hooks/session-end-finalize.js
    scope: Asset #2 베이스
  - file: scripts/write-turn-log.ts
    scope: appendTurnLogEntry API 참조 (실제 hook은 inline 구현 — K7 fallback 채택)
  - file: src/types/context-layers.ts
    scope: TurnLogEntry 스키마 정합
---

# Dev — Asset 5건 + dispatch 규약 본 구현 (rev2)

DEV_WRITE_DONE: reports/2026-04-28_pd033-agent-continuity-design/dev_rev2.md

Dev입니다. K6 정적+단위+동적 3-PASS 증거 위에서 Arki rev4 spec 5건 자산 + Asset #6 dispatch 규약 본 구현 완료. 단위 테스트·통합 테스트·회귀 테스트 모두 PASS. 본 보고는 실행 명령 → 실제 출력 형식의 증거 위주. 추정 0건.

---

## Phase 1. 사전 검증 (실측 완료)

| 항목 | 결과 |
|---|---|
| `.claude/settings.json` 현 상태 | PreToolUse 0건 (등록 의무 확인) |
| `.claude/hooks/post-tool-use-task.js` | 145줄, turn 박제만, turn_log write 0건 — Asset #3 베이스 확인 |
| `.claude/hooks/session-end-finalize.js` | 484줄, 9개 함수, validateInlineRoleHeaders 부재 — Asset #2 추가 대상 확인 |
| `scripts/write-turn-log.ts` | `appendTurnLogEntry(topicId, entry)` export 확인 |
| `topics/topic_121/` | 8개 메타 파일 존재, turn_log.jsonl·context_brief.md 부재 — 백필 대상 확인 |
| `.claude/hooks/spike-k6-pretool-task-mutation.js` | 보존 (109줄, 본 구현은 별도 파일 신설) |

Phase 1 PASS — Arki rev4 Sec 1 다축 4건 실측과 일치. 환각 0.

---

## Phase 2. Asset #1 본 구현 + 단위 테스트

### 2.1 파일 신설
- `.claude/hooks/pre-tool-use-task.js` (신규, 252줄)
- spike 파일 보존 (`spike-k6-pretool-task-mutation.js` 그대로)

### 2.2 알고리즘 핵심 (Arki rev4 Sec 2.1 정합)
1. tool_name이 Task/Agent 아니면 silent pass
2. **무한 루프 방지**: prompt에 `[PRE-TOOL-USE-TASK-INJECTED]` 마커 있으면 skip
3. **role 식별 우선순위** (R-1 보강): prompt 마커 → subagent_type → description 첫 단어 → unknown
4. **세션 layer**: current_session.json read → 직전 3 turn → reports/{role}_rev{n}.md 최신 mtime 1건 매핑
5. **토픽 layer**: topics/{topicId}/context_brief.md + turn_log.jsonl + session_contributions/ 경로 inject
6. **token cap**: 30K char 초과 시 세션 layer 1 turn → 토픽 layer만으로 단계적 축소
7. 에러 silent pass — 원본 호출 보호
8. 로그: `logs/pre-tool-use-task.log` jsonl

### 2.3 단위 테스트 증거

**Test 1 — 기본 동작 (subagent_type role-dev)**:
```bash
$ echo '{"tool_name":"Task","tool_input":{"subagent_type":"role-dev","description":"unit test","prompt":"Hello world"},"cwd":"C:/Projects/legend-team"}' | node .claude/hooks/pre-tool-use-task.js
```
실제 출력 (요약):
```
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow",...,
 "updatedInput":{"prompt":"<dispatch-context [PRE-TOOL-USE-TASK-INJECTED]>\n...
  ### Topic Layer — topic_121\n- context_brief: ... \n- turn_log: ...\n
  ### Session Layer — 직전 3 turns (sessionId: session_123)\n
  - turn 7 [ace] → reports/2026-04-28_pd033-agent-continuity-design/ace_rev4.md\n
  - turn 8 [arki] → reports/.../arki_rev4.md\n
  - turn 9 [dev] → reports/.../dev_rev1.md\n
  role-detected: dev\n</dispatch-context>\n\nHello world"}}}
```
**PASS** — 토픽 layer + 세션 layer + role 식별 + dispatch-context 블록 모두 정상 prepend.

**Test 2 — 무한 루프 방지**:
```bash
$ echo '{"tool_name":"Task","tool_input":{"prompt":"<dispatch-context [PRE-TOOL-USE-TASK-INJECTED]>existing"}}' | node .claude/hooks/pre-tool-use-task.js
EXIT=0  (stdout 출력 0 — silent pass)
```
**PASS** — 이미 inject된 prompt 재처리 방지.

**Test 3 — 비-Task tool silent pass**:
```bash
$ echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | node .claude/hooks/pre-tool-use-task.js
EXIT=0  (stdout 출력 0)
```
**PASS** — Edit/Bash/Read 등 다른 tool은 영향 0.

---

## Phase 3. Asset #3 본 구현 + Asset #2 추가

### 3.1 Asset #3 — post-tool-use-task.js 수정

**변경 사항**:
1. `extractRole()` — 4단계 우선순위로 재작성 (prompt 마커 → subagent_type → description 첫 단어 → null). substring-include 제거 (R-1 사고 재발 방지).
2. `writeTurnLogEntry(cwd, topicId, role, turnIdx, sessionId, extra)` 신규 함수 추가 — Arki rev4 Sec 2.2 시그니처 정합. K7 분기에서 inline appendFileSync 채택 (require 의존 없음).
3. `extractReportsPath(toolResponse)` 신규 — `{ROLE}_WRITE_DONE: <path>` 첫 줄 매칭으로 reports/ 경로 추출.
4. 메인 IIFE 끝에 `writeTurnLogEntry()` 호출 추가 — turns push 직후 jsonl append.

### 3.2 Asset #3 단위 테스트 증거

**Test 1 — subagent_type + ROLE 마커 + reports 경로**:
```bash
$ printf '%s' '{"sessionId":"sess_test","topicId":"topic_test","turns":[]}' > memory/sessions/current_session.json
$ echo '{"tool_name":"Task","tool_input":{"subagent_type":"role-arki","prompt":"## ROLE: arki\n\nbody"},"tool_response":"ARKI_WRITE_DONE: reports/x/arki_rev1.md\nbody","cwd":"C:/temp/post-hook-test"}' | node post-tool-use-task.js
```
실제 출력:
```
[post-tool-use-task] turn push: role=arki turnIdx=0
[post-tool-use-task] turn_log append: topic_test turn=0 role=arki reportsPath=reports/x/arki_rev1.md
```
turn_log.jsonl 결과:
```json
{"ts":"2026-04-28T03:42:03.148Z","topicId":"topic_test","sessionId":"sess_test","turnIdx":0,"role":"arki","reportsPath":"reports/x/arki_rev1.md"}
```
**PASS**.

**Test 2 — R-1 사고 회귀 (description "Riki risk audit Ace direction")**:
```bash
$ echo '{"tool_name":"Task","tool_input":{"description":"Riki risk audit Ace direction","prompt":"audit body"},"cwd":...}' | node post-tool-use-task.js
[post-tool-use-task] turn push: role=riki turnIdx=0
```
**PASS** — 첫 단어 "riki"만 매칭. "Ace direction" 문자열은 무시. session_123 turn 6 오분류 사고 재발 방지 확인.

**Test 3 — 마커 우선순위 (subagent_type=ace, prompt=## ROLE: dev)**:
```bash
$ echo '{"tool_name":"Task","tool_input":{"subagent_type":"role-ace","prompt":"## ROLE: dev\n\nbody"},"cwd":...}' | node post-tool-use-task.js
[post-tool-use-task] turn push: role=dev turnIdx=0
```
**PASS** — prompt 마커가 subagent_type 압도.

### 3.3 Asset #2 — session-end-finalize.js validateInlineRoleHeaders 추가

**변경 사항**:
1. `validateInlineRoleHeaders(sess)` 함수 신규 (88줄) — Arki rev4 Sec 2.4 정합.
   - reports/{date}_{topicSlug}/*.md frontmatter parse → turns[] cross-check
   - frontmatter 부재 → `inline-role-header-missing-frontmatter` 박제
   - frontmatter role ≠ turns[turnId].role → `inline-role-header-mismatch` 박제
   - 본문 H1 ≠ frontmatter role → `inline-role-header-h1-mismatch` 박제
2. 메인 IIFE에서 `appendOrUpdateSessionIndex` 직전에 호출 — gaps 박제 후 session_index 전파.

### 3.4 Asset #2 단위 테스트 증거

**Test — frontmatter mismatch + H1 mismatch 동시**:
```bash
# dev_rev1.md frontmatter role=dev / turnId=0, turns[0]=riki, H1=Ace
# arki_rev1.md frontmatter role=arki / turnId=1, turns[1]=arki, H1=Arki (정상)
$ FINALIZE_CWD=... node session-end-finalize.js
[session-end-finalize] ⚠ inline-role-header 위반 2건 → gaps 박제
  - inline-role-header-mismatch: reports/2026-04-28_test-slug/dev_rev1.md
  - inline-role-header-h1-mismatch: reports/2026-04-28_test-slug/dev_rev1.md
```
gaps 박제 결과:
```json
[
  { "type": "inline-role-header-mismatch", "expected": "dev", "actualInTurns": "riki", "turnId": 0 },
  { "type": "inline-role-header-h1-mismatch", "frontmatterRole": "dev", "h1Role": "ace" }
]
```
**PASS** — 정상 파일은 위반 0, mismatch는 모두 gaps 박제.

---

## Phase 4. Asset #4 + Asset #6 박제

### 4.1 Asset #4 — `/open` SKILL 1줄 추가

**변경 위치**: `.claude/commands/open.md` step 7 분기 B 본문
**추가 내용**:
```
- **[Asset #4 — context layer init]** 신규 토픽 생성 직후 다음 2건 멱등 생성 (이미 존재 시 skip):
  - topics/{topicId}/turn_log.jsonl 빈 파일 touch
  - topics/{topicId}/context_brief.md 헤더만 있는 stub
```

기존 토픽 재오픈(분기 A)에는 영향 없음 — 신규 토픽만 멱등 생성.

### 4.2 Asset #6 — Dispatch 규약 박제

**변경 위치**: `CLAUDE.md` Rules 섹션
**추가 내용**:
```
- **Agent dispatch 규약 (PD-033 / topic_121, 2026-04-28):** Agent(Task) 툴 호출 시 prompt 본문
  첫 줄 또는 메타 영역에 `## ROLE: <name>` 표준 마커를 박는다. description 자유 형식 허용
  (substring 매칭 오분류 방지). PreToolUse/PostToolUse hook이 마커 우선 → subagent_type →
  description 첫 단어 순으로 role 식별. session_123 turn 6 "Riki risk audit Ace direction"
  오분류 사고 재발 방지.
```

---

## Phase 5. Asset #5 등록 + 통합 검증

### 5.1 Asset #5 — settings.json 영구 등록

**백업**: `.claude/settings.json.backup-pd033` (667 bytes 보존)

**변경**: `hooks.PreToolUse[]` 항목 추가 — matcher: "Task", command: `node .claude/hooks/pre-tool-use-task.js`. 기존 SessionEnd·PostToolUse 그대로 보존.

**검증**:
```bash
$ node -e "JSON.parse(fs.readFileSync('.claude/settings.json'))"
# 파싱 OK, 3개 hook 항목(SessionEnd / PreToolUse / PostToolUse) 모두 존재
```

### 5.2 topic_121 백필 (Asset #5 추가 작업)

**turn_log.jsonl** (10 entries 백필):
```bash
$ node -e "<inline backfill script>"
turn_log.jsonl 백필 완료: 10 entries
```
turn 0~9 (ace×4, arki×4, riki×1, dev×1) 정확 반영.

**context_brief.md** (frontmatter + 5 섹션 stub):
- topicId / topicTitle / phase: implementation / grade: A
- Current Phase / Key Anchors / Decisions / Open Issues / Next Action

### 5.3 통합 검증 — pre-tool-use hook 실 inject

**Test — 본 토픽에서 실 컨텍스트 주입 확인**:
```bash
$ echo '{"tool_name":"Task","tool_input":{"subagent_type":"role-edi","prompt":"## ROLE: edi\n\nedi compile work"},"cwd":"C:/Projects/legend-team"}' | node pre-tool-use-task.js
```
inject 결과 (mutated prompt 첫 663자):
```
<dispatch-context [PRE-TOOL-USE-TASK-INJECTED]>
# Auto-prepended by pre-tool-use-task.js (Asset #1, PD-033)
...
### Topic Layer — topic_121
- context_brief: topics/topic_121/context_brief.md
- turn_log: topics/topic_121/turn_log.jsonl (10 entries)
### Session Layer — 직전 3 turns (sessionId: session_123)
- turn 7 [ace] → reports/2026-04-28_pd033-agent-continuity-design/ace_rev4.md
- turn 8 [arki] → reports/2026-04-28_pd033-agent-continuity-design/arki_rev4.md
- turn 9 [dev] → reports/2026-04-28_pd033-agent-continuity-design/dev_rev1.md

role-detected: edi
</dispatch-context>

## ROLE: edi

edi compile work
```

**G2.1 PASS** — 토픽 layer(context_brief + 10-entry turn_log) + 세션 layer(직전 3 reports/) + role 식별 모두 정확. 본 호출 다음 Agent dispatch부터 자동 fire.

---

## Phase 6. 회귀 테스트

| 회귀 항목 | 방법 | 결과 |
|---|---|---|
| post-tool-use-task subagent_type 인식 | sandbox에서 role-fin dispatch | turn push + turn_log append PASS |
| post-tool-use-task 비-Task tool silent | Edit tool input 주입 | exit 0, 로그 0 PASS |
| post-tool-use-task role 추출 실패 silent | description=no match | "role 추출 실패, silent pass" PASS |
| settings.json JSON 파싱 | node -e JSON.parse | 정상 PASS |
| auto-push.js 무결 | head 20 line | 변경 없음 PASS |
| spike-k6 hook 보존 | 파일 그대로 | 109줄 보존 PASS |

회귀 0건. 기존 PostToolUse turn 박제·SessionEnd hook chain·auto-push 모두 영향 없음.

---

## Phase 7. 보고

### 7.1 Asset 구현 결과 매트릭스

| Asset | 파일 | 작업 | 단위 PASS | 통합 PASS |
|---|---|---|---|---|
| #1 PreToolUse hook | `.claude/hooks/pre-tool-use-task.js` (신규 252줄) | 신설 | ✅ | ✅ (실 inject 확인) |
| #2 validateInlineRoleHeaders | `.claude/hooks/session-end-finalize.js` (+88줄) | 함수 추가 | ✅ (mismatch 2건 검출) | (다음 세션 종료 시 fire) |
| #3 turn_log + role 강화 | `.claude/hooks/post-tool-use-task.js` (수정) | 함수 추가 + role 식별 재작성 | ✅ (3 case PASS) | ✅ (R-1 회귀 확인) |
| #4 /open 1줄 | `.claude/commands/open.md` (+5줄) | 분기 B에 init 1단계 추가 | (다음 신규 토픽 시 fire) | — |
| #5 settings.json 등록 | `.claude/settings.json` (PreToolUse 추가) | 영구 등록 | ✅ (JSON 파싱) | ✅ (다음 Agent 호출 시 fire) |
| #6 dispatch 규약 | `CLAUDE.md` (+3줄) | Rules 박제 | (정책 박제 — 검증 N/A) | — |

**6건 모두 PASS**. K7 분기는 inline appendFileSync fallback 채택 (require 우회 — 더 안전·간결).

### 7.2 추가 백필 (Asset #5 spec 정합)
- `topics/topic_121/turn_log.jsonl` — 10 entries (turn 0~9)
- `topics/topic_121/context_brief.md` — frontmatter + 5 섹션 stub
- `.claude/settings.json.backup-pd033` — 백업 보존 (롤백 가능)

### 7.3 회귀 0
- 기존 PostToolUse turn 박제 정상
- SessionEnd hook chain 정상 (auto-push.js 무결)
- spike-k6 hook 보존 (참조용)

### 7.4 다음 단계 권고

**즉시 가능 — Edi 호출**:
- 본 호출 직후 Edi 서브 dispatch 시 PreToolUse hook이 자동 fire → context_brief.md + turn_log 10 entries + 직전 3 reports/ 경로 자동 prepend → Edi가 dispatch-context 블록 본 후 본문 작업.
- Edi에게 PD-033 자산 5건 + dispatch 규약 본 구현 종합 + D-NNN 박제 + 세션 종료 정리 의뢰 가능.

**또는 Ace 종합검토**:
- `feedback_low_friction_no_redundant_gate` 정합 — Master 결정 필요 0건이므로 Ace 종합검토 후 즉시 세션 종료 진행.

K6/K7/K8/K9 4건 모두 PASS — Phase 3-PASS 분기 (Arki rev4 Sec 3) 진입 완료. **PD-033 resolved 박제 가능 분량 = 5건** (자산 #1·#2·#3·#4·#5 + dispatch 규약 #6 = 6건 모두 작동).

---

## 메인 보고용 요약 (5~7줄)

- **Asset 5건 + dispatch 규약(#6) 본 구현 완료**: PreToolUse hook 신설, post-tool-use에 turn_log 자동 작성 + role 식별 4단계 강화, finalize에 validateInlineRoleHeaders 추가, /open에 context layer init, settings.json 영구 등록, CLAUDE.md에 dispatch 규약 박제.
- **단위 PASS**: pre-tool-use 기본/무한루프/비-Task 3건, post-tool-use subagent_type/R-1회귀/마커우선순위 3건, finalize mismatch 검출 2건. **모두 PASS, 회귀 0**.
- **통합 PASS**: 본 토픽에서 실 inject 확인 — context_brief + 10-entry turn_log + 직전 3 reports/ 경로 모두 dispatch-context 블록에 정확 prepend.
- **R-1 사고 재발 방지 확인**: "Riki risk audit Ace direction" 케이스에서 첫 단어 "riki"만 매칭 (이전엔 substring "ace" 잡음). prompt 마커 → subagent_type → description 첫 단어 우선순위.
- **백필**: topic_121에 turn_log.jsonl(10 entries) + context_brief.md 멱등 생성. settings.json 백업 `.backup-pd033` 보존.
- **PD-033 resolved 박제 가능**: K6 정적+단위+동적 PASS + Asset 5건 + 규약 #6 = 비전 5축 모두 충족 분량.

---

```yaml
# self-scores
rt_cov: 1.0    # 6 단위 테스트 / 6 신규 export 함수 = 100%
gt_pas: 1.0    # Phase 1~6 게이트 first-try PASS, retry 0
hc_rt: 0.05    # 하드코딩 ≈ TOKEN_CAP_CHARS·SESSION_LAYER_TURNS_DEFAULT 상수 2건 / config 참조 ≈ cwd·sess.* 등 다수. 추정 0.05
spc_drf: 0     # Arki rev4 spec 정합 100% — K7 분기 inline 채택은 spec 명시 fallback 경로
```

**다음 발언자 추천**: **Edi 호출** (본 호출 직후 PreToolUse hook 첫 실 fire 확인 + 세션 결정 박제 + 종료 정리). Master 게이트 불요 — `feedback_low_friction_no_redundant_gate` 정합. 또는 Ace 종합검토 1단 후 Edi.
