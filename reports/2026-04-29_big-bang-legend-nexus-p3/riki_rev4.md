---
role: riki
session: session_140
topic: topic_131
date: 2026-04-29
turnId: 4
invocationMode: subagent
rev: 4
---

# Riki rev4 — Arki rev3 재검토

## 결론

⚠ **조건부** — 누락 4건 반영 방향은 맞으나, **C-5 enforcement 부재**·**Zero 단순화 임무공백**·**echo chamber (b) 과대평가** 3건 차단. D-119/D-120 박제는 **가안 단계로 보류** 권고.

---

## 축 1. 누락 4건 반영 적정성

### 1-1. prime directive P2 박제 — ⚠ 조건부

P2 위치 자체는 합리적입니다. 페르소나 spec과 동시 박제해야 P3 hook 재배선 시 참조 가능하다는 인과는 맞습니다. 다만 **prime directive 내용(Affaan 4 도그마)이 본 세션에서 단 한 번도 원문 확인 없이 인용되고 있습니다**. D-113 박제 당시(s138) "악의 텍스트 유입·도구설명 거짓·저장소 오염·모델 설득 전제하" 4항목이 어떤 위협 모델에 anchor된 것인지 본 세션 turn 어디서도 재검증되지 않았습니다. P2 박제 직전에 외부 anchor 검증 1회 필수.

### 1-2. C-4 Zero 단순화 (D-119) — ❌ 차단

D-110(원본 유지)을 D-119가 supersede한다는 처리 방향은 맞으나, **잃는 것 평가가 누락**되었습니다:
- Cut/Refine/Audit 3 스킬 폐기 시: 코드 다이어트는 Cut 일부만 흡수. **Audit(자가감사)·Refine(점진 개선)** 잔존 임무가 어디로 가는지 미정의.
- 하드코딩 섬멸 + 코드 다이어트 2 미션은 **결과 미션**(what)이고, 3 스킬은 **수단**(how)이었음. 다른 차원의 단순화이므로 supersede 단순 처리 부적절.
- D-110 폐기 결정은 s138 종료 직전 1회 권고만으로 supersede하기에 근거 부족. revision_history 박제 전 **Zero 잔존 임무 매핑** 1차 산출 필요.

### 1-3. echo chamber (b) "거의 흡수" — ❌ 과대평가

Sage 외부 채점이 자기감사 강제를 "거의 흡수"한다는 판정은 과합니다:
- s139 진단의 핵심은 **세션 진행 중 실시간 자기감사 부재** — Arki가 1차 발언 후 Master "한번 더"에 흔들린 것은 **세션 종료 후 채점이 아니라 발언 직후 self-check**가 막아야 했음.
- Sage는 사후(다른 세션)에 작동 → s139 패턴 재발은 막지 못함. Riki adversarial이 잔존 역할이지만 Riki도 본 세션 turn 1·turn 4에서 자기 모순(R1 critical→안B 우선) 보였음.
- 정확한 판정: **(b) 부분 흡수** — 세션 간 echo chamber는 차단, 세션 내 echo chamber는 미해결.

### 1-4. echo chamber (a) "부분 흡수" — ✅ 통과

NCL Anchor 필드는 슬롯이지 강제 아님 — 이 판정은 정확합니다. (a) 외부 anchor 필수 hook은 별도 토픽 분리 타당.

---

## 축 2. 새로 생긴 리스크

### 🔴 R-5. C-5 enforcement 부재

"위반 시 발화 무효"가 선언만 있고 메커니즘이 없습니다.
- 누가 위반을 판정하는가? Master? Riki? Sage? 미정.
- "발화 무효" = 영수증 미발행? 다음 페르소나가 무시? 출력 차단? 미정.
- **외부 anchor**: PD-052(Ace 사칭 차단 hook)가 같은 패턴으로 미해결 잔존 중. 선언과 hook의 비대칭이 본 시스템 반복 실패 모드.
- 완화: P2 박제 시 enforcement 메커니즘 1줄 명시(예: "위반 발화는 NCL에 violation flag 영수증 발행 + Master 즉시 통보") — 미정의 시 prime directive는 장식이 됨.

### 🟡 R-6. 컴포넌트 표 prime directive 1행 추가 — 분류 혼동

prime directive를 컴포넌트 표 1행으로 추가한 동시에 본문에서 "토폴로지 위 메타 제약 (컴포넌트 아닌 정책 레이어)"로 명시 — **표와 본문이 모순**. 표에서 빼고 별도 섹션 0(prime directive)으로 분리하는 게 깔끔합니다.

### 🟡 R-7. Zero 미션 단순화 시 잔존 공백 (R-5와 별개)

위 1-2 참조. 현재 spec으로는 D-119 박제 시 Zero 페르소나가 무엇을 하는지 불완전.

---

## 축 3. s139 echo chamber 재발 위험

### 본 세션(s140) Arki rev1→rev2→rev3 변화 패턴

- rev1·rev2 미확인 (Read 안 함). rev3만 본 판단:
- rev3 결론 "✅ rev2 골격 유지 + 누락 4건 반영" — Master "누락 4건 있음" 지시에 100% 합치하는 결과물.
- **외부 anchor**: rev3에서 인용된 외부 anchor는 회계 분개장 원칙·항공기 cockpit 원칙(R-3 turn 1·2·3 Riki rev3 인용)뿐. **Arki rev3 자체는 외부 anchor 0건**.
- 누락 4건이 실제 객관적 누락인지, Master가 "누락 있다"고 한 압력에 anchor한 것인지 분리 불가.

⚠ **재발 위험 중간**. rev3가 합리화로 흐른 직접 증거는 약하나, 외부 anchor 0건이라는 사실 자체가 s139 패턴과 동형.

---

## 축 4. 즉시 박제 6건 (D-115~D-120) 적정성

| 후보 | 판정 | 근거 |
|---|---|---|
| D-115 NCL 4항목 + 규칙 기반 | ✅ 박제 | rev3 Riki 검토에서 구조적 정합성 확인 |
| D-116 self-scores YAML 병행 | ✅ 박제 | D-092 호환, 위험 낮음 |
| D-117 Big Bang 5 Phase 순서 | ✅ 박제 | D-114 supersede 명확 |
| D-118 토폴로지 = Star + Nexus first-speaker | ✅ 박제 | D-111 보강, 위험 낮음 |
| **D-119 Zero 미션 2개로 단순화** | ❌ **보류** | 잔존 임무 매핑 미정 (R-7), D-110 supersede 근거 부족 |
| **D-120 prime directive P2 CLAUDE.md 박제** | ⚠ **조건부** | enforcement 메커니즘 1줄 추가 후 박제 (R-5) |

---

## 방향축 판정

⚠ **조건부 ✅** — 골격은 유지, 단 다음 3건 완화 후 D-119/D-120 박제:
1. C-5 enforcement 메커니즘 1줄 명시 (R-5)
2. Zero 잔존 임무 매핑 1차 산출 (R-7, D-119 보류)
3. echo chamber (b) "거의 흡수" → "부분 흡수"로 정정 (세션 내 미해결 명시)

prime directive 표 1행 분류 혼동(R-6)은 cosmetic, 박제 직전 정리 권고.

---

```
[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
```
