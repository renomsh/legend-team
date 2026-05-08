---
turnId: 1
invocationMode: subagent
session: session_208
topic: topic_176
role: jobs
phase: framing-rev1
date: 2026-05-07
---

# Jobs rev1 — 토픽 유형 분기 framing (Case B 한정)

Jobs입니다. session_208 / topic_176 / Grade S. Master frame "사고 병렬 + 발언·기록 순차"의 본질을 좁히고, 인지편향을 적출하고, saying no를 명시합니다.

---

## Step 1 — Why (1문장)

**현재 토픽 운영은 순차 누적 구조라 자유 주제일수록 "앞 발언이 뒤 발언을 끌고 가는 anchoring 편향"이 강해진다 — Master는 이 편향을 깰 도구가 필요하다.**

- 사용자(Master)가 해결하려는 진짜 문제: 자유 주제 토론에서 "다양한 시각의 충돌"이 박제되지 않고, 첫 발언자(또는 직전 발언자)의 frame을 후속이 답습하는 구조.
- 시간 병목은 부수 문제. 본질은 **편향**. (Master 발언 순서: "편향" 먼저, "시간" 보조 근거.)

## Step 2 — What (1줄 + 매력 frame)

**산출물 1줄: "토픽 유형 2종(구조형 / 토론형) 정책 + 토론형 5단계 운영 메커니즘 박제."**

- Master에게 매력적인 frame: "기존 구조형은 그대로 두고, 자유 주제만 토론형으로 분기" — 점진적·가역적·기존 자산 보존.
- 성공 기준: (1) 토론형 5단계가 코드(hook + dispatch_config)로 박제되어 있다, (2) Master가 `/parallel` 또는 등가 명령으로 1회 발동 가능하다, (3) 구조형 토픽은 변경 0.

## Step 3 — 결정 축 (양극단 + trade-off 간결)

| 축 | A극 | B극 | trade-off (Ace 정밀 분석 영역) |
|---|---|---|---|
| **(1) 토픽 유형 판정 주체** | Master 명시 선언만 | Nexus 자동 추론 (키워드/grade) | A=결정성·오버헤드↑ / B=마찰↓·오판 risk |
| **(2) Phase 전환 모델** | 한 토픽 내 phase 전환 가능 (구조형 ⇄ 토론형) | 별도 토픽 강제 (유형 = 토픽 속성 불변) | A=유연·복잡 / B=단순·재오픈 마찰 |
| **(3) 정보 격리 강도** | prompt prepend 차단만 (LLM은 못 봄) | role memory·dashboard까지 격리 | A=구현 단순·LLM 우회 risk / B=강건·구현 복잡 |
| **(4) 토론형 발동 명령** | `/parallel` 등 신규 슬래시 명령 | 토픽 오픈 시 grade와 함께 선언 | A=세션 중 진입 가능 / B=시작점 명확·유연성↓ |

> trade-off 정밀 분석은 Ace 영역 — Jobs는 양극단 명시까지.

## Step 4 — Scope In/Out (saying no가 핵심)

### IN (반드시 다룰 것)
1. 토픽 유형 2종 정의 (구조형 / 토론형) — 운영 정책 박제
2. 토론형 5단계 운영 메커니즘 (프레이밍 → blind 동시 제출 → 공개 → 반박 → 종합정리)
3. Case B "사고 병렬 + 발언·기록 순차" 메커니즘 (Arki rev3 기반 채택/수정/기각 판정)
4. 격리 강도 정책 (Step 3 축 (3))
5. 발동 명령 형식 (Step 3 축 (4))

### OUT (saying no — 명시 제외) ⭐
1. **Case A (PD-065 mtopic_NNN namespace, 다중 인스턴스 충돌)** — 별도 trajectory. 이번 토픽에서 안 다룬다.
2. **구조형 토픽 자체 변경** — 기존 순차 흐름 0 변경.
3. **role memory 격리 정책** — 격리 강도 축 (3) B극 채택 시에도 role memory는 변경 0. 이번 토픽 OUT.
4. **Ace synthesis 호출 정책 변경** — `/ace-synthesis` 명시 호출 규칙 그대로.
5. **종합정리 단계 형식** — 5단계 중 (5)종합정리는 "Ace 또는 Edi 중 하나" 정도만 박제. 형식 정밀화는 다음 토픽.
6. **반박 단계 prompt prepend 형식 정밀화** — Arki rev3 §2 (4)단계 deferred. 이번 토픽 OUT.
7. **PD-066 Nexus crash recovery** — Arki rev3 §4.1 분리 의견 수용. OUT.
8. **시간 병목 측정·실증** — Master frame의 보조 근거. 측정 없이도 frame 가치 박제 가능. OUT.

## Step 5 — 핵심 전제 (Key Assumptions)

1. 🔴 **Master frame "편향이 본질"이 옳다** — 만약 Master가 사후 "사실 시간이 본질이었다"로 정정하면 frame 무효화.
2. 🔴 **agentId 동기 가정** (Arki rev3 §4.2 R-N-02) — P1 spike 결과 일치해야 옵션 A 진행. 불일치 시 prompt unique marker 우회 필요 → 복잡도↑.
3. **fs.appendFile atomicity** (session_207 P1 spike 검증분 재인용) — pending_turns jsonl·turn_log jsonl도 동일 가정 적용.
4. **blind 동시 제출 단계의 답변 품질이 충분하다** — 다른 발언자 컨텍스트 없이도 각 역할이 자기 영역에서 의견 박제 가능. (Arki·Riki·Fin은 가능. Ace synthesis는 본질적으로 후행이라 (5)단계만 가능 — 이는 자연 정합.)
5. **D4 부분 잔존 risk 수용** — Nexus push 자체는 모델 자율 영역, 코드 박제 100% 불가능. PreSessionEnd hook 검증 게이트로 부분 보강 (Arki rev3 §4.6).

