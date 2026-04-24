---
role: ace
topic: topic_096
session: session_091
rev: 1
date: 2026-04-24
phase: synthesis
invocationMode: subagent
parentInstanceId: synthesis-after-arki-rev3
---

# Ace 종합검토 rev1 — topic_096 (Riki/Fin 생략, Master 결정 반영)

**입력 흡수 (단정 — 흔들지 않음)**
1. sub-agent 미발동 = 회귀 아님. session_090이 첫 측정 baseline.
2. 세션 단절 = 회귀 아님. scratchpad는 시스템 시작 이래 존재한 적 없음.
3. arki_rev2 Child-1·Child-2는 **복원이 아니라 최초 구축**. implementationNote 의무.

**본 종합검토의 결론 단정**
- topic_096은 spec 확정 + Child 토픽 3개 open 권고로 종료.
- Child-0(baseline freeze) → Child-1(real sub-agent invocation) → Child-2(scratchpad lifecycle first build) **순서 고정**.
- Child-3(persona 분리)는 본 토픽 out, 후속 미정. 본 결정 후 Master 판단으로 open.
- Riki/Fin은 Master 명시로 본 세션 생략. 본 종합검토가 두 역할 슬롯을 흡수하지 않음 — 다음 토픽 또는 Child 진행 중 필요 시 재호출.

---

## Child-0 — Baseline Freeze (session_090)

권고: **topic_097 / baseline-freeze-session-090 / Grade C** (좁고 확정, Dev 직행)
topicType: implementation / parentTopicId: topic_096
resolveCondition: "`memory/shared/baseline_session_090.json` 파일이 생성되어 후술 7개 metric을 모두 포함하고, Child-1·Child-2의 Phase 5 regression test가 본 파일을 read-only로 참조 가능"

### 1. Confirmed baseline (현재 무엇이 어떻게 동작하는가)
- session_090 turns 11개 측정값 (`memory/sessions/session_index.json` line 3201~3315):
  - subagent: **3건** (turn 5/7/9, subagentId: ae844b15ec6eda182 / afb198c09b2033911 / abc7376a51148552f)
  - inline-main (위반): **3건** (turn 2 reframe Arki, turn 3 role-speech Vera/Nova/Edi/Dev/Riki/Fin 전원, turn 6 phase=relay Ace-as-relay)
  - inline-allowed: **4건** (framing/reframe/synthesis/synthesis)
  - relay 위반 phase: 1건 (turn 6, F-005 박제)
- invocationMode 필드: session_090 한 세션에만 존재 (시스템 사상 최초 측정 세션).
- scratchpad 디렉토리: `memory/shared/scratchpad/` 부재. `memory/shared/scratchpad-archive/` 부재. (arki_rev3 R-2 (b) 단정).
- PreToolUse hook: `.claude/settings.json` 미등록. SessionEnd hook 1개만 존재 (line 9~20).
- F-NNN 태깅: evidence_index.json line 158 — "F-태깅 프로토콜 도입 (session_090, D-066)". F-001~F-013 13건이 session_090에서 신설.
- dispatch_config.json: v1.1.0. hardGate / scratchpad / gradeSInlineAllow 필드 모두 부재 (arki_rev2 Section D 확장 대상).
- 누적 메모리 경로: `memory/roles/{role}_memory.json` 9개 — 세션 시작 read + 세션 종료 write **단일 경로**. instance 간 공유 메커니즘 아님.

### 2. Declared-but-not-implemented items (선언만 된 항목)
- **D-058 (session_068)**: opus-dispatcher 스킬 신설, "Sonnet Main + Opus 서브" 계약 선언. → Schema invocationMode 필드 부재로 22세션간 측정 불가 구간 (arki_rev3 M4).
- **D-051 (session_054)**: "3층 context 누적" 선언, 구현은 PD-020a/b/c로 분해 이연. → save01~05/context_brief/session_contributions 파일 미존재.
- **D-066 (session_090)**: invocationMode Schema L1 + finalize gate L2 + dispatch_config 4필드 L3 박제. → enforcement는 finalize 사후 박제만. PreToolUse hard-gate 미구현.
- **D-066 implementationNote (session_090)**: "서브에이전트 세션 지속성은 PD-032/033으로 이관". → 본 Child-2 책임.
- **PD-032 / PD-033**: scratchpad 실체 없이 PD 상태로만 존재 (arki_rev3 R-2 (b) 인용).

