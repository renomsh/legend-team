---
turnId: 2
invocationMode: subagent
session: session_208
topic: topic_176
role: riki
phase: adversarial-rev1
date: 2026-05-07
---

# Riki rev1 — D-170 + Arki rev3 + Jobs rev1 적대적 감사 (Case B 한정)

Riki입니다. 실재성·확신·기여도 3대 필터 적용. 슬롯 미달 정상.

---

## 0. 결론 한 줄

**부분 수정 필요 — frame 자체는 견고하나, "blind 단계 답변 품질 가정"·"D-170 가역성"·"옵션 A 매칭 키 단일점 실패" 3건이 코드/실증 박제 전 반드시 보강되어야 함. 이 3건 미보강 시 frame은 운영 1~2회 시도 후 폐기되고 D-170·메커니즘 코드만 dead artifact로 잔존할 risk.**

critical 위험: 3건 (R-1, R-2, R-3) / 🟡: 3건 (R-4, R-5, R-6) / MUST_NOW: 4건

---

## 1. D-170 결정 분쇄 시도

### 🔴 R-1. "가역" 단언이 절반만 가역이다 (직교성·가역성 동시 결함)

**원문 인용 (D-170 박제)**: "세션 중 전환 가능, 가역."

**파손 범위**:
- structured → discussion 전환 시 prompt prepend 차단 분기(Arki rev3 §2 (2)단계)가 발동 → blind 단계 발언 박제됨
- 그 직후 Master가 discussion → structured 복귀 명령 → **이미 박제된 blind 발언은 어떻게 되는가**? Arki rev3·Jobs rev1 어디에도 명시 없음
- 옵션 1: 박제 발언 그대로 유지 → 이후 turn은 prepend 재개 → 다음 발언자가 blind 발언 컨텍스트를 보게 됨 → blind 의미 사후 파괴
- 옵션 2: 박제 발언 retroactive prepend 차단 → turns[]는 정합하지만 dashboard·session_index에서 보이게 됨 → 모델 자율 판단으로 봐버릴 risk (D4 위반 면)
- 즉 **"가역"은 운영 정책 미박제 영역**. D-170 박제 후 운영 시 첫 전환 시점에 즉흥 결정 발생 → D3 저장소 오염 risk

**완화 조건**:
- **MUST_NOW**: D-170 박제 시 "전환 시점 박제된 turn의 사후 처리 정책" 명시 (안 1: blind turn은 phase=blind-isolated 박제, 다음 phase에서도 prepend 차단 영구. 안 2: 전환 자체를 phase 단위로만 허용)
- fallback: 운영 1회차에 정책 미박제 노출 → 즉시 D-170 amendment 박제 (Master 결정 필요)

### 🔴 R-2. "Grade와 직교" 단언이 검증 안 됨 — dispatch 정책 충돌 가능

**원문 인용 (D-170)**: "Grade와 직교, default=structured."

**파손 범위**:
- Grade S/A의 default 역할 호출 순서: Jobs → Arki → Fin → Riki → Ace → Edi (CLAUDE.md §Default Mode)
- discussion 모드 (2)blind 동시 제출 단계는 **N개 역할이 동시 dispatch** — 즉 호출 순서 무력화
- "Grade는 역할 구성·순서 결정", "operationMode는 dispatch 시점·격리 결정" → **운영 시점에 두 정책이 같은 hook(pre-tool-use-task.js)에서 충돌 처리됨**
- 직교가 깨지는 시나리오: Grade A discussion 토픽에서 Jobs framing이 (1)단계 진행 중인데 (2)blind 단계로 phase 전환 시점 — 누가 누구를 prepend 차단하는가? 전이 정책 미박제

**완화 조건**:
- **MUST_NOW**: D-170 박제 시 "phase·grade·operationMode 3축 우선순위 매트릭스" 명시 의무화 (Arki rev3 §6.2 D3 정합 강화)
- fallback: 운영 시 충돌 1건 발견 시 즉시 정책 박제 우선 (Master 좌절 risk 회피)

