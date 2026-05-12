// G1 split (D-188, session_242): shared utilities + module-level constants.
// Originally inlined in session-end-finalize.js (now orchestrator).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

process.env.TS_NODE_TRANSPILE_ONLY = '1';
try {
  require('ts-node').register({
    transpileOnly: true,
    skipProject: true,
    compilerOptions: {
      module: 'commonjs',
      target: 'es2020',
      esModuleInterop: true,
      skipLibCheck: true,
      ignoreDeprecations: '6.0',
    },
  });
} catch (_e) {}

const CWD = process.env.FINALIZE_CWD || process.cwd();
const CURRENT_SESSION_PATH = process.env.FINALIZE_CURRENT_SESSION || path.join(CWD, 'memory', 'sessions', 'current_session.json');
const SESSION_INDEX_PATH = process.env.FINALIZE_SESSION_INDEX || path.join(CWD, 'memory', 'sessions', 'session_index.json');

function log(msg) {
  console.error(`[session-end-finalize] ${msg}`);
}

function readJson(p, fallback) {
  try {
    const raw = fs.readFileSync(p, 'utf8').trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

module.exports = { fs, path, spawnSync, log, readJson, writeJson, CWD, CURRENT_SESSION_PATH, SESSION_INDEX_PATH };
