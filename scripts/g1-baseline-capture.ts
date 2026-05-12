// G1 baseline — capture session_index entry for last 5 sessions before finalize.js refactor.
// Used by scripts/g1-verify-diff.ts to confirm byte-level equivalence after split.
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const INDEX = path.join(ROOT, 'memory/sessions/session_index.json');
const OUT_DIR = path.join(ROOT, 'tmp/g1-baseline');

const idx = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
const targets = ['session_237', 'session_238', 'session_239', 'session_240', 'session_241'];
fs.mkdirSync(OUT_DIR, { recursive: true });

let captured = 0;
let missing = 0;
for (const id of targets) {
  const entry = idx.sessions.find((s: any) => s.sessionId === id);
  if (!entry) {
    console.error(`[baseline] missing ${id}`);
    missing++;
    continue;
  }
  fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), JSON.stringify(entry, null, 2));
  console.log(`[baseline] captured ${id}`);
  captured++;
}
console.log(`[baseline] done: captured=${captured} missing=${missing}`);
if (missing > 0) process.exit(1);
