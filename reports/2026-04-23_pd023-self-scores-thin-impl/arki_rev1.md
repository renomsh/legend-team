---
title: "PD-023 Dev 얇은 구현 — Canonical Spec (MUST_NOW)"
specVersion: "1.0"
session: session_082
topic: topic_088
parentTopic: topic_087
date: 2026-04-23
author: arki (12차 자가감사 + Fin/Riki/Ace 통합)
status: locked-for-dev
---

# PD-023 Self-Scores Thin Implementation — Canonical Spec v1.0

**핵심 원칙 (Fin·Master 합의):** 자가채점은 발언의 부산물·꼬리. 본업은 발언 자체. 매 세션 강제 32필드 X.

## 1. Scope (MUST_NOW만)

PD-023이 박는 것 = D-062 학습축 자가평가 MVP 본체. PD-025/026/027로 분할된 SHOULD/NICE/DEFER는 별도 PD.

**박지 않음:** quarantine enforcement, inflation/anchoring/Goodhart detector, retroactive cascade, causal DAG, registry diff viewer, validity matrix, retirement suggestor, axis balance enforcement.

**박음:** 29지표 × 100점 환산 × 3뷰 집계 × 8역할 카드 + Tier 1/2/3 dashboard + forward compatibility 슬롯.

## 2. 데이터 구조

### 2.1 디렉토리

```
memory/shared/
  ├── role_registry.json
  ├── feature_flags.json
  └── topic_index.json (PD-025/026/027 등록)
memory/roles/{role}_memory.json (signatureMetrics + applicableTopicTypes)
memory/growth/
  ├── metrics_registry.json (compiled artifact)
  ├── self_scores.jsonl (append-only raw)
  ├── pending_deferred_scores.json
  ├── _quarantine/ (구조만, enforcement는 PD-025)
  ├── registry_history/v1.0.json
  ├── phase_dod.json
  ├── baseline_policy.json
  ├── g6_evaluation_template.md
  └── rollback_playbook.md
memory/schemas/
  ├── metrics-registry.schema.json
  ├── self-scores.schema.json
  ├── role-registry.schema.json
  └── dashboard-layout.schema.json
scripts/lib/
  ├── metric-normalizer.ts
  ├── aggregation-strategies.ts
  ├── alert-evaluator.ts
  ├── write-atomic.ts
  ├── derived-metric-compute.ts
  └── confidence-interval.ts
scripts/
  ├── compile-metrics-registry.ts
  ├── compute-signature-metrics.ts
  ├── resolve-deferred-scores.ts
  ├── batch-score-helper.ts
  ├── validate-self-scores.ts
  ├── validate-registry-freshness.ts
  └── test-regression.ts
tests/fixtures/
  ├── signature-metrics/{empty,baseline-10,full-30}/
  └── regression/(PD-023 변경 전 스냅샷 5개)
app/
  └── role-signature-card.html (템플릿)
```

### 2.2 TS Types

