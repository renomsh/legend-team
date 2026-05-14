---
role: jobs
turnId: 2
phase: framing
sessionId: session_246
topicId: topic_206
date: 2026-05-13
invocationMode: subagent
---

# Jobs — PD-075 Reframe: Zero 운용 모드 트레이드오프

Jobs입니다. Master 정정으로 본 토픽 본질이 바뀌었습니다. 박제 방식 다툼(a/b/c)이 아니라 **운용 모드별 정제 품질 비교**가 본질입니다. 원점에서 다시 프레이밍드립니다.

## 0. 토픽 생명주기 판정

- **topicType**: `standalone` (D-127·D-146 박제 결정의 운용 모드 평가 — framing → 후속 결정 박제 필요 없을 수 있음. 결과가 박제 가치 있으면 D-NNN 후보).
- **parentTopicId**: 직접적 framing 부모 없음. PD-075 → topic_206 직접 매핑.

## 1. Why (왜 지금 이 결정인가)

**한 줄**: 외부 skill 흡수의 정당성 명분("물리 파일 부재")이 사실관계로 깨졌으므로, 흡수 결정 자체를 *결과 품질* 기준으로 재검증해야 합니다. [T3/A1/O5]

- 회피 가능성: 가능. "D-127 명분 문구만 정정"으로 종결 가능 (Arki/Riki 옵션 b 경로). 단, 회피 시 **품질 검증 없이 결정 유지 = D-185 self-deception 위험**. session PD-80 사고 직후 D-185 강화한 맥락에서 self-justification 누적은 시스템 누적 부채.
- 지금이어야 하는 이유: 외부 skill이 실재로 노출(시스템 reminder)된 시점이 PD-075 등록 시점. 이전에는 비교 자체가 불가능했음. 회피하면 다음 회피 트리거(외부 skill 신규 패턴 inbound) 때 재발.

## 2. What (결정의 결과물)

**한 줄**: tech-debt·security-review·simplify **3 영역별로 (영역, 운용모드) 매핑 1개**. [T2/A1/O3]

- 단일 모드 강제 결과물 아닙니다. 영역별 차등 가능.
- 결과물 후보 형태 (예시 — 실제 매핑은 후속 역할 영역):
  - `{tech-debt: M1, security-review: M2 부분 허용, simplify: M1}` 같은 3-tuple.
- 박제 형태: dispatch_config.json `rules.zero` 필드 갱신 + role-zero.md spec 정정 + (필요 시) 신규 D-NNN.

## 3. Decision Axes (판단 축)

| 축 | 양극단 | trade-off 한 줄 |
|---|---|---|
| **A1. 정제 품질 우위 주체** | Zero 내재화 ↔ 외부 skill | 내재화 = legend-team 컨텍스트 정확, 외부 = 범용 best-practice 풍부 |
| **A2. 외부 패턴 inbound 속도** | M1 차단 ↔ M3 즉시 흡수 | 차단 = stale 위험, 즉시 = 검증 없이 노이즈 흡수 위험 |
| **A3. 결정 권한 위치** | Zero 자율(M2) ↔ Hook 강제(M3) | 자율 = 케이스별 최적, 강제 = 일관성·가시성·실패 추적 |
| **A4. D2(도구 설명 거짓) 신뢰 경계** | 외부 skill description 신뢰 0 ↔ 행위 검증 후 신뢰 | 신뢰 0 = M1만 안전, 행위 검증 = M2/M3 가능하나 검증 비용 |
| **A5. 운영 가시성** | Zero 내부 결정 (관찰 불가) ↔ Hook 자동 (로그 추적) | 자율 = silent drift 위험, 자동 = 과잉 호출 risk |

**결정의 본질 좁힘 (Jobs 단일 frame)**: A1 + A4가 핵심. A2/A3/A5는 종속 축.

**가장 중요한 질문 1개**: *"외부 skill의 품질 우위가 영역별로 다른가? (= 영역별 차등 모드의 정당성)"*

## 4. Scope In / Out

### IN
- Zero가 직접 다루는 **3 영역 (tech-debt, security-review, simplify)** 한정 운용 모드 평가
- 3 모드 (M1 흡수 / M2 Zero 재량 / M3 Hook 자동)의 정제 품질 비교 *방법론* 정의
- D-127 본문 사실관계 정정 (Riki A1 적출)
- 영역별 차등 매핑 가능성

