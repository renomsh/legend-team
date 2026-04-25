/**
 * Build script for Legend Team static viewer
 * Copies app/ source + memory/ + reports/ + logs/ into dist/
 * Generates:
 *   dist/data/manifest.json              — raw file inventory
 *   dist/data/published/topics_manifest.json — viewer-facing topic list (publish contract)
 *   dist/data/published/decisions_summary.json — decision ledger summary
 *
 * Usage: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const APP_SRC = path.join(ROOT, 'app');

// D-094 — legacy archive paths excluded from production tree (Phase 1 G1)
// Top-level dir name relative to app/. dist/app/legacy/ MUST NOT exist after build.
const LEGACY_TOP_DIRS = ['legacy', 'partials'];
// `partials/` is build-time inline only — source files are inlined into pages
// via <!-- @partial:* --> markers; the dir itself is not deployed.

// Directories to copy as data
const DATA_SOURCES = [
  { src: 'memory', dest: 'data/memory' },
  { src: 'reports', dest: 'data/reports' },
  { src: 'logs', dest: 'data/logs' }
];

// ── Utilities ──────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Partial inline (D-091, Phase 1 G1) ─────────────────────────────────────
// Single-pass marker replacement on dist HTML files. Source app/ untouched.
// Marker format: <!-- @partial:<id> --> where <id> matches app/partials/<id>.html
const PARTIAL_DIR = path.join(APP_SRC, 'partials');
const PARTIAL_MARKER_RE = /<!--\s*@partial:([a-z0-9-]+)\s*-->/g;

function loadPartials() {
  const partials = {};
  if (!fs.existsSync(PARTIAL_DIR)) return partials;
  for (const f of fs.readdirSync(PARTIAL_DIR)) {
    if (!f.endsWith('.html')) continue;
    const id = f.replace(/\.html$/, '');
    partials[id] = fs.readFileSync(path.join(PARTIAL_DIR, f), 'utf8');
  }
  return partials;
}

function applyPartialsToDist(distAppDir, partials) {
  let totalReplaced = 0;
  let missing = 0;
  const stack = [distAppDir];
  while (stack.length) {
    const cur = stack.pop();
    if (!fs.existsSync(cur)) continue;
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) { stack.push(p); continue; }
      if (!ent.name.endsWith('.html')) continue;
      let html = fs.readFileSync(p, 'utf8');
      let changed = false;
      html = html.replace(PARTIAL_MARKER_RE, (m, id) => {
        if (partials[id] !== undefined) {
          changed = true; totalReplaced++;
          return partials[id];
        }
        console.warn(`[build] missing partial: ${id} in ${path.relative(DIST, p)}`);
        missing++;
        return m;
      });
      if (changed) fs.writeFileSync(p, html, 'utf8');
    }
  }
  return { totalReplaced, missing };
}

function listFilesRecursive(dir, base = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(path.join(dir, entry.name), relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// ── Published Manifest ─────────────────────────────────────────────────────

/**
 * Generate viewer-facing topics_manifest.json from topic_index.json.
 * Only includes fields safe for the viewer (no raw control-plane paths leaked).
 */
