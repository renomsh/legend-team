---
topic: topic_087
topicTitle: D-060 Phase 2 — consensus 채점 인프라
parentTopicId: topic_083
session: session_081
role: arki
rev: 1
date: 2026-04-23
executionPlanMode: conditional
stage: structural-analysis-only
---

# Arki — consensus 채점 인프라 구조 분석

Ace의 프레이밍(Q1=A, Q2=3지표, 판단일치축/학습축 2축 동시 겨냥)을 받아 구조만 분석합니다. 실행계획(Phase/게이트/롤백)은 종합검토 후 재호출 시 작성하겠습니다.

Rich Hickey 관점으로 먼저 한 문장. **"지금 짓는 것은 채점기가 아니라 `consensus_log`라는 새 append-only 원천 하나와, 그것을 metrics_registry와 growth_metrics로 흘려보내는 파이프 두 개"** 입니다. 채점 로직은 라이터 하나짜리 스크립트면 충분하고, 구조적 난이도는 전부 "어디에 붙일지"에 있습니다.

---

## 1. 구조 진단 — 3지표 각각의 채점 아키텍처

세 지표는 **동일한 consensus 엔진 계약(contract)** 을 따르되 입력 소스와 채점 단위가 다릅니다. 공통화가 가능한 부분과 불가능한 부분을 먼저 분리해야 drift를 막을 수 있습니다.

### 1.1 `ace.orchestrationHitRate`
- **채점 단위**: 의사결정(Decision) 1건 → scoreId 1건
- **입력 소스**: `decision_ledger.json`의 각 D-xxx 항목 + 해당 세션의 `session_index.turns[]` (Ace가 호출한 역할 시퀀스)
- **target**: "Ace가 호출한 역할 구성/순서가 토픽 해결에 적중했는가"
- **raters**: arki, fin, riki (2/3 합의)
- **scoringLag**: 3세션 (registry 기존값 유지)
- **anchor 후보**: 해당 세션의 Master 개입 횟수(token_log.masterTurns) — 외부 앵커 1개 (D-059 cross-check 의무 충족)

### 1.2 `riki.riskF1`
- **채점 단위**: 리스크 엔트리(`evidence_index.json`의 type=risk) 1건 → scoreId 1건
- **입력 소스**: `evidence_index.json` + 사후 증거(`post_hoc_incidents` — **새 파일 필요**) 또는 차후 세션들의 status 변화
- **target**: "이 리스크가 실제로 실현됐는가 + 누락 리스크는 없었는가" (recall + precision)
- **raters**: ace, arki (2/2 합의 또는 불일치 기록)
- **scoringLag**: 3세션
- **anchor 후보**: evidence_index 내 status 전이(open→resolved-realized vs open→resolved-unrealized)

### 1.3 `fin.costForecastAccuracy`
- **채점 단위**: Fin 비용 예측 발언 1건 → scoreId 1건
- **입력 소스**: Fin 발언의 예측값(**새 스키마 필드 `finForecast` 필요**) + 실측(token_log, build 로그, 후속 세션 실제 비용)
- **target**: "Fin 예측치가 실측과 얼마나 근접한가" (이건 수치 비교이지 의견 합의가 아님)
- **scorer mode**: ★ **여기서 중요** — 이건 엄밀히 말하면 `automatic`이지 `consensus`가 아닙니다. 실측이 결정론적이면 합의할 필요가 없습니다. 다만 "예측 대상이 무엇이었는지"를 해석하는 단계에서 불일치가 날 수 있어, **rater 1명(ace)이 예측 해석 검수** 하는 `single-with-auto-score` 혼합형이 적합합니다.
- **scoringLag**: 0 (token_log는 실시간) 또는 1 (후속 세션 비용 포함 시)

### 진단 결과
- **ace/riki는 진짜 consensus**, **fin은 single-rater + 자동계산**. 세 지표를 "consensus 엔진 하나"로 뭉뚱그리면 fin이 오염됩니다 (LL-001 재발).
- 해결: consensus_log 스키마에 `scoringMode: "consensus" | "single" | "auto-with-review"` 필드를 두고, raters 배열 크기와 합의 로직이 모드별로 달라지도록 설계합니다. 하나의 로그, 다른 채점 엔진.