### 🟡 R-4. "후속 결정 의무"가 forgetting risk

**원문 인용 (D-170)**: "격리 강도는 후속 결정 (결정축 3 미해결)."

**파손 범위**:
- Master가 후속 결정 안 하고 잊으면 default가 무엇? Arki rev3·Jobs rev1 어디에도 default 미명시
- 운영 시 첫 discussion 토픽 진입 시 격리 강도 미정 → Nexus 즉흥 결정 → 일관성 깨짐 → D3 위반

**완화 조건**:
- **MUST_NOW**: D-170 박제 시 "후속 결정 없으면 격리 강도 = prompt prepend 차단만 (Step 3 축 (3) A극)" 임시 default 박제
- fallback: PD 신설 (D-170 후속 결정 PD)로 게이트 박제 → finalize hook이 PD 미해결 시 알림

---

## 2. Arki rev3 핵심 가설 분쇄

### 🔴 R-3. agentId 동기 가정 실패 시 옵션 A 단일점 실패 (R-N-02 보강)

**원문 인용 (Arki rev3 §4.2)**: "agentId가 hook input과 Nexus message stream에서 동일 발급된다고 가정. 검증 필요 → MUST_BY_N=10."

**파손 범위**:
- 옵션 A는 hook이 pending_turns jsonl에 self-scores 임시 박제, Nexus가 turn push 시 agentId로 join
- agentId 매칭 실패 시 self-scores 누락 → D-092 자가측정 시스템 침식 (운영 데이터 무결성)
- Arki는 fallback으로 "prompt unique marker 우회" 명시했으나, 이는 **prompt 본문 변경 = D1 적대적 컨텍스트 전제 위반 면적 증가** (marker 자체가 prompt injection vector)
- P1 spike GATE α 기준 미명시 — "일치"가 100% 일치인지 N=10 중 9건 일치도 통과인지 미박제

**완화 조건**:
- **MUST_NOW**: P1 spike GATE α 통과 기준 사전 박제 (권고: N=10 중 100% 일치만 통과. 1건이라도 불일치 시 옵션 B 또는 frame 폐기)
- fallback: 옵션 B(Nexus 직접 파싱) 사전 spike 병행 — 옵션 A 실패 시 즉시 전환 가능
- residual: prompt unique marker 우회는 D1 위반 vector — 이 fallback은 **선택지에서 제거 권고**. Arki rev3 §4.2 fallback 수정 의무

### 🟡 R-5. 옵션 A vs 옵션 B 비교가 D2 정합만 근거 — 견고성 비교 누락

**원문 인용 (Arki rev3 §1.2.4)**: "Arki 권고: 옵션 A. 이유: (1) self-scores 파싱 로직 단일 출처(hook) 유지 — D2 정합 강화."

**파손 범위**:
- 옵션 A는 hook과 Nexus 두 곳에서 같은 agentId·turnIdx 매칭 의존 — **2-step 시스템**
- 옵션 B는 Nexus 단일 파싱 — **1-step 시스템**
- 일반론적으로 step 수↑ → 실패 모드↑. Arki는 D2 정합만 근거로 옵션 A 권고. **견고성 차원 비교 누락**
- message stream truncation risk를 옵션 A 지지 근거로 들었으나, self-scores YAML은 보통 100~200 byte — truncation 가능성 매우 낮음. **risk 과장**

**완화 조건**:
- **MUST_NOW**: P1 spike에 옵션 B(message stream YAML 파싱) 동시 검증 추가 — truncation 발생률 실측 후 견고성 vs D2정합 trade-off 박제
- fallback: 옵션 B 견고성 입증 시 옵션 B 채택 — Arki rev3 §1.2.4 권고 amendment

### 🟡 R-6. Nexus crash recovery PD-066 분리는 회피인가 — 운영 1회차 무결성 risk

**원문 인용 (Arki rev3 §4.1)**: "PD-066 신설 의무: Nexus crash recovery 보강 plan. 본 plan rev3는 jsonl 잔존만 박제, 실제 복구 로직은 PD-066 분리."

