# Riki — Zero 정제 4건 적대적 검토 (topic_163, session_190)

## R-1. #1 (edi §6.4 vs §6.6) — **KILL**
§6.4 = "suggested 부재 + LLM 미호출 시" 게이트 (D-131 hybrid C L1 분기), §6.6 = "Edi 확정 박제 시 필수 필드 검증" (G-1 enforcement). 다른 분기 가드. session-end-finalize.js의 `applyVersionBump` 두 축 동시 참조. 표면 중복, 실체 다름.

## R-2. #2 (zero §발언구조) — **GO 부분**
실측 자기참조 3회(line 7, 114, 130). line 130은 컨텍스트 활용 actionable 가이드 — 보존. line 7+114 통합. ~150B.

## R-3. #3 (ace:19) — **부분 GO**
첫 문장만 12-17행 재서술. 둘째 문장("Porter 약점을 Keynes 불확실성 대응으로 보완")은 합성 메커니즘 신규. LLM 페르소나 inhabitation 핵심. 통문장 cut 시 drift 위험. 첫 문장만 cut → ~80B.

## R-4. #4 (jobs:19) — **부분 GO**
동일 패턴. 둘째 문장("Kahneman을 사용자 인지 설계 도구로 활용")은 신규. 첫 문장만 cut → ~90B.

## 종합

| # | Zero 단언 | Riki 판정 | 실 절감 |
|---|---|---|---|
| 1 | edi §6.4↔§6.6 중복 | KILL | 0 |
| 2 | zero 자기참조 4회 | GO 부분 | ~150B |
| 3 | ace:19 dead text | GO 첫문장만 | ~80B |
| 4 | jobs:19 dead text | GO 첫문장만 | ~90B |

총 실 절감 ~320B (Zero 청구 1,030B 대비 31%).

**숨은 패턴**: Zero가 byte 절감에 anchoring돼 "배합의 묘미" 둘째 문장 페르소나 합성 메커니즘을 인지하지 못함. byte 효율 vs 페르소나 inhabitation 가독성 tradeoff.

## Self-Score
crt_rcl: Y / cr_val: 4 / prd_rej: Y / fp_rt: 0.10
