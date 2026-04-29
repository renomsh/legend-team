---
role: ace
session: session_141
topic: topic_131
date: 2026-04-29
turnId: 0
invocationMode: subagent
rev: 1
phase: framing
---

# Ace — s141 Opening (P2 1/3)

## topicType 판정
- **topicType**: framing (진행 중)
- **parentTopicId**: null (standalone Big Bang 시리즈)

---

## s141 포지션

P2(1/3) 세션입니다. s140에서 7결정(D-115~D-121) 박제 완료. 이번 세션 3대 목표는 Edi 인계 메모 기준으로 확정되어 있습니다.

---

## Scope 확인 (In / Out)

**In:**
1. prime directive(Affaan 4 도그마) → CLAUDE.md 실제 텍스트 신설 및 박제
2. violation 판정 주체 결정 (D-120 미결)
3. Zero 미션×스킬 매핑 1턴 수행

**Out:**
- NCL 스키마 재설계 (D-115 확정)
- Sage 정의·채점 로직 상세 설계 (별도 후속)
- s139 echo chamber 후속 토픽 분리 (별도)
- 외부 anchor 필수 hook 설계 (별도)

---

## 핵심 질문 (Master 판단 필요)

**Q1 — violation 판정 주체 (D-120 미결)**

Ace 잠정 권고: **E안 (하이브리드)** — 코드가 NCL violation flag 자동 append → Master 정기 점검 시 확인.

단, 결정 전 Master에게 확인할 것이 하나 있습니다:

> **"violation flag 자동 판정의 조건식을 이번 세션에서 설계까지 완결할 것인가, 아니면 '코드가 판정한다'는 원칙만 결정하고 조건식 상세는 별도 세션으로 분리할 것인가?"**

범위가 달라집니다. 조건식 설계까지 포함하면 이번 세션 부하가 크게 증가합니다.

**Q2 — CLAUDE.md 박제 형식**

Affaan 4 도그마를 CLAUDE.md에 박제할 때:

> **"기존 Rules 블록에 bullet 추가 방식으로 할 것인가, 별도 섹션(## Prime Directive) 신설할 것인가?"**

권고: **별도 섹션 신설.** Rules 블록은 운영 절차용, Affaan 4는 시스템 신뢰 전제로 성격이 다릅니다.

---

## 역할 호출 계획

Q1·Q2 Master 답변 수신 후 → **Arki(구조 검토) → Riki(adversarial 차단 검증) → Dev(CLAUDE.md 실제 작성) → Edi(정리)**

Master 답변 없으면 Q1 = E안 원칙만 결정(조건식 별도), Q2 = 별도 섹션으로 자동 진행합니다.

---

[ROLE:ace]
# self-scores
rfrm_trg: Y
ctx_car: 0.95
orc_hit: 0.90
mst_fr: 0.85
ang_nov: 2
