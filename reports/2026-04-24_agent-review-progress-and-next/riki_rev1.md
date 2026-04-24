---
role: riki
session: session_092
topic: topic_097
rev: 1
phase: cross-attack
turnId: 2
invocationMode: subagent
---

# Riki rev1 — Arki 진단 + Ace 프레이밍 교차공격

## 외부 앵커 시도 (D-059)

Anthropic Claude Code subagent 등록 규약 외부 검색: 본 서브에이전트 컨텍스트에서 직접 fetch 불가. Arki rev1 §A.3이 인용한 동일 메모리(`name:` 필수, `description:` 필수)에 의존. **외부 앵커 강도: Medium (Arki와 동일). 독립 cross-check 부재 명시.**

보조 직접 측정 1건: `.claude/agents/role-{ace,arki,fin,riki}.md` 4개 파일 frontmatter Read 확인 — 4개 모두 `model: opus` + `description:` 만 보유, **`name:` 필드 부재** (role-arki.md line 1~4 직접 확인). 이 점은 Arki 진단 §A.2와 일치.

---

## 공격 1. 가정 1 falsification — "harness 등록 부재" 단정의 다른 해석

**대상**: Ace ace_rev1.md line 93 `🔴 가정 1: Main이 보고한 "Agent 툴 dispatcher가 role-ace 등을 인식하지 못한다"가 실제 사실이다.` + Arki rev1 §A 단정 "(iii) 문서적 가이드".

### 공격 강도: 🟡 moderate

### 증거 인용
- 본 세션 Main 관찰(Arki rev1 §A.2 인용): "본 세션 harness가 노출한 등록 subagent (`claude-code-guide`, `Explore`, `Plan`, `statusline-setup`) — 모두 다른 경로(plugin/system)에서 등록. role-* 4개는 이 목록에 **부재**." 
- 그러나 Arki 본인이 §A.3에서 "정확한 등록 정책(`name` 누락 시 파일명 fallback 여부)은 외부 문서 1차 확인만으로 100% 단정 불가" 인정. **앵커 강도 Medium이라고 자기 명시.**

### 다른 해석 가능성 (falsification 후보)
1. **파일명 fallback 가능성**: harness가 `name:` 부재 시 파일명(`role-arki`)을 subagent_type으로 자동 등록하는 정책이 있다면, 본 세션 ToolSearch 노출 목록에 미등장하는 것은 "노출 정책 차이"일 뿐 "등록 부재"가 아닐 수 있음.
2. **노출 스코프 차이**: 본 Riki 세션의 deferred tools 목록은 ToolSearch 통과 도구만 표시. Task의 subagent_type 후보는 별도 enumeration 경로일 가능성 — 본 세션에서 직접 측정 불가.
3. **dispatcher-probe 1회 실재**: Arki §A "단정"에서도 "Probe 1~3 1회" 격리 호출 증거를 인정. 0건이 아닌 **1회 양성 증거** 존재.

### Master 의사결정 영향
가정 1을 "확정된 사실"로 두고 제거 수순으로 직진하면, falsification probe 1회로 뒤집힐 수 있는 결정 위에 D-058~D-070 6개 결정 폐기를 쌓게 됨. **Ace 본인이 (c-1) "1회 falsification probe" 우선을 명시했음에도 Arki는 이를 건너뛰고 제거 권고로 점프.** 측정 게이트 미통과 상태에서 제거 단정은 같은 패턴 재발(D-058 채택 시 측정 부재).

---

## 공격 2. 가정 2 falsification — session_091 7회 Agent 호출의 실체

**대상**: Ace ace_rev1.md line 94 `🔴 가정 2: session_091의 7회 Agent 호출이 박제된 reports/turnId·invocationMode가 실제 서브에이전트 격리 호출의 증거로 채택 가능하다.`

### 공격 강도: 🔴 critical

### 증거 인용
- Arki rev1 §A 보조 증거: "메인이 `subagent_type: "role-arki"` 입력으로 Task를 호출했을 때 (a) harness가 fallback해서 general-purpose로 실행 + (b) hook은 prompt 메타만 보고 turn을 박제 — 이 조합이면 **'박제는 되지만 실등록은 아님'이라는 dual-sat 9건의 정확한 패턴이 발생**."
- Arki rev1 §B 3차 원인: "session_090에서 invocationMode 도입과 동시에 **첫 측정에서 즉시 inline-main 3건 검출** — 22세션 잠복은 측정 부재가 유일한 잠복 메커니즘."
- post-tool-use-task.js line 88~93 (Arki §D.3 인용): subagentId fallback chain이 `auto-{ts}` 합성으로 떨어지면 "subagentId 실재성 0 (cosmetic ID)".

### 단정
session_091의 7회 Agent 호출이 **격리 호출**이었다는 명제는 **현 박제 데이터만으로는 입증 불가**. invocationMode·turnId·reportExists는 (a) 메인 self-roleplay + hook 박제 (b) 진짜 서브 격리 호출 — 양쪽 모두에서 동일하게 생성됨. 즉 **현 baseline은 두 시나리오를 구별할 변별력 0**.

### Master 의사결정 영향
"D-067 양자 충족 baseline이 작동한다"는 명제 자체가 미입증. baseline 조건 cond_reportExists/cond_turnIdMatch는 메인 self-roleplay에서도 통과 가능. **dual-sat 9건이 baseline 빡세서 발생한 것이 아니라, baseline이 너무 느슨해서 위반조차 격리 호출 여부와 무관하게 발생한 것**. → 공격 4와 정반대 결론.

---

## 공격 3. Arki "제거" 단정 권고 반박

**대상**: Arki rev1 §E "**제거 (C 시뮬레이션 채택).**"

### 공격 강도: 🔴 critical

