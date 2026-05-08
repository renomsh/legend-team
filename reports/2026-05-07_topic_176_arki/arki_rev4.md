---
turnId: 4
invocationMode: subagent
session: session_208
topic: topic_176
role: arki
phase: plan-rev4-integrated
date: 2026-05-07
---

# Arki rev4 — Case B 통합 plan (D-171 게이트 충족용 spc_lck=Y 목표)

Arki입니다. session_208 / topic_176 / Grade S / Case B. D-170·D-170-A1·D-170-A2·D-171 + Riki rev1 🔴 5건 + Ace rev1 4충돌 단일 권고 + Arki rev3 자가 MUST_NOW 6건 = **통합 11건 + PD-066 신설 + Phase 진입 게이트 코드 위치 명시**.

---

## 0. 결론 한 줄

**rev3 §0 결론(G안 인프라 부분 폐기 + Nexus 직접 push frame) 유지. 본 rev4는 통합 박제만 추가 — 11건 본문 흡수 + PD-066 의제 박제 + Phase 진입 게이트 코드 위치 (`scripts/validate-phase-gate.ts` 신설 + `session-end-finalize.js` join 보강) + 모든 hook turnPushMode 분기 read 의무 명문화. spc_lck=Y 목표.**

---

## 1. 자산 매트릭스 (M3-(iv) ① 통합 — 분산되어 있던 §1.2.4 / §3.1 / §5.2 단일 절 통합)

| # | 자산 | 파일/SOT | 책임자 | turnPushMode 분기 동작 | D 정합 |
|---|---|---|---|---|---|
| A1 | turns[] | `current_session.json.turns[]` | Nexus(직접 push) / hook(legacy) | nexus=Nexus push, hook=post-tool-use-task ③ | D3 SOT |
| A2 | pending_turns | `memory/sessions/pending_turns_{sessionId}.jsonl` | hook append | nexus=hook이 ② self-scores append, hook=미사용 | D1 sentinel(§5) |
| A3 | turn_log | `topics/{topicId}/turn_log.jsonl` | nexus=Nexus append (turnIdx 부여 후), hook=post-tool-use-task ⑤ | turnIdx 의존, mode 분기 | D3 보조 |
| A4 | reports/{role}_rev*.md | reports/ | 서브에이전트 write + frontmatter turnId 패치 | nexus=Nexus 패치, hook=post-tool-use-task ④ | — |
| A5 | gaps | `current_session.json.gaps[]` | hook ⑥ | mode 무관 (hook ⑥ 잔류) | D3 보조 |
| A6 | turns_append jsonl (D-166) | `turns_append_{sessionId}.jsonl` | — | **폐기** (rev3 §3.1) | D-166 부분 supersede 영역 |
| A7 | finalize merge (D-166) | `session-end-finalize.js` 머지 단계 | — | **폐기** | D-166 부분 supersede 영역 |
| A8 | archive 이동 (D-166) | session-end | — | **폐기** | D-166 부분 supersede 영역 |
| A9 | turnPushMode 플래그 | `current_session.json.turnPushMode` enum {hook, nexus} | Nexus(/open 또는 /parallel 시 박제) | SOT 단일 — 모든 hook 참조 | D3 SOT |
| A10 | parallel_turn_sort_key | `memory/shared/dispatch_config.json` | Edi 박제 | nexus 모드에서 Nexus 참조 | D3 SOT |
| A11 | phase enum | `dispatch_config.json.phase_enum` (P9 신설) | Edi 박제 | hook prepend 차단 분기 키 | D2/D3 |

---

## 2. D-170 amendment 정합 (rev3 §1.2 + D-170-A1·A2 통합)

### 2.1 D-170-A1 5번째 축 4 sub-axis 코드 박제 매핑

| sub-axis | 결정 | 코드 박제 위치 | 강도 |
|---|---|---|---|
| (a) blind 격리 phase 한정 | open/debate phase 진입 시 일괄 공개 | `pre-tool-use-task.js` — `phase === "blind-parallel"` 분기 prepend 차단, 그 외 phase 정상 prepend | warn-only 아님 (early return) |
| (b) 우선순위 phase > operationMode > grade | 충돌 시 phase가 최우선 | `pre-tool-use-task.js` 분기 입력 순서 + `dispatch_config.json.priority_axis_order: ["phase","operationMode","grade"]` | 코드 박제 |
| (c) 격리 강도 임시 default | prompt prepend 차단만 (Step 3 (3) A극) | `dispatch_config.json.isolation_strength_default: "prompt_prepend_only"` | default 박제 |
| (d) 수렴 토론 phase 정책 | N round, Nexus 자율 분배, Master anytime interrupt, 종료=Nexus 자연어+Master 질의(continue/양립/종료), round 상한 없음 | Nexus orchestration 코드 + `dispatch_config.json.debate_round.{nexus_arbitrator: true, master_interrupt: "anytime", round_max: null, end_policy: "nexus_judge_then_master_query"}` | 정책 박제 |

