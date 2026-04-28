---
role: ace
session: session_123
topic: topic_121
topicSlug: pd033-agent-continuity-design
turnId: 4
invocationMode: subagent
grade: A
date: 2026-04-28
rev: 2
recallReason: post-master
splitReason: "Master 비전 — 자동 inject 강제, 짓지 않음 옵션 폐기"
---

# Ace 종합검토 + Reframing — Master 비전 받아 결정축 재구성

Ace입니다. Master 비전 한 문장이 본 토픽의 무게중심을 옮겼습니다. rev1(옵션 분기) · Arki rev2(3-tier 신설) · Arki rev3(미니멀 안)을 정렬하고, 새 결정축으로 다시 짭니다. 절충안 없이 단일 권고합니다.

---

## Sec 1. Master 비전 확정

**원문**: "내가 원하는 건 최소 세션 안에서 각자의 이야기하 내용을 알고 이어서 의견을 주는 거야. 그게 안되면 여러번 호출의 의미가 없잖아."

**메인 해석 4점 검증·교정**:

| # | 메인 해석 | Ace 판정 | 교정 |
|---|---|---|---|
| 1 | "최소 세션 안에서" = session 단위 누적, 토픽 종결 전까지 모든 역할 발언 보유 | 부분 수정 | "최소 세션"은 *세션 수 최소화*가 본의. 즉 *지금 이 세션 안에서 토픽을 끝내라* — 다음 세션으로 넘기지 말라는 강제. 누적 범위는 토픽 종결까지 |
| 2 | "각자의 이야기한 내용을 알고" = 본인 직전 발언 + 다른 역할 직전 발언 모두 자동 보유 | 확정 | 핵심 — *직전 본인* + *직전 타 역할* 양쪽 자동. 메인이 매번 직접 박는 휘발성 의존 폐기 |
| 3 | "이어서 의견" = 누적 위에 빌드, 단순 답변 아님 | 확정 | rev1 옵션 1·2 분기는 폐기 — *누적 인지*가 전제이고 분기는 사후 |
| 4 | "여러번 호출의 의미" = 누적 없으면 호출 자체 무의미 / 인프라가 없으면 만들어서라도 = 짓지 않음 옵션 강제 폐기 | 확정 | Arki rev3 미니멀 안의 *짓지 않음* 부분은 본 비전과 정면 충돌. *짓지 않음*은 비전 부정의 명분이 됨 |

**비전 1문장 재선언**:

> **"같은 세션 안에서 토픽을 끝낸다. 매 서브 호출이 직전 본인·타 역할 발언을 자동으로 보유하도록 *시스템적으로 보장하는* 인프라를 짓는다."**

핵심어는 **자동·시스템적·짓는다**. 메인의 성실성에 의존하지 않습니다.

---

## Sec 2. 1·2차 권고 회고

**ace_rev1 (A1-β scratchpad)**:
- 살아남는 부분: ✅ 파일 기반 inspectable / ✅ 역할별 inject scope 차등 / ✅ A3-γ 3 PD 묶음 / ✅ A4-α 본 토픽 1세션 완결
- 폐기 부분: ❌ "메인이 다음 호출 시 prompt에 명시적으로 read+inject" — Master 비전 #2 "자동 보유"와 충돌. *명시적 수동 inject*는 메인 휘발성 의존
- 자가 진단: 1차 권고는 *경로 후보*는 옳았으나 *강제력 메커니즘*이 누락. mst_fr 0.10 — 본 권고가 자동화 축에서 수정됨

**Arki rev2 (3-tier 정식 + dispatch_template.md 신설)**:
- 살아남는 부분: ✅ Tier 1 페르소나 / Tier 2 캐릭터 / Tier 3 temp 3-층 분리 모델 / ✅ Tier 3 jsonl 스키마(turnIdx·findings·summary) / ✅ inject scope 차등 (Ace=session 누적, Arki/Riki/Fin=같은 topic N=3, Edi/Dev=직전 1, Nova=0) / ✅ B4 Tier 2 JSON 유지
- 미흡 부분: ⚠️ "메인이 dispatch_template.md를 매 호출 read하라"는 강제 인프라 미정의 (Arki rev3 Axis 4가 적발) — Master 비전과 직격 충돌. *시스템적 보장* 부재
- 폐기 부분: ❌ Tier 3 inject N=3 cap + summary 200자 cap — Master 비전 "각자 이야기한 내용을 *알고*"의 grain에 부족. 자기감사 라운드 시 200자로는 못 까는 케이스 (rev3가 직접 시연)
- 폐기 부분: ❌ 페르소나 60% 슬림화 — ROI 0이고 색채 손실 (rev3 Axis 3 옳음)

