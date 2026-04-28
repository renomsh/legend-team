---
role: ace
session: session_123
topic: topic_121
topicSlug: pd033-agent-continuity-design
turnId: 7
invocationMode: subagent
grade: A
date: 2026-04-28
rev: 4
recallReason: post-master
splitReason: "Riki 3건 반영 + Arki rev4 spec 인계 brief 정리"
---

# Ace 종합검토 rev4 — Riki 보강 3건 반영 + Arki rev4 인계용 spec brief

Ace입니다. Master "에이스 의견 정리해서 아키한테 다시 설계하게 해" 지시. Riki rev1의 R-1·R-2·R-3 모두 실측 확인 후 반영. rev3 5축 골격은 유지하되 환각 3건 정정. Arki rev4가 spec 정식화로 받을 brief를 본 발언 말미에 정리합니다. 절충 없이 단일 권고.

---

## Sec 1. Riki 3건 반영 결정 (실측 확인 후)

### R-1 정정 — C3 토픽 layer 인프라 부재

**실측 (본 발언에서 재확인)**:
- `topics/topic_121/`: agenda.md / debate_log.json / decisions.json / master_feedback.json / open_issues.json / revision_history.json / speculative_options.json / topic_meta.json — **8개. turn_log.jsonl·context_brief.md 둘 다 부재**.
- `.claude/settings.json`: PostToolUse(Task)만 등록 — turn_log.jsonl 자동 작성 호출 0건 (실측 grep 결과 일치).
- 즉 rev3 C3-γ "기존 인프라 100% 재활용"은 **현시점 본 토픽에서 read 대상 부재**.

**선택**: **(a) 자동 작성 hook 보강 신설** 채택.

근거 3가지:
1. **(b) reports/ glob fallback은 비전 위반 정도가 큼**. reports/ glob은 *본 세션 내* 발언만 잡힘 — 토픽이 N세션에 걸칠 때 N-1세션 reports/ 디렉토리 슬러그 prefix 패턴(`{date}_{slug}/`)이 매 세션마다 달라져 glob 정의가 부풀음. 토픽 layer "과거 세션 누적 자동 read"가 본질인데 fallback이 그것을 못 함.
2. **(a) 자동 작성은 PostToolUse(Task) hook 1군데 확장**으로 구현 가능. PostToolUse는 이미 등록되어 turn 박제 자동화 중 (rev3 K7 실측). hook 본문에 `writeTurnLogEntry(topicId, role, turnIdx, reportPath)` 1함수 추가 — 신규 hook 0개, 기존 hook 함수 +1개. *짓는 부담 최소화 + read 대상 영구 보장*.
3. **`/open` skill에서 `context_brief.md` 자동 생성 1회 추가** (`/open` 이미 작동 중인 다른 파일들과 동선 동일). 본 토픽엔 소급 1회 manual 작성으로 보충. 이후 신규 토픽은 자동.

**rev3 → rev4 변경**: C3-γ를 *3가지 read source*에서 *5가지로 확장* — turn_log.jsonl(자동 생성 보장) + context_brief.md(자동 생성 보장) + session_contributions/ + reports/ + role 필터. 단 신설 자산 *PostToolUse hook 함수 +1 + /open 1줄*은 인벤토리에 명시.

### R-2 정정 — K6 미허용 시 fallback 처리

**rev3 결함**: "C1-β fallback"이라 적었으나 rev2에서 이미 "메인 휘발성 의존, 비전 정면 충돌"로 부결 처리. 자기모순.

**선택**: **K6 미허용 시 partial-resolved + PD-NNN 분기** 채택.

근거 3가지:
1. C1-β 부활은 비전 위반 fallback — 본 토픽이 비전 미충족 결정으로 닫힘. D-071 fiction 패턴 재현 가능성. 부결 유지.
2. **본 세션이 결정 0으로 닫힐 가능성을 인정**. PreToolUse hook spec이 prompt mutation 미허용이면, *본 토픽에서 강제 인프라 결정 박제 차단*은 D-072 falsification probe 게이트 정합 — fiction 잠복보다 미해결 명시가 안전.
3. 처리 방식: **PD-033 partial-resolved + PD-NNN 신규 박제**("PreToolUse hook prompt mutation 환경 도입 또는 동등 강제 인프라 spike"). PD-NNN은 별도 토픽 — Claude Code spec 진화·hook 라이브러리 spike·상위 SDK 변경 대기 등 외부 의존 명시.

**Phase 1 G1 통과 결과별 분기**:
- G1 PASS (mutation 허용 실측) → C1-α 정식 채택, PD-033 fully resolved.
- G1 FAIL (mutation 미허용) → 본 토픽 결정 박제 = (1) 토픽 layer 인프라 보강 (R-1 (a) 채택분 — turn_log 자동 작성) + (2) finalize `validateInlineRoleHeaders` 함수 추가 + (3) PD-033 partial-resolved + (4) PD-NNN 신규 분기 + (5) PD-044 dropped. C1-α는 미박제, 별도 PD로 이전.

