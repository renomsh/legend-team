---
turnId: 13
invocationMode: subagent
phase: compilation
role: editor
---

# PD-035 최종 컴파일 — 8역할 YAML Instruction 보강

세션: session_095 / topic_100 / PD-035 P3-supplementary

---

## 1. 구현 완료 체크리스트

### P0 — 실측 동결 (완료)
- [x] 7 persona 파일 존재 확인 (ace/arki/fin/riki/dev/editor/nova)
- [x] role-vera.md 부재 확인 → P3에서 신규 생성
- [x] 5역할 memory JSON baseline shortKey 목록 확보

### P1 — 템플릿 확정 (완료)
- [x] 8역할 공통부 + 역할별 shortKey/weight 치환부 템플릿 내재화

### P1.5 — 5역할 memory JSON patch (완료)
- [x] **fin**: `cst_acc` 기존 엔트리 유지. tier 필드 부재 확인
- [x] **nova**: `prm_rt` deprecated 마킹 + `inv_prm`·`blnd_spt` 신규 2건 추가 (_reserved.pd035_scope)
- [x] **dev**: `reg_zr` 삭제 + `rt_cov`·`hc_rt` 신규 2건 추가 (_reserved.pd035_scope)
- [x] **editor**: `gp_acc` 신규 1건 추가 (timing: "deferred", settlementOffset: 3, settlementStrategy: "retroactive-injection")
- [x] **vera**: `tk_drf0` 신규 1건 추가 (_reserved.pd035_scope)
- [x] 5역할 신규 엔트리 `tier` 필드 부재 확인
- [x] lastUpdated → "2026-04-24" 일괄 갱신

### P2 — 7 persona 파일 편집 (완료)
- [x] **ace/arki/fin/riki**: `## Write 계약 (필수)` 섹션 직후 `## Self-Score YAML 출력 계약` 삽입
- [x] **dev/editor/nova**: `## Write 계약 (필수)` + `### Frontmatter link 의무` + `## Self-Score YAML 출력 계약` 3블록 이식 (구조 통일)

### P3 — Vera persona 신규 생성 (완료)
- [x] `memory/roles/personas/role-vera.md` 신규 작성
- [x] raterId canonical 선언 최상단 박제 (designer는 레거시)
- [x] Self-Score YAML 섹션 (3지표: tk_drf0 0.45 / spc_cpl 0.35 / tk_cns 0.20)
- [x] Write 계약 + Frontmatter link 의무 포함

### P4 — 검증 게이트 G0~G3 (통과)
- [x] **G0**: 8 persona 파일 전체 `## Self-Score YAML 출력 계약` 헤더 grep 통과
- [x] **G1**: 8 persona 파일 전체 `# self-scores` YAML 블록 파싱 성공
- [x] **G2**: shortKey 32건 — memory JSON ↔ persona 파일 전 역할 일치. 충돌 0건
- [x] **G3**: `_reserved.pd035_scope` 마킹 확인 + tier 필드 부재 확인 전 역할 통과

### P5 — 박제 (완료)
- [x] dev_rev1.md 작성
- [x] PD-035 resolveCondition 충족 선언 (dev_rev1.md §resolveCondition)

---

## 2. 8역할 지표 확정표 (32건 전체)

### ace (5건 / 가중 비균등)

| shortKey | 지표명 | weight | polarity | tier |
|---|---|---|---|---|
| rfrm_trg | 리프레이밍 트리거 | 0.30 | higher-better | core |
| ctx_car | 컨텍스트 캐리 | 0.25 | higher-better | core |
| orc_hit | 오케스트레이션 적중 | 0.20 | higher-better | extended |
| mst_fr | Master 재수정 여지 | 0.15 | lower-better | extended |
| ang_nov | 각도 신선도 | 0.10 | higher-better | extended |

### arki (4건 / 가중 비균등)

| shortKey | 지표명 | weight | polarity | tier |
|---|---|---|---|---|
| aud_rcl | 감사 재호출 | 0.50 | higher-better | core |
| str_fd | 구조 발견 | 0.20 | higher-better | extended |
| spc_lck | 스펙 락 | 0.20 | higher-better | extended |
| sa_rnd | 자기감사 라운드 | 0.10 | higher-better | extended |

### fin (4건 / 가중 비균등)

