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
exports.extractRootBlocks = extractRootBlocks;
exports.scanInlineRoot = scanInlineRoot;
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const COLOR_TOKEN_RE = /^--c-(ace|arki|fin|riki|dev|vera|edi|nova)$/;
const LAYOUT_TOKEN_RE = /^--(space|radius|fs|bp|container)-/;
const BASE_TOKEN_RE = /^--(text|panel|bg|line|brand|grad)(-|$)/;
const LEGACY_PATTERN = /dashboard-v3.*-test\.html$/;
function classifyToken(name) {
    if (COLOR_TOKEN_RE.test(name))
        return 'color';
    if (LAYOUT_TOKEN_RE.test(name))
        return 'layout';
    if (BASE_TOKEN_RE.test(name))
        return 'base';
    return 'other';
}
/**
 * Extract :root{ ... } blocks that appear inside <style>...</style> regions.
 * Line numbers are 1-based.
 */
function extractRootBlocks(content) {
    const blocks = [];
    // Collect <style>...</style> regions (ignore @media wrappers; we still scan inside)
    const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let m;
    while ((m = styleRe.exec(content)) !== null) {
        const styleBody = m[1] ?? '';
        if (!styleBody)
            continue;
        const styleAbsStart = m.index + m[0].indexOf(styleBody);
        // Find :root { ... } occurrences (allow nested @media by simple brace-balance)
        const rootRe = /:root\s*\{/g;
        let r;
        while ((r = rootRe.exec(styleBody)) !== null) {
            const openIdx = r.index + r[0].length - 1; // position of '{'
            // brace match
            let depth = 1;
            let i = openIdx + 1;
            while (i < styleBody.length && depth > 0) {
                const ch = styleBody[i];
                if (ch === '{')
                    depth++;
                else if (ch === '}')
                    depth--;
                i++;
            }
            if (depth !== 0)
                break; // malformed
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
function extractCustomPropNames(rootBlockBody) {
    const names = [];
    // strip the outer ":root { ... }" wrapper to its inner contents
    const inner = rootBlockBody.replace(/^[^{]*\{/, '').replace(/\}\s*$/, '');
    // naive split on ';' — sufficient because custom props are flat declarations
    const decls = inner.split(';');
    for (const decl of decls) {
        const t = decl.trim();
        if (!t)
            continue;
        const colonIdx = t.indexOf(':');
        if (colonIdx <= 0)
            continue;
        const lhs = t.slice(0, colonIdx).trim();
        if (lhs.startsWith('--'))
            names.push(lhs);
    }
    return names;
}
function scanInlineRoot(appDir) {
    const entries = fs.readdirSync(appDir, { withFileTypes: true })
        .filter(e => e.isFile() && e.name.endsWith('.html'))
        .map(e => e.name)
        .sort();
    const perFileDumps = [];
    let pagesWithColor = 0;
    let pagesWithLayout = 0;
    let totalBlocks = 0;
    const g1LintTargetPages = [];
    const pdDeferralLayoutPages = [];
    for (const name of entries) {
        const fp = path.join(appDir, name);
        const content = fs.readFileSync(fp, 'utf8');
        const blocks = extractRootBlocks(content);
        const isLegacy = LEGACY_PATTERN.test(name);
        const dump = {
            file: `app/${name}`,
            active: !isLegacy,
            rootBlocks: blocks.map(b => {
                const propNames = extractCustomPropNames(b.body);
                const colorTokens = [];
                const layoutTokens = [];
                const baseTokens = [];
                const otherTokens = [];
                for (const n of propNames) {
                    const c = classifyToken(n);
                    if (c === 'color')
                        colorTokens.push(n);
                    else if (c === 'layout')
                        layoutTokens.push(n);
                    else if (c === 'base')
                        baseTokens.push(n);
                    else
                        otherTokens.push(n);
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
        if (hasColor)
            pagesWithColor++;
        if (hasLayout)
            pagesWithLayout++;
        if (dump.active && hasColor)
            g1LintTargetPages.push(dump.file);
        if (dump.active && hasLayout)
            pdDeferralLayoutPages.push(dump.file);
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
    if (!fs.existsSync(OUT_DIR))
        fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2), 'utf8');
    // Console evidence summary
    console.log('SCAN_DONE');
    console.log(`scannedFiles: ${result.scannedFiles}`);
    console.log(`active: ${result.activeFiles}  legacy: ${result.legacyFiles}`);
    console.log(`totalRootBlocks: ${result.summary.totalRootBlocks}`);
    console.log(`pagesWithColorTokenDuplication: ${result.summary.pagesWithColorTokenDuplication}`);
    console.log(`pagesWithLayoutTokenDuplication: ${result.summary.pagesWithLayoutTokenDuplication}`);
    console.log(`g1LintTargetPages (active+color): ${result.summary.g1LintTargetPages.length}`);
    for (const p of result.summary.g1LintTargetPages)
        console.log(`  - ${p}`);
    console.log(`pdDeferralLayoutPages (active+layout): ${result.summary.pdDeferralLayoutPages.length}`);
    for (const p of result.summary.pdDeferralLayoutPages)
        console.log(`  - ${p}`);
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
//# sourceMappingURL=scan-inline-root.js.map