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
/**
 * lint-echarts-gradient.ts — Phase 4 CLI lint (PD-049 D-102)
 *
 * Fails build (or warns) when ECharts gradient stop hex/rgba literals bypass
 * tokens.css single-source-of-truth via runtime injection.
 *
 * Reuses callable scanEchartsGradient from scan-echarts-gradient.ts.
 *
 * Level (env LINT_ECHARTS_LEVEL):
 *   error (default, Phase 8 승격)  — exit 1 on any non-whitelisted (FAIL) violation
 *   warn                          — exit 0 even with FAIL violations, log [WARN]
 *
 * Phase 8 (D-102): default WARN→ERROR 승격 완료. 회귀 시 즉시 build break.
 *
 * Usage:
 *   npx ts-node scripts/lint-echarts-gradient.ts
 *   LINT_ECHARTS_LEVEL=error npx ts-node scripts/lint-echarts-gradient.ts
 */
const path = __importStar(require("path"));
const scan_echarts_gradient_1 = require("./scan-echarts-gradient");
if (require.main === module) {
    const ROOT = path.resolve(__dirname, '..');
    const APP = path.join(ROOT, 'app');
    const level = (process.env.LINT_ECHARTS_LEVEL || 'error').toLowerCase();
    const r = (0, scan_echarts_gradient_1.scanEchartsGradient)(APP);
    const fails = r.violations.filter(v => !v.whitelisted);
    const warns = r.violations.filter(v => v.whitelisted);
    console.log(`[lint-echarts-gradient] level=${level} files=${r.scannedFiles} scriptBlocks=${r.scriptBlocks}`);
    console.log(`  WARN: ${warns.length}  FAIL: ${fails.length}`);
    for (const v of r.violations) {
        const tag = v.whitelisted ? 'WARN' : 'FAIL';
        console.log(`  ${tag} ${v.file}:${v.line}:${v.column} [${v.context}] ${v.literal}`);
    }
    if (level === 'error' && fails.length > 0) {
        console.error(`\nFAIL: ${fails.length} non-whitelisted gradient stop literal(s) detected.`);
        console.error(`Use CHART_TOKENS.* helpers (see app/js/chart-tokens.js).`);
        process.exit(1);
    }
    process.exit(0);
}
//# sourceMappingURL=lint-echarts-gradient.js.map