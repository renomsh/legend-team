---
role: arki
topic: topic_096
session: session_091
rev: 4
date: 2026-04-24
phase: breakpoint-localization
invocationMode: subagent
mode: forensic
---

ARKI_WRITE_DONE: reports/2026-04-24_topic096-ace-arki-protocol/arki_rev4_breakpoint_localization.md

# Arki rev4 — Breakpoint Localization (Forensic)

**모드**: 검시관. 처방 금지, 진단만. session_090은 baseline이 아니라 symptom snapshot.
**전제 (Master 박제)**: break-point unknown / 과거 good-state 체감 존재 / 현재 bad-state 관측 / telemetry 불완전.
**rev3 단정 보류**: rev3는 "처음부터 미작동·체감"으로 단정했음 — 본 rev4에서 그 단정 자체를 객관 흔적으로 재검증.

---

## 1. Good-State Evidence

### 1.1 Master 직접 긍정 신호 — **단 1건**
`memory/master/master_feedback_log.json` 전체 86건 중 명시 긍정은 1건.

- **MF-024 (line 731~742)** — `session_031`, 2026-04-17, topic `session-history-view`
  - feedback: `"Ace 이번에 잘 주관했어."`
  - statusNote: `"session_031 Ace 오케스트레이션 패턴(Ace→Arki→Fin→Riki→Ace종합→Dev) 정상 작동 확인"`
  - effect: `"Ace masterSelectionPatterns에 implementation 토픽 패턴 기록"`

이외 긍정 톤 (`잘`/`정확`/`훌륭`/`만족`)은 없음. "역할이 살아있다"·"분화됐다"는 직접 표현 0건.

### 1.2 역할 분화 가시 흔적 — `reports/` 디렉토리 role file diversity

reports/ 디렉토리 88개 중 **역할별 rev 파일이 4개 이상 동시 등장**한 세션:

| 세션 디렉토리 | 파일 수 | 역할 분화 |
|---|---|---|
| `2026-04-19_copd-paper-phase6-discussion` | 14 | (논문 토픽 — 다중 rev 누적, role-orch와 별개) |
| `2026-04-21_pd-020b-p0p1-turns-schema` | 6 | ace+arki+fin+riki+dev+editor |
| `2026-04-21_topic-centric-architecture` | 5 | ace+arki+fin+riki+editor |
| `2026-04-21_pd-021-auto-model-switch-reimpl` | 5 | ace+arki+fin+riki+editor |
| `2026-04-21_pd-020c-decision-ownership` | 5 | ace+arki+fin+riki+editor |
| `2026-04-21_pd-020b-context-3layer` | 5 | ace+arki+fin+riki+editor |
| `2026-04-20_phase4-ui` | 5 | (확인 시 role 다양성) |
| **`2026-04-18_copd-project-review`** | 5 | **ace+arki+nova+riki+editor** (Nova 등장) |
| `2026-04-22_alarm-analysis-resolution` | 4 | ace+arki+dev+riki |
| `2026-04-24_pd031-topic082-parallel-integration` | 3 | ace+arki+editor |

> Good-State 윈도우 후보: **session_031 (2026-04-17) ~ session_054 부근 (2026-04-21)** — `2026-04-18 copd-project-review`(5역할) 및 `2026-04-21` 6개 토픽이 모두 4~6역할 분화.
> 단 "분화 = 작동"은 reports 파일 존재만 입증. 발언 주체가 Main inline인지 subagent 호출인지는 **reports만으론 구분 불가** — invocationMode 필드 부재로 인한 측정 한계 (rev3 단정과 정합).

### 1.3 role memory 누적 흔적 — `memory/roles/*.json` git history