---

## 2. 통합 지점 결정 — consensus_log 위치 + registry 확장안

### 옵션 검토 (3개)

| 옵션 | 구조 | 장 | 단 |
|---|---|---|---|
| **A. 완전 분리** | `memory/shared/consensus_log.jsonl` 단독 | 채점 로직·리뷰 도구 독립. append-only 깔끔 | **LL-001 재발**: registry와 drift. metricId 변경·status 변경 시 consensus_log는 낡은 id로 남음 |
| **B. registry 내장** | metrics_registry.json 내 각 metric에 `scores: [...]` 배열 append | drift 0, 단일 원천 | registry 파일이 기하급수적으로 커짐. diff 추적 불가. read-heavy 로딩 느려짐 |
| **C. 하이브리드 (권고)** | consensus_log는 분리 파일이되, **각 entry가 registryVersion + metricId를 hard-reference** 하고, `validate-schema-lifecycle.ts`가 drift 검증 | 파일 분리 유지 + drift 감지 자동화 | 검증 스크립트 필수 — 없으면 옵션 A로 퇴행 |

### 권고: **옵션 C (하이브리드)**

LL-001이 경고하는 건 "분리 그 자체"가 아니라 "정합성 검증 장치 없는 분리"입니다. consensus_log를 분리하되 registry drift 감지 의무를 스크립트에 강제하면 분리의 이점을 유지하면서 리스크만 제거 가능합니다.

### consensus_log.jsonl 스키마 (권고안)

```jsonc
// 1 line = 1 score event (append-only, JSONL)
{
  "scoreId": "SC-0001",              // 전역 증가
  "metricId": "signature.ace.orchestrationHitRate",
  "registryVersion": "v2",           // 채점 시점 registry 버전 (hard-reference)
  "target": {                        // 채점 대상 참조 (핵심)
    "type": "decision" | "risk" | "forecast",
    "refId": "D-061",                // decision_ledger.id 또는 evidence_index.id 등
    "sessionId": "session_081",
    "capturedAt": "2026-04-23T..."
  },
  "scoringMode": "consensus" | "single" | "auto-with-review",
  "scorers": [                       // 채점자 배열. consensus=2+, single=1, auto-with-review=1검수
    { "rater": "arki", "score": 0.8, "rubricVersion": "v1", "note": "..." },
    { "rater": "fin",  "score": 0.6, "rubricVersion": "v1", "note": "..." },
    { "rater": "riki", "score": 0.7, "rubricVersion": "v1", "note": "..." }
  ],
  "consensus": {                     // 합의 결과
    "value": 0.7,                    // 집계값 (median/mean/auto)
    "method": "median" | "mean" | "auto" | "single",
    "agreement": 0.85,               // ★ 판단일치축 raw — 채점자 간 분산의 역
    "disagreementFlag": false        // threshold 초과 시 true
  },
  "anchor": {                        // ★ D-059 외부 앵커 의무
    "type": "token_log.masterTurns" | "evidence.statusTransition" | "token_log.cost",
    "value": 3,
    "crosscheckResult": "aligned" | "divergent" | "n/a"
  },
  "computedAtSession": "session_084", // lag 반영된 실제 채점 세션
  "phase": "판단일치축-v1"             // ★ 미래 호환 예약 (판단일치축 정교화 시 버전 분기)
}
```

### metrics_registry v2 확장 (최소 변경)

기존 registry에 필드 **3개만** 추가:

```jsonc
{
  "id": "signature.ace.orchestrationHitRate",
  "scorer": {
    "mode": "consensus",
    "raters": ["arki", "fin", "riki"],
    "consensusMethod": "median",      // ★ 신규
    "disagreementThreshold": 0.3,     // ★ 신규 (agreement < 1-이면 flag)
    "anchorSource": "token_log.masterTurns"  // ★ 신규 (D-059)
  },
  // 나머지 기존 필드 유지
}
```

registry 자체에 점수를 내장하지 않으므로 파일 크기는 늘지 않습니다. 채점 정책(method·threshold·anchor)만 선언합니다.

---

## 3. 의존 그래프 — 데이터 흐름 + 훅 체인 삽입 위치

