// G1 verify — compare current session_index entries against tmp/g1-baseline/ snapshot.
// finalize.js 분해(D-188)가 기존 session entry shape에 영향 없음을 검증.
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const INDEX = path.join(ROOT, 'memory/sessions/session_index.json');
const BASELINE_DIR = path.join(ROOT, 'tmp/g1-baseline');

const idx = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
const targets = ['session_237', 'session_238', 'session_239', 'session_240', 'session_241'];

let diffs = 0;
for (const id of targets) {
  const baseFile = path.join(BASELINE_DIR, `${id}.json`);
  if (!fs.existsSync(baseFile)) {
    console.error(`[verify] missing baseline ${id}`);
    diffs++;
    continue;
  }
  const base = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const curr = idx.sessions.find((s: any) => s.sessionId === id);
  if (!curr) {
    console.error(`[verify] missing current ${id}`);
    diffs++;
    continue;
  }
  const baseStr = JSON.stringify(base);
  const currStr = JSON.stringify(curr);
  if (baseStr === currStr) {
    console.log(`[verify] ${id} OK`);
  } else {
    console.error(`[verify] ${id} DIFF detected`);
    console.error(`  base length: ${baseStr.length}, curr length: ${currStr.length}`);
    diffs++;
  }
}

if (diffs > 0) {
  console.error(`[verify] FAIL: ${diffs}/${targets.length} diffs`);
  process.exit(1);
}
console.log('[verify] PASS: all 5 sessions match baseline (byte-level)');
