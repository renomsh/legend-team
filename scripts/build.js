/**
 * Build script for Legend Nexus static viewer
 * Copies app/ source + memory/ + reports/ + logs/ into dist/
 * Generates:
 *   dist/data/manifest.json              — raw file inventory
 *   dist/data/published/topics_manifest.json — viewer-facing topic list (publish contract)
 *   dist/data/published/decisions_summary.json — decision ledger summary
 *
 * Incremental build:
 *   - First build (dist/ absent) or --full flag: full copy
 *   - Subsequent builds: git diff --name-only HEAD~1 HEAD determines changed files
 *     → only changed files in app/, memory/, reports/, logs/ are re-copied
 *     → deleted files are removed from dist/
 *   - data/ generated artifacts (topics_manifest, decisions_summary) always regenerated
 *
 * Usage: node scripts/build.js [--full]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// ── Incremental build utilities ────────────────────────────────────────────

/**
 * Get list of files changed between HEAD~1 and HEAD via git diff.
 * Returns { changed: string[], deleted: string[] } — paths relative to repo root.
 * Falls back to null if git is unavailable or repo has only 1 commit.
 */
function getGitChangedFiles() {
  try {
    const raw = execSync('git diff --name-status HEAD~1 HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const changed = [];
    const deleted = [];
    for (const line of raw.trim().split('\n')) {
      if (!line) continue;
      // Format: STATUS\tPATH (R100\tOLD\tNEW for renames)
      const parts = line.split('\t');
      const status = parts[0];
      if (status.startsWith('R')) {
        // Rename: old path deleted, new path changed
        deleted.push(parts[1]);
        changed.push(parts[2]);
      } else if (status === 'D') {
        deleted.push(parts[1]);
      } else {
        // A, M, C, etc.
        changed.push(parts[1]);
      }
    }
    return { changed, deleted };
  } catch {
    return null; // git unavailable or single-commit repo
  }
}

/**
 * Check whether dist/ has the expected top-level structure.
 * Returns false if dist/ is absent or empty (triggers full build).
 */
function distIsValid() {
  if (!fs.existsSync(DIST)) return false;
  const entries = fs.readdirSync(DIST);
  return entries.length > 0;
}

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
    grade: t.grade ?? null,
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

// ── Full build helpers ─────────────────────────────────────────────────────

function fullBuildApp() {
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
  console.log('[build] Copied app/ source files (full)');
}

function fullBuildDataSources() {
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
  return fileManifest;
}

// ── Incremental build helpers ──────────────────────────────────────────────

/**
 * Given a repo-relative path like "app/foo/bar.html",
 * return the corresponding dist/ absolute path.
 * Returns null if path doesn't map to a known dist location.
 */
function srcPathToDistPath(repoRelPath) {
  const normalized = repoRelPath.replace(/\\/g, '/');

  // app/ → dist/ (top level, legacy/partials excluded)
  if (normalized.startsWith('app/')) {
    const rel = normalized.slice('app/'.length);
    const topDir = rel.split('/')[0];
    if (LEGACY_TOP_DIRS.includes(topDir)) return null;
    return path.join(DIST, rel);
  }

  // DATA_SOURCES: memory/ → dist/data/memory/, reports/ → dist/data/reports/, etc.
  for (const { src, dest } of DATA_SOURCES) {
    if (normalized.startsWith(src + '/') || normalized === src) {
      const rel = normalized.slice(src.length + 1);
      return path.join(DIST, dest, rel);
    }
  }

  return null; // not a managed path (scripts/, etc.)
}

/**
 * Incrementally sync changed files into dist/.
 * Returns { copied, deleted, skipped } counts.
 */
function incrementalSync(changedFiles, deletedFiles) {
  let copied = 0;
  let deleted = 0;
  let skipped = 0;

  // Handle changed/added files
  for (const repoRel of changedFiles) {
    const distPath = srcPathToDistPath(repoRel);
    if (!distPath) { skipped++; continue; }

    const srcAbs = path.join(ROOT, repoRel);
    if (!fs.existsSync(srcAbs)) {
      // File was reported changed but doesn't exist — treat as deleted
      if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { force: true });
        deleted++;
      }
      continue;
    }

    ensureDir(path.dirname(distPath));
    fs.copyFileSync(srcAbs, distPath);
    copied++;
  }

  // Handle deleted files
  for (const repoRel of deletedFiles) {
    const distPath = srcPathToDistPath(repoRel);
    if (!distPath) { skipped++; continue; }

    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { force: true });
      // Remove empty parent dirs up to dist/
      removeEmptyDirs(path.dirname(distPath));
      deleted++;
    }
  }

  return { copied, deleted, skipped };
}

