---
role: dev
turnId: 2
sessionId: session_193
topicId: topic_166
grade: B
invocationMode: subagent
condensed: true
---

[ROLE:dev]

# Dev — PD-062 weight 컬럼 폐기 구현 (압축)

## 사전 재검증
- 대상: `memory/roles/policies/` 12 md 중 weight 컬럼 보유 정확히 8개 (ace/arki/dev/edi/fin/nova/riki/vera). 미보유: _common/jobs/sage/zero (Arki 1-2 일치).
- 형식: 헤더 `| shortKey | scale | weight | 설명 |`, 데이터 `0.XX (core/extended[, lower-better])`.
- 코드 cross-check: scripts/ grep 결과 policy weight 읽는 코드 **0건**. 검출된 weight 참조는 모두 별도 SOT 영역(`composition.inputs[].weight`, `raterWeights`, CSS `font-weight`).
- **Arki "dead field" 단언 검증 PASS**.

## 변경
패턴: 헤더 4컬럼 → 3컬럼, 구분선 `|---|---|---|---|` → `|---|---|---|`, 각 행 weight 컬럼 제거.

| 파일 | 변경 라인 |
|---|---|
| role-ace | 6 |
| role-arki | 6 |
| role-dev | 6 |
| role-edi | 7 (gp_acc deferred/settlementOffset 메타는 설명 컬럼 끝으로 이동) |
| role-fin | 6 |
| role-nova | 5 |
| role-riki | 6 |
| role-vera | 5 |

**총 47라인. scope drift 0**.

## 의미 보존 (R3 mitigation)
- core/extended → registry `inputPriority` 필드에 SOT 보존
- lower-better polarity → `signature-metrics-types.ts polarity` SOT 보존
- edi gp_acc `deferred, settlementOffset=3` → 설명 컬럼 끝 이동
- **정보 손실 0건**.

## 사후 검증 (4-게이트 전부 PASS)
| 게이트 | 결과 |
|---|---|
| 사전 재검증 (Arki cross-check) | PASS |
| 변경 scope (weight만) | PASS (drift 0) |
| `Grep weight memory/roles/policies` | No matches found |
| `compile-metrics-registry.ts` 빌드 | PASS (51 metrics, sourceHash 1f2a9647b2a1e945) |
| 정보 손실 | 0건 |

## Edi 인계
- D 박제: "weight 필드 폐기 — 사용처 0, derived 합성 가중치는 `composition.inputs[].weight`로 별도 SOT 유지. core/extended는 `inputPriority`, lower-better는 `polarity`로 SOT 보존."
- PD-062 → resolved-cancelled
- PD-063 별개 토픽 (본 토픽 OUT)

[ROLE:dev]
# self-scores
rt_cov: 1.00
gt_pas: 1.00
hc_rt: 0.00
spc_drf: 0