| 역할 | 가장 활발한 세션 구간 | 갱신 빈도 |
|---|---|---|
| arki | 2026-04-19 ~ 2026-04-23 | 2026-04-16 dev-test → 04-19 persona/global-skill → 04-20 phase3 → 04-22 growth-board → 04-23 pd023 (8회 갱신) |
| fin | 04-19 persona, 04-22 fin-overhead-reaudit-d060, 04-23 pd023 (4회) | 빈도 낮음 |
| riki | 04-19 ~ 04-23 (4회) | 빈도 낮음 |
| nova | 04-19 ~ 04-23 (5회) — **04-13 databook-agent-design 이후 04-19까지 6일 공백** | 산발적 |
| ace | **04-20 role-recall-measurement-structure → 04-23 vera-claude-design-ai-integration까지 8회 연속** | 가장 활발 |
| dev | 04-19 ~ 04-24 매우 활발 (7회) | 활발 |
| editor | 04-19 ~ 04-24 (4회), 04-10 → 04-19 9일 공백 | 산발적 |

> 역할 메모리 갱신이 **2026-04-19~21에 집중 활성화** → 2026-04-22 이후 ace/dev/editor만 활발, 나머지는 산발 → 2026-04-23~24 는 dev/editor만 매일 갱신, arki/fin/riki/nova는 04-23 이후 갱신 없음.

### 1.4 역할 정의·페르소나 활성 시점 — decision_ledger
- **D-015 (2026-04-?, MF-005 line 503)**: "6개 역할 재정의 확정"
- **D-019 (session_018, 2026-04-15)**: "Ace 오케스트레이터 선언" — feedback_ace_orchestrator_declaration.md 박제
- **D-029 (2026-04-17)**: Vera(Designer) 도입
- **D-041~D-048 (session_047~049, 2026-04-19~20)**: Turn 구조 + plannedSequence + grade 도입
- **MF-005 (line 501, session ?)**: `"Ace = Master의 판단 대리인. 후행 통합기→선행 제안기 진화. 종합+자기판단 필수. Master 미응답 시 능동 질문."`

### 1.5 Good-State 종합 단정
**Good-State 윈도우 후보**: `session_031 (2026-04-17) ~ session_054 부근 (2026-04-21)` — 5일.
- 객관 흔적: ① MF-024 명시 긍정, ② reports diversity 4~6역할 동시 등장 9건, ③ role memory 갱신 04-19~21 집중.
- **단**: 발언 주체(Main vs subagent) 구분 불가 → "역할 분화"의 실체는 "Main이 6역할을 inline 시뮬레이션해도 reports는 같은 모양"일 수 있음 → 본 윈도우의 "Good"은 **report 모양·결정 산출량 기준 Good**이지 invocationMode 기준 Good은 아님.

---

## 2. Bad-State Evidence

### 2.1 Master 부정 신호 — 명확한 시계열 박제
`memory/master/master_feedback_log.json` grep 결과:

- **MF (line 110, session ?)**: `"Dev 자가검증 실행했어? — 1차 CLI 스모크만으로 완료 선언했을 때 제동..."` (session_047, D-047 관련 추정)
- **MF (line 191, session_068 직후)**: `"auto-model-switch 스킬이 단순히 /model 타이핑 안내만 하면 의미 없음. 원래 의도는 Sonnet이 메인으로 유지되면서 필요 시 Opus를 자동 호출(Agent 도구로 model: opus 서브에이전트)하는 구조였음. 현 구현은 의도와 불일치. 재구현은 다음 이연과제로."` → **Master 본인이 D-058 직후 즉시 "의도 불일치" 자각**.
- **MF-S089 (line 5~31, session_089, 2026-04-24)**: 3건 연속
  - `"심플하되 성장하는 측정..."`
  - `"긴급 과제 끼어들기 후 PD 상태 drift가 이번 재구현 오사고의 근본 원인"`
  - `"PD pending ≠ 구현 미완. resolveCondition은 '종결 조건'이며 '남은 일' 아님."`
