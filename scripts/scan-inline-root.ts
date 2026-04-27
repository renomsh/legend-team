/**
 * scan-inline-root.ts — G0-5 인라인 :root{} dump 스캐너 (callable)
 *
 * 목적: app/*.html 페이지의 인라인 <style> 안 :root{} 블록을 전수 추출하여
 *       색 토큰(--c-*) vs 레이아웃 토큰(--space-*·--radius-*·--fs-*·--bp-*·--container-*·--text·--panel·--bg·--line·--brand-*·--grad-*) 분리.
 * 출처 spec: arki_rev2.md §1-5 G0-5 / ace_rev3.md §3-1 G0-5
 *
 * Usage:
 *   npx ts-node scripts/scan-inline-root.ts
 *   import { scanInlineRoot } from './scan-inline-root';
 */
import * as fs from 'fs';
import * as path from 'path';

export interface RootBlockDump {
  file: string;
  active: boolean;            // legacy(v3 변종) = false, archive 대상
  rootBlocks: Array<{
    lineStart: number;
    lineEnd: number;
    rawLength: number;
    colorTokens: string[];    // --c-ace 등 G1 lint 강제 흡수 대상
    layoutTokens: string[];   // --space-* / --radius-* / --fs-* / --bp-* / --container-* (PD 이연 후보)
    baseTokens: string[];     // --text / --panel / --bg / --line / --brand-* / --grad-* 등 색 계열 일반 토큰
    otherTokens: string[];    // 위 어디에도 안 잡힌 잔여
  }>;
}

export interface ScanSummary {
  scanRoot: string;
  scannedFiles: number;
  activeFiles: number;
  legacyFiles: number;
  perFileDumps: RootBlockDump[];
  summary: {
    pagesWithColorTokenDuplication: number;
    pagesWithLayoutTokenDuplication: number;
    totalRootBlocks: number;
    g1LintTargetPages: string[];   // active && colorTokens.length > 0
    pdDeferralLayoutPages: string[]; // active && layoutTokens.length > 0
  };
}

const COLOR_TOKEN_RE = /^--c-(ace|arki|fin|riki|dev|vera|edi|nova)$/;
const LAYOUT_TOKEN_RE = /^--(space|radius|fs|bp|container)-/;
const BASE_TOKEN_RE = /^--(text|panel|bg|line|brand|grad)(-|$)/;

const LEGACY_PATTERN = /dashboard-v3.*-test\.html$/;

function classifyToken(name: string): 'color' | 'layout' | 'base' | 'other' {
  if (COLOR_TOKEN_RE.test(name)) return 'color';
  if (LAYOUT_TOKEN_RE.test(name)) return 'layout';
  if (BASE_TOKEN_RE.test(name)) return 'base';
  return 'other';
}

/**
 * Extract :root{ ... } blocks that appear inside <style>...</style> regions.
 * Line numbers are 1-based.
 */
