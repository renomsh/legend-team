/**
 * Pass 3: clean up role identifier strings inside edi_memory.json (renamed file
 * was missed by pass 1) and similar deeply-nested role identifiers.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const FILES = [
  'memory/roles/edi_memory.json',
  'memory/sessions/session_index.json',
  'memory/shared/dashboard_data.json',
  'memory/shared/decision_ledger.json',
  'memory/shared/topic_index.json',
  'memory/roles/ace_memory.json',
  'memory/roles/dev_memory.json',
];

function walk(node: any): any {
  if (Array.isArray(node)) return node.map(walk);
  if (node && typeof node === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(node)) {
      const newKey = k === 'editor' ? 'edi' : k;
      out[newKey] = walk(v);
    }
    return out;
  }
  if (typeof node === 'string' && node === 'editor') return 'edi';
  return node;
}

let n = 0;
for (const rel of FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const raw = fs.readFileSync(abs, 'utf-8');
  const data = JSON.parse(raw);
  const out = walk(data);
  const next = JSON.stringify(out, null, 2) + '\n';
  if (next !== raw) {
    fs.writeFileSync(abs, next);
    console.log(`[migrated] ${rel}`);
    n++;
  }
}
console.log(`Done. ${n} files changed.`);