### 데이터 흐름 (single direction)

```
[Session 중 발언]
   │
   ├─ decision_ledger.json ──┐
   ├─ evidence_index.json ───┤── 채점 대상 (target 후보)
   └─ Fin 예측 발언(+finForecast 필드) ─┘
                              │
                              ▼
                    [채점 트리거 — 아래 3번 항목]
                              │
                              ▼
                   scripts/score-consensus.ts (신규)
                              │
                              │  raters 입력 수집 (자동 계산 or role subagent call)
                              │  consensus 집계 + anchor crosscheck
                              ▼
                   memory/shared/consensus_log.jsonl (append-only)
                              │
                              ▼
              scripts/compute-growth.ts (기존 확장)
                │  - consensus 모드 metric은 consensus_log에서 읽음
                │  - window 내 score 집계 → datapoint 생성
                ▼
              memory/derived/growth_metrics.json
                              │
                              ▼
              scripts/compute-dashboard.ts (기존)
                              │
                              ▼
              memory/derived/dashboard_data.json
                              │
                              ▼
                      app/ viewer (UI KPI)
```

### 훅 체인 삽입 위치 (auto-push.js 내부)

현재 순서:
1. `session-end-tokens.js`
2. `session-end-finalize.js`
3. `compute-dashboard.ts`
4. `build.js`

**권고 삽입 위치**: 2번과 3번 사이에 `score-consensus.ts`, 그 다음 기존 `compute-growth.ts`(이미 compute-dashboard 앞에 있거나 그 안에서 호출됨)가 consensus_log를 읽어 집계.

근거:
- `session-end-finalize`가 turns·grade·plannedSequence를 session_index로 전파한 **직후** 채점해야 target 정보가 완전함
- `compute-dashboard` **이전**에 끝나야 대시보드가 최신 점수를 반영
- `build.js`는 consensus 데이터를 읽기만 하므로 순서 영향 없음

### 채점 트리거 — 3 옵션 비교

| 트리거 | 장 | 단 | 권고 |
|---|---|---|---|
| **세션 종료 훅 (auto)** | 누락 없음. 현재 hook chain과 정합 | 채점자(역할)가 자동 호출돼야 함 — rater subagent dispatch 비용 | ★ 1차 채권자 |
| **수동 `/score` 명령** | rater가 Master/Ace 판단 하에만 실행 | 누락 빈발 → metric 희박화 | 백업용 |
| **주기 배치 (N세션마다)** | 비용 평탄화 | lag 처리 복잡, window 경계 잡기 어려움 | 보류 |

**권고**: 세션 종료 훅 자동 채점을 기본으로 하되, **auto-with-review 모드인 fin은 훅에서 자동 계산, ace/riki는 훅에서 채점 요청만 큐잉**(pendingScore queue)하고 다음 세션 시작 시 rater 서브에이전트가 비동기 처리. scoringLag=3과 자연스럽게 맞물립니다.

---

## 4. 판단일치축 미래 호환 — 스키마 여유 확보

Master 주문: "미래에 판단일치축 정교화 필요, 지금 호환 스키마 여유 남길 것."

현재 단계에서 판단일치축은 `consensus.agreement` 하나의 스칼라로 충분합니다. 하지만 정교화 시 필요해질 필드를 **지금 예약** 해 두면 나중에 스키마 마이그레이션을 피할 수 있습니다.

### 예약 필드 (consensus_log entry 내)

```jsonc
"judgmentAlignment": {              // ★ 판단일치축 전용 블록 (v1은 agreement만 사용)
  "version": "v1",                  // 향후 v2로 증가 시 필드 확장
  "agreement": 0.85,                // 현재 사용 (1 - 분산 정규화)
  "dimensions": null,               // 예약: 차원별 분해 (예: riskType·costSensitivity 등)
  "recurrentDisagreementWith": null,// 예약: "fin-arki 간 반복 불일치" 등 롱컨텍스트 패턴
  "masterOverrideDelta": null       // 예약: Master가 나중에 뒤집은 건의 채점자 분포
}
```

**경계 조건**: `judgmentAlignment.version`이 증가하면 `compute-growth.ts`의 판단일치 집계 함수도 해당 버전 분기 처리 필요. 지금은 v1 한 가지만 처리하면 됩니다.