**파손 범위**:
- Nexus crash 시 pending_turns jsonl 잔존 → **다음 세션 finalize에서 join한다**가 가정
- 만약 다음 세션이 안 열리면? (Master 휴지기, 토픽 종결 후 재오픈 안 됨) → 영구 손실
- 또는 다음 세션이 다른 토픽이면? → pending_turns의 sessionId 검사 후 skip → 영구 손실
- PD-066 분리는 **plan 진입 게이트로 PD-066 resolved 강제 안 하면** 운영 시 무결성 risk

**완화 조건**:
- **MUST_NOW**: Case B Phase 진입 게이트에 "PD-066 resolved 또는 명시적 risk 수용 박제" 의무 (warn-only 아님, 코드 박제)
- fallback: PD-066 미해결 시 turnPushMode = "hook" 강제 (legacy 동작) — Nexus crash 보호 자동 잔존

### 🟡 (확신 부족 — 슬롯 미달 정상) Arki MUST_NOW 6건 미반영

**원문 인용**: Arki rev3 spc_lck = N. MUST_NOW 6건 (자산 매트릭스·D-169 supersede·GATE 주체·D1 sentinel·D4 finalize join·hook mode 분기).

**판정**: Arki 자가감사가 명시적으로 spc_lck=N 박제했고 rev4 진입 의무 박제됨. **운영 정상 흐름**. Riki 추가 risk로 박제할 가치 미달. (실재성 필터 통과 못 함 — 이미 통제 중.) **의도적 제외**.

---

## 3. Jobs rev1 전제 분쇄

### 🔴 R-7. blind 동시 제출 답변 품질 가정 — 자기 영역 정의 모호 시 anchoring 해소 실패

**원문 인용 (Jobs rev1 §5 전제 4)**: "blind 동시 제출 단계의 답변 품질이 충분하다 — 다른 발언자 컨텍스트 없이도 각 역할이 자기 영역에서 의견 박제 가능."

**파손 범위**:
- 자유 주제(토론형 토픽) 본질: **자기 영역 정의가 사전에 모호**한 경우가 많음
- 예: "팀 운영 철학" 토론 시 Arki(구조) vs Riki(리스크) vs Fin(자원)의 영역 경계가 불명확 → blind 단계에서 모두 비슷한 축으로 답변 박제 가능
- 결과: **blind라는 메커니즘은 작동했지만 anchoring 해소 효과 없음** (모두 비슷한 답 + Master frame 답습)
- 즉 **frame 본질(anchoring 깨기)이 blind 메커니즘만으로는 보장 안 됨**. Jobs rev1 §6 적출 5(availability) 자기 검사에서 "race 해소가 frame 본질이 되어선 안 됨" 명시했으나, 같은 논리로 **blind 동시 제출이 frame 본질이 되어서도 안 됨** — frame 본질은 "다양한 시각 박제"

**완화 조건**:
- **MUST_NOW**: Jobs rev1 §5 전제 4를 "blind 동시 제출 단계 + 역할별 사전 영역 명시 prompt 박제"로 강화. 영역 명시는 (1)단계 프레이밍에서 Jobs 또는 Nexus가 박제
- fallback: 운영 1회차 blind 답변 품질 평가 — 역할 영역 분화도 측정 (자가 score `domain_div`). 미달 시 frame 운영 정책 amendment

### 🔴 R-8. 5단계 흐름의 (4)반박 단계 형식 미박제 — frame 가치 결정 요소

**원문 인용 (Jobs rev1 §4 OUT 6)**: "반박 단계 prompt prepend 형식 정밀화 — Arki rev3 §2 (4)단계 deferred. 이번 토픽 OUT."

