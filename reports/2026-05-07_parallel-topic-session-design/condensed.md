---
session: session_208
topic: topic_176
topicSlug: parallel-topic-session-design
grade: S
condensedBy: zero
condensedAt: 2026-05-08
verbatimPreserved: true
prsv: Y
sources:
  - reports/2026-05-07_topic_176_arki/arki_rev3.md (turn 0)
  - reports/2026-05-07_topic_176_jobs/jobs_rev1.md (turn 1)
  - reports/2026-05-07_topic_176_riki/riki_rev1.md (turn 2)
  - reports/2026-05-07_topic_176_ace/ace_rev1.md (turn 3)
  - reports/2026-05-07_topic_176_arki/arki_rev4.md (turn 4)
  - memory/sessions/current_session.json masterDecisions[]
---

# session_208 / topic_176 — 병렬 토픽 및 세션 구조 설계 (Case B 한정)

토픽 운영 유형 분기(structured/discussion) + 토론형 5단계 메커니즘 + Case B "사고 병렬 + 발언·기록 순차" frame 박제.

---

## 0. 결론 한 줄 (Arki rev4)

rev3 §0 결론(G안 인프라 부분 폐기 + Nexus 직접 push frame) 유지. rev4는 통합 박제만 추가 — Riki 🔴 5건 + Ace 4 충돌 단일 권고 + Arki rev3 자가 MUST_NOW 6건 = 통합 11건 + PD-066 신설 + Phase 진입 게이트 코드 위치 명시 + 모든 hook turnPushMode 분기 read 의무 명문화. **spc_lck = Y**.

---

## 1. Master 결정 verbatim (절대 보존, 6건)

### M1 — frame 본질 (D-170-A1 선결조건)
> "맞아. 시간은 동시 토픽으로 해결할꺼야. 본질은 편향이야."

context: Ace synthesis M1 권고에 대한 Master 답변. Jobs rev1 frame 본질 검증 통과.

### M2 — D-170 amendment 5번째 축 (D-170-A1)
> "1-3동의하고 각자 발언하고 나서는 서로 내용을 보면서 토론을 해야지. b는 OK / c는 default = prompt prepend 차단만"

context: Nexus M2 풀이 후 Master 정정: (a) 영구 차단 아닌 phase 한정. blind 후 open/debate 진입 시 일괄 공개 → 토론. (b)(c) Nexus 권고 그대로.

### M2 sub-axis (d) — 수렴 토론 phase 정밀화 (D-170-A1 sub-axis (d))
> "공개하고 나서 한번만 이야기하는게 아니라 서로 의견이 좁혀질때까지 이야기를 주고 받는거야. 토론형태가 끝나는게 아니라. 발언권은 Nexus가 분배할꺼고. 나는 언제든 끼어들고 싶을때 끼어들테니. 너희끼리 의견을 맞춰보라는 거야."

context: Nexus 가정(공개 후 1회 반박)의 정정. Jobs 5단계 (4) 형식 명시. R-8(반박 형식 미박제) 일부 자동 해소.

### M2 sub-axis (d) Q1·Q2·Q3 통합 (D-170-A1 resolvedSubPolicies)
> "(a) 기준으로 하되, 의견이 좁혀지지 않는 것을 나에게 묻는 형태로. a와 c 혼합"

context: Q1·Q2·Q3 통합 답변. Nexus 자율 진행 + Master 선택지 제공형 escalation. 무한 루프 방지는 Nexus 인지·Master 질의로 보장. 박제 결과: round 상한 없음 / 발언자 분배 Nexus 자율 / 수렴 판정 = Nexus 자연어 + 어려움 시 Master 질의(continue/양립/종료).

### M5 — 토론형 (5)종합 (D-170-A2)
> "5단계는 Edi 단일 호출로 해보자. 에이스 종합결론으로 가면 양립된 의견도 하나로 합칠테니"

context: Master 통찰 — Ace 단일 권고 강제(D-130)가 토론형 양립 보존 frame과 충돌. Edi는 박제만 수행. Jobs OUT 4·5번 토론형 한정 정정.

### M3+M4 — Case B Phase 진입 게이트 (D-171)
> "M3 OK / M4 pd-066 resolved"

context: Ace synthesis 권고 일괄 채택. PD-066(Nexus crash recovery)은 fallback 아닌 resolved 강제 — 운영 무결성 우위. Arki rev4 spc_lck=Y + PD-066 resolved + D-170 amendment 3건 코드 박제 후 P0 진입. warn-only 아님.

