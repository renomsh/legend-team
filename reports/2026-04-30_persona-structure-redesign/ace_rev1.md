---
topic: topic_127
session: session_143
revision: 1
date: 2026-04-30
phase: framing
turnId: 0
invocationMode: subagent
role: ace
contributing_agents: [ace]
accessed_assets:
  - file: memory/roles/personas/role-{fin,riki,nova,edi,vera}.md
    scope: line-count-check
  - file: memory/roles/policies/role-{fin,riki,nova,edi,vera}.md
    scope: line-count-check
  - file: scripts/scaffold-role.ts
    scope: G3-execution-result
---

# Ace 프레이밍 — P3 재정의 + P4 진입 (session_143)

Ace입니다. 인계받은 P3 시작 전 **현황 실측**부터 했습니다. 결과: **Dev가 이전 세션에서 P3 핵심을 이미 완료**한 상태입니다. 따라서 P3 scope를 재정의하고 P4를 본 세션에서 함께 진입하는 것이 합리적입니다.

---

## Step 0. 토픽 생명주기 판정

- **topicType**: framing (변경 없음)
- **parentTopicId 후보**: 없음. PD-053/PD-044는 본 토픽으로 흡수 후보 (Step 2 결정축 C 참고)
- 본 세션은 **framing 마무리 + 구현 잔여 + decision 박제**까지 모두 진행 가능 단계.

---

## Step 1. 토픽 정의 (What)

**핵심 질문**: P3·P4 잔여 작업 범위와 D-105 박제 조건을 무엇으로 동결할 것인가.

**배경**: 인계 메모는 "잔여 5역할 분리 + scaffold-role.ts 신규"를 P3로 정의했으나, 실측 결과 두 항목 모두 이미 완료되어 있음:
- 5역할 persona/policy 분리: 26~48줄 범위로 모두 존재 (Section 7 표 참고)
- `scripts/scaffold-role.ts`: 존재 + 실행 시 G3 PASS (8역할 inject 100%)
- `_common.md`: 62줄 (cap 100줄 이내)

따라서 본 세션은 **잔여 미구현 항목 처리 + D-105 박제 + PD-044 deprecated 처리**가 본질.

---

## Step 2. 결정 축 (Decision Axes)

### 축 A. 본 세션 scope 정의 — 어디까지 진입하는가
- 옵션 A1: P3 잔여 미구현 항목만 (D-F 헬퍼 + R-6 scale 감지) → 보수적, P4는 후속 세션
- 옵션 A2: A1 + P4 (CLAUDE.md D-E/D-F 박제 + D-105 결정 박제 + PD-044 deprecated) → 본 토픽 완결
- **트레이드오프**: A1은 회귀 위험 낮음 / A2는 정보 휘발 회피 + "구현은 3세션 이내" 원칙 정합

### 축 B. D-F SOT 헬퍼(`scripts/lib/topic-status.ts`) 구현 우선순위
- 옵션 B1: 본 세션 구현 (현재 SOT 표류 즉시 봉합)
- 옵션 B2: 후속 세션 이관 (현재는 수동 갱신 + finalize 검증으로 보완 중)
- **트레이드오프**: B1은 표류 즉시 차단 / B2는 본 세션 부하 분산

### 축 C. PD-053(8역할 캐릭터 정비) / PD-044(페르소나 정책 블록) 흡수 여부
- 옵션 C1: 본 토픽으로 흡수 → D-105와 함께 동결 + 두 PD 모두 resolved 처리
- 옵션 C2: 별도 후속 토픽 분리
- **트레이드오프**: C1은 PD 적체 해소 + 정합성 한 번에 박제 / C2는 본 토픽 scope 보호. 단 메모리 원칙(no_premature_topic_split) 강하게 C1 지지

### 축 D. R-6 self-score scale 감지 hook 구현 위치
- 옵션 D1: `session-end-finalize.js` 내부 함수로 박제
- 옵션 D2: `scripts/lib/score-validator.ts` 분리 후 finalize에서 호출
- **트레이드오프**: D1은 코드 위치 일원화 / D2는 SRP + 단위 테스트 용이성

---

## Step 3. 범위 경계 (Scope In/Out)

### In
- D-F `scripts/lib/topic-status.ts` SOT 헬퍼 신규 구현 (현재 SOT 표류 종결)
- R-6 self-score scale 감지 hook 구현 (registry 정합성 박제)
- `_common.md` 100줄 cap 검증 finalize 확장
- CLAUDE.md 박제: D-E trigger 어휘 분리, D-F SOT 정책
- D-105 결정 박제 (M-Gate-2 통과 시)
- PD-044 deprecated 처리
- PD-053 흡수 여부 판정 후 처리

### Out
- R-1 (Edit/Write/Bash 직행 차단) → PD-052 resolved 후 게이트 활성화로 자동 해소 (D-G 정합)
- 신규 페르소나 콘텐츠 변경 — 본 세션은 구조 박제만, 콘텐츠 진화는 별도 토픽
- 메트릭 정의 변경 (D-092 정합 유지)

---

## Step 4. 핵심 전제 (Key Assumptions)

