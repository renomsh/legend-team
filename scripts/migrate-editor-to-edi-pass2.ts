/**
 * Pass 2: handle remaining "editor" references inside JSON string values.
 * - "editor.X" metric IDs → "edi.X"
 * - "reports/...editor_revN.md" paths in role memory → leave (historical files)
 * - Narrative "Editor" word → "Edi" in role-memory notes
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const FILES = [
  'memory/roles/edi_memory.json',
  'memory/roles/personas/role-edi.md',
  'memory/shared/role_registry.json',
  'memory/shared/role_palette.json',
  'memory/shared/signal_registry.json',
  'memory/shared/glossary.json',
  'memory/shared/project_charter.json',
  'memory/growth/composite_inputs.json',
  'memory/growth/derived_metrics.json',
  'memory/growth/metrics_registry.json',
  'memory/growth/registry_history/v1.0.json',
  'memory/growth/signature_metrics_aggregate.json',
];

function transformString(s: string): string {
  // metric ID: "editor.foo" → "edi.foo"
  s = s.replace(/\beditor\.([a-z_]+)/g, 'edi.$1');
  // narrative role mention: standalone "Editor" → "Edi" (avoid file paths)
  s = s.replace(/(?<!\/|_|-)\bEditor\b(?!_rev|_memory)/g, 'Edi');
  return s;
}

function walk(node: any): any {
  if (typeof node === 'string') return transformString(node);
  if (Array.isArray(node)) return node.map(walk);
  if (node && typeof node === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = walk(v);
    }
    return out;
  }
  return node;
}

let changed = 0;
for (const rel of FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) { continue; }
  const raw = fs.readFileSync(abs, 'utf-8');
  let out: string;
  if (rel.endsWith('.json')) {
    const data = JSON.parse(raw);
    const m = walk(data);
    out = JSON.stringify(m, null, 2) + '\n';
  } else {
    out = transformString(raw);
  }
  if (out !== raw && out !== raw + '\n') {
    fs.writeFileSync(abs, out);
    changed++;
    console.log(`[migrated] ${rel}`);
  }
}
console.log(`Done. ${changed} files changed.`);