export function extractRootBlocks(content: string): Array<{
  lineStart: number; lineEnd: number; body: string;
}> {
  const blocks: Array<{ lineStart: number; lineEnd: number; body: string }> = [];
  // Collect <style>...</style> regions (ignore @media wrappers; we still scan inside)
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(content)) !== null) {
    const styleBody = m[1] ?? '';
    if (!styleBody) continue;
    const styleAbsStart = m.index + m[0].indexOf(styleBody);
    // Find :root { ... } occurrences (allow nested @media by simple brace-balance)
    const rootRe = /:root\s*\{/g;
    let r: RegExpExecArray | null;
    while ((r = rootRe.exec(styleBody)) !== null) {
      const openIdx = r.index + r[0].length - 1; // position of '{'
      // brace match
      let depth = 1;
      let i = openIdx + 1;
      while (i < styleBody.length && depth > 0) {
        const ch = styleBody[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        i++;
      }
      if (depth !== 0) break; // malformed
      const closeIdx = i - 1;
      const bodyAbsStart = styleAbsStart + r.index;
      const bodyAbsEnd = styleAbsStart + closeIdx;
      const lineStart = content.slice(0, bodyAbsStart).split(/\n/).length;
      const lineEnd = content.slice(0, bodyAbsEnd).split(/\n/).length;
      blocks.push({
        lineStart,
        lineEnd,
        body: styleBody.slice(r.index, closeIdx + 1),
      });
    }
  }
  return blocks;
}

/**
 * Pull custom property names (--xxx) declared at the top level of a :root{} body.
 */
function extractCustomPropNames(rootBlockBody: string): string[] {
  const names: string[] = [];
  // strip the outer ":root { ... }" wrapper to its inner contents
  const inner = rootBlockBody.replace(/^[^{]*\{/, '').replace(/\}\s*$/, '');
  // naive split on ';' — sufficient because custom props are flat declarations
  const decls = inner.split(';');
  for (const decl of decls) {
    const t = decl.trim();
    if (!t) continue;
    const colonIdx = t.indexOf(':');
    if (colonIdx <= 0) continue;
    const lhs = t.slice(0, colonIdx).trim();
    if (lhs.startsWith('--')) names.push(lhs);
  }
  return names;
}

export function scanInlineRoot(appDir: string): ScanSummary {
  const entries = fs.readdirSync(appDir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.html'))
    .map(e => e.name)
    .sort();

  const perFileDumps: RootBlockDump[] = [];
  let pagesWithColor = 0;
  let pagesWithLayout = 0;
  let totalBlocks = 0;
  const g1LintTargetPages: string[] = [];
  const pdDeferralLayoutPages: string[] = [];

  for (const name of entries) {
    const fp = path.join(appDir, name);
    const content = fs.readFileSync(fp, 'utf8');
    const blocks = extractRootBlocks(content);
    const isLegacy = LEGACY_PATTERN.test(name);

    const dump: RootBlockDump = {
      file: `app/${name}`,
      active: !isLegacy,
      rootBlocks: blocks.map(b => {
        const propNames = extractCustomPropNames(b.body);
        const colorTokens: string[] = [];
        const layoutTokens: string[] = [];
        const baseTokens: string[] = [];
        const otherTokens: string[] = [];
        for (const n of propNames) {
          const c = classifyToken(n);
          if (c === 'color') colorTokens.push(n);
          else if (c === 'layout') layoutTokens.push(n);
          else if (c === 'base') baseTokens.push(n);
          else otherTokens.push(n);
        }
        return {
          lineStart: b.lineStart,
          lineEnd: b.lineEnd,
          rawLength: b.body.length,
          colorTokens, layoutTokens, baseTokens, otherTokens,
        };
      }),
    };
    totalBlocks += dump.rootBlocks.length;
    const hasColor = dump.rootBlocks.some(rb => rb.colorTokens.length > 0);
    const hasLayout = dump.rootBlocks.some(rb => rb.layoutTokens.length > 0);
    if (hasColor) pagesWithColor++;
    if (hasLayout) pagesWithLayout++;
    if (dump.active && hasColor) g1LintTargetPages.push(dump.file);
    if (dump.active && hasLayout) pdDeferralLayoutPages.push(dump.file);
    perFileDumps.push(dump);
  }

  return {
    scanRoot: appDir,
    scannedFiles: perFileDumps.length,
    activeFiles: perFileDumps.filter(d => d.active).length,
    legacyFiles: perFileDumps.filter(d => !d.active).length,
    perFileDumps,
    summary: {
      pagesWithColorTokenDuplication: pagesWithColor,
      pagesWithLayoutTokenDuplication: pagesWithLayout,
      totalRootBlocks: totalBlocks,
      g1LintTargetPages,
      pdDeferralLayoutPages,
    },
  };
}

// ── CLI ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const ROOT = path.resolve(__dirname, '..');
  const APP = path.join(ROOT, 'app');
  const OUT_DIR = path.join(ROOT, 'reports/2026-04-22_dashboard-redesign-ux-responsive');
  const OUT_JSON = path.join(OUT_DIR, 'inline-root-dump.json');

  const result = scanInlineRoot(APP);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2), 'utf8');

  // Console evidence summary
  console.log('SCAN_DONE');
  console.log(`scannedFiles: ${result.scannedFiles}`);
  console.log(`active: ${result.activeFiles}  legacy: ${result.legacyFiles}`);
  console.log(`totalRootBlocks: ${result.summary.totalRootBlocks}`);
  console.log(`pagesWithColorTokenDuplication: ${result.summary.pagesWithColorTokenDuplication}`);
  console.log(`pagesWithLayoutTokenDuplication: ${result.summary.pagesWithLayoutTokenDuplication}`);
  console.log(`g1LintTargetPages (active+color): ${result.summary.g1LintTargetPages.length}`);
  for (const p of result.summary.g1LintTargetPages) console.log(`  - ${p}`);
  console.log(`pdDeferralLayoutPages (active+layout): ${result.summary.pdDeferralLayoutPages.length}`);
  for (const p of result.summary.pdDeferralLayoutPages) console.log(`  - ${p}`);
  console.log(`\nper-file:`);
  for (const d of result.perFileDumps) {
    const c = d.rootBlocks.reduce((a, b) => a + b.colorTokens.length, 0);
    const l = d.rootBlocks.reduce((a, b) => a + b.layoutTokens.length, 0);
    const ba = d.rootBlocks.reduce((a, b) => a + b.baseTokens.length, 0);
    const o = d.rootBlocks.reduce((a, b) => a + b.otherTokens.length, 0);
    console.log(`  ${d.active ? '[A]' : '[L]'} ${d.file.padEnd(40)}  blocks=${d.rootBlocks.length}  color=${c}  layout=${l}  base=${ba}  other=${o}`);
  }
  console.log(`\nWROTE: ${path.relative(ROOT, OUT_JSON)}`);
}
