"use strict";
/**
 * write-turn-log.ts
 * PD-020b P2 (session_061) — L1 turn_log.jsonl append writer.
 *
 * 역할: topics/{topicId}/turn_log.jsonl 에 TurnLogEntry 한 줄 append.
 * - D-048 C1: turn 발언 직후 append — 세션 종료 대기 없음.
 * - validates entry via validateTurnLogEntry before writing.
 * - creates directories and file if they don't exist.
 *
 * Usage (CLI):
 *   npx ts-node scripts/write-turn-log.ts <topicId> <jsonString>
 *
 * Usage (programmatic):
 *   import { appendTurnLogEntry } from './write-turn-log';
 *   appendTurnLogEntry('topic_064', { ts, topicId, sessionId, turnIdx, role, phase });
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
exports.turnLogPath = turnLogPath;
exports.appendTurnLogEntry = appendTurnLogEntry;
exports.readTurnLog = readTurnLog;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const validate_context_layers_1 = require("./lib/validate-context-layers");
const TOPICS_DIR = path.join(utils_1.ROOT, 'topics');
function turnLogPath(topicId) {
    return path.join(TOPICS_DIR, topicId, 'turn_log.jsonl');
}
/**
 * Append a single TurnLogEntry to topics/{topicId}/turn_log.jsonl.
 * Validates the entry before writing; throws ContextLayerError on invalid input.
 * Creates the topics/{topicId}/ directory if absent.
 */
function appendTurnLogEntry(topicId, entry) {
    const normalized = {
        ...entry,
        ts: entry.ts ?? new Date().toISOString(),
        topicId,
    };
    (0, validate_context_layers_1.validateTurnLogEntry)(normalized, { expectedTopicId: topicId });
    const topicDir = path.join(TOPICS_DIR, topicId);
    if (!fs.existsSync(topicDir)) {
        fs.mkdirSync(topicDir, { recursive: true });
    }
    const filePath = turnLogPath(topicId);
    const line = JSON.stringify(normalized) + '\n';
    fs.appendFileSync(filePath, line, 'utf8');
    (0, utils_1.appendLog)('L1-writer', `append ok | ${topicId} | s=${normalized.sessionId} | turn=${normalized.turnIdx} | role=${normalized.role}`);
}
/**
 * Read all TurnLogEntry rows for a topic, optionally filtered by sessionId.
 * Returns entries in file order (chronological).
 */
function readTurnLog(topicId, sessionId) {
    const filePath = turnLogPath(topicId);
    if (!fs.existsSync(filePath))
        return [];
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim() !== '');
    const entries = lines.map((line, idx) => {
        try {
            return JSON.parse(line);
        }
        catch {
            throw new Error(`turn_log.jsonl line ${idx + 1} parse error: ${line.slice(0, 80)}`);
        }
    });
    if (sessionId) {
        return entries.filter(e => e.sessionId === sessionId);
    }
    return entries;
}
// ── CLI entry point ──────────────────────────────────────────────────────────
if (require.main === module) {
    const [, , topicId, jsonArg] = process.argv;
    if (!topicId || !jsonArg) {
        console.error('Usage: ts-node write-turn-log.ts <topicId> <jsonString>');
        process.exit(1);
    }
    let parsed;
    try {
        parsed = JSON.parse(jsonArg);
    }
    catch {
        console.error('Error: jsonString is not valid JSON');
        process.exit(1);
    }
    if (typeof parsed !== 'object' || parsed === null) {
        console.error('Error: entry must be a JSON object');
        process.exit(1);
    }
    try {
        appendTurnLogEntry(topicId, parsed);
        console.log(`OK: appended to topics/${topicId}/turn_log.jsonl`);
    }
    catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
}
//# sourceMappingURL=write-turn-log.js.map