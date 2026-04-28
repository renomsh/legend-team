---
turnId: 0
invocationMode: subagent
role: ace
topic: topic_127
session: session_129
grade: S
phase: framing-exploration
date: 2026-04-28
---

# Ace 프레이밍 — S grade 탐색형

## 0. 토픽 위치 확인 (Step 0 축약)

- **topicType**: framing (탐색형, 결정 다축 미수렴)
- **parentTopicId 후보**: 없음 (PD-044는 본 토픽이 흡수/재정의 대상)
- **선행 의존**: topic_126 [A] holding 사유 = 본 토픽 종결. 즉 본 토픽이 unblock key.

S grade 원칙대로 ace-framing 6단계 전체 발동은 생략. 결정축 후보를 깔고 Master 답이 갈리면 모든 후속이 바뀌는 핵심 1~3개만 묻습니다.

---

## 1. 메인 사전 점검에 대한 사실 확인 의견

메인 진단(폴더만 옮겼고 내용 분리는 미실행)은 정확합니다. 다만 한 가지 추가로 짚습니다:

**`.claude/agents/`가 비어있다는 사실의 의미는 두 갈래로 해석 가능**합니다.
- (a) harness 자동 주입 경로를 의도적으로 비워둔 것 — 우리 시스템은 PreToolUse hook + 메인 inject로 페르소나 주입을 통제하는 노선
- (b) 실수로 비어있는 것 — 원래 .claude/agents에 페르소나가 있어야 정상

Master가 폴더를 옮긴 의도가 (a)인지 (b)인지에 따라 결정축 #1의 답이 갈립니다. 이게 본 발언 마지막 질문 1번입니다.

---

## 2. 핵심 결정 축 후보 (탐색용 — 답을 내리지 않음)

### 축 A. SOT(Source of Truth) 위치
- A1. `.claude/agents/role-*.md` 단일 — harness 자동주입에 맡김
- A2. `memory/roles/personas/role-*.md` 단일 — hook/메인이 명시적으로 inject (현재 노선)
- A3. 양쪽 동기화 — 정의는 한 곳, 다른 곳은 미러
- 트레이드오프: A1=Claude Code 표준 적합·hook 단순화 / A2=명시 통제·multi-tier 분리 자유 / A3=중복·sync 비용

### 축 B. persona vs role 경계 정의
- B1. **persona = 정체성·톤·금기 / role = 정책·계약·메트릭·구조** (Master 전제)
- B2. persona가 role을 흡수 (단일 파일 회귀)
- B3. 3-layer (persona / role-policy / role-memory)
- 본 토픽 Master 발언은 B1을 사실상 선언했음. 이걸 그대로 받느냐, 미세조정이냐가 결정점.

### 축 C. 정책 단일출처 형식
- C1. role-policy.md (역할별 1파일)
- C2. role-policy.json (구조화 — hook이 compose)
- C3. CLAUDE.md 본문 + 역할별 섹션 — 역할 파일 없이 중앙집중
- C4. hook 동적 compose (정책 파편을 토픽 grade·phase별로 조립)
- 트레이드오프: C1=가독성·휴먼편집 / C2=프로그램 가능·검증 / C3=중앙 일관성·역할별 비대칭 어려움 / C4=동적 적합성·디버깅 난이도

### 축 D. 호출 시점 (정적 vs 동적)
- D1. 모든 호출에 페르소나+정책 풀세트 inject (현재 메인 inject 노선)
- D2. grade·phase별로 inject 항목 차등 (S 발언엔 정책 일부만, A 발언엔 풀세트)
- D3. harness 자동 주입은 페르소나만, hook이 정책을 토픽 메타에 따라 추가 inject
- 비용 vs 정확성 축. 토큰·턴 응답속도 vs 미주입 사고 재발 위험.

### 축 E. PD-044와의 충돌 처리
- E1. PD-044 폐기 — 본 토픽 노선이 정반대로 결정 (persona 가벼움 / 정책 분리)
- E2. PD-044 재정의 — "정책의 명시적 분리" 부분만 흡수, "persona 박제"는 무효화
- E3. 본 토픽이 PD-044를 자식으로 흡수하고 동일 결과로 종결