**파손 범위**:
- (4)반박이 순차냐 병렬이냐 미결. 만약 병렬 (4)반박이면 다시 anchoring (각자 자기 입장 고수, 변경 없음) 가능
- 순차면 다시 첫 발언자 anchoring (frame 본질 재발생)
- **즉 (4)단계 형식이 frame 가치를 좌우하는데 OUT 박제됨** → 운영 1회차에서 형식 즉흥 결정 → frame 가치 미보장 또는 깨짐
- Jobs Focus 원칙(saying no 강하게)이 정합하지만, **(4)단계는 frame 본질에 직결** — OUT은 saying no 과도

**완화 조건**:
- **MUST_NOW**: (4)반박 단계 형식 최소 1줄 박제 의무 (예: "(4)반박은 병렬 dispatch + (3)단계 모든 발언 본문 prepend, 단 자기 발언 제외"). 정밀화는 별도 토픽 OK, 그러나 **최소 형식은 본 토픽 IN**
- fallback: 운영 1회차에 (4)단계 형식 즉흥 박제 → 그 형식으로 D-171 amendment

### 🟡 R-9. "편향이 본질" frame 자체가 anchoring일 가능 (Jobs §6 적출 3 보강)

**원문 인용 (Jobs §6 적출 3)**: "Master 새 frame이 옳다는 가정으로 직진."

**파손 범위**:
- Master 발언 분석: "편향" 1회 vs "시간이 너무 걸리는 거야" 강한 emotional 표현
- Jobs는 "편향 먼저, 시간 보조"로 결론. 그러나 **emotional 강도는 시간이 더 강했을 가능성**
- 만약 Master 본질이 "시간"이면 blind 동시 제출은 시간 단축에는 기여하나 **편향 해소는 부수 효과** → frame 우선순위 역전
- 영향: 본 토픽 박제 후 Master가 "역시 시간이 본질이었다" 정정 시 frame 의미 일부 변질

**완화 조건**:
- **확신 부족 — Master 의도 추정 영역**. 그러나 frame 박제 전에 Master에게 1줄 재확인 권고: "본질=편향 / 보조=시간 정합 맞는가?" — Jobs framing rev2에서 박제하거나 Ace synthesis에서 질의
- fallback: frame 박제 후 정정 시 D-170 amendment 또는 폐기 — **이 fallback은 비용 낮음** (Arki rev3 P0~P8 phase 진입 전이면 영향 0). 따라서 R-9는 🟡 등급 유지, 박제 진행 차단 사유 아님

---

## 4. 통합 risk — frame 채택 후 silent failure 시나리오

### 🔴 (R-1·R-2·R-3 연쇄) Dead artifact accumulation

**시나리오**:
1. D-170 박제 + Arki rev3 P0~P3 코드 박제 (turnPushMode 플래그·hook early return·Nexus push)
2. Master discussion 토픽 1회 시도 → R-1(가역 정책 미박제) + R-2(grade 충돌) + R-7(blind 답변 품질 미달) 동시 발생
3. Master 좌절 → frame 폐기 ("이거 별로네")
4. **그러나** D-170·코드·hook 분기는 잔존 → dead code accumulation
5. 이후 운영에서 코드 path가 dead임을 모르는 LLM이 "이번만 활용" 자율 판단 가능 (D4 위반 면)

**완화 조건**:
- **MUST_NOW**: Case B Phase 진입 전 R-1·R-2·R-3·R-7·R-8 모두 1줄 이상 박제 (rev4 통합 의무) — Arki spc_lck=Y 조건에 본 5건 추가 권고
- fallback: frame 폐기 시 D-170 supersede + 코드 path early return 박제 (LLM 자율 판단 영역 차단)

### 🟡 R-10. Case A(PD-065) 충돌 가능성

**원문 인용 (Arki rev3 §4.1.5)**: "Case A (PD-065 mtopic_NNN namespace) 본 plan과 직교 — 변경 없음."

**파손 범위**:
- pending_turns_{sessionId}.jsonl이 다중 인스턴스 시나리오에서 같은 sessionId 충돌하면? (예: 같은 세션이 2 인스턴스 동시 열림 — Master 실수)
- Arki는 sessionId 필드 박제로 격리 가능 단언 (§6.1 extensibility (1))했으나, **sessionId 발급 동기화 메커니즘은 PD-065 영역** → 직교 가정이 약해짐

