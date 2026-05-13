#!/usr/bin/env node
// Q4: active 아닌 D-NNN 인용 검출 (WARN-only)
// usage: node scripts/validate-decision-citations.js [staged|all]

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LEDGER = path.join(ROOT, 'memory/shared/decision_ledger.json');

const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
const statusMap = {};
ledger.decisions.forEach(d => { statusMap[d.id] = d.status || 'active'; });

const EXCLUDE = [
  'memory/shared/decision_ledger.json',
  'memory/sessions/',
  'memory/master/',
  'reports/',
  'topics/',
  'dist/',
  'node_modules/',
  '.git/',
  'scripts/validate-decision-citations',
  'backups/',
];

const SCAN_ALL_PATTERNS = [
  'CLAUDE.md',
  '.claude/hooks',
  '.claude/skills',
  '.claude/commands',
  'memory/roles',
  'memory/shared/dispatch_config.json',
  'memory/shared/nexus_memory_open.json',
];

function shouldExclude(p) {
  return EXCLUDE.some(e => p.replace(/\\/g, '/').includes(e));
}

function walkDir(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full, results);
    else results.push(full);
  }
  return results;
}

const mode = process.argv[2] || 'staged';
let files = [];

if (mode === 'staged') {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACM', { cwd: ROOT }).toString().trim();
    files = out ? out.split('\n').map(f => path.join(ROOT, f)) : [];
  } catch { files = []; }
} else {
  for (const pat of SCAN_ALL_PATTERNS) {
    const full = path.join(ROOT, pat);
    if (!fs.existsSync(full)) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkDir(full, files);
    else files.push(full);
  }
}

const D_RE = /\bD-(\d{3,})(?![-\d])/g;
const warnings = [];

for (const absPath of files) {
  const rel = path.relative(ROOT, absPath).replace(/\\/g, '/');
  if (shouldExclude(rel)) continue;
  if (!fs.existsSync(absPath)) continue;

  let content;
  try { content = fs.readFileSync(absPath, 'utf8'); } catch { continue; }

  const lines = content.split('\n');
  lines.forEach((line, i) => {
    D_RE.lastIndex = 0;
    let m;
    while ((m = D_RE.exec(line)) !== null) {
      const id = `D-${m[1]}`;
      const status = statusMap[id];
      if (status && status !== 'active') {
        warnings.push({ file: rel, line: i + 1, id, status, text: line.trim().substring(0, 80) });
      }
    }
  });
}

if (warnings.length > 0) {
  console.error('\n[Q4] WARN: deprecated/superseded D-NNN 인용 발견\n');
  warnings.forEach(w => {
    console.error(`  ${w.file}:${w.line}  ${w.id} [${w.status}]`);
    console.error(`    ${w.text}`);
  });
  console.error(`\n  총 ${warnings.length}건 — active D-NNN만 정책 인용 가능\n`);
}

const scanned = files.filter(f => !shouldExclude(path.relative(ROOT, f).replace(/\\/g, '/'))).length;
console.log(`[Q4] ${scanned}개 파일 검사 완료, ${warnings.length}개 경고`);
process.exit(0);
