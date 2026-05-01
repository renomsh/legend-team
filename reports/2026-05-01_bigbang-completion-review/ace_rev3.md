---
role: ace
session: session_161
topic: topic_141
topicSlug: bigbang-completion-review
date: 2026-05-01
rev: 3
turnId: 0
invocationMode: subagent
phase: framing
---

# Ace — 구조·흐름 판정 (session_161)

## 판정 대상

"Edi Agent 툴 강제 메커니즘을 구현해야 하는가?" (Riki R-1/R-2 미해소 이슈)

---

## Step 1. 실측 기반 판정

### 재발 빈도 (실측)

최근 20개 세션 중 Grade A/B/S = 18건.
- Edi 미호출(non-agent) = 5건 → **미호출률 27.8%**
- 구간별: session_141~150에서 4건, session_151~160에서 1건(session_159)

패턴 판독: 초기 집중 발생 후 감소 중. session_159가 최근 단발. 구조적 재발 가능성 잔존.

---

## Step 2. 구조 진단 (Structure)

**"무엇을 얻기 위해 무엇을 포기하는가"**

현재 탐지(audit) 수준과 강제(enforce) 수준은 완전히 다른 계층이다.

| 계층 | 현재 상태 | 효과 |
|---|---|---|
| 탐지 | `auditEdiLlmInvocation` 경보 | 사후 확인만 — 재발 방지 0 |
| 강제 | 없음 | D4 Prime Directive 위반 상태 |

D4가 명확히 말한다: **"enforcement는 코드(hook, validator)에 박제하고 모델 자율 판단에 의존하지 않는다."**

현재 구조는 "모델이 규칙을 기억해서 따르겠지"에 의존한다. 이건 D4 직접 위반이다.

구조적 약점: 탐지만 있는 시스템은 결함이 반복될 때마다 세션 하나가 낭비된다. session_159가 그 증거다.

---

## Step 3. 흐름 분석 (System)

**추세**: session_151 이후 개선됐다. 그런데 이 개선이 "모델이 더 잘 따른 것"인지 "우연한 세션 구성 차이"인지 알 수 없다. 구조가 바뀐 게 아니면 언제든 session_159 같은 단발이 재발한다.

**불확실성 vs 리스크 구분**:
- 불확실성: 강제 구현 후 side effect (pre-tool-use 과부하 등)
- 리스크: 강제 미구현 시 D-066 위반 + Edi 없는 세션 종결 반복

리스크는 구조적·반복적. 불확실성은 구현 설계로 통제 가능.

---

## Step 4. 지속 가능성 판정

**현재 탐지 수준으로 운영하는 것은 지속 불가능하다.**

이유: D4 위반 상태가 지속되면, 성장 단계가 올라갈수록(더 복잡한 세션, 더 많은 Grade A/S) 누적 미호출 건수가 늘어난다. 탐지 경보는 기록되지만 행동을 강제하지 않는다.

판정: **No (현 상태 유지) → Conditional Yes (옵션 B 구현 시 해소)**

---

## Step 5. 결정

**해야 한다. 단, 옵션 B로.**

**옵션 B (Session End skill 체크리스트에 "Edi LLM 호출 확인" 단계 추가)를 구현한다.**

근거:
1. D4 위반 상태 해소 — 코드에 박제해야 한다
2. Riki가 옵션 A (pre-tool-use-task 수정)를 SRP 위반으로 판정했다. 옳은 진단
3. 옵션 B는 Session End 단계에서 "이번 세션 Edi가 agent source로 호출됐는가" 체크 후 미충족 시 경보를 차단형으로 올린다
4. 구현 비용: Session End skill/hook 1개 수정. 최소 범위

**"하지 않는" 옵션의 리스크**:
- D-066 + D4 이중 위반 상태 지속
- 27.8% 미호출률이 개선됐어도 구조는 그대로 — 다음 복잡 세션에서 재발 가능
- Edi 없는 세션은 versionBump 미확정, gaps 미정리, 인계 정보 손실로 이어진다

---

## 단일 권고

**옵션 B를 이번 세션에 구현한다.**

`session-end-finalize.js` 또는 Session End skill 체크리스트에 Edi LLM 호출 검증 단계 추가. Grade A/B/S 세션에서 `turns.source === 'agent'` Edi turn 없으면 hard warning(세션 종결 차단형). Grade C/D는 D-137로 이미 skip — 적용 범위 아님.

구현 후 D-066·D4 위반 상태 해소 선언 가능.

---

[ROLE:ace]
# self-scores
rfrm_trg: Y
ctx_car: 0.95
mst_fr: 0.80
ang_nov: 2
