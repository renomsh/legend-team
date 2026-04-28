---
role: arki
session: session_123
topic: topic_121
topicSlug: pd033-agent-continuity-design
turnId: 1
invocationMode: subagent
grade: A
executionPlanMode: plan
date: 2026-04-28
rev: 1
---

# Arki — 구조 분석 + 실행계획 (PD-033/043/044 묶음)

Arki입니다. Ace 권고(A1-β / A2-α / A3-γ / A4-α / executionPlanMode=plan)를 맹목 인수하지 않고 4축 다축 검증한 뒤 합류 여부를 결정합니다. 결론부터 말씀드리면 — **A1-β·A3-γ·A4-α는 합류, A2-α의 inject scope 차등안은 1군데 변경 권고**.

---

## Section 1. 기술적 성립 여부 (K2/K4 즉시 검증)

### K2 (같은 session 동일 역할 N번째 호출이 직전 컨텍스트 미보유)
**검증 결과**: ✅ 성립 (본 호출이 자기증명).

근거 4축:
1. **본 발언 인프라**: 본 호출의 system prompt는 메인이 명시 inject한 "Ace 프레이밍 발언: `reports/.../ace_rev1.md` — 반드시 Read"라는 한 줄과, 그것을 Read한 결과로만 Ace 권고를 인지함. 명시 inject가 없었다면 turnIdx=0 발언 내용을 알 수 없음.
2. **current_session.json 실측**: turns 배열에 `{role: "ace", turnIdx: 0}` 1건. Arki 직전 호출 0회 → 본 호출이 같은 역할 첫 진입이므로 K2의 "N번째"(N≥2)는 본 세션 후속 Arki 호출에서 검증 가능. 메인이 동일 페르소나로 재호출 시 turn 1 발언을 어떻게 승계할지가 PD-033 결정 대상.
3. **turn-types.ts** (`scripts/lib/turn-types.ts`): Turn 인터페이스에 `finding` / `prevTurnRef` / `payload` 필드 부재. **현 스키마는 finding 누적을 표현할 수단이 없음** — 즉 PD-033이 다루는 데이터 축이 코드에 비어 있음. 본 토픽 구현은 turn-types 확장이 아니라 **별도 scratchpad 파일**로 가는 게 단순(Hickey: "짓지 않음").
4. **session-end-finalize.js**: turns→session_index 전파만 담당. 서브 발언 *중간* 시점에 작동하는 hook 없음. 즉 finding 박제는 finalize 시점이 아니라 서브 발언 자체가 wrap-up하며 직접 write해야 함.

### K4 (페르소나 파일이 prompt에 주입됨)
**검증 결과**: ⚠️ **부분 성립 — Ace 가설 그대로 신뢰는 위험**.

근거:
1. `.claude/agents/role-*.md` 4개는 **archive 처리 (`.old` suffix)**, 나머지 4개도 부재. 즉 SubagentDispatcher 폐기(D-073) 이후 Claude Code Task tool 표준 dispatch는 `.claude/agents/` 정의를 사용하지 않음.
2. `memory/roles/personas/role-*.md` 8개는 살아있으나 — **이 파일들이 자동으로 prompt에 주입되는 인프라는 현재 코드에 없음**. 본 호출 system prompt에도 페르소나 파일이 자동 inject되지 않았고, "첫 단계로 반드시 Read하라"는 명시 지시로 메인이 우회.
3. 즉 PD-044의 "정책을 페르소나에 박제하면 자동 작동" 전제는 **"메인이 페르소나 Read를 명시 지시하는 한"** 성립. 무조건 자동은 아님.

**Master에 1줄 확인 권고**: 페르소나 자동 inject 인프라(예: dispatch 시스템 prompt에 페르소나 본문 포함)가 별도로 살아있는지 — 또는 본 호출처럼 매번 메인이 "페르소나 Read하라" 1줄로 갈 것인지. 후자면 PD-044 효과가 "메인 prompt 책임"으로 이전됨.