### 판단일치축 raw data 자동 축적 동선

1. score-consensus.ts가 consensus_log 작성 시 `agreement` 자동 계산 → 축적됨
2. compute-growth.ts에 신규 metric 1개 `common.judgmentAlignment.agreementRate` 추가(draft 상태) — window 내 평균 agreement
3. 데이터가 충분히 쌓이면(≥50 scores) status=active로 전환
4. 이후 판단일치축 정교화 토픽에서 `dimensions`·`recurrentDisagreementWith` 등 예약 필드 활성화

**핵심**: raw는 지금부터 축적되지만, 지표로 승격은 이연(LL-006 방식 — 배제가 아닌 단계화).

---

## 5. UI KPI 승격 경로

Master 주문: "산출 지표가 대시보드 메인 KPI 후보로 바로 쓰일 형태여야 함."

### 데이터 흐름 (이미 2번 구조로 대부분 확보됨)

```
consensus_log.jsonl
    │ (metric별 groupby, window 집계)
    ▼
growth_metrics.json
    │ (metric별 최신 datapoint + window trend)
    ▼
dashboard_data.json
    │ ★ 여기서 메인 KPI로 승격되려면 별도 블록 필요
    ▼
app/ viewer
```

### dashboard_data.json 확장안

기존 dashboard_data.json에 **`kpiSummary` 최상위 블록** 추가 (신규):

```jsonc
"kpiSummary": {
  "version": "v1",
  "computedAtSession": "session_084",
  "mainKPIs": [                     // UI 메인 카드 후보. 순서 = 표시 순서
    {
      "metricId": "signature.ace.orchestrationHitRate",
      "label": "Ace 오케스트레이션 적중률",
      "latestValue": 0.72,
      "window": 20,
      "trend": "+0.08",             // 직전 window 대비
      "sampleSize": 18,              // window 내 실제 채점 수 (희박 경고용)
      "confidence": "sufficient" | "sparse" | "insufficient",
      "agreement": 0.81,            // ★ 판단일치축 동시 노출
      "anchorAligned": true         // D-059 cross-check 통과 여부
    },
    // riki.riskF1, fin.costForecastAccuracy 동일 구조
  ]
}
```

**핵심 설계 결정**: `mainKPIs` 배열은 `metrics_registry`의 `uiPromotion` 플래그를 보고 compute-dashboard가 자동 생성합니다. 즉 UI 메인 KPI 후보 선정을 **registry에서 선언**하고 UI는 읽기만 하도록. 나중에 KPI 교체 시 registry 한 곳만 수정.

### registry 4번째 신규 필드

```jsonc
{
  "id": "signature.ace.orchestrationHitRate",
  "uiPromotion": {                  // ★ 신규
    "mainKPI": true,                 // 메인 카드 노출 여부
    "displayOrder": 1,
    "label": "Ace 오케스트레이션 적중률",
    "minSampleSize": 10              // 이 수 미만이면 "데이터 축적 중" 표시
  }
}
```

UI 토픽에서는 이 kpiSummary 블록을 그대로 소비하면 됩니다. 뷰어 쪽 데이터 가공 로직 최소화.

---

## 6. 스키마 드리프트 · 검증 정합

### 기존 검증 스크립트와의 충돌 점검

| 스크립트 | 영향 | 필요 조치 |
|---|---|---|
| `validate-schema-lifecycle.ts` | registry 신규 필드 3+1종 인식 필요 | consensusMethod/disagreementThreshold/anchorSource/uiPromotion 허용 스키마 추가 |
| `validate-session-turns.ts` | 영향 없음 (turns 구조 변경 없음) | — |
| `validate-topic-closure.ts` | 영향 없음 | — |
| `validate-output.ts` (리포트 frontmatter) | 영향 없음 | — |

### 신규 검증 스크립트 (권고)

**`validate-consensus-log.ts`** — JSONL 무결성 + registry drift 감지:
1. 각 entry의 `metricId`가 registry에 존재 + status!=deprecated 인지
2. `registryVersion`이 현재 registry와 일치 (불일치 시 legacy 표시 OK, 단 경고)
3. `scorers[].rater`가 registry `scorer.raters`에 포함되는지
4. `scoringMode`와 registry `scorer.mode` 일치
5. `anchor.type`이 registry `scorer.anchorSource`와 일치

