/**
 * lint-accent-only.ts — Phase 1 G1 lint
 *
 * Fails build if `--c-dev` or `--c-ace` is used as a body-text color
 * (i.e., as the value of a `color:` property anywhere in app/**\/*.html or
 * app/**\/*.css). These two role colors sit at 4.7:1 / 4.8:1 — within
 * 0.3 of the WCAG AA threshold — and are reserved for accent surfaces only:
 * borders, icon fills, gradients, dot indicators.
 *
 * Spec: contrast-check.md §2, vera token-axes-spec.md §2-1.
 *
 * Detection patterns:
 *   color: var(--c-dev)
 *   color : var( --c-ace ) !important
 *   style="color:var(--c-ace)"
 *
 * Out of scope (PD-050 — D-003 read-only enforced):
 *   element.style.color = 'var(--c-dev)' (JS dynamic)
 *
 * Usage:
 *   npx ts-node scripts/lint-accent-only.ts
 *   exit 0 PASS / exit 1 FAIL
 */
import * as fs from 'fs';
import * as path from 'path';

const RESTRICTED = ['--c-dev', '--c-ace'];
// Match the substring `color:var(--c-dev)` allowing whitespace inside var()
// and around the colon. Negative-lookbehind avoids matching `background-color:`,
// `border-color:`, `accent-color:`, `caret-color:`, `outline-color:`, `--cc-color`.
const PATTERN = /(?<![-\w])color\s*:\s*var\(\s*(--c-(?:dev|ace))\b/gi;

const SCAN_EXTENSIONS = ['.html', '.css'];
const EXCLUDE_DIRS = ['legacy', 'partials', 'node_modules', '.git'];

export interface AccentHit { file: string; line: number; col: number; token: string; snippet: string; }

function walk(dir: string, root: string, hits: AccentHit[]) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (EXCLUDE_DIRS.includes(ent.name)) continue;
      walk(p, root, hits);
      continue;
    }
    if (!SCAN_EXTENSIONS.includes(path.extname(ent.name).toLowerCase())) continue;
    const text = fs.readFileSync(p, 'utf8');
    const rel = path.relative(root, p).replace(/\\/g, '/');
    let m: RegExpExecArray | null;
    PATTERN.lastIndex = 0;
    while ((m = PATTERN.exec(text)) !== null) {
      const upto = text.slice(0, m.index);
      const line = upto.split(/\n/).length;
      const lastNl = upto.lastIndexOf('\n');
      const col = m.index - (lastNl === -1 ? 0 : lastNl);
      const lineEnd = text.indexOf('\n', m.index);
      const snippet = text.slice(m.index, lineEnd === -1 ? text.length : lineEnd).slice(0, 100).trim();
      hits.push({ file: rel, line, col, token: m[1] || '', snippet });
    }
  }
}

export function lintAccentOnly(scanDir: string): { ok: boolean; hits: AccentHit[]; scanned: number } {
  const hits: AccentHit[] = [];
  walk(scanDir, path.resolve(scanDir, '..'), hits);
  return { ok: hits.length === 0, hits, scanned: 0 };
}

if (require.main === module) {
  const ROOT = path.resolve(__dirname, '..');
  const APP = path.join(ROOT, 'app');
  const r = lintAccentOnly(APP);
  if (!r.ok) {
    console.error(`[lint-accent-only] FAIL — ${r.hits.length} forbidden body-text use(s) of --c-dev / --c-ace:`);
    for (const h of r.hits) {
      console.error(`  ${h.file}:${h.line}:${h.col}  ${h.token}  →  ${h.snippet}`);
    }
    console.error('  HINT: --c-dev / --c-ace are accent-only (border, icon, gradient). Use --text or --text-2 for body copy.');
    process.exit(1);
  }
  console.log(`[lint-accent-only] PASS — 0 body-text uses of accent-only role colors found in app/`);
}
