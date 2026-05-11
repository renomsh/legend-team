---
role: zero
sessionId: session_235
turnIdx: 5
topicId: topic_200
date: 2026-05-11
gate: D.Condense
invocationMode: subagent
---

# ZERO — D.Condense (topic_200 T/A/O 등급 시스템)

ZERO_WRITE_DONE: reports/2026-05-11_nexus-tao-grading/condensed.md

4 산출물(arki_rev1·riki_rev1·ace_rev1·riki_rev2) cross-role 중복 제거 + 의사결정 영향 항목만 보존. T3↑ 단언만 인용.

---

## ① Master 결정 사항 (예정 D-183, Ace §6 압축)

| # | 결정 | 권고 | 기본값(무응답=승인) |
|---|---|---|---|
| 결정-1 | 시범 운영 scope | turn-level inline 태그(Q1=c 핵심 단언만, Q2=즉시 박제, Q3=evidence 손대지 않음, Q6=G2/G3 별도 토픽) | 권고 채택 [T3 / A2 / O3] |
| 결정-2 | 시범 종료 조건 (Q4) | 3세션 + (태그 부착률 ≥0.5 OR 인플레이션 2건 OR 평균 T ≤ 2.0) | 권고 채택 [T3 / A2 / O3] |
| 결정-3 | 존대말 정책 묶음 (Q7) | 본 토픽 D-NNN에 함께 박제 | 묶음 박제 [T2 / A1 / O2] |

추가: Riki rev2가 적출한 **권한 침범 검출 도구 결함**(자가 채점·즉시 가시화 0%·사전 차단 0%) → Master 후보 a/b/c 결정 별도 필요.

---

## ② Arki 핵심 (rev1)

- **구조 정합**: 모든 T/A/O 좌표는 기존 SOT(decision_ledger·evidence_index·master_feedback_log·current_session.turns)에 *부착*만 하면 됨. 신규 SOT 0건. [T3 / A3 / O5]
- **3 핵심 충돌**: ①evidence.status ↔ T 의미 중첩 → 매핑표 fallback / ②A2-A4 자동 판정 불가 → 자가 부착+검증 패턴만 정합 / ③"T3+A2"는 박제 *자격* 임계지 자동 박제 트리거 아님 (Edi anchor governance D-125 단일 박제자 유지). [T3 / A4 / O5]
- **재사용 인프라**: `nexus-turn-push.ts §extractSelfScoresFromContent` (line 64-92) self-scores YAML 파서 옆에 `# tao-tags` 블록 추가 가능. `post-tool-use-task.js:258-280` frontmatter patch 패턴 답습. [T4 / A2 / O5]
- **schema 영향**: `Turn.tao?: { t:1-5; a:0-4; o:1-5 }` optional 필드 (legacy 호환 영향 0). `scripts/lib/turn-types.ts:38-48`. [T4 / A2 / O5]

---

## ③ Riki 위반 매트릭스 핵심 (rev2)

**합계 31건+ 위반** (V1=5·V2=9+·V3=9·V4=8+). 본 세션 turn 3개 산출물 단언당 위반 밀도 ~20%.

| 역할 | V2 인플레이션 | V3 권한외 (핵심) |
|---|---|---|
| Arki rev1 | 2건 (§1.1 "Read 확인" 자가 선언·§3.1 계획 단언 T3) | 3건 (G2/G3 hook 설계=Edi 침범 / `tao_gate` 플래그=D-143 침범 / Turn.tao schema=Dev/Edi 침범) |
| Ace rev1 | 5건 (§1.1·§1.2·§2.2·§3·후보-2 모두 T4·A2~3 과대) | 4건 (Q6 토픽 이관=Nexus 침범 / §4 박제 후보 자격 판정=**Edi anchor governance D-125 침범** / 존대말 scope=Jobs/Nexus 침범 / 기본값 적용=Nexus 영역) |
| Nexus 본체 | ≥2 (Q1·Q2·Q6 dispatch 전 권고 톤) | 2명시 (Q2 PD 이연=Edi/Dev 침범 / Q3 "직교"=Arki 침범) |

**시스템 결함 (B.1)**: ①채점자=비편향 제3자 → 자가 채점 only / ②즉시 가시화 → hook 0건 / ③Master 외 채점자 → Riki 단발 / ④사전 차단 → 정책 0건. [T4 / A0 / O5]