### 증거 인용
- Arki §C "잃는 것" 1: "잠복 22세션 동안 이미 사실상 그 품질로 운영되고 있었으므로 '잃음'의 실체는 명목뿐일 수 있음 — **measurement 부재로 quality delta 단정 불가**."
- 즉 Arki 본인이 "잃는 것의 실체를 측정할 수 없다"고 인정한 상태에서 제거 단정. **측정 부재로 채택된 D-058을 비판하면서, 동일하게 측정 부재 상태에서 제거를 채택하는 자기모순.**
- ace_rev1.md Step 5: `executionPlanMode: conditional` + "(c-1) 측정 결과에 따라 후속 액션이 분기" — Ace는 측정 후 결정을 명시. Arki는 이 conditional 게이트를 무시하고 결론 점프.

### 제거 시 사실상 회복 불가 항목 (적어도 1개)
**페르소나 컨텍스트 격리.** role-{ace,arki,fin,riki}.md 4개 파일의 페르소나 정의(Hickey/Taleb/Ramsey/etc)·자기소개 제약(F-013)·Write 계약·frontmatter 의무는 **단순 텍스트 프롬프트가 아니라 22세션 누적 운영 규약**. 제거 후 Ace 단일 인스턴스 inline 수행으로 회귀하면:
1. **컨텍스트 오염 영구화**: Sonnet 메인 1개 컨텍스트가 4개 페르소나를 직렬 self-roleplay → 직전 역할 발언이 다음 역할에 누설(Riki가 Arki 직전 발언 본 채로 적대적 검증). 격리 0.
2. **F-005 (Ace relay 금지)의 원천적 무력화**: relay 자체가 메인 inline이면 항상 발생하는 구조가 됨. 회복 경로는 다시 dispatcher 도입 → 같은 인프라 재구축 비용.
3. **Grade S Opus 메인** 정책의 비대칭이 어색해진다 — Arki §C "잃는 것" 3에서 본인 인정. Grade S만 Opus 메인 강제하는 단일 모델 정책으로 단순화할 거면 **Grade A 품질 보장 메커니즘이 통째로 비어버림**.

### Master 의사결정 영향
제거 후 6개월 뒤 "Grade A 품질 부족" 판정 시 페르소나 격리 인프라를 처음부터 재구축해야 함. 그 사이 22세션 분 운영 규약(D-066~D-070)이 archive로 동결되어 컨텍스트 손실. 보존+falsification probe 비용 < 제거+재구축 비용.

---

## 공격 4. dual-sat 9건이 baseline 과잉 빡세서 발생한 측정 위한 측정인가

**대상**: Master 질문 의도("D-067 baseline 자체 재고 가능성").

### 공격 강도: ⚪ weak (폐기)

### 증거 인용
공격 2에서 도출한 결과가 정반대를 가리킴: baseline은 빡센 게 아니라 **너무 느슨**. cond_reportExists=true / cond_turnIdMatch=true가 메인 self-roleplay에서도 통과하면, 위반 9건은 "느슨한 baseline에서조차 통과 못한 케이스" = 진짜 결함 신호일 가능성이 더 높음.

### 폐기 사유 (반대를 위한 반대 금지 / 카운트 채우기 금지)
"baseline 너무 빡세서 측정 위한 측정" 시나리오는 본 세션 증거에서 지지받지 못함. 약한 항목으로 카운트 채우지 않음. **공격 2가 이 영역의 진짜 답.**

---

## Riki 단정

**Arki "제거" 권고: 반박.**

### 반박 사유 (단정형)
1. Arki 자기 인정 "measurement 부재로 quality delta 단정 불가" 상태에서 제거 단정은 D-058 채택 시점과 동일한 측정 부재 결정. 자기모순.
2. Ace conditional 게이트(`executionPlanMode: conditional` + (c-1) falsification 우선)를 무시하고 결론 점프. 오케스트레이션 위반.
3. 페르소나 컨텍스트 격리는 제거 시 사실상 회복 불가 (22세션 누적 운영 규약 + 컨텍스트 격리).
4. 가정 2(공격 2)에서 baseline 변별력 0이 드러남 — 즉 **dual-sat 9건은 D-058 폐기 근거가 아니라 baseline 재정의 근거**. Arki는 양자를 혼동.

### 대안 1개 (C/D 양자 모두 거부, 제3안)
**보존 + falsification probe 1회 + baseline 재정의 (B-prime).**

- **Step 1**: Ace ace_rev1.md (c-1) 그대로 — Agent 툴 1회 호출로 `subagent_type: role-arki` 실등록 여부 falsification. **이번 토픽 In, 1회만**.
- **Step 2 (probe 결과 분기)**:
  - probe 통과 (등록 사실) → D-058~D-070 보존. baseline은 cond_modelVerified(실제 Opus 4.7 인스턴스 token-log 검증) 1조건 추가하여 변별력 확보.
  - probe 실패 (등록 부재) → role-*.md 4개에 `name:` 추가 후 재호출. 2차도 실패면 **그때서야** 제거 토픽 분기.
- **Step 3**: 제거든 보존이든 측정 후 결정. 측정 전 단정 금지 (D-019 Ace 오케스트레이션 + Master 학습 원칙 외부 앵커 cross-check 의무 D-059).

### 슬롯 미달 (3 critical, 1 moderate, 1 폐기)
반대를 위한 반대 금지 원칙 준수. 곁가지 폐기. 추가 리스크 없음.

---

## 기록

- 외부 앵커 강도 Medium 명시 (D-059).
- 원문 인용 6건 (Arki §A·B·C·D·E + Ace Step 5).
- 단정형 유지. 어중간 절충 0건.
- 시간·공수·담당 추정 0건 (D-017).