**Arki rev3 (미니멀 안)**:
- 살아남는 부분: ✅ Axis 1·4 진단 (rev2 dispatch_template.md 강제력 부재) / ✅ Axis 3 (페르소나 슬림화 ROI 0) / ✅ Axis 5 (PostToolUse(Task) hook 이미 turn 박제 자동화) / ✅ reports/{rev}.md 직전 N개 *전문* read가 summary cap보다 우월 / ✅ 페르소나 그대로 유지
- **결정적 폐기 부분**: ❌ "신설 0~1건 미니멀" — Master 비전 #4 "**없으면 만들어서라도**" 정면 충돌. 미니멀 안의 핵심 명제가 비전에 의해 무효화
- ❌ "메인이 reports/ 경로 명시 inject"가 표준 — 메인 휘발성 의존, 비전 #2 "자동" 위반
- ❌ "CLAUDE.md Subagent Dispatch Contract 섹션"은 자동 inject 아님 — 가이드 문서일 뿐, 시스템적 강제력 없음

**메인 분석 (Arki rev3 결함) 검증 결과**: ✅ 전부 적중. rev3는 *현 환경 관찰*을 *표준 인프라*로 착각했고, Master 비전을 받기 전 시점이라 *짓지 않음*을 미덕으로 봤음. 비전 받은 지금 그 미덕은 비전 부정의 명분이 됨.

**3 발언 종합 결론**:
- rev1 옵션 분기 → 폐기 (옵션 전 단계에서 *자동화 축* 누락)
- rev2 3-tier 모델 → 골격 유지, 강제력 인프라 보강
- rev3 미니멀 안 → 진단(Axis 1·3·4·5)은 살리고 결론(짓지 않음)은 폐기

---

## Sec 3. 새 결정축 재구성 (C-축, 4건)

### C1. 자동 inject 메커니즘 — *어떻게 강제할 것인가*

| 옵션 | 설명 | 트레이드오프 |
|---|---|---|
| **C1-α: PreToolUse(Task) hook이 prompt에 자동 prepend** | Agent tool 호출 직전 hook가 stdin tool_input.prompt를 가로채 표준 dispatch 블록 + 직전 reports/·temp/ 경로 inject + 페르소나 read 명령 prepend → exec | (+) 코드 레벨 강제 — 메인 휘발성 무관. (+) 비전 #2 "자동" 정합. (+) hook 1개로 8역할 일관. (−) Claude Code spec이 PreToolUse prompt mutation 허용하는지 실측 필요 — G1 게이트 |
| **C1-β: 메인 dispatch 코드 표준화 + 실패 시 finalize 검증** | 메인 prompt에 표준 블록 박는 *함수 형태* 표준화 + 누락 시 finalize hook가 gap 박제 + 다음 세션 경보 | (+) spec 의존 0. (−) **메인 휘발성 의존 — 비전 정면 충돌**. 검증은 사후, 강제 아님. (−) Arki rev3 미니멀 안과 사실상 동일 |
| **C1-γ: 페르소나 frontmatter import 메커니즘** | 페르소나 frontmatter에 `import: dispatch-contract.md`, 메인이 import resolver 통해 합쳐 read | (−) import resolver 신규 인프라. (−) "메인이 합쳐 read"가 다시 메인 의존 — 비전 위반 누적 |

**Ace 강한 권고**: **C1-α PreToolUse(Task) hook**.

근거 3가지:
1. *시스템적 강제*는 코드 레벨에서만 가능. 문서·prompt 표준은 휘발성 → 메인이 압축·forget하면 무력 (rev3 Axis 4 진단 그대로 살림).
2. PostToolUse(Task) hook이 이미 작동 (turn 박제 실측) — *PreToolUse도 같은 메커니즘으로 동작 가능*이 합리적 가설. spec 미허용이면 그때 fallback. *없으면 만들어서라도* 비전이 spec 한계 도전을 정당화.
3. hook 1개로 8역할 일관 강제. dispatch 표준 변경 시 hook 본문 1곳 수정. DRY 정합.