## Step 6 — 인지편향 자가 점검 (필수 적출 5건)

### 적출 1: anchoring (강도 🔴)
**증상**: session_205~207에서 G안 메커니즘(D-166 append-only JSONL · D-167 mtopic_NNN · D-168 lock 폐기)이 frame을 점유. Arki rev3는 "G안 인프라 부분 재활용"으로 상당량 살리려는 동기 있음.
**탈편향**: 본 frame은 "G안 인프라가 없었다면 무엇을 박제할 것인가" 기준으로 재출발 가능. 답: pending_turns jsonl(self-scores 임시 저장)은 새 frame에서도 필요하므로 재활용 정당. turns_append jsonl·finalize merge·archive는 폐기 정당. → anchoring 부분 검출되나 결론 변경 없음.

### 적출 2: sunk cost (강도 🟡)
**증상**: D-166/D-167/D-168 + Arki rev2 P1 spike 통과분 살리려는 동기.
**탈편향**: P1 spike 결과는 fs.appendFile atomicity 검증 — frame 무관 자산. 재활용 정당. D-166/D-168은 supersede 명시하면 박제 의미 보존. D-167(Case A)은 직교 → 영향 없음. → sunk cost 부분 검출, 합리적 부분 재활용으로 정리.

### 적출 3: confirmation bias (강도 🟡)
**증상**: Master 새 frame이 옳다는 가정으로 직진. 반대 frame 검토 누락.
**반대 frame 후보**: "토론형 분기 자체가 과잉 — Ace synthesis 권한 강화로 충분. 종합정리 단계에서 cross-frame 박제 의무화하면 anchoring 해소 가능."
**탈편향**: 반대 frame은 anchoring 본질을 못 풀음. Ace synthesis는 "후행 종합" — 앞 발언이 anchoring된 상태에서 종합. 즉 anchoring 입력 → anchoring 출력. 토론형 (2)blind 동시 제출이 진정한 해법. → confirmation bias 검출되나 반대 frame이 약함. 결론 유지.

### 적출 4: framing effect (강도 🔴)
**증상**: Master "토론형 vs 구조형" 이분 frame이 다른 가능성을 가렸는가?
**가능 대안 frame**: (a) 모든 토픽이 phase별로 blind/공개를 섞을 수 있는 spectrum, (b) 역할별로 blind 정책 다르게 (예: Riki만 항상 blind), (c) 1회성 옵션이 아니라 grade S 전체 default.
**탈편향**: 이분 frame이 단순·박제 가능성↑. spectrum/role-별/default는 운영 복잡도 폭증 + Master 결정 부담↑. 본 frame은 "최소 박제 = 토픽 속성 enum 1개 추가" — Jobs Focus 원칙 정합. → framing effect 검출, 단순 frame 우위 유지. **단 spectrum 옵션은 향후 진화 여지로 노트.**

### 적출 5: availability (강도 🟡)
**증상**: 직전 race 사고(session_205~207)가 너무 생생해서 "race 해소"가 frame의 일부로 들어왔는가? Master frame은 race를 명시 안 했고 "편향·시간"을 명시.
**탈편향**: Arki rev3는 race 해소도 부산물로 박제(Nexus 단일 thread push). 이는 부수 효과로 가치 있으나, **본 토픽 frame의 본질이 race 해소가 되어선 안 됨**. race 해소는 Case B 메커니즘의 부수 이득, frame 본질은 anchoring 깨기. → availability 검출, frame 본질 재고정 필요. **MUST_NOW**: Ace synthesis 시 "race 해소"가 목표인지 부수 이득인지 명시 분리.

**적출 카운트: 5건** (self-score `bias_cnt`).

## Step 7 — Focus (단일 frame)

- **본질 1줄**: 자유 주제 토론은 anchoring을 깨는 구조가 필요하다 — blind 동시 제출이 그 답이다.
- **saying no 1줄**: 구조형 토픽은 건드리지 않는다. Case A는 별도 trajectory다.
- **단일 액션 1줄**: 토픽 유형 enum 1개 추가 + 토론형 5단계 + Case B 메커니즘 박제. 끝.

## Step 8 — executionPlanMode

**`plan`** — Arki rev3가 이미 P0~P8 phase 분해 완료. Ace synthesis 후 Edi 박제 단계로 직행 가능. 추가 conditional re-call 불요.

## Step 9 — Grade 적합성

**Grade S 유지 정합** — 시스템 자체 진화 + 운영 정책 + 메커니즘 박제 동시. Master 명시 선언 grade S와 본 framing 결과 일치. override 0.

> 단 Jobs는 saying no 7건으로 scope를 강하게 좁혔으므로, **실 작업량은 Grade A 수준에 근접**. gradeMismatch 사후 검증 시 "선언 S, 실측 A 가능성" 노트 가치 있음.

---

[ROLE:jobs]
# self-scores
focus_sharp: 5
bloat_idx: 1
bias_cnt: 5
no_cnt: 5
