/**
 * lint-inline-root-color.ts — Phase 1 G1 lint
 *
 * Fails build if any active app/*.html page contains an inline `:root{ --c-* }`
 * color-token redefinition. Single source of truth = app/css/tokens.css.
 *
 * Spec: contrast-check.md §6, dev_rev1 §B-3, ace_rev4 §3-3 #2.
 * Reuses callable scanInlineRoot from scan-inline-root.ts.
 *
 * Usage:
 *   npx ts-node scripts/lint-inline-root-color.ts
 *   exit 0 PASS / exit 1 FAIL
 */
import * as path from 'path';
import { scanInlineRoot } from './scan-inline-root';

export interface LintFailure {
  file: string;
  line: number;
  tokens: string[];
}

export function lintInlineRootColor(appDir: string): { ok: boolean; failures: LintFailure[]; checkedFiles: number } {
  const result = scanInlineRoot(appDir);
  const failures: LintFailure[] = [];
  for (const dump of result.perFileDumps) {
    if (!dump.active) continue; // legacy archived — out of scope
    for (const block of dump.rootBlocks) {
      if (block.colorTokens.length === 0) continue;
      failures.push({ file: dump.file, line: block.lineStart, tokens: block.colorTokens });
    }
  }
  return { ok: failures.length === 0, failures, checkedFiles: result.activeFiles };
}

if (require.main === module) {
  const ROOT = path.resolve(__dirname, '..');
  const APP = path.join(ROOT, 'app');
  const r = lintInlineRootColor(APP);
  if (!r.ok) {
    console.error('[lint-inline-root-color] FAIL');
    for (const f of r.failures) {
      console.error(`  ${f.file}:${f.line}  tokens: ${f.tokens.join(', ')}`);
    }
    console.error('  → 색 canonical 출처 = app/css/tokens.css. 인라인 :root{ --c-* } 제거 후 재시도.');
    process.exit(1);
  }
  console.log(`[lint-inline-root-color] PASS — ${r.checkedFiles} active pages, 0 inline color :root{} blocks`);
}
