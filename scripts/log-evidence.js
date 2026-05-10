"use strict";
/**
 * log-evidence.ts  [L-02 evidence_index 자동 갱신]
 * Appends a new evidence entry to memory/shared/evidence_index.json.
 * Agents (especially Riki and Arki) should call this when surfacing a key finding.
 *
 * Usage:
 *   ts-node scripts/log-evidence.ts <topicSlug> <type> <source> "<finding>" [status]
 *
 * Types: structural-diagnosis | principle-violation | risk | assumption | data | reference | expert-input
 * Status defaults to "open"
 *
 * Example:
 *   ts-node scripts/log-evidence.ts topic_002 risk riki "Memory files empty in v0.1.0" open
 */
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
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const EVIDENCE_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'evidence_index.json');
const VALID_TYPES = [
    'structural-diagnosis', 'principle-violation', 'risk',
    'assumption', 'data', 'reference', 'expert-input',
];
const VALID_AGENTS = ['ace', 'arki', 'fin', 'riki', 'editor', 'nova', 'master'];
function run() {
    const [topicSlug, type, source, finding, status = 'open'] = process.argv.slice(2);
    if (!topicSlug || !type || !source || !finding) {
        console.error('Usage: ts-node scripts/log-evidence.ts <topicSlug> <type> <source> "<finding>" [status]');
        console.error(`Types: ${VALID_TYPES.join(' | ')}`);
        process.exit(1);
    }
    if (!VALID_TYPES.includes(type)) {
        console.error(`Invalid type: ${type}. Must be one of: ${VALID_TYPES.join(', ')}`);
        process.exit(1);
    }
    const index = (0, utils_1.readJson)(EVIDENCE_PATH, { evidence: [], lastUpdated: '' });
    const id = (0, utils_1.nextId)(index.evidence, 'E-');
    const date = new Date().toISOString().slice(0, 10);
    const sourceAgent = VALID_AGENTS.includes(source) ? source : 'master';
    const entry = {
        id,
        topicId: topicSlug,
        topic: topicSlug,
        date,
        description: finding,
        source: sourceAgent,
        type: type,
        usedBy: [sourceAgent],
        status,
    };
    index.evidence.push(entry);
    index.lastUpdated = new Date().toISOString();
    (0, utils_1.writeJson)(EVIDENCE_PATH, index);
    (0, utils_1.appendLog)('log-evidence', `Logged evidence ${id}: [${type}] ${finding.slice(0, 60)}`);
    console.log(`✓ Evidence logged: ${id}`);
    console.log(`  topic: ${topicSlug} | type: ${type} | source: ${source}`);
    console.log(`  finding: ${finding}`);
}
run();
//# sourceMappingURL=log-evidence.js.map