---

## Section 2. 프로토콜 호환성 (충돌 지점 매핑)

| # | 기존 시스템 | 충돌 가능성 | 처리 |
|---|---|---|---|
| 1 | `turn-types.ts` Turn[] 스키마 | finding 필드 부재 | **scratchpad는 별도 파일·turn에 `payloadRef?: string` 1필드만 추가**(선택). turn 스키마 비대화 회피 |
| 2 | `session-end-finalize.js` hook | scratchpad write 시점이 finalize와 무관 — 충돌 없음 | finalize에 추가할 것: scratchpad 디렉토리 존재 여부 검증 1줄(없으면 gap 박제) |
| 3 | `.claude/agents/role-*.md` archive (`.old`) | dispatcher 폐기 후 페르소나 자동 inject 인프라 부재 — K4 §1.2 결과 | PD-044 박제 위치를 `.claude/agents/`로 잡으면 무효. **`memory/roles/personas/role-*.md` 8개가 canonical** |
| 4 | `personas/role-*.md` 8역할 | 모두 유사 구조 — Write 계약 블록·Self-Score 블록 위치 일관 | 신규 "Continuity 계약" 블록을 동일 위치에 8개 일괄 박제 |
| 5 | `decision_ledger / topic_index / context_brief` 3층 | 변동 없음 — scratchpad는 ephemeral session-scope | 충돌 없음 |
| 6 | PD-035 self-score YAML 페르소나 | 같은 파일 추가 박제 → 페르소나 길이 증가 | 한 파일당 +20~30줄. K4 §1.2가 의미하듯 자동 inject 인프라 빈약하면 길이 증가는 sunk cost 가능. **메인 prompt에서 페르소나 Read 의무가 이미 있으므로 추가 비용 한계** |
| 7 | PD-023 P3 KPI 트랙 (D-092 단순화) | self-score만 남은 단순 모델 | scratchpad 누적 turn 수 자체가 derived metric으로 활용 가능 — 부산물 |
| 8 | 본 호출의 dispatch 패턴 (Task tool subagent) | 메인이 명시 prompt로 페르소나 Read·scratchpad inject 명령 가능 | 인프라 추가 부담 0. **자동화는 "메인 prompt 표준 템플릿 박제"로 처리** — code 변경 아님 |

**핵심 통찰**: dispatcher 폐기 이후 인프라는 **"메인 prompt가 서브에 무엇을 inject하라고 지시하는가"**가 사실상 lifecycle을 결정. PD-033·044 구현은 *코드 인프라*보다 *메인 prompt 표준 템플릿 + scratchpad 파일 I/O*가 더 큰 비중.

---

## Section 3. 설계 옵션 (3개)

### 옵션 1 — Ace 권고안 그대로 (A1-β·A2-α·A3-γ·A4-α)
- (+) 단순. 파일 기반. 즉시 구현. 22세션 fiction 회피.
- (−) inject scope 차등이 인프라 외부(메인 prompt 책임)에 있어, 박제 경로가 페르소나가 아닌 **메인 prompt 템플릿**으로 이동 필요. Ace 안은 이를 명시하지 않음.

### 옵션 2 — Ace 권고 + 박제 경로 명확화 (Arki 권고)
A2-α의 inject scope 차등 정책을 두 곳에 박제:
- (a) **메인 prompt 표준 템플릿** (`.claude/skills/dispatching-parallel-agents/`에 추가 또는 신규 `memory/shared/subagent_dispatch_template.md`): 역할별 inject scope를 메인이 prompt 작성 시 따르는 규칙으로.
- (b) **페르소나 본문 Continuity 블록**: 서브 발언 끝의 *write 계약*만 — "scratchpad/{sessionId}/{role}/turn_{idx}.json에 finding append 의무". inject scope는 페르소나가 아니라 메인 책임이므로 페르소나에는 박제 안 함.
- (+) 책임 경계 명확. 페르소나 비대화 최소. K4 §1.2 위험(자동 inject 부재) 회피.
- (−) 박제 위치가 2개로 늘어남 — 검증 게이트 1개 추가 필요.

