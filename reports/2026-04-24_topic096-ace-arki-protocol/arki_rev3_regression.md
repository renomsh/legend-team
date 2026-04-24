---
role: arki
topic: topic_096
session: session_091
rev: 3
date: 2026-04-24
phase: regression-diagnosis
invocationMode: subagent
---

# Arki rev3 — Regression 진단 (두 증상 시계열)

**범위**: Master 새 질문 — "전에는 안 그랬는데 왜 이러지? 원래부터 이랬던 거야?" 두 증상((a) 서브 미발동, (b) 세션 단절)을 시계열로 단정. 추정 금지, 파일 인용만.

---

## Section R-1. 시계열 그래프

| 마일스톤 | 세션 구간 | 서브 메커니즘 정의 상태 | 실제 서브 호출 | 누적 메커니즘 상태 |
|---|---|---|---|---|
| M1. 시스템 부트 | session_001~018 | 정의 없음. 단일 Main만 발언 | 0 | role_memory 파일은 v0.1.0부터 존재(빈 파일). evidence_index.json 빈 상태 (line 9 인용) |
| M2. Ace 오케스트레이터 선언 | session_018 (D-019, 2026-04-15) | "Ace는 orchestrator. 역할 호출 순서·횟수는 Ace 판단" 선언만. Task 툴 강제 없음 | 0 (모두 inline) | role_memory 갱신 의무 체크리스트화. session_007 evidence E-009: "Riki/Fin/Editor role memory가 session_002 이후 갱신되지 않음" |
| M3. Turn 구조 도입 | session_047~049 (D-041~D-048, 2026-04-19~20) | turns[].role/phase 박제. **invocationMode 필드는 부재**. Task vs inline 구분 불가 | 0 (계속 Main inline) | turns 배열 누적 시작. validate-session-turns.ts 도입 |
| M4. Dispatcher 선언 | session_068 (D-058, 2026-04-22) | **opus-dispatcher 스킬** 신설. "Sonnet Main + Opus 서브" 계약 선언. Schema 강제 없음, 스킬 문서뿐 | session_068에서만 P4 검증 통과 보고. 이후 22세션 동안 실제 호출 추적 필드 없음 → **카운트 자체 불가** | F-패턴 미도입 (evidence_index line 158: "F-태깅 프로토콜 도입 (session_090, D-066)") |
| M5. PD 자동전이 | session_088 (D-064~D-065) | Resumption 프로토콜 강화. dispatcher와 무관 | (해당 없음) | PD-030 신설 (auto-transition) |
| M6. 자백 박제 | **session_090 (D-066, 2026-04-24)** | **invocationMode 필드 신설 (Schema L1)** + finalize hook gate (L2) + dispatch_config 4필드 (L3). evidence_index에 F-001~F-013 태깅 도입 | session_090 turn 5/7/9 — **시스템 사상 최초 측정된 서브 호출 3회**. 같은 세션 turn 2/3/6 — 측정된 inline-main 위반 3회 | scratchpad 디렉토리 **여전히 부재**. role_memory만 존재 (read-on-start, write-on-end 단일 경로) |
| M7. 현재 (session_091) | 2026-04-24 | 본 토픽 topic_096 진단·설계 진행 중 | 본 세션 진행 중 (서브 호출됨) | scratchpad 미구현 |

**요약**: 89개 세션 동안 invocationMode 자체가 schema에 없음 → "서브 호출 vs inline" 구분 자체가 사후 측정 불가능했음. session_090이 첫 측정 세션.

---

## Section R-2. 두 증상 시계열 단정

### (a) 서브 미발동

**단정**: **회귀가 아님. 처음부터 미작동. session_090이 첫 측정 baseline.**