### 3. Build target (무엇을 만들 것인가)
- 단일 산출물: `memory/shared/baseline_session_090.json`
- 본 파일은 **불변(immutable) baseline**. 향후 어떤 세션도 본 파일을 수정하지 않음. 새 측정은 별도 파일로.
- Child-1/Child-2의 regression test가 본 파일 metric과 비교하여 "개선 / 유지 / 회귀" 판정.

### 4. Minimal patch (최소 변경 표면)
신규 파일 1개:
- `memory/shared/baseline_session_090.json` — 아래 7개 metric

신규 스크립트 1개 (선택):
- `scripts/freeze-baseline.ts` — session_090 turns에서 metric 자동 추출 (수동 작성도 허용)

수정 파일 0개. dispatch_config / settings / hook 손대지 않음.

기록할 7개 metric (단정):
1. `subagentInvocationCount: 3` (turn idx [5, 7, 9])
2. `inlineMainViolationCount: 3` (turn idx [2, 3, 6])
3. `inlineAllowedCount: 4`
4. `relayPhaseViolationCount: 1` (turn idx [6], F-005)
5. `scratchpadDirectoryExists: false` (path: `memory/shared/scratchpad/`)
6. `scratchpadArchiveExists: false` (path: `memory/shared/scratchpad-archive/`)
7. `fEvidenceCount: 13` (F-001~F-013, evidence_index.json 도입 시점 session_090)

부가 필드: `sessionId: "session_090"`, `gradeDeclared: "A"`, `frozenAt: "2026-04-24"`, `sourceFile: "memory/sessions/session_index.json#L3201-L3315"`, `immutable: true`, `comment: "신규 구축 baseline. 회귀 복원 아님. session_090 이전 22세션은 invocationMode 측정 부재 구간이며 baseline으로 사용 금지."`

### 5. Regression test (P1~P4)
- **P1 (구조)**: 파일 존재 + JSON 파싱 가능 + 7개 metric 키 전부 포함.
- **P2 (정합)**: 각 metric 값이 session_index.json line 3201~3315 turns 배열과 1:1 일치 (수동 cross-check 1회).
- **P3 (불변성)**: 본 파일 mtime이 frozenAt 이후 변하지 않음. `validate-baseline-immutable.ts` 도입 권고 (Child-0 Phase 2 선택).
- **P4 (참조 계약)**: Child-1/Child-2의 regression test 코드가 본 파일을 read-only로 참조하고 비교 결과를 출력. baseline 자체를 수정하면 fail.

baseline 통과 조건: 7개 metric 모두 일치 + immutable 검증 통과.

### 6. Do-not-touch scope
- dispatch_config.json 변경 금지 (Child-1 책임)
- settings.json hooks 변경 금지 (Child-1 책임)
- `memory/shared/scratchpad*/` 디렉토리 생성 금지 (Child-2 책임)
- 기존 session_090 entry 수정 금지 (immutable 원칙)
- persona 분리 / Child-3 영역 미진입
- F-NNN 신설 금지 (본 Child는 측정 freeze, 신규 finding 없음)

---

## Child-1 — Real Sub-Agent Invocation

권고: **topic_098 / real-subagent-invocation / Grade A** (hook + schema + settings 통합 결정 표면)
topicType: implementation / parentTopicId: topic_096
resolveCondition: "Grade A 신규 테스트 토픽에서 Main 인라인 시도 시 PreToolUse 또는 UserPromptSubmit hook이 system-reminder 주입을 1회 이상 트리거하고, arki_rev2 Section B-7 시나리오 8단계 전부 재현 가능. 동시에 Child-0 baseline 대비 inlineMainViolationCount가 0이 되거나 측정된 fallback 사유와 함께 기록."