### 옵션 3 — 짓지 않음 옵션 (Hickey 검토 의무)
PD-033을 **결정 박제 + 메인 prompt 1회 표준 템플릿만**으로 끝내고, scratchpad 파일·write hook 인프라는 *다음 fiction 잠복 위험 신호 발생 시*까지 보류.
- 근거: 본 호출이 메인의 명시 prompt만으로 Ace 발언을 정확히 승계함 — 즉 finding 누적 자체는 *메인 prompt 표준화*로 즉시 해결 가능. scratchpad는 "메인이 직접 inject할 finding을 매번 어디서 찾을지" 검색 비용 줄이는 부수 인프라.
- (+) 22세션 fiction 재현 위험 0(코드 인프라 변동 0). 즉시 효과 검증 가능.
- (−) Riki·Ace·Edi가 한 토픽 내 N회 발언 시 메인이 매번 직전 발언 path를 reports/에서 추적해야 함 — 검색 비용 누적. 6번째 호출쯤 메인 부담 한계.

### Arki 권고: **옵션 2** (Ace 권고 + 박제 경로 명확화)
근거 3가지:
1. K4 §1.2 "페르소나 자동 inject 인프라 부재"가 사실이면 inject scope 정책은 페르소나에 박혀도 작동 안 함. 메인 prompt 템플릿이 canonical.
2. 옵션 3은 단기 Hickey적이지만 6 turn 이후 검색 비용이 메인 부담으로 전이 — *finding 박제의 의미*가 "쉽게 찾을 수 있어야 한다"인 이상 scratchpad 파일은 도구로서 정당.
3. 옵션 1을 그대로 진행하면 **PD-044가 잘못된 위치(페르소나)에 inject scope를 박제** → 다음 세션에서 작동 안 한다는 사실 직면 → fiction 잠복 재현. K4 §1.2가 사전 경보.

---

## Section 4. 경계 조건 (설계가 깨지는 조건)

| # | 깨짐 조건 | 사전 신호 | Mitigation | Fallback |
|---|---|---|---|---|
| C1 | scratchpad write race condition (병렬 dispatch에서 같은 세션·역할·turnIdx 충돌) | 같은 turnIdx 파일 2회 write | `turn_{idx}_{nanoTimestamp}.json` 파일명 적용 | 충돌 시 양쪽 모두 유지·메인이 마지막 mtime 우선 read |
| C2 | scratchpad 누적 토큰 폭증 (session 200+ turn 시) | session 50 turn 초과 | 메인 prompt에서 "최근 N개" cap | session 종료 시 archive로 이동 (별도 PD로 분리) |
| C3 | inject scope 메인 misclassify (Nova 슬롯에 이전 finding 주입 등) | Nova 발언이 의외성 상실 | 메인 prompt 템플릿에 Nova=null inject 명시 | Riki 검증 발언에서 contamination flag |
| C4 | 페르소나 파일이 실제로 자동 inject되지 않음 (K4 거짓) | PD-044 박제 후 다음 세션에서 신규 정책이 무시됨 | 본 세션 Dev 단계에서 K4 falsification probe(빈 prompt + 페르소나만으로 호출해 Continuity 블록 인지 여부) | K4 거짓 시 PD-044 박제를 *메인 prompt 표준 템플릿*으로 이전 — 페르소나 박제는 documentation 가치만 |
| C5 | scratchpad 디렉토리 권한 차단 | `memory/sessions/scratchpad/` mkdir 실패 | 표준 경로(`memory/`) 하위라 권한 자연 허용 — 실측 시 즉시 발견 | 임시 fallback `tmp-scratchpad/` |
| C6 | 사칭 hook false positive (메인이 정당하게 Arki 헤더 인용) | 메인 발언이 "Arki:"로 시작하는 경우 hook이 실 Task subagent_type=arki invocation 부재 검출 | hook 검증 기준을 "turns[].role 추가 직전 직전 1턴 내 Task tool_use 매칭"으로 좁힘 | false positive 시 warning만, 차단 X |

