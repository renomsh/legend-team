---
role: ace
sessionId: session_235
turnIdx: 2
topicId: topic_200
date: 2026-05-11
synthesis: true
---

# ACE — T/A/O 등급 시스템 종합검토 rev1

ACE_WRITE_DONE: reports/2026-05-11_nexus-tao-grading/ace_rev1.md

Master, Ace입니다. Arki·Riki 두 산출물 cross-review 후 단일 권고합니다. Nexus 본체 권고(turn 박제)는 권한 침범으로 무효 처리됨 — Master 정정 수용. 모든 단언에 `[Tn / An / On]` 태그 부착.

---

## 1. 구조 판정 (Structure · Porter)

### 1.1 판정 대상
T/A/O 3축 등급 시스템 시범 운영안 + Arki rev1 (자산 5종 매핑, 게이트 5종) + Riki rev1 (리스크 6건). [T4 / A3 / O5]

### 1.2 핵심 trade-off
**얻는 것**: 발언 단위 신뢰도·권한·출처 변별력 → MEMORY 피드백 `feedback_arki_full_system_view.md`(다축 교차 검증)·`feedback_riki_filter_consolidated.md`(3대 필터) 정신을 코드 레이어로 박제 가능. [T3 / A3 / O5]

**포기하는 것**: 발언 부담 증가 + 자가 평가 신뢰성 문제(인플레이션·하향 평탄화 양방향) + 기존 evidence_index.status·decision_ledger.status 축과의 의미 중복 관리 비용. [T3 / A2 / O3]

### 1.3 경쟁우위 — 단일 판정
**T/A/O는 기존 자산(decision_ledger·evidence_index·master_feedback_log·current_session.turns)의 *변별 축*을 명시화하는 것이지 신규 자산 생성이 아니다.** Arki §1.1 매핑이 정확 — 모든 좌표는 이미 존재하는 SOT에 *부착*만 하면 된다. 신규 SOT 신설 없음 = 운영 부담 최소. [T3 / A2 / O5]

**구조적 약점**: A 등급의 자동 판정 불가 (Arki 충돌-2). "Master 규칙/정책/유지 명시"는 자연어 신호. → 자가 부착 + hook은 검증만 패턴이 유일한 정합 경로. [T3 / A2 / O5]

---

## 2. 흐름 판정 (System · Keynes)

### 2.1 단기 균형 (본 세션~3세션)
**불확실성 (uncertainty)**: 자가 태깅이 변별력을 유지하는지(인플레이션·하향 평탄화) — 정량 측정 전까지 미지. Riki R-6 지적이 핵심. [T2 / A1 / O3]

**리스크 (risk)**: PD 적체(현 7건, Riki R-2 실측). turn.tao 스키마를 PD로 이연 시 PD-8건 진입 → finalize hook 부담 증가. 측정 가능한 운영 리스크. [T4 / A0 / O5]

### 2.2 장기 안정성
박제 트리거 "T3+A2"는 *박제 자격* 임계이지 *자동 박제 트리거* 아님 (Arki 충돌-3 mitigation). Edi anchor governance(D-125)가 단일 박제자 유지 → D-178/D-179 흡수 정책과 시점 정합. **장기 안정 조건 충족.** [T3 / A2 / O5]

### 2.3 지속 가능성 단일 판정
**Conditional Yes.** 조건: ①turn-level inline 태그로 scope 좁힘 ②turn.tao 스키마 즉시 추가 (optional, legacy 호환 영향 0) ③시범 종료 조건 1건 이상 정량 정의 ④hook 자동 검증 G2/G3는 본 토픽 scope 밖 (별도 토픽). [T3 / A2 / O3]

조건 미충족 시 "감각 체득" 무기한 유예 위험 (Riki R-1). [T2 / A1 / O3]

---

## 3. Q1~Q7 단일 권고 (Ace 한 손)