- **MF-S090 (line 938~967, session_090)**: 3건 연속
  - line 943: `"YAML 기입·batch-helper·main nav 전면 개편 폐기. 시스템 자동 추출 + 역할별 단일 점수..."`
  - line 955: `"Grade A inline-main 시뮬레이션 구조적 방지. 스킬 의존 폐기. Schema+Hook+Structural 3층 방어."` → **invocationMode 도입 trigger**.
  - line 966: `"왜 에이스가 아키의 응답을 전달하지? 라우터 역할을 하는 건가?"` → **Ace relay 금지 (F-005)**.

### 2.2 session_088 / 089 / 090 사고 시계열
- **session_088**: PD-023 resumption 사고 — `"긴급 과제 끼어들기 후 PD 상태 drift"` (MF-S089-2)
- **session_089**: D-064 + D-065 박제 — Step 0b 교차검증 의무화, PD-030 자동 전이 훅
- **session_090**: 시스템 사상 최초 invocationMode 측정 → **즉시 inline-main 위반 3건 노출** (turn 2/3/6, session_index.json line 3250/3258/3280)
  - turn 5/7/9는 subagent 통과 (line 3272/3287/3302)
  - 같은 세션 note (line 3314): `"[대전환] signal v1.00 설계 → 중대 구조 위반(inline-main·relay) 발견 → Phase 1 방어책 박제로 scope 전환 | [confession] Main(Opus 4.7)이 Grade A임에도 7역할 inline 시뮬레이션. D-058 enforcement 공백 노출"`
- **session_091 (현재)**: topic_096. arki rev1·2·3 → Master STOP → rev4.

### 2.3 Bad-State 윈도우 단정
**Bad-State 윈도우**: `session_088 ~ session_091` (2026-04-24 4세션 집중) — 명시 부정 피드백 6건.
**그 이전**: `session_068` 시점에 Master가 D-058 의도 불일치를 즉시 자각 (line 191) — 잠복 sleeper.

---

## 3. Delta Files (시간순)

git log + mtime 교차로 산출. `session_031 (Good-State 정점)` ↔ `session_088~090 (Bad-State 표면화)` 사이 변경 항목.