**Spec 미허용 시 fallback**: PostToolUse(Task) hook가 *이미 호출된 서브 응답*을 검사해 누락 시 다음 호출 전 메인에게 재시도 요청 — 차선이지만 메인 휘발성 일부 차단. 그래도 C1-α가 가능하면 그것이 최적.

### C2. temp 저장 단위·내용 — *무엇을 자동으로 보유시킬 것인가*

| 옵션 | 설명 | 트레이드오프 |
|---|---|---|
| **C2-α: turn 발언 전문 — reports/{role}_rev{n}.md 경로만 inject** | hook이 직전 같은 토픽의 reports/ 모든 rev 경로를 prompt에 박음. 서브가 필요한 것만 Read | (+) 전문 read = 자기감사·반박·인용 모두 가능 (rev3 자기감사 시연 그대로). (+) 신규 저장 인프라 0 — reports/ 활용. (−) prompt 길이는 경로 N개만, 실제 read는 서브가 selective |
| **C2-β: 요약 + finding ID — 역할이 본인 발언 끝에 작성** | rev2 jsonl 스키마 (summary 200자 + findings[] + nextHandoff). hook이 그 jsonl read | (−) 200자 cap이 자기감사·반박에 부족 (rev3 직접 시연). (−) 요약 작성 책임이 발언자에게 추가 — 페르소나 비대화. (−) summary 정확성에 다음 호출 품질 종속 |
| **C2-γ: 메인이 자동 추출 요약** | 메인이 직전 발언 LLM call로 요약 → temp 저장 | (−) 요약 LLM call 추가 비용. (−) 추출 정확성 미보장. (−) 메인 의존 — 비전 위반 |

**Ace 강한 권고**: **C2-α turn 발언 전문 (reports/ 경로 inject)**.

근거 4가지:
1. **본 호출 자체가 시연** — Arki rev1·rev2·rev3 *전문* read가 본 권고를 가능하게 함. 200자 summary로는 rev2 vs rev3 결함 비교 불가.
2. *경로만* inject = prompt 토큰 비용 무시할 수 있음 (경로 1줄 ≈ 50토큰). 실제 read는 서브 selective — Read tool 호출은 토큰 효율적.
3. 신규 저장 인프라 0 — reports/는 D-002 쓰기 단일 경로 정책으로 이미 표준. *재활용*이 짓는 것보다 단순 (Hickey 정합 — 단 *짓지 않음 미덕* 폐기 후에도 재활용은 정당).
4. Master 비전 "각자 이야기한 내용을 *알고*"의 grain은 *전문*이지 *요약* 아님. 요약은 정보 손실.

**보조 jsonl 신설 여부**: 별도 metadata jsonl(turnIdx·role·rev·findings 인덱스)은 hook의 빠른 selector용으로 유지. 단 *발언 본체*는 reports/{rev}.md. jsonl은 인덱스, reports/는 본체 — 중복 아님.

### C3. 토픽 종결 처리 — *세션 후 누적은 어디로 가는가*

| 옵션 | 설명 | 트레이드오프 |
|---|---|---|
| **C3-α: 폐기 (다음 토픽 무관)** | 토픽 closed 시 temp 인덱스 삭제 | (−) Master 비전 "최소 세션"은 *현 토픽 안에서 끝*이지 *후속 망각*은 아님. 다음 토픽이 본 토픽 결정을 인용해야 할 때 누락 |
| **C3-β: 캐릭터.md(Tier 2) 자동 승격 후보** | finalize hook가 (a) F-NNN, (b) D-NNN 기여, (c) Master 피드백 인용 매칭 turn을 캐릭터 patterns에 append. raw reports/는 영구 보존(이미 D-002 표준) | (+) 비전 정합 — 다음 토픽이 Tier 2 read로 본 토픽 결정 인지. (+) reports/는 이미 영구 — *추가 archive 0*. (−) 매칭 algo 정의 필요 (Phase 1 spec) |
| **C3-γ: archive 7일 + 그 후 폐기** | temp 디렉토리 7일 후 삭제 | (−) reports/는 어차피 영구 — temp만 archive하는 것은 인덱스 관리 문제. (−) 7일 cap의 근거 미박. 자의적 |

