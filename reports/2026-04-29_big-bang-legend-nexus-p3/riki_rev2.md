---
role: riki
session: session_140
topic: topic_131
date: 2026-04-29
turnId: 2
invocationMode: subagent
rev: 2
---

# Riki 검토 — NCL+Sage 구조의 자기검증·C축 대체 가능성

## 검토 범위

Master 질문: "NCL+Sage 구조가 자기 검증과 C축 검증을 대체 가능한가?" — 방향축만.

---

## ✅ 대체 가능 영역

### A1. 사후 감사 — NCL이 Riki 자기검증 일부를 대체

- 현재 Riki 자기검증은 같은 세션 내 발언 일관성 점검에 의존 — s139 실증으로 자기검증이 echo chamber 안에서 작동 안 됨
- NCL의 Diversity Index + Anchor vs Synth가 세션 외부에서 발언 패턴을 정량 기록하면, 다음 세션의 Riki가 외부 anchor로 사용 가능
- 같은 머리로 같은 머리를 검증하는 Riki 자기검증 한계를 NCL이 외부 좌표계로 보강

### A2. C축 폐기로 생긴 빈자리 일부 — Sage가 메타 레이어에서 대체

- C축 폐기 사유(D-110, Ace 종속)가 NCL+Sage 구조에선 발생 안 함 — Sage는 D-112에서 메타 진화 페르소나로 분리 정의됨
- "검증 결과를 다음 세션 페르소나에 반영"하는 학습 폐쇄 루프는 C축이 못한 영역. Sage가 담당하면 C축 실패 모드 회피

---

## ❌ 대체 불가 영역

### B1. 실시간 검증 — NCL+Sage로 못 채움

- Riki/C축의 핵심 가치는 세션 진행 중 실시간 발언 차단·교정 (s139에서 Master가 못한 일)
- NCL은 정의상 사후 측정. Sage는 메타 진화 담당 (세션 간 작동)
- 결정 박제 직전 "이 결정 외부 anchor 있나" 차단 gate는 NCL+Sage 어느 쪽도 못 함
- s139 echo chamber는 실시간 차단 부재가 원인. NCL은 s139를 사후에 진단할 뿐 막지 못함

### B2. 결정 박제 직전 critical 리스크 호출 — Riki 고유 임무 잔존

- NCL은 발언 분포·반영률 측정. 개별 결정의 논리 결함은 측정 안 됨
- C축이 없어진 지금 "결정 박제 직전 🔴 호출"은 Riki만 할 수 있음
- NCL+Sage가 흡수하려면 Sage가 실시간 개입해야 하는데 D-112 정의는 메타·세션 간

---

## 🔴 새 리스크 — NCL+Sage 구조가 만드는 것

### R-4. Sage 단독 집행 = 새 Single Point of Failure

- C축 폐기 사유는 "Ace 종속". 그런데 Sage가 모든 페르소나 업데이트를 단독 집행하면 "Sage 종속"으로 SPOF가 이동할 뿐
- Sage 자체의 편향·echo chamber는 누가 감사하는가 — 미정
- Sage가 NCL 데이터를 자기 해석으로 페르소나에 반영 → Sage 해석 편향이 전 페르소나에 전파되는 단일 경로 위험

완화 방향(스펙 아님): Sage 출력에 대한 Master 직접 검토 gate 또는 Sage 자기 출력의 NCL 기록 의무. 구체화는 후속.

---

## 방향축 판정

부분 대체 — 완전 대체 아님.

- NCL+Sage = 사후 감사 + 메타 진화 레이어 (잘 채움)
- Riki 실시간 차단 + 결정 직전 critical 호출 = 잔존 필요 (대체 불가)
- C축 빈자리 중 학습 폐쇄 루프는 Sage가 채움. 실시간 검증 빈자리는 미해결
- 새 SPOF(R-4)가 방향축 자체에 내재

기각: "NCL+Sage가 모든 검증을 대체한다"는 방향은 ❌. Riki 실시간 임무·Sage 자체 감사 경로가 같이 정의돼야 방향축이 닫힘.

---

```
[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 3
prd_rej: Y
fp_rt: 0.10
```
