/**
 * verify-kpi-fallback.ts — Phase 2 G2 게이트 5 검증 (session_105, topic_082)
 *
 * Spec: reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/kpi-fallback-spec.md §2-3
 *
 * 4 viewport(1024·1100·1200·1280)에서 .kpi-grid[data-kpi-count="4"]의
 * 첫 row 카드 수가 spec 기대값(3·3·3·4)과 일치하는지 자동 검증.
 *
 * Callable: import { verifyKpiFallback } from this module.
 * CLI:      npx ts-node scripts/verify-kpi-fallback.ts [URL]
 *
 * 환경변수:
 *   KPI_TARGET_URL — 검증 대상 URL (기본: http://localhost:8788/dashboard-upgrade.html)
 */
export type KpiViewport = {
    width: number;
    expectedCols: number;
};
export declare const VIEWPORTS_KPI: KpiViewport[];
export type KpiResult = {
    width: number;
    expectedCols: number;
    actualCols: number;
    pass: boolean;
};
export declare function verifyKpiFallback(targetUrl: string, viewports?: KpiViewport[]): Promise<KpiResult[]>;
//# sourceMappingURL=verify-kpi-fallback.d.ts.map