```ts
export type LifecycleState = "draft" | "shadow" | "candidate" | "active" | "deprecated" | "archived";
export type Axis = "learning" | "quality" | "judgment-consistency" | "execution-transfer";
export type Scope = "role" | "cross-role" | "session";
export type Scale = "0-5" | "Y/N" | "ratio" | "percentile";
export type Polarity = "higher-better" | "lower-better" | "target-value";
export type TopicType = "framing" | "implementation" | "standalone";

export interface RaterSpec {
  type: "self" | "external" | "automated";
  by?: string;                            // "ace", "master", "auto:{scorer-id}"
}

export interface AlertConfig {
  redBelow?: number;
  yellowBelow?: number;
  trendDropPct?: number;
}

export interface DerivedComposition {
  formula: "weighted-mean";               // PD-023은 weighted-mean만
  inputs: { metricId: string; weight: number }[];
  polarityNormalized: boolean;
  nullPolicy: "weight-renormalize" | "propagate-null" | "zero-fill";
}

export interface Metric {
  id: string;
  shortKey: string;
  role: string;
  scope: Scope;
  axis: Axis;
  type?: "base" | "derived";
  scale: Scale;
  polarity: Polarity;
  targetValue?: number;
  tradeoffWith?: string[];
  construct: string;                      // 측정 대상 개념 (필수)
  externalAnchor: string[];               // cross-check 근거 (필수, ≥1)
  validityCheck: "monthly" | "quarterly" | "yearly";
  rater: RaterSpec;
  raterWeights: Record<string, number>;
  timing: "immediate" | "deferred";
  aggregation: string;                    // strategy id
  baselineSessions: number;
  alerts?: AlertConfig;
  causedBy?: string[];
  leadingIndicator?: boolean;
  lifecycleState: LifecycleState;
  deprecatedInVersion?: string;
  supersededBy?: string;
  computedBy?: string;
  composition?: DerivedComposition;
  indicator?: boolean;
  outcomeMetrics?: string[];
  stratifyBy?: "grade" | "mode" | null;
  inputPriority: "core" | "extended";
  defaultStrategy: "previous-session-value" | "explicit-only";
  missingPenalty: "warn" | "silent" | "block";
  applicableTopicTypes: TopicType[];
  participationExpectedTopicTypes: TopicType[];
  defaultUsageCount?: number;             // finalize 자동 카운트
  _reserved?: Record<string, unknown>;
}

export interface ScoreRecord {
  recordId: string;
  sessionId: string;
  topicId: string;
  topicType: TopicType;
  role: string;
  metricId: string;
  raterId: string;
  rawScore: number | string;
  normalizedScore: number;
  registryVersion: string;
  recordedBy: string;
  recordSource: "yaml-block" | "cli" | "auto-scorer" | "manual-edit" | "master-override" | "default-fallback";
  sessionPhase: string;
  confidence?: number;
  ts: string;
  supersedes?: string;
  overrideReason?: string;
  extensions?: Record<string, unknown>;   // forward-compat 슬롯 (PD-025+ 사용)
}

export interface AggregateView {
  metricId: string;
  role: string;
  view: "all" | "recent10" | "recent3";
  mean: number;
  n: number;
  std: number;
  ci95: [number, number];
  stratum?: { grade?: string; mode?: string };
}
```

### 2.3 JSON Schema 정책

- 모든 schema에 `additionalProperties: false` (forward-compat은 `extensions.{moduleId}.*` 네임스페이스 강제)
- E-022: extensions namespace 위반 시 reject
- compile-metrics-registry 내부 Ajv 검증 의무

## 3. 정규화 규칙

| 원 스케일 | 100점 환산 |
|---|---|
| 0~5 | ×20 |
| Y/N | Y=100, N=0 |
| ratio | ×100 |
| percentile | 그대로 |

`scripts/lib/metric-normalizer.ts` 단일 모듈. lower-better polarity는 derived 합산 시 `(100 - score)` 변환.

## 4. 집계 규칙

### 4.1 3뷰 (registry.aggregationViews)

- `all`: 전체 평균
- `recent10`: 최근 10개
- `recent3`: 최근 3개

### 4.2 결정론

정렬: `(sessionId asc, raterId asc, ts asc)`. 동일 복합키 tie는 `ts desc` 최신 우선. 소수점 1자리 반올림.

### 4.3 Null 정책

- nullPolicy default: `exclude-from-mean`
- window 표본 < 3 → 뷰 자체 null ("—" 표시)
- baseline 10세션 전 → CI/percentile null

### 4.4 Strategy

- `all-sessions`
- `invoked-sessions-only` (Nova 등)
- `signal-gated` (Silence Discipline)
- `stratified-by-grade` (default for role-scope metrics)

### 4.5 TopicType 보정

