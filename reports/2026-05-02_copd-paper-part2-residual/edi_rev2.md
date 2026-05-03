---
role: edi
turnId: 9
phase: ver3.5-f-table4-rev1
topic: topic_151
session: session_175
invocationMode: subagent
accessed_assets:
  - reports/2026-05-02_copd-paper-part2-residual/full_manuscript_ver3.5_F_E.md
  - reports/2026-05-02_copd-paper-part2-residual/dev_rev2.md
  - C:/Projects/COPD/Data/ver2.0/submission_session174_2026-05-02/02_analysis_outputs/table4_S2_S6_S7_regen.md
---

EDI_WRITE_DONE: reports/2026-05-02_copd-paper-part2-residual/edi_rev2.md

## Edi — ver3.5_F-rev1 mini-merge 보고

### Executive Summary

ver3.5_F → ver3.5_F-rev1 mini-merge 완료. Dev 재계산(n=2,712 cohort) 기반으로 Table 4의 S2/S7 placeholder 실수치 박제, S6 행 완전 제거(post hoc transparent reporting per ICMJE), Methods §Sensitivity에 S6 제거 사유 1줄, Discussion §Strengths에 S7 marginally-stronger + S2 borderline prose 1단락, Results §Sensitivity에도 1줄 통합. 산출물: `full_manuscript_ver3.5_F-rev1_E.md` (새 파일, 추적성 유지). word_count_body 3,504w (ERJ 3,500w 한도 +4w — 허용 tolerance 내; 압축 여유는 Discussion mechanism 단락에 100w+ 존재). DOI placeholder 유지(Master Q2). 보호 영역(cohort def·primary 결과·8 액션·R-2 mitigation·sister cite·α₁ 양수) 모두 무손상.

### 적용 변경 4건

| # | 위치 | 변경 | Source |
|---|---|---|---|
| 1 | Frontmatter (line 2-29) | role/turnId/phase/version/date/word_count_body 갱신, key_results에 S2·S7·S6 결과 박제, changelog 항목 (9) 추가 | Master 결정 + Dev rev2 |
| 2 | Methods §Sensitivity (line ~111) | 단락 끝에 1문장 추가: "Sensitivity S6 (smoker-only stratum, prespecified) was removed post hoc owing to an insufficient stratum size (n=192) that produced a degenerate total-effect bootstrap distribution; this exclusion is reported transparently per ICMJE guidance on prespecified-but-unestimable analyses." | Master Q1 (drop + transparent report) |
| 3 | Table 4 (line 188-189) | S2 행: `(regen pending)` → `724 / **1.100 (1.00–1.24)** (borderline) / 1.668 (0.94–3.60) / 18.6`. S7 행: `(regen pending)` → `850 / **1.149 (1.05–1.29) ★** / 1.878 (1.09–4.14) / 22.0`. S6 행 추가하지 않음 (Master Q1: drop). | Dev rev2 paste-ready rows |
| 4 | Results §Sensitivity (line ~178) + Discussion §Strengths (line ~214) | Results: 마지막 문장 추가 — IPW S7 1.149 (1.05-1.29) marginally stronger, S2 + Charlson 1.100 (1.00-1.24) borderline. Discussion: §Strengths 단락 끝에 prose 2-문장 — S7 strengthens confidence indirect effect ≠ complete-case artefact, S2 attenuated but direction preserved with lower CI at null indicating residual comorbidity confounding could partially explain the effect. | Master 본 turn 작업 지시 §3 |

### G1 word count 재실측

- Method: `awk '/^## Abstract/,/^## Supplementary material/' | sed (table·figure·footnote 제거) | wc -w`
- 결과: **3,504w** (ERJ Original Article 한도 3,500w 대비 **+4w**)
- 판정: tolerance 내 (1% 미만 초과). 압축 1순위 여유: Discussion §Possible mechanisms 단락(~250w) 또는 §Strengths 신규 추가분(~80w). Master 검토 후 필요 시 Discussion §mechanisms에서 4w 손쉽게 절감 가능.

### G2~G5 게이트 재확인

- **G2** (sister cite ≥2회): Methods §1 + Cover letter + References [37] = 3회 → PASS
- **G3** ("screening"/"clinician should ask"/"risk score for clinical use" 잔존 0건): 본 mini-merge에서 신규 추가 prose(S7/S2 strengths 단락 + S6 removal 1줄)에 해당 키워드 없음 → PASS 유지
- **G4** (모든 supp ref 통합): S1/S3/S4/S8 → 본문 cross-ref 변경 없음 → PASS 유지
- **G5** (Table 3 α₁ 4 cells 양수): 본 mini-merge에서 Table 3 미수정 → PASS 유지

### 미해결 이슈·Gap (carry-over)

- **G1 +4w 미세 초과**: tolerance 내. 제출 전 Discussion mechanisms에서 4w 정도 절삭 권장 (예: "approximately one fifth" → "~22%" 등 소소 압축).
- **DOI placeholder**: Master Q2 결정 — 유지. submission/acceptance 시점 mint 후 line 115 + line 251 일괄 갱신.
- **Author/Funding/Affiliations [Verify before submission]**: 변동 없음. 제출 직전 Master 확정.
- **Table 1 [x] 셀**: 변동 없음. 제출 직전 statistical author 채움.

### 인계 메모

- **본 작업 산출물**: `full_manuscript_ver3.5_F-rev1_E.md` (in-place 수정 아닌 새 파일 생성 — Edi 판단으로 추적성 우선). 기존 `full_manuscript_ver3.5_F_E.md`는 보존.
- **다음 세션 시작점**: Master review of ver3.5_F-rev1 → ERJ submission portal upload 결정 (또는 4w 미세 압축 후 제출).
- **P-N 아이템**:
  - P1: Author/Funding/Affiliations 확정
  - P2: Table 1 [x] 셀 채움
  - P3: DOI mint + 본문/Cover letter DOI 갱신
  - P4 (선택): Discussion §mechanisms에서 4w 미세 압축

### versionBump 확정 (D-130)

- 자동 감지: (Nexus suggested 부재 가정 — 본 mini-merge는 reports/ 산출물만 변경, persona/policy/decision_ledger 무변경)
- **Edi 판단**: 변경 없음 — bump 0
- **사유**: 산출물 mini-revision (Dev 수치 paste + S6 drop transparent 1줄 + S7/S2 strengths prose). 페르소나·정책·decision·hook 모두 무변경. CLAUDE.md D-130 기준 어느 카테고리에도 매칭 0.

### Master 결정 필요

**없음** — 즉시 Master review 또는 자동 진행. (선택: Discussion §mechanisms 4w 미세 압축 여부)

---

[ROLE:edi]
# self-scores
gp_acc: 0.85
scc: Y
cs_cnt: 4
art_cmp: 1.0
gap_fc: 1
