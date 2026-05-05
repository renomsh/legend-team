---
role: arki
turnId: 0
sessionId: session_193
topicId: topic_166
grade: B
invocationMode: subagent
condensed: true
---

[ROLE:arki]

# Arki — PD-062 weight SOT (압축)

## 실측 (다축)
- registry 스키마: `weight` 필드 metric 본체에 없음. `composition.inputs[]` 내부에만 존재 (derived 합성용). `raterWeights`는 신뢰도 가중 — core/extended 가중치 아님.
- policy 8개(ace/arki/dev/edi/fin/nova/riki/vera): 표 헤더 `| shortKey | scale | weight | 설명 |`, weight 값 자유 텍스트(`0.50 (core)` 등). 파서·합 검증 0건.
- 컴파일·렌더: `compile-metrics-registry.ts` REQUIRED 22필드에 weight 없음, `compute-dashboard.ts` weight 0건, `compute-signature-metrics.ts` 주석 1건만.
- role_memory metrics[] 비어 있음(PD-063 본체 — 데이터 경로 단절).
- D-158 history: PD-062는 "SOT 부재 → 분리"로 박제됐고, drift 정정 5건은 표 형식 통일이지 weight 값 정정 아님.

**진단**: weight = "정의되었으나 어디서도 사용 안 되는 dead 필드". SOT 논쟁 자체가 불필요.

## 4안 비교 (3안 + No-op)
| | A: registry+mirror | B: validator | C: A+B | **D: 폐기** |
|---|---|---|---|---|
| 변경 범위 | 스키마+compile+memory+policy 8 | validator+파서 ~150줄 | A+B | policy 8 weight 컬럼 삭제만 |
| 사용처 충족 | 0 | 0 | 0 | 해당 없음 |
| ROI | 비용 중·가치 0 | 비용 저·가치 0 | 비용 고·가치 0 | 비용 0·가치(군더더기 제거) |
| Hickey | 짓지 않아도 됨 | 짓지 않아도 됨 | 짓지 않아도 됨 | 단순화 |

## 자기감사 (4축)
- structuration: weight 도입 안은 D-092 SOT 분리 → 단일 출처 위반
- hardcoding: A안 mirror 동기화 부재 시 drift 원천
- efficiency: B안 = 0회 읽힘 필드 검증 = 측정 위한 측정
- extensibility: derived 합성은 이미 `composition.inputs[].weight`로 처리됨

## 권고: D안 (폐기)
근거 3가지:
1. 사용처 0 — dead field
2. PD-062 본질 재정의: 사용 없는 필드의 SOT 논쟁 불필요
3. D-092·`feedback_simple_growth_not_measurement` 정합

## Dev 인계 spec
- 8 policy 파일 weight 컬럼 + `0.XX (core/extended)` 토큰 삭제
- 헤더 `| shortKey | scale | 설명 |` 3컬럼
- D 박제: "weight 필드 폐기 — 사용처 0, derived 합성 가중치는 `composition.inputs[].weight`로 별도 SOT 유지"
- PD-062 → resolved-cancelled
- PD-063(role_memory.metrics[] 복원, high)은 별개 토픽

## Risk + Fallback
- **R1 (Master 표 일관성 보존 요구)**: Mit = 8 policy 동시 변경. Fb = (B) validator 5줄.
- **R2 (미래 core/extended 분리 렌더 필요)**: Mit = `inputPriority` 필드 이미 존재. Fb = `composition.inputs[]` 패턴으로 derived 추가.
- **R3 (Riki 정보 손실 지적)**: Mit = dead 필드 = 손실 0. Fb = D 박제 본문에 "core/extended는 `inputPriority`에 보존" 명시.

spec lock — 4안 비교까지로 동결.

[ROLE:arki]
# self-scores
aud_rcl: 0.80
str_fd: 3
spc_lck: Y
sa_rnd: 1
