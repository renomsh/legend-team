/**
 * Pass 4: rename "editor_rev" → "edi_rev" in JSON string values.
 * Reports were physically renamed (63 files); this fixes the references.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const FILES = [
  'memory/sessions/session_index.json',
  'memory/shared/topic_index.json',
  'memory/shared/decision_ledger.json',
  'memory/shared/dashboard_data.json',
  'memory/shared/project_charter.json',
  'memory/master/master_feedback_log.json',
  'memory/roles/edi_memory.json',
  'memory/roles/ace_memory.json',
  'memory/roles/dev_memory.json',
  'memory/growth/composite_inputs.json',
];

function walk(node: any): any {
  if (typeof node === 'string') {
    return node.replace(/editor_rev/g, 'edi_rev').replace(/EDITOR_WRITE/g, 'EDI_WRITE');
  }
  if (Array.isArray(node)) return node.map(walk);
  if (node && typeof node === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(node)) out[k] = walk(v);
    return out;
  }
  return node;
}

let n = 0;
for (const rel of FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  const raw = fs.readFileSync(abs, 'utf-8');
  const out = JSON.stringify(walk(JSON.parse(raw)), null, 2) + '\n';
  if (out !== raw) {
    fs.writeFileSync(abs, out);
    console.log(`[migrated] ${rel}`);
    n++;
  }
}
console.log(`Done. ${n} files changed.`);
