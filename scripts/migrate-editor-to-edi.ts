/**
 * One-shot migration: role identifier "editor" → "edi".
 * - Walks JSON files: replaces exact string values "editor" and object keys "editor".
 * - Does NOT touch substrings inside larger text (notes, summaries).
 * - Does NOT touch identifier-like words in code (run separately for scripts/HTML).
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

const JSON_FILES = [
  'memory/sessions/session_index.json',
  'memory/shared/dashboard_data.json',
  'memory/shared/decision_ledger.json',
  'memory/shared/glossary.json',
  'memory/shared/project_charter.json',
  'memory/shared/role_palette.json',
  'memory/shared/role_registry.json',
  'memory/shared/signal_registry.json',
  'memory/shared/topic_index.json',
  'memory/master/master_feedback_log.json',
  'memory/growth/composite_inputs.json',
  'memory/growth/derived_metrics.json',
  'memory/growth/metrics_registry.json',
  'memory/growth/registry_history/v1.0.json',
  'memory/growth/signature_metrics_aggregate.json',
  'memory/roles/ace_memory.json',
  'memory/roles/dev_memory.json',
];

function migrate(node: any): any {
  if (Array.isArray(node)) return node.map(migrate);
  if (node && typeof node === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(node)) {
      const newKey = k === 'editor' ? 'edi' : k;
      out[newKey] = migrate(v);
    }
    return out;
  }
  if (typeof node === 'string' && node === 'editor') return 'edi';
  return node;
}

let totalChanges = 0;
for (const rel of JSON_FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) { console.log(`[skip] ${rel} (not found)`); continue; }
  const raw = fs.readFileSync(abs, 'utf-8');
  const data = JSON.parse(raw);
  const migrated = migrate(data);
  const out = JSON.stringify(migrated, null, 2);
  if (out !== JSON.stringify(data, null, 2)) {
    fs.writeFileSync(abs, out + '\n');
    totalChanges++;
    console.log(`[migrated] ${rel}`);
  } else {
    console.log(`[unchanged] ${rel}`);
  }
}

// Rename role files
const renames: Array<[string, string]> = [
  ['memory/roles/editor_memory.json', 'memory/roles/edi_memory.json'],
  ['memory/roles/personas/role-editor.md', 'memory/roles/personas/role-edi.md'],
];
for (const [from, to] of renames) {
  const fa = path.join(ROOT, from), ta = path.join(ROOT, to);
  if (fs.existsSync(fa)) {
    if (fs.existsSync(ta)) {
      console.log(`[rename-skip] ${to} exists; merging not handled — manual review`);
    } else {
      fs.renameSync(fa, ta);
      console.log(`[renamed] ${from} → ${to}`);
    }
  }
}

console.log(`\nDone. ${totalChanges} JSON files changed.`);