**M3-(ii) (4)반박 단계 형식 — D-170-A1 sub-axis (d)로 80% 해소. 잔여 20% 코드 매핑:**

| 잔여 항목 | 코드 위치 |
|---|---|
| phase enum 박제 (`framing`, `blind-parallel`, `open`, `debate`, `synthesis`) | `dispatch_config.json.phase_enum` (P9) |
| Nexus 발언자 분배 호출 인터페이스 | Nexus orchestration 코드 (별도 skill: `dispatching-parallel-agents` SKILL 본문) |
| round 카운터·진전 휴리스틱 박제 위치 | `current_session.json.debate_state: {round_idx, last_progress_ts, divergence_signal}` |

### 2.2 D-170-A2 토론형 (5)종합

- (5)종합정리 = **Edi 단일 호출**.
- Ace synthesis는 토론형에서 호출 X (양립 보존). `/ace-synthesis` 명시 호출은 구조형(structured) 모드 한정.
- 코드 박제: `dispatch_config.json.discussion_mode.synthesis_role: "edi"`, `ace_synthesis_allowed_modes: ["structured"]`.

---

## 3. P1 spike — 옵션 A·B 동시 검증 (M3-(i), R-3·R-5 통합)

### 3.1 동시 검증 의무 (Ace 충돌 2 단일 권고)

**marker fallback 폐기** (D1 vector — Riki R-3 prompt unique marker = prompt injection 면적). 선택지에서 영구 제거.

| 옵션 | 메커니즘 | 측정 지표 |
|---|---|---|
| A | hook이 `pending_turns_{sessionId}.jsonl` append → Nexus가 agentId join | agentId 매칭률 (hook input.tool_input vs Nexus message stream) |
| B | Nexus가 message stream에서 self-scores YAML 직접 파싱 | message stream truncation 발생률 (self-scores 100~200 byte 규모에서) |

### 3.2 GATE α 통과 기준 (rev3 §4.2 명시 박제)

- **옵션 A 100% 일치** (N=10 dispatch 중 10건 모두 hook input agentId == Nexus message stream agent_id) → 옵션 A 채택
- **OR 옵션 B truncation 0%** (N=10 dispatch 중 0건 truncation) → 옵션 B 채택
- 둘 중 하나만 선택 (혼합 금지 — 견고성·D2 정합 trade-off 단일 결정)
- **둘 다 fail 시 frame 폐기** (turnPushMode=hook legacy 영구 유지, D-170/171 supersede)
- **판정 주체 = Master · 박제 = Edi** (M3-(iv) ③)

### 3.3 spike 산출

`reports/2026-05-07_topic_176_arki/spike_p1_option_ab_compare.json` — N=10 결과 + GATE α 판정.

---

## 4. blind 영역 prompt 명시 (M3-(iii), R-7 통합)

### 4.1 박제 의무

(1)framing 단계에서 Jobs 또는 Nexus가 **역할별 영역 1줄 prompt 박제**. 자유 주제(토론형)에서도 영역 명시 강제.

**박제 예시** (참조용, 토픽별 Jobs/Nexus가 작성):
- `Arki: 구조·의존성·게이트`
- `Riki: 실패 모드·전제 분쇄`
- `Fin: 자원·재무·비용 안분`
- `Ace: 구조·흐름 종합 (단 토론형에서는 미호출 — D-170-A2)`

### 4.2 코드 박제 위치

- **1차 위치**: `pre-tool-use-task.js` — `phase === "framing"` 진입 시 framing 산출물에 `role_domain_map: {role: "1줄"}` 필드 강제. 미박제 시 warn 출력 + `current_session.gaps[]` 박제.
- **2차 위치(SOT)**: `dispatch_config.json.role_domain_template` — 역할별 default 영역 1줄 (Jobs/Nexus가 토픽별 override 가능).
- 강도: warn-only 아님. role_domain_map 미박제 시 Phase 진입 게이트가 차단(§7).

---

## 5. 거버넌스·메타 안전 통합 (M3-(iv) ②~⑥, rev3 §6.2 흡수)