### 1. Confirmed baseline
- arki_rev2 Section B-1: PreToolUse hook이 `.claude/settings.json`에 미등록. 현재 SessionEnd 1개만 등록 (line 10~19).
- arki_rev2 Section D: dispatch_config.json v1.1.0에 `gradeAInlineBlock` / `gradeSInlineBlock` 필드는 존재하나 enforcement 경로는 finalize 사후 박제만.
- session_090 turn 2/3 사례: Grade A에서 Arki·Vera·Nova·Edi·Dev·Riki·Fin 전원 inline-main 위반. hard-gate 부재가 원인.
- session_090 turn 6: phase=relay 자체가 inline-main으로 측정 → Ace 화이트리스트 매트릭스 부재.

### 2. Declared-but-not-implemented items
- **D-066 (session_090)**: enforcement는 finalize 사후 박제만. "행위 차단 없음" — arki_rev2 Section A P1 인용.
- **opus-dispatcher 스킬 (session_068)**: "Soft-guide 수준이며 enforcement 경로 아님" — dispatch_config.json `_comment` 명시.
- **arki_rev2 Section B 전체**: hook 2종 + escalation + 화이트리스트 spec만 존재, 코드 미작성.

### 3. Build target
- agent 호출 schema: dispatch_config.json v1.2.0 (arki_rev2 Section D 그대로) — `hardGate` 객체 + `gradeSInlineAllow` 객체 추가.
- invocationMode 분기 강제: 2-tier hook (PreToolUse hard-gate + UserPromptSubmit soft-reminder).
- PreToolUse hook 연동: `.claude/hooks/pretool-role-gate.js` 신설 + settings.json 등록.
- settings/allowedTools/blockedAgents 정합성: 본 Child에서 dispatch_config가 SSOT임을 코드로 강제 (hook이 dispatch_config read).
- inline-main fallback 시 명시 error 또는 measured fallback 기록: invocationMode 외 추가 필드 `fallbackReason` 신설 (Schema L1 확장).

### 4. Minimal patch
신규 파일 3개:
- `.claude/hooks/pretool-role-gate.js` — Task tool 호출 차단 로직 (arki_rev2 Section B-2)
- `.claude/hooks/userprompt-role-reminder.js` — system-reminder 강제 주입 (arki_rev2 Section B-3)
- `scripts/lib/dispatch-config-loader.ts` — hook이 공유 read하는 helper (SSOT 보증)

수정 파일 3개:
- `.claude/settings.json` — hooks.PreToolUse / hooks.UserPromptSubmit 배열 추가
- `memory/shared/dispatch_config.json` — v1.1.0 → v1.2.0 (hardGate / gradeSInlineAllow 객체 추가, arki_rev2 Section D)
- `scripts/lib/turn-types.ts` (D-048) — Turn 타입에 `fallbackReason?: string` 필드 추가

수정 금지: session_index.json (과거 데이터), validate-session-turns.ts (검증 로직은 본 Child Phase 6 별도 보강).

### 5. Regression test (P1~P4)
- **P1 (베이스라인 read)**: `memory/shared/baseline_session_090.json` read 성공. `inlineMainViolationCount: 3`을 baseline으로 인식.
- **P2 (hook 단위)**: pretool-role-gate.js에 mock Task input(subagent_type=arki) 주입 → Grade A에선 pass, blocked role inline 시도 시 `{"decision":"block"}` 반환. userprompt-role-reminder.js는 current_session.json mock에서 system-reminder JSON 반환.
- **P3 (시나리오 재현)**: arki_rev2 Section B-7 8단계 신규 토픽에서 1회 실측. step 5에서 system-reminder 주입 확인, step 6에서 Task 전환 확인, step 7 강행 시 finalize gaps 박제 확인.
- **P4 (baseline 비교)**: 동 신규 토픽 종료 후 invocationMode 측정 → `inlineMainViolationCount = 0` (성공) 또는 `> 0` && 각 turn에 `fallbackReason` 기록(부분 성공). baseline의 3건 대비 개선 정도를 수치화.

통과 조건: P1·P2·P3 전체 통과 + P4가 baseline 대비 동등 이상.

**implementationNote 의무 (Master 결정 3 인용)**: "본 spec은 회귀 복원이 아닌 신규 구축이다. session_090 이전 22세션은 invocationMode 측정 부재 구간이며 '이전엔 작동했다'는 baseline으로 사용 금지. baseline은 `memory/shared/baseline_session_090.json` 단일 출처."

