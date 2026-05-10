#!/usr/bin/env ts-node
"use strict";
/**
 * set-closed-in-session.ts
 * topic_index.json의 특정 엔트리에 closedInSession 필드를 기록한다.
 * session-end-finalize.js 훅에서 호출됨.
 *
 * 사용법:
 *   npx ts-node scripts/set-closed-in-session.ts --topicId topic_103 --sessionId session_098
 *
 * 성공: exit 0
 * 실패: exit 1 + stderr 출력 (조용한 실패 금지)
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
exports.main = main;
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const TOPIC_INDEX_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'topic_index.json');
function parseArgs(args) {
    const parsed = new Map();
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg !== undefined && arg.startsWith('--')) {
            const next = args[i + 1];
            parsed.set(arg.slice(2), next ?? '');
            i++;
        }
    }
    return {
        topicId: parsed.get('topicId'),
        sessionId: parsed.get('sessionId'),
    };
}
function main(args = process.argv.slice(2)) {
    const { topicId, sessionId } = parseArgs(args);
    if (!topicId || !sessionId) {
        throw new Error('❌ 필수 인수 누락: --topicId <id> --sessionId <id>');
    }
    let index;
    try {
        index = (0, utils_1.readJson)(TOPIC_INDEX_PATH, { topics: [], lastUpdated: new Date().toISOString() });
    }
    catch (err) {
        throw new Error(`❌ topic_index.json 읽기 실패: ${err.message}`);
    }
    const entry = index.topics.find(t => t.id === topicId);
    if (!entry) {
        throw new Error(`❌ topicId not found: ${topicId}`);
    }
    entry.closedInSession = sessionId;
    index.lastUpdated = new Date().toISOString();
    try {
        (0, utils_1.writeJson)(TOPIC_INDEX_PATH, index);
    }
    catch (err) {
        throw new Error(`❌ topic_index.json 쓰기 실패: ${err.message}`);
    }
    console.log(`✅ topic_index.json 갱신 — ${topicId}.closedInSession = "${sessionId}"`);
}
if (require.main === module) {
    try {
        main();
    }
    catch (e) {
        process.stderr.write(e.message + '\n');
        process.exit(1);
    }
}
//# sourceMappingURL=set-closed-in-session.js.map