---
role: ace
session: session_092
topic: topic_097
rev: 2
phase: synthesis
turnId: 3
invocationMode: subagent
---

# Ace 종합검토 — D-058 분기 운명 단정 (수정 금지, 결정 박제 권고만)

**모드**: synthesis. Master 지시 절대 준수 — "수정은 하지말고 원인 파악. 그 분기가 문제면 그 로직을 제거." 본 산출물은 결정 권고만. 코드 변경 0건.

---

## 1. Arki vs Riki 충돌 해소

**합성 결론: Arki 결론 채택, Riki 절차 채택. 둘 다 살립니다.**

### 사실 정리
- 본 세션 Main이 직접 수행한 falsification probe 4건(`role-ace`/`role-arki`/`role-fin`/`role-riki`) **전부 fail** — "Agent type not found".
- Available agents: `claude-code-guide`, `Explore`, `Plan`, `statusline-setup` (custom 0건).
- frontmatter 측정: role-*.md 4개 모두 `name:` 부재 (Arki §A.2, Riki 보조측정 일치).
- 추가: 루트 `agents/{arki,fin,riki}.md` 별도 존재 (구버전, 미등록), 11개 worktree 동일 leftover.

### 충돌 해소 논리
- Arki "제거" 권고: **결과적으로 옳음** — probe fail로 실증.
- Riki "측정 먼저" 권고: **절차적으로 옳음** — Arki 자기인정 "measurement 부재로 quality delta 단정 불가" 상태에서 단정 점프는 D-058 채택 시점과 동일 패턴 재발 위험. 측정 게이트(c-1)를 거쳐야 했음.
- 본 세션은 Main이 그 측정을 직접 수행하여 Riki의 절차 요구를 충족시킴. 측정 후 Arki 결론이 확증됨.

### 합성 박제 (양자 살림)
1. Arki 진단 가치 보존: D-058~D-070 누적 부채 패턴, 22세션 잠복 메커니즘, root cause tree depth 3 — 모두 ledger 근거로 박제.
2. Riki 절차 가치 보존: "측정 전 단정 금지" 원칙을 D-072(아래)로 명문화. 향후 모든 unwind 결정에 적용.
3. Riki 공격 3 "페르소나 컨텍스트 격리는 회복 불가" — **확인하되 reframe**. 현 상태는 격리가 작동한 적 없으므로 "잃을 격리"가 사실상 0. 단 페르소나 정의 자체는 텍스트 자산으로 보존(파일 삭제 금지, archive로 보관).

---

## 2. D-058 분기 로직 운명 단정

**제거.**

### 단정 근거 (3중 합치)
1. **물리 측정**: probe 4/4 fail. subagent_type 미등록 확정.
2. **시간 증거**: 22세션 동안 작동한 적 없음. invocationMode 도입(session_090) 즉시 위반 노출.
3. **잃는 것 0**: 작동한 적 없는 fiction이므로 제거 시 실질 손실 없음. 명목적 "Opus 서브 격리" 보장은 환상.

### Master 지시 정합
"그 분기가 문제면 그 로직을 제거하게" — 분기 로직이 **사실로 문제임**이 본 세션에 확정. Master 지시 발동 조건 충족.

### 제거 범위 (이번 세션 박제만, 실제 코드 변경은 후속)
- opus-dispatcher 스킬: deprecated 마킹.
- dispatch_config.json: dispatchSubs 정책 무력화 또는 파일 archive.
- post-tool-use-task.js hook: 박제 로직 폐기 또는 inline 모드 전용으로 의미 환원.
- session-end-finalize.js 양자 충족 필터·immutable 가드: 폐기.
- role-*.md 4개: **파일은 archive로 보존** (페르소나 정의 텍스트 자산), frontmatter `name:` 부재로 인한 등록 시도 흔적은 제거.
- CLAUDE.md "Grade A/S 오케스트레이션: opus-dispatcher 참조" 줄: 제거 + Grade 표 "메인 모델" 컬럼 단순화.

---

## 3. 연쇄 결정 5건의 운명