**Ace 강한 권고**: **C3-β 캐릭터 자동 승격**.

근거 3가지:
1. reports/는 D-002로 이미 영구 보존 — temp 폐기는 *인덱스*만의 문제. raw는 살아 있음.
2. 캐릭터(Tier 2) 자동 승격 = 다음 토픽 호출 시 hook이 캐릭터 read inject = 비전 #4 "여러번 호출의 의미" 토픽 간으로 확장.
3. 매칭 algo는 Arki rev2가 이미 정의 (a/b/c 3 신호) — Phase 1에서 Dev가 정식 spec.

### C4. PD-044 페르소나 슬림화 분기 — *정책-페르소나 분리 자체*

| 옵션 | 설명 | 트레이드오프 |
|---|---|---|
| **C4-α: 본 토픽 포함 (정책 본문 분리)** | rev2 안 — 정책 60% 페르소나 → dispatch_template.md | (−) rev3 Axis 3 진단 — 위치 이동 ROI 0, 색채 손실 위험. (−) PreToolUse hook이 페르소나 read 명령 박으면 페르소나 자동 inject 보장 — 슬림화 동기 사라짐 |
| **C4-β: 본 토픽 제외 (별도 토픽)** | 본 토픽은 자동 inject 인프라만, 슬림화는 PD-044 잔존 | (−) PD-044가 미해결 잠복 — D-071 fiction 패턴 재발 위험 |
| **C4-γ: 폐기 (Arki rev3 시각 — 정책-페르소나 분리 자체 무의미)** | PD-044 결론지음. 페르소나 그대로 + PreToolUse hook이 페르소나 read 강제 = 동등 효과 | (+) rev3 Axis 3 진단 100% 채택. (+) PreToolUse hook으로 read 보장 → 슬림화 동기 소멸. (+) PD-044 박제 종결 = 미해결 PD 1건 감소 |

**Ace 강한 권고**: **C4-γ PD-044 폐기**.

근거 3가지:
1. C1-α PreToolUse hook이 채택되면 hook이 페르소나 read 명령을 자동 prepend — 페르소나 자동 inject 보장. *슬림화의 본래 동기*(메인이 페르소나 안 읽을 위험 → 정책이 누락될 위험) **자체가 소멸**.
2. rev3 Axis 3 ROI 분석 옳음 — 위치 이동 효과 0, 색채 손실 위험만 부담.
3. PD-044 결론지음 = 미해결 PD 1건 정리. session_119 fiction 잠복 라인 추가 차단.

**캐비엇**: PD-044가 *정책 단일 출처* 자체 가치를 가진다는 입장이라면 C4-α 부활 가능. 그러나 단일 출처는 *PreToolUse hook 본문 또는 hook이 read하는 1개 파일*이 자연스럽게 됨 — 페르소나에서 정책을 빼낼 필요 없음. **C4-γ 단독 권고**.

---

## Sec 4. PD-033/043/044 매핑 갱신

| PD | 결론 | 근거 |
|---|---|---|
| **PD-033** (지속성) | resolved-by-C1α + C2α + C3β | PreToolUse hook이 직전 reports/{rev}.md 경로 자동 inject — Arki N차 호출이 직전 N-1 turn 전부 인지 |
| **PD-043** (사칭 검출) | resolved-by-finalize-함수 (rev3 Axis 5 옳음) | PostToolUse(Task) hook 이미 turn 박제 자동 — finalize에 `validateInlineRoleHeaders(reports)` 함수 +1개. 신설 hook 0 |
| **PD-044** (정책 박제) | dropped-by-C4γ | PreToolUse hook이 페르소나 read 강제 → 정책 분리 동기 소멸. 페르소나 그대로 유지. PD-044 종결 박제 |

---

## Sec 5. 다음 발언자 추천 + Master 게이트

**단일 권고**: **Master 직접 결정축 답** (C1·C2·C3·C4 4건).

근거:
1. C1-α 채택 여부는 *Master가 PreToolUse hook spec 도전을 승인*하는지에 종속 — Arki rev4가 spec 추정으로 정식화하기 전 비전 정합 게이트 통과 필수. memory feedback `feedback_low_friction_no_redundant_gate`("결정 불요 0건이면 묻지 말고")는 *결정 필요 있을 때*는 묻는 것이 정답. 본 4축은 Master 결정 필요.
2. Arki rev4 spec 정식화는 C1·C2·C3·C4 확정 후 진행이 자연 — 결정 없는 spec은 헛됨. *spec 동결 전*에 결정 게이트.
3. Fin/Riki는 결정 박힌 미니멀 spec 검토가 더 효율 — 현재 4축이 열린 상태에선 검토 대상이 흔들림.

