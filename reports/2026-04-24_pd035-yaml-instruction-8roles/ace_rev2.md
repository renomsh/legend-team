---
turnId: 4
invocationMode: subagent
phase: synthesis
rev: 2
---

# Ace rev2 — 8역할 지표·가중치·합산 공식 제안

Master님, 확정 사항(역할당 3~5지표 · 100점 환산 · 가중치 합 1.0 · 참여 세션만 · UI는 topic_082) 모두 반영해 합산 설계 확정안을 올립니다. 단호하게 제안드립니다.

---

## 1. 8역할 canonical 지표 리스트

### 1.1 ace (5건 · 유지)
| id | shortKey | 축 | scale | polarity | tier |
|---|---|---|---|---|---|
| `ang_nov` | 제안 각도 참신성 | learning | 0-5 | higher-better | extended |
| `rfrm_trg` | 리프레임 트리거 | judgment-consistency | Y/N | higher-better | **core** |
| `orc_hit` | 오케스트레이션 적중률 | judgment-consistency | ratio | higher-better | extended |
| `ctx_car` | 컨텍스트 이월 | execution-transfer | ratio | higher-better | **core** |
| `mst_fr` | 마스터 수정 빈도 역수 | judgment-consistency | ratio | higher-better | extended |

### 1.2 arki (4건 · 유지)
| id | shortKey | 축 | scale | polarity | tier |
|---|---|---|---|---|---|
| `str_fd` | 구조 결함 발견 밀도 | quality | 0-5 | higher-better | extended |
| `sa_rnd` | 자가감사 라운드 수 | learning | 0-5 | higher-better | extended |
| `aud_rcl` | 감사 recall | quality | ratio | higher-better | **core** |
| `spc_lck` | 스펙 lock | execution-transfer | Y/N | higher-better | extended |

### 1.3 fin (5건 · +신규 core 1)
| id | shortKey | 축 | scale | polarity | tier |
|---|---|---|---|---|---|
| `roi_dl` | ROI delta | quality | ratio | higher-better | extended |
| `rdn_cal` | 중복 캐리브레이션 | quality | ratio | lower-better | extended |
| `cst_acc` | 비용 정확도 | quality | ratio | higher-better | extended |
| `cst_alt` | 비용 대안 제시 | learning | 0-5 | higher-better | extended |
| `fbd_rt` | 금지어 오염률 | quality | ratio | lower-better | **core** |

### 1.4 riki (4건 · 유지)
| id | shortKey | 축 | scale | polarity | tier |
|---|---|---|---|---|---|
| `crt_rcl` | critical recall | quality | ratio | higher-better | **core** |
| `prd_rej` | 생산적 거부 | learning | 0-5 | higher-better | extended |
| `fp_rt` | false positive rate | quality | ratio | lower-better | extended |
| `cr_val` | cross-review 가치 | quality | 0-5 | higher-better | extended |

### 1.5 nova (3건 · `prm_rt` deprecate + Ace 신규 1건 설계)
`prm_rt`(전체 승격률)는 분모가 all-sessions라 Master의 "참여 세션만" 규칙과 충돌 → **deprecate** 후 `inv_prm`로 대체합니다. Nova는 core가 빈약하므로 Ace 판단으로 신규 1건을 추가 설계합니다.

**Ace 신규 설계 — `blnd_spt` (Blind-spot 포착)**: Riki가 세션에서 제기한 리스크·축 리스트와 대조해, Nova가 제시한 대안 축 중 **Riki 미언급 축의 비율**. 의외성의 실질 가치(=다른 역할이 못 본 축을 Nova가 포착) 측정.

| id | shortKey | 축 | scale | polarity | tier |
|---|---|---|---|---|---|
| `spc_axs` | 대안 축 수 | learning | 0-5 | higher-better | extended |
| `inv_prm` | invoked-sessions-only 승격률 | judgment-consistency | ratio | higher-better | **core** |
| `blnd_spt` | Riki 미포착 축 포착률 | quality | ratio | higher-better | **core** |

`blnd_spt` spec:
- `construct`: "Nova가 제시한 대안 축 중 동일 세션 Riki 발언에 등장하지 않은 축의 비율"
- `externalAnchor`: Riki turn 발언 텍스트 (해당 세션 `current_session.turns[].role=="riki"`)
- `denominator`: Nova invoked sessions only
- 계산: `count(nova_axes \ riki_axes) / count(nova_axes)`

