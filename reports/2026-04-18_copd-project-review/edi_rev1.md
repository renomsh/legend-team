---
role: Editor
session: session_034
topic: COPD project review (Track B 재설계)
rev: 1
date: 2026-04-18
mode: observation
grade: S
framingLevel: 2
status: closed
---

# Editor — 세션 034 통합 문서

## 토픽
**COPD Track B (SES → COPD 매개분석) 전면 재검토 및 재설계**

Master 와이프(Eunjin Kwon, KDCA 국립보건연구원) 과제 지원. Track A(IF 5, COTE 심혈관, 완료) 이후 +α 확장 신규 원저 설계.

## 역할 참여
Ace / Arki (2회) / Riki (2회) / Nova (Master 명시 호출) / Editor
→ 4개 역할 + Editor. Fin 미소집(Ace가 저널 점수 커버).

## 주요 결정 (Decisions)

- **D-034** SES upstream 매개분석 Track B 설계 확정 — Pooled CMA (COPD+PRISm, n=2,719, Wan 2014)
- **D-035** 주분석 공변량 = Age/Sex/Phenotype/Prev_exac/FEV1%pred + Hospital cluster (Smoking status 제거, Pack-years 매개)
- **D-036** 매개변수 4개 병렬 = Pack-years + SGRQ Symptoms/Activity/Impact
- **D-037** Nova 궤도 2·3 채용 (modifiable mediator 서사 + near-universal coverage 프레임), 궤도 1·4 기각
- **D-038** 투고 cascade 1순위 Thorax → Int J Epi → Chest → ERJ Open Res → Int J COPD
- **D-039** G2 FAIL에 따라 Moderated mediation primary 포기 → Pooled CMA 재수렴

## 주요 Master 피드백

- **어중간한 절충안 금지** — 목표 기준 단일 최적해만 (→ feedback_no_middle_ground.md)
- **데이터 분석 시 skill 활용** — data:*, bio-research:* 적극 호출 (→ feedback_use_skills_in_data_analysis.md)

## 검증 게이트 결과

| Gate | 결과 |
|---|---|
| G1 결측 mechanism | 🟢 PASS (edu×missing p=0.40, edu×phenotype interaction NS) |
| G2 검정력 | 🔴 FAIL (PRISm events=3, interaction power 0.4%) → Pooled 재수렴 |
| G3 IRB | 🟢 PASS (기승인) |

## 핵심 리스크 (Riki 총 11개)

**치명 (투고 전 필수):** R-5, R-6, R-10, R-11
**관리:** R-12, R-13
**민감도 커버:** R-3, R-4
**해소 완료:** R-1, R-2, R-7

## Ace 종합 권고 — 기대 성과

- **Base case 밴드**: IF 5~10 (Chest·Am J Epi·ERJ Open Res 수준)
- **Stretch target**: IF 10+ (Thorax, Int J Epidemiol)
- **Track A → B 개선**: 1.5~2배 IF 상승

## 다음 세션 착수점

**Phase 1 — 코호트 고정 + phenotype 층화 Table 1**
(G4 게이트: BMI·DLCO·FVC phenotype별 분포 확보, R-5 생물학적 서사 근거)

## 산출물 경로
- `reports/2026-04-18_copd-project-review/ace_rev1.md`
- `reports/2026-04-18_copd-project-review/arki_rev1.md`
- `reports/2026-04-18_copd-project-review/riki_rev1.md`
- `reports/2026-04-18_copd-project-review/nova_rev1.md`
- `reports/2026-04-18_copd-project-review/editor_rev1.md` (본 문서)

## Deferrals 생성

- **PD-012**: Nova 궤도 1 (PRISm outcome trajectory analysis) — Paper B 씨앗. Paper A 투고 확정 후 재평가. KOCOSS FU_Y1~Y5 spirometry 가용성 점검 필요.
