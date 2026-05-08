---
turnId: 0
invocationMode: subagent
session: session_208
topic: topic_176
role: arki
phase: case-b-judgment-rev3
date: 2026-05-07
---

# Arki rev3 — Master 새 frame "사고 병렬 + 발언·기록 순차" 구조 판정 (Case B 한정)

Arki입니다. session_208 / topic_176 / Grade S / Case B 한정. session_207 G안 인프라(D-166~D-168 + Arki rev2 plan P1~P5) 폐기 가능 여부를 새 frame 기준으로 판정합니다.

---

## 0. 결론 한 줄

**G안 인프라 (D-166 append-only JSONL + D-167 mtopic_NNN namespace 일부 + D-168 plan 단순화) 부분 폐기 가능 — 단, post-tool-use-task.js의 turns push 자동 트리거 차단 메커니즘 + Nexus 직접 박제 채널 신설이 전제. 인프라 자체는 여전히 일부 자산(turn_log.jsonl·gap·archive)으로 활용. Case A(PD-065)는 별도 trajectory.**

근거: §4.

---

## 1. 메커니즘 명세 (현 동작 + 새 경로)

### 1.1 현 hook 동작 정확 기술 (post-tool-use-task.js)

`.claude/settings.json` PostToolUse hook이 Task tool 종료 시 **child process로 fork**하여 다음 6 책임 수행:

| # | 책임 | 위치 (post-tool-use-task.js) | 부수효과 |
|---|---|---|---|
| ① | role 식별 (prompt 마커 → subagent_type → desc 첫단어) | L82~108 (`extractRole`) | 없음 — 식별만 |
| ② | self-scores 자동 추출 (tool_response YAML 파싱) | L152~216 (`extractSelfScores`), L356 호출 | 없음 — 추출만 |
| ③ | `current_session.json.turns[]` push (read → modify → write) | L327·346·366~376 | **race window 본질** |
| ④ | reportsPath 추출 + frontmatter turnId 패치 | L222~284 (`extractReportsPath`·`patchFrontmatterTurnId`), L382~412 | reports/*.md 파일 write |
| ⑤ | `topics/{topicId}/turn_log.jsonl` append | L117~142 (`writeTurnLogEntry`), L414 | jsonl append |
| ⑥ | reports/{role}_rev*.md 부재 시 gap 기록 | L429~459 | current_session write (보조) |

**핵심**: ③이 race 본질이고, hook이 Claude Code 하네스에서 fork된 **별도 OS 프로세스**라는 사실이 race를 만든다. 같은 세션 내 Task 병렬 dispatch → 각각의 종료가 각각의 PostToolUse hook fork → 각 hook 프로세스가 동일 `current_session.json` 파일에 read-modify-write를 비동기적으로 실행 → write lost.

### 1.2 새 경로 (Master 새 frame 충실 구현)

> "사고만 병렬, 기록·발언은 순차" — Nexus가 Task 결과를 모두 받은 뒤 직접 turn push.

#### 1.2.1 분기 플래그 위치

`current_session.json.turnPushMode` 필드 신설. enum:
- `"hook"` (default, legacy 호환): post-tool-use-task.js가 ③ 수행
- `"nexus"` (신규, 병렬 dispatch 모드): hook은 ③ skip, Nexus가 직접 push

**플래그 SOT**: `current_session.json` 단일. `/open` 또는 `/parallel` 등 모드 진입 시 박제, 종료 시 해제.

#### 1.2.2 Nexus 직접 push 흐름

병렬 dispatch 모드 시:
1. Nexus가 N개 Task 동시 dispatch
2. 각 Task 종료 시 PostToolUse hook 발동 → `turnPushMode === "nexus"` 감지 → ③ skip, ②④⑤⑥은 정상 수행
3. Nexus는 각 Task 결과(tool_response)를 회수 (Claude Code 본체는 Task tool 호출의 return value를 자체 message stream으로 받음 — 이는 hook과 독립 채널)
4. Nexus가 결과 도착 순(또는 정렬 키 — role 우선순위 / agentId / 결과 도착 timestamp)으로 **단일 thread 내 순차** turn push
5. push 1건 = `current_session.json` read → turns.push → write 완료 후 다음 결과 처리

이 흐름에서 ③의 read-modify-write는 **Nexus 단일 이벤트 루프 내**에서만 일어남 → race 0.

#### 1.2.3 hook 책임 5종(②④⑤⑥)의 이전·잔류 매핑

| 책임 | hook(`turnPushMode = "nexus"` 시) | Nexus | 이유 |
|---|---|---|---|
| ② self-scores 추출 | **잔류** (hook이 추출 → 임시 저장소에 박제) | 결과 회수 시 join | hook은 tool_response 원시 객체에 직접 접근 가능, Nexus는 message stream 텍스트만 봄. 추출 로직 hook 잔류가 자연스럽고 D2 정합 (코드 박제 유지) |
| ④ frontmatter turnId 패치 | **이전 (Nexus)** | turn push 시점에 Nexus가 reportsPath 알면 패치 호출 | turnIdx 결정권자 = Nexus. hook은 이제 turnIdx 모름 (Nexus가 push 전엔 결정 안 됨) |
| ⑤ turn_log.jsonl append | **이전 (Nexus)** | turn push 직후 append | turnIdx 의존 — ④와 동일 사유. **단 D-166 append-only JSONL 자산 그대로 활용** (race 없는 jsonl, race 있던 건 turns[] 였음) |
| ⑥ missing-report gap | **잔류** (hook이 reports/ 폴더 검사) | — | turnIdx 무관, hook이 가능 |

#### 1.2.4 ② self-scores 임시 저장소

hook이 ②를 잔류시키되 Nexus push 전이면 turnIdx 미정. 두 옵션:
- **옵션 A**: hook이 `memory/sessions/pending_turns_{sessionId}.jsonl`에 한 줄 append (turnIdx 없이 agentId·role·selfScores·reportsPath·ts 기록). Nexus가 push 시 읽어서 join.
- **옵션 B**: Nexus가 message stream에서 self-scores YAML 직접 파싱 (extractSelfScores 로직 nexus.ts에 포팅).

**Arki 권고: 옵션 A**. 이유: (1) self-scores 파싱 로직 단일 출처(hook) 유지 — D2 정합 강화. (2) message stream 텍스트는 truncation 가능성 있음 — tool_response 원시 객체가 더 신뢰. (3) pending_turns_*.jsonl은 D-166 append-only 자산 재활용 — hook 별도 프로세스 N개 동시 append라도 jsonl atomic 가정(P1 spike 검증) 하에 안전.

---

## 2. 이 frame이 Master 토론형 토픽 흐름을 충족하는가

Master 5단계 흐름 충족도 점검:

| 단계 | 충족 메커니즘 | 잔존 risk |
|---|---|---|
| (1) 프레이밍 | 기존 Jobs/Nexus 흐름 그대로. 변경 0. | 없음 |
| (2) 동시 의견 제출 (서로 못 봄) | **dispatch 시점에 Nexus가 prompt에서 다른 agent 발언 컨텍스트를 의도적 제외**. 이는 코드 박제 필요 — `pre-tool-use-task.js`(또는 신규 hook)가 `turnPushMode === "nexus"` + `phase === "blind-parallel"` 시 prompt prepend 로직 차단 (현 v3 hook은 이전 발언 본문 자동 prepend) | **MUST_NOW**: prompt prepend 차단 분기. 미반영 시 D4 위반 (모델 자율 판단 의존) |
| (3) 공개 (반박 단계 진입) | Nexus가 모든 결과 회수 후 turn push 일괄 → 다음 turn에서 prompt에 전체 발언 본문 prepend 재개 | 없음 (기존 v3 hook 동작 그대로) |
| (4) 반박·토론 | 2회차 dispatch (병렬 또는 순차). 본 frame은 사고 병렬 OK 발언 순차 → **이 단계도 병렬 가능, 단 직전 단계 발언 전체 prepend** | 발언 prepend 폭증 (N agent × 2회차 발언 누적) — context 비용 risk. |
| (5) 종합정리 | Ace `/ace-synthesis` 또는 Edi 단일 호출 — 순차로 충분 | 없음 |

**판정**: 충족. 단 (2)→(4) 단계 prompt prepend 정책이 코드 박제 필요. 본 plan rev3는 (2) blind-parallel 박제만 우선 명시, (4) 반박 단계 prompt 형식은 별도 결정 위임.

---

## 3. G안 인프라 폐기 가능 범위

### 3.1 항목별 판정

| 자산 | 출처 | 폐기 / 부분 폐기 / 유지 | 사유 |
|---|---|---|---|
| **D-166 append-only JSONL** (`turns_append_{sessionId}.jsonl`) | session_207 P1 spike | **부분 폐기** | turns[] race 회피용 turns_append jsonl은 폐기 (Nexus 단일 thread push가 race 자체를 제거). 단 jsonl 자산 자체는 `pending_turns_{sessionId}.jsonl` (§1.2.4 옵션 A) 또는 `turn_log.jsonl`(L117 기존)에 그대로 재활용 — append-only 패턴 자체는 살아남음 |
| **finalize merge 단계** | session_207 P3 plan | **폐기** | turns_append jsonl read → merge → current_session.turns[] write 단계 자체 불필요. turns[]는 Nexus가 실시간 push로 정산 |
| **archive 이동** | session_207 P3 plan | **폐기** | turns_append jsonl이 사라지므로 archive 대상 없음. turn_log.jsonl는 별도 lifecycle (기존 운영 정책 유지) |
| **D-167 mtopic_NNN namespace** | session_207 PD-065 분리 | **변경 없음** | Case A 영역 — 본 frame과 직교. 다중 인스턴스 충돌은 동일하게 잔존, PD-065에서 별도 trajectory |
| **D-168 plan 단순화 (lock 인프라 폐기)** | session_207 결정 | **유지** | 본 frame과 정합. lock 미사용 입장 그대로. Nexus 단일 thread push는 lock 없이 race 0 |
| **session_207 Arki rev2 P1~P5** | session_207 plan | **부분 폐기** | P1 spike 산출(`spike_p1_appendfile_atomic_summary.md`) — **재활용**: pending_turns jsonl atomic 가정 검증에 그대로 쓰임. P2~P5(post-tool-use-task의 jsonl append 구현·finalize merge·archive) **폐기**. 새 P-아이템 §5 |
| **인계 P-1~P-8** (rev2 인계 사항) | rev2 §8 결정 항목 | **재정리** | §5에서 Case B-rev3 P-아이템으로 재발급 |

### 3.2 session_207 P1 spike 의미 평가

`reports/2026-05-07_topic_176_arki/spike_p1_appendfile_atomic_summary.md` (rev2 §5.2 P1 통과 산출)는 **본 frame에서도 의미 있음**: pending_turns jsonl·turn_log jsonl·gaps_append jsonl 등 **여전히 hook 별도 프로세스 N개가 append할 자산**이 존재하므로 atomic 가정 검증 가치는 그대로. spike 결과 박제값 그대로 재인용.

---

## 4. 새 경로의 구조적 risk

### 4.1 R-N-01: hook 보호 상실

현 hook은 Claude Code 본체와 독립 child process. Claude Code 본체(=Nexus)가 죽어도 hook이 turn 박제를 마무리할 가능성 있음. 새 경로에서 ③을 Nexus가 직접 처리 → **Nexus 죽으면 turn 손실**.

**mitigation**:
- Nexus push 직전 **pending_turns jsonl에 모든 정보 박제** (옵션 A) → Nexus 죽어도 jsonl 잔존 → 다음 세션 시작 시 finalize hook이 pending → turns[] 복구 단계 추가.
- finalize hook을 **상시 활성**으로 유지 (현 session-end-finalize.js는 이미 Nexus 죽음 후에도 fork 시점에 turns 머지 가능 — 단 close 단계 진입이 안 되면 안 발동).
- **PD-066 신설 의무**: Nexus crash recovery 보강 plan. 본 plan rev3는 jsonl 잔존만 박제, 실제 복구 로직은 PD-066 분리.

### 4.2 R-N-02: tool_response 파싱 채널 분기

self-scores·reportsPath 둘 다 hook이 잔류 추출 (옵션 A). 단 turnIdx는 Nexus가 부여 → 매칭 키 필요.

**매칭 키 후보**:
- agentId (Task tool이 발급하는 unique id) — Claude Code 내부에서 hook과 Nexus 양쪽이 같은 값을 본다고 가정. 검증 필요 → **MUST_BY_N=10**: agentId 동기 가정 spike (Task 1회 호출 시 hook의 input.tool_input.agentId vs Nexus message stream의 agent_id 일치 확인).
- 만약 불일치 시: prompt 내 unique marker 박제 (`[NEXUS_TURN_ID:{uuid}]`) 후 hook이 그것으로 join.

### 4.3 R-N-03: Nexus 순서 결정 정책 누락

병렬 dispatch에서 결과 도착 순서는 비결정. push 순서 정책 박제 의무:
- 옵션 1: 결과 도착 순 (실행 시간 순). 비결정성 박제됨 (재실행 시 turn 순서 다를 수 있음).
- 옵션 2: 정렬 키 = role priority (예: arki → fin → riki) 또는 agentId. 결정성 보장.

**Arki 권고: 옵션 2 (agentId 사전 정렬)**. 이유: 결정성 → debug·재현 가능성. session_index 전파 시 일관성. **MUST_NOW**: 정렬 키 SOT 박제 (`memory/shared/dispatch_config.json`에 `parallel_turn_sort_key` 필드).

### 4.4 R-N-04: Master 좌절 신호 시 원복 경로

본 frame 도입 후 문제 발생 시 `turnPushMode = "hook"`으로 즉시 복귀 → 기존 hook 책임 ③ 자동 재발동. 가역성 OK.

### 4.5 R-N-05: D2 정합 — fs append atomicity

pending_turns jsonl·turn_log jsonl 모두 hook의 `fs.appendFileSync`. session_207 P1 spike가 Windows + 0.5KB 라인에서 검증한 결과를 pending_turns에도 그대로 적용. 단 pending_turns line 평균 byte size는 self-scores 포함이라 turn_log 보다 약간 큼 → 1KB 마진 내인지 재측정 의무. **MUST_BY_N=10**.

### 4.6 R-N-06: 자연어 trigger·LLM 자율 호출 우회 (Arki full-system view)

Master/Nexus가 본 plan에 동의해도 Claude Code LLM이 "이번만 hook을 그대로 두자"식 자율 우회 가능. **D4 정합 위반**. mitigation:
- `turnPushMode === "nexus"` 시 hook ③ 코드 자체에 **early return** 박제 (LLM 우회 불가능).
- Nexus 측은 SDK 코드(아니라 prompt 지시) — 모델 자율 판단 잔존 영역. **본질적으로 D4 잔존 risk**. 코드 박제 100% 불가능.
- **MUST_NOW**: hook early return은 코드 박제. Nexus push 호출은 별도 hook(예: PreCompact 또는 신규 PreSessionEnd)이 "Nexus가 push했는가" 검증 게이트로 보강.

---

## 5. Phase 분해 (rev2 → rev3 재정리)

### 5.1 rev2 P-아이템 폐기 / 이전

| rev2 Phase | rev3 처리 |
|---|---|
| P1 (appendFile atomic spike) | **재활용** — pending_turns·turn_log atomic 검증으로 의미 전환 |
| GATE α' | 폐기 (turns_append 없음) |
| P2 (post-tool-use-task의 turns_append append) | **폐기 + 재정의**: ③ early return 분기 박제 + ② self-scores → pending_turns 박제 |
| P3 (session-end-finalize merge) | **폐기 + 재정의**: pending_turns → turns[] join 복구 (Nexus crash recovery 한정) |
| GATE β' (finalize 동시성) | 폐기 |
| P4 (current_session.turns[] 직접 write 폐기 박제) | **변경**: Nexus 직접 push가 정상 경로, hook ③은 분기 시 skip |
| P5 (운영 모니터) | 유지 |

### 5.2 rev3 Phase

| Phase | 입력 | 작업 | 산출 / 게이트 |
|---|---|---|---|
| **P0 — frame 결정 박제** | rev3 §0 결론 | Master 결정 → D-169 신설 (D-166/D-167/D-168 supersede 또는 caveat) | decision_ledger D-169 |
| **P1 — 사전 spike (agentId 동기 검증)** | §4.2 R-N-02 | hook input vs Nexus message stream agentId 일치 1회 dispatch 검증 | reports/.../spike_p1_agentid_sync.json |
| **GATE α — agentId 동기 가정 판정** | P1 결과 | 일치 → 옵션 A 진행 / 불일치 → prompt unique marker 우회 박제 | Master 판정 + Edi 박제 |
| **P2 — turnPushMode 플래그 박제** | §1.2.1 | current_session.json schema 추가 + `/open` 시 박제 + Nexus push 분기 박제 | unit test |
| **P3 — hook early return 분기** | §1.2.3 / §4.6 | post-tool-use-task.js ③ block: `if (sess.turnPushMode === "nexus") skipBlock③` + ② → pending_turns jsonl append 분기 | unit test (mode=hook / mode=nexus 양쪽) |
| **P4 — Nexus 직접 push 코드** | §1.2.2 | Nexus orchestration 코드 (또는 dispatching-parallel-agents skill 본문)에 push 흐름 박제 | smoke test (Task 3개 병렬 → turns[] 3건 정상) |
| **GATE β — race 0 검증** | P4 | 적대적 N=10 병렬 dispatch + 결과 turns[] 정합 검증 | 0 race 확인 |
| **P5 — pending_turns 복구 로직** | §4.1 R-N-01 | session-end-finalize.js에 pending_turns → turns[] join 단계 추가 (정상 push되지 않은 잔여 처리) | unit test (Nexus crash 시뮬레이션) |
| **P6 — blind-parallel prompt prepend 차단** | §2 (2)단계 mitigation | pre-tool-use-task.js에 `phase === "blind-parallel"` 분기 박제 | code review |
| **P7 — 정렬 키 SOT 박제** | §4.3 R-N-03 | dispatch_config.json `parallel_turn_sort_key` 필드 + Nexus 참조 | unit test |
| **P8 — 운영 모니터** | rev2 P5 동등 | dashboard에 turnPushMode·pending_turns size·race 카운터 | compute-dashboard.ts |

병렬 가능: P3 ∥ P4. P5 ∥ P6.

### 5.3 게이트·롤백·전제·중단

#### 검증 게이트
- **GATE α**: agentId 동기 (P1 결과 기반).
- **GATE β**: race 0 (P4 적대적 dispatch).

#### 롤백
모든 phase 가역. `turnPushMode = "hook"` 강제 박제 → 원복.

#### 전제
1. fs.appendFile atomicity (rev2 P1 spike + R-N-05 재측정으로 검증).
2. agentId가 hook input과 Nexus message stream에서 동일 발급 (P1 spike).
3. Nexus crash 시 pending_turns jsonl 잔존이 다음 세션 finalize에서 정합 복구.
4. D1~D4 정합 — hook ③ early return 코드 박제로 D4 부분 보강. Nexus push 자체는 모델 자율 영역 잔존 (R-N-06).
5. Case A (PD-065 mtopic_NNN namespace) 본 plan과 직교 — 변경 없음.

#### 중단 조건
- P1 GATE α agentId 불일치 + prompt unique marker 우회도 실패 → frame 폐기, G안 인프라 복귀.
- GATE β race 검출 ≥ 1건 → Nexus push 코드 박제 결함 → 재설계.
- R-N-06 LLM 자율 우회 발견 → frame 강도 보강 또는 frame 자체 재고.

---

## 6. 자가감사 (4축 1차 + 거버넌스/메타 2차)

### 6.1 1차 감사 (4축, 최소 3지점)

#### structuration
- (1) hook 6 책임 ①~⑥ 분류 (§1.1 표) — 매핑 명확. **OK**
- (2) `turnPushMode` 플래그 SOT = current_session.json 단일 (§1.2.1) — 명확. **OK**
- (3) pending_turns vs turn_log vs turns_append 자산 3종 분리 박제 — §1.2.4 / §3.1 / §5.2에 분산. 단일 절 통합 권고 → **MUST_NOW**: rev4 시 §3에 자산 매트릭스 통합

#### hardcoding
- (1) 정렬 키(§4.3 R-N-03 옵션 2 = agentId) — `dispatch_config.json` 박제 SOT. **OK** (P7 박제)
- (2) pending_turns 파일명 convention (`pending_turns_{sessionId}.jsonl`) — 정책 명문화 미흡 → **MUST_BY_N=10**: schema/path-policy.md 또는 dispatch_config 박제
- (3) blind-parallel prompt 차단 분기 키 (`phase === "blind-parallel"`) — magic string. enum 박제 권고 → **SHOULD**

#### efficiency
- (1) Nexus 단일 thread push N건 시 N회 read-modify-write — 병렬 N=10 기준 cost 미세 (json file < 100KB) **OK**
- (2) pending_turns 매 턴 hook이 append + Nexus push 시 read — 중복 work이지만 D2 정합 우선 **OK**
- (3) 운영 P8 모니터 추가만으로 dashboard 비용 증가 미세 **OK**

#### extensibility
- (1) Case A(PD-065) 진입 시 본 frame이 호환되는가 — pending_turns jsonl에 sessionId 필드 박제 의무 (다중 인스턴스에서도 격리 가능). 호환 가능. **OK**
- (2) 토론형 (4)단계 반박 prompt 정책 별도 결정 위임 — 본 plan은 형식 미박제 → **DEFER** (별도 토픽)
- (3) Nexus crash recovery 본 plan은 jsonl 잔존만, 실제 복구 로직은 PD-066 분리 → **DEFER (PD-066)**

**1차 발견 요약**: MUST_NOW 1건 (자산 매트릭스 통합), MUST_BY_N=10 1건 (path 정책), SHOULD 1건 (enum), DEFER 2건.

### 6.2 2차 감사 (Master "한번 더" 압박 — 거버넌스·메타 안전)

#### 거버넌스
- D-166/D-167/D-168 박제는 session_207. 본 frame 도입 시 supersede 관계 명시 의무 → **MUST_NOW**: D-169 신설 시 supersedes 필드에 D-166 부분, related D-167·D-168 명시
- GATE α/β 판정 주체 미명시 (rev2와 동일 결함) → **MUST_NOW**: §5.2 표 footnote에 "판정=Master · 박제=Edi" 명시

#### 메타 안전 (D1~D4) — Arki full-system view 적용
- **D1 (적대적 컨텍스트 전제)**: pending_turns jsonl line은 외부 박제 가능. hook origin sentinel 박제 권고 (rev2 §7.2 D1과 동일) → **MUST_NOW**: pending_turns line에 `__hook_origin: "post-tool-use-task"` 박제, Nexus join 시 검증
- **D2 (도구 설명 거짓)**: Nexus가 message stream에서 받은 agent_id를 신뢰. SDK 동작 검증은 P1 spike. **OK** (P1 박제 의무 반영됨)
- **D3 (저장소 오염 전제)**: turns[] 단일 SOT 단언 금지. pending_turns + turn_log + reports/ frontmatter 3축 cross-check 박제 권고 → **MUST_BY_N=30**: finalize 단계에 3축 정합 validator (Arki full-system view 메모리 정합)
- **D4 (모델 자율 판단 무력화)**: Nexus push 자체가 모델 영역. 본질적 잔존 risk. mitigation: PreSessionEnd hook이 turns[] 정합 검증 게이트 발동 → **MUST_NOW**: Nexus가 push 누락한 pending_turns 발견 시 finalize 단계에서 자동 join + gap 박제. 모델 자율성에 의존 0

#### Arki full-system view (코드 한 축만 보고 단언 금지)
post-tool-use-task.js 외 다른 hook들이 같은 SOT를 만지는지 확인:
- `pre-tool-use-task.js`: turns 박제 안 함 (read만, prompt prepend 용도). 본 plan과 직교. **OK**
- `pre-tool-use-task-sage-gate.js`: turns 박제 안 함. **OK**
- `pre-tool-use-task-master-first.js`: turns 박제 안 함. **OK**
- `session-end-finalize.js`: turns 박제 함 (L57 Edi turn auto-push, L82 등 turns 머지). 본 frame에서 **변경 필요** — pending_turns 머지 단계 추가가 P5에서 처리됨. **OK** (P5 박제)
- `session-end-tokens.js`: turns 박제 안 함. **OK**

**자기 발언 cross-check**: 본 rev3는 `current_session.json.turnPushMode` 플래그로 분기를 단일 SOT 박제. 모든 hook이 같은 SOT 참조 의무 — 위반 시 D3 위반. P3 박제 시 모든 관련 hook에서 mode 분기 read 의무 명문화. **MUST_NOW**.

**2차 발견 요약**: MUST_NOW 5건 (D-169 supersede / GATE 주체 / D1 sentinel / D4 finalize join 게이트 / 모든 hook mode 분기 의무), MUST_BY_N=30 1건 (D3 3축 cross-check), 압박 가치 입증.

### 6.3 spec 동결
1차+2차 합산 MUST_NOW 6건 미반영(자산 매트릭스·D-169 supersede·GATE 주체·D1 sentinel·D4 finalize join·hook mode 분기). rev4에서 통합 후 동결 가능 → **spc_lck = N**.

### 6.4 자가감사 라운드
1차(4축) + 2차(거버넌스/메타) = **2회** (rev2와 동등). Master "한번 더" 시뮬레이션에서 5건 실질 결함 발견 — 압박 가치 입증.

---

## 7. Master 결정 필요 항목 (4건)

1. **본 frame(사고 병렬 + 발언·기록 순차) 채택 여부**? 채택 시 D-169 신설 (D-166 부분 supersede, D-167·D-168 정합 caveat).
2. **G안 인프라 부분 폐기 범위 승인**? §3.1 표 대로 turns_append jsonl + finalize merge 폐기 / pending_turns·turn_log·archive 정책 재정리.
3. **rev3 Phase P1 spike (agentId 동기 검증) 진입**? GATE α 통과 후 P2~P8 순차.
4. **PD-066 신설**? — Nexus crash recovery 보강 (pending_turns 복구 로직). 본 plan §4.1 R-N-01에서 분리.

박제 후 rev4에서 자가감사 MUST_NOW 6건 통합 + spc_lck=Y 진행.

---

[ROLE:arki]
# self-scores
aud_rcl: 1.0
str_fd: 5
spc_lck: N
sa_rnd: 2