### 5.1 D-169 supersede 명시 (Case B 한정) — M3-(iv) ②

- **D-169 (신설)**: turnPushMode 분기 + Nexus 직접 push frame 박제.
  - `supersedes`: D-166 **부분** (turns_append jsonl + finalize merge + archive 자산만 — pending_turns·turn_log·atomic 검증 산출은 보존).
  - `related`: D-167 (Case A — 직교, 변경 없음 — PD-065에 위임), D-168 (lock 폐기 — 정합 유지).
- **Case A는 PD-065에 위임** — D-166 supersede 범위 명확화. PD-065 trajectory에서 Case A 영역 D-166 잔존분 별도 처리.

### 5.2 GATE α/β 판정 주체·박제 주체 — M3-(iv) ③

- **GATE α (옵션 A·B 결과 판정)**: 판정=Master / 박제=Edi.
- **GATE β (race 0 검증, P4 후 적대적 N=10)**: 판정=Master / 박제=Edi.
- §7 phase 표 footnote 명시.

### 5.3 D1 sentinel — pending_turns 적대성 차단 — M3-(iv) ④

- pending_turns line은 외부 박제 가능 (D1 적대적 컨텍스트 전제).
- **박제 의무**: 모든 pending_turns line에 `__hook_origin: "post-tool-use-task"` 필드 박제.
- **검증 의무**: Nexus join 시점 + finalize join 시점 모두 `__hook_origin` 검증. 누락/위변조 line skip + gap 박제.
- 코드 위치: `post-tool-use-task.js` append 시 박제 / Nexus orchestration + `session-end-finalize.js` 검증.

### 5.4 D4 finalize join 게이트 — M3-(iv) ⑤

- Nexus push 누락 시(crash 또는 자율 우회) pending_turns 잔존.
- **`session-end-finalize.js`가 자동 join + gap 박제** — 모델 자율 영역 보강.
- 알고리즘:
  1. `pending_turns_{sessionId}.jsonl` 모든 line read
  2. `current_session.turns[]`와 agentId·role·reportsPath cross-match
  3. unmatched line 발견 시 turns[] 후미 append + `gaps[]`에 `{kind: "nexus_push_missing", agentId, role}` 박제
  4. join 후 pending_turns 파일은 archive 이동 (다음 세션에 영향 0)
- 강도: 코드 박제(LLM 자율 우회 불가). M3-(iv) ⑤ 충족.

### 5.5 모든 hook turnPushMode 분기 read 의무 명문화 — M3-(iv) ⑥

| hook | 현재 turns 박제? | 분기 read 의무 |
|---|---|---|
| `post-tool-use-task.js` | Yes (③) | nexus=③ skip + ② → pending_turns append. hook=legacy 그대로. |
| `pre-tool-use-task.js` | No (read만) | nexus + phase=blind-parallel 시 prepend 차단. nexus + phase=framing 시 role_domain_map 검증. |
| `pre-tool-use-task-sage-gate.js` | No | 변경 없음 (Sage 격리 정책 직교) |
| `pre-tool-use-task-master-first.js` | No | 변경 없음 |
| `session-end-finalize.js` | Yes (Edi turn auto-push, turns 머지) | nexus=pending_turns join 보강(§5.4). hook=legacy 머지. **turnPushMode 분기 read 의무 박제**. |
| `session-end-tokens.js` | No | 변경 없음 |

`scripts/lib/turn-push-mode.ts` 신설 권고 — 모든 hook이 `readTurnPushMode(sessionId): "hook"|"nexus"` 단일 함수 read. SOT는 `current_session.json.turnPushMode`. 코드 단일 출처.

---

## 6. PD-066 신설 (M4) — Nexus crash recovery 의제

### 6.1 PD-066 박제 명세

```
id: PD-066
title: Nexus crash 시 pending_turns 영구 손실 방지 복구 plan
context: D-169 turnPushMode=nexus 모드에서 Nexus 죽을 시 pending_turns_{sessionId}.jsonl 잔존
         → 다음 세션 finalize에서 join 가정 (§5.4). 단 (a) 다음 세션이 안 열림(휴지기), (b) 다음 세션이
         다른 토픽 → sessionId mismatch skip → 영구 손실.
resolveCondition: |
  Case B Phase 진입 게이트(§7 P0)에서 PD-066 resolved 또는 turnPushMode=hook fallback 강제 박제 후 진입.
  resolved 조건: pending_turns scan 단계가 (1) 모든 세션 시작 시점 + (2) 별도 cron(주기적) 둘 다에서
  동작 + (3) sessionId mismatch도 orphan 폴더로 이동 + Master 알림.
fallback: turnPushMode=hook 강제 (legacy 동작, Nexus crash 보호 자동 잔존).
status: open
```

