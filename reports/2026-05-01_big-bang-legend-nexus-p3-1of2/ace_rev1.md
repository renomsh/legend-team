---
role: ace
session: session_153
topic: topic_131
date: 2026-05-01
turnId: 4
invocationMode: subagent
rev: 1
type: synthesis
subject: NCL safety-net track disposition
---

# Ace — NCL 안전망 트랙 단일 권고 (session_153 rev1)

## 1. 판정 대상

Master 정의 후의 단일 결정축: **NCL 안전망 트랙 처리** (α 폐기 / β 동결 / γ 축소 유지).

학습 트랙(B+C)은 별도 토픽 분리 — 본 판정 범위 외.

## 2. Structure 진단 (Porter)

### 안전망 트랙 자체의 구조

Master-first(사전) + NCL(사후) 이중 방어는 **이론적으로** Defense in Depth에 부합합니다. 그러나 구조적 정당성은 두 레이어가 **서로 다른 실패 모드를 잡을 때**만 성립합니다.

| 레이어 | 잡는 실패 모드 | 작동 시점 |
|---|---|---|
| Master-first | echo chamber 사전 차단 (Master 발언 관성) | 발언 직전 (UserPromptSubmit + PreToolUse) |
| NCL Phase A | echo chamber 사후 검출 (anchor·influence 누적) | 세션 후·턴 후 |

**문제**: 둘 다 echo chamber 한 가지 실패 모드를 노립니다. 사전 차단이 작동하면 사후 검출 대상이 사라집니다. **trade-off가 존재하지 않는 중복 투자**입니다.

진정한 Defense in Depth는 직교 실패 모드(외부 변조·자가설득·도구 거짓·저장소 오염)를 각각 다른 레이어가 잡을 때 성립합니다. NCL은 Master-first와 같은 축에서 같은 적을 노립니다.

### 11건 결정 매몰비용 처리

D-115~D-125는 인프라(prime directive·Sage·Zero·dispatch_config)와 NCL 설계가 **혼재**합니다. 인프라 결정은 이미 가동 중이며 폐기 대상이 아닙니다. **순수 NCL 설계 결정**만 deprecate하면 매몰비용 손실은 제한적입니다.

구조적 결론: **이중 방어는 이론적 호소에 불과하고, 실측은 단일 방어로 충분**.

## 3. System 진단 (Keynes)

### "향후 Nexus 주도" 시나리오의 흐름

Master 핵심 reframe — "Master first지만 향후 Nexus 주도"는 시간축에서 두 단계입니다:

1. **현재**: Master-first 영구 가동, Nexus 학습 데이터 축적
2. **임계 도달 후**: Nexus 자율 주도, Master-first 격하 또는 해제

이 흐름에서 NCL의 위치를 추적하면:

- **현재**: NCL 코드 0줄, violation 0건, Master-first가 실시간 차단 → NCL 대상 데이터 자체가 발생하지 않음
- **Nexus 주도 후**: 자율 주도 시점에서 echo chamber 위험은 *재상승* 가능. 그러나 그때의 echo chamber는 **Master 부재 시 페르소나 간 자기강화**로 모드가 바뀝니다. 현 NCL 4항목은 Master 발언 anchor 추적 설계 — **그 시점엔 부적합**합니다.

**불확실성 vs 리스크 구분**: Nexus 주도 시점의 실패 모드는 *불확실성*입니다(분포 불명). 지금 *리스크* 가정으로 NCL을 박제하면 Nexus 단계에서 재설계가 필요합니다 — Keynes의 경직된 계획 함정.

### 학습 트랙과의 시간축 상호작용

Master 분리 발언 정합성 검증:

- 학습 트랙 입력원 = Master 결정 패턴 + 기존 자산 (B+C). NCL violation은 학습 트랙 입력원이 **아닙니다** — 학습 신호가 아니라 안전망 알람이기 때문.
- Master-first가 영구화되어도 학습 트랙 데이터는 들어옴 (decision_ledger·session_index·turns 자동 누적).
- **NCL 폐기가 학습 트랙을 약화시키지 않습니다.** 두 트랙은 데이터 경로가 분리되어 있습니다.

