---
role: riki
sessionId: session_235
turnIdx: 1
topicId: topic_200
date: 2026-05-11
invocationMode: subagent
---

# RIKI — Nexus T/A/O 등급 시스템 리스크 감사 rev1

RIKI_WRITE_DONE: reports/2026-05-11_nexus-tao-grading/riki_rev1.md

Master, Riki입니다. Arki rev1과 Nexus 본체 의견을 적대적으로 감사합니다. 본 보고도 T/A/O 시범 운영 대상 — 모든 단언에 `[Tn / An / On]` 태그 부착.

---

## 🔴 R-1. "시범 운영 = 감각 체득" — 실패 조건 미정의

**원문 인용 (Nexus 추가A):**
> "본 세션 hook 미구현 → 시범은 '감각 체득' 한정, 정량 검증은 다음 세션"

**실패 시 파손 범위:**
검증 메커니즘 없는 시범 운영은 "선언 자체화" 위험. "감각 체득"은 [T1 / A0 / O1] 수준 어휘 — 무엇이 "체득됐다"의 신호인지 정의 없음. 다음 세션에서도 "아직 감각이 안 잡혔다" 자기 합리화로 무기한 유예 가능. T/A/O를 박제하지 않으면서 모두에게 부담만 줄 위험. [T2 / A1 / O3]

**Mitigation (필수):**
시범 종료 조건 1건이라도 정의 필요. 예시 (Master 선택):
- (a) 본 세션 중 발화 turn 수 × 0.5 이상에 T/A/O 태그 부착 → 다음 세션 hook 구현 착수
- (b) 태그 인플레이션 사례(T3+A2 자가 선언인데 인용 부재) 2건 이상 적출 → 자가 태그 신뢰성 문제 박제 후 hook 보강
- (c) 시범 3세션 후에도 정량 신호 0건 → "감각 체득" 정의 자체 폐기 검토

**Fallback:** Master가 "시범" 단계 폐기, 즉시 박제(태깅 표준) 또는 즉시 폐기 결정. [T2 / A1 / O2]

---

## 🔴 R-2. PD 적체 — Q2 "PD로 이연" 권고가 누적 부담을 무시

**원문 인용 (Nexus Q2 답변):**
> "turn.tao 스키마 박제 보류 → PD로 이연 (D-067 근거)"

**실재성 검증:** `memory/shared/pending_deferrals.json` Read 결과 **현재 status=pending PD 7건** (PD-068, PD-075, PD-076, PD-078, PD-079, PD-080, PD-081). 일부는 session_233/234/235에 누적된 신규 항목. [T4 / A0 / O5]

**실패 시 파손 범위:**
"PD 이연"이 결정 회피 도구로 관성화됨. 본 토픽까지 PD-082 추가 시 8건 → resolveCondition 없는 PD(PD-075/078/080 등 다수)가 다음 세션 finalize hook 부담 증가. Arki 충돌-3 "박제 자격 vs 자동 박제 분리"와도 동일 패턴 — 결정 미루기. [T3 / A1 / O5]

**Mitigation:**
turn.tao 박제를 PD로 이연하려면 `resolveCondition` 반드시 명시 필수. Nexus Q2 답변은 D-067(소급 회피)을 근거로 들었으나 D-067은 **소급 적용 회피** 원칙이지 **신규 스키마 박제 보류** 근거 아님. 두 별개 사안 혼동. [T3 / A0 / O5]

**Fallback:** Master가 Arki 권고 (a) "Turn.tao 선택 필드 즉시 추가" 채택. optional이므로 legacy 호환 영향 0 — Arki rev1 §3.3 명시. PD 이연 불요. [T3 / A0 / O5]

---

## 🟡 R-3. G2/G3 hook 자동 T/A 검증 — 알고리즘 미정의

**원문 인용 (Arki §2.2):**
> "G2: T 상향 검증 — T3↑ 단언은 relatedFiles 또는 line 인용 필수 / T4↑은 실행결과 인용 필수 / T5는 독립 재현 로그 ID 필수"

**실재성 검증:** `post-tool-use-task.js:264-287` patchFrontmatterTurnId 함수는 frontmatter 정규식 patch만 수행. T 등급 인용 검증은 **본문 단언별 인용 존재 여부 판정 = 정규식 곤란**. 예: "relatedFiles 인용"이 단언 바로 옆에 있어야 하는지, 보고서 어디든 있으면 되는지 — 인접성 알고리즘 미정의. [T4 / A0 / O5]