### OUT (saying no — 핵심)
- **외부 skill 절대 품질 측정 자체** — 본 토픽 결과물 아님. 측정 *방법론*만 정의, 실측은 별도 토픽
- **다른 페르소나(Arki/Fin/Riki/Sage/Ace) 외부 skill 사용 정책** — Zero 영역만
- **외부 skill description 갱신 추적·changelog watch 메커니즘** — Riki R-2 영역, 별도 PD 분리
- **`engineering:code-review` 등 인접 skill 채택** — security-review 영역 우위 가능성은 인식하되, 본 토픽은 운용 모드 결정까지. 채택 자체는 후속
- **Zero on-demand 호출 트리거 자체 변경** — M3 hook 자동은 페르소나 식 변경이라 평가 가능, 단 실제 hook 설계는 후속
- **품질 측정 baseline 수집** — 후속 실행 영역
- **D-127 박제문 amendment vs 신규 D-NNN 형식 결정** — Edi 영역

## 5. Key Assumptions (검증 가능성 별도)

| # | 전제 | 검증 가능성 | 틀리면 |
|---|---|---|---|
| K1 | 정제 품질은 비교 가능한 메트릭이 존재한다 (예: false negative 카운트, drift 사고 1건, 흡수 패턴 누락 수) | 🟡 부분 — 메트릭 정의는 가능하나 baseline 수집 필요 | 본 토픽 무효 — "차이 없음" 판정 자체 불가, 결정은 *비용*으로만 |
| K2 | 외부 skill description은 D2 적용 대상이라 행위 검증 없이는 신뢰 불가 | 🟢 검증 가능 — D-113 D2 본문 인용 [T4/A4/O5] | 무관 (K2 강함 — 전제 안정) |
| K3 | Zero 흡수본은 legend-team 메타-자산 self-exclusion·anchor governance Edi 분담 등을 인식 (외부 skill 미인식) | 🟢 검증 가능 — role-zero.md L25·L37 grep | 흡수 우위 사라짐, M2/M3 우위 |
| K4 | 외부 skill은 legend-team 미인지 best-practice 패턴을 *지속 업데이트*한다 | 🔴 추측 — Anthropic skill release 빈도 미실측 [T1/A1/O1] | M1 stale 위험 사라짐, 흡수 영구 안정 |
| K5 | Zero 호출 빈도는 hook 자동 발동(M3) 비용을 정당화할 만큼 충분 | 🟡 zero_memory.json·session_index에서 호출 카운트 확인 가능 | M3 ROI 음수, M3 제거 |
| K6 | 3 영역(tech-debt/security/simplify)은 외부 skill 품질 우위 분포가 동일 | 🔴 추측 [T1/A1/O1] — Riki R-3가 security-review 영역 우위 가능성 적출 | 단일 모드 결정 부정, 영역별 차등 강제 |

**핵심**: K1·K4·K6이 본 토픽 결정력의 병목. K1이 깨지면 토픽 자체가 "비교 불가 → 비용 기준 결정"으로 축소됩니다.

## 6. 인지편향 적출

| # | 편향 | 적출 대상 | 근거 |
|---|---|---|---|
| B1 | **Status quo bias** | Arki 옵션 (b) "흡수 유지 + 명분 정정" 권고 | 현행 결정(D-127) 결과를 유지하는 *방식*을 우선 탐색. Master 원점 질문 회피 — Arki rev1 자가감사 1차 "No issue" 종료 |
| B2 | **Sunk cost / Anchoring** | D-119 → D-127 흡수 박제에 대한 결정 누적 | "이미 박제했으므로 유지" 압력. PD-075 등록 자체가 anchor 해제 시도 — 정직하게 zero-base 평가 필요 |
| B3 | **Availability heuristic** | Arki rev1 표 "정제 품질 (legend-team 컨텍스트)" 칸이 (a)·(b)에 "내재화 우수"로 단언, (c)에 "별도 가드 필요"로 단언 | 실측 데이터 없이 *접근성 높은* legend-team 컨텍스트 인지 사례만 근거화. K1·K6 미검증 |
| B4 | **Framing effect — false dichotomy** | PD-075 본문이 "흡수 유지 (a/b) vs 위임 (c)" 2지선다로 frame | Master 정정대로 (1) 흡수 only (2) Zero 재량 (3) Hook 자동 3지선다가 본 frame. PD 등록 시점 frame이 좁았음 |
| B5 | **Confirmation bias 위험** | Zero가 자기 정제 영역 자체평가 시 자기 우위 단언 위험 | 본 토픽 후속 진행 시 Zero에게 직접 자기 vs 외부 skill 비교 위임 금지 — Arki/Riki/Master 외부 평가자 필수 |