---

## Section 5. 구조적 실행계획 (executionPlanMode=plan 의무)

### Phase 분해

**Phase 1 — Spec 동결**
- scratchpad 스키마 결정·박제 (필드: sessionId, role, turnIdx, finding[], summary, ts)
- inject scope 정책 결정·박제 (Ace=session 누적 / Arki·Riki·Fin=topic+직전 같은 역할 turn / Edi·Dev=직전 turn / Nova=null)
- 박제 위치 결정 (옵션 2: 메인 prompt 템플릿 + 페르소나 Continuity 블록 분리)
- decision_ledger D-NNN 박제 (PD-033 + PD-044 + PD-043 hook 골격)

**Phase 2 — K4 falsification probe (선행 게이트)**
- 빈 prompt + 페르소나 본문만 inject한 더미 서브 호출로 페르소나 자동 인지 여부 실측
- 결과에 따라 Phase 3 박제 위치 분기 (페르소나 vs 메인 prompt 템플릿)

**Phase 3 — 페르소나 8개 + 메인 prompt 템플릿 박제**
- Phase 2 결과 반영
- `memory/roles/personas/role-*.md` 8개에 Continuity 계약 블록 일관 추가
- 메인 prompt 표준 템플릿 신규 파일 (`memory/shared/subagent_dispatch_template.md`) 생성·inject scope 표 박제

**Phase 4 — scratchpad I/O 인프라**
- `memory/sessions/scratchpad/` 디렉토리 생성 + `.gitkeep`
- 페르소나 Write 계약에 turn-append 동작 박제 (서브 자가 write — hook 의존 X)
- 메인 prompt 템플릿에 직전 scratchpad Read·inject 절차 박제

**Phase 5 — PD-043 사칭 검증 hook**
- session-end-finalize.js에 turns[].role ↔ 직전 Task tool_use 매칭 검증 함수 추가
- false positive 회피: warning만, 차단 X

**Phase 6 — resolveCondition 실증 dry-run + regression**
- 본 세션 안에서 Arki 3회 호출 — turn 1(현재) → turn N(scratchpad inject) → turn M(누적 finding 인지) F-NNN 유지 여부 실측
- 실패 시 Phase 4로 롤백

**Phase 7 — Edi 컴파일·세션 종료**
- 결정 박제·페르소나·hook 변경 이력·dry-run 결과 통합

### 의존 그래프
```
Phase 1 (spec) → Phase 2 (K4 probe)
                   ↓
              [K4 결과 분기]
                   ↓
Phase 3 (박제) → Phase 4 (I/O) → Phase 5 (사칭 hook)
                                   ↓
                             Phase 6 (dry-run)
                                   ↓
                             Phase 7 (Edi)
```
Phase 2가 모든 박제 작업의 전제. K4 거짓 시 Phase 3 박제 위치 자체가 변경 → 가장 큰 분기점.

### 검증 게이트
- **G1 (Phase 1 통과)**: spec이 8역할 페르소나 + 메인 prompt 템플릿 양쪽에 일관 적용 가능한가. 검사: spec 문서 1개에 모든 inject scope/필드/경로 명시.
- **G2 (Phase 2 통과)**: K4 falsification probe 실측 결과 명시(true/false). 결과에 따라 Phase 3 분기 명시.
- **G3 (Phase 4 통과)**: scratchpad 파일 1개 실제 write·read 성공. 검사: `memory/sessions/scratchpad/session_123/arki/turn_1.json` 존재.
- **G4 (Phase 5 통과)**: 사칭 hook이 본 세션 turns[]에 false positive 0건. 검사: hook 출력 로그.
- **G5 (Phase 6 통과)**: Arki 3회 호출 시 3번째 호출이 turn 1·turn N의 finding을 명시 인지. 검사: 3번째 발언 본문이 본 발언의 옵션 2·G1 같은 식별자를 인용.

