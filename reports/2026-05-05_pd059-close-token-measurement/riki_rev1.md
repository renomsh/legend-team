---
role: riki
session: session_196
topic: topic_169
topicSlug: pd059-close-token-measurement
rev: 1
date: 2026-05-05
turnId: 5
invocationMode: subagent
---

# Riki — PD-059 Close 프로세스 토큰 측정 리스크 감사

Riki입니다.

---

## 1. 검증된 리스크

### 🔴 R-1. close.md Step 4 status enum 불일치 — 잘못된 값이 박제된다

**원문 인용 (close.md Step 4):**
> "허용 값은 `memory/shared/status_catalog.json`의 statuses[].id만 (현재: open / in-progress / completed / suspended). `closed`는 legacy alias → 반드시 `completed`로 기록."

**CLAUDE.md 원문:**
> "status enum 7종 (D-B): `open` | `framing` | `design-approved` | `implementing` | `completed` | `suspended` | `cancelled`"

**실측 (status_catalog.json):**
statuses[].id = `open`, `in-progress`, `completed`, `suspended` — 4종.

**충돌:** close.md는 status_catalog.json을 SOT로 지정(4종)하고, CLAUDE.md는 7종을 선언한다. `framing`, `design-approved`, `implementing`, `cancelled`는 status_catalog.json에 없다. LLM이 CLAUDE.md를 읽고 `implementing`을 박제하면 status_catalog.json 기준 무효값이다. `updateTopicStatus()` 헬퍼가 이 값을 거부할 경우 갱신 실패 — hooks는 delta-check만 하고 값 검증은 하지 않는다.

**파손 범위:** G2 구현 시("스크립트 호출만") 이 불일치가 은폐된다. LLM이 전문을 읽지 않으면 충돌을 발견할 기회가 사라진다. status 오기가 무음으로 통과하는 경로.

**완화 조건:** G2 구현 전에 status_catalog.json과 CLAUDE.md의 enum을 동기화할 것. 둘 중 하나가 SOT여야 하며, 현재 어느 쪽이 SOT인지 불명확하다. `scripts/lib/topic-status.ts`가 실제로 어느 파일을 참조하는지 확인 필요.

---

### 🔴 R-2. delta-check는 충돌 감지 불가 — Fin의 fallback 평가가 틀렸다

**Fin 주장 (section 4.2):** "session-end-finalize.js의 delta-check가 '변경 여부'만 감지하고 '충돌 여부'는 감지하지 못한다."

**실측 (session-end-finalize.js, runChecklistDeltaCheck 함수 line 348~414):**

Step 3 검증 로직:
```js
const ledgerIds = new Set((ledger.decisions || []).map(d => d.id));
const missing = dIds.filter(id => !ledgerIds.has(id));
```

이 코드는 "현 세션에서 내려진 결정 ID가 ledger에 존재하는가"만 확인한다. "새 결정이 기존 결정과 충돌하는가"는 검사하지 않는다. Fin의 판단은 **정확하다.**

**추가 발견 — Riki 고유 지적:** G1 스냅샷 도입 시 LLM이 decision_ledger 전문 대신 "최근 30건 + topicId 관련"만 읽으면, 충돌 감지 경로는 오직 LLM의 맥락 인식뿐이다. 그런데 delta-check는 충돌을 탐지하지 못한다. 결과: **G1 구현 후 충돌 결정이 박제되어도 어떤 자동화도 이를 감지하지 못한다.**

Arki의 "session-end-finalize.js의 기존 delta-check가 안전망"이라는 fallback 주장은 실측 코드와 다르다. 안전망이 아니다.

**파손 범위:** G1 구현 후 첫 충돌 결정은 다음 세션에 역할이 우연히 발견하기 전까지 SOT에 남는다. 의사결정 체계 신뢰성 훼손.

**완화 조건:** G1 구현 시 Arki가 제안한 escape hatch("충돌 의심 시 전문 조회 가능") 외에, close.md Step 3 지시에 "N건 스냅샷 외 topicId 관련 결정 전체"를 명시. 또는 delta-check에 충돌 감지 로직 추가(현재 없는 기능 — 별도 구현 비용 발생).

---

### 🟡 R-3. G2 "스크립트 호출만" 전환 시 topic_index.json 관련 PD resolveCondition 누락

**Arki 제안 (G2):** "LLM은 스크립트 호출만 하고 전문 읽기 불필요."

**실측 (CLAUDE.md topic_index 스키마):**
> "`resolveCondition` (PD에만): 자연어 string — 매칭되는 토픽 종결 시 PD 자동 resolved"

PD resolveCondition 매칭은 `scripts/resolve-pending-deferrals.ts`가 자동 수행하는 게 아니라, `/close` 체인에서 `auto-close-topics.ts`가 dry-run으로만 실행된다. 실제 PD resolved 전환이 LLM 판단 없이 일어나는지, 아니면 LLM이 topic_index를 읽어야 하는지 close.md에 명시되어 있지 않다.

**파손 범위:** G2 구현 후 PD resolveCondition 매칭이 누락되면 PD가 오래된 open 상태로 방치된다. `check-pending-deferrals.ts`가 다음 세션에 경고를 출력하지만, 자동 전환은 일어나지 않는다.