### 6.2 복구 알고리즘 명세 (resolved 조건)

1. **scan trigger 1 — 세션 시작**: `/open` 시점에 `memory/sessions/pending_turns_*.jsonl` 전체 scan. 현 sessionId와 match → 복구. mismatch → orphan 폴더 이동.
2. **scan trigger 2 — 주기적 cron**: `pending_turns_orphan_scan` 일 1회 (또는 worktree 진입 시). 24h 이상 잔존 orphan → Master 알림 + 옵션(merge/discard).
3. **scan trigger 3 — finalize join**: §5.4 알고리즘 (현 세션 한정).
4. **trigger 1·2·3 충족 + Master 알림 채널 박제 시 PD-066 resolved**.

---

## 7. Phase 진입 게이트 코드 위치 명시 (M4)

### 7.1 게이트 강제 강도 (D-171 정합)

- **warn-only 아님**. 코드 박제로 진입 차단.
- **PD-066 미해결 시 fallback** = `turnPushMode = "hook"` 강제 (legacy 동작 영구 잔존).

### 7.2 게이트 코드 위치 (신설 + 보강)

| 게이트 | 코드 위치 | 동작 |
|---|---|---|
| **G-PRE (P0 진입 전)** | **`scripts/validate-phase-gate.ts` (신설)** | 다음 3건 모두 충족 검증: (1) Arki rev4 spc_lck=Y `current_session` 박제, (2) D-170-A1·A2 코드 박제 완료(§2 표), (3) PD-066 resolved OR turnPushMode=hook 강제 박제. fail 시 P0 진입 차단(stderr exit 1) |
| **G-IN-FLIGHT** | **`pre-tool-use-task.js`** L?? 진입부 | nexus 모드인데 PD-066 미해결 + fallback 미박제 시 차단 (G-PRE 우회 방지) |
| **G-FINALIZE** | **`session-end-finalize.js`** §5.4 join 단계 | pending_turns join + gap 박제 강제 (D4 보강) |

### 7.3 호출 트리거

- `G-PRE`: `/open` 시 자동 호출 (`.claude/skills/open/SKILL.md` 또는 hook). P0 진입 전 박제 의무 검증.
- `G-IN-FLIGHT`: 모든 Task dispatch 시점 (`pre-tool-use-task.js`).
- `G-FINALIZE`: `/close` 시점 (`session-end-finalize.js`).

---

## 8. Phase 재정리 (D-170-A1·A2·D-171 정합)

### 8.1 rev3 P0~P8 → rev4 통합

| Phase | 입력 | 작업 | 산출 / 게이트 |
|---|---|---|---|
| **P-1 (게이트 충족 단계)** | 본 rev4 + Riki rev1 + Ace rev1 | Master M1~M5 결정 박제 + Arki spc_lck=Y + D-169 + D-170-A1·A2 + PD-066 박제 | decision_ledger·pending_deferrals 박제 |
| **G-PRE 게이트** | P-1 산출 | `validate-phase-gate.ts` 통과 | fail 시 P0 차단 |
| **P0 — frame 결정 박제 + 게이트 검증** | G-PRE 통과 | D-169 신설 박제 (D-166 부분 supersede 명시) | decision_ledger D-169 |
| **P1 — 옵션 A·B 동시 spike** | §3 | hook input vs message stream agentId 일치 + truncation N=10 dispatch 동시 측정 | spike_p1_option_ab_compare.json |
| **GATE α — 옵션 채택 판정** | P1 결과 | 옵션 A 100% OR 옵션 B 0% truncation → 채택. 둘 다 fail → frame 폐기 | Master 판정 + Edi 박제 |
| **P2 — turnPushMode 플래그 박제** | §1 A9 | current_session schema + `/open` 시 박제 + `scripts/lib/turn-push-mode.ts` 신설 | unit test |
| **P3 — hook early return 분기 + pending_turns append** | §5.5 + §5.3 | post-tool-use-task.js ③ skip 분기 + ② → pending_turns append + `__hook_origin` sentinel | unit test (mode=hook / mode=nexus 양쪽) |
| **P4 — Nexus 직접 push 코드** | §1.2.2 + §2.1(d) | dispatching-parallel-agents skill 본문에 push 흐름 + sort_key 정렬 | smoke test (3개 병렬→turns[] 정합) |
| **GATE β — race 0 검증** | P4 | 적대적 N=10 병렬 dispatch + turns[] 정합 | Master 판정 + Edi 박제 |
| **P5 — finalize join 보강 (D4 게이트)** | §5.4 | session-end-finalize.js에 pending_turns→turns[] join + `__hook_origin` 검증 + gap 박제 | unit test (Nexus crash 시뮬) |
| **P6 — blind-parallel prompt 차단** | §2.1(a) + §4 | pre-tool-use-task.js 분기 박제 + framing role_domain_map 검증 | code review |
| **P7 — 정렬 키 + phase enum SOT 박제** | §1 A10·A11 | dispatch_config.json `parallel_turn_sort_key` + `phase_enum` + `priority_axis_order` + `isolation_strength_default` + `debate_round` + `discussion_mode` 박제 | unit test |
| **P8 — 운영 모니터** | rev3 P8 | dashboard에 turnPushMode·pending_turns size·race 카운터·orphan scan 결과 | compute-dashboard.ts |
| **P9 — phase enum + 발언자 분배 인터페이스 박제 (M3-(ii) 잔여)** | §2.1 잔여 | dispatch_config.json.phase_enum + Nexus 분배 인터페이스 (skill 본문) + debate_state 스키마 | unit test |