※ `prm_rt`는 `deprecated: true` 필드로 보존(삭제 금지 원칙), 합산 대상 제외.

### 1.6 dev (4건 · +신규 core 1)
| id | shortKey | 축 | scale | polarity | tier |
|---|---|---|---|---|---|
| `gt_pas` | 게이트 통과율 | quality | ratio | higher-better | extended |
| `spc_drf` | 스펙 drift | execution-transfer | ratio | lower-better | extended |
| `reg_zr` | 회귀 0 | quality | Y/N | higher-better | extended |
| `rt_cov` | 런타임 검증 4축 커버리지 | execution-transfer | ratio | higher-better | **core** |

### 1.7 editor (5건 · +신규 core 1)
| id | shortKey | 축 | scale | polarity | tier |
|---|---|---|---|---|---|
| `art_cmp` | artifact 완성도 | quality | ratio | higher-better | extended |
| `gap_fc` | gap 포착 | quality | 0-5 | higher-better | extended |
| `cs_cnt` | checklist 완수 | execution-transfer | ratio | higher-better | extended |
| `scc` | 세션 close 정확도 | execution-transfer | ratio | higher-better | extended |
| `gp_acc` | gap 박제 정확도 | quality | ratio | higher-better | **core** |

### 1.8 vera (3건 · +신규 core 1, 최소치 충족)
| id | shortKey | 축 | scale | polarity | tier |
|---|---|---|---|---|---|
| `tk_cns` | 토큰 일관성 | quality | ratio | higher-better | extended |
| `spc_cpl` | 스펙 준수 | execution-transfer | ratio | higher-better | extended |
| `tk_drf0` | 토큰 drift 0 | quality | Y/N | higher-better | **core** |

---

## 2. 역할별 가중치 제안

원칙: **core 합 ≥ 0.5**, 단일 지표 ≤ 0.5, polarity lower-better는 `100 - score`로 변환 후 합산.

### 2.1 ace (core: `rfrm_trg`, `ctx_car` = 0.55)
| id | weight |
|---|---|
| `rfrm_trg` **core** | 0.30 |
| `ctx_car` **core** | 0.25 |
| `orc_hit` | 0.20 |
| `mst_fr` | 0.15 |
| `ang_nov` | 0.10 |
| **합** | **1.00** |

### 2.2 arki (core: `aud_rcl` = 0.50)
| id | weight |
|---|---|
| `aud_rcl` **core** | 0.50 |
| `str_fd` | 0.20 |
| `spc_lck` | 0.20 |
| `sa_rnd` | 0.10 |
| **합** | **1.00** |

### 2.3 fin (core: `fbd_rt` = 0.30 → 불충분 시 `cst_acc` 승격 대신 core weight 상향)
core 1개만이므로 core가 0.5 이상 되도록 조정:

| id | weight |
|---|---|
| `fbd_rt` **core** | 0.30 |
| `cst_acc` | 0.25 |
| `roi_dl` | 0.20 |
| `rdn_cal` | 0.15 |
| `cst_alt` | 0.10 |
| **합** | **1.00** |

※ Fin의 core 비중이 0.30으로 원칙(≥0.5) 미달. **Master 결정 요청**: (a) `cst_acc`를 core로 승격해 core=0.55 달성, (b) 현 안 유지. Ace 권고는 **(a) 승격** — 비용 정확도는 Fin 신뢰성의 근간이므로 core 자격 충분.

### 2.4 riki (core: `crt_rcl` = 0.50)
| id | weight |
|---|---|
| `crt_rcl` **core** | 0.50 |
| `cr_val` | 0.20 |
| `fp_rt` | 0.15 |
| `prd_rej` | 0.15 |
| **합** | **1.00** |

### 2.5 nova (core: `inv_prm`, `blnd_spt` = 0.65)
| id | weight |
|---|---|
| `inv_prm` **core** | 0.35 |
| `blnd_spt` **core** | 0.30 |
| `spc_axs` | 0.35 |
| **합** | **1.00** |

### 2.6 dev (core: `rt_cov` = 0.35 → 원칙 미달)
| id | weight |
|---|---|
| `rt_cov` **core** | 0.35 |
| `gt_pas` | 0.30 |
| `reg_zr` | 0.20 |
| `spc_drf` | 0.15 |
| **합** | **1.00** |