- `participationExpectedTopicTypes` 기반 분모 계산
- implementation 토픽에서 framing 역할 미발언 = 누락 카운트 X

## 5. 자가채점 입력 프로토콜

### 5.1 발언 형식

각 역할 발언 마지막 3~6줄:
```yaml
# self-scores
angle_novelty: 4         # core
productive_rejection: Y  # core
```

- core 1~2개만 의무, extended 자유
- 미입력 → default = 직전 세션 값 (defaultUsageCount 자동 카운트)
- 3연속 default → finalize 경보
- `batch-score-helper.ts session_NNN` 보조 도구 (수동 호출, 자동 trigger 없음)

### 5.2 Ace 외부 채점

`reframe_trigger` 등 external 지표는 Ace 종합검토 turn 종료 시 동일 YAML 블록으로 기록 (raterId="ace").

### 5.3 지연채점

`pending_deferred_scores.json` 대기열. `/open` step 3.7에 `resolve-deferred-scores.ts` dry-run.

## 6. Phase 분해 + DoD + Failure Playbook

| Phase | dispatch | 산출물 | DoD | Failure Playbook |
|---|---|---|---|---|
| **P0a** | single-dev | types/signature-metrics.d.ts | TS 컴파일 통과 + interface 12종 export | 타입 충돌 시 단일 source 재정의 |
| **P0b** | parallel-subagents (5) | lib 5종 + Schema 4종 + role_registry + phase_dod + feature_flags + fixtures | unit test green / Ajv validation pass | 모듈별 독립 롤백 가능 |
| **P1** | single-dev | role_memory signatureMetrics 8역할 + compile-metrics-registry | 29지표 compile + sourceHash 기록 + snapshot v1.0.json 생성 + axis 분포 표시 | E-009 sourceHash mismatch 시 재compile |
| **P2** | parallel-subagents (2) | self_scores.jsonl writer + pending_deferred + quarantine 구조 + schema 검증 | round-trip + extensions slot 보존 + orphan 0 | partial 레코드 sessionId 단위 삭제 후 재실행 |
| **P3** | single-dev | finalize.js (YAML 파싱 + default lookup + defaultUsageCount + supersedes + audit + topicType-aware participation) + freshness 검증 hook | 실세션 append 검증 + audit 5필드 non-null | YAML 파싱 실패 시 transcript 보존, stderr 로그 |
| **P4** | parallel-subagents (3) | compute-signature-metrics (CI/n + stratified-by-grade + weighted-mean derived + alert + null policy) + resolve-deferred + SLA 측정 | 3뷰 fixture diff 0 + Tier 1 health score 검산 + SLA < 3초 | 분기 disable, L1~L3만 노출 |
| **P5** | single-dev | dashboard 3-tier (overview/role/drill) + baseline state UI + integrity·alert 배지 (warmup silent) + role-signature-card 템플릿 | dist/ 빌드 + 8 Tier 1 카드 노출 + Master 수동 검수 | 카드 hidden 토글 (feature_flags) |
| **G6** | — | 정량 6항목 + 정성 회고 (template) | Tier A → B → C 순차 trigger | PD-023 retrospective |

## 7. G6 Acceptance Trigger (Tier A/B/C)

| Tier | 조건 | 평가 항목 |
|---|---|---|
| **A (primary)** | 5토픽 종결 + Grade A·B·C 중 ≥ 2종 | G6.1 정량 6항목 + G6.2 정성 5항목 |
| **B (fallback)** | 30세션 누적 시 Tier A 미충족 → Grade A/B/C 각 ≥ 1 의무 | 동일 |
| **C (last resort)** | 60세션 도달 시 A/B 모두 미충족 → 가용 데이터 부분 평가 | 미검증 grade는 PD-025 진입 후 사후 검증 |

### G6.1 정량 (PD-023 자력 평가만)
- rater participation rate (topicType-aware)
- audit field non-null rate ≥ 95%
- compute SLA 위반 0회
- schema validation E-class 에러 0건
- regression test fixture diff 0
- quarantine 폴더 forward-compat 슬롯 검증