근거:
- session_001~067: opus-dispatcher 스킬 자체가 없음. "서브 호출"은 시스템 개념이 아니었음. 모든 발언이 Main inline = 정상 상태였음.
- session_068 (D-058): Dispatcher 선언. 스킬 문서에 "Sonnet Main + Opus 서브" 명시. 단 — Schema에 invocationMode 필드 없음, hook 없음, settings.json 없음. **선언만 있고 강제 없음**. P4 검증은 session_068 1세션에 한정.
- session_069~089 (21세션): 스킬 invoke 추적 필드 부재. session_index.json 어느 세션도 invocationMode 기록 없음(grep 결과 line 3237~3302 = session_090 한 세션만 등장). 즉 "서브가 발동했다"는 증거도, "안 했다"는 증거도 schema상 불가.
- session_090: invocationMode 필드 신설 → 첫 측정. turns 11개 중 subagent 3회 (turn 5/7/9) + inline-main 3회 (turn 2/3/6) + inline-allowed 4회 + 미분류 1회. **즉 측정 직후 위반이 즉시 가시화됨**.

**결론**: D-058 선언 이후 22세션은 "서브 미발동"이 아니라 "측정 불가 구간". session_090에서 측정 가능해지자 즉시 위반이 드러남. Master 체감 "전에는 됐다"는 (i) opus-dispatcher 선언 시점(session_068)을 작동 시점으로 기억하거나, (ii) Main inline이 자연스러워서 위반 인지가 없었던 상태.

### (b) 세션 단절

**단정**: **항상 그랬음. 단 한 번도 cross-instance scratchpad가 존재한 적 없음.**

근거:
- `memory/shared/scratchpad/` 디렉토리 검사 결과: **존재 자체가 없음** (Bash ls 결과 무출력). `memory/shared/scratchpad-archive/`도 없음.
- `memory/shared/` 디렉토리 mtime: Apr 22 08:41. scratchpad 관련 파일 0건.
- 누적 메커니즘으로 존재해 온 것: `memory/roles/{role}_memory.json` 9개 — 단 **세션 시작 read + 세션 종료 write 단일 경로**. 같은 세션 내 sub 인스턴스 간 공유 메커니즘 아님.
- D-051 (session_054, 2026-04-21) "3층 context 누적" 선언: "구현은 PD-020a/b/c로 분해 이연" — 즉 선언만 있고 구현 미완. PD-020b (save01~05/context_brief/session_contributions)도 미구현 흔적. `memory/shared/`에 해당 파일 없음.
- session_090 D-066 implementationNote: "서브에이전트 세션 지속성은 PD-032/033으로 이관" → 본 세션 직전까지 scratchpad는 **PD 상태로만 존재**, 실체 없음.

**결론**: cross-instance memory는 시스템 시작 이래 **단 한 번도 구현된 적 없음**. Master 체감 "전에는 누적됐다"는 role_memory.json (세션 단위 누적)을 instance 단위 누적으로 혼동했거나, D-051·D-058 선언 시점을 작동 시점으로 기억한 것.

---

## Section R-3. Master 체감 vs 사실 — 진단

세 시나리오 중 **(iii) 체감** 단정.

근거 종합:
1. **(a) 서브 미발동**: D-058 선언(session_068) 이전엔 메커니즘 부재 → 회귀 대상 자체 없음. 선언 이후 22세션은 측정 불가 → 회귀를 입증할 데이터도 없음. session_090 첫 측정에서 inline-main 3회 즉시 노출 → 처음부터 작동 안 했을 가능성이 압도적.
2. **(b) 세션 단절**: 파일 시스템상 scratchpad 부재 (이건 100% 단정). 어떤 세션에서도 instance 간 직접 공유가 일어난 적 없음.
3. master_feedback_log line 191 (session_068 직후 추정): "auto-model-switch 스킬이 단순히 /model 타이핑 안내만 하면 의미 없음. 원래 의도는 Sonnet이 메인으로 유지되면서 필요 시 Opus를 자동 호출(Agent 도구로 model: opus 서브에이전트)하는 구조였음. **현 구현은 의도와 불일치**." → Master 본인이 D-058 직후 "의도 불일치" 판단을 박았음. 즉 **Master가 "잘 됐다고 기억한 시점"은 사실 "의도와 불일치한 채 굴러간 시점"**.

따라서 "전에는 안 그랬다"는 사실이 아니라 **선언을 작동으로 기억한 체감**.

단, 부분 사실로 인정 가능한 것: session_068 1세션 P4 검증 보고에서 일시적으로 작동했을 가능성(D-058 value: "Probe 3건 통과"). 그러나 후속 21세션 측정 부재로 일관 작동은 입증 불가.

