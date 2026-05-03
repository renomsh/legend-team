---
role: arki
turnId: 3
phase: structural-mapping
topic: topic_151
invocationMode: subagent
---

## Arki — ERJ submission 구조 gap 매핑

ARKI_WRITE_DONE: reports/2026-05-02_copd-paper-part2-residual/arki_rev1.md

> 주의: ver3.5_E_patch_v2_session174.md는 **patch 단위 modification** 이지 standalone manuscript 아님. Anatomy는 patch + (reconstructed) ver3.5_E base manuscript 기준으로 추정. 실 word count 검증은 ver3.5_F merge 시점 G1 게이트.

---

### 1. 현 manuscript anatomy (patch 기반 추정)

| 섹션 | 현 상태 (patch v2 적용 후 추정) | ERJ Original Article 표준 | Gap |
|---|---|---|---|
| Abstract (structured) | ~270w (Patch #2 신규 conclusion 1문장 + 기존) | 250w | **+20w 초과** — 압축 필요 |
| Introduction | ~600-700w (변경 없음) | 600-800w | OK |
| Methods | ~1,400w (Patch #3 cohort 정정 +90w) | 1,000-1,500w | **거의 한도** — A1·A3·A4 추가 시 +310w 압박 |
| Results | ~900w (Tables 2/3/4 regen, prose 변경 없음) | 600-1,000w | OK |
| Discussion | ~1,000w (변경 없음) | 800-1,200w | A5(+150w)·A7(swap) 후 ~1,150w (한도 내) |
| Tables | 4 main (T1 baseline, T2 total effect, T3 CMA, T4 sensitivity) | ≤6 main | OK |
| Figures | 0 main + (cohort flow supp) | ≤6 main | A1 time-ordering supp 추가 |
| Supp tables | ~3 (cohort_flow, sweep, evalue) | no limit | A1·A2 추가 → 5~6 |
| References | ~30-40 (추정) | typical 30-50 | OK |
| **본문 합계** | **~3,900-4,000w (추정)** | **3,500w** | **-400~500w 압축 필요 (G1)** |

핵심 위험: ERJ 본문 한도 초과. Methods·Discussion 추가 액션이 한도 압박 가속.

---

### 2. 수정 액션 8건 정밀 위치 매핑

| # | 출처 | 액션 | 위치 (섹션·patch line) | 분량 delta | 의존 |
|---|---|---|---|---|---|
| **A1** | Riki R-1 | Time-ordering 도식 (Supp Fig S1) + Discussion limitations 첫 단락 reverse causation 명시 + GOLD 1-2 sub-cohort sensitivity (S9 신설) | Methods §Cohort 끝 (patch L44 직후 1문장 cross-ref) / Discussion §Limitations §1 / Supp Fig S1 + Supp Table for S9 | 본문 +120w / 1 fig / 1 table | A6(S8 옆 S9 자리). A3 primary 톤 정합 |
| **A2** | Riki R-2 | Code/data DOI 박제 + ignorability sensitivity (Imai/VanderWeele, Supp Table SX) + patch v1(부호 typo) 흔적 manuscript 외부 격리 | Methods §Statistical Analysis 끝 (Code availability 1문장) / Supp Table S3 | 본문 +60w / 1 table | 독립 (가장 먼저 가능) |
| **A3** | Riki R-3 | Statistical Analysis §1에 hierarchical primary endpoint 명시 (per-tier trend = primary, binary Low vs High = secondary) + Job=NaN MCAR 1단락 | Methods §Statistical Analysis §1 (전면 재작성) | 본문 +120w | A4 직후 (Methods 같은 영역). A6 cover letter narrative와 정합 |
| **A4** | Ace #1 | Sister(predictive)→본고(causal mediation) **logical sequence** 1단락 | Methods 첫 단락 (Cohort 직전) 신규 삽입 | +80w | A6(cover letter) 정합 |
| **A5** | Ace #2 | Income-level **policy lever** 1단락 prose (직업안전·소득보전·근로보건) | Discussion 마지막 단락 (Conclusion 직전) 신규 | +150w | A7(톤 swap)과 정합. Bullet 금지 (Jobs Saying no #2) |
| **A6** | Ace #3 | "Second of two pre-planned investigations" 1줄 + non-overlap (outcome/exposure/framework) 박제 | Cover letter §2 신규 | +30w (cover) | A4 본문 logical sequence와 mirror |
| **A7** | Jobs | "screening / clinician should ask" → "policy lever / public health" 톤 swap | grep "screening", "clinician", "risk score" 전체 manuscript / Abstract Conclusion 1문장 교체 / Discussion implication 단락 swap | swap (~0w net) | A5 직전 실행 (A5가 swap된 톤 위에 안착) |
| **A8** | Jobs | Take-home points 박스 삭제 / n=2,712 자랑 단락 → 분석 적합성 frame 전환 | Discussion 끝 박스 (전 삭제) / Methods n 단락 (frame 교체, 삭제 아님) | **-100w (압축 기여)** | 독립 (G1 압축 1순위) |

**Net word delta (본문):** +120 + 60 + 120 + 80 + 150 - 100 = **+430w** → 본문 ~4,330w. **G1 한도 -830w 압축 필요.**

---

### 3. 의존 그래프 + 실행 순서

```
Phase 1 (독립 병렬 — 압축 + DOI 인프라):
  ├─ A2 (Methods stat §끝 + Supp Table S3 + Code DOI)
  └─ A8 (Discussion 박스 삭제 + Methods n frame swap, -100w)

Phase 2 (Methods 재구성, 순서 강제):
  A4 (Methods 첫 단락 신규)
   └→ A3 (Statistical Analysis §1 hierarchical primary 박제)
        └→ A1 (Cohort §끝 cross-ref + Supp Fig S1 + S9 sensitivity)

Phase 3 (Discussion 재구성, 순서 강제):
  A7 (전 manuscript "screening" swap, Abstract Conclusion 교체)
   └→ A5 (Discussion 마지막 단락 policy lever 신규, swap된 톤 위)

Phase 4 (Cover letter — A4 logical sequence 텍스트 mirror):
  A6 (cover §2 1줄 + non-overlap 3축)

Phase 5 (검증 게이트):
  G1: 본문 word count ≤ 3,500w
       — 미달 시 압축 1순위: Introduction (~700w → 550w),
                       2순위: Discussion §Mechanism prose (-100w),
                       3순위: Methods 중복 (Patch #3 cohort 설명을 Supp로 이전 -80w)
  G2: Sister paper (Kwon 2026 Respir Res) explicit cite ≥ 2회
       — Methods 첫 단락 (A4) + Cover letter (A6). Discussion 추가 권장.
  G3: "screening" / "clinician should ask" / "risk score for clinical use" 키워드 잔존 0건 (grep 검증)
  G4: 모든 신규 supp 항목 (Fig S1, Table S3, S9) Methods·Results에서 ref됨
  G5: α₁ 4 cells 모두 양수 (patch v2 L77 박제 검증 — display 잔여 typo 제로)
```

---

### 4. 충돌 게이트 + Fallback

| 충돌 위험 | 발생 조건 | Mitigation | Fallback |
|---|---|---|---|
| **C1: A3 ↔ A4 같은 Methods 영역** | A4(첫 단락)·A3(Stat Analysis §1) 둘 다 Methods 머리 부분 수정 | A4 → A3 순서 강제 (A4 먼저 안착 후 A3가 §1 별도 수정) | A3를 Methods §3 (analysis subsection)로 이동 |
| **C2: A1 Supp Fig vs A2 Supp Table 번호 충돌** | 둘 다 Supp 신규 자산 | 번호 사전 예약: A2=Supp Table S3, A1=Supp Fig S1 + Supp Table S4 (S9 sensitivity row는 Table 4 main에 추가) | Supp 통합 doc 별도 관리 |
| **C3: A5 ↔ A7 Discussion 영역 동시 수정** | A7 swap 중 A5 신규 단락이 swap 대상 단어 포함 | A7 → A5 순서 강제. A5 작성 시 "screening" 단어 사전 금지 | A5 prose 작성 후 A7 grep 재실행 |
| **C4: G1 word limit 초과** | +430w 추가 vs -100w 삭제 (net +330w 위에 base ~3,900w) | A8 + 압축 1순위 (Intro -150w) 동시 | Methods Patch #3 cohort 상세 → Supp로 이전 (-80w) |
| **C5: G2 sister cite 누락** | A4·A6만으로 cite 2회, Discussion에 미반영 시 reviewer가 "본문 통합 부족" 의심 | Discussion §1 (study positioning)에 1회 추가 cite — A5 prose에 자연스럽게 통합 | 별도 1문장 신규 |

**리스크별 Fallback 박제:**
- **Phase 2 conflict (A4·A3 merge fail)** → A3를 Methods §3 분리 (위 C1)
- **Phase 5 G1 fail** → 압축 우선순위: Intro → Discussion mechanism → Methods Patch #3 cohort 상세 Supp 이전
- **Phase 5 G2 fail** → Discussion §1 sister cite 추가
- **Phase 5 G5 fail (display typo 재발)** → ver3.5_F merge 시점 4 cells 수동 검증 + Edi cross-check

---

### Master 결정 필요

**없음 — 즉시 다음 (Dev/Edi 실수정 시작).**

다음 단계 권고: Dev가 Phase 1 (A2·A8) 병렬 시작, 동시 Phase 2 (A4→A3→A1) 순차. Edi가 G1~G5 게이트 통과 검증 후 ver3.5_F draft 박제.

---

[ROLE:arki]
# self-scores
aud_rcl: Y
str_fd: 5
spc_lck: Y
sa_rnd: 2
