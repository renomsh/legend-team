/**
 * vr-capture.ts — Phase 2 G2 VR baseline 캡처 (session_105, topic_082)
 *
 * Spec: reports/2026-04-25_dashboard-redesign-ux-responsive-phase2/vr-infra-spec.md §4-2
 *
 * 6 페이지 × 4 viewport = 24 PNG + 24 bbox JSON (page-viewport 단위 marker 묶음).
 * R-1 4중 mitigation 강제 박제:
 *   (a) Date mock — addInitScript로 FROZEN_TS 고정
 *   (b) reduced-motion + animation/transition 0 글로벌 inject
 *   (c) networkidle 대기 (웹폰트 로드 완료) + VR 캡처 환경에서만 font-display: block override
 *   (d) ECharts animation off 신호
 *
 * 효율 권고 (arki A1-3 흡수): context 1회 + setViewportSize reuse 패턴.
 *
 * Callable: import { captureBaseline } from this module.
 * CLI:      npx ts-node scripts/vr-capture.ts [--dry-run] [--base-url URL]
 */
export type VrPage = {
    slug: string;
    path: string;
};
export type VrViewport = {
    name: string;
    width: number;
    height: number;
};
export declare const PAGES: VrPage[];
export declare const VIEWPORTS: VrViewport[];
export declare const FROZEN_TS_MS: number;
export type CaptureOptions = {
    baseUrl?: string;
    baselineDir?: string;
    bboxDir?: string;
    pages?: VrPage[];
    viewports?: VrViewport[];
    dryRun?: boolean;
};
export type CaptureResult = {
    pngs: string[];
    bboxes: string[];
    skipped: string[];
};
export declare function captureBaseline(opts?: CaptureOptions): Promise<CaptureResult>;
//# sourceMappingURL=vr-capture.d.ts.map