병렬 가능: P3 ∥ P4. P5 ∥ P6 ∥ P9. P7 선행은 P3·P4·P6·P9 SOT read 의존 → P7을 P2 직후로 앞당김.

### 8.2 게이트·롤백·전제·중단

#### 검증 게이트
- **G-PRE** (P0 진입 전): 코드 차단.
- **GATE α** (P1 spike 후): 옵션 채택.
- **GATE β** (P4 후): race 0.
- **G-FINALIZE** (매 세션 close 시): pending_turns join.

#### 롤백
모든 phase 가역. `turnPushMode = "hook"` 강제 박제 → 원복 (D-169 supersede caveat 박제).

#### 전제
1. fs.appendFile atomicity (rev2 P1 spike 검증 + R-N-05 재측정).
2. 옵션 A 또는 B 중 하나라도 GATE α 통과 (둘 다 fail 시 frame 폐기).
3. PD-066 resolved 또는 turnPushMode=hook fallback 강제 박제 (G-PRE 차단).
4. D1~D4 정합 — `__hook_origin` sentinel + finalize join + 모든 hook mode 분기 read.
5. Case A (PD-065) 본 plan 직교 — D-167 영역 변경 없음.

#### 중단 조건
- GATE α 둘 다 fail → frame 폐기 (D-169 박제 후 supersede 박제 + turnPushMode=hook 영구).
- GATE β race 검출 ≥1건 → Nexus push 코드 결함 → 재설계.
- LLM 자율 우회 발견(D4 잔존 risk 현실화) → frame 강도 보강 또는 frame 자체 재고.
- PD-066 resolveCondition 미충족 시 G-PRE 통과 불가 → fallback 강제.

---

## 9. 자가감사 (4축 1차 + 거버넌스/메타 2차)

### 9.1 1차 감사 (4축, 최소 3지점)

#### structuration
- (1) 자산 매트릭스 §1 단일 절 통합 — rev3 분산 결함 해소. **OK** (MUST_NOW 통합 완료)
- (2) turnPushMode SOT = current_session 단일, 모든 hook이 `scripts/lib/turn-push-mode.ts` 통해 read — 단일 출처. **OK**
- (3) phase enum SOT = dispatch_config.json 단일 (P9 박제) — magic string 제거. **OK**

#### hardcoding
- (1) sort key §1 A10 + P7 SOT 박제 — magic 제거. **OK**
- (2) pending_turns 파일명 convention — `pending_turns_{sessionId}.jsonl` SOT는 `dispatch_config.json.path_policy.pending_turns_pattern` 박제 권고 → P7에 포함. **OK**
- (3) priority_axis_order §2.1(b) 박제 — 순서 hardcode 제거. **OK**

#### efficiency
- (1) Nexus 단일 thread push N건 cost 미세 (json < 100KB). **OK**
- (2) pending_turns hook append + Nexus read 중복 work — D2 정합 우선. **OK**
- (3) finalize join scan + cron orphan scan 중복 — 무결성 우선, 비용 미세. **OK**