각 게이트는 자가평가 폐기 영역(D-092) 회피 — 실측 가능 출력물로만 판정.

### 롤백 경로
- Phase 2 실패(K4 거짓) → Phase 3 박제 위치를 메인 prompt 템플릿으로 이전, 페르소나 Continuity 블록은 documentation 가치만으로 유지
- Phase 4 실패(권한·경로 문제) → tmp-scratchpad/ fallback, 본 토픽 종결 후 별도 PD로 분리
- Phase 6 실패(F-NNN 유지 안 됨) → Phase 4 인프라 점검·재시도. 2회 실패 시 옵션 3(짓지 않음)으로 단계 후퇴, 메인 prompt만으로 운영
- 어떤 Phase든 실패 시 decision_ledger 박제 차단 (D-072 falsification probe 게이트 준수)

### 중단 조건 (Master 개입 트리거)
- K4 falsification probe 결과 해석에 ambiguity 있을 때
- scratchpad 누적 디스크 우려 (session 50 turn 초과 등 — 본 세션엔 미해당)
- 옵션 2 vs 옵션 3 사이에서 메인 부담 vs 인프라 비용 선택이 Master 영역으로 판단될 때
- Phase 6 dry-run에서 K2 자체가 거짓으로 드러날 때 (전 토픽 무효 — 본 토픽 종결 + 신규 토픽 오픈)

---

## 자기감사 1라운드 (자발)

Master "한번 더" 압박 없이 자가 점검:

1. **다축 검증 의무** (`feedback_arki_full_system_view`) — 4축(코드·hook·페르소나·feedback 정책) 모두 봤음. ✅
2. **mitigation+fallback 의무** (`feedback_arki_risk_requires_mitigation`) — Section 4 표 6건 모두 mitigation+fallback 병기. ✅
3. **금지어 v0** — 본 발언에 `D+N일`/`N주차`/`MM/DD`/`담당자:`/`N시간`/`공수` 없음. Phase 명만 사용. ✅
4. **짓지 않음 옵션** — 옵션 3으로 검토함. 권고는 아니지만 fallback 경로로 유지. ✅
5. **Dev 양방향 협의** — Phase 4·5 인프라 변경은 Dev와 합의 필요. spec 동결(G1) 이전 변경 가능. ✅
6. **Ace 권고와의 차이** — A2-α inject scope의 박제 위치 1군데 변경. *맹목 인수 거부* 명시. ✅

**자가 점검 결함 1건 발견**: 옵션 2의 메인 prompt 표준 템플릿 신규 파일 경로(`memory/shared/subagent_dispatch_template.md`)가 *Master 명시 승인 없이* 신설됨. Master에 위치 결정 1줄 확인 필요 (Phase 1 G1 게이트의 일부로 처리).

---

## Master 결정 필요 (1건만)

**옵션 1(Ace 권고 그대로) vs 옵션 2(Arki 박제 경로 명확화)** 중 택일.
- 옵션 1: inject scope를 페르소나에 함께 박제. K4 자동 inject 거짓이면 작동 안 함 위험.
- 옵션 2(Arki 권고): inject scope는 메인 prompt 템플릿에, write 계약만 페르소나에. K4 거짓이어도 작동.

본 결정은 Phase 2(K4 falsification probe) 결과 보고 자동 분기 가능 — 즉 Master가 "옵션 2로 진행 + Phase 2 결과로 자동 결정"이라 답하면 본 발언에서 게이트 통과.

---

```yaml
# self-scores
aud_rcl: Y
str_fd: 3
spc_lck: N
sa_rnd: 1
```

**다음 발언자 추천**: Fin (Arki 실행계획 contamination 감사 + 비재무 비용 평가)