---

## 2. 박제 결정 verbatim (4건)

### D-170 (framing)
**axis**: 토픽 운영 유형 enum 추가 — structured(default)/discussion. Grade와 직교, 별도 명령어로 세션 중 전환 가능. 명령어 명칭·격리 강도는 후속 결정.
**Master verbatim**: "OK. 진행해"
**context**: Nexus 권고 (Grade=유형 결합 거부, 별도 명령어+세션 중 전환, 정책 골격은 지금 박제) → Master 'OK. 진행해' override.

### D-170-A1 (framing)
M1 + M2 + M2 sub-axis (d) + Q1·Q2·Q3 통합 amendment. (a) blind 격리 phase 한정 / (b) phase>operationMode>grade / (c) 격리 강도 임시 default = prompt prepend 차단만 / (d) 수렴 토론 phase: N round 반복(상한 없음), Nexus 자율 분배, Master anytime interrupt, 종료 = Nexus 자연어 판정 또는 Master 질의(continue/양립/종료).

### D-170-A2 (design)
토론형 (5)종합 = Edi 단일 호출. Ace synthesis 토론형에서 호출 X (양립 의견 보존, frame 본질 정합). `/ace-synthesis` 명시 호출은 structured 모드 한정.

### D-171 (design)
Case B Phase 진입 게이트 강제. Arki rev4 spc_lck=Y + PD-066 resolved + D-170 amendment 3건 코드 박제 후 P0 진입. warn-only 아님.

---

## 3. Arki rev3 — Case B 메커니즘 명세 (turn 0)

### 3.1 결론
G안 인프라 (D-166 append-only JSONL + D-167 mtopic_NNN namespace 일부 + D-168 plan 단순화) 부분 폐기 가능 — 단, post-tool-use-task.js의 turns push 자동 트리거 차단 + Nexus 직접 박제 채널 신설이 전제. 인프라 자체는 일부 자산(turn_log.jsonl·gap·archive)으로 재활용. Case A(PD-065)는 별도 trajectory.

