"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.lintInlineRootColor = lintInlineRootColor;
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
const path = __importStar(require("path"));
const scan_inline_root_1 = require("./scan-inline-root");
function lintInlineRootColor(appDir) {
    const result = (0, scan_inline_root_1.scanInlineRoot)(appDir);
    const failures = [];
    for (const dump of result.perFileDumps) {
        if (!dump.active)
            continue; // legacy archived — out of scope
        for (const block of dump.rootBlocks) {
            if (block.colorTokens.length === 0)
                continue;
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
//# sourceMappingURL=lint-inline-root-color.js.map