이렇게 분기하면 **G1 결과와 무관하게 본 세션은 *최소 자산*은 확정 박제** — 비전 미충족이라도 미해결 잠복 회피.

### R-3 정정 — prov 표현 정정

**rev3 잘못된 표현 (Sec 3 C1-α 인용)**:
> "본 호출 자체가 미니멀 안 작동 증거 — reports/{rev}.md 직전 N개 경로 inject + 페르소나 Read 명시 inject + 메타데이터 inline 박제로 정상 작동."

**실측**: 본 호출들의 prompt는 **메인이 인라인 prepend**로 작동. PreToolUse hook은 settings.json 미등록(실측 확인). hook 시연이 아님.

**정정 1줄**: 본 호출은 *메인 인라인 prepend*가 의도대로 작동한 사례이지 PreToolUse hook 시연이 아니다. C1-α 채택 근거는 *메인 인라인 prepend의 휘발성 차단을 hook 코드 강제로 봉인*함이지, *현재 hook 작동 증거*가 아니다. Phase 1 G1 통과 후 hook 등록·재현 시점에서 진짜 hook 시연으로 prov 갱신.

본 발언 이후 결정 박제·spec 본문에서 "본 호출 = hook 시연"식 표현 0건 강제.

---

## Sec 2. 5축 단일 권고 갱신