| 시점 | 파일 / 영역 | 변경 종류 | 출처 |
|---|---|---|---|
| 2026-04-15 (session_018) | CLAUDE.md "Ace Orchestration Protocol" | D-019 추가 (Ace 오케스트레이터 선언, **inline 1-role-1-utterance 폐기, Task 도구 강제 없음**) | decision_ledger D-019 |
| 2026-04-17 (session_031) | — | **★ Master 긍정 박제 (MF-024)** | master_feedback_log line 737 |
| 2026-04-19 (session_047) | scripts/lib/turn-types.ts, scripts/validate-session-turns.ts | D-048 Turn 구조 도입. **invocationMode 필드 부재** | git log scripts/lib |
| 2026-04-19~21 | memory/roles/*.json (6개 역할 모두 갱신) | role memory 활성화 정점 | git log roles/ |
| 2026-04-22 09:12 (session_068) | `.claude/agents/role-{ace,arki,fin,riki}.md` 신규 생성 + `.claude/skills/auto-model-switch/SKILL.md` 삭제 + `.claude/skills/opus-dispatcher/SKILL.md` 신규 + `memory/shared/dispatch_config.json` 신규 (commit `1d7756f`) | **D-058 Dispatcher 선언 — Schema 강제 없음, hook 없음, settings 변경 없음** | git show 1d7756f |
| 2026-04-22 직후 | — | **★ Master 부정 박제 (MF line 191): "현 구현은 의도와 불일치"** | master_feedback_log line 191 |
| 2026-04-21 ~ 04-23 | `agents/{ace,arki,fin,riki,editor,nova,dev}.md` (legacy 7개) | 변경 흔적 발견됨 (현 git status: M agents/ace.md, dev.md, editor.md, nova.md). **`agents/` 디렉토리는 dispatcher가 참조하지 않음** — `.claude/agents/role-*.md`만 참조 (Task tool 규약). 즉 legacy 7개는 더 이상 Effective하지 않을 가능성 | git status |
| 2026-04-23 (session_080~085) | memory/roles/{ace,arki,fin,riki,nova} 갱신 빈도 급감 (arki/fin/riki는 04-23 이후 갱신 없음, dev/editor만 매일) | role memory write 경로가 dev/editor 중심으로 편향 | git log roles/ |
| 2026-04-24 (session_088~090) | 다수 | PD-023 사고 → D-064/D-065 → invocationMode 신설 → F-001~F-013 태깅 → role-*.md 자기소개 제약(F-013) → role-ace.md F-005 relay 금지 | decision_ledger, evidence_index, c9e6604 |
| 2026-04-24 14:14 (c9e6604) | `.claude/agents/role-*.md` 4개 +1~2 line, `.claude/hooks/session-end-finalize.js` +44 line, dispatch_config.json +15 line | session_090 박제 적용 | git show c9e6604 |

**핵심 delta 3건**:
1. **2026-04-15 D-019**: 오케스트레이터 선언했지만 **Task 강제 메커니즘 부재** — 6세션 후 session_031에서 Master가 "Ace 잘 주관"이라 칭찬했으나 발언 주체가 inline인지 subagent인지 측정 부재.
2. **2026-04-22 commit 1d7756f (D-058)**: dispatcher 신설. **agents/ legacy 7개는 그대로 두고 .claude/agents/role-*.md 4개만 신설** — 이중 source 발생. 동시에 schema/hook/settings 변경 없이 **선언만**. Master가 즉시 의도 불일치 자각(MF line 191) → 잠복 sleeper. 22세션 후 session_090에서 폭발.
3. **2026-04-22 ~ 2026-04-23**: role memory 갱신 분포가 dev/editor 중심으로 편향 (arki/fin/riki/nova 04-23 이후 0회) → 역할 메모리 누적 비대칭 발생.

---

## 4. Suspected Breakpoint Candidates (Layer별)

| Layer | 후보 | 근거 |
|---|---|---|
| **Orchestration** | (a) D-019 선언이 "Ace 판단으로 호출"만 명시, **호출 매체(Task tool 의무)**를 명문화하지 않음 → Main inline 시뮬레이션이 "오케스트레이터의 정당한 판단"으로 해석 가능 | CLAUDE.md "Ace Orchestration Protocol" 섹션 / MF-005 line 501 "Ace = Master의 판단 대리인" |
| **Hook** | (a) `.claude/hooks/`에 PreToolUse·UserPromptSubmit hook 부재. session-end만 존재 (2개) — 발언 시점에 invocationMode 강제할 hook 없음 | ls .claude/hooks/ = session-end-{tokens,finalize}.js 2개 |
| **Dispatch** | (a) opus-dispatcher 스킬은 **선언적 SKILL.md만 존재**, settings.json·hook 등록 없음. "Sonnet Main + Opus 서브" 계약은 스킬 본문 텍스트로만 존재. (b) dispatch_config.json은 session_068 신설 후 session_090까지 schema 변경 없이 22세션 잠복 | git log opus-dispatcher SKILL.md = 1d7756f 1회만 |
| **Agent schema** | (a) `.claude/agents/role-*.md` 4개와 `agents/*.md` legacy 7개의 **이중 source**. dev/editor/nova는 legacy만 존재 → Task 호출 시 .claude/agents/ 등록 안 된 역할은 fallback 경로 자체 부재. (b) session_090 D-066에서 자기소개 제약 추가됐지만, 추가는 **이미 일어난 위반에 대한 패치** | ls .claude/agents/ vs ls agents/ |
| **Memory** | (a) cross-instance scratchpad **항상 부재** — `memory/shared/scratchpad/` 디렉토리 없음 (rev3 100% 단정과 정합). (b) role memory 갱신 분포 편향: 04-23~24에 dev/editor만 매일 갱신, arki/fin/riki/nova 정지 → 역할 페르소나가 발언 시 누적 컨텍스트 없이 시작 | ls memory/shared/ = scratchpad 0건 / git log roles/ |
| **Session resume** | (a) PD-005·PD-023 resumption에서 children status·git log·artifacts 교차검증 부재 → session_088~089 drift. D-065로 사후 패치(Step 0b). (b) current_session.json에 invocationMode 누적 필드는 session_090부터 존재, 그 이전 89세션은 turns 박제 자체가 부재하거나 invocationMode 없음 | grep invocationMode session_index.json = 11회 모두 session_090 |
| **Measurement** | (a) **invocationMode 필드 자체가 session_090 이전 부재** → 89세션 동안 "Main inline vs subagent" 측정 불가능. (b) F-태깅(F-001~F-013) 도입도 session_090. 즉 측정 인프라가 가장 늦게 도입됨 | evidence_index.json line 158 / session_index.json grep |

---

## 5. Evidence Strength

| 후보 | Strength | 이유 |
|---|---|---|
| Orchestration (a) D-019 호출 매체 미명문 | **High** | CLAUDE.md 본문 직접 인용 가능. "Ace는 orchestrator. 역할 호출 순서·횟수는 Ace 판단" — Task tool 의무 0회 등장. session_090 inline-main 3건이 직접 결과. |
| Hook (a) PreToolUse 부재 | **High** | ls 결과 100% 단정. 발언 시점 강제 메커니즘이 schema·hook·settings 어디에도 없음. |
| Dispatch (a) opus-dispatcher 선언만, 강제 없음 | **High** | git log 1회 (1d7756f) + Master 본인 즉시 자각(MF line 191). 22세션 잠복은 측정 부재로 입증 자체 불가능했음. |
| Dispatch (b) 22세션 schema 동결 | **Medium** | dispatch_config.json git log 2회만(1d7756f, c9e6604). 변경 간격 22세션은 fact, 그게 "단절 원인"인지는 추론. |
| Agent schema (a) 이중 source (.claude/agents vs agents) | **High** | ls 결과 + git status M 표시 4건 (agents/ace.md, dev.md, editor.md, nova.md) — 두 디렉토리 모두 활성 흔적 있으나 dispatcher는 `.claude/agents/`만 참조. dev/editor/nova는 `.claude/agents/`에 없음 → 호출 시 fallback 정책 불명. |
| Agent schema (b) session_090 사후 패치 | **High** | c9e6604 commit이 role-*.md 4개에 자기소개 제약 추가 — F-013 박제는 위반 발생 후. |
| Memory (a) scratchpad 항상 부재 | **High (확정)** | ls memory/shared/ 100% 단정. PD-020/PD-032/PD-033은 선언 상태로만 존재. |
| Memory (b) role memory 04-23 이후 편향 | **Medium** | git log mtimes 명확하나, "편향=원인"은 추론. 단, ace/dev/editor만 갱신되는 상태에서 arki/fin/riki/nova의 페르소나 누적이 정체된다는 것은 구조적 사실. |
| Session resume (a) D-065 사후 패치 | **High** | session_089 사고 → D-064/D-065 명시. Step 0b 교차검증 의무화는 사고 후 박제. |
| Measurement (a) invocationMode 필드 부재 | **High (확정)** | session_index.json grep 11회 모두 session_090 1세션 한정. |
| Measurement (b) F-태깅 도입 시점 | **High** | evidence_index.json line 158 명시 "F-태깅 프로토콜 도입 (session_090, D-066)". |

**Evidence Insufficient**:
- "Master가 체감한 good-state가 정확히 어느 세션이었는가" — Master 본인 진술 없이는 단정 불가. session_031 (MF-024) 1건뿐인 명시 긍정을 anchor로 삼을 수 있으나, 그 시점도 invocationMode 측정이 없어 발언 주체 검증 불가.
- "session_018 D-019 직후 ~ session_068 D-058 직전" 50세션 구간의 실제 발언 매체 — schema 측정 부재로 영구 미상.

---

## 6. What Not To Patch Yet

진단을 망치는 항목 — **현 상태를 변경하면 break-point 추적 불가능해짐**:

1. **`.claude/agents/role-*.md` 4개 수정 금지** — c9e6604의 F-013 박제 직후 상태가 현재 baseline. 추가 수정 시 "처방 효과"와 "원래 상태"를 분리할 수 없게 됨.
2. **`agents/` legacy 7개 삭제·rename·이동 금지** — 현 git status M 4개가 진단 단서. 정리하면 이중 source 흔적 사라짐.
3. **`.claude/hooks/session-end-finalize.js` 수정 금지** — c9e6604에서 +44 line 변경된 직후. 추가 변경은 session_090 → 091 hook 효과 추적을 망침.
4. **`memory/shared/dispatch_config.json` 수정 금지** — schema 변경 시 D-058 잠복 22세션 비교 base 손실.
5. **`memory/shared/scratchpad/` 신규 생성 금지** — "처음부터 부재"라는 단정 자체가 진단 base. 디렉토리 만들면 비교 불가능.
6. **`memory/roles/*.json` 일괄 갱신 금지** — 04-23 이후 편향 (dev/editor만 매일)이 단서. 강제 갱신 시 편향 흔적 소실.
7. **session_index.json 백필 금지** — invocationMode가 session_090 1세션만 있는 것이 핵심 evidence. 과거 세션에 추정값을 넣으면 측정 부재 사실 자체가 사라짐.
8. **현 토픽 (topic_096)의 Child-0/1/2 spec rev1 폐기 권고 (Ace synthesis rev1)** — Master 이미 STOP 박제. 진단 종료 전 어떤 spec도 implement 금지.
9. **PD-020 / PD-032 / PD-033 신규 작업 금지** — scratchpad PD가 "선언 상태로만 존재"라는 사실이 단서. 지금 구현하면 진단 데이터 변형.
10. **CLAUDE.md "Ace Orchestration Protocol" 섹션 수정 금지** — D-019 본문이 호출 매체 미명문이라는 사실이 후보 #1의 근거. 본문 변경 시 후보 사라짐.

---

## 7. One Next Diagnostic Step

**다음 진단 1스텝 (구현 아님, 측정만)**:

> **Master 본인에게 "good-state로 체감한 구체 세션 번호 또는 토픽 슬러그 1개"를 직접 질문 + 그 시점의 reports/{date}_{slug}/ 디렉토리에서 ace 발언 1건을 골라 'Task tool 호출 흔적'을 grep**.
>
> 구체:
> 1. Master 응답 받은 세션 (예: session_031 또는 다른 번호) → reports/{...}/ace_rev*.md 정독
> 2. 동시에 `memory/sessions/session_index.json`의 해당 sessionId 객체에서 `turns` 배열 존재 여부·`invocationMode` 필드 존재 여부 확인
> 3. 만약 turns가 없거나 invocationMode가 없으면 → **그 시점도 측정 부재 구간**으로 단정 → "Good-State는 체감일 뿐 객관 측정 부재" 확정 → topic_096 spec 방향이 "복원"이 아니라 "최초 측정 baseline 신설"로 결정
> 4. 만약 turns에 subagent 1건이라도 박제되어 있으면 → "Good-State에 subagent 호출 실재" 확정 → break-point는 그 세션 이후 어느 시점 → bisect 후속 진단

**이 1스텝의 의의**: rev3가 "처음부터 미작동·체감"으로 단정한 부분을 Master 진술 + 객관 흔적 동시 검증으로 확정 또는 반증한다. spec 작성 방향(복원 vs 신규)을 결정하는 단일 분기점.

**금지**: 이 스텝은 측정·확인만. 어떤 patch·구현·새 PD도 동반하지 않는다.

---

**End of forensic report.**