**완화 조건**:
- **확신 부족** — 다중 인스턴스 시나리오는 PD-065 영역. 의도적 제외 (실재성 부족, Case B 본 plan 영역 아님). 단 PD-066과 함께 PD-065도 본 plan 진입 게이트에 포함 권고만 박제
- fallback: 운영 시 다중 인스턴스 충돌 발견 시 즉시 PD-065 우선순위 상향

---

## 5. 자가감사 (실재성·확신·기여도)

### 실재성 필터
- R-1, R-2, R-3, R-7, R-8: 코드/정책 박제 직전 단계 — 실 운영에서 1~2회차 노출 가능. 통과.
- R-4, R-5, R-6, R-9, R-10: 운영 시 발견·연쇄 또는 추정 영역. 통과 (단 R-9는 확신 부족, R-10은 의도적 제외 명시).
- "frame 부정"으로만 흐르지 않았는가: §1·§2·§3에서 결론 단언 0, 특정 필드/메커니즘 결함만 박제. **frame 자체 결함 아님 — 박제 직전 보강 영역**.

### 확신 필터
- 🔴 5건 (R-1, R-2, R-3, R-7, R-8) — 코드 박제 직전 영역, 명시 요청.
- 🟡 5건 (R-4, R-5, R-6, R-9, R-10) — 운영/추정 영역.
- 의도적 제외 1건 (Arki MUST_NOW 6건 미반영 — 이미 통제 중).

### 기여도 필터 (Master/Ace가 놓친 것만)
- R-1·R-2·R-4: D-170 자체 결함 — 박제 시점에 누구도 명시 안 함. 기여 명확.
- R-3 fallback의 D1 vector: Arki도 fallback 박제했으나 D1 위반 면 미명시. 기여.
- R-5: Arki 권고 근거 견고성 차원 누락. 기여.
- R-6: Arki가 PD-066 분리만 박제, 진입 게이트 박제 누락. 기여.
- R-7·R-8: Jobs OUT 박제에 frame 본질 직결 항목 포함. 기여 큼.
- R-9: 확신 부족 — 그러나 framing이 sticky 박제 전 1회 확인 권고는 비용 낮은 보험. 기여 약함.
- R-10: 의도적 제외 — 기여 0.

**자가 라운드**: 1회 (실재성·확신·기여도 동시).

---

## 6. 결론 + Master 결정 필요 항목

### 결론
**부분 수정 필요** — frame 견고하나 R-1, R-2, R-3, R-7, R-8 (🔴 5건)을 rev4 통합 또는 D-170 amendment로 박제 후 Phase 진입 권고. 미박제 시 운영 1회차에서 frame 가치 일부 깨질 risk + dead artifact 잔존 risk.

### Master 결정 필요 (3건)

1. **D-170 amendment 의무화** (R-1·R-2·R-4 통합) — 가역 정책 + grade·phase·operationMode 3축 우선순위 + 격리 강도 임시 default 박제 후 Phase 진입 동의?
2. **Arki rev4 통합 시 R-3·R-7·R-8 추가 박제 의무화** — 옵션 B 사전 spike + (4)반박 최소 형식 1줄 + blind 단계 역할 영역 prompt 명시
3. **PD-066 + (선택) PD-065 진입 게이트** — Case B Phase 진입 전 PD-066 resolved 강제 (R-6). 미해결 시 turnPushMode = "hook" 강제 fallback 박제

### 의도적 제외 (Riki tripWire 등록 권고)
- Arki MUST_NOW 6건 미반영 (이미 통제 중)
- R-10 다중 인스턴스 충돌 (PD-065 영역, 본 plan 직교)
- R-9 "편향 vs 시간" frame 본질 재확인 (확신 부족, 비용 낮은 보험으로 Ace synthesis에서 질의 권고만)

---

[ROLE:riki]
# self-scores
crt_rcl: 0.83
cr_val: Y
prd_rej: Y
fp_rt: 0.0