| 축 | 갱신 권고 | 갱신 사유 |
|---|---|---|
| **C1** 자동 inject 메커니즘 | **C1-α PreToolUse(Task) hook** (rev3 그대로) — 단 fallback 정정: K6 미허용 시 partial-resolved + PD-NNN, C1-β 부활 안 함 | R-2 반영. 비전 위반 fallback 제거 |
| **C2** inject 범위 | **C2-γ 양축 (세션 layer + 토픽 layer)** (rev3 그대로) | 변경 없음 — 비전 직역 |
| **C3** 토픽 layer 인프라 | **C3-γ' = turn_log.jsonl + context_brief.md + session_contributions/ + reports/ + role 필터, 단 (a) PostToolUse hook 함수 +1로 turn_log 자동 작성 보장 + (b) /open skill에 context_brief 자동 생성 1줄 추가** | R-1 반영. "기존 인프라 100% 재활용" 환각 정정. *최소 보강 1건 추가* |
| **C4** 세션 layer 인프라 | **C4-α `current_session.json.turns[]` + reports/** (rev3 그대로) | 변경 없음 — turns[]는 PostToolUse hook으로 이미 자동화 |
| **C5** 토픽 종결 처리 | **C5-α + C5-γ 결합** (rev3 그대로) — 토픽 layer 보존, 캐릭터 자동 승격 부결 | 변경 없음 |

핵심 변경 1건: C3 권고에 *최소 인프라 보강 1건* 추가. rev3 "신설 PreToolUse hook 1개"는 환각이었고, 정확히는 **신설 자산 = PreToolUse hook 1개 + PostToolUse hook 함수 +1개 + /open 1줄 + finalize 함수 +1개**.

---

## Sec 3. 신설 자산 최종 인벤토리 (Arki 인계용)

Riki 3건 반영 후 본 토픽이 신설할 자산 단일 리스트 — 환각 0:

| # | 자산 | 위치 | 형식 | 트리거 |
|---|---|---|---|---|
| 1 | **PreToolUse(Task) hook 신규** | `.claude/hooks/pre-tool-use-task.js` 신규 + `.claude/settings.json` `hooks.PreToolUse[matcher:"Task"]` 등록 | Node.js script — stdin tool_input 받아 prompt에 표준 dispatch 블록 + 경로 list + 페르소나 read 명령 prepend 후 stdout 반환 | Agent tool 호출 직전 |
| 2 | **PostToolUse(Task) hook 함수 +1 (turn_log 자동 작성)** | `.claude/hooks/post-tool-use-task.js` 본문 함수 추가 — `writeTurnLogEntry(topicId, role, turnIdx, reportPath, summaryHash?)` | 기존 hook 본문에 함수 +1, jsonl append | Agent tool 응답 직후 (이미 turn 박제 처리 중인 시점) |
| 3 | **`/open` skill 1줄 추가 (context_brief 자동 생성)** | `.claude/skills/open/SKILL.md` 또는 `scripts/.../open` 스크립트 — `context_brief.md` 초기 템플릿 1회 write | Markdown 골격 1파일 | `/open` 실행 시 |
| 4 | **finalize 함수 +1 (`validateInlineRoleHeaders`)** | `.claude/hooks/session-end-finalize.js` 본문 함수 추가 | reports/{date}_{slug}/*.md 헤더 ↔ turns[] 매칭 cross-check, mismatch 시 gaps 박제 (차단 X) | SessionEnd hook chain 안 |
| 5 | **본 토픽 turn_log·context_brief 소급 manual 1회** | `topics/topic_121/turn_log.jsonl` + `topics/topic_121/context_brief.md` | jsonl + md | Phase 2 spec 동결 후 1회 |

**신설 0 환각 명시 폐기**: rev3가 "신설 인프라 = PreToolUse hook 1개만"이라 적은 부분은 부분 거짓. 정확한 신설 = **5건**(자산 #1~#5). 단 코드 신설 hook은 1개(#1), 나머지는 기존 hook 확장(#2·#4)·skill 1줄(#3)·소급 manual(#5).

**짓지 않음 옵션 재검토 (Hickey 의무)**: rev3 미니멀 안의 "짓지 않음" 미덕은 Master 비전 "없으면 만들어서라도"에 의해 폐기 — rev3 Sec 1 #4 정합. 단 "짓되 최소 짓는다"는 살아있음 — #2·#3·#4·#5는 기존 위치 확장·1줄·소급 1회 — 신규 파일 0. #1만 신규 파일.

---

## Sec 4. PD 처리 갱신

| PD | rev4 결론 | 1줄 근거 |
|---|---|---|
| **PD-033** (지속성) | **G1 PASS 시 fully resolved-by-{C1α + C2γ + C3γ' + C4α + C5α}** / **G1 FAIL 시 partial-resolved + PD-NNN 분기** | 5축 권고가 비전 직역. fallback은 비전 위반 fallback 부활이 아니라 partial+분기로 잠복 회피 |
| **PD-043** (사칭 검출) | **resolved-by-finalize-함수 +1 (`validateInlineRoleHeaders`)** | 자산 #4. PostToolUse(Task) hook이 이미 turn 박제 자동 — 신설 hook 불필요 (rev3 결정 유지) |
| **PD-044** (정책-페르소나 박제) | **dropped-by-C1α-side-effect** (G1 PASS 시) / **dropped-with-rationale** (G1 FAIL 시 — PreToolUse hook 부재여도 *현 메인 인라인 prepend 패턴이 작동 중*임이 본 세션 6 turn 시연으로 입증, 슬림화 동기 자체는 약화) | rev3 결정 유지 + R-3 prov 정정 반영. 페르소나 그대로 유지 |

PD-NNN 신규 (G1 FAIL 분기): "PreToolUse hook prompt mutation 환경 도입 또는 동등 코드 강제 인프라 spike" — Claude Code spec 진화·hook 라이브러리 spike·상위 SDK 변경 대기 등 외부 의존 명시. 본 세션 박제는 G1 결과 후.

---

## Sec 5. 핵심 전제 K6/K7/K8 + 신규 K9

| # | 전제 | 표시 | 거짓일 때 무엇이 무너지는가 |
|---|---|---|---|
| K6 | PreToolUse(Task) hook이 stdin tool_input.prompt mutation을 허용한다 | 🔴 | C1-α 메커니즘 자체 무력. 본 세션 partial-resolved + PD-NNN 분기 (R-2) |
| K7 | `topics/{id}/turn_log.jsonl` 자동 작성이 PostToolUse hook 확장으로 가능하다 | 🟡 | C3 토픽 layer 인덱스 부재. 다음 세션 자동 read 누락 → 비전 #1 (토픽 영속) 부분 위반. fallback: session_contributions/ + reports/만으로 토픽 layer 부분 작동, role 필터 정확도 저하 |
| K8 | PreToolUse hook이 메인 prompt 외 system message에도 prepend 가능 | ⚠️ | 차선 손실만 — 페르소나 read 명령은 user 영역에 합침. C1-α 본질 영향 없음 |
| **K9 (신규)** | **`/open` skill 또는 PostToolUse hook 확장이 `context_brief.md` 초기 자동 생성을 강제 가능** | 🟡 | C3 토픽 layer "서사 맥락" source 부재. turn_log.jsonl(인덱스)만으로 토픽 layer 작동하나 자연어 맥락 누락 → 다음 세션 첫 호출이 토픽 진입 맥락 빈약. fallback: session_contributions/.md(이미 작동)로 대체 가능 — 단 grain 다름 |

🔴 K6 = 결정적. Phase 1 G1 spec 실측 의무. 🟡 K7·K9 = 실패해도 부분 작동 + fallback 존재. ⚠️ K8 = 차선만 잃음.

---

## Sec 6. Arki 인계 brief (rev4 spec 정식화 작업 지시 핵심)

Arki rev4가 받아서 spec 정식화할 brief — **본 단계는 spec 동결 전 단계**입니다. 다음 골격 위에서 Arki가 정식 Phase·의존그래프·게이트·롤백·중단조건 작성. 금지어 v0(시간·인력·공수) 위반 0건 강제.

### 6.1 결정 골격 (5축 단일 권고)
- C1: PreToolUse(Task) hook 코드 강제 (K6 G1 분기)
- C2: 양축 자동 inject (세션 layer + 토픽 layer)
- C3: turn_log.jsonl + context_brief.md + session_contributions/ + reports/ + role 필터 — *자동 작성 보장 보강 포함*
- C4: `current_session.json.turns[]` + reports/ (세션 layer)
- C5: 토픽 보존, 캐릭터 자동 승격 부결

### 6.2 신설 자산 인벤토리 (Sec 3 표 그대로 — 5건)
- #1 PreToolUse hook 신규 (`.claude/hooks/pre-tool-use-task.js` + settings.json 등록)
- #2 PostToolUse hook 함수 +1 (`writeTurnLogEntry`)
- #3 `/open` skill 1줄 (context_brief 자동 생성)
- #4 finalize 함수 +1 (`validateInlineRoleHeaders`)
- #5 본 토픽 소급 manual 1회 (turn_log + context_brief)

### 6.3 미결 K — Phase 1 G1에서 실측 의무
- K6 (🔴) — PreToolUse hook prompt mutation 허용 여부. (a) Claude Code spec 문서 search/hook protocol 확인 (정적), (b) 더미 hook 등록 + prompt mutation test (동적) 2단.
- K7 (🟡) — PostToolUse hook 확장이 turn_log.jsonl write 가능한가. fs.appendFileSync 권한 + 경로 OK 실측.
- K8 (⚠️) — system message prepend 가용성. K6 동시 확인.
- K9 (🟡) — `/open` skill 또는 hook 확장으로 context_brief 자동 생성 가능. 작은 path/template 실측.

### 6.4 Phase 분해·의존그래프·게이트·롤백·중단조건
**본 부분은 Arki rev4 본업 (Section 4 구조적 실행계획 의무)**. 본 brief는 5축 골격·자산 인벤토리·미결 K만 제공하고, Arki가 그 위에서 정식 spec 작성. Master "다시 설계하게 해" 지시는 *Arki가 새 골격에서 정식 Phase 분해부터 다시 짜라*는 의미로 해석.

### 6.5 금지어 v0 강제
- 절대 시간(`D+N일`/`N주차`/`MM/DD`/구체 날짜) 0건
- 인력 배정(`담당자:`/특정 이름/`PD`/`MM`) 0건
- 공수 단위(`N시간`/`N일 소요`/`공수`) 0건
- 허용: `Phase N 완료 → Phase N+1` / `게이트 G1 통과 후` / `K6 충족 시` 등 구조적 선후

### 6.6 다축 검증 의무 (`feedback_arki_full_system_view`)
Arki rev4는 코드(.claude/hooks/* 본문) + settings(.json hook 등록 형식) + skill(/open) + 페르소나 + 정책 문서(CLAUDE.md) + memory feedback 모두 다축 교차 검증. 한 축만 보고 단언 금지.

### 6.7 짓지 않음 옵션 fallback 명시
각 신설 자산이 *spec 미허용·예산 초과·환경 한계*로 무력화될 때 fallback. R-2 분기(partial-resolved + PD-NNN) 정합 처리 강제.

---

## Sec 7. 다음 발언자 추천

**Arki rev4 자명** — Master 별도 게이트 없음.

근거:
1. Master 명시 지시("아키한테 다시 설계하게 해")가 이미 있음. memory feedback `feedback_low_friction_no_redundant_gate`("결정 필요 0건이면 묻지 말고") 정합.
2. 본 rev4가 Riki 3건 반영 + 5축 권고 갱신 + 인벤토리 정정 + Arki brief까지 모두 합성 — 결정 필요 0건.
3. Arki rev4는 brief 위에서 spec 정식화. K6/K7/K8/K9 G1 spec 실측 + Phase 분해 + 의존그래프 + 게이트 + 롤백 + 중단조건. 그 후 Master G1 결과별 분기 게이트.

Master 자연어 개입 시 즉시 manual 복귀 + 그쪽 우선.

---

```yaml
# self-scores
rfrm_trg: N
ctx_car: 1.00
orc_hit: 0.90
mst_fr: 0.50
ang_nov: 1
```

**다음 발언자 추천**: Arki rev4 (5축 골격 + 자산 인벤토리 5건 + 미결 K 4건 위에서 spec 정식화 — Phase 분해·의존그래프·게이트·롤백·중단조건 본업).