#### extensibility
- (1) Case A(PD-065) 호환 — sessionId 필드 박제로 다중 인스턴스 격리 가능. **OK**
- (2) (4)반박 단계 — D-170-A1 sub-axis (d) + P9 코드 매핑 박제. **OK** (rev3 DEFER → rev4 IN)
- (3) Nexus crash recovery — PD-066 신설 + 알고리즘 명세 §6.2. **OK** (rev3 DEFER → rev4 IN)

**1차 발견 요약**: MUST_NOW 0건. 모든 rev3 DEFER 항목이 D-171 게이트 의무로 IN 전환됨. **OK**.

### 9.2 2차 감사 (거버넌스·메타 안전 D1~D4)

#### 거버넌스
- D-169 supersede 범위 §5.1 명시 (D-166 부분, Case A는 PD-065 위임). **OK** (M3-(iv) ② 통합)
- GATE α/β 판정·박제 주체 §5.2 명시. **OK** (M3-(iv) ③ 통합)

#### 메타 안전 (D1~D4)
- **D1**: pending_turns line `__hook_origin` sentinel §5.3 박제. **OK** (M3-(iv) ④ 통합)
- **D2**: 옵션 A·B 동시 spike + fallback marker 폐기 §3 박제. **OK** (M3-(i) 통합)
- **D3**: turns + pending_turns + reports/ frontmatter 3축 cross-check은 finalize join §5.4가 부분 충족(turns·pending_turns 2축). reports/ frontmatter 3축 정합 validator는 rev3 §6.2 MUST_BY_N=30 그대로 잔존 → **DEFER (별도 토픽 또는 운영 시 박제)**. 본 rev4 영향 0.
- **D4**: finalize join §5.4 게이트 + G-PRE/G-IN-FLIGHT/G-FINALIZE 3중 코드 박제. Nexus push 자율성 잔존 부분은 finalize join이 자동 보강. **OK** (M3-(iv) ⑤ 통합)

#### Arki full-system view (코드 한 축만 보고 단언 금지)
- 모든 hook turnPushMode 분기 read 의무 §5.5 표 명시 + `scripts/lib/turn-push-mode.ts` 단일 함수. **OK** (M3-(iv) ⑥ 통합)
- pre-tool-use-task.js·post-tool-use-task.js·session-end-finalize.js 3 hook 모두 mode 분기 read 박제 의무 명문화. **OK**

**2차 발견 요약**: MUST_NOW 0건 잔존. D3 3축 validator만 DEFER (영향 0).

### 9.3 spec 동결 — spc_lck 판정

- 1차 감사 MUST_NOW 0건.
- 2차 감사 MUST_NOW 0건 (DEFER 1건만 잔존, 영향 0).
- rev3에서 잔존했던 6건 모두 본 rev4 §1·§2·§5·§7에 통합 박제됨.
- Riki rev1 🔴 5건 모두 본 rev4 §2·§3·§4·§7에 통합 박제됨.
- Ace rev1 4 충돌 단일 권고 모두 본 rev4에 통합됨.

→ **spc_lck = Y** ✅

### 9.4 자가감사 라운드

1차(4축) + 2차(거버넌스/메타 D1~D4) + Arki full-system view = **3회**. rev3에서 발견된 모든 결함(11건) + Riki/Ace 외부 입력(5+4건) 통합. Master "한번 더" 압박 시뮬 적용 완료.

---

## 10. Master 결정 필요 항목 (rev3 4건 → rev4 잔존 0건)

본 rev4는 **Master M1~M5 결정 박제 후 진입한 통합 단계**. Master 추가 결정 불요. 진입 가능 게이트:

1. ~~본 frame 채택~~ → M1+M2 박제로 결정 완료 (Master 결정).
2. ~~G안 인프라 부분 폐기 범위~~ → §1 자산 매트릭스 + §5.1 D-169 supersede 명시로 결정 완료.
3. ~~rev3 Phase P1 spike 진입~~ → §3 옵션 A·B 동시 spike로 확정 + GATE α 통과 기준 박제.
4. ~~PD-066 신설~~ → §6 본 rev4에서 박제 의제 명세 완료.

**다음 단계**: Edi가 본 rev4 spc_lck=Y 박제 + D-169 + PD-066 + dispatch_config 갱신 + `validate-phase-gate.ts` 신설 + `scripts/lib/turn-push-mode.ts` 신설 → G-PRE 통과 후 P0 진입.

---

[ROLE:arki]
# self-scores
aud_rcl: 1.0
str_fd: 5
spc_lck: Y
sa_rnd: 3
