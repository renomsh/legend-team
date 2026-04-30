---
role: ace
sessionId: session_150
topicId: topic_134
turnId: 1
invocationMode: subagent
date: 2026-04-30
status: in-progress
---

# Ace — 역할 Upgrade 추천 분석 (session_150)

## 판정 대상

topic_134 잔여 5개 역할(Ace·Jobs·Edi·Zero·Sage) persona/policy 파일의 upgrade 필요 항목.

session_149 패턴 적용:
1. Top 0.1% 기준 추가
2. Nexus 참조 교체
3. D-130 반영 누락 (Jobs 신설 영향)
4. F-013 제약 일관성

---

## 역할별 Upgrade 추천

### 1. Ace (role-ace.md)

**Top 0.1% 기준:**
- 현재: 없음
- 제안 (원칙 섹션 최상단):
  > Top 0.1% 전략 판정가 기준: frame의 생존 가능 구조를 Porter×Keynes 합성 시각으로 단 한 번의 판정에 완결짓는다.
- 이유: Arki/Fin/Riki/Dev 추가 패턴 통일.

**D-130 반영:** 완료. 추가 변경 불필요.
**F-013:** 이미 박제됨.

**총 변경: 1건.**

---

### 2. Jobs (role-jobs.md)

**Top 0.1% 기준:**
- 현재: 없음
- 제안 (원칙 섹션 최상단):
  > Top 0.1% 기획 판정가 기준: Why(본질)와 saying no(제거)로 Master의 인지편향을 해체하고 단일 frame을 설계한다.
- 이유: 신설 역할 — 정체성 기준 명문화 필요.

**F-013 참조 명시:**
- 현재: `자기소개 시 spec에 없는 한국 이름 자가 생성`
- 제안: `자기소개 시 spec에 없는 한국 이름 자가 생성 (F-013)`
- 이유: 다른 역할 모두 F-013 참조 명시됨. 통일.

**D-130 반영:** 완료.

**총 변경: 2건.**

---

### 3. Edi (role-edi.md)

**Top 0.1% 기준:**
- 현재: 없음
- 제안 (Role Mission 섹션 아래):
  > Top 0.1% 컴파일러 기준: 모든 역할 발언의 모순·갭을 숨기지 않고 드러내며, 한 문서로 완결된 진실을 박제한다.
- 이유: Edi = 완결성 보증 역할. 기준 명문화 필요.

**D-130 — D-021 줄 Jobs 누락:**
- 현재: `Content and strategic decisions remain with Ace/Arki/Fin/Riki.`
- 제안: `Content and strategic decisions remain with Jobs/Ace/Arki/Fin/Riki.`
- 이유: D-130으로 Jobs = framing 주체. 미포함은 stale.

**총 변경: 2건.**

---

### 4. Zero (role-zero.md)

**Top 0.1% 기준:**
- 현재: 없음
- 제안 (원칙 섹션 최상단):
  > Top 0.1% 정제 전문가 기준: 3 영역 한정으로 정량 근거만으로 cut/refine/audit하며, 불필요한 것을 제거하는 것이 시스템의 지속 가능성이다.
- 이유: 역할 통일 + Zero 경계 성격 명문화.

**D-130 반영:** 완료 (session_149 Nexus 참조 정비).
**F-013:** 이미 박제됨.

**총 변경: 1건.**

---

### 5. Sage (role-sage.md)

**Top 0.1% 기준:** 추가 불필요.
- Sage = read-only 분석가. Top 0.1% 기준은 산출물 생성 역할의 품질 기준 — Sage에 적용 시 역할 성격과 어긋남.

**D-130 반영:** 완료.
**F-013:** 이미 박제됨.

**총 변경: 0건.**

---

## 요약 테이블

| 역할 | Top 0.1% | F-013 | D-130 Jobs | 총 변경 |
|------|----------|-------|------------|---------|
| Ace | +1 | 이미 있음 | 완료 | 1건 |
| Jobs | +1 | +1 참조 명시 | 완료 | 2건 |
| Edi | +1 | 미해당(영문) | D-021 Jobs 추가 | 2건 |
| Zero | +1 | 이미 있음 | 완료 | 1건 |
| Sage | 불필요 | 이미 있음 | 완료 | 0건 |

**총 변경 대상: 4개 역할 6건.**

---

[ROLE:ace]
# self-scores
rfrm_trg: N
ctx_car: 0.95
mst_fr: 1.00
ang_nov: 1
