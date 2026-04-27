---
role: editor
session: session_092
topic: topic_097
rev: 1
phase: compile
turnId: 4
invocationMode: subagent
---

# session_092 / topic_097 — A Agent review

## 1. 결정 (3건 신규 + 4건 deprecated + 2건 redefined)

### 신규 결정

- **D-071** (axis: Sonnet 메인 + Opus 서브에이전트 dispatcher 구조 폐기) — D-058 dispatcher-worker 분기 로직 폐기. falsification probe 4/4 fail로 22세션 fiction 확정. D-066/D-068/D-070 deprecated, D-067/D-069 inline 의미로 재정의. unwind 구현은 후속 토픽.
- **D-072** (axis: 측정 전 단정 금지 — 인프라 결정은 falsification probe 1회 통과 필수) — harness/dispatcher/agent registration 등 인프라 의존 결정은 채택 전 falsification probe 1회 실측 통과를 게이트 G1로 의무화. 파일 생성·문서 작성을 G1 통과로 인정 금지.
- **D-073** (axis: role-*.md 페르소나 정의 archive 이동, 제거 아님) — `.claude/agents/role-{ace,arki,fin,riki}.md` 4개 + 루트 `agents/{arki,fin,riki}.md` 3개를 `archive/agents/legacy-d058/`로 이동. 페르소나 텍스트는 미래 harness 등록 spike 통과 시 재활용 가능 자산.

### deprecated 4건

- **D-058** — opus-dispatcher 채택. D-071로 폐기. "deprecated by D-071, see session_092".
- **D-066** — Grade A 서브에이전트 강제. dispatcher 부재 시 강제 대상 자체 없음. deprecated.
- **D-068** — PostToolUse(Task) 자동 박제 + SessionEnd 양자 충족 검증 분리. "D-058 의존. PostToolUse 자동 박제는 silent fallback 위 invocationMode=subagent 거짓 박제만 생산." deprecated.
- **D-070** — session_090 immutable snapshot 박제 + appendOrUpdateSessionIndex 가드. "D-058 의존. session_090 immutable 보호도 격리 인프라 부재로 의미 상실." deprecated.

### redefined 2건

- **D-067** — frontmatter link 의무 + 양자 충족 baseline. 재정의: "agentsCompleted 4조건 필터 폐기. inline 모드 기준 단순 role 기록으로 환원. turnId·invocationMode 필드 의무는 Turn Push Protocol(D-048) 매핑용으로 계속 유효."
- **D-069** — agentsCompleted 의미 재정의. 재정의: "신규 세션의 agentsCompleted는 finalize hook이 (invocationMode=subagent AND subagentId 존재 AND 대응 reports 파일 존재 AND turnId 매칭) 4조건 필터 폐기. inline 모드 기준 단순 role 기록으로 환원. legacy:true 세션 처리는 그대로 유지."

---

## 2. Root cause 트리 (Arki 진단)

- **1차 (직접)**: "`.claude/agents/role-*.md` 4개 파일의 frontmatter가 Claude Code subagent 등록 규약을 충족하지 못함 — `name:` 필드 부재. 등록된 subagent 목록에서 부재." (Arki §B)
- **2차 (왜 1차가 발생)**: "D-058 채택 시점에 dispatcher-probe 3건 통과를 '구조 충족'으로 오역. probe 3건은 'Agent 툴이 model 파라미터를 받는다'만 입증. subagent_type 등록 규약·재현성·22세션 잠복 후 동작은 미검증." (Arki §B)
- **3차 (왜 22세션 미적발)**: "`invocationMode` 필드 자체가 session_090에서 처음 도입. 22세션 동안 'Main inline vs subagent' 측정 불가. Master 본인이 D-058 직후 즉시 의도 불일치 자각했지만 '재구현 = D-058 = 완료'로 ledger 박제. 이연과제(PD)가 stale로 누적." (Arki §B)
- **4차 (종합 잠복 메커니즘)**: "session_090에서 invocationMode 도입과 동시에 첫 측정에서 즉시 inline-main 3건 검출 — 22세션 잠복은 측정 부재가 유일한 잠복 메커니즘." (Arki §B)

---

## 3. 측정 결과

- **Probe 4/4 fail**: 본 세션 Main이 직접 수행한 falsification probe 4건 (`role-ace`/`role-arki`/`role-fin`/`role-riki`) 전부 fail — "Agent type not found". (Ace §1)
- **frontmatter `name:` 부재**: "role-arki.md: `model: opus` + `description:` — `name:` 필드 부재. role-ace.md 동일 패턴." 4개 파일 모두 확인. (Arki §A.2, Riki 보조측정 일치)
- **루트 agents/ leftover**: "루트 `agents/{arki,fin,riki}.md` 구버전 + 11개 worktree leftover 정리" 필요. 후속 토픽 #1 scope In 추가 권고. (Ace §6)

---

## 4. PD/토픽 변경

- **PD-032 resolved-fiction**: "PD-032 페르소나 분리는 격리 인프라가 작동할 때 의미. 현 상태(분기 fiction)에서 PD-032는 해결 대상 자체가 사라짐 → resolved-fiction 상태로 종결 권고." (Ace §6)
- **topic_097 closed**: 본 세션 종결. topicType: framing, 후속 implementation 토픽 분기.
- **topic_098 신규**: "후속 토픽 #1 (필수): 'D-058 unwind 구현'. type: implementation, parent: topic_097, Grade: A 또는 B 판단 보류 (구현 범위 폭에 따라). executionPlanMode: plan (Arki 실행계획 필수)." (Ace §5)

---

## 5. 후속

- **topic_098 D-058 unwind 구현 (대기)**: scope In — opus-dispatcher 스킬 deprecated 마킹, dispatch_config archive, post-tool-use-task.js 폐기, session-end-finalize 양자 충족 필터 제거, role-*.md 4개 archive 이동, 루트 agents/ leftover 정리, CLAUDE.md 정리, D-066~D-070 ledger 마킹. (Ace §5)
- 후속 토픽 #2 "harness subagent 등록 spike": "trigger — 향후 진짜 Opus 서브 호출 필요 시점에만 발동. 지금은 발동 금지." (Ace §5)

---

## 6. 학습

- **D-072 측정 전 단정 금지**: "D-058 채택 시점에 dispatcher-probe 3건 통과를 '구조 충족'으로 오역한 패턴 재발 방지. 파일 생성·문서 작성을 G1 통과로 인정 금지." (Ace §4)
- **F-005 일반화**: "역할 발언(inline 또는 향후 subagent) 직후 Ace의 군더더기 요약/전달 금지. Master가 직접 읽음. 호출 매체 무관 일반 원칙으로 환원." (Ace §3)
- **Riki 절차 교훈**: "Arki 자기 인정 'measurement 부재로 quality delta 단정 불가' 상태에서 제거 단정은 D-058 채택 시점과 동일한 측정 부재 결정. Riki의 '측정 먼저' 권고가 절차적으로 옳음 — 본 세션은 Main이 그 측정을 직접 수행하여 Riki 절차 요구를 충족시킴." (Ace §1)