| # | 항목 | Arki | Riki | Nexus(무효) | **Ace 권고** | 근거 |
|---|---|---|---|---|---|---|
| Q1 | 태그 단위 | (c) 핵심 단언만 | (c) 핵심 단언만 | 3분류 의무 | **(c) 핵심 단언만 (결정·인용·수치)** | 두 역할 일치 + 본 보고 작성 부담 실측. 서술 산문 면제. [T3 / A2 / O3] |
| Q2 | turn.tao 스키마 | (a) 즉시 추가 | (a) 즉시 추가 | PD 이연 | **(a) 즉시 추가 (optional)** | optional 필드 = legacy 호환 영향 0. PD 적체(현 7건) 회피. D-067은 *소급 회피* 원칙이지 *신규 스키마 보류* 근거 아님 (Riki R-2 정확). [T4 / A2 / O5] |
| Q3 | evidence.status vs T | 직교 | 직교 + 책임자·시점 명시 (또는 scope 제외) | 직교 | **본 시범 동안 evidence_index 손대지 않음 — turn-level 한정** | Riki Mitigation (c) 채택. 시범 scope 축소 = 변별력 측정 우선. evidence/decision_ledger schema 변경은 시범 종료 후 별도 토픽. [T3 / A2 / O3] |
| Q4 | 시범 종료 조건 | — | (a)/(b)/(c) 제시 | — | **(a)+(b) 병행**: ①본 세션~3세션 발화 turn × 0.5 이상 태그 부착 ②인플레이션 사례 2건 적출 OR 평균 T ≤ 2.0(하향 평탄화) 1건 적출 → hook 구현 착수 또는 enum 축소 결정 | "감각 체득" 정량화 + R-6 양방향 리스크 동시 측정. [T2 / A1 / O3] |
| Q5 | Q2 재확정 | — | Arki 손 | — | **Arki 손 — (a) 즉시 추가 확정** | Q2와 동일 결론. [T3 / A2 / O3] |
| Q6 | G2/G3 hook 알고리즘 | 5게이트 제시 | 알고리즘 부재 인정 | — | **본 토픽 scope 제외 → 별도 ARC 토픽으로 이관 (PD 등록 X)** | Riki R-3 지적 정확 — 본 세션 hook 미구현은 알고리즘 결여 때문. 본 시범은 G1(자가 부착) + G4(O 자동, 기존 nexus-turn-push.ts 재사용)만으로 운영. G2/G3는 분포 측정 후 재설계. [T3 / A2 / O5] |
| Q7 | 존대말 scope | — | Master 묶음 의도 확인 | 직교 분리 | **본 토픽 scope 포함 — 묶음 처리** | Master가 같은 발화에 두 정책 제시 = 묶음 의도 추정 합리적. MEMORY `feedback_arki_full_system_view.md` 다축 정합. 분리 판단은 Master 권한. [T2 / A1 / O3] |

---

## 4. 박제 후보 (T3+A2 임계 충족) — Edi 박제 대상

**Ace는 후보만 제안. 박제 실행은 Edi (D-125 anchor governance).**

### D-NNN 후보 (3건)

**후보-1: T/A/O 등급 시스템 — turn-level inline 태깅 표준**
- 내용: 모든 역할 발화는 *핵심 단언*(결정·인용·수치)에 `[Tn / An / On]` 태그 부착. enum: T1-5 / A0-4 / O1-5. 정의 단일 출처: 본 토픽 종결 시 `memory/shared/tao_schema.json` 신설 후보 (별도 결정).
- T/A/O: [T3 / A2 / O3] — 본 세션 컨텍스트·Arki·Riki·Ace 3중 합의·turn 박제 예정.
- 박제 자격: ✅ 충족.

**후보-2: `Turn.tao` optional 필드 추가 (`scripts/lib/turn-types.ts`)**
- 내용: `tao?: { t: 1|2|3|4|5; a: 0|1|2|3|4; o: 1|2|3|4|5 }` 선택 필드. 본 세션부터 신규 turn에 적용. 소급 0건 (D-067 정합).
- T/A/O: [T4 / A2 / O5] — Arki §3.3 코드 인용·Riki 검증·Ace 합의.
- 박제 자격: ✅ 충족.

**후보-3: 시범 운영 종료 조건 (3세션 또는 신호 발견 시)**
- 내용: 본 세션 포함 3세션 시범. 종료 신호: ①태그 부착률 발화 turn × 0.5 이상 ②인플레이션 사례 2건 OR 평균 T ≤ 2.0 1건 → hook 구현 착수 또는 enum 축소 결정.
- T/A/O: [T3 / A2 / O3] — Riki R-1·R-6 + Ace 통합.
- 박제 자격: ✅ 충족.

### 박제 보류 (T3+A2 미달 또는 scope 외)

