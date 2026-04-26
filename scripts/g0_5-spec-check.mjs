#!/usr/bin/env node
// g0_5-spec-check.mjs — D-100 / topic_110 Phase A 산출물.
// 정본 = memory/specs/ia-spec.md + app/dashboard-upgrade.html canonical
//      + memory/specs/page-checklist/<page>.md 6종.
// 본 스크립트는 page-checklist를 walk → frontmatter 파싱 → app HTML 검증.
// 외부 의존 없음 (Node 내장 fs/path만 사용). HTML 파싱은 정규식 기반 카운트.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CHECKLIST_DIR = join(ROOT, 'memory', 'specs', 'page-checklist');
const SIDEBAR_PARTIAL = join(ROOT, 'app', 'partials', 'sidebar.html');

// --- arg parse ---
const args = process.argv.slice(2);
let mode = 'report';
for (const a of args) {
  if (a.startsWith('--mode=')) mode = a.split('=')[1];
}
if (!['report', 'enforce'].includes(mode)) {
  console.error(`unknown mode: ${mode}. use --mode=report or --mode=enforce`);
  process.exit(2);
}

// --- minimal YAML frontmatter parser (sufficient for our shape) ---
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const body = m[1];
  const fm = {};
  const lines = body.split(/\r?\n/);
  let curKey = null;
  let curList = null;
  let curObj = null;
  let curObjKey = null;
  let listItem = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    // top-level "key: value" or "key:"
    const top = line.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (top && !line.startsWith(' ') && !line.startsWith('\t')) {
      const [, k, v] = top;
      curKey = k;
      listItem = null;
      if (v === '' || v === undefined) {
        // could be list or object
        // peek next non-empty line
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        if (j < lines.length && /^\s+- /.test(lines[j])) {
          fm[k] = [];
          curList = fm[k];
          curObj = null;
        } else if (j < lines.length && /^\s+/.test(lines[j])) {
          fm[k] = {};
          curObj = fm[k];
          curList = null;
        } else {
          fm[k] = null;
          curList = null;
          curObj = null;
        }
      } else {
        fm[k] = parseScalar(v);
        curList = null;
        curObj = null;
      }
      continue;
    }

    // list item start: "  - key: val" or "  - val"
    const liStart = line.match(/^\s+-\s+(.*)$/);
    if (liStart && curList) {
      const rest = liStart[1];
      const kv = rest.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
      if (kv) {
        listItem = {};
        listItem[kv[1]] = parseScalar(kv[2]);
        curList.push(listItem);
      } else {
        curList.push(parseScalar(rest));
        listItem = null;
      }
      continue;
    }

    // continuation of list item: "    key: val"
    const liCont = line.match(/^\s{4,}([A-Za-z_][\w]*):\s*(.*)$/);
    if (liCont && listItem) {
      listItem[liCont[1]] = parseScalar(liCont[2]);
      continue;
    }

    // object key under top-level: "  key: val" or "  '.foo': N"
    const objKv = line.match(/^\s+(['"]?)([^:'"]+)\1:\s*(.*)$/);
    if (objKv && curObj) {
      curObj[objKv[2]] = parseScalar(objKv[3]);
      continue;
    }
  }
  return fm;
}

function parseScalar(v) {
  if (v === undefined || v === null) return null;
  v = v.trim();
  if (v === '') return null;
  if (v === 'null') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  // strip quotes
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

// --- HTML check helpers (regex-based, sufficient for class counting) ---
function countSelector(html, selector) {
  // Special case: build-time partial marker for sidebar counts as aside.sidebar.
  // Source HTML carries `<!-- @partial:sidebar -->` and build.js injects partials/sidebar.html.
  if (/aside\.sidebar|aside\b\.sidebar/.test(selector) || selector.trim() === 'aside.sidebar') {
    if (/<!--\s*@partial:sidebar\s*-->/i.test(html)) return 1;
  }
  // Supports: 'tag', '.class', 'tag.class', 'tag.class .class' (descendant via 2 segments naive)
  // For simplicity: split on whitespace, count last segment occurrences (good enough for our specs).
  const seg = selector.trim().split(/\s+/).pop();
  if (seg.startsWith('.')) {
    const cls = seg.slice(1);
    // count occurrences of class= attribute containing this class as whole word
    const re = new RegExp(`class\\s*=\\s*["'][^"']*\\b${escapeRe(cls)}\\b[^"']*["']`, 'g');
    return (html.match(re) || []).length;
  }
  const m = seg.match(/^([a-zA-Z][\w-]*)(\.([\w-]+))?$/);
  if (m) {
    const tag = m[1];
    const cls = m[3];
    if (cls) {
      const re = new RegExp(`<${tag}\\b[^>]*class\\s*=\\s*["'][^"']*\\b${escapeRe(cls)}\\b[^"']*["']`, 'gi');
      return (html.match(re) || []).length;
    }
    const re = new RegExp(`<${tag}\\b`, 'gi');
    return (html.match(re) || []).length;
  }
  return 0;
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function stripHtmlText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

// --- sidebar partial parse (for sidebar_entry consistency) ---
let sidebarPaths = new Set();
let sidebarMenus = new Set();
if (existsSync(SIDEBAR_PARTIAL)) {
  const sb = readFileSync(SIDEBAR_PARTIAL, 'utf8');
  const hrefRe = /href=["']([^"']+\.html)["']/g;
  let m;
  while ((m = hrefRe.exec(sb))) sidebarPaths.add(m[1]);
  // menu labels extracted from nav-item text
  const navItemRe = /<a[^>]*class=["'][^"']*\bnav-item\b[^"']*["'][^>]*>[\s\S]*?<\/a>/g;
  const labels = sb.match(navItemRe) || [];
  for (const a of labels) {
    const t = stripHtmlText(a).trim();
    if (t) sidebarMenus.add(t);
  }
}

// --- main walk ---
const files = readdirSync(CHECKLIST_DIR).filter((f) => f.endsWith('.md'));
const results = [];

for (const f of files) {
  const path = join(CHECKLIST_DIR, f);
  const text = readFileSync(path, 'utf8');
  const fm = parseFrontmatter(text);
  const result = {
    checklist: f,
    page: fm?.page,
    completeness: fm?.spec_completeness || 'full',
    status: 'PASS',
    gaps: [],
  };
  if (!fm) {
    result.status = 'FAIL';
    result.gaps.push('frontmatter 파싱 실패');
    results.push(result);
    continue;
  }

  const pagePath = fm.page ? join(ROOT, fm.page) : null;
  const pageExists = pagePath && existsSync(pagePath);

  if (!pageExists) {
    if (result.completeness === 'minimal') {
      result.status = 'WARN';
      result.gaps.push(`page 파일 부재: ${fm.page} (minimal — warn)`);
      results.push(result);
      continue;
    } else {
      result.status = 'FAIL';
      result.gaps.push(`page 파일 부재: ${fm.page}`);
      results.push(result);
      continue;
    }
  }

  const html = readFileSync(pagePath, 'utf8');
  const text2 = stripHtmlText(html);

  // required_selectors
  for (const sel of fm.required_selectors || []) {
    const cnt = countSelector(html, sel.selector);
    if (sel.min_count !== undefined && sel.min_count !== null && cnt < sel.min_count) {
      result.status = 'FAIL';
      result.gaps.push(`selector '${sel.selector}' count=${cnt} < min=${sel.min_count}`);
    }
    if (sel.max_count !== undefined && sel.max_count !== null && cnt > sel.max_count) {
      result.status = 'FAIL';
      result.gaps.push(`selector '${sel.selector}' count=${cnt} > max=${sel.max_count}`);
    }
  }

  // required_keywords
  for (const kw of fm.required_keywords || []) {
    if (!text2.includes(kw)) {
      result.status = 'FAIL';
      result.gaps.push(`keyword 미발견: "${kw}"`);
    }
  }

  // canonical_class_min_usage
  for (const [cls, min] of Object.entries(fm.canonical_class_min_usage || {})) {
    const cnt = countSelector(html, cls);
    if (cnt < min) {
      result.status = 'FAIL';
      result.gaps.push(`canonical class ${cls} count=${cnt} < min=${min}`);
    }
  }

  // sidebar_entry consistency
  if (fm.sidebar_entry) {
    const { menu, path: navPath } = fm.sidebar_entry;
    if (navPath && !sidebarPaths.has(navPath)) {
      result.status = result.status === 'FAIL' ? 'FAIL' : 'WARN';
      result.gaps.push(`sidebar partial에 path '${navPath}' 미존재`);
    }
    if (menu && !sidebarMenus.has(menu)) {
      // soft check — many menus include the literal
      const found = [...sidebarMenus].some((m) => m.includes(menu));
      if (!found) {
        result.status = result.status === 'FAIL' ? 'FAIL' : 'WARN';
        result.gaps.push(`sidebar partial에 menu label '${menu}' 미발견`);
      }
    }
  }

  results.push(result);
}

// --- output ---
console.log('');
console.log('=== g0_5-spec-check.mjs (mode=' + mode + ') ===');
console.log('');
let failCount = 0;
let warnCount = 0;
for (const r of results) {
  console.log(`[${r.status}] ${r.checklist} → ${r.page} (completeness: ${r.completeness})`);
  for (const g of r.gaps) console.log(`    - ${g}`);
  if (r.status === 'FAIL') failCount++;
  if (r.status === 'WARN') warnCount++;
}
console.log('');
console.log(`총 ${results.length}건 / PASS ${results.length - failCount - warnCount} / WARN ${warnCount} / FAIL ${failCount}`);

if (mode === 'enforce' && failCount > 0) {
  console.log('');
  console.log('enforce 모드 — FAIL 발생, exit 1');
  process.exit(1);
}
process.exit(0);
