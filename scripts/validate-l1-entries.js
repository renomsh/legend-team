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
 * validate-l1-entries.ts — Gate: L1 turn_log.jsonl 전수 검증
 * Usage: npx ts-node scripts/validate-l1-entries.ts [topicId ...]
 *   without args: scans all topics/ directories
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const validate_context_layers_1 = require("./lib/validate-context-layers");
const utils_1 = require("./lib/utils");
const TOPICS_DIR = path.join(utils_1.ROOT, 'topics');
function validateTopic(topicId) {
    const logPath = path.join(TOPICS_DIR, topicId, 'turn_log.jsonl');
    if (!fs.existsSync(logPath))
        return { ok: 0, fail: 0 };
    const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
    let ok = 0, fail = 0;
    for (const line of lines) {
        let e;
        try {
            e = JSON.parse(line);
        }
        catch {
            console.error(`  PARSE ERROR: ${line.slice(0, 60)}`);
            fail++;
            continue;
        }
        try {
            (0, validate_context_layers_1.validateTurnLogEntry)(e, { expectedTopicId: topicId });
            ok++;
        }
        catch (err) {
            console.error(`  FAIL [${topicId}]: ${err.message}`);
            fail++;
        }
    }
    return { ok, fail };
}
const args = process.argv.slice(2);
const topicIds = args.length > 0
    ? args
    : fs.existsSync(TOPICS_DIR)
        ? fs.readdirSync(TOPICS_DIR).filter(d => fs.statSync(path.join(TOPICS_DIR, d)).isDirectory())
        : [];
let totalOk = 0, totalFail = 0;
for (const topicId of topicIds) {
    const { ok, fail } = validateTopic(topicId);
    if (ok + fail > 0) {
        const icon = fail === 0 ? '✓' : '✗';
        console.log(`[${icon}] ${topicId}: ${ok} OK, ${fail} FAIL`);
        totalOk += ok;
        totalFail += fail;
    }
}
console.log(`\n총계: ${totalOk} OK, ${totalFail} FAIL`);
process.exit(totalFail > 0 ? 1 : 0);
//# sourceMappingURL=validate-l1-entries.js.map