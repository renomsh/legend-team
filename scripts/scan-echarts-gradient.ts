/**
 * scan-echarts-gradient.ts — Phase 4 callable AST 스캐너 (PD-049 D-102)
 *
 * Detects ECharts gradient stop literals (hex / rgba) that bypass tokens.css
 * single-source-of-truth via runtime color injection.
 *
 * Scope (D-102 §5.1):
 *   <script> 블록 → AST → NewExpression(echarts.graphic.LinearGradient|RadialGradient)
 *   인수 stops 배열 안 ObjectExpression { offset, color: Literal } 검출.
 *   setOption({color|itemStyle.color|areaStyle.color: Literal}) 직속 검사도 포함.
 *
 * Out of scope (intentional, R-1 부분 mitigation):
 *   변수 인용, template literal 합성, theme 객체 spread, 외부 모듈 import.
 *   미수용 부분은 PD-051 후보로 분리.
 *
 * Whitelist:
 *   tokens.css `--c-chart-*` stop 4종 hex + α 0.33/0 라인의 rgba ( WARN ).
 *   그 외 hex/rgba → FAIL.
 */
import * as fs from 'fs';
import * as path from 'path';
import { Parser } from 'acorn';

export interface GradientViolation {
  file: string;
  line: number;
  column: number;
  context: 'LinearGradient' | 'RadialGradient' | 'setOption-color';
  literal: string;
  whitelisted: boolean; // true → WARN, false → FAIL
}

export interface ScanResult {
  violations: GradientViolation[];
  scannedFiles: number;
  scriptBlocks: number;
}

// 토큰 hex (Vera spec §5.2). 매칭 시 WARN.
const TOKEN_HEX = new Set([
  '#F472B6', '#8B5CF6', '#14B8A6', '#0891B2',
  // 기존 4 stop (확장)
].map(s => s.toUpperCase()));

// rgba whitelist: areaFade helper가 만드는 rgba(r,g,b,0.33|0)
const TOKEN_RGBA_RE = /^rgba\(\d+,\d+,\d+,(0|0\.0+|0\.33\d*)\)$/i;

function isHexLiteral(s: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(s);
}
function isRgbaLiteral(s: string): boolean {
  return /^rgba?\(/i.test(s);
}
function isWhitelisted(s: string): boolean {
  if (isHexLiteral(s)) return TOKEN_HEX.has(s.toUpperCase());
  if (isRgbaLiteral(s)) return TOKEN_RGBA_RE.test(s.replace(/\s+/g, ''));
  return false;
}

function extractScriptBlocks(html: string): { code: string; lineOffset: number }[] {
  const blocks: { code: string; lineOffset: number }[] = [];
  const re = /<script(?:\s[^>]*?)?>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const tagOpen = tag.split('>')[0] || '';
    if (/\ssrc\s*=/.test(tagOpen)) continue; // external src — skip
    const code = m[1] || '';
    const lineOffset = html.slice(0, m.index).split('\n').length - 1;
    blocks.push({ code, lineOffset });
  }
  return blocks;
}

function calleeMatches(node: any, members: string[]): boolean {
  // members = ['echarts','graphic','LinearGradient']
  let cur = node;
  for (let i = members.length - 1; i >= 0; i--) {
    if (i === 0) {
      return cur && cur.type === 'Identifier' && cur.name === members[i];
    }
    if (!cur || cur.type !== 'MemberExpression' || cur.computed) return false;
    if (!cur.property || cur.property.type !== 'Identifier' || cur.property.name !== members[i]) return false;
    cur = cur.object;
  }
  return false;
}

function walk(node: any, visit: (n: any) => void): void {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'parent' || key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue;
    const v = (node as any)[key];
    if (Array.isArray(v)) v.forEach(c => walk(c, visit));
    else if (v && typeof v === 'object' && typeof v.type === 'string') walk(v, visit);
  }
}

function checkStopsArray(arrNode: any, file: string, lineOffset: number, ctx: GradientViolation['context'], out: GradientViolation[]) {
  if (!arrNode || arrNode.type !== 'ArrayExpression') return;
  for (const el of arrNode.elements) {
    if (!el || el.type !== 'ObjectExpression') continue;
    for (const prop of el.properties) {
      if (prop.type !== 'Property' || prop.key.type !== 'Identifier' || prop.key.name !== 'color') continue;
      if (prop.value.type === 'Literal' && typeof prop.value.value === 'string') {
        const lit = prop.value.value;
        if (isHexLiteral(lit) || isRgbaLiteral(lit)) {
          out.push({
            file,
            line: (prop.value.loc?.start.line || 1) + lineOffset,
            column: prop.value.loc?.start.column || 0,
            context: ctx,
            literal: lit,
            whitelisted: isWhitelisted(lit)
          });
        }
      }
    }
  }
}

export function scanEchartsGradient(appDir: string): ScanResult {
  const violations: GradientViolation[] = [];
  let scannedFiles = 0;
  let scriptBlocks = 0;

  const files = fs.readdirSync(appDir).filter(f => f.endsWith('.html'));
  for (const fname of files) {
    const fpath = path.join(appDir, fname);
    const html = fs.readFileSync(fpath, 'utf8');
    scannedFiles++;
    const blocks = extractScriptBlocks(html);
    for (const blk of blocks) {
      scriptBlocks++;
      let ast: any;
      try {
        ast = Parser.parse(blk.code, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
      } catch {
        continue; // syntax error — skip block (out of scope)
      }
      walk(ast, (node: any) => {
        if (node.type === 'NewExpression') {
          const isLG = calleeMatches(node.callee, ['echarts', 'graphic', 'LinearGradient']);
          const isRG = calleeMatches(node.callee, ['echarts', 'graphic', 'RadialGradient']);
          if (isLG || isRG) {
            // 5th arg = stops array (LinearGradient(x0,y0,x1,y1,stops)).
            // RadialGradient(cx,cy,r,stops) → 4th arg.
            const stopsArg = isLG ? node.arguments[4] : node.arguments[3];
            checkStopsArray(stopsArg, fname, blk.lineOffset, isLG ? 'LinearGradient' : 'RadialGradient', violations);
          }
        }
      });
    }
  }
  return { violations, scannedFiles, scriptBlocks };
}

if (require.main === module) {
  const ROOT = path.resolve(__dirname, '..');
  const APP = path.join(ROOT, 'app');
  const r = scanEchartsGradient(APP);
  console.log(`[scan-echarts-gradient] files=${r.scannedFiles} scriptBlocks=${r.scriptBlocks}`);
  console.log(`  violations: ${r.violations.length}`);
  for (const v of r.violations) {
    const tag = v.whitelisted ? 'WARN' : 'FAIL';
    console.log(`  ${tag} ${v.file}:${v.line}:${v.column} [${v.context}] ${v.literal}`);
  }
}
