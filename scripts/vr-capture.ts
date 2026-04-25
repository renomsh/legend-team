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

import { chromium, Browser, Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export type VrPage = { slug: string; path: string };
export type VrViewport = { name: string; width: number; height: number };

export const PAGES: VrPage[] = [
  { slug: 'home', path: '/index.html' },
  { slug: 'upgrade', path: '/dashboard-upgrade.html' },
  { slug: 'ops', path: '/dashboard-ops.html' },
  { slug: 'topics', path: '/topic.html' },
  { slug: 'growth', path: '/signature.html' },
  { slug: 'people', path: '/role-signature-card.html' },
];

export const VIEWPORTS: VrViewport[] = [
  { name: 'desktop-xl', width: 1920, height: 1080 },
  { name: 'desktop-md', width: 1440, height: 900 },
  { name: 'desktop-sm', width: 1280, height: 720 },
  { name: 'mobile', width: 375, height: 667 },
];

export const FROZEN_TS_MS = new Date(process.env.VR_FROZEN_TS || '2026-01-01T00:00:00Z').valueOf();

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

async function applyMitigations(page: Page): Promise<void> {
  // R-1 (b) — animation/transition 0
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }`,
  });
  // R-3 mitigation — 한국어 폰트 보장 (Pretendard CDN inject + font-display: block)
  // 베이스라인 환경(컨테이너/호스트 무관)에서 한국어 글리프 일관성 강제.
  // 시스템 한국어 폰트 부재 시 tofu/box 박스 회귀 차단.
  await page.addStyleTag({
    content: `
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
      @font-face { font-display: block !important; }
      html, body, * {
        font-family: 'Pretendard Variable', Pretendard, -apple-system, 'SF Pro Display', 'Inter', 'Noto Sans KR', sans-serif !important;
      }
    `,
  });
  // R-1 (d) — ECharts animation off
  await page.evaluate(() => {
    // @ts-ignore
    if (typeof window !== 'undefined' && (window as any).echarts) {
      (window as any).echarts.__animationDisabled = true;
    }
  });
  // R-3 — 폰트 로드 완료 대기 (CDN @import는 비동기)
  await page.evaluate(async () => {
    if ((document as any).fonts && (document as any).fonts.ready) {
      await (document as any).fonts.ready;
    }
  });
}

export async function captureBaseline(opts: CaptureOptions = {}): Promise<CaptureResult> {
  const baseUrl = opts.baseUrl ?? process.env.VR_BASE_URL ?? 'http://localhost:8788';
  const baselineDir = opts.baselineDir ?? 'tests/vr/baseline';
  const bboxDir = opts.bboxDir ?? 'tests/vr/__bbox__';
  const pages = opts.pages ?? PAGES;
  const viewports = opts.viewports ?? VIEWPORTS;
  const result: CaptureResult = { pngs: [], bboxes: [], skipped: [] };

  if (opts.dryRun) {
    for (const p of pages) {
      for (const vp of viewports) {
        result.skipped.push(`${p.slug}/${vp.name}.png`);
      }
    }
    return result;
  }

  const browser: Browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
      deviceScaleFactor: 1,
    });
    // R-1 (a) — Date mock (모든 page에 적용)
    await ctx.addInitScript(`{
      const _Date = Date;
      const _now = ${FROZEN_TS_MS};
      class FrozenDate extends _Date {
        constructor(...args) {
          if (args.length === 0) super(_now);
          else super(...args);
        }
        static now() { return _now; }
      }
      // @ts-ignore
      Date = FrozenDate;
    }`);
    const page = await ctx.newPage();

    for (const p of pages) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`${baseUrl}${p.path}`, { waitUntil: 'networkidle' });
        await applyMitigations(page);
        await page.waitForLoadState('networkidle');

        const pngDir = join(baselineDir, p.slug);
        mkdirSync(pngDir, { recursive: true });
        const pngPath = join(pngDir, `${vp.name}.png`);
        await page.screenshot({ path: pngPath, fullPage: true });
        result.pngs.push(pngPath);

        const bboxes: Record<string, unknown> = {};
        const markers = await page.locator('[data-vr-bbox]').all();
        for (const el of markers) {
          const marker = await el.getAttribute('data-vr-bbox');
          if (!marker) continue;
          bboxes[marker] = await el.boundingBox();
        }
        mkdirSync(bboxDir, { recursive: true });
        const bboxPath = join(bboxDir, `${p.slug}-${vp.name}.json`);
        writeFileSync(bboxPath, JSON.stringify(bboxes, null, 2));
        result.bboxes.push(bboxPath);
      }
    }
    await ctx.close();
  } finally {
    await browser.close();
  }
  return result;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const baseUrlIdx = process.argv.indexOf('--base-url');
  const opts: CaptureOptions = { dryRun };
  if (baseUrlIdx >= 0) {
    const v = process.argv[baseUrlIdx + 1];
    if (v) opts.baseUrl = v;
  }
  const result = await captureBaseline(opts);
  if (dryRun) {
    console.log(`[vr-capture] DRY-RUN — would capture ${result.skipped.length} PNG (page×viewport)`);
    for (const s of result.skipped) console.log(`  - ${s}`);
    return;
  }
  console.log(`[vr-capture] PASS — ${result.pngs.length} PNG + ${result.bboxes.length} bbox JSON`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
