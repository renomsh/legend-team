/**
 * check-topic-lifecycle.ts
 * A6-2: 활성 토픽 lifecycle 경고 점검 (D-055).
 *
 * 경고 기준:
 *   - sessionCount >= maxSessions (기본 5)
 *   - lastActivity 미갱신 >= lastActivityDays (기본 30일)
 *
 * 규칙:
 *   - hold!=null 토픽 제외
 *   - expectedDuration 필드 있는 토픽 제외
 *   - 경고만 출력 — 자동 status 변경 없음
 *
 * Usage:
 *   npx ts-node scripts/check-topic-lifecycle.ts
 *
 * Programmatic:
 *   import { checkTopicLifecycle } from './check-topic-lifecycle';
 */
export interface LifecycleWarning {
    topicId: string;
    title: string;
    type: 'maxSessions' | 'stale';
    detail: string;
}
export declare function checkTopicLifecycle(): LifecycleWarning[];
export declare function formatLifecycleWarnings(warnings: LifecycleWarning[]): string;
//# sourceMappingURL=check-topic-lifecycle.d.ts.map