**완화 조건:** G2 구현 전에 resolveCondition 매칭의 실제 실행 주체(LLM vs 스크립트)를 close.md에 명시. 스크립트가 담당한다면 G2는 안전. LLM 판단이 필요하다면 G2는 topic_index 전문 읽기를 대체하지 못한다.

---

## 2. 기각된 가정/리스크

**"session_index 우발 읽기는 발생 빈도가 낮다" (G5 관련):** 기각. Arki·Fin 모두 "우발"이라 표현했으나, close.md 어디에도 session_index.json 읽기를 금지하는 명시적 지시가 없다. LLM이 Step 8 설명("session_index.json 세션 기록 추가")을 보고 직접 읽으려 시도하는 것은 "우발"이 아니라 지시 모호성에서 비롯된 구조적 가능성이다. G5를 "우발 예방"으로 분류한 것은 리스크 하향 편향. **이 항목은 R-1~R-3보다 중요도가 낮아서 기각한 것이 아니라, Fin이 이미 #1 MUST_NOW로 정확히 처리했으므로 Riki가 중복 지적을 의도적으로 제외함.**

**"master_feedback_log.json 4건, 항목당 19K bytes" (Fin section 2.1):** 표면적 의문 제기 후 기각. 4건이 78K bytes이면 항목당 ~19.7KB다. 이는 비정상적으로 크다. 그러나 실측 파일 크기를 Riki가 직접 열어 검증할 실익 대비, 이미 Fin이 수치를 제시했으므로 중복 감사는 ROI 0. 단, G3("feedback_log 조건부 읽기")의 절감 추정이 이 수치에 의존하므로 G3 ROI는 실측 검증 후 확정 권고.

**"Arki의 토큰 추정 137K~160K는 하한":** Fin이 이미 검증. Riki 중복 감사 불필요.

---

## 3. 모순·논리 결함

### M-1. Fin 우선순위 재정렬 vs Arki 우선순위 — G3 순위 불일치

Arki: G1(#1) > G2(#2) > G5(#3) > G3(#4) > G4(#5)
Fin: G5(#1) > G2(#2) > G1(#3) > G3(#4) > G4(#5)

Fin의 재정렬은 G5를 ROI 무한대로 상향하고 G3를 "#2 HIGH"로 기술하면서도 최종 순위에서 G3를 #4로 유지한다. section 3.2 "Fin 재정렬: G5 > G2 > G1 > G3 > G4"와 section 3.1 표의 "Fin 우선순위: G3 = #4 MEDIUM"은 일치하나, 서술 문단에서 "G3 조기 실행 권장"이라 하면서 순위가 #4인 것은 독자 혼동 유발. 이는 논리 결함이 아니라 서술 모호성이다 — 실행 권장은 "구현 용이성 대비 효과"를 의미하고 우선순위는 절감 크기를 의미한다. 단, Master가 이 둘을 혼동하면 실행 순서 오판 가능.

### M-2. close.md Step 4 status SOT 불명확 (R-1과 연결)

close.md: "허용 값은 status_catalog.json의 statuses[].id만" → 4종
CLAUDE.md §Topic Lifecycle: "status enum 7종 (D-B)" → 7종

하나의 시스템에 두 개의 status SOT가 공존한다. `scripts/lib/topic-status.ts`가 실제로 어느 파일을 읽는지가 실제 SOT를 결정한다 — 문서 중 어느 것도 코드의 SOT가 아닐 수 있다. CLAUDE.md가 "SOT: `memory/shared/topic_index.json`"이라 선언하지만, status 값의 허용 범위 SOT는 별개 문제다. G2 구현 시 이 불명확성이 장애로 전환된다.

---

## 4. Riki 권고

**즉시 (G2 구현 전 필수):**
1. `scripts/lib/topic-status.ts`가 참조하는 status enum SOT 확인. close.md와 CLAUDE.md 중 어느 것이 실제 코드와 일치하는지 확정. 불일치 시 먼저 동기화 (R-1, M-2).

**G1 구현 시 필수 보완 (R-2):**
2. close.md Step 3 스냅샷 지시에 "충돌 의심 시 전문 조회 가능 — escape hatch" 명문화. Arki·Fin 모두 언급했으나 실제 close.md 수정이 필요하다. 구현만 해서는 부족하고 close.md 지시 변경이 동반되어야 한다. delta-check는 충돌을 탐지하지 않는다(실측 확인).

**G2 구현 시 필수 보완 (R-3):**
3. PD resolveCondition 매칭이 LLM 없이 스크립트로 완결되는지 확인. 불완전하면 G2 범위를 "topic_index 현 topicId 항목 + PD resolveCondition 관련 항목"으로 제한.

**G5 (Fin #1 MUST_NOW):**
4. Riki도 동의. close.md Step 8 설명에 "session_index.json은 hook 자동 처리 — LLM 직접 읽기 금지" 명시. 이건 지시 모호성 제거이므로 실행 리스크 없다.

---

[ROLE:riki]
# self-scores
crt_rcl: 0.75
cr_val: Y
prd_rej: Y
fp_rt: 0.10
