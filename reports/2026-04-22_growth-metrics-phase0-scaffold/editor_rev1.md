---
topic: D-060 Phase 0 구현 — metrics registry 스키마 + compute-growth 초설계
topic_id: topic_084
session: session_078
revision: 1
date: 2026-04-22
status: completed
contributing_agents: [ace, arki, dev]
mode: observation
grade: B
framing_level: 1
parent_topic: topic_083
topic_type: implementation
accessed_assets:
  - file: reports/2026-04-22_growth-metrics-board-design/editor_rev1.md
    scope: topic_083_outcome
  - file: decision_ledger.json
    scope: D-060
  - file: system_state.json
    scope: fast_path
---

# Growth Metrics Phase 0 Scaffold

## Executive Summary

- **Objective**: D-060 성장지표 구조를 실제 파일·코드로 박는 Phase 0. 스키마 뼈대와 compute 파이프라인 뼈대만, 실 수치 수집은 Phase 1.
- **Scope**: 5 스키마 파일 + compute-growth.ts registry-driven 스켈레톤 + 자가검증 스크립트.
- **Outcome**: G0 게이트 통과. 36 PASS / 0 FAIL. topic_082 재개 선행 기반 확보.

## Context

topic_083(D-060, framing)의 child 토픽. Phase 0 deliverable 9종 중 스키마 5 + compute 뼈대를 본 세션에서 완료. topic_082(UI 안 β) 재개 전 필수 선행. Master가 Opus 4.7 1M 메인으로 지정.

## Agent Contributions

### Ace (프레이밍 L1)

- Grade B로 선언 → L1 경량 프레이밍 2~3문장 스코프 확정
- IN: 스키마 5종 + compute-growth 초안 + scoringLag·provenance 필드
- OUT: 실제 scoring, UI 렌더, 히스토리컬 백필
- 첫 주자 Arki 지명

### Arki (구조 설계)

- 파일 배치 3계층 분리: `memory/shared/`(계약) vs `memory/derived/`(산출물) vs `scripts/`(compute)
- 5종 스키마 계약 초안:
  - metrics_registry.json (plugin-style, id=dot-path, scorer.mode 분기)
  - hit_rate_rubric.json (versioned, effectiveFrom/To, version 불변 원칙)
  - intervention_classifier.json (tagger=ace 고정, autonomyFormula)
  - regime_markers.json (discrete marker + transitionZone)
  - derived/metric_health.json (QA 스텁)
- compute-growth.ts 설계: registry-driven + incremental(sinceSession) + append-only datapoints + pendingLag 큐
- 훅 체인 통합은 Phase 1로 보류 (빈 output 강제 생성 리스크 차단)
- G0 게이트 5항 정의

### Master 확인 (3축)

- **`memory/derived/`** 채택 (memory 우산 일관성)
- **signature 8종 scoringLag**: Ace=3, Arki=10, Fin=0, Riki=3, Dev=0, Vera=0, Edi=1, Nova=5
- **regime marker 백필 3건**: D-051(R-001) / D-056(R-002) / D-058(R-003)

### Dev (구현 + 자가검증)

- 5 스키마 파일 생성 (전부 schemaVersion 0.1.0)
- `scripts/compute-growth.ts` 스켈레톤:
  - export: loadRegistry / loadRegimes / loadExistingOutput / validateRegistry / resolveRegimeAt / scoreMetric(스텁) / resolvePendingLag(스텁) / computeGrowth
  - Phase 1 스텁은 `throw new Error('Phase 1')` 명시
  - CLI: `--since <session>`, `--dry-run`
- `scripts/verify-growth-phase0.ts` 자가검증 스크립트 추가
- TypeScript 2건 수정: exactOptionalPropertyTypes 대응 + MetricDef unknown cast

## Self-Verification (Dev Gate)

`npx ts-node scripts/verify-growth-phase0.ts` → **36 PASS / 0 FAIL**

