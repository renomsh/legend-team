---
turnId: 5
invocationMode: subagent
phase: synthesis
rev: 3
---

# Ace rev3 — Fin/Dev 지표 수정 반영

Master, 수정 지시 2건만 반영한 델타입니다. 나머지는 rev2 유지 명기.

---

## 1. Fin 지표 갱신 (5건 → 4건)

`fbd_rt` (금지어 오염률) 삭제. core 지표 전무 상태가 되어 `cst_acc` (비용 정확도)를 core로 승격합니다. Fin 역할의 본질이 "숫자 신뢰성"이라 이 축이 빠지면 Fin 자체가 무의미해집니다.

| shortKey | id | axis | scale | polarity | tier | weight |
|---|---|---|---|---|---|---|
| **cst_acc** | fin.cost_accuracy | quality | ratio | higher-better | **core** | **0.40** |
| roi_dl | fin.roi_delivery | impact | ratio | higher-better | standard | 0.25 |
| rdn_cal | fin.redundancy_call | quality | ratio | higher-better | standard | 0.20 |
| cst_alt | fin.cost_alternative | impact | count | higher-better | standard | 0.15 |

weight 합계 1.00. core 1건에 0.40 집중, 나머지 3건에 0.60 분산.

---

## 2. Dev 지표 갱신 (4건 유지, 1건 교체)

`reg_zr` (회귀 0) 삭제 → `hc_rt` (하드코딩율) 신설. Master 피드백 `feedback_dev_verify_and_callable.md` 및 DEV-LL-006 레슨런과 직접 정합하는 축이라 core 승격.

### 신규 지표 spec

```yaml
- id: dev.hardcoding_rate
  shortKey: hc_rt
  axis: quality
  scale: ratio
  polarity: lower-better
  tier: core
  construct: "Dev 구현물 내 하드코딩된 값(경로·상수·설정) 건수 / 총 config 참조 지점"
  externalAnchor:
    - "git diff 스캔 (정규식 기반 하드코딩 패턴 카운트)"
    - "DEV-LL-006 레슨런 기록"
    - "Arki 구현 검토 보고서의 하드코딩 지적 건수"
  rationale: "Master 피드백에서 반복 지적된 구조적 결함. Dev 산출물의 재사용성·설정 원천 단일화의 핵심 지표."
```

### Dev 지표 테이블

| shortKey | id | axis | scale | polarity | tier | weight |
|---|---|---|---|---|---|---|
| **rt_cov** | dev.runtime_coverage | quality | ratio | higher-better | **core** | **0.35** |
| **hc_rt** | dev.hardcoding_rate | quality | ratio | lower-better | **core** | **0.30** |
| gt_pas | dev.gate_pass | quality | ratio | higher-better | standard | 0.20 |
| spc_drf | dev.spec_drift | quality | ratio | lower-better | standard | 0.15 |

weight 합계 1.00. core 2건(rt_cov 0.35 + hc_rt 0.30 = 0.65)에 집중.

---

## 3. 합산 공식 재확인

**공식 (rev2와 동일):**
```
composite = Σ(normalized_score × weight)
```

- 각 지표: **0~100** 정수 또는 소수점 1자리로 정규화
- composite: **0~100** float 소수점 1자리
- invoked-sessions-only (역할이 실제 발언한 세션만 집계)

**출력 표기 예시:**
```
ace composite: 78.4 / 100
  ├ rfrm_trg: 100 / 100 (weight 0.30)
  ├ ctx_car:  85  / 100 (weight 0.25)
  ├ orc_hit:  72  / 100 (weight 0.20)
  ├ mst_fr:   60  / 100 (weight 0.15)
  └ ang_nov:  80  / 100 (weight 0.10)

fin composite: 82.0 / 100
  ├ cst_acc:  90  / 100 (weight 0.40)  [core]
  ├ roi_dl:   75  / 100 (weight 0.25)
  ├ rdn_cal:  80  / 100 (weight 0.20)
  └ cst_alt:  80  / 100 (weight 0.15)

dev composite: 76.5 / 100
  ├ rt_cov:   85  / 100 (weight 0.35)  [core]
  ├ hc_rt:    70  / 100 (weight 0.30)  [core, inverted]
  ├ gt_pas:   80  / 100 (weight 0.20)
  └ spc_drf:  65  / 100 (weight 0.15)
```

lower-better 지표(hc_rt, spc_drf)는 정규화 시 `100 - raw_pct` 역변환 후 합산.

---

## 4. rev2 잔여 승인 미확인 항목 (유지 가정)

아래 4건은 rev2 제안 그대로 유지하고 이번 rev3에서 Master 최종 일괄 승인 요청드립니다.

- **nova `blnd_spt`** (블라인드 스팟 발견율) 신설 — 유지
- **nova `prm_rt`** (프로모션율) deprecate — 유지
- **editor `scc`** (구조 일관성 점수) core 승격 — 유지
- **ace/arki/riki/nova/vera 가중치 배분** — rev2 표 그대로 유지

---

## 5. 갱신된 총 지표 수

| 역할 | 지표 수 | core 건수 |
|---|---|---|
| ace | 5 | 2 (rfrm_trg, ctx_car) |
| arki | 4 | 1 (aud_rcl) |
| **fin** | **4** (was 5) | **1 (cst_acc)** |
| riki | 4 | 1 (crt_rcl) |
| nova | 3 | 2 (inv_prm, blnd_spt) |
| **dev** | 4 (교체) | **2 (rt_cov, hc_rt)** |
| editor | 5 | 1 (gp_acc; scc 승격 대기) |
| vera | 3 | 1 (tk_drf0) |
| **합계** | **32** | **11** |

※ rev2 31건 → fin 5→4(-1), dev 4→4(교체) = **32건으로 확정**. (rev2 집계 당시 오산 정정: 5+4+5+4+3+4+5+3=33 → fbd_rt 제거 후 **32**.)

---

## Master 최종 승인 요청

rev3에서 확정 요청드리는 항목:

1. **Fin** — `fbd_rt` 삭제, `cst_acc` core 승격, weight 재배분 (0.40/0.25/0.20/0.15)
2. **Dev** — `reg_zr` 삭제, `hc_rt` 신설(core), weight 재배분 (0.35/0.30/0.20/0.15)
3. **rev2 잔여 4건 일괄 승인** — nova `blnd_spt` 신설, nova `prm_rt` deprecate, editor `scc` core 승격, 기타 5개 역할 가중치 배분

승인하시면 Edi에 YAML 최종본 컴파일 지시하겠습니다. 수정 있으시면 rev4로 반영하겠습니다.

ACE_WRITE_DONE: reports/2026-04-24_pd035-yaml-instruction-8roles/ace_rev3.md
