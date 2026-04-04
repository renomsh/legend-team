/**
 * Build script for Legend Team static viewer
 * Copies app/ source + memory/ + reports/ into dist/
 * Generates manifest.json for data-loader
 *
 * Usage: node scripts/build.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const APP_SRC = path.join(ROOT, 'app');

// Directories to copy as data
const DATA_SOURCES = [
  { src: 'memory', dest: 'data/memory' },
  { src: 'reports', dest: 'data/reports' },
  { src: 'logs', dest: 'data/logs' }
];

// ── Utilities ──

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

// ── Main Build ──

function build() {
  console.log('[build] Starting...');

  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
    console.log('[build] Cleaned dist/');
  }
  ensureDir(DIST);

  // Copy app source files (HTML, CSS, JS) — excluding internal-viewer.html (legacy)
  const appEntries = fs.readdirSync(APP_SRC, { withFileTypes: true });
  for (const entry of appEntries) {
    const srcPath = path.join(APP_SRC, entry.name);
    const destPath = path.join(DIST, entry.name);
    if (entry.name === 'internal-viewer.html') {
      console.log('[build] Skipping legacy internal-viewer.html');
      continue;
    }
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  console.log('[build] Copied app/ source files');

  // Copy data directories
  const manifest = {};
  for (const { src, dest } of DATA_SOURCES) {
    const srcPath = path.join(ROOT, src);
    const destPath = path.join(DIST, dest);
    if (fs.existsSync(srcPath)) {
      copyDirRecursive(srcPath, destPath);
      manifest[src] = listFilesRecursive(srcPath);
      console.log(`[build] Copied ${src}/ → ${dest}/ (${manifest[src].length} files)`);
    } else {
      console.log(`[build] Skipping ${src}/ (not found)`);
      manifest[src] = [];
    }
  }

  // Generate manifest.json
  const manifestPath = path.join(DIST, 'data', 'manifest.json');
  ensureDir(path.join(DIST, 'data'));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('[build] Generated manifest.json');

  // Summary
  const totalFiles = Object.values(manifest).reduce((a, b) => a + b.length, 0);
  console.log(`[build] Done. dist/ ready with ${totalFiles} data files.`);
}

build();