---

## Section R-4. 회귀 trigger

**단정: 회귀 아님 — 처음부터 미작동.**

다만 **"체감상 무너진 것처럼 보이는" 시점**을 굳이 지적하면:

- session_090에서 invocationMode 필드 도입 + Master가 직접 turn 2/3/6의 inline-main을 목격. **측정 가능해진 순간 = 위반이 가시화된 순간**. 이게 Master에게 "갑자기 무너진 것처럼" 보이는 trigger.
- 동시에 session_088~089에서 Master가 PD-005·PD-023 resumption 사고를 겪고(D-064~D-065) "기억 누적"의 부재를 본격 체감. 같은 세션 흐름에서 두 증상이 동시 표면화.

**즉 trigger는 시스템의 변화가 아닌, 측정 능력의 변화**. 회귀가 아니라 **드러남**.

---

## Section R-5. arki_rev2 설계와 정합성

**영향: 본질 변경 없음. 단 Child 토픽 spec 1행 보강 필요.**

arki_rev2 Section A~H는 "처음부터 미작동"을 전제로 설계되어 있음:
- Section B (Hard Pre-Gate): 새 메커니즘 신설 (회귀 복원 아님). 단정과 정합.
- Section C (Scratchpad): "scratchpad 디렉토리 자체가 없다"를 전제로 신설 설계. "이전엔 됐는데 무너진 것 복구"가 아닌 **신규 구축**. 단정과 정합.
- Section H A2: "기억의 상주 추상 표현 폐기, scratchpad-mediated로 명문화" — 본 진단(M2~M6에서 누적은 role_memory.json 단일 경로뿐이었음)과 정합.

**보강 1행 (Child-1·2 양쪽 implementationNote에 추가 권고)**:
> "본 spec은 회귀 복원이 아닌 신규 구축이다. session_090 이전 22세션은 invocationMode 측정 부재 구간이며 '이전엔 작동했다'는 baseline으로 사용 금지. baseline은 session_090 turn 5/7/9 (subagent 3건) + turn 2/3/6 (inline-main 3건) 측정값이다."

이 1행이 들어가야 미래 회귀 판정 시 잘못된 "전에는 됐다" 기준점이 재발하지 않음.

추가로 arki_rev2 Section F Q3 ("D-066 박제 패턴 아니라는 증거")에 본 진단 결과를 보강:
> "D-058이 22세션 선언만 있었던 이유 = Schema 측정 필드 부재. Child-1·2는 invocationMode·scratchpad 실체 파일을 동시 박제하므로 D-058과 동일 함정 회피."

---

## Section R-6. 정독 한계

확인 완료:
- session_index.json 전체 grep (invocationMode 11회 = session_090 1세션 한정 단정 가능)
- session_index.json gradeDeclared 시계열 라인 인용
- decision_ledger.json D-001~D-066 date·session 시계열
- evidence_index.json F-001~F-013 도입 시점 (line 158 명시)
- master_feedback_log.json grep (서브/inline/단절 키워드)
- memory/shared/ 디렉토리 ls (scratchpad 부재 확정)
- .claude/skills/ mtime (opus-dispatcher Apr 22 = session_068 D-058 시점 정합)
- .claude/hooks/ ls (PreToolUse hook 부재 확정)
- memory/roles/ ls (role_memory mtime — 세션 단위 갱신 흔적)

미확인:
- git log mtime 시계열로 역검증 — 본 진단은 파일 시스템 mtime + decision_ledger date 교차로 단정 충분, git log는 보강 자료 (필요 시 후속).
- session_001~067 각 세션 turns 내부 — invocationMode 필드 부재가 자명하므로 추가 정독 불요.
- Master가 "전에는 됐다"고 기억하는 구체 시점·세션 — Master 본인 확인 필요. 본 진단은 시스템 측 증거로 "체감"이라 단정하나, Master가 특정 세션·특정 동작을 명시하면 재판정 가능.
- save01~05 / context_brief / session_contributions 파일 명시적 부재 확인 — `memory/shared/` ls에 없음으로 단정 충분.

**ARKI_WRITE_DONE: reports/2026-04-24_topic096-ace-arki-protocol/arki_rev3_regression.md**