### G6.2 정성 (Master 회고)
- 5토픽 운영 일지 (각 토픽 종결 시 1줄 메모, 누적 5줄)
- 세션 1~5 batch helper 사용 완료 여부
- Tier 1 dashboard 사용 자기 보고
- "MVP가 의사결정에 영향" 사례 ≥ 1건
- 5분 초과 helper 사용 세션 카운트

## 8. Rollback Playbook

```
1. .claude/hooks/session-end-finalize.js 이전 버전 git revert
2. compute-dashboard.ts L4 분기 주석 처리 OR feature_flags.signatureMetricsEnabled = false
3. self_scores.jsonl 보존 (삭제 X)
4. current_session.json.turns[].selfScores 무시 (호환 유지)
5. dashboard role-signature 섹션 hidden 토글
6. 회귀 테스트 통과 확인 (test-regression.ts)
7. _quarantine/ 폴더 내 미flush 파일 수동 검토. flush 가능 → self_scores.jsonl 추가 / 손상 → 격리 보관 후 사후 분석
8. version v1.55 → v1.54 fallback
```

## 9. Error Code Taxonomy

```
E-001 registry compile drift detected
E-002 self_scores orphan metricId
E-003 YAML block parse failure
E-004 scale-value mismatch (reject at record time)
E-005 supersedes chain cycle
E-006 registry schema validation failure
E-007 auto-scorer load failure
E-008 construct-anchor missing
E-009 compile sourceHash mismatch
E-010 compute SLA exceeded
E-011 no-op version bump (PD-025)
E-012 breaking change without major bump (PD-025)
E-013 quarantine flush before session close (PD-025)
E-014 shadow promotion criteria not met (PD-025)
E-015 blind window violation (PD-025)
E-016 stratum sample size below threshold
E-017 Goodhart divergence detected (PD-025)
E-018 derived metric null policy ambiguous
E-019 axis balance below minimum target
E-020 correction cascade DAG cycle (PD-025)
E-021 retired metric referenced by active derived (PD-026)
E-022 extensions namespace violation
```

## 10. Forward Compatibility Contract

- jsonl ScoreRecord에 `extensions: {}` 슬롯 의무 (PD-025+ 사용)
- registry.metric에 `_reserved: {}` 빈 객체 의무
- 신규 필드는 `extensions.{moduleId}.*` 네임스페이스 강제
- top-level 필드 추가 금지 (E-022)
- migration 스크립트 규약: `scripts/migrations/registry-vX-to-vY.ts`

## 11. Self-Audit Log (Arki Internal)

- Rounds completed: **12**
- Total findings: **38**
- Distribution: MUST_NOW 18 / MUST_BY_N=10 8 / MUST_BY_N=30 4 / SHOULD 5 / NICE 3 / DEFER 0
- Per-dimension: structuration 14 / hardcoding 7 / efficiency 9 / extensibility 8
- Termination: Master approval after round 12 + Riki/Fin cross-review (8 보강 흡수)
- Spec scope drift: 5x original ("얇은 구현"), mitigated by PD-023/025/026/027 4-PD split
- Riki cross-review가 Arki 자가감사 미발견 3건(default 인플레/forward-compat nothing-burger/P0 type race) 보강 — Riki 무용화 X 재확인

## 12. Dependent PDs

- **PD-025** (resolveCondition: PD-023 G6 통과 + 10세션 누적 + Master inflation/anchoring 신호 1건): self-rating 품질 + Goodhart 방어
- **PD-026** (resolveCondition: PD-025 통과 + 30세션 누적 + (axis 확장 OR retirement 검토)): validity + retirement + axis enforcement
- **PD-027** (resolveCondition: self_scores.jsonl ≥ 100세션 + compute SLA > 2초 3회): incremental compute / cache layer
