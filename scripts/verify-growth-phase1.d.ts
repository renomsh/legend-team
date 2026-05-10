#!/usr/bin/env ts-node
/**
 * verify-growth-phase1.ts — D-060 Phase 1 자가검증
 *
 * G1 게이트:
 *   G1.1  growth_metrics.json 존재 + 파싱 가능
 *   G1.2  비-null datapoint ≥ 20개
 *   G1.3  L1.cumulativeLearning 3개 window 모두 datapoint 존재 (window 20/100/500)
 *   G1.4  dev.firstPassRate datapoint 존재 (non-null ≥ 1)
 *   G1.5  pendingLag 구조 유효 (dueAtSession 형식)
 *   G1.6  computedAtSession 필드 존재 (provenance 필드)
 *   G1.7  latestBySignature 재계산 정합 (signature 메트릭 키 일치)
 *   G1.8  metric_health.json 존재 + computedAtSession 필드
 *   G1.9  Phase 0 verify 회귀 (scoreMetric no longer throws)
 *   G1.10 auto-push.js에 compute-growth.ts 삽입 확인
 *   G1.11 dry-run 재실행 후 datapoint 수 불변 (멱등성)
 */
export {};
//# sourceMappingURL=verify-growth-phase1.d.ts.map