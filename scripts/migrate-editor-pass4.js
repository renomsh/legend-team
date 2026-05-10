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
 * Pass 4: rename "editor_rev" → "edi_rev" in JSON string values.
 * Reports were physically renamed (63 files); this fixes the references.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
function walk(node) {
    if (typeof node === 'string') {
        return node.replace(/editor_rev/g, 'edi_rev').replace(/EDITOR_WRITE/g, 'EDI_WRITE');
    }
    if (Array.isArray(node))
        return node.map(walk);
    if (node && typeof node === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(node))
            out[k] = walk(v);
        return out;
    }
    return node;
}
let n = 0;
for (const rel of FILES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs))
        continue;
    const raw = fs.readFileSync(abs, 'utf-8');
    const out = JSON.stringify(walk(JSON.parse(raw)), null, 2) + '\n';
    if (out !== raw) {
        fs.writeFileSync(abs, out);
        console.log(`[migrated] ${rel}`);
        n++;
    }
}
console.log(`Done. ${n} files changed.`);
//# sourceMappingURL=migrate-editor-pass4.js.map