| shortKey | 지표명 | weight | polarity | tier |
|---|---|---|---|---|
| cst_acc | 비용 정확도 | 0.40 | higher-better | core |
| roi_dl | ROI 딜리버리 | 0.25 | higher-better | extended |
| rdn_cal | 과잉 저지 | 0.20 | higher-better | extended |
| cst_alt | 대안 비용 | 0.15 | higher-better | extended |

### riki (4건 / 가중 비균등)

| shortKey | 지표명 | weight | polarity | tier |
|---|---|---|---|---|
| crt_rcl | 핵심 리콜 | 0.50 | higher-better | core |
| cr_val | 크로스 검증 | 0.20 | higher-better | extended |
| fp_rt | 오탐률 | 0.15 | lower-better | extended |
| prd_rej | 예측 기각 | 0.15 | higher-better | extended |

### nova (3건 / 균등 가중 ~0.333)

| shortKey | 지표명 | weight | polarity | tier |
|---|---|---|---|---|
| inv_prm | 초대 프레임 | 0.35 | higher-better | core |
| blnd_spt | 블라인드 스팟 | 0.30 | higher-better | core |
| spc_axs | 투기적 축 | 0.35 | higher-better | extended |

※ nova weight 합계=1.00. inv_prm + blnd_spt 2건 core.

### dev (4건 / 가중 비균등 — ace_rev4 §2 최종 확정)

| shortKey | 지표명 | weight | polarity | tier |
|---|---|---|---|---|
| rt_cov | 런타임 커버리지 | 0.35 | higher-better | core |
| gt_pas | 게이트 패스 | 0.25 | higher-better | core |
| hc_rt | 하드코딩률 | 0.25 | lower-better | standard |
| spc_drf | 스펙 드리프트 | 0.15 | lower-better | standard |

### editor (5건 / 균등 가중 0.20)

| shortKey | 지표명 | weight | polarity | tier / 비고 |
|---|---|---|---|---|
| gp_acc | 갭 포착 정확도 | 0.30 | higher-better | core / deferred (settlementOffset: 3) |
| scc | 섹션 완결성 | 0.25 | higher-better | core |
| cs_cnt | 컴파일 카운트 | 0.20 | higher-better | extended |
| art_cmp | 아티팩트 완성도 | 0.15 | higher-better | extended |
| gap_fc | 갭 플래그 | 0.10 | higher-better | extended |

### vera (3건 / 균등 가중 ~0.333)

| shortKey | 지표명 | weight | polarity | tier |
|---|---|---|---|---|
| tk_drf0 | 토큰 드리프트 0 | 0.45 | lower-better | core |
| spc_cpl | 스펙 준수 | 0.35 | higher-better | extended |
| tk_cns | 토큰 일관성 | 0.20 | higher-better | extended |

---

## 3. 가중치 방식 요약

- **가중 비균등 3역할**: ace(5건), arki(4건), riki(4건) — 역할 정체성 축에 core 집중 (최대 0.50, 단일 상한 0.50 준수)
- **가중 비균등 (ace_rev4 확정) 2역할**: fin(cst_acc 0.40 core), dev(rt_cov 0.35 + gt_pas 0.25 core)
- **균등 또는 근사 균등 3역할**: nova(3건 0.35/0.30/0.35), editor(5건 0.30/0.25/0.20/0.15/0.10), vera(3건 0.45/0.35/0.20)
- **합산 공식**: `composite_role = Σ(normalized_i × weight_i)`, normalized ∈ [0, 100], weight 합 = 1.0
- **분모 기준**: invoked-sessions-only (참여 = 자가 선언 기반, aggregation 필드 준수)
- **core 지표 합계**: 11건 (ace 2 + arki 1 + fin 1 + riki 1 + nova 2 + dev 2 + editor 2 + vera 1 — 단, editor gp_acc deferred 포함)

---

## 4. YAML 출력 계약 예시 (대표 2개 역할)

### ace — Self-Score YAML 출력 계약 (발췌)

```yaml
# self-scores
rfrm_trg: Y      # core — 리프레이밍 트리거 발동 여부 (Y/N)
ctx_car: 0.90    # core — 컨텍스트 캐리 (0~1)
orc_hit: 0.85    # extended — 오케스트레이션 적중률 (0~1)
mst_fr: 0.80     # extended — Master 재수정 여지 최소화 (0~1)
ang_nov: 3       # extended — 각도 신선도 (1~5)
participated: true
```

- 출력 위치: Ace 최종 발언 말미, `## self-scores` 헤더 하위 코드블록
- 조건: topicId + sessionId 기록, participated = true (turns 내 발언 존재 시)