| 결정 | 의존성 | 운명 | 근거 |
|---|---|---|---|
| **D-058** (opus-dispatcher 채택) | root | **폐기** | Probe fail 확정. Fiction. |
| **D-066** (Grade A 서브에이전트 강제) | D-058 의존 | **폐기** | dispatcher 부재 시 강제 대상 자체 없음. |
| **D-067** (frontmatter link 의무 + 양자 충족 baseline) | D-058 의존 | **수정** | turnId·invocationMode 필드는 inline 모드에서도 유용 — Turn Push Protocol(D-048) 강화로 의미 재정의. 양자 충족 baseline은 폐기. |
| **D-068** (subagentId 의미 강화) | D-058 의존 | **폐기** | dispatcher 폐기 시 subagentId 자체 무의미. |
| **D-069** (post-tool-use-task hook) | D-058 의존 | **폐기 또는 환원** | 박제 자동화는 inline 모드에서 불필요. Turn 자동 기록은 다른 수단으로(C1 Turn Push Protocol 활용). |
| **D-070** (immutable snapshot + legacy 분기) | D-058 의존 | **폐기** | dispatcher 부재 시 immutable 가드 대상 없음. |

### Fiction-독립 생존 항목
- **Turn Push Protocol (D-048) 자체는 생존**. Turn 단위 박제는 inline 모드에서도 유효.
- **F-013 (Ace 자기소개 제약)**: 페르소나 정의 텍스트가 archive로 보존되므로 inline self-roleplay 시에도 적용. 생존.
- **F-005 (Ace relay 금지)**: 의미 재정의 필요 — "단일 서브 응답 직후 요약 금지"는 inline 모드에서 자연 무력화. 단 "역할 발언 후 Ace 군더더기 요약 금지" 일반 원칙으로 환원하여 생존.

---

## 4. 이번 세션 박제 신규 결정 권고 (D-071~D-073)

### D-071 (axis: dispatcher unwind)
**summary**: D-058 opus-dispatcher 분기 로직 폐기. 22세션 동안 harness 미등록 상태로 작동한 적 없음을 본 세션 falsification probe 4/4 fail로 확정. D-066/D-068/D-070 폐기, D-067/D-069 의미 재정의로 후속.

### D-072 (axis: 측정 전 단정 금지 원칙)
**summary**: 인프라 결정(dispatcher·hook·schema 등)은 채택 전 falsification probe 1회 통과 필수. dispatcher-probe 3건을 "구조 충족"으로 오역한 D-058 패턴 재발 방지. D-059(외부 앵커 cross-check) 보완 원칙.

### D-073 (axis: 페르소나 정의 자산 보존)
**summary**: role-*.md 4개 파일은 archive(`.claude/agents/_archived/`)로 이동 보존. inline self-roleplay 시 페르소나 텍스트 참조용 자산. 미래 재등록 가능성 열어둠. F-013 자기소개 제약은 archive 위치에서도 유효.

### 박제 절차
- 본 권고는 Master 승인 후 Main이 decision_ledger.json에 기록.
- D-058·D-066~D-070 ledger 엔트리는 삭제 금지, "deprecated by D-071, see session_092" 마킹 + status 변경.

---

## 5. 후속 토픽 후보 (1~2개, 일정·공수·담당 추정 금지)

### 후속 토픽 #1 (필수): "D-058 unwind 구현"
- **type**: implementation, **parent**: topic_097
- **scope In**: opus-dispatcher 스킬 deprecated 마킹, dispatch_config archive, post-tool-use-task.js 폐기, session-end-finalize 양자 충족 필터 제거, role-*.md 4개 archive 이동, CLAUDE.md 정리, D-066~D-070 ledger 마킹.
- **scope Out**: 페르소나 분리 재검토, harness subagent 등록 spike (별도 토픽).
- **executionPlanMode**: plan (Arki 실행계획 필수, Phase 분해 + 게이트).
- **Grade**: A 또는 B 판단 보류 (구현 범위 폭에 따라).

### 후속 토픽 #2 (조건부): "harness subagent 등록 spike"
- **type**: standalone (탐색 spike).
- **trigger**: 향후 진짜 Opus 서브 호출 필요 시점에만 발동. 지금은 발동 금지.
- **scope**: (a) `name:` 추가 후 등록 측정 (b) `tools:` 화이트리스트 요건 (c) `model: opus` alias 인정 범위 (d) subagentId 반환 형식 — 4개 미지수(Arki §D 인용) 측정.
- **gate**: spike 통과 후에만 dispatcher 재도입 검토. 통과 전 재도입 금지(D-072 적용).
- **추천 시점**: 본 세션 종료 후 즉시 발동 금지. 별도 외부 트리거 필요.