### 6. Do-not-touch scope
- `memory/shared/scratchpad*/` 일체 미진입 (Child-2 책임).
- baseline_session_090.json 수정 금지 (Child-0 immutable).
- role-*.md persona 본문 수정 금지 (Child-3 보류 영역).
- session_index.json 과거 turns 수정 금지.
- evidence_index.json F-NNN 신설은 본 Child 진행 중 발견된 위반 박제용으로만 허용 (회고 소급 금지).

---

## Child-2 — Scratchpad Lifecycle First Build

권고: **topic_099 / scratchpad-lifecycle-first-build / Grade A** (스키마 + lifecycle + helper 다층 결정 표면)
topicType: implementation / parentTopicId: topic_096
resolveCondition: "Grade A 토픽 1개에서 동일 역할 3회 호출, 3회차 발언 본문이 1·2회차 F-NNN 명시 인용. `memory/shared/scratchpad-archive/` 디렉토리에 instances.length ≥ 2 scratchpad 1개 이상 존재. PD-033 자동 매칭 통과."

### 1. Confirmed baseline
- `memory/shared/scratchpad/` 디렉토리 **부재** (arki_rev3 R-2 (b) 100% 단정).
- `memory/shared/scratchpad-archive/` 디렉토리 **부재**.
- 누적 메커니즘은 `memory/roles/{role}_memory.json` 9개의 세션 단위 read/write 단일 경로뿐. instance 간 공유 0건.
- D-051 "3층 context 누적" 선언만 있고 구현 미완. PD-020a/b/c 분해 이연 상태.
- D-066 implementationNote: "PD-032/033으로 이관" — 본 Child가 그 책임자.
- baseline_session_090.json 기록값: `scratchpadDirectoryExists: false`, `scratchpadArchiveExists: false`.

### 2. Declared-but-not-implemented items
- **D-051 (session_054, 2026-04-21)**: "3층 context 누적" 선언, 구현은 PD-020a/b/c로 분해 이연.
- **PD-020a / PD-020b / PD-020c**: save01~05 / context_brief / session_contributions 파일 일체 미존재.
- **PD-032**: scratchpad 도입 PD, 실체 없이 상태로만 존재.
- **PD-033**: cross-instance memory 검증 PD, 매칭 대상 자체 없음.
- **D-058 (session_068)**: "기억의 상주" 추상 표현 — arki_rev2 Section H 권고대로 본 Child에서 "scratchpad-mediated"로 명문화.

### 3. Build target
- 디렉토리 신설: `memory/shared/scratchpad/` (live) + `memory/shared/scratchpad-archive/` (archive).
- 파일 단위 계약: `memory/shared/scratchpad/{topicId}/{role}.json` (arki_rev2 Section C-1 스키마 그대로).
- open·create·write·close·archive 5단계 lifecycle 코드화 (arki_rev2 Section C-5 표).
- topic 단위 scratchpad와 role memory 분리: scratchpad는 instance×topic 누적, role_memory는 role×session 누적. 두 경로는 서로 read-only.
- cross-instance shared scratchpad는 Grade S/A 한정 (dispatch_config `scratchpad.appliesToGrades: ["A", "S"]`).
- persistent memory와 혼동 금지: scratchpad는 토픽 종료 시 archive 이동, live는 활성 토픽만 유지.
- F-NNN 발급 helper (atomic write) — arki_rev2 Section C-2.
- Main 호출 직전 selective load prepend (arki_rev2 Section C-4·C-7).

### 4. Minimal patch
신규 디렉토리 2개:
- `memory/shared/scratchpad/` (live)
- `memory/shared/scratchpad-archive/` (archive)

신규 파일 5개:
- `scripts/lib/scratchpad-types.ts` — JSON Schema + TypeScript type
- `scripts/lib/scratchpad-writer.ts` — atomic write + F-NNN 발급
- `scripts/append-scratchpad.ts` — CLI append (sub 호출용)
- `scripts/build-subagent-prompt.ts` — Main이 Task 호출 직전 prepend 자동화
- `scripts/lib/scratchpad-archive.ts` — close 시 archive 이동