function buildTopicsManifest() {
  const indexPath = path.join(ROOT, 'memory/shared/topic_index.json');
  const raw = readJsonSafe(indexPath);
  if (!raw || !Array.isArray(raw.topics)) {
    console.warn('[build] Could not read topic_index.json — skipping topics_manifest');
    return null;
  }

  const warnings = [];

  const topics = raw.topics.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    created: t.created,
    reportPath: t.reportPath ?? null,
    reportFiles: t.reportFiles ?? [],
    published: t.published ?? false,
    outcome: t.outcome ?? null,
    note: t.note ?? null,
    masterDecisions: t.masterDecisions ?? [],
  }));

  // Cross-validate: check that every registered reportFile actually exists on disk
  for (const t of topics) {
    if (!t.reportPath || !t.reportFiles.length) continue;
    for (const f of t.reportFiles) {
      const filePath = path.join(ROOT, t.reportPath, f);
      if (!fs.existsSync(filePath)) {
        warnings.push(`[build] WARN: ${t.id} (${t.reportPath}/${f}) registered in topic_index but file not found on disk`);
      }
    }
  }

  if (warnings.length > 0) {
    warnings.forEach(w => console.warn(w));
    console.warn(`[build] ${warnings.length} missing report file(s) detected — viewer will show errors for these topics`);
    // Fail the build if any published topic has missing files
    const publishedMissing = topics.filter(t => t.published && t.reportFiles.some(
      f => !fs.existsSync(path.join(ROOT, t.reportPath, f))
    ));
    if (publishedMissing.length > 0) {
      console.error(`[build] FATAL: ${publishedMissing.map(t => t.id).join(', ')} marked published but missing report files — aborting build`);
      process.exit(1);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    topics,
    buildWarnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Generate viewer-facing decisions_summary.json from decision_ledger.json.
 * Includes all decisions as-is (already viewer-safe).
 */
function buildDecisionsSummary() {
  const ledgerPath = path.join(ROOT, 'memory/shared/decision_ledger.json');
  const raw = readJsonSafe(ledgerPath);
  if (!raw) {
    console.warn('[build] Could not read decision_ledger.json — skipping decisions_summary');
    return null;
  }
  return {
    generatedAt: new Date().toISOString(),
    decisions: raw.decisions ?? [],
  };
}

// ── Main Build ─────────────────────────────────────────────────────────────

function build() {
  console.log('[build] Starting...');

  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync
      ? fs.rmSync(DIST, { recursive: true, force: true })
      : fs.rmdirSync(DIST, { recursive: true });
    console.log('[build] Cleaned dist/');
  }
  ensureDir(DIST);

  // Copy app source files (HTML, CSS, JS) — D-094 legacy/partials excluded
  const appEntries = fs.readdirSync(APP_SRC, { withFileTypes: true });
  for (const entry of appEntries) {
    if (entry.isDirectory() && LEGACY_TOP_DIRS.includes(entry.name)) {
      console.log(`[build] Skipping app/${entry.name}/ (excluded from production)`);
      continue;
    }
    const srcPath = path.join(APP_SRC, entry.name);
    const destPath = path.join(DIST, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  console.log('[build] Copied app/ source files');

  // D-091 partial inline — replace <!-- @partial:* --> markers in dist HTML
  const partials = loadPartials();
  const partialIds = Object.keys(partials);
  if (partialIds.length > 0) {
    const r = applyPartialsToDist(DIST, partials);
    console.log(`[build] Applied partials: ${partialIds.length} loaded (${partialIds.join(', ')}), ${r.totalReplaced} markers replaced, ${r.missing} missing`);
  } else {
    console.log('[build] No partials directory; skipping partial inline');
  }

  // Copy data directories
  const fileManifest = {};
  for (const { src, dest } of DATA_SOURCES) {
    const srcPath = path.join(ROOT, src);
    const destPath = path.join(DIST, dest);
    if (fs.existsSync(srcPath)) {
      copyDirRecursive(srcPath, destPath);
      fileManifest[src] = listFilesRecursive(srcPath);
      console.log(`[build] Copied ${src}/ → ${dest}/ (${fileManifest[src].length} files)`);
    } else {
      console.log(`[build] Skipping ${src}/ (not found)`);
      fileManifest[src] = [];
    }
  }

  // Generate raw file manifest (legacy, kept for backward compat)
  const rawManifestPath = path.join(DIST, 'data', 'manifest.json');
  ensureDir(path.join(DIST, 'data'));
  fs.writeFileSync(rawManifestPath, JSON.stringify(fileManifest, null, 2));
  console.log('[build] Generated data/manifest.json');

  // Generate published/ artifacts
  const publishedDir = path.join(DIST, 'data', 'published');
  ensureDir(publishedDir);

  // topics_manifest.json — required for viewer topic list
  const topicsManifest = buildTopicsManifest();
  if (topicsManifest) {
    fs.writeFileSync(
      path.join(publishedDir, 'topics_manifest.json'),
      JSON.stringify(topicsManifest, null, 2)
    );
    console.log(`[build] Generated data/published/topics_manifest.json (${topicsManifest.topics.length} topics)`);
  }

  // decisions_summary.json — optional but useful for viewer
  const decisionsSummary = buildDecisionsSummary();
  if (decisionsSummary) {
    fs.writeFileSync(
      path.join(publishedDir, 'decisions_summary.json'),
      JSON.stringify(decisionsSummary, null, 2)
    );
    console.log(`[build] Generated data/published/decisions_summary.json (${decisionsSummary.decisions.length} decisions)`);
  }

  // Summary
  const totalFiles = Object.values(fileManifest).reduce((a, b) => a + b.length, 0);
  console.log(`[build] Done. dist/ ready with ${totalFiles} data files + published/ artifacts.`);
}

build();
