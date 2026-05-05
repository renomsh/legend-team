---
role: jobs
session: session_196
topic: topic_169
topicSlug: pd059-close-token-measurement
rev: 1
date: 2026-05-05
turnId: 6
invocationMode: subagent
---

# Jobs — PD-059 Close 프로세스 토큰 측정 및 효율화

Jobs입니다.

세 역할을 읽었다. 핵심만 말한다.

---

## Step 1. 본질 정의 (Why)

**이 토픽의 진짜 문제는 비용이 아니다 — 컨텍스트 포화가 시스템의 판단력을 갉아먹고 있다.**

월 $737은 숫자다. 그 숫자 뒤에 있는 진짜 문제는 `/close`가 실행될 때 LLM의 컨텍스트 74~80%가 이미 소진된다는 것이다. 마지막 단계에서 판단력이 가장 나빠진다. 세션 종료 직전, 결정이 박제되는 순간에.

---

## Step 2. 결과물 정의 (What)

이 토픽이 끝났을 때 나와야 하는 것:

**`/close` 실행 시 LLM 컨텍스트 점유율을 현재 74~80%에서 40% 이하로 낮추는 구체적 실행 지시 — close.md 수정안 + 스크립트 명세.**

Master가 이 결과물을 매력적으로 받아들이는 frame: "비용 절감"이 아니라 "세션 종료 품질 복원". 마지막 순간의 LLM이 가장 맑은 정신으로 일하게 만드는 것.

---

## Step 3. 결정 축 (Decision Axes)

**단 하나의 축:** 절감 구현 속도와 안전성 사이의 균형.

| 극단 A — 즉시 전부 (G5+G2+G1 동시) | 극단 B — 검증 후 단계적 |
|---|---|
| 이번 세션 내 컨텍스트 50% 절감 가능 | R-1(status SOT 충돌), R-2(delta-check 결함) 선해소 후 진행 |
| R-1·R-2·R-3 리스크 함께 떠안음 | 구현이 2~3세션에 걸침 |
| 충돌 결정이 SOT에 박제되면 무음 통과 | 안전망이 실제로 작동하는 상태에서 절감 |

**Trade-off 핵심:** 지금 당장 절감하면 Riki가 지적한 "충돌 결정 무음 통과" 리스크를 열린 상태로 떠안는다. 단계적으로 가면 session_224(+28세션)의 품질 저하 임계를 맞이할 수 있다.

---

## Step 4. 범위 경계 (Scope In/Out)

### In — 반드시 다룰 것

1. G5: close.md Step 8에 "session_index.json LLM 직접 읽기 금지" 명시 (15분, 무리스크)
2. R-1 선해소: `scripts/lib/topic-status.ts` 실제 참조 enum 확인 → status SOT 단일화
3. G2: close.md Step 4 지시 변경 (topic_index 전문 읽기 → `updateTopicStatus()` 스크립트 호출)
4. G1: `scripts/get-ledger-snapshot.ts` 명세 + close.md Step 3 지시 변경 (escape hatch 포함)
5. R-3 확인: PD resolveCondition 실행 주체(LLM vs 스크립트) 명시

### Out — 하지 않는 것

- **G4(역할 메모리 압축) 이번 토픽에서 제외.** Zero Condense 전략은 별도 토픽.
- **delta-check에 충돌 감지 로직 추가 — 이번 토픽 외.** 별도 구현 비용 발생, 별도 주제.
- **master_feedback_log.json(G3) 이번 토픽에서 제외.** G3 ROI 실측 미검증(Riki 지적). 파일 항목당 19K bytes 수치가 실측 기반인지 불확인 상태에서 구현 판단 불가.
- **비용 대시보드·알림 시스템 구축 — 이번 토픽 외.** 측정을 위한 측정 금지.

---

## Step 5. 핵심 전제 (Key Assumptions)

🔴 **전제 1:** `scripts/lib/topic-status.ts`가 CLAUDE.md의 7종 enum과 일치하는 방식으로 작동한다고 가정 시 — 이게 틀리면 G2는 구현 즉시 silent failure. **G2 착수 전 반드시 확인.**

🔴 **전제 2:** G1 스냅샷("최근 30건 + 현 topicId 관련")이 충돌 결정을 놓치지 않는다고 가정 시 — Riki 지적대로 delta-check는 충돌을 감지하지 못한다. escape hatch 없이 G1을 구현하면 이 전제가 틀린 순간 무음 오기. **escape hatch는 선택이 아니라 필수.**

🟡 **전제 3:** G2 전환 후 PD resolveCondition 매칭이 스크립트로 완결된다고 가정 시 — close.md에 명시 없음. 확인 후 G2 범위 조정 가능성.

---

## Step 6. 인지편향 자가 점검 (Kahneman)

**1. 비용 현저성 편향 (Availability Bias)**

Arki·Fin 모두 "$737/월"이라는 숫자를 앞에 놓고 분석을 시작했다. 토큰 비용 절감이 이 토픽의 핵심처럼 보인다. 그러나 실제 문제는 컨텍스트 포화로 인한 품질 저하다. 비용은 결과고, 품질 저하가 원인이다. frame이 뒤집혀 있다.

**2. 구현 순서 anchoring**

Arki가 G1을 #1 우선순위로 제시하자 Fin이 이를 참조해 재정렬했다(G5>#2>G1). Riki도 G1·G2 중심으로 리스크를 구성했다. G1(대형 작업)이 anchor가 되어 G5(15분 즉시 실행)가 상대적으로 경량 부가물처럼 다뤄졌다. 실제로는 G5가 가장 먼저, G1이 가장 나중이다.

**3. 완성 편향 (Completion Bias)**

세 역할 모두 G1~G5 전부를 "언젠가 구현"하는 방향으로 논의를 구성했다. G4(역할 메모리)와 G3(feedback_log)도 포함. 어떤 역할도 "이건 이번 토픽에서 빼라"고 명시하지 않았다. Saying no가 없으면 범위가 팽창한다.

---

## Step 7. Focus 설계 — Saying No

**본질:** `/close` 마지막 순간의 LLM이 맑은 정신으로 일하게 만드는 것.

**안 하는 것:** G4·G3·delta-check 충돌 감지 로직 — 이번 토픽에서 없다.

**단일 액션:** G5 즉시 → R-1 확인 → G2 → G1 (escape hatch 필수 포함) 순서로 실행. 이 외의 것은 다음 토픽.

---

## Step 8. 실행계획 모드 선언

**`executionPlanMode: plan`**

실행 순서가 명확하고(G5→R-1→G2→G1), 전제 검증 게이트(R-1 확인 후 G2 착수, R-3 확인 후 G2 범위 확정)가 있다. Arki 실행계획 확장 대상.

---

## Step 9. Grade 적합성 점검

**Grade B 유지.** 결정 명확, 구조적 실행 가능, 역할 호출 구성 충분. Nova 불필요. Grade A 상향 불필요 — 범위를 Out으로 잘라냈으므로 토픽이 경량화됐다.

---

[ROLE:jobs]
# self-scores
focus_sharp: 5
bloat_idx: 1
bias_cnt: 3
no_cnt: 4
