---
role: dev
turnId: 2
sessionId: session_193
topicId: topic_166
grade: B
invocationMode: subagent
---

DEV_WRITE_DONE: reports/2026-05-05_pd062-selfscore-weight-sot/dev_rev1.md

# Dev — PD-062 weight 컬럼 폐기 구현

Dev입니다. Master 결정(Jobs D안 채택)에 따라 8 policy 파일에서 weight 컬럼 삭제 완료. Arki 단언 cross-check 통과.

---

## 1. 사전 재검증 결과

### 1-1. 대상 파일 식별
`memory/roles/policies/` 디렉터리 ls 결과 12개 md 파일 중 weight 컬럼 보유는 **정확히 8개**:
- role-ace.md, role-arki.md, role-dev.md, role-edi.md, role-fin.md, role-nova.md, role-riki.md, role-vera.md

weight 미보유: _common.md, role-jobs.md, role-sage.md, role-zero.md (Arki 1-2 단언과 일치)

### 1-2. weight 표기 형식 (실측)
8개 파일 전부 동일 형식:
- 표 헤더: `| shortKey | scale | weight | 설명 |`
- 데이터 행 weight 컬럼: `0.50 (core)` / `0.20 (extended)` / `0.15 (extended, lower-better)` 등 자유 텍스트

### 1-3. 코드 측 weight 참조 cross-check (Arki 단언 검증)

`scripts/` 전체 grep 결과 — policy 표 weight 컬럼을 읽는 코드 **0건 확인**:
- `compile-metrics-registry.ts`: REQUIRED 22필드에 `weight` 미포함 (Arki 1-3 일치)
- `compute-dashboard.ts`: weight 0건 매치
- 검출된 weight 참조는 모두 다른 SOT 영역:
  - `lib/derived-metric-compute.ts` — `composition.inputs[].weight` (derived weighted-mean — 별도 SOT)
  - `lib/signature-metrics-types.ts` — `raterWeights: Record<string, number>` (rater 신뢰도 — 별도 SOT)
  - `seed-signature-metrics.ts` — derived `composition.inputs[].weight` 시드
  - `test-p0b-smoke.ts` — derived weighted-mean 테스트 케이스
  - `_archived/generate-dashboard.ts` — CSS `font-weight` (무관)

**결론**: Arki "policy weight = dead field" 단언 검증 PASS. 폐기 안전.

---

## 2. 변경 파일 리스트 + diff 요약

### 변경 패턴 (8개 파일 공통)
- 표 헤더: `| shortKey | scale | weight | 설명 |` → `| shortKey | scale | 설명 |`
- 구분선: `|---|---|---|---|` → `|---|---|---|`
- 각 데이터 행: weight 컬럼(`0.XX (core/extended[, lower-better])`) 제거, 나머지 3컬럼 유지

### 파일별 라인 변경
| 파일 | 변경 라인 수 | 비고 |
|---|---|---|
| role-ace.md | 헤더 2 + 데이터 4 = 6 | core/extended/lower-better 메타 weight 컬럼과 함께 제거 |
| role-arki.md | 헤더 2 + 데이터 4 = 6 | 동일 |
| role-dev.md | 헤더 2 + 데이터 4 = 6 | hc_rt/spc_drf의 (standard, lower-better) 제거 |
| role-edi.md | 헤더 2 + 데이터 5 = 7 | gp_acc의 `(core, deferred, settlementOffset=3)` 중 deferred/settlementOffset만 설명 컬럼 끝에 보존 |
| role-fin.md | 헤더 2 + 데이터 4 = 6 | 동일 |
| role-nova.md | 헤더 2 + 데이터 3 = 5 | 동일 |
| role-riki.md | 헤더 2 + 데이터 4 = 6 | fp_rt의 lower-better 제거 |
| role-vera.md | 헤더 2 + 데이터 3 = 5 | 동일 |

**총 47라인 변경**. weight 컬럼 외 다른 내용 무관 변경 0건 (scope drift = 0).

### 의미 보존 처리 (R3 mitigation 적용)
- `(core)` / `(extended)` 분류: registry의 `inputPriority` 필드에 별도 SOT 보존 중 (Arki 2-Risk R2 확인) — policy 표에서는 제거.
- `lower-better` polarity: `signature-metrics-types.ts` `polarity: "lower-better" | "higher-better"` 필드에 SOT 보존 중 — policy 표에서는 제거.
- edi의 `gp_acc` `deferred, settlementOffset=3` 메타: 설명 컬럼 끝으로 이동(완전 손실 방지). 운영상 의미 있음.

**정보 손실 0건** — 모든 메타정보가 코드 SOT 또는 설명 컬럼에 보존.

---

## 3. 사후 검증 결과

### 3-1. weight 잔재 grep
```
Grep pattern="weight" path="memory/roles/policies"
→ No matches found
```
**8 policy 파일에서 weight 잔재 0건 확인** (PASS).

### 3-2. registry 빌드 검증
```
$ npx ts-node scripts/compile-metrics-registry.ts
[compile-metrics-registry] OK
  registryVersion: v1.1
  sourceHash:      1f2a9647b2a1e945
  total metrics:   51
  axis distribution:
    learning               0
    quality                43
    judgment-consistency   4
    execution-transfer     4
  written:
    memory/growth/metrics_registry.json
    memory/growth/registry_history/v1.1.json
  historical stubs added: 36
  aggregate IDs ⊆ registry IDs: OK (50 aggregate, 51 registry)
```
**registry 빌드 PASS** — 51 metrics 정상 컴파일, sourceHash 정상 산출, aggregate ID 정합 OK.

### 3-3. 종합 게이트
| 게이트 | 결과 |
|---|---|
| 사전 재검증 (Arki 단언 cross-check) | PASS |
| 변경 scope (weight 컬럼만) | PASS (drift 0) |
| 사후 grep (weight 잔재) | PASS (0건) |
| registry 빌드 | PASS |
| 정보 손실 | 0건 (모든 메타 SOT 또는 설명 컬럼 보존) |

**4-게이트 전부 통과**. PD-062 resolved-cancelled 박제 가능 상태.

---

## 4. Edi 인계 노트

후속 박제 (Dev 영역 외, Edi 또는 Master 확인 후):
- decision_ledger 신규 D 박제: "weight 필드 폐기 — 사용처 0, derived 합성 가중치는 `composition.inputs[].weight`로 별도 SOT 유지. core/extended는 `inputPriority`, lower-better는 `polarity`로 SOT 보존."
- PD-062 → resolved-cancelled (필드 폐기로 SOT 부재 자체 무의미)
- PD-063(role_memory.metrics[] 데이터 경로 복원)은 별개 토픽 — 본 토픽 OUT (Jobs frame 준수)

---

selfScores: {"rt_cov": 1.00, "gt_pas": 1.00, "hc_rt": 0.00, "spc_drf": 0}

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0