### 3.2 hook 6 책임 (post-tool-use-task.js)
| # | 책임 | race window |
|---|---|---|
| ① role 식별 (마커→subagent_type→desc) | 없음 |
| ② self-scores 자동 추출 | 없음 |
| ③ current_session.json.turns[] read-modify-write | **race 본질** |
| ④ reportsPath 추출 + frontmatter turnId 패치 | reports/*.md write |
| ⑤ topics/{topicId}/turn_log.jsonl append | jsonl append |
| ⑥ reports 부재 시 gap 박제 | 보조 write |

핵심: ③ race 본질. 같은 세션 병렬 dispatch → 각 PostToolUse hook fork → 동일 current_session.json 비동기 read-modify-write → write lost.

### 3.3 새 경로
- `current_session.json.turnPushMode` enum {hook(default), nexus(병렬)}
- 병렬 dispatch 시: hook은 ③ skip, ②④⑤⑥은 잔류·이전 매핑(self-scores hook 잔류, ④⑤는 Nexus 이전, ⑥ 잔류)
- Nexus가 결과 회수 후 단일 thread 내 순차 push → race 0
- self-scores 임시 저장: 옵션 A(`pending_turns_{sessionId}.jsonl` agentId join, D2 정합) vs 옵션 B(Nexus 직접 파싱, 1-step)

### 3.4 5단계 흐름 충족도
| 단계 | 메커니즘 | 잔존 risk |
|---|---|---|
| (1) 프레이밍 | 기존 그대로 | 없음 |
| (2) blind 동시 제출 | pre-tool-use-task.js prepend 차단 분기 (phase=blind-parallel) | **MUST_NOW**: 코드 박제 (D4) |
| (3) 공개 | 결과 회수 후 turn push 일괄 → prepend 재개 | 없음 |
| (4) 반박·토론 | 사고 병렬 + 발언 순차, 직전 단계 발언 prepend | context 폭증 |
| (5) 종합 | Ace `/ace-synthesis` 또는 Edi 단일 (M5에서 Edi 단일 확정) | 없음 |

### 3.5 자산 폐기/유지 판정
- D-166 turns_append jsonl: 부분 폐기 (turns_append 자체 폐기, jsonl 패턴은 pending_turns/turn_log에 재활용)
- finalize merge / archive 이동: 폐기
- D-167 mtopic_NNN: 변경 없음 (Case A 직교)
- D-168 lock 폐기: 유지 (Nexus 단일 thread = lock 없이 race 0)
- session_207 P1 spike: 재활용

### 3.6 구조적 risk (R-N-01~06)
- R-N-01 hook 보호 상실 (Nexus crash → turn 손실) → mitigation: pending_turns 잔존 + finalize join + PD-066
- R-N-02 agentId 동기 가정 → P1 spike 검증
- R-N-03 Nexus 순서 결정 → agentId 사전 정렬
- R-N-04 좌절 원복 → turnPushMode=hook 가역
- R-N-05 fs append atomicity → spike 재측정
- R-N-06 LLM 자율 우회 → hook early return 코드 박제

### 3.7 자가감사
1차 4축 MUST_NOW 1건 + 2차 D1~D4 MUST_NOW 5건 = **총 6건. spc_lck=N → rev4에서 통합 의무**.

---

## 4. Jobs rev1 — framing (turn 1)

### 4.1 Why·What
- **Why**: 자유 주제일수록 anchoring 편향 강해짐 — Master는 이 편향을 깰 도구가 필요.
- **What**: "토픽 유형 2종(structured/discussion) 정책 + 토론형 5단계 운영 메커니즘 박제."
- 본질=편향, 시간=부수.

### 4.2 결정축 4
(1) 유형 판정 주체 — Master 명시 vs Nexus 자동 / (2) phase 전환 — 토픽 내 전환 vs 별도 토픽 / (3) 격리 강도 — prepend 차단만 vs role memory·dashboard / (4) 발동 명령 — 신규 슬래시 vs 토픽 오픈 시 grade와 같이.

### 4.3 Scope
**IN**: 유형 2종 / 토론형 5단계 / Case B 메커니즘 / 격리 강도 / 발동 명령
**OUT (8건)**: Case A(PD-065) / structured 변경 / role memory 격리 / `/ace-synthesis` 변경 / (5)종합 형식 정밀 / (4)반박 형식 정밀 / PD-066 / 시간 측정 실증

### 4.4 인지편향 적출 5건
1. 🔴 anchoring (G안 살리려는 동기) → 부분 검출, 결론 변경 없음
2. 🟡 sunk cost → 합리적 부분 재활용
3. 🟡 confirmation bias → 반대 frame 약함, 결론 유지
4. 🔴 framing effect (이분 frame) → spectrum은 진화 여지
5. 🟡 availability (race 사고) → race 해소는 부수 이득. **MUST_NOW**: race vs anchoring 분리 명시

### 4.5 핵심 전제 5
🔴 Master frame "편향=본질" 옳다 / 🔴 agentId 동기 가정 / fs.appendFile atomicity / blind 답변 품질 충분 / D4 부분 잔존 risk 수용

### 4.6 Focus
- 본질: blind 동시 제출이 anchoring 깨는 답
- saying no: structured 안 건드림, Case A 별도
- 단일 액션: enum 1개 + 토론형 5단계 + Case B 메커니즘
- executionPlanMode: **plan**. Grade S 정합

---

## 5. Riki rev1 — 적대적 감사 (turn 2)

### 5.1 결론
부분 수정 필요 — frame 견고, R-1·R-2·R-3·R-7·R-8 (🔴 5건) rev4 통합 또는 D-170 amendment 박제 후 Phase 진입. 미박제 시 frame 가치 깨짐 + dead artifact 잔존 risk.

### 5.2 D-170 결함
- **🔴 R-1** "가역" 절반만 — blind 박제 후 structured 복귀 시 turn 사후 처리 미명시. **MUST_NOW**: blind turn은 phase=blind-isolated 영구 차단 또는 phase 단위 전환만
- **🔴 R-2** "Grade와 직교" 미검증 — phase·grade·operationMode 3축 우선순위 매트릭스 미박제
- **🟡 R-4** 후속 결정 forgetting — default 미명시. **MUST_NOW**: 임시 default=A극

### 5.3 Arki rev3 분쇄
- **🔴 R-3** agentId 동기 실패 시 옵션 A 단일점 + prompt unique marker fallback이 D1 vector(prompt injection 면적). **MUST_NOW**: GATE α 100% + 옵션 B 사전 spike 병행 + marker fallback 제거
- **🟡 R-5** A vs B 비교 D2 정합만 근거, 견고성 차원 누락. truncation risk 과장. **MUST_NOW**: 옵션 B 동시 검증
- **🟡 R-6** PD-066 분리 회피 — Nexus crash + 다음 세션 안 열림/sessionId mismatch → 영구 손실. **MUST_NOW**: Phase 진입 게이트에 PD-066 resolved 또는 turnPushMode=hook fallback 강제

### 5.4 Jobs 분쇄
- **🔴 R-7** blind 답변 품질 — 자유 주제는 영역 정의 사전 모호 → blind 작동해도 anchoring 해소 0. **MUST_NOW**: 역할별 영역 1줄 prompt 박제
- **🔴 R-8** (4)반박 형식 미박제는 frame 가치 좌우. **MUST_NOW**: 최소 1줄 박제(병렬 dispatch + (3)단계 발언 prepend, 자기 발언 제외)
- 🟡 R-9 "편향 vs 시간" 정정 가능성 — 비용 0 보험으로 Master 1줄 재확인

### 5.5 통합 risk
- 🔴 (R-1·R-2·R-3 연쇄) Dead artifact accumulation — 좌절→폐기→코드 잔존→LLM 자율 재활용(D4 위반 면). **MUST_NOW**: Phase 진입 전 5건 통합 박제
- 🟡 R-10 PD-065 다중 인스턴스 충돌 — 의도적 제외

### 5.6 Master 결정 3
1) D-170 amendment 의무화 (R-1·R-2·R-4) / 2) Arki rev4에 R-3·R-7·R-8 추가 / 3) PD-066 진입 게이트

---

## 6. Ace rev1 — 종합검토 (turn 3)

### 6.1 4 충돌
| # | 충돌 | 판정 |
|---|---|---|
| 1 | Jobs Focus vs Riki R-7·R-8 | **Riki**. (4)반박 1줄·blind 영역 1줄 IN. saying no 5·6 IN, 7·8 OUT 유지 |
| 2 | Arki 옵션 A vs Riki 옵션 B | **Riki**. P1 A·B 동시, marker 폐기 |
| 3 | Arki MUST_NOW 6 vs Riki 의도적 제외 | **Riki**. 단 운영 게이트 별도 — Phase 진입 = rev4 spc_lck=Y + 통합 5건 박제 |
| 4 | D-170 "가역" vs R-1 | **Riki**. D-170 5번째 축 amendment + 진입 게이트 |

### 6.2 Porter + Keynes
- **Porter** 단일 최적해: A·B 동시 spike + marker 폐기 / D-170 5번째 축 / (4)반박·blind 1줄 IN(정밀화 OUT) / 진입 게이트 강제 코드 박제
- **Keynes**: Master frame 본질 1줄 재확인 / Nexus crash → PD-066 강제 / D4 잔존 → finalize join 모니터
- **지속 가능성**: **Conditional** — M1~M5 + rev4 spc_lck=Y + 진입 게이트 코드 박제 3건 충족 시 지속.

### 6.3 누락 축 박제
- race 해소 vs anchoring 해소 분리 (frame 본질 = anchoring, race는 부수)
- Master 1줄 질의 R-9

### 6.4 Master 결정 통합 5건
| # | 항목 | 권고 |
|---|---|---|
| M1 | frame 본질 재확인 | "편향=본질, 시간=보조" 정합? |
| M2 | D-170 amendment | 5번째 축: (a) blind turn=phase=blind-isolated 영구 차단, (b) 3축 우선순위, (c) 격리 강도 default=A극 |
| M3 | Arki rev4 통합 | (i) 옵션 A·B 동시+marker 폐기 / (ii) (4)반박 1줄 / (iii) blind 영역 prompt / (iv) Arki 자가 6건 / spc_lck=Y |
| M4 | 진입 게이트 코드 박제 | M2·M3 + PD-066 resolved 또는 turnPushMode=hook fallback. warn-only 아님 |
| M5 | (4)반박·blind IN | saying no 5·6 IN, 7·8 OUT 유지 |

### 6.5 executionPlanMode
plan 유지 + Arki rev4 재호출 의무.

---

## 7. Arki rev4 — 통합 plan, spc_lck=Y (turn 4)

### 7.1 자산 매트릭스 (단일 절 통합)
| # | 자산 | SOT | 책임자 | 분기 동작 |
|---|---|---|---|---|
| A1 | turns[] | current_session.json | Nexus(nexus)/hook(legacy) | mode 분기 |
| A2 | pending_turns | memory/sessions/pending_turns_{sid}.jsonl | hook append | nexus 전용, D1 sentinel |
| A3 | turn_log | topics/{tid}/turn_log.jsonl | nexus=Nexus / hook=⑤ | mode 분기 |
| A4 | reports/{role}_rev*.md | reports/ | 서브에이전트 | mode 분기 |
| A5 | gaps | current_session.gaps[] | hook ⑥ | mode 무관 |
| A6 | turns_append jsonl | — | — | **폐기** |
| A7 | finalize merge | — | — | **폐기** |
| A8 | archive 이동 | — | — | **폐기** |
| A9 | turnPushMode | current_session.turnPushMode | Nexus | SOT 단일 |
| A10 | parallel_turn_sort_key | dispatch_config.json | Edi | nexus 정렬 |
| A11 | phase enum | dispatch_config.json.phase_enum | Edi | prepend 분기 키 |

### 7.2 D-170-A1 5번째 축 코드 박제
| sub-axis | 코드 위치 |
|---|---|
| (a) blind 격리 phase 한정 | pre-tool-use-task.js — phase=blind-parallel 분기 prepend 차단 (early return) |
| (b) priority phase>operationMode>grade | dispatch_config.json.priority_axis_order: ["phase","operationMode","grade"] |
| (c) 격리 강도 default | dispatch_config.json.isolation_strength_default: "prompt_prepend_only" |
| (d) 수렴 토론 phase | dispatch_config.json.debate_round.{nexus_arbitrator: true, master_interrupt: "anytime", round_max: null, end_policy: "nexus_judge_then_master_query"} |

(4)반박 잔여: phase enum (P9) / Nexus 분배 인터페이스 (skill) / `current_session.debate_state: {round_idx, last_progress_ts, divergence_signal}`.

### 7.3 D-170-A2 박제
`dispatch_config.json.discussion_mode.synthesis_role: "edi"`, `ace_synthesis_allowed_modes: ["structured"]`.

### 7.4 P1 spike — 옵션 A·B 동시 검증
- 옵션 A: hook이 pending_turns append → Nexus가 agentId join. 측정: agentId 매칭률
- 옵션 B: Nexus가 message stream에서 self-scores YAML 직접 파싱. 측정: truncation 발생률
- **GATE α 통과**: A 100% 일치(N=10) **OR** B 0% truncation(N=10). 둘 중 하나만. 둘 다 fail → frame 폐기
- marker fallback 폐기 (D1 vector)
- 판정=Master / 박제=Edi
- 산출: spike_p1_option_ab_compare.json

### 7.5 blind 영역 prompt 명시
- (1)framing에서 Jobs/Nexus가 역할별 영역 1줄 prompt 박제 의무
- 1차 위치: pre-tool-use-task.js — phase=framing 진입 시 `role_domain_map` 강제. 미박제 시 warn + gaps
- 2차 위치(SOT): dispatch_config.json.role_domain_template
- warn-only 아님. 미박제 시 진입 게이트 차단

### 7.6 거버넌스·메타 안전
- **D-169 supersede**: D-166 부분(turns_append + finalize merge + archive). related: D-167(Case A 직교 PD-065 위임), D-168(lock 폐기 정합)
- **GATE α/β**: 판정=Master / 박제=Edi
- **D1 sentinel**: pending_turns line `__hook_origin: "post-tool-use-task"` 박제. Nexus join + finalize join 검증. 누락/위변조 line skip + gap
- **D4 finalize join 게이트**: session-end-finalize.js가 pending_turns→turns[] cross-match → unmatched line append + `gaps[]: {kind: "nexus_push_missing"}` + archive
- **모든 hook mode 분기 read 의무**: `scripts/lib/turn-push-mode.ts` 신설, `readTurnPushMode(sessionId)` 단일 함수

### 7.7 PD-066 신설
```
id: PD-066
title: Nexus crash 시 pending_turns 영구 손실 방지 복구 plan
context: turnPushMode=nexus 모드 Nexus crash 시 pending_turns 잔존 → 다음 세션 finalize join 가정.
         단 (a) 다음 세션 안 열림(휴지기), (b) 다른 토픽 → sessionId mismatch skip → 영구 손실
resolveCondition: 세션 시작 pending_turns scan + 주기 cron orphan scan + sessionId mismatch
                  orphan 폴더 이동 + Master 알림 채널 박제
fallback: turnPushMode=hook 강제 (legacy)
status: open
```

### 7.8 Phase 진입 게이트 코드 위치
| 게이트 | 위치 | 동작 |
|---|---|---|
| **G-PRE** | `scripts/validate-phase-gate.ts` (신설) | 3건 검증: (1) rev4 spc_lck=Y, (2) D-170-A1·A2 코드 박제 완료, (3) PD-066 resolved OR turnPushMode=hook 강제. fail → exit 1 |
| **G-IN-FLIGHT** | pre-tool-use-task.js 진입부 | nexus 모드 + PD-066 미해결 + fallback 미박제 시 차단 |
| **G-FINALIZE** | session-end-finalize.js join 단계 | pending_turns join + gap 박제 강제 |

호출: G-PRE = `/open` 자동 / G-IN-FLIGHT = Task dispatch / G-FINALIZE = `/close`.

### 7.9 Phase 재정리 (P-1 ~ P9)
| Phase | 작업 | 산출/게이트 |
|---|---|---|
| **P-1** | Master M1~M5 + Arki spc_lck=Y + D-169 + D-170-A1·A2 + PD-066 박제 | decision_ledger·pending_deferrals |
| **G-PRE** | validate-phase-gate.ts 통과 | fail → P0 차단 |
| **P0** | D-169 신설 (D-166 부분 supersede) | decision_ledger D-169 |
| **P1** | 옵션 A·B 동시 spike (N=10) | spike_p1_option_ab_compare.json |
| **GATE α** | 옵션 채택 | 둘 다 fail → frame 폐기 |
| **P2** | turnPushMode 플래그 + scripts/lib/turn-push-mode.ts | unit test |
| **P3** | post-tool-use ③ skip + ② → pending_turns + `__hook_origin` | unit test (양쪽) |
| **P4** | Nexus 직접 push (dispatching-parallel-agents skill) + sort_key | smoke (3 병렬) |
| **GATE β** | race 0 적대적 N=10 | Master/Edi |
| **P5** | finalize join 보강 (D4) | unit test (crash 시뮬) |
| **P6** | blind-parallel prepend 차단 + framing role_domain_map 검증 | code review |
| **P7** | dispatch_config: parallel_turn_sort_key + phase_enum + priority_axis_order + isolation_strength_default + debate_round + discussion_mode + path_policy.pending_turns_pattern | unit test |
| **P8** | dashboard: turnPushMode·pending_turns size·race 카운터·orphan scan | compute-dashboard.ts |
| **P9** | phase_enum + 발언자 분배 인터페이스 + debate_state schema | unit test |

병렬: P3 ∥ P4 / P5 ∥ P6 ∥ P9. P7은 P2 직후로 앞당김.

### 7.10 게이트·롤백·전제·중단
- 게이트: G-PRE / GATE α / GATE β / G-FINALIZE
- 롤백: 모든 phase 가역. turnPushMode=hook 강제 → 원복
- 전제: fs.appendFile atomicity / 옵션 A or B 중 하나 GATE α 통과 / PD-066 resolved or fallback / D1~D4 정합 / Case A 직교
- 중단: GATE α 둘 다 fail → frame 폐기 / GATE β race ≥1 → 재설계 / LLM 자율 우회 → 강도 보강·재고 / PD-066 미충족 → G-PRE 통과 불가

### 7.11 자가감사 spc_lck=Y
- 1차 4축 MUST_NOW 0건 (rev3 DEFER 모두 IN 전환)
- 2차 D1~D4 MUST_NOW 0건 (D3 3축 validator만 DEFER, 영향 0)
- rev3 잔존 6건 + Riki 🔴 5건 + Ace 4 충돌 모두 통합
- 자가감사 라운드 3회
- → **spc_lck = Y** ✅

### 7.12 Master 결정 잔존 0건
M1~M5 박제로 결정 완료. 다음: Edi가 rev4 spc_lck=Y + D-169 + PD-066 + dispatch_config 갱신 + validate-phase-gate.ts 신설 + scripts/lib/turn-push-mode.ts 신설 → G-PRE 통과 후 P0.

---

## 8. self-scores 합계
- arki turn 0: aud_rcl=1.0, str_fd=5, spc_lck=N, sa_rnd=2
- jobs turn 1: focus_sharp=5, bloat_idx=1, bias_cnt=5, no_cnt=5
- riki turn 2: crt_rcl=0.83, cr_val=Y, prd_rej=Y, fp_rt=0.0
- ace turn 3: rfrm_trg=Y, ctx_car=5, mst_fr=0, ang_nov=4
- arki turn 4: aud_rcl=1.0, str_fd=5, spc_lck=Y, sa_rnd=3

---

(condensed by zero — Master verbatim 6건 + 결정 verbatim 4건 절대 보존, prsv=Y, redundancyReduction≈0.55)
