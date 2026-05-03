---
role: zero
turnId: 4
phase: simplify
topic: topic_151
invocationMode: subagent
---

ZERO_WRITE_DONE: reports/2026-05-02_copd-paper-part2-residual/zero_rev1.md

## Zero — Manuscript simplify (목표 -830w)

### 정직 선언 (보호 영역 우선 — 짐작 cut 금지)

**현재 디스크에 base manuscript 본문(prose) 파일이 없습니다.** 검증 결과:

- `01_originals/`: `Manuscript_1.0.docx`, `Manuscript_original.docx` (binary, Read 불가), `ver3.5_E_patch_ORIGINAL.md` (Patch #1, **patch instruction만**)
- `03_patch_v2/ver3.5_E_patch_v2_session174.md`: **141 lines, 본문 prose 0줄**. Patch #2~#7 modification 지시(Abstract 1문장 교체 / Methods Cohort 1문단 교체 / Tables 4종 regen / E-value 표) + cross-validation checklist만 박제.
- `Glob C:/Projects/COPD/**/ver3.5_*.md` 결과 = 위 2개 파일이 전부.

즉 Arki가 추정한 "본문 ~3,900-4,000w (추정)" 자체가 **patch + reconstructed base** 추정치이며 Arki 표 자체에 "(추정)" 명시. **본문 prose가 디스크에 없으므로** 실측 word count·중복 횟수·hedging 카운트·"in the context of" grep 모두 **불가능**.

Zero 원칙(persona): **"정량 근거 (단어 수·중복 횟수) 없이 판단 금지"**. base manuscript 미접근 상태에서 Cut/Refine 표를 채우면 짐작이며 이는 곧 **보호 영역 (Methods cohort 정의·결과 수치·8 액션) 침범 가능성**. 정직하게 "정제 불가 — 입력 부재"로 보고합니다.

### Cut 후보 (지운다)

| # | 위치 | 현 단어 | cut 후 | 절감 | 근거 (정량) |
|---|---|---|---|---|---|
| — | **base manuscript 미접근** | — | — | **-0w** | 디스크에 .md 본문 없음. .docx 2개는 Read 도구 비호환 |

### Refine 후보 (합친다·압축한다)

| # | 위치 | before | after | 절감 | diff |
|---|---|---|---|---|---|
| — | **base manuscript 미접근** | — | — | **-0w** | 동일 사유 |

### 그대로 둔다 (보호)

| 위치 | 이유 |
|---|---|
| Patch v2 모든 항목 (Abstract n+OR / Methods cohort 정정 / Tables 2-4 / E-value / α₁ 부호 / S8 sensitivity) | 절대 보호 영역 (cohort·결과 수치·8 액션) |
| Arki 추가 8 액션 (A1~A8) | Riki/Ace/Jobs 결정 — 정제 대상 아님 |

### 누계

- Cut 합계: **-0w**
- Refine 합계: **-0w**
- **총 절감: -0w** (목표 -830w 대비 **-830w 부족**)

### Arki 압축 힌트 검증

| 항목 | Arki 추정 | Zero 실측 | 판정 |
|---|---|---|---|
| Intro -150w | 가능 추정 | **검증 불가** | base prose 없음 |
| Discussion mechanism -100w | 가능 추정 | **검증 불가** | 동일 |
| Methods Patch #3 Supp 이전 -80w | 가능 추정 | patch 본문 96 words 측정됨 (line 43-44 신규 텍스트), **이 자체는 +90w 추가분**. Supp 이전 = -90w 가능 단, 이는 Arki가 이미 A 표 net 계산에 반영한 +90w를 0으로 만드는 것 (압축 아닌 액션 무효화) | 부분 검증 |

**Arki 합계 -330w vs Zero 합계 -0w — 차이:** Arki는 base manuscript 존재를 가정한 추정치, Zero는 실측 기반 = 0w. **본 토픽에서 Zero가 책임질 수 있는 정제량 = 0w (입력 부재).**

### 잔여 위험 (목표 미달)

**-830w 압축 작업은 Zero가 처리할 수 없습니다. 처리 가능 주체:**

1. **Edi 또는 Dev** — `Manuscript_1.0.docx` / `Manuscript_original.docx`를 .md로 변환 후 prose 전체를 `submission_session174_2026-05-02/01_originals/ver3.5_E_base.md` 등 경로에 박제. 변환 도구: `pandoc -f docx -t markdown` 또는 `anthropic-skills:docx`.
2. **변환 완료 후 Zero 재호출** — 본 reports에 zero_rev2.md로 실측 Cut/Refine 표 채워 -830w 달성.

대안: ver3.5_F merge 시점(Edi 작업)에 Edi가 patch v2 + base를 직접 merge하며 동시에 prose 압축 수행. 이 경우 Zero 단독 호출 불필요 — Edi가 Zero 정제 원칙(hedging cut, prepositional chain 압축, Table 수치 prose 중복 제거)을 인라인 적용. policies/role-zero.md 정제 영역 3종 중 simplify는 Edi 인라인 위임 가능.

### Master 결정 필요

**1건:** -830w 압축 작업 진행 경로 선택 —
- (a) Dev/Edi가 .docx → .md 변환 → Zero 재호출(zero_rev2.md 실측 Cut/Refine 표) — Zero 책임 유지
- (b) Edi가 ver3.5_F merge 시점에 prose 압축 인라인 처리 — Zero 본 토픽 종결

권고: **(b)**. 이유: ver3.5_F merge가 어차피 Edi 작업이고, merge 중 prose 재구성이 발생하므로 분리된 Zero 정제 round는 중복 round trip. Zero 정제 원칙(hedging·prepositional·prose-table dup)은 instruction 1단락으로 Edi에게 전달 가능 — 별도 페르소나 round 불필요.

---

[ROLE:zero]
# self-scores
ts_rd: 0
ts_rs: 0
sc_rd: 0
sc_rs: 0
sm_rd: 1
sm_rs: 0