**`compute-growth.ts` 내부 변경**: consensus 모드 metric 처리 시 `loadConsensusLog()` 추가 — 현재는 mode=automatic만 구현됨. 기존 scoreMetricForWindow의 switch case에서 consensus/single 분기 추가.

### drift 방지 원칙

- consensus_log는 **append-only** — 과거 score 수정 금지 (provenance 유지, LL-006 정신)
- registry 필드 삭제 시 consensus_log 기존 entry는 그대로 두되 validate 스크립트가 "legacy-ref" 플래그만 표시
- registryVersion이 증가해도 과거 score는 재계산 금지 (기존 compute-growth.ts의 datapoint append-only 원칙과 동일)

---

## 7. 구조적 미결 쟁점 — Ace 종합검토로 넘길 것

다음은 제가 구조 단계에서 결론내릴 수 없어 Ace의 판단·Master 결정이 필요한 쟁점입니다.

### Q1. rater 서브에이전트 자동 호출의 비용·일관성 트레이드오프
- 훅 체인에서 ace/riki/arki 3명을 subagent로 매 세션마다 호출하면 Opus 호출 비용 + 대기 시간 증가
- 대안: 채점은 훅에서 "큐잉"만 하고, 다음 세션 ace-framing 초반에 일괄 처리 (scoringLag=3과 자연스럽게 맞물림)
- **Fin 감사 필요**: 세션당 추가 비용 영향

### Q2. `post_hoc_incidents.json` 신규 파일 도입 여부
- riki.riskF1에서 사후 실현 리스크를 기록할 공간 필요
- 옵션 A: evidence_index.json 내 status 전이(`resolved-realized`)로만 표현 — 파일 최소화
- 옵션 B: 별도 `post_hoc_incidents.json` — 리스크가 아닌 사건도 기록 가능
- 권고 기울기: A (짓지 않음 우선). 하지만 Riki 의견 필요.

### Q3. fin 지표 scorer 모드 재정의
- registry는 현재 `automatic`이지만 실제로는 `auto-with-review`(ace 검수)가 정확
- registry enum에 `auto-with-review` 추가 필요 — 기존 스키마 타입 확장 → Dev 합의 필요 (역할 메모리 nonNegotiables #5)

### Q4. 판단일치축을 지표로 즉시 승격할지 이연할지
- raw agreement는 consensus_log 기록 시점부터 자동 축적됨
- 하지만 metric으로 compute-growth가 집계하기 시작할 시점은 별개 결정
- 권고: 이번 토픽은 raw 축적까지만, 집계 metric 추가는 판단일치축 정교화 토픽에서. (Master의 "지금 호환 여유" 주문과 정합)

### Q5. consensus_log 파일 크기 관리
- JSONL append-only → 수 년 축적 시 100MB+ 가능
- 로테이션 정책 미정 — 연도별 파일 분리(`consensus_log.2026.jsonl`)? 수명 만료 archive?
- 당장 결정 불필요하나 **"언제 트리거될 문제인가"를 evidence_index에 open 기록** 권고. 지금 짓지 않음.

---

## 요약 (Ace·Master용 3줄)

1. **consensus_log.jsonl 분리 파일 + registry hard-reference + validate 스크립트** 하이브리드가 최적. LL-001 리스크는 검증 자동화로 상쇄.
2. **판단일치축 raw(agreement 필드)는 지금부터 자동 축적, 지표 승격은 이연**. 예약 블록 `judgmentAlignment`로 미래 호환 확보.
3. **UI 메인 KPI 승격은 registry `uiPromotion` 플래그 + dashboard_data.kpiSummary 블록**으로 1곳 선언·1곳 소비. 다음 UI 토픽이 읽기만 하면 됨.

실행계획(Phase 분해·게이트·롤백)은 종합검토 이후 executionPlanMode=plan으로 재호출 시 작성하겠습니다. 금지어 없이 구조적 선후만으로 짜겠습니다.

ARKI_STRUCTURAL_ANALYSIS_DONE