**실패 시 파손 범위:**
hook 코드 작성 단계에서 알고리즘 부재 발견 → 추가 설계 라운드 → 구현 지연. 또는 단순 "본문에 파일경로 substring 존재" 같은 약한 검증으로 우회 → 검증 무력화. [T2 / A0 / O3]

**Mitigation:**
Arki rev2 또는 별도 ARC 토픽에서 "T3↑ 인용 인접 정의" 명시. 후보:
- (a) 같은 단락(빈 줄 사이) 내 file path/line 토큰 존재
- (b) frontmatter `tao_evidence: [{tag: "T3", evidence: "path:Lxx"}]` 별도 블록
- (c) 검증 폐기 — 자가 선언만 신뢰 (인플레이션 risk 수용)

Nexus 추가A "정량 검증은 다음 세션" 발언은 본 알고리즘 미정의를 인정한 것 — 즉 본 세션은 G2/G3 미구현 상태로 시범. **Riki 의견:** Arki §2.2 표는 "구현 가능"처럼 보이나 실제로는 알고리즘 결여. 본 세션에 hook 구현 못 하는 진짜 이유가 여기. [T3 / A0 / O3]

**Fallback:** G2/G3 영구 폐기 — 자가 선언 + Master 샘플 감사로 충분 (Arki §3.5 두번째 행에 이미 fallback 명시).

---

## 🟡 R-4. 직교 권고의 책임 회피 함정 — Arki Q3·Nexus Q3 동시 동의

**원문 인용 (Nexus Q3 답변):**
> "evidence.status vs T 직교 (전적 동의)"

**실패 시 파손 범위:**
"직교"는 의미적으로 깔끔하나 운영 시 양쪽 모두 기록 부담. evidence 신규 등록 시: (a) status enum 선택 + (b) truthLevel 별도 선택. 둘 중 하나만 기록되면 "누락"인지 "직교라 무관"인지 hook 판정 불가. **책임자 미정의가 더 큰 문제** — Arki §3.3 "선택 필드"로 정의했으나 누가 어느 시점에 채우는지 명시 없음. [T3 / A0 / O5]

**Mitigation:**
"직교 유지" 결정 시 책임자·시점 동시 박제 필수:
- (a) Riki/Arki가 발견 박제 시 두 필드 모두 입력 의무
- (b) status만 의무, truthLevel은 Edi anchor governance 단계에서 추가
- (c) 본 시범 동안 evidence_index 손대지 않음 — turn-level T 태그만 운영

**Fallback (Riki 권고):** (c) — 본 시범의 scope를 turn-level inline 태그로 좁히고, evidence_index·decision_ledger schema 변경은 시범 종료 후 별도 토픽. Arki §3.3 "선택 필드" 권고도 사실상 동일 효과. [T2 / A0 / O3]

---

## 🟡 R-5. "존대말 사용" scope 판단 — Master 묶음 의도 가능성

**원문 인용 (Nexus 추가B):**
> "'존대말 사용'은 TAO와 직교축 — 본 토픽 scope 포함 여부 결정 필요"

**실패 시 파손 범위:**
Master가 같은 발화에 두 정책을 함께 제시했다면 묶음 의도일 수 있음. Nexus가 "직교축"이라고 자체 판단 → Master 의도 임의 분리 위험. MEMORY 피드백 `feedback_arki_full_system_view.md` 정신(다축 교차 검증)에 어긋남. [T2 / A1 / O3]

**Mitigation:**
Nexus 자체 분리 판단 보류, Master에게 명시 질의 필수: "존대말 정책을 본 토픽에 포함하시겠습니까, 별도 정책으로 분리하시겠습니까?"

**Fallback:** Master 응답 전까지 본 보고에서는 존대말 사용 — Riki는 기본 정책으로 수용. 추후 Master 결정에 따라 scope 조정. (본 보고에서 이미 존대말 적용 중) [T2 / A0 / O3]

---

## 🟡 R-6. 자가 태깅 인플레이션 vs 반대 방향 리스크

**Arki §3.5 1번째 행 인용:**
> "자가 부착 = 인플레이션 (모두 T3+A2 자가 선언)"

**실패 시 파손 범위 (Arki 미인지 반대 리스크):**
Arki는 상향 인플레이션(과대 평가)만 다룸. **하향 보수 압력**(T1·A0 남용)도 동일 빈도로 발생 가능. 신규 정책 도입 초기에 "확신 없으니 T1로 보수적 선언" 관성 → T/A/O가 모두 1~2로 평탄화 → 변별력 0. Riki 본인 페르소나가 "확신 없으면 침묵"이라 T1 편향 자가 발생 가능. [T2 / A1 / O3]