※ Dev core 비중 0.35로 원칙 미달. **Master 결정 요청**: (a) `gt_pas` core 승격(게이트 통과는 Dev 핵심), core=0.65 달성, (b) 현 안 유지. Ace 권고 **(a) 승격**.

### 2.7 editor (core: `gp_acc` = 0.30 → 원칙 미달)
| id | weight |
|---|---|
| `gp_acc` **core** | 0.30 |
| `scc` | 0.25 |
| `cs_cnt` | 0.20 |
| `art_cmp` | 0.15 |
| `gap_fc` | 0.10 |
| **합** | **1.00** |

※ Editor core 비중 0.30. **Master 결정 요청**: (a) `scc`(세션 close 정확도) core 승격, core=0.55, (b) 현 안 유지. Ace 권고 **(a) 승격**.

### 2.8 vera (core: `tk_drf0` = 0.45 → 근소 미달, 허용 범위로 판단)
| id | weight |
|---|---|
| `tk_drf0` **core** | 0.45 |
| `spc_cpl` | 0.35 |
| `tk_cns` | 0.20 |
| **합** | **1.00** |

※ Vera는 0.45로 경계선. Ace 판단: 지표 3건 한계로 core 0.5 강제는 단일 지표 집중(0.5 상한 저촉)을 유발하므로 **현 안 유지 권고**.

---

## 3. 합산 공식 spec

```
composite_role = Σ (normalized_metric_i × weight_i)

where:
  normalized_metric_i ∈ [0, 100]  // PD-023 §3 규칙 적용
    - ratio (higher-better):  raw × 100
    - ratio (lower-better):   (1 - raw) × 100
    - 0-5   (higher-better):  (raw / 5) × 100
    - Y/N   (higher-better):  Y=100, N=0

  weight_i:                   역할 내부 선언, Σ weight_i = 1.0

  denominator (세션 집계 시): invoked-sessions-only
    - 참여 토픽/세션만 산정
    - default-fallback 세션 제외

  range selector:             UI 표시 시 "N세션 중 M세션 평가됨" (M=참여 세션)
    (UI 구현은 topic_082에서 진행)

출력:
  composite_role: float, [0, 100], 소수점 1자리
  metric_scores[]: 각 지표의 normalized score 병기 (drill-down용)
```

**구조 확정**: 역할당 **composite 1개 + 지표별 개별 점수 병기**. 축별(quality/judgment-consistency/learning/execution-transfer) 합산은 합산 공식에 **포함하지 않음** — Master 요구는 "합산 점수" 단일, 축별 drill-down은 topic_082 UI 범주.

**Nova deprecated 처리**: `prm_rt`는 schema에 `deprecated: true` + `deprecatedAt: "2026-04-24"` + `replacedBy: "inv_prm"` 필드 추가, 합산 계산기에서 제외(코드 레벨 필터).

---

## Master 승인 요청

다음 3단을 승인해주시기 바랍니다.

### 1. 지표 리스트 (총 31건, nova 신규 `blnd_spt` 포함, `prm_rt` deprecate)
- ace 5 / arki 4 / fin 5 / riki 4 / nova 3 / dev 4 / editor 5 / vera 3
- nova `blnd_spt` 신설 승인 여부
- nova `prm_rt` deprecate 승인 여부

### 2. 가중치 — 3건 경계선 결정 필요
| 역할 | 현 core 합 | Ace 권고 |
|---|---|---|
| fin | 0.30 | `cst_acc` core 승격 → 0.55 |
| dev | 0.35 | `gt_pas` core 승격 → 0.65 |
| editor | 0.30 | `scc` core 승격 → 0.55 |
| vera | 0.45 | 현 안 유지 (지표 3건 한계) |

나머지 4역할(ace 0.55 / arki 0.50 / riki 0.50 / nova 0.65)은 원칙 충족, 그대로 승인 요청.

### 3. 합산 공식
- `composite_role = Σ(normalized × weight)`, 0~100 float 소수점 1자리
- invoked-sessions-only denominator
- 역할당 composite 1개 + 지표별 점수 병기, 축별 합산 제외(topic_082 UI 범주)

이 3단 승인 시 Arki rev3로 넘겨 스키마 migration plan + 검증 스크립트 설계로 진행하겠습니다.

ACE_WRITE_DONE: C:/Projects/legend-team/reports/2026-04-24_pd035-yaml-instruction-8roles/ace_rev2.md