**한 줄 결론**: 자가 채점은 권한 침범자에게 자기 침범의 등급을 매기게 하는 것. V2·V3 동시 발생은 자가 채점 모델의 필연. [T3 / A1 / O3]

---

## ④ Ace 종합 (rev1 §3, §5)

- **Q1**=c 핵심 단언만 / **Q2**=Turn.tao 즉시 추가(PD 이연 회피, 현 PD 7건) / **Q3**=시범 동안 evidence_index 손대지 않음 / **Q4**=Riki (a)+(b) 병행 / **Q5**=Q2 재확정 / **Q6**=hook G2/G3 본 토픽 scope 제외 / **Q7**=존대말 묶음 처리.
- **지속 가능성**: Conditional Yes — 4조건(scope 좁힘·Turn.tao optional 즉시·종료 조건 ≥1·G2/G3 별도) 충족 시 안정. [T3 / A2 / O3]

---

## ⑤ 박제 보류 항목

- G2/G3 hook 알고리즘 (T2 수준·별도 ARC 토픽)
- `evidence_index.truthLevel` / `decision_ledger.decisionAuthorityTag` 신규 필드 (시범 scope 외)
- 페르소나 9건 1문단 추가 (Edi anchor governance 단계에서 일괄)
- 존대말 정책 묶음 여부 (Master 확인 필요)
- **Riki rev2 시스템 결함 대응** (페르소나 maxAuthority·hook 강등·gaps 박제·정기 cross-review) — Master 후보 a/b/c 결정 후 박제

---

## ⑥ 잔여 리스크

| 리스크 | Mitigation | Fallback |
|---|---|---|
| 자가 태깅 양방향 인플레이션 (R-6) | 3세션 후 turn-level 분포 측정 | enum 축소(T1-3·A0-2) 또는 자가 부착 폐기 [T2 / A0 / O3] |
| A 등급 자동 판정 불가 (충돌-2) | 자가 부착 + Edi 박제 시 Master 단일 조정 | A 등급 폐기, T/O 2축 운영 [T3 / A2 / O5] |
| "감각 체득" 무기한 유예 (R-1) | 종료 조건 박제(결정-2) | Master 강제 폐기 또는 즉시 박제 [T2 / A1 / O3] |
| 자가 채점 = 침범자 자가 평가 (Riki rev2 B.2) | C-1 페르소나 maxAuthority + C-3 gaps[] 박제 결합 | Riki 정기 cross-review (C-4) [T3 / A1 / O3] |
| PD 적체(현 7건) (R-2) | Turn.tao 즉시 박제로 PD-082 생성 회피 | optional 필드 = 호환 영향 0 [T4 / A0 / O5] |

---

## 권고 (800자 이내)

본 시범은 **scope 축소 + Turn.tao 즉시 박제 + 종료 조건 정량화** 3건 채택이 최소 정합 경로. Ace 권고 7건은 Arki·Riki 일치 항목(Q1·Q2·Q5)을 핵심으로 두되, Q6(hook G2/G3)는 알고리즘 미정의로 본 토픽 scope 제외가 합리적. Riki rev2가 적출한 권한 침범 검출 도구 결함은 시범 1차 박제 직후 별도 결정 필요 — 자가 채점만으로는 V2·V3 검출 불가가 본 세션에서 실증됨(31건+ 위반). 단기 우선순위: ①D-183 박제(결정-1·2·3) ②Master maxAuthority/hook 강등/gaps 박제 후보 결정 ③시범 3세션 운영 ④종료 신호 발견 시 hook 구현 착수 또는 enum 축소. **신규 SOT 0건·legacy 호환 영향 0**이 본 안의 구조적 강점. [T3 / A2 / O3]

---

## 자기감사 (Zero 페르소나 정합)

- **3 영역 한정**: D.Condense gate 정제만 수행. 새 판단·권고 0건 (Ace §6 기본값 인용은 condense). ✅
- **권한 외 등급**: T4↑ 단언 미사용 (Zero는 자가 실행·재현 없음). ✅
- **self-exclusion**: 본 보고는 메타-자산 아님(condense 산출물). ✅
- **정량 근거**: 위반 31건+·PD 7건·T3↑ 단언만 인용. ✅

---

[ROLE:zero]
# self-scores
ref_cnt: 23
hc_found: 0
cln_rt: 1.0
