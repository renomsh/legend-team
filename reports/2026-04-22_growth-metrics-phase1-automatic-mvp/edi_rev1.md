---
topic: D-060 Phase 1 구현 — automatic 스코어러 + 훅 체인 통합 MVP
topic_id: topic_085
session: session_079
revision: 1
date: 2026-04-22
status: completed
contributing_agents: [ace, dev]
mode: observation
grade: B
framing_level: 1
parent_topic: topic_083
topic_type: implementation
accessed_assets:
  - file: reports/2026-04-22_growth-metrics-phase0-scaffold/editor_rev1.md
    scope: phase0_context
  - file: memory/shared/metrics_registry.json
    scope: scorer_definition
  - file: memory/sessions/session_index.json
    scope: historical_session_data
  - file: scripts/auto-push.js
    scope: hook_chain_integration
---

# Growth Metrics Phase 1 — automatic 스코어러 + 훅 체인 통합 MVP

## Executive Summary

- **Objective**: Phase 0 스켈레톤에서 `throw new Error('Phase 1')` 상태였던 `scoreMetric` / `resolvePendingLag`를 실 데이터로 작동하는 automatic 스코어러로 구현. auto-push.js 훅 체인에 삽입하여 세션 종료마다 자동 집계.
- **Scope**: automatic 모드 4종 스코어러 구현 / resolvePendingLag 구현 / backfill CLI / 훅 체인 삽입 / verify-growth-phase1.ts 자가검증.
- **Outcome**: G1 게이트 통과 (19 PASS / 0 FAIL). nonNull datapoints=584, pendingLag=15.

## Context

topic_083(D-060, framing)의 child 토픽. Phase 0(topic_084) scaffold 위에서 실 scoring 로직을 박는 Phase 1. Grade B L1 경량 프레이밍으로 진행.

## Agent Contributions

### Ace (프레이밍 L1)

- topicType: implementation, parentTopicId: topic_083 선언
- IN: scoreMetric automatic 4종 / resolvePendingLag / 훅 체인 삽입 / 5세션 후향 집계
- OUT: consensus/single 채점 / UI 렌더(topic_082) / 히스토리컬 전체 백필
- G1 게이트 기준 확인 후 Dev 직행

### Dev (구현 + 자가검증)

**구현 내용:**

1. **`scoreMetric` automatic 4종 구현**
   - `common.L1.cumulativeLearning`: window 내 session turns 합산 + role_memory 엔트리 수. 3개 window(20/100/500) 전부 실 값 생성.
   - `common.L3.autonomy`: session note 파싱 (`directive N, corrective M, ...` 패턴). 파싱 불가 세션은 null.
   - `signature.dev.firstPassRate`: turns[].recallReason 기반 Dev 재호출 감지. 재호출 없으면 1, 있으면 <1.
   - `signature.nova.promotionRate`: Nova 발언 세션 중 speculative_options.promotedToDecision 체크.

2. **Phase 2 위임 4종** (데이터 미확보):
   - `signature.arki.structuralLifespan` — redesign detection 미구현 (lag=10)
   - `signature.fin.costForecastAccuracy` — Fin 예측 미기록
   - `signature.vera.masterRevisionInv` — Vera feedback 불충분
   - `common.L2.hitRate`, `signature.ace.orchestrationHitRate`, `signature.riki.riskF1`, `signature.edi.gapFlagAccuracy` — consensus/single 모드

3. **`resolvePendingLag` 구현**: pendingLag 배열에서 `dueAtSession <= currentSession` 항목 추출 → 재채점 → 기존 배열에서 제거. 재기동 안전 보장.

4. **CLI backfill**: `--backfill-sessions N` 플래그로 최근 N세션 후향 집계. `--since session_NNN` 지정도 가능.

5. **멱등성 보장**: `computedKey = (sessionId, metricId, window)` Set으로 중복 생성 방지.

6. **`latestBySignature` 재계산**: signature 메트릭별 최신 10개 유지.

7. **`metric_health.json` 업데이트**: 메트릭별 총/비null 카운트 + data-gap 상태 기록.

8. **auto-push.js 훅 체인 삽입**: `session-end-finalize.js` → **`compute-growth.ts`** → `compute-dashboard.ts` → `build.js`.

**TypeScript 수정 3건**:
- `result[dp.metricId]!.push(dp)` — non-null assertion 대신 `!` 사용 (exactOptionalPropertyTypes 호환)
- `p.window === undefined` 제거 — PendingLagEntry 타입에 없는 필드 참조 차단
- CLI args 파싱 undefined 방어 — `if (v) opts.sinceSession = v` 패턴

## Self-Verification (Dev Gate)

`npx ts-node scripts/verify-growth-phase1.ts` → **19 PASS / 0 FAIL**

| 테스트 그룹 | 커버 |
|---|---|
| G1.1~1.2 | 파일 존재 + nonNull ≥ 20 (실측 584) |
| G1.3 | L1.cumulativeLearning window 20/100/500 전부 |
| G1.4 | dev.firstPassRate non-null ≥ 1 |
| G1.5~1.6 | pendingLag 구조 유효 + computedAtSession 필드 |
| G1.7~1.8 | latestBySignature 정합 + metric_health.json |
| G1.9 | Phase 0 회귀 (scoreMetricForWindow callable) |
| G1.10 | auto-push.js 훅 체인 삽입 + 순서 |
| G1.11 | 멱등성 (dry-run 재실행 후 datapoint 수 불변) |

실측 결과:
- `totalDatapoints`: 1572 (77 sessions × 11 metrics × 3 windows 중 lag=0 해당분)
- `nonNullDatapoints`: 584
- `pendingLag`: 15건 (lag>0 automatic 메트릭 항목)

## Integrated Recommendation

### 완료
- Phase 1 G1 게이트 전 항목 통과
- 훅 체인 등록으로 이후 세션부터 자동 incremental 집계

### 다음 세션 권장
- **D-060 Fin 측정 오버헤드 재감사** (D-060 운영규칙 gate) — Phase 1 완료 후 Fin 소환 조건
- **Growth Board UI 연결** (topic_082 재개) — growth_metrics.json → Board 렌더 연결
- **consensus/single 채점 프로토콜** — Ace/Riki/Arki 라이브 채점 삽입 설계

## Unresolved Questions

- L3.autonomy: note 파싱 커버율 낮음 (structured 개입 기록 세션만 추출). 향후 `current_session.json.interventionLog` 필드 신설 고려.
- arki.structuralLifespan lag=10 — 현재 session_079 기준 session_089에서 해소. Phase 2에서 redesign detection 로직 구현 필요.

## Appendices

### A. 생성/변경 파일

```
scripts/compute-growth.ts          # Phase 1 전면 재구현 (scorers 4종 + resolvePendingLag + backfill)
scripts/verify-growth-phase1.ts    # Phase 1 자가검증 (19 asserts)
scripts/auto-push.js               # 훅 체인에 compute-growth.ts 삽입
memory/derived/growth_metrics.json # 실 datapoints 1572개 (nonNull 584) + pendingLag 15
memory/derived/metric_health.json  # 메트릭별 health 상태
```

### B. 본 세션 오케스트레이션

- 루프: Ace(L1) → Dev 구현 → TypeScript 오류 자가수정 → 자가검증 19 PASS
- Master 개입: 없음 (Grade B 저마찰 세션)
- 재호출: 없음