---

## 3. Master에게 묻는 핵심 질문 (3개 — 답이 갈리면 모든 후속 바뀌는 것만)

**Q1. `.claude/agents/`를 비워둔 것은 의도입니까?**
- (a) 의도적으로 — harness 자동주입을 안 쓰고 메인/hook inject로 통제하는 노선
- (b) 실수로 비어있음 — 원래 채워져 있어야 함
- → 답에 따라 축 A·D 즉시 결정.

**Q2. persona/role 분리의 1차 목적은 어느 쪽입니까?**
- (a) **오염 방지** (역할 대행 사고 재발 차단) — 정체성과 정책을 물리적으로 분리해 호출 시 페르소나만 정확히 박힘
- (b) **경량화** (페르소나 파일을 가볍게 유지) — 토큰·로드 속도·인지 부하 절감
- (c) 둘 다 (a + b)
- → 답에 따라 축 B 정의 정밀도와 축 C 형식 선택이 갈림. (a)면 hook 검증·schema 강화, (b)면 형식보다 분량·간결성 우선.

**Q3. 본 세션의 적정 종착점은 어디입니까?**
- (a) 결정축 정리 + 축 A·B만 결정 → Arki 구조 진단은 다음 세션
- (b) 결정축 정리 + 모든 축 결정 + Arki 1차 설계까지
- (c) 결정 + Arki + Dev 1차 구현까지 본 세션
- → S grade 토픽이 한 세션에 너무 큰 결정 묶음을 짊어지면 후속 세션 정보 휘발 위험. Master가 "구현은 3세션 이내" 원칙 강조한 바 있음.

---

## 4. Out scope 후보 (본 세션에서 다루지 말 것 — Master 검토용)

- topic_126 [A] 점수 표기 문제 자체 수정 — 본 토픽 종결 후 별도 turn으로
- 페르소나 파일의 톤·문체 다듬기 — 구조 결정 후
- vera/nova/dev 페르소나 신규 작성 — 기존 파일이 이미 있음, 기존 파일 분리가 우선
- harness `.claude/agents/` 외 다른 자동 로드 경로 발굴 — 축 A 결정 후

---

## 5. 다음 단계 추천 (1줄)

Master가 Q1~Q3에 답한 후, 답 내용에 따라:
- Q2가 (a) 오염 방지 우선 → **Riki 먼저 호출** (분리 구조의 함정·우회로 사전 식별)
- Q2가 (b) 경량화 우선 → **Arki 먼저 호출** (구조 진단 + 분리 형식 설계)
- Q2가 (c) 둘 다 → **Arki → Riki 순차** (구조 후 함정 검증)

Ace는 Master 답변 받은 뒤 종합검토에서 호출 결정 박제.

---

## 자체 평가

```yaml
# self-scores
rfrm_trg: Y
ctx_car: 0.85
orc_hit: 0.75
mst_fr: 0.70
ang_nov: 3
```

- `rfrm_trg: Y` — Master 전제(persona 분리=오염방지+경량화 동시)를 두 축으로 분리하고 PD-044와의 충돌을 결정축으로 끌어올림.
- `ctx_car: 0.85` — 메인 사전 점검·PD-044·topic_126 의존·session_128 [A] 실패지점 모두 승계. 직접 파일 grep은 생략(메인이 1차 사실 스캔 완료 선언).
- `orc_hit: 0.75` — Q2 답에 따라 분기 호출 명시. Master 답 받기 전이라 적중 여부 미확정.
- `mst_fr: 0.70` — 첫 권고가 "결정 안 하고 3개 묻기"라서 수정 트리거는 낮을 것으로 예상.
- `ang_nov: 3` — Q1(폴더 비움 의도) + Q2(분리 1차 목적 분해) + 축 E(PD-044 충돌 처리)는 메인이 명시 안 한 신규 축.