## 7. Focus — Saying No

**1줄 본질**: 외부 skill을 *대안*으로 인식한 적 없는 결정(D-127)에 **3 운용 모드 frame을 강제 적용**한다.

**Saying No (이번 토픽 안 하는 것)**:
1. 외부 skill 실제 품질 측정 (방법론만)
2. Zero 외 페르소나 외부 skill 정책
3. dispatch_config rules.zero 즉시 변경 (결정 후 별도 phase)
4. 박제 형식 다툼 (Edi 영역)

**단일 액션 1줄**: 후속 역할(Arki·Riki·필요 시 Ace 종합검토)이 **3 영역 × 3 모드 = 9 매트릭스에 K1 메트릭 가설을 채우고**, 매트릭스에서 영역별 최적 모드 1개씩을 도출.

## 8. executionPlanMode

**`conditional`** [T2/A1/O3]

**사유**:
- 본 framing은 구조 평가까지 (Arki·Riki). 결정이 내려지면 실행계획(Phase 분해·검증 게이트·롤백)이 필요한데, 결정 전까지는 실행계획 작성 부적합.
- 만약 결정이 "M1 유지 + 명분 정정"이면 실행은 spec 정정 + D-127 amendment 2~3 step (plan 불필요).
- 만약 결정이 "영역별 차등(예: security-review는 M2 도입)"이면 dispatch_config 갱신·Zero spec L28/L49 정정·Zero 호출 시 외부 skill 사용 분기 로직·실패 추적 메커니즘까지 plan 필요.
- 따라서 Ace 종합검토 후 *결정 분기 시점*에 plan 모드 재호출 (D-130 conditional 정의 정합).

## 9. 다음 주자 권고

| # | 역할 | 임무 |
|---|---|---|
| 1 | **Arki** | 3 영역 × 3 모드 9 매트릭스 구조 분석. K1 메트릭 가설 (정제 품질 측정 후보 메트릭) 제안. status quo bias 회피하고 zero-base로. |
| 2 | **Riki** | Arki 매트릭스 적대적 감사. K4·K6 추측 단언 적출. B3 (availability) 차단. 실측 데이터 부재 단언 강제. |
| 3 | (선택) **Fin** | M3 hook 자동 발동 비용 vs 회피 사고 비용 directional 평가 (실측 baseline 없으면 skip 가능) |
| 4 | **Ace 종합검토** (`/ace-synthesis` 명시 호출 시) | 9 매트릭스에서 영역별 최적 모드 1개씩 권고. K1 검증 가능성 부재 시 "결정 보류 + 베이스라인 수집 토픽 분기" 권고 옵션 보존 |
| 5 | **Master 결정** | conditional → plan 전환 분기. 영역별 모드 매핑 확정. |
| 6 | **Edi** | D-127 사실관계 정정 + (필요 시) 신규 D-NNN 박제 |

**Nexus 인계**: Jobs framing 종료. Arki 재호출 권고.

---

## Self-Score

```
[ROLE:jobs]
# self-scores
focus_sharp: 5
bloat_idx: 2
bias_cnt: 5
no_cnt: 5
```

- `focus_sharp 5`: saying no 글머리표 분리(Y) + out-of-scope 6항 명시(Y).
- `bloat_idx 2`: K1·K4·K6 추측 명시 + executionPlanMode 분기 조건 2건 — 정직한 conditional 표기가 안전장치 2건으로 측정 (감소 노력 측). 최소화 의지.
- `bias_cnt 5`: B1~B5 5건 적출 (capping).
- `no_cnt 5`: OUT 6항이지만 5+ capping.

JOBS_WRITE_DONE: reports/2026-05-13_zero-external-skill-review/jobs_rev1.md