## 4. 매몰비용·앵커링 적출 (Jobs 시각 확장)

Jobs가 sunk cost·anchoring 적출 완료. Ace는 다른 각도 추가:

**자기검증 편향(self-validation bias)** — Riki rev2가 "제 주장이 과도했다"고 자백한 점은 정직하지만, 그 자백 후에도 "지표 개념 자체는 유효"라며 γ(축소 유지)를 권고한 것은 **자기 정당화 잔여**입니다. 검출 코드 0줄·실데이터 0건의 지표를 "개념 유효"로 살리는 것은 Goodhart trap의 첫 단추입니다.

**확정편향(commitment escalation)** — 결정 박제 11건이라는 가시성이 폐기 결정의 심리적 비용을 부풀립니다. 실제 시스템 비용은 ledger entry 11건의 status 변경 한 번입니다.

## 5. 지속 가능성 단일 판정

**1000세션 후 작동 조건**:

- 안전망은 작동 중인 것 1개로 충분 (현재 Master-first).
- Nexus 주도 단계에 진입하면 그때의 실패 모드에 맞춰 *새로운* 안전망을 설계해야 함 (현 NCL 4항목 부적합).
- 인프라(Sage·Zero·prime directive·dispatch_config)는 NCL과 무관하게 가치 보존.

**지속 가능성: NO** — 현 NCL 안전망 트랙은 코드 미구현 + 부적합 시점 가정 + 단일 적 중복 투자 3중 문제. 지속 불가.

## 6. 단일 권고: **(α) NCL 전면 폐기**

Jobs 결론과 동일. Riki rev2 γ(축소 유지) 기각. 다른 근거:

1. **이중 방어 환상** — Master-first와 NCL은 같은 적·같은 축. Defense in Depth 이론 오용.
2. **시점 부적합** — 현 NCL 4항목은 Master 발언 anchor 추적용. Nexus 주도 단계에선 페르소나 간 자기강화 모드로 적이 바뀜. 재설계 필수.
3. **학습 트랙 영향 없음** — 데이터 경로 분리. 폐기로 잃는 학습 신호 0건.
4. **축소 유지(γ) 함정** — Anchor vs Synth만 살려도 측정 코드 부재 + Goodhart trap 첫 단추. "유지할 것 1개"라는 위안이 매몰비용 회수 환상.

### 처리 방식

| 항목 | 처분 |
|---|---|
| D-115 (NCL 4항목 정의) | deprecate, supersededBy = (본 세션 결정) |
| D-120·D-123·D-124 (NCL 평가·판정 주체·ack 제약) | NCL 부분만 deprecate. ack 제약(D-124)은 echo chamber 일반 방어로 잔존 가치 — Master 판단 |
| D-119·D-125 (Zero 정제 페르소나 + violation flag 차단) | NCL 폐기로 자동 무력화되는 부분만 정리. Zero 페르소나 본체는 보존 |
| `prime_directive.lock.json`·`pre-tool-use-task-sage-gate.js`·`role-sage.md`·`role-zero.md` | **보존** — NCL 무관 인프라 |
| `ncl_violations.jsonl.README.md` | 삭제 |

### 학습 트랙 처리

별도 토픽(예: topic_137+) 분리. 본 세션 범위 외. Master 결정.

## 7. versionBump

본 세션은 NCL 폐기 결정 박제 — **structural 변경**. Nexus 자동 감지 hook이 +0.1 박제 예정. Edi가 세션 종료 시 §6 절차로 확정.

## 8. Master-first 영구화 caveat

Master 분리 발언이 "Master-first는 영구 가동" 함의를 포함하지 않을 수 있습니다. 본 권고는 Master-first 현 가동 상태 유지를 전제합니다. 만약 Master-first도 향후 격하·해제 계획이라면 안전망 트랙 자체를 재설계해야 하며 그 시점은 본 세션 외입니다.

---

ACE_WRITE_DONE: reports/2026-05-01_big-bang-legend-nexus-p3-1of2/ace_rev1.md

[ROLE:ace]
# self-scores
rfrm_trg: Y
ctx_car: 0.95
mst_fr: 0.85
ang_nov: 3
