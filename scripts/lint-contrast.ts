/**
 * lint-contrast.ts — Phase 1 G1 lint (G3 게이트 핵심)
 *
 * Parses app/css/tokens.css → resolves :root{} hex token values → computes
 * WCAG 2.1 contrast ratios for the 19-combo lint matrix (G0-9 §1-2).
 * Combo #20 (--text-3 on --panel-2 = 4.2:1) is policy-blocked, not lint-checked.
 *
 * Known-good unit assertion: #FFFFFF on #000000 = 21:1 (sanity).
 *
 * Spec: contrast-check.md §1·§5, vera token-axes-spec.md §2.
 *
 * Usage:
 *   npx ts-node scripts/lint-contrast.ts
 *   exit 0 PASS / exit 1 FAIL
 */
import * as fs from 'fs';
import * as path from 'path';

interface ContrastCheck { fg: string; bg: string; minRatio: number; }

const CHECKS: ContrastCheck[] = [
  { fg: '--text',     bg: '--panel',   minRatio: 4.5 },
  { fg: '--text',     bg: '--bg',      minRatio: 4.5 },
  { fg: '--text-2',   bg: '--panel',   minRatio: 4.5 },
  { fg: '--text-3',   bg: '--panel',   minRatio: 4.5 },
  { fg: '--text-3',   bg: '--bg',      minRatio: 4.5 },
  { fg: '--c-vera',   bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-arki',   bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-fin',    bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-nova',   bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-dev',    bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-riki',   bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-ace',    bg: '--panel',   minRatio: 4.5 },
  { fg: '--c-edi',    bg: '--panel',   minRatio: 4.5 },
  { fg: '--ok',       bg: '--panel',   minRatio: 4.5 },
  { fg: '--warn',     bg: '--panel',   minRatio: 4.5 },
  { fg: '--bad',      bg: '--panel',   minRatio: 4.5 },
  { fg: '--text',     bg: '--panel-2', minRatio: 4.5 },
  { fg: '--text-2',   bg: '--panel-2', minRatio: 4.5 },
  { fg: '--text',     bg: '--panel-3', minRatio: 4.5 },
];

const FALLBACKS: Record<string, string> = {
  '--c-dev': '--c-dev-fallback',
  '--c-ace': '--c-ace-fallback',
};

// Margin alarm threshold (G0-9 §5-1)
const SHOULD_FIX_MARGIN = 0.2;

// ── color math (WCAG 2.1) ──────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}
function relativeLuminance(rgb: [number, number, number]): number {
  const r = srgbToLinear(rgb[0]);
  const g = srgbToLinear(rgb[1]);
  const b = srgbToLinear(rgb[2]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(fgHex: string, bgHex: string): number {
  const L1 = relativeLuminance(hexToRgb(fgHex));
  const L2 = relativeLuminance(hexToRgb(bgHex));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// ── tokens.css :root{} hex parser ──────────────────────────────────────────
export function parseTokens(cssText: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  // Strip CSS block comments first so prose mentions of `:root{}` in header
  // docstrings don't shadow the actual rule.
  const stripped = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  // grab first :root { ... } block (canonical defines all hex there)
  const m = /:root\s*\{([\s\S]*?)\}/.exec(stripped);
  if (!m || !m[1]) return tokens;
  const body = m[1];
  const lineRe = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let r: RegExpExecArray | null;
  while ((r = lineRe.exec(body)) !== null) {
    const name = (r[1] || '').trim();
    const val = (r[2] || '').trim();
    if (!name) continue;
    // Only retain solid #rrggbb / #rgb values (skip gradients, numbers, rgba, etc.)
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(val)) tokens[name] = val;
  }
  return tokens;
}

interface RatioRow { fg: string; bg: string; fgHex: string; bgHex: string; ratio: number; min: number; pass: boolean; margin: number; alarm: boolean; }

export function evaluate(tokens: Record<string, string>): { rows: RatioRow[]; failures: RatioRow[]; alarms: RatioRow[] } {
  const rows: RatioRow[] = [];
  for (const c of CHECKS) {
    const fgHex = tokens[c.fg];
    const bgHex = tokens[c.bg];
    if (!fgHex || !bgHex) {
      rows.push({ fg: c.fg, bg: c.bg, fgHex: fgHex || '?', bgHex: bgHex || '?', ratio: 0, min: c.minRatio, pass: false, margin: -c.minRatio, alarm: false });
      continue;
    }
    const ratio = contrastRatio(fgHex, bgHex);
    const margin = ratio - c.minRatio;
    const pass = ratio >= c.minRatio;
    const alarm = pass && margin < SHOULD_FIX_MARGIN;
    rows.push({ fg: c.fg, bg: c.bg, fgHex, bgHex, ratio, min: c.minRatio, pass, margin, alarm });
  }
  const failures = rows.filter(r => !r.pass);
  const alarms = rows.filter(r => r.alarm);
  return { rows, failures, alarms };
}

// ── known-good sanity check ────────────────────────────────────────────────
function sanityCheck(): boolean {
  const r = contrastRatio('#FFFFFF', '#000000');
  return Math.abs(r - 21) < 0.01;
}

if (require.main === module) {
  const ROOT = path.resolve(__dirname, '..');
  const TOKENS = path.join(ROOT, 'app/css/tokens.css');
  if (!fs.existsSync(TOKENS)) {
    console.error('[lint-contrast] FAIL — tokens.css not found:', TOKENS);
    process.exit(1);
  }
  if (!sanityCheck()) {
    console.error('[lint-contrast] FAIL — known-good sanity (#FFF on #000 = 21:1) broken; lint impl bug');
    process.exit(1);
  }
  const css = fs.readFileSync(TOKENS, 'utf8');
  const tokens = parseTokens(css);
  const { rows, failures, alarms } = evaluate(tokens);

  for (const r of rows) {
    const status = r.pass ? (r.alarm ? 'ALARM' : 'pass ') : 'FAIL ';
    console.log(`  [${status}] ${r.fg.padEnd(12)} on ${r.bg.padEnd(10)}  ${r.fgHex} on ${r.bgHex}  ratio=${r.ratio.toFixed(2)}  min=${r.min}  margin=${r.margin.toFixed(2)}`);
  }
  if (failures.length > 0) {
    console.error(`\n[lint-contrast] FAIL — ${failures.length}/${rows.length} combos below threshold`);
    for (const f of failures) {
      const fb = FALLBACKS[f.fg];
      const hint = fb ? `  HINT: swap to ${fb} (margin > 0.5)` : '';
      console.error(`  ${f.fg} on ${f.bg} = ${f.ratio.toFixed(2)}:1, requires ≥${f.min}:1${hint}`);
    }
    process.exit(1);
  }
  if (alarms.length > 0) {
    console.warn(`[lint-contrast] PASS with ${alarms.length} SHOULD-fix alarms (margin < ${SHOULD_FIX_MARGIN}):`);
    for (const a of alarms) console.warn(`  ${a.fg} on ${a.bg} margin=${a.margin.toFixed(2)} (간당값 — Vera review 권고)`);
  }
  console.log(`\n[lint-contrast] PASS — ${rows.length} combos, 0 failures, ${alarms.length} alarms`);
}
