#!/usr/bin/env node
/**
 * Zero invocation gate (PD-073 / topic_191).
 *
 * Returns JSON to stdout indicating whether Zero refinement should run for this close.
 *
 * Decision rule: Zero skips when no code-bearing files changed since last commit
 * (working tree + staged), since Zero's 3 scopes (tech-debt / security / simplify)
 * all act on code or hook/skill definitions. Reports/memory/logs auto-mutate every
 * session and are not refinement targets.
 *
 * In-scope path patterns (any change here → Zero recommended):
 *   - scripts/**\/*.{ts,js,cjs,mjs}
 *   - .claude/hooks/**
 *   - .claude/skills/**
 *   - .claude/commands/**
 *   - app/**\/*.{ts,tsx,js,jsx}
 *   - CLAUDE.md
 *   - package.json, tsconfig*.json
 *
 * Out-of-scope (ignored): reports/, memory/, logs/, dist/, node_modules/.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function gitFiles() {
  // Working tree (modified/untracked) + staged + diff vs HEAD.
  // --porcelain gives `XY path` lines; -z would be safer for spaces but our paths are ASCII.
  let porcelain = '';
  let diffHead = '';
  try {
    porcelain = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' });
  } catch {}
  try {
    diffHead = execSync('git diff HEAD --name-only', { cwd: ROOT, encoding: 'utf8' });
  } catch {}
  const set = new Set();
  for (const line of porcelain.split('\n')) {
    if (!line.trim()) continue;
    // strip 2-char status + space
    const p = line.slice(3).trim();
    // handle "old -> new" rename
    const target = p.includes(' -> ') ? p.split(' -> ').pop() : p;
    set.add(target);
  }
  for (const line of diffHead.split('\n')) {
    const t = line.trim();
    if (t) set.add(t);
  }
  return Array.from(set);
}

function isInScope(file) {
  const f = file.replace(/\\/g, '/');
  // out-of-scope shortcuts
  if (f.startsWith('reports/')) return false;
  if (f.startsWith('memory/')) return false;
  if (f.startsWith('logs/')) return false;
  if (f.startsWith('dist/')) return false;
  if (f.startsWith('node_modules/')) return false;
  // in-scope rules
  if (/^scripts\/.+\.(ts|js|cjs|mjs)$/.test(f)) return true;
  if (/^\.claude\/hooks\//.test(f)) return true;
  if (/^\.claude\/skills\//.test(f)) return true;
  if (/^\.claude\/commands\//.test(f)) return true;
  if (/^app\/.+\.(ts|tsx|js|jsx)$/.test(f)) return true;
  if (f === 'CLAUDE.md') return true;
  if (f === 'package.json') return true;
  if (/^tsconfig.*\.json$/.test(f)) return true;
  return false;
}

function main() {
  const all = gitFiles();
  const inScope = all.filter(isInScope);
  const recommend = inScope.length > 0;
  const result = {
    recommend_zero: recommend,
    in_scope_count: inScope.length,
    in_scope_files: inScope.slice(0, 20),
    total_changed: all.length,
    skip_reason: recommend ? null : 'no in-scope code/hook/skill changes',
  };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

main();