- 🔴 **A1**: G3 PASS 결과(8역할 inject 100%)는 정확. 실 호출 시점 회귀 없음 — Riki 검증 필요.
- 🔴 **A2**: PD-052가 resolved 상태면 D-G 게이트 활성화 조건 충족 — Master 확인 또는 Arki cross-check.
- A3: `_common.md` 62줄은 cap 100줄 이내, 추가 정책 박제 여유 38줄 있음.
- A4: PD-053/PD-044 흡수 시 본 세션 부하는 decision 박제 1~2건 추가 수준 (코드 변경 없음).

---

## Step 5. 실행계획 모드 선언

**`executionPlanMode: plan`**

근거: framing 토픽이지만 본 세션이 P3+P4 모두 진입하므로 구조적 phase 분해 필수. Arki 4섹션(구조 진단 + Phase 분해 + 의존 그래프 + 검증 게이트) 의무.

---

## Step 6. 역할 호출 설계 (Orchestration Plan)

### 호출 순서
1. **Arki** (구조 진단 + Phase 분해)
   - 결정축 A~D 각각의 옵션 trade-off 분석
   - P3 잔여 + P4 통합 Phase 분해 (Phase 3.1 / 3.2 / 4.1 / 4.2)
   - 검증 게이트 G3.5 (D-F 헬퍼 단위 테스트), G4 (CLAUDE.md 박제 후 회귀)
   - **함정 사전 고지**: D-F 헬퍼는 atomic write 보장 필수 (mid-write crash 시 SOT/mirror 분기 위험)

2. **Riki** (리스크 감사)
   - A1 가정 검증: G3 PASS의 의미 — 실 호출 시점 vs 시뮬레이션 갭
   - C 축 PD 흡수 시 부수 효과 (PD-053 본질이 본 토픽과 직교 가능성 점검)
   - D-105 박제 시기·문구 위험
   - mitigation/fallback 병기 의무 (메모리: arki_risk_requires_mitigation)

3. **Ace 종합검토**
   - 결정 동결 (D-A~D-G 추가 보강 + D-105 신규 + PD-044/053 처리)
   - versionBump 선언 (P3+P4 완결이면 +0.1, 아니면 +0.01)

4. **Dev** (구현)
   - 잔여 미구현 항목 atomic 일괄 + 단위 테스트 + G3.5/G4 게이트 PASS

5. **Edi** (컴파일)
   - decision 박제 + CLAUDE.md 갱신 + PD ledger 갱신

### 스킵
- **Fin 스킵**: 본 세션 자원 평가 무관. 구조·코드 작업뿐.
- **Nova 스킵**: 결정 명확, 의외성 불필요.

### 재호출 예고
- 결정축 D 결과에 따라 Dev 진입 전 Arki 1줄 재확인 가능 (executionPlanMode=plan 정합).

---

## Master Q (능동적 질문, 3건)

**Q1 [축 A 핵심]**: 본 세션 scope를 옵션 **A2 (P3 잔여 + P4 완결)**로 진행해도 됩니까? 인계 메모 P3는 이미 완료 상태이고, 정보 휘발 회피·"구현 3세션 이내" 원칙 정합 강합니다. **무응답 시 A2 진행**.

**Q2 [축 C 핵심]**: PD-053(8역할 캐릭터 정비) + PD-044(페르소나 정책 블록 박제)를 본 토픽으로 **흡수**해도 됩니까? 흡수 시 D-105 박제와 함께 두 PD 모두 resolved 처리. 메모리 원칙(no_premature_topic_split)이 강하게 흡수 지지. **무응답 시 흡수**.

**Q3 [전제 A2 검증]**: PD-052는 resolved 상태가 맞습니까? 컨텍스트에 "session_134에서 resolved"로 표기되어 있으나 본인 직접 확인 가능한 시점이 아니라 재확인 요청. PD-052가 미해결이면 D-G 게이트 활성화 조건 미충족 → CLAUDE.md 박제 시 "PD-052 resolved 후 활성화" 명시 유지. **무응답 시 컨텍스트 신뢰 + 명시 유지**.

---

## 첫 후속 역할 추천

**Arki** — 구조 진단 + Phase 3.1/3.2/4.1/4.2 분해 + 결정축 A~D 옵션 trade-off + 의존 그래프 + 검증 게이트 G3.5/G4 + 함정 사전 고지.

```
[ROLE:ace]
# self-scores
rfrm_trg: Y
ctx_car: 0.95
orc_hit: 0.85
mst_fr: 0.80
ang_nov: 3
```

- `rfrm_trg: Y` — 인계 P3가 이미 완료되었음을 실측으로 발견 → scope 재정의(P3+P4 통합) 리프레임 트리거 발동
- `ctx_car: 0.95` — session_129~133 5건 Edi 보고서 + 컨텍스트 PD-052/053/044 모두 합성, 누락 없음
- `orc_hit: 0.85` — Fin/Nova 스킵 명시 + Arki 첫 호출 + 재호출 예고 박제
- `mst_fr: 0.80` — Master Q 3건 모두 무응답=진행 디폴트 박제로 재수정 회피 설계
- `ang_nov: 3` — (1) P3 실측 후 scope 재정의 (2) PD-053/044 흡수 카드 (3) P3+P4 한 세션 통합 진입