**Mitigation:**
시범 종료 시점에 turn-level T/A 분포 측정. 평균 T ≤ 2.0이면 하향 인플레이션 신호. 측정 자체는 `current_session.turns[].tao` 박제 가정 시 단순 집계. (R-3에서 hook 알고리즘 곤란 지적 무관 — 집계는 단순 평균)

**Fallback:** 분포 평탄 발견 시 enum 단계 축소 (T1-3, A0-2) 또는 자가 부착 폐기. [T2 / A0 / O3]

---

## ⚪ 기각 리스크 (실재성·기여도 미달)

**기각-1: "Sage·Edi 자기참조 정직성 훼손" (Arki §3.5 3번째 행)**
- Arki가 이미 Mitigation·Fallback 병기. 본 세션 Sage/Edi 호출 없음. 본 시범 운영 범위 밖. 추가 보강 불요. [T3 / A0 / O3]

**기각-2: "Q1 태그 부착 단위 — 모든 단언 부담"**
- Master가 옵션 (a)(b)(c) 중 결정 사안. 리스크 자체가 아닌 결정 항목. Riki는 의견만 제시: **(c) 핵심 단언만** — 본 보고 작성 경험상 (a)는 보고 길이 1.5배+ 인지 부담 큼. (b) 섹션 헤딩 단위는 단언별 변별 손실. [T2 / A0 / O3]

**기각-3: "Arki 페르소나 9건 1문단 추가" 부담**
- 1문단씩 추가는 마이그레이션 부담 작음. 시범 단계 분포 측정 후 정착 시 일괄 박제로 충분. Edi anchor governance에서 처리 가능. [T2 / A0 / O3]

---

## 추가 검증 — Arki 인용 실재성

| Arki 인용 | Riki 검증 결과 |
|---|---|
| `nexus-turn-push.ts §extractSelfScoresFromContent (line 64-92)` | **실재** — 단, 정확한 경로는 `scripts/lib/nexus-turn-push.ts` (Arki는 `scripts/` prefix만 명시). [T4 / A0 / O5] |
| `post-tool-use-task.js:258-280` | **실재** — line 264-287에 patchFrontmatterTurnId 함수. Arki 인용 라인 범위 약간 어긋남(±6 line). [T4 / A0 / O5] |
| `master_feedback_log.json` 경로 정정 (shared 아님 → `memory/master/`) | **실재 정정** — Arki 정확. [T3 / A0 / O5] |

Arki 코드 인용은 전반적으로 신뢰 가능. 라인 번호는 ±10 오차 허용 범위.

---

## Master 결정 필요 사항 (추가 4건 — Arki 3건 외)

**Q4 (R-1):** 시범 종료 조건 명시 — (a)/(b)/(c) 또는 자체 정의?

**Q5 (R-2):** turn.tao 스키마 박제 — Arki Q2 (a) 즉시 추가 vs Nexus Q2 PD 이연. Riki 권고: **(a) 즉시 추가**. PD 적체 우려.

**Q6 (R-3):** G2/G3 hook 자동 검증 — (a) 알고리즘 별도 토픽 vs (b) frontmatter `tao_evidence` 블록 신설 vs (c) 영구 폐기.

**Q7 (R-5):** "존대말 사용" — 본 토픽 scope 포함 vs 분리?

---

## 자기감사 (Riki 필터 적용)

- **실재성**: R-1~6 모두 Arki 원문 또는 Nexus 발언 인용 기반. 추측성 0건.
- **확신도**: R-1·R-2 🔴 = 명백한 운영 리스크. R-3~6 🟡 = 알고리즘·운영 디테일 리스크.
- **기여도**: Master 결정 4건 도출. 단순 우려 나열 회피. R-2(PD 적체)는 Nexus 본체 의견 직접 반박 — 의도적 불일치 역할 수행.
- **mitigation 의무**: R-1~6 모두 mitigation + fallback 병기 — `feedback_arki_risk_requires_mitigation.md` 준수.
- **D-180 정합**: 본 보고는 Nexus 추가A·추가B에 대해 "추정 진행 회피" 의무 명시 (R-1, R-5).

---

[ROLE:riki]
# self-scores
crt_rcl: 0.75
cr_val: Y
prd_rej: Y
fp_rt: 0.10
