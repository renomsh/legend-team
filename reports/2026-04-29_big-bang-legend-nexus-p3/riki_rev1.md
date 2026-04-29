---
role: riki
session: session_140
topic: topic_131
date: 2026-04-29
turnId: 1
invocationMode: subagent
rev: 1
---

# Riki 리스크 감사 — session_140 (NCL + 학습효과 3루트)

## 감사 범위

- Ace 지목 함정 3개 교차 검증
- Riki 독자 감사: NCL 피드백 루프 폐쇄 여부, 학습루트 오픈루프 위험, Goodhart's Law

---

### 🔴 R-1. NCL은 사후 진단 도구 — 피드백 루프가 닫혀 있지 않다

**지점:** NCL을 "집단지성 작동 여부 측정"으로 정의했으나, 측정 결과가 다음 세션의 프로세스를 어떻게 바꾸는지 경로가 미정.

**구체 구조:**
- NCL이 `Diversity Index = 0.2` (특정 에이전트 독점)를 기록한다
- 다음 세션에서 누가, 어떤 시점에, 이 수치를 읽고, 무엇을 바꾸는가 — 미정
- 루트 ②("역할별 반영률 → A축 라우팅 알고리즘 자기고도화")의 실행 주체와 트리거 없음

**실패 모드:** NCL이 축적되지만 아무도 읽지 않는 로그가 됨. s139 echo chamber가 NCL 도입 후에도 반복됨.

**완화 조건:** 루트 ② 정의 시 "어떤 조건에서 누가 NCL 수치를 읽고 무엇을 변경하는가"를 세션 내 명시. 자동화가 아니라면 Master 수동 검토 주기와 반영 경로 박제.

**Fallback:** NCL을 자동화 입력 포맷으로 두지 말고 "Master가 session close 시 열람하는 대시보드 지표"로 격하. 피드백 루프는 Master가 닫는다.

---

### 🔴 R-2. Influence Score — 측정 자체가 현 아키텍처에서 불가

**지점:** "총 발언량 대비 최종 반영 비율"이라고 정의되어 있으나, "최종 반영"의 판정 주체가 없음.

- Origin Trace("문장 단위 에이전트 귀속 자동 파싱 로직 없음 — 스펙만 정의") 미구현 상태에서 Influence Score 계산 불가
- "최종 반영됐다"고 판정하는 자동화 경로 미존재

**실패 모드:** 측정 불가 지표를 정의만 해두고 실제 데이터 없이 NCL 파일을 텅 빈 채 박제. 측정이 아닌 의례가 됨.

**완화 조건:** Origin Trace 구현 완료 = Influence Score 계산의 선행 조건으로 결정에 명시. 이번 세션 NCL 항목 우선순위를 Origin Trace 미구현 상태 기준으로 재정렬.

**Fallback:** Influence Score를 Phase 2 이후(Origin Trace 구현 완료 후)로 이연. 이번 세션 박제 NCL 항목은 Diversity Index + Anchor vs Synth 2건만 (수동 측정 가능).

---

### 🟡 R-3. Goodhart's Law — NCL 수치 최적화가 집단지성을 왜곡

**지점:** 루트 ① "Influence Score → system_prompt 업데이트"

Influence Score가 역할 선발 기준이 되는 순간, 각 역할이 "반영률 높이기"를 암묵적으로 학습함.

**실패 모드:**
- Arki가 "내 발언이 최종 결정에 많이 반영되는 방법"을 학습
- Diversity Index 높이기 위해 다른 역할 발언을 의도적으로 짧게 유도하는 패턴 발생
- 측정 지표가 측정 대상(집단지성)을 파괴하는 고전 Goodhart 패턴

**완화 조건:** 루트 ① 업데이트 기준을 "Influence Score 절대값"이 아닌 "Diversity Index + Anchor vs Synth 연동 패턴"으로 설계. 단일 지표 최적화가 아닌 복합 패턴 판정으로.

**Fallback:** 루트 ① 자동화 유보 + Master 수동 판단 gate 유지. Goodhart 패턴 실증 전까지 자동 system_prompt 업데이트 금지.

---

## 기각 선언

다음은 의도적으로 제외:

- 루트 ① system_prompt 기술적 가능성 — Ace 지목 함정, 중복 회피
- Diversity Index 계산 주체 — Ace 지목 함정, 중복 회피
- P2 페르소나 박제 미착수 — Ace가 이미 🔴 명시, 추가 감사 가치 없음
- NCL 저장 위치 결정 지연 — 리스크가 아닌 이번 세션 작업 항목

---

## 핵심 요약

NCL의 가장 큰 구조적 결함은 피드백 루프가 닫혀 있지 않다는 것입니다. 측정→학습→변화 경로에서 "변화"를 집행하는 주체와 트리거가 모두 미정입니다. 이것이 해결되지 않으면 NCL은 echo chamber를 진단하는 또 다른 기록 파일로 전락합니다.

---

```
[ROLE:riki]
# self-scores
crt_rcl: Y
cr_val: 4
prd_rej: Y
fp_rt: 0.10
```