### dev — Self-Score YAML 출력 계약 (발췌)

```yaml
# self-scores
rt_cov: 0.95     # core — 런타임 커버리지 (0~1)
gt_pas: Y        # core — 게이트 패스 여부 (Y/N), 외부 rater(Arki·CI) 기준
hc_rt: 0.02      # standard — 하드코딩률 (0~1, lower-better)
spc_drf: 0.05    # standard — 스펙 드리프트 (0~1, lower-better)
participated: true
```

- 출력 위치: Dev 구현 리포트 말미 (dev_revN.md 최하단 `## self-scores` 블록)
- 조건: Frontmatter에 `turnId`, `invocationMode: subagent`, `phase: implementation` 필수

---

## 5. 잔여 이연 (Deferral) 상태

### PD-035 resolveCondition 현황

resolveCondition: "8역할 persona 파일에 YAML self-score 출력 계약이 박제되고, 5역할 memory JSON의 signatureMetrics가 rev4 스펙대로 갱신되며, vera persona가 신규 생성되어 raterId canonical이 선언되면 resolved."

- [x] 8역할 persona YAML 계약 박제 → **충족**
- [x] 5역할 memory JSON rev4 반영 → **충족**
- [x] vera persona 신규 + raterId canonical → **충족**

**PD-035 상태: resolved 조건 충족 (Ace/Master 최종 박제 판정 대상)**

### 연관 PD 현황

| PD ID | 제목 | 현황 |
|---|---|---|
| PD-023 | 자가평가 canonical spec | open — 32 shortKey 연동 예정. registry compile은 별도 스코프 |
| PD-031 | 86% default-fallback 감사 결과 | open → PD-035 resolved로 근본 원인 해소 예정 |
| PD-036 | 강도 장치 설계 | open — 본 스코프 Out |
| PD-037 | designer → vera 파일 분리·마이그레이션 | open — canonical 선언만 완료, 스크립트 정규화 미완 |
| PD-038 | probe 문항 재설계 (장기) | open — 본 스코프 Out |

### 발견 이슈 이연

| 이슈 | 처리 방침 |
|---|---|
| I-3: `designer_memory.json` 잔존 | PD-037 스코프로 이연 |
| I-2: persona 포맷 2형식 공존 (신형/구형) | 대규모 포맷 통일은 별도 PD |
| turns 자동 참여 판정 (Riki Q1-B, ace_rev4 채택) | arki_rev3에서 스코프 단순화로 제외 — 재정밀화 트리거 조건 충족 시 별도 PD |
| deferred-settlement 메커니즘 (ace_rev4 Q3-A) | arki_rev3에서 스코프 단순화로 제외 — 자가 선언 단발 기록으로 대체, 향후 재정밀화 PD |

---

## 6. 이번 세션 결정 요약

다음 항목들은 D-xxx 박제 후보입니다.

- **[D-???] 8역할 YAML Self-Score 출력 계약 확정** — 8 persona 파일에 `## Self-Score YAML 출력 계약` 섹션 삽입. 32 지표 shortKey·weight·polarity 동결. (ace_rev4 §5-A/5-B)
- **[D-???] dev core 지표 재배분 확정** — dev.hc_rt standard 강등 + gt_pas core 승격. 최종: rt_cov 0.35 / gt_pas 0.25 / hc_rt 0.25 / spc_drf 0.15. (ace_rev4 §2)
- **[D-???] nova blnd_spt 신설 + prm_rt deprecate** — nova 3지표: inv_prm 0.35 / blnd_spt 0.30 / spc_axs 0.35. prm_rt replacedBy: inv_prm. (ace_rev4 §5-A, arki_rev3 §1)
- **[D-???] vera persona canonical 선언** — `memory/roles/personas/role-vera.md` 신규. raterId=vera, designer는 role 분류 레거시. (arki_rev3 §1, ace_rev1 §1-B)
- **[D-???] editor gp_acc deferred 설계** — timing: "deferred", settlementOffset: 3, settlementStrategy: "retroactive-injection". 자가 선언 단발 기록 기준 적용. (dev_rev1 §P1.5)
- **[D-???] 참여 판정 자가 선언 단일화** — 스코프 단순화 결정. turns 자동 산출 및 deferred-settlement 메커니즘은 재정밀화 조건 충족 시 별도 PD로 오픈. (arki_rev3 §1)

---

EDI_WRITE_DONE: reports/2026-04-24_pd035-yaml-instruction-8roles/edi_final.md