/**
 * Remove empty directories up the tree until dist/ boundary.
 */
function removeEmptyDirs(dir) {
  if (!dir.startsWith(DIST) || dir === DIST) return;
  try {
    const entries = fs.readdirSync(dir);
    if (entries.length === 0) {
      fs.rmdirSync(dir);
      removeEmptyDirs(path.dirname(dir));
    }
  } catch {
    // ignore — dir may have already been removed
  }
}

// ── Main Build ─────────────────────────────────────────────────────────────

function build() {
  const forceFullBuild = process.argv.includes('--full');
  const needFullBuild = forceFullBuild || !distIsValid();

  if (needFullBuild) {
    const reason = forceFullBuild ? '--full flag' : 'dist/ absent or empty';
    console.log(`[build] Full build (${reason})...`);

    // Clean dist contents (preserve folder to avoid EPERM on ACL-restricted dirs)
    if (fs.existsSync(DIST)) {
      for (const entry of fs.readdirSync(DIST, { withFileTypes: true })) {
        fs.rmSync(path.join(DIST, entry.name), { recursive: true, force: true });
      }
      console.log('[build] Cleaned dist/');
    }
    ensureDir(DIST);

    fullBuildApp();

    // D-091 partial inline
    const partials = loadPartials();
    const partialIds = Object.keys(partials);
    if (partialIds.length > 0) {
      const r = applyPartialsToDist(DIST, partials);
      console.log(`[build] Applied partials: ${partialIds.length} loaded (${partialIds.join(', ')}), ${r.totalReplaced} markers replaced, ${r.missing} missing`);
    } else {
      console.log('[build] No partials directory; skipping partial inline');
    }

    const fileManifest = fullBuildDataSources();

    // Generate raw file manifest
    ensureDir(path.join(DIST, 'data'));
    fs.writeFileSync(
      path.join(DIST, 'data', 'manifest.json'),
      JSON.stringify(fileManifest, null, 2)
    );
    console.log('[build] Generated data/manifest.json');

    // Generate published/ artifacts (always regenerated)
    generatePublishedArtifacts();

    const totalFiles = Object.values(fileManifest).reduce((a, b) => a + b.length, 0);
    console.log(`[build] Done (full). dist/ ready with ${totalFiles} data files + published/ artifacts.`);

  } else {
    // Incremental build
    const gitChanges = getGitChangedFiles();

    if (!gitChanges) {
      // Cannot determine changes (single-commit repo, git unavailable, etc.) → full build
      console.log('[build] Cannot determine git changes — falling back to full build...');
      // Re-run as full by recursion with forced flag
      process.argv.push('--full');
      build();
      return;
    }

    console.log(`[build] Incremental build. Changed: ${gitChanges.changed.length}, Deleted: ${gitChanges.deleted.length}`);

    // app/ changes: also re-apply partials to affected HTML files
    const appChanged = gitChanges.changed.filter(p => p.startsWith('app/'));
    const appDeleted = gitChanges.deleted.filter(p => p.startsWith('app/'));

    // data source changes
    const dataChanged = gitChanges.changed.filter(p =>
      DATA_SOURCES.some(({ src }) => p.startsWith(src + '/') || p === src)
    );
    const dataDeleted = gitChanges.deleted.filter(p =>
      DATA_SOURCES.some(({ src }) => p.startsWith(src + '/') || p === src)
    );

    const all = {
      changed: [...appChanged, ...dataChanged],
      deleted: [...appDeleted, ...dataDeleted],
    };

    if (all.changed.length === 0 && all.deleted.length === 0) {
      console.log('[build] No relevant file changes detected — skipping file sync.');
    } else {
      const result = incrementalSync(all.changed, all.deleted);
      console.log(`[build] Incremental sync: ${result.copied} copied, ${result.deleted} deleted, ${result.skipped} skipped (unmanaged paths)`);

      // Re-apply partials to any HTML files that were changed
      const htmlChanged = appChanged.filter(p => p.endsWith('.html'));
      const partialFilesChanged = gitChanges.changed.some(p => p.startsWith('app/partials/'));
      if (htmlChanged.length > 0 || partialFilesChanged) {
        const partials = loadPartials();
        if (Object.keys(partials).length > 0) {
          if (partialFilesChanged) {
            // Partials themselves changed — re-apply to all HTML in dist
            const r = applyPartialsToDist(DIST, partials);
            console.log(`[build] Re-applied partials to all HTML (partials changed): ${r.totalReplaced} markers replaced`);
          } else {
            // Only specific HTML files changed — re-apply partials to those
            let totalReplaced = 0;
            for (const repoRel of htmlChanged) {
              const distPath = srcPathToDistPath(repoRel);
              if (!distPath || !fs.existsSync(distPath)) continue;
              let html = fs.readFileSync(distPath, 'utf8');
              let changed = false;
              html = html.replace(/<!--\s*@partial:([a-z0-9-]+)\s*-->/g, (m, id) => {
                if (partials[id] !== undefined) { changed = true; totalReplaced++; return partials[id]; }
                return m;
              });
              if (changed) fs.writeFileSync(distPath, html, 'utf8');
            }
            if (totalReplaced > 0) {
              console.log(`[build] Re-applied partials to ${htmlChanged.length} changed HTML file(s): ${totalReplaced} markers replaced`);
            }
          }
        }
      }
    }

    // Always regenerate data/manifest.json and published/ artifacts
    const fileManifest = {};
    for (const { src } of DATA_SOURCES) {
      const srcPath = path.join(ROOT, src);
      fileManifest[src] = fs.existsSync(srcPath) ? listFilesRecursive(srcPath) : [];
    }
    ensureDir(path.join(DIST, 'data'));
    fs.writeFileSync(
      path.join(DIST, 'data', 'manifest.json'),
      JSON.stringify(fileManifest, null, 2)
    );
    console.log('[build] Regenerated data/manifest.json');

    generatePublishedArtifacts();

    const totalFiles = Object.values(fileManifest).reduce((a, b) => a + b.length, 0);
    console.log(`[build] Done (incremental). dist/ synced. ${totalFiles} data files total + published/ artifacts.`);
  }
}

// ── Published artifacts (always regenerated) ───────────────────────────────

function generatePublishedArtifacts() {
  const publishedDir = path.join(DIST, 'data', 'published');
  ensureDir(publishedDir);

  const topicsManifest = buildTopicsManifest();
  if (topicsManifest) {
    fs.writeFileSync(
      path.join(publishedDir, 'topics_manifest.json'),
      JSON.stringify(topicsManifest, null, 2)
    );
    console.log(`[build] Generated data/published/topics_manifest.json (${topicsManifest.topics.length} topics)`);
  }

  const decisionsSummary = buildDecisionsSummary();
  if (decisionsSummary) {
    fs.writeFileSync(
      path.join(publishedDir, 'decisions_summary.json'),
      JSON.stringify(decisionsSummary, null, 2)
    );
    console.log(`[build] Generated data/published/decisions_summary.json (${decisionsSummary.decisions.length} decisions)`);
  }
}

build();