**무응답 처리**: memory feedback `feedback_low_friction_autonomy`("무응답=승인")이지만 본 4축은 비전 직격이라 무응답=`Ace 1차 권고(C1α + C2α + C3β + C4γ)` 진행. 진행 후 Arki rev4 호출.

---

## Sec 6. 핵심 전제 갱신 (Step 4 갱신)

| # | 전제 | 표시 | rev1 대비 변경 |
|---|---|---|---|
| K1 | 현재 Task tool subagent invocation은 정상 작동 | — | 유지 |
| K2 | 같은 session 내 동일 역할 서브 N번째 호출은 직전 컨텍스트 미보유 — 매 호출 재부팅 | 🔴 | 유지 — *그래서 hook 강제 필요* (인과 명시화) |
| K3 | 메인 컨텍스트는 서브 prompt에 임의 파일 inject 가능 | — | 유지 |
| K4 | 페르소나는 메인 prompt에 명시 inject 시에만 작동 — 자동 inject 인프라 부재 | 🔴 | 유지 — *PreToolUse hook이 이 부재를 메움* (인과 명시화) |
| K5 | scratchpad write 경로 가능 | — | 유지 |
| **K6 (NEW)** | **PreToolUse(Task) hook이 stdin tool_input.prompt mutation을 허용한다** | 🔴 | **신규 — Phase 1 G1에서 spec 실측 필수. 미허용 시 C1-β fallback** |
| **K7 (NEW)** | **PostToolUse(Task) hook이 이미 turn 박제 자동화 중** | — | **rev3 Axis 5 실측 박제 — PD-043 hook 신설 불필요 근거** |

---

## Sec 7. executionPlanMode 재선언

**executionPlanMode: plan** (rev1과 동일 유지).

근거: 4축 결정 후 Arki rev4가 미니멀 spec 정식화(Phase 1~3) + Dev 구현 + resolveCondition dry-run 필요. Phase 분해·의존 그래프·검증 게이트(K6 G1 spec 실측)·롤백·중단 조건이 plan 모드 적합.

**중단 조건 (rev1 보강)**:
- K6 미허용 + C1-β fallback도 `validateInlineRoleHeaders` 검증으로 메인 휘발성을 충분히 가두지 못하는 경우 — 본 토픽 종결 + PreToolUse hook 활성화 별도 PD로 분기

---

## 권고 요약 (Master 결정용 단일 표)

| C-축 | 권고 | 핵심 |
|---|---|---|
| C1 | **C1-α PreToolUse(Task) hook** | 코드 레벨 강제 — 비전 #2 "자동" 정합 |
| C2 | **C2-α turn 발언 전문 (reports/ 경로 inject)** | 본 호출 자체가 시연 — 200자 summary 부족 |
| C3 | **C3-β 캐릭터 자동 승격 후보** | reports/는 영구, 캐릭터로 토픽 간 승계 |
| C4 | **C4-γ PD-044 폐기** | hook이 페르소나 read 강제 → 슬림화 동기 소멸 |

**1세션 완결 가능성**: ✅ — Phase 1 (K6 spec 실측) → Phase 2 (PreToolUse hook 신규 + finalize 함수 +1) → Phase 3 (resolveCondition dry-run: Arki 4번째 호출이 본 turn 4 인용). 모든 변경은 hook 1개 + finalize 함수 1개 + 캐릭터 매칭 algo + 메인 prompt 표준 1군데 — 본 세션 내 가능.

Master 무응답 시 본 권고 그대로 진행 + Arki rev4 호출.

---

```yaml
# self-scores
rfrm_trg: Y
ctx_car: 0.95
orc_hit: 0.85
mst_fr: 0.10
ang_nov: 4
```

**다음 발언자 추천**: Master (C1~C4 4축 결정 게이트). 무응답 시 Arki rev4 (미니멀 spec 정식화 — Phase 1~3, K6 G1 게이트 spec 실측 포함).