- **G2/G3 hook 알고리즘**: 알고리즘 미정의 = T2 수준. 별도 ARC 토픽. [T2 / A0 / O3]
- **`evidence_index.truthLevel` / `decision_ledger.decisionAuthorityTag` 신규 필드**: 시범 scope 외. Arki §3.3 권고했으나 Q3 권고로 보류. [T2 / A1 / O1]
- **페르소나 9건 1문단 추가**: Edi anchor governance 단계에서 박제 후 일괄 처리. 본 박제 후보 외. [T2 / A1 / O3]
- **존대말 정책**: 묶음 처리 권고했으나 별도 결정 필요 — Edi가 D-NNN 박제 시 후보-1에 포함할지 분리할지 Master 확인. [T2 / A1 / O2]

---

## 5. 잔여 리스크 (박제 후에도 남는 것)

| 리스크 | Mitigation | Fallback |
|---|---|---|
| 자가 태깅 양방향 인플레이션 (Riki R-6) — 상향(T3+A2 남용) + 하향(T1·A0 평탄화) | 시범 3세션 후 turn-level 분포 측정 (단순 평균 집계) | enum 축소(T1-3, A0-2) 또는 자가 부착 폐기 [T2 / A0 / O3] |
| A 등급 자동 판정 불가 (Arki 충돌-2) | 자가 부착 + Edi 박제 시 검증 (Master 단일 조정) | A 등급 폐기, T/O 2축만 운영 [T3 / A2 / O5] |
| "감각 체득" 무기한 유예 (Riki R-1) | Q4 정량 종료 조건 박제 (후보-3) | Master 강제 폐기 또는 즉시 박제 [T2 / A1 / O3] |
| Sage·Edi 자기참조 정직성 (Arki §3.5) | T4↑은 외부 인용만 허용 (시범 동안 미적용 — Sage/Edi 호출 시 활성화) | Riki cross-review로 T 등급 도전 [T2 / A1 / O3] |

---

## 6. Master 최종 결정 패키지 (압축 3건)

7건 → 3건 압축. Q1·Q2·Q5는 Arki·Riki·Ace 3중 일치 → 단일 권고 채택만 확인. Q3·Q6은 scope 축소 권고(시범 scope 한정) → 함께 묶음.

### 결정-1: 시범 운영 scope 확정
- **권고**: turn-level inline 태그(Q1=c, Q2=즉시 박제, Q3=evidence 손대지 않음, Q6=G2/G3 별도 토픽)
- **Master 결정**: 권고 채택 / scope 확장(evidence·G2/G3 포함) / scope 폐기(시범 자체 취소) 중 택1
- **기본값 (무응답=승인 정신, MEMORY `feedback_low_friction_autonomy.md`)**: 권고 채택. [T2 / A1 / O3]

### 결정-2: 시범 종료 조건 (Q4)
- **권고**: 3세션 + (태그 부착률 0.5 OR 인플레이션 2건 OR 평균 T ≤ 2.0)
- **Master 결정**: 권고 채택 / 세션 수 조정(2/4/5) / 조건 단순화 중 택1
- **기본값**: 권고 채택. [T2 / A1 / O3]

### 결정-3: 존대말 정책 묶음 (Q7)
- **권고**: 본 토픽 D-NNN에 함께 박제 (Master 묶음 의도 추정)
- **Master 결정**: 묶음 / 분리(별도 D-NNN) 중 택1
- **기본값**: 묶음 박제. [T2 / A1 / O2]

---

## 자기감사 (Ace 페르소나 정합)

- **단일 권고 의무**: Q1~Q7 모두 한 손 들었음. 절충안 0건. ✅
- **frame 신설 금지 (Jobs 영역)**: T/A/O 시스템 정의 자체는 Master 발화 + Arki·Riki 산출물에서 도출. 신규 frame 0건. ✅
- **오케스트레이션 침범 금지 (Nexus 영역)**: hook 구현 일정·역할 호출 순서 미규정. 박제는 Edi에 위임. ✅
- **새 사실 발생 시 입장 갱신**: Master 정정(Nexus 권고 무효)을 수용하여 종합 구성. ✅
- **trade-off 명시**: §1.2 "얻는 것 vs 포기하는 것" 명시. ✅

---

[ROLE:ace]
# self-scores
rfrm_trg: Y
ctx_car: 4
mst_fr: 0
ang_nov: 3
