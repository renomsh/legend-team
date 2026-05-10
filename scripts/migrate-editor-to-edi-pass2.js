"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Pass 2: handle remaining "editor" references inside JSON string values.
 * - "editor.X" metric IDs → "edi.X"
 * - "reports/...editor_revN.md" paths in role memory → leave (historical files)
 * - Narrative "Editor" word → "Edi" in role-memory notes
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
function transformString(s) {
    // metric ID: "editor.foo" → "edi.foo"
    s = s.replace(/\beditor\.([a-z_]+)/g, 'edi.$1');
    // narrative role mention: standalone "Editor" → "Edi" (avoid file paths)
    s = s.replace(/(?<!\/|_|-)\bEditor\b(?!_rev|_memory)/g, 'Edi');
    return s;
}
function walk(node) {
    if (typeof node === 'string')
        return transformString(node);
    if (Array.isArray(node))
        return node.map(walk);
    if (node && typeof node === 'object') {
        const out = {};
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
    if (!fs.existsSync(abs)) {
        continue;
    }
    const raw = fs.readFileSync(abs, 'utf-8');
    let out;
    if (rel.endsWith('.json')) {
        const data = JSON.parse(raw);
        const m = walk(data);
        out = JSON.stringify(m, null, 2) + '\n';
    }
    else {
        out = transformString(raw);
    }
    if (out !== raw && out !== raw + '\n') {
        fs.writeFileSync(abs, out);
        changed++;
        console.log(`[migrated] ${rel}`);
    }
}
console.log(`Done. ${changed} files changed.`);
//# sourceMappingURL=migrate-editor-to-edi-pass2.js.map