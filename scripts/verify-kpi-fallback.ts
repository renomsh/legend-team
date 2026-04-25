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

import { chromium, Browser } from 'playwright';

export type KpiViewport = {
  width: number;
  expectedCols: number;
};

export const VIEWPORTS_KPI: KpiViewport[] = [
  { width: 1024, expectedCols: 3 },
  { width: 1100, expectedCols: 3 },
  { width: 1200, expectedCols: 3 },
  { width: 1280, expectedCols: 4 },
];

export type KpiResult = {
  width: number;
  expectedCols: number;
  actualCols: number;
  pass: boolean;
};

export async function verifyKpiFallback(
  targetUrl: string,
  viewports: KpiViewport[] = VIEWPORTS_KPI
): Promise<KpiResult[]> {
  const browser: Browser = await chromium.launch();
  const results: KpiResult[] = [];
  try {
    for (const vp of viewports) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: 800 },
        colorScheme: 'dark',
        reducedMotion: 'reduce',
      });
      const page = await ctx.newPage();
      await page.goto(targetUrl, { waitUntil: 'networkidle' });
      const cards = await page.locator('.kpi-grid[data-kpi-count="4"] .kpi-card').all();
      if (cards.length === 0) {
        results.push({ width: vp.width, expectedCols: vp.expectedCols, actualCols: 0, pass: false });
        await ctx.close();
        continue;
      }
      const ys: number[] = [];
      for (const c of cards) {
        const box = await c.boundingBox();
        ys.push(box ? Math.round(box.y) : -1);
      }
      const firstY = ys[0];
      const firstRow = ys.filter((y) => y === firstY).length;
      results.push({
        width: vp.width,
        expectedCols: vp.expectedCols,
        actualCols: firstRow,
        pass: firstRow === vp.expectedCols,
      });
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  return results;
}

async function main(): Promise<void> {
  const url = process.env.KPI_TARGET_URL ?? process.argv[2] ?? 'http://localhost:8788/dashboard-upgrade.html';
  const results = await verifyKpiFallback(url);
  let failed = 0;
  for (const r of results) {
    const tag = r.pass ? 'PASS' : 'FAIL';
    console.log(`[${tag}] @ ${r.width}px expected=${r.expectedCols}-col actual=${r.actualCols}-col`);
    if (!r.pass) failed++;
  }
  console.log(`[verify-kpi-fallback] ${failed === 0 ? 'PASS' : 'FAIL'} — ${results.length - failed}/${results.length} viewports`);
  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
