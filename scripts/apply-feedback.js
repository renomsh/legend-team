"use strict";
/**
 * apply-feedback.ts
 * Records master feedback to the topic's master_feedback.json
 * and appends to the global memory/master/master_feedback_log.json.
 *
 * Usage:
 *   ts-node scripts/apply-feedback.ts <topicId> <phase> "<feedback>" "<directive>" [appliedTo...]
 *
 * Example:
 *   ts-node scripts/apply-feedback.ts topic_002 edi "Approved. Proceed." "Save reports." ace_rev01.md edi_rev01.md
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
function run() {
    const args = process.argv.slice(2);
    const [topicId, phase, feedback, directive, ...appliedTo] = args;
    if (!topicId || !phase || !feedback || !directive) {
        console.error('Usage: ts-node scripts/apply-feedback.ts <topicId> <phase> "<feedback>" "<directive>" [appliedTo...]');
        process.exit(1);
    }
    const date = new Date().toISOString().slice(0, 10);
    // ── Topic-level feedback log ──────────────────────────────────────────────
    const topicDir = path.join(utils_1.ROOT, 'topics', topicId);
    const topicFeedbackPath = path.join(topicDir, 'master_feedback.json');
    const topicLog = (0, utils_1.readJson)(topicFeedbackPath, { topicId, feedback: [] });
    // ── Global master feedback log ────────────────────────────────────────────
    const globalLogPath = path.join(utils_1.ROOT, 'memory', 'master', 'master_feedback_log.json');
    const globalLog = (0, utils_1.readJson)(globalLogPath, { feedbackLog: [] });
    const id = (0, utils_1.nextId)([...topicLog.feedback, ...globalLog.feedbackLog], 'MF-');
    const entry = {
        id,
        topicId,
        date,
        phase,
        feedback,
        directive,
        appliedTo: appliedTo.length > 0 ? appliedTo : ['all'],
        status: 'applied',
    };
    // Mark previous entries for same topic as applied if still pending
    topicLog.feedback = topicLog.feedback.map(f => f.status === 'pending' ? { ...f, status: 'applied' } : f);
    topicLog.feedback.push(entry);
    globalLog.feedbackLog.push(entry);
    // Ensure topic dir exists
    if (!fs.existsSync(topicDir)) {
        fs.mkdirSync(topicDir, { recursive: true });
    }
    (0, utils_1.writeJson)(topicFeedbackPath, topicLog);
    (0, utils_1.writeJson)(globalLogPath, globalLog);
    (0, utils_1.appendLog)('apply-feedback', `Recorded feedback ${id} for ${topicId} / ${phase}`);
    console.log(`✓ Master feedback recorded: ${id}`);
    console.log(`  topic: ${topicId} | phase: ${phase}`);
    console.log(`  feedback: ${feedback}`);
    console.log(`  directive: ${directive}`);
    console.log(`  appliedTo: ${entry.appliedTo.join(', ')}`);
}
run();
//# sourceMappingURL=apply-feedback.js.map