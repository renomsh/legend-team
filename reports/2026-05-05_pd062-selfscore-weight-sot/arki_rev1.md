---
role: arki
turnId: 0
sessionId: session_193
topicId: topic_166
grade: B
invocationMode: subagent
---

ARKI_WRITE_DONE: reports/2026-05-05_pd062-selfscore-weight-sot/arki_rev1.md

# Arki — PD-062 Self-Score weight 필드 SOT 정합 (구조 분석)

Arki입니다. 짓지 않음 옵션 포함 4안으로 비교(요청 3안 + No-op)했습니다. 자기감사 1라운드 포함.

---

## 1. 현황 실측 (다축 교차)

### 1-1. registry 측 (`memory/growth/metrics_registry.json`)
- 스키마 `metrics-registry.schema.json` 확인 결과 **`weight` 필드는 metric 본체에 존재하지 않음**.
- `weight`는 **derived 메트릭의 `composition.inputs[]` 내부에서만** 정의됨 (예: `session.health_score`의 inputs[]에 metricId+weight pair). 즉 **derived 합성 가중치만 SOT 보유**, base metric 자체의 가중치는 SOT 없음.
- 모든 base metric은 `raterWeights: { [role]: 1 }` 단일 값 — 이건 rater 신뢰도 가중(상호채점용)이지 "core/extended" 가중치가 아님. (rater weight ≠ core/extended weight, 의미 충돌)

### 1-2. policy 측 (`memory/roles/policies/role-*.md`)
- 8개 role policy(jobs/ace/arki/dev/edi/fin/nova/riki/vera) 모두 동일 표 헤더: `| shortKey | scale | weight | 설명 |`.
- weight 표기 형식: `0.50 (core)` / `0.20 (extended)` / `0.10 (extended)` 자유 텍스트. **파서 없음 — 사람 눈으로만 읽힘**.
- 합 검증 없음(arki 0.50+0.20+0.20+0.10=1.00 OK이지만 자동 검증 0건).

### 1-3. 컴파일·렌더 경로
- `compile-metrics-registry.ts` (v1.1) 확인 — REQUIRED 22필드에 `weight` 없음. role_memory에서 `metrics[]` ingest, fillStub으로 누락 채움. **weight는 ingest도 fill도 안 함**.
- `compute-dashboard.ts` 전체 grep — `weight` 0건 매치. **대시보드는 weight를 전혀 읽지 않음**.
- `compute-signature-metrics.ts` — `weight` 1건(주석 한 줄 "weighted-mean derived"). composite 합성용만, 표 가중치 미사용.
- 결론: **weight는 정책 문서에만 존재하는 죽은 필드**. registry·dashboard·hook 어디서도 읽지 않음.

### 1-4. role_memory 측 (D-092 SOT)
- `arki_memory.json` 본체 확인 — `metrics[]` 배열 자체가 없음 (PD-063 high가 가리키는 그 단절: `signatureMetrics 0건 → growth registry 데이터 경로 단절`).
- 즉 **D-092가 선언한 "{role}_memory.json[].metrics"는 현재 빈 상태**, registry는 historical stub과 derived/composite로만 채워지는 중. weight 논의는 이 데이터 경로가 살아난 이후에야 의미 있음.

### 1-5. drift 사고 history (D-158)
- session_191 D-158 박제 노트: `"weight 필드 SOT 부재 → PD-062로 분리"` — 정확히 본 토픽.
- 동시 발견: `signatureMetrics 0건 → PD-063 (high)`. **PD-062와 PD-063은 동일 데이터 경로 단절의 두 증상**.
- session_191 drift 정정 5건은 *표 형식 통일* 정정이지 weight 값 정정 아님(D-158 본문: "byte 절감은 부산물, 본질은 표 일관성·의미 보존·정의 가시성").

### 1-6. 다축 종합
| 축 | 상태 |
|---|---|
| registry 스키마 | weight 없음 (derived inputs[]만 있음) |
| policy 표 | weight 있음, 자유 텍스트, 파서 없음 |
| dashboard 렌더 | weight 0건 참조 |
| compile script | weight 0건 처리 |
| role_memory metrics[] | 비어 있음 (PD-063 본체) |
| 사고 사례 | weight 값 drift 정정은 0건 (표 형식만) |

**핵심 진단**: weight는 **"정의되었으나 어디서도 사용 안 되는 dead 필드"**. SOT 부재가 risk가 아니라 *어차피 안 쓰이는 메타데이터의 SOT 논쟁*이라는 것이 진짜 구조다.

---

## 2. 4안 구조 비교 (3안 + No-op 추가)

| | (A) registry weight 컬럼 + policy mirror | (B) drift validator만 | (C) A+B | (D) No-op: weight 폐기 또는 보류 |
|---|---|---|---|---|
| **변경 범위** | 스키마 1·compile 1·role_memory N·policy 8 (~+50필드) | validator 1 + 표 파서 1 (~+150줄) | A+B 합산 | 0~policy 8 (weight 컬럼 삭제만) |
| **데이터 경로 의존성** | role_memory.metrics[] 살아있어야 의미 (PD-063 선결) | 동일 — 없는 데이터 비교는 무의미 | 동일 | 의존 없음 |
| **silent failure 가능성** | 낮음(스키마 강제) | 중(파서 정규식 깨지면 false negative) | 낮음 | 0 (필드 자체 없음) |
| **현재 사용처 충족** | 0(아무도 안 읽음) | 0 | 0 | 해당 없음 |
| **PD-062 종결 효과** | 종결 | 종결(우회) | 종결 | 종결(폐기 명문화) |
| **ROI** | 비용 중·가치 0(아무도 안 읽음) | 비용 저·가치 0 | 비용 고·가치 0 | 비용 0·가치(군더더기 제거) |
| **PD-063과 정합** | PD-063 선결 후에만 의미 | PD-063 선결 후에만 의미 | 동일 | PD-063과 무관·독립 종결 |
| **Hickey 평가** | 짓지 않아도 됨 | 짓지 않아도 됨 | 더더욱 짓지 않아도 됨 | 단순화·짓지 않음 |