| 테스트 그룹 | 커버 |
|---|---|
| T1 Registry 정합 | schemaVersion, 공통 3 + 시그니처 8, 8개 scoringLag 값 전부 확인안 일치 |
| T2 validateRegistry 실패경로 | duplicate id 감지, 음수 scoringLag 감지 |
| T3 resolveRegimeAt 경계 | session_052(전)→null, 053→R-001+zone, 055(zone 내), 056(zone 이탈), 068→R-003+zone, 078→R-003!zone |
| T4 Phase 1 스텁 방어 | scoreMetric/resolvePendingLag 조기 호출 시 throw |
| T5 엔트리포인트 | dryRun callable, registryVersion 전파, _phase0 마커 |
| T6 크로스참조 | registry rubricRef ↔ hit_rate_rubric 정합, classifier classes=5, autonomyFormula 존재 |

또한:
- `npx ts-node scripts/compute-growth.ts` → `Phase 0 ok. datapoints=0 pending=0`
- `memory/derived/growth_metrics.json` 빈 스텁으로 생성됨
- 기존 `compute-dashboard.ts` 무영향 (세션 76 / 경보 2 정상)

## Integrated Recommendation

### 완료
- Phase 0 deliverable 9종 중 6종 (스키마 5 + compute-growth 스켈레톤) 박음
- 나머지 3종(multi-scale window 로직, provenance 필드 주입, incremental aggregation 알고리즘)은 스키마 필드 자리만 잡았고 값 채움은 Phase 1

### 다음 세션 (권장)
- 제목: `D-060 Phase 1 구현 — automatic 스코어러 + 훅 체인 통합 MVP`
- Grade B, topicType: implementation, parentTopicId: topic_083
- 범위: scoreMetric automatic 모드 우선(L1.cumulativeLearning + L3.autonomy + fin·dev·vera·arki·nova 5 시그니처) / resolvePendingLag / auto-push.js 체인 삽입 / 최근 5세션 후향 집계
- G1 게이트: growth_metrics.json에 실 datapoint ≥ 20개 생성 + 훅 1회 통과
- Phase 1 완료 후 **Fin 측정 오버헤드 재감사 gate**(D-060 운영규칙)

## Unresolved Questions

- consensus/single 모드 scoring을 Phase 1 후반에 묶을지 Phase 2로 분리할지 (live 채점 프로토콜 필요)
- `scripts/verify-growth-phase0.ts`를 Phase 1 회귀에 재사용할 때 T4(Phase 1 throw 테스트)를 반대로 뒤집어야 함 — 회귀 검증 스크립트 분리 필요

## Appendices

### A. 생성 파일 목록

```
memory/shared/metrics_registry.json           # 11 metrics (common 3 + signature 8)
memory/shared/hit_rate_rubric.json            # v1, 7 rubrics
memory/shared/intervention_classifier.json    # v1, 5 classes
memory/shared/regime_markers.json             # R-001, R-002, R-003
memory/derived/metric_health.json             # QA 스텁
memory/derived/growth_metrics.json            # compute-growth 첫 실행 생성 (빈 스텁)
scripts/compute-growth.ts                      # registry-driven skeleton
scripts/verify-growth-phase0.ts                # self-verification (36 asserts)
```

### B. 본 세션 오케스트레이션 실적

- 루프 사용: Ace(L1) → Arki 1회 → Master 확인 3축 → Dev 구현 → Master "자가검증?" 재요청 → Dev 확장 검증
- Master 개입: directive 1(아키 추천안 수용), corrective 1(자가검증 깊이 요구), exploratory 1(다음 세션 제목)
- 재호출: Dev 1회 (자가검증 확장 요구로 verify-growth-phase0.ts 신설)
- 박제 가치: Master "자가검증 실행했어?" 패턴 — Dev 기본 검증 이후 경계값·실패경로·크로스참조까지 요구. feedback_dev_verify_and_callable 심화 사례.