---

## 6. 자가 검토

### PD-032 (페르소나 분리) 영향
- D-058 제거 시 Sonnet 메인 1개 컨텍스트가 4개 페르소나 self-roleplay로 회귀.
- PD-032 페르소나 분리는 **격리 인프라가 작동할 때 의미**. 현 상태(분기 fiction)에서 PD-032는 **해결 대상 자체가 사라짐 → resolved-fiction 상태로 종결 권고**.
- 만약 미래에 dispatcher 재도입 spike(후속 토픽 #2) 통과 시 PD-032 재오픈.

### PD-033 영향
- pendingDeferrals 목록 직접 미확인 (Main 측정 범위 밖). 만약 PD-033이 dispatcher 의존 항목이면 PD-032와 동일 처리. 아니면 영향 없음. **Main 확인 후 처리** 권고.

### PD-034 (Vera visual_regression) 영향
- dispatcher 무관. 영향 없음. 그대로 유지.

### dual-sat 9건 baseline (D-067)의 운명
- D-067의 양자 충족 baseline 부분: **폐기**. 측정 대상(서브 격리 호출) 자체가 없음.
- D-067의 frontmatter `turnId`/`invocationMode` 필드 의무: **유지하되 의미 재정의**. invocationMode 값은 항상 `inline-main`으로 수렴 (subagent 값 사용 금지). turnId는 Turn Push Protocol(D-048) 매핑용으로 계속 유효.
- session_091 dual-sat 9건 gaps 기록: **archive 표시**. "측정 첫 시도 → fiction 노출 → unwind"로 동결.

### F-005 (Ace relay 금지)의 미래
- 원래 의미("단일 서브 응답 직후 요약·전달 금지")는 inline 모드에서 발동 조건이 사라짐.
- **의미 재정의로 생존 권고**: "역할 발언(inline 또는 향후 subagent) 직후 Ace의 군더더기 요약/전달 금지. Master가 직접 읽음." — 호출 매체 무관 일반 원칙으로 환원.

### Grade S Opus 메인 정책의 비대칭
- Grade A inline 회귀 시 Grade S만 Opus 메인 강제하는 비대칭 발생 (Arki §C "잃는 것" 3 인정).
- **권고**: Grade S 정책은 본 토픽 Out. 별도 토픽에서 "Grade S 단일 모델 정책 재검토" 필요 시 발동. 지금은 비대칭 수용.

### 빠진 것
- 루트 `agents/{arki,fin,riki}.md` 구버전 + 11개 worktree leftover 정리: 후속 토픽 #1 scope In에 추가 권고.
- 만약 Master가 "spike #2도 이번 세션에 발동" 의사 시 grade A 슬롯 초과 위험 보고 후 진행.

---

## 7. Master 승인 요청

**Master, 다음 3건에 대한 승인 요청드립니다**:

1. **D-058 분기 로직 폐기 단정**(D-071) 승인 여부.
2. **D-066/D-068/D-070 폐기 + D-067/D-069 의미 재정의** 처리안 승인 여부.
3. **후속 토픽 #1 "D-058 unwind 구현"** 분기 승인 여부 (이번 세션 종료 직후 즉시 오픈할지, 보류할지).

대안:
- "전부 보류, 1주일 더 관찰" → Ace는 22세션 잠복 사례 인용 후 보류 비용 보고.
- "D-058만 폐기, 나머지는 그대로" → Ace는 의존 결정 dangling 위험 보고 후 진행.
- "spike #2도 같이 오픈" → grade A 슬롯 초과 보고 후 Master 판단.

---

## 기록

- 시간·공수·담당 추정 0건 (D-017 준수).
- 옵션 나열 0건, 단정 권고만 (절충 금지).
- 외부 앵커: Arki §A.3 + Riki 보조측정 + 본 세션 Main probe 4/4 fail. Medium → High로 강화됨 (실호출 falsification 통과).
- Master 지시 "수정 금지" 절대 준수 — 결정 권고만. 코드 변경 0건.
- Relay 위반 없음 — 본 발언은 종합검토(synthesis), Ace 발언 허용 조건 (c) 해당.