수정 파일 4개:
- `memory/shared/dispatch_config.json` — `scratchpad` 객체 추가 (arki_rev2 Section D, Child-1과 별도 PR로 분리 가능)
- `.claude/agents/role-arki.md` / `role-fin.md` / `role-riki.md` — Write 계약에 SCRATCHPAD_APPEND_DONE 라인 추가 (Ace는 Child-1과 협의)
- `.claude/skills/open/SKILL.md` — Grade A/S 토픽 open 시 seed 단계 추가
- `.claude/skills/close/SKILL.md` — 토픽 close 시 archive 이동 단계 추가

수정 금지: dispatch_config.json의 hardGate 영역(Child-1), settings.json hooks(Child-1), session_index.json 과거 turns.

### 5. Regression test (P1~P4)
- **P1 (베이스라인 read)**: `memory/shared/baseline_session_090.json` read 성공. `scratchpadDirectoryExists: false` 및 `scratchpadArchiveExists: false`를 baseline으로 인식.
- **P2 (단위)**: scratchpad-writer.ts 단위 테스트 — 빈 파일에 F-001 발급 → 다음 호출 시 F-002 발급. atomic write 부분 쓰기 시뮬레이션 시 rollback 확인.
- **P3 (시나리오 재현)**: arki_rev2 Section C-6 7단계 신규 Grade A 토픽에서 실측. step 5에서 2회차 발언이 F-001 명시 인용, step 7에서 archive 이동 확인. selective load 발동 1회 (arki_rev2 Section C-7) 별도 시나리오로 검증.
- **P4 (baseline 비교)**: 동 토픽 종료 후 디렉토리 재측정. `scratchpadDirectoryExists: true`(live가 비어있어도 디렉토리 존재) + `scratchpadArchiveExists: true` + archive 내 instances.length ≥ 2 파일 1개 이상. baseline의 두 false 대비 명확한 진보 측정.

통과 조건: P1·P2·P3 전체 통과 + P4 archive 1개 + PD-033 resolveCondition 충족 (lifecycle 도구 자동 매칭).

**implementationNote 의무 (Master 결정 3 인용)**: "본 spec은 회귀 복원이 아닌 신규 구축이다. cross-instance memory는 시스템 시작 이래 단 한 번도 구현된 적 없으며 (arki_rev3 R-2 (b) 인용), '이전엔 누적됐다'는 baseline으로 사용 금지. baseline은 `memory/shared/baseline_session_090.json` (`scratchpadDirectoryExists: false`)."

### 6. Do-not-touch scope
- `.claude/hooks/` PreToolUse / UserPromptSubmit 신설 금지 (Child-1 책임).
- dispatch_config.json `hardGate` 객체 신설 금지 (Child-1 책임).
- baseline_session_090.json 수정 금지 (Child-0 immutable).
- `memory/roles/{role}_memory.json` 스키마 변경 금지 (scratchpad와 분리 원칙).
- role-*.md persona 본문(역할 정체성·스타일) 수정 금지 (Child-3 보류 영역). Write 계약 라인만 추가.
- evidence_index.json 회고 소급 금지.

---

## 부록 A — 진행 순서·게이트

1. **Child-0 완료 후** Child-1 / Child-2 진입 (baseline 파일 없으면 두 Child의 P1·P4 실행 불가).
2. Child-1과 Child-2는 **병렬 가능**. 단 dispatch_config.json 동시 수정은 충돌 위험 → PR 분리 또는 한쪽 먼저 merge.
3. Child-1·Child-2 모두 P3 시나리오에 **신규 Grade A 테스트 토픽 1개**가 필요. 동일 토픽 1개에서 두 Child 시나리오 동시 검증 가능 (운영 효율).
4. Child-3(persona 분리)는 Child-1·Child-2 P4 통과 후 Master 판단으로 open. 본 종합검토는 Child-3 spec에 손대지 않음.

## 부록 B — Grade 의도 확인 권고 (Master)

Child-0=C / Child-1=A / Child-2=A 단정. Master 다른 의도(예: Child-1·2를 모두 B로 좁히기, 또는 통합 1개 토픽 S로 묶기)면 명시 요청. Ace 추천은 위 단정 유지.

---

**ACE_WRITE_DONE: reports/2026-04-24_topic096-ace-arki-protocol/ace_synthesis_rev1.md**