**3안만 비교했으면 D-158을 추격하는 함정에 빠짐**. weight를 어디서 SOT로 둘지 결정하기 전에 *weight를 쓸 곳이 있는가*가 선행 질문. 답: **없다**.

### 자기감사 — 1라운드 (4축)
- **structuration**: weight를 도입하는 모든 안은 D-092 SOT(metrics)와 policy SOT(weight) 분리를 만드는 것 — 단일 출처 원칙 위반. **결함 1**.
- **hardcoding**: A안은 policy를 "mirror"로 강등하는데, mirror 동기화 스크립트 부재 시 수동 sync = 또 다른 drift 원천. **결함 2**.
- **efficiency**: B안 validator는 *어차피 0회 읽히는 필드*를 검증하는 측정 위한 측정. ROI 0. (메모리 `feedback_simple_growth_not_measurement` 정합) **결함 3**.
- **extensibility**: weight가 미래에 dashboard 가중평균 등에 쓰일 가능성? `session.health_score` 같은 derived는 이미 `composition.inputs[].weight`로 처리 중 — 별도 경로 불필요. **No issue at this dimension** (이미 해결됨).

자기감사 결론: **3안 모두 측정 위한 측정/짓지 않아도 될 구조**. D안(폐기)이 구조적으로 정합.

---

## 3. 권고 + mitigation

### 권고: **(D) weight 컬럼 폐기**

근거 3가지:
1. **사용처 0**: 8 role policy에 표기된 weight 값 중 어떤 코드도 읽지 않음. dashboard·compile·hook 모두 무관. dead field.
2. **PD-062의 본질 재정의**: "SOT 부재"가 문제가 아니라 "사용 없는 필드의 SOT 논쟁"이 문제. 사용처 없으면 SOT 논쟁 자체가 불필요.
3. **D-092·feedback memory 정합**: "측정 위한 측정 금지"(`feedback_simple_growth_not_measurement`), "단일 SOT"(D-092). weight를 살리는 모든 안은 이 두 원칙을 우회.

### 구현 (Dev 인계용 — 코드 변경 0건은 본 토픽에서, 아래는 spec):
- 8 policy 파일에서 표 헤더 `weight` 컬럼 + 각 행 `0.50 (core)` 토큰 삭제
- 헤더: `| shortKey | scale | 설명 |` 3컬럼
- D-159 또는 후속 D 박제: "weight 필드 폐기 — 사용처 0, derived 합성 가중치는 `composition.inputs[].weight`로 별도 SOT 유지"
- PD-062 → resolved-cancelled (필드 폐기로 SOT 부재 자체가 무의미해짐)
- PD-063(role_memory.metrics[] 데이터 경로 복원, high)은 **별개 토픽으로 독립 진행** — weight 폐기와 의존 없음

### Risk + Fallback (feedback_arki_risk_requires_mitigation 준수)

**Risk R1**: Master가 표 일관성을 위해 weight 컬럼 보존을 원할 수 있음 (D-158 본질이 "표 일관성·의미 보존").
- **Mitigation**: 폐기 시 8 policy 동시 변경으로 일관성 유지(부분 폐기 금지).
- **Fallback**: Master가 보존 원하면 (B) drift validator 최소안으로 전환. 단 ROI 0 명시. validator는 표 파싱 정규식 1개 + 합 1.0 ± 0.01 검증만(spec 5줄).

**Risk R2**: 미래에 dashboard core/extended 분리 렌더가 필요해지면 weight가 필요해짐.
- **Mitigation**: `inputPriority: "core" | "extended"` 필드가 이미 registry에 존재하고 모든 metric에 채워져 있음(`extended` 다수, `core` 일부 — 확인됨). dashboard가 core/extended 구분 렌더하려면 이 필드를 읽으면 됨, weight 불필요.
- **Fallback**: 그래도 가중평균이 필요해지는 시점에 `composition.inputs[]` 패턴(이미 schema에 존재)으로 derived 메트릭 추가. base metric에 weight 박는 패턴 자체가 불필요.

**Risk R3**: weight 폐기 후 Riki가 "정보 손실" 지적 가능.
- **Mitigation**: weight는 구현 코드 0줄과 연결된 정보 — 손실되는 정보는 이미 dead. 손실 0.
- **Fallback**: 폐기 D 박제 본문에 "core/extended 분류는 `inputPriority` 필드에 보존됨"을 명시.

### spec 동결 선언
본 분석은 4안 비교까지로 spec lock. Dev 인계 시 변경 금지(D안 단일 권고로 선언).

---

selfScores: {"str_fd": 3, "sa_rnd": 1, "aud_rcl": 0.80}

[ROLE:arki]
# self-scores
aud_rcl: 0.80
str_fd: 3
spc_lck: Y
sa_rnd: 1
