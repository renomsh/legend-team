"use strict";
/**
 * manage-pd.ts
 * /pd 슬래시 커맨드 백엔드. SOT: memory/shared/pending_deferrals.json
 *
 * Usage:
 *   npx ts-node scripts/manage-pd.ts list
 *   npx ts-node scripts/manage-pd.ts add "<내용> [--note=<메모>]"
 *   npx ts-node scripts/manage-pd.ts rm PD-NNN
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
const PD_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'pending_deferrals.json');
const SESSION_PATH = path.join(utils_1.ROOT, 'memory', 'sessions', 'current_session.json');
function readPdFile() {
    return (0, utils_1.readJson)(PD_PATH, {
        schema: 'pending_deferrals.v1',
        createdAt: new Date().toISOString().slice(0, 10),
        createdBy: 'manage-pd.ts',
        note: '',
        items: [],
    });
}
function writePdFile(data) {
    fs.writeFileSync(PD_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
function nextId(items) {
    const nums = items
        .map(p => parseInt(p.id.replace('PD-', ''), 10))
        .filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `PD-${String(max + 1).padStart(3, '0')}`;
}
function cmdList() {
    const data = readPdFile();
    const pending = data.items.filter(i => i.status === 'pending');
    if (pending.length === 0) {
        console.log('pending PD 없음');
        return;
    }
    console.log(`\n📋 Pending Deferrals (${pending.length}건)\n`);
    for (const p of pending) {
        if (p.title) {
            console.log(`  ${p.id}  ${p.title}`);
            console.log(`         ${p.item}`);
        }
        else {
            console.log(`  ${p.id}  ${p.item}`);
        }
        console.log(`         from: ${p.fromSession} / ${p.fromTopic}`);
        if (p.resolveCondition)
            console.log(`         resolve: ${p.resolveCondition}`);
        console.log('');
    }
}
function cmdAdd(raw) {
    const noteMatch = raw.match(/--note=["']?(.+?)["']?$/);
    const note = noteMatch ? noteMatch[1] : undefined;
    const item = noteMatch ? raw.slice(0, noteMatch.index).trim() : raw.trim();
    if (!item) {
        console.error('내용을 입력하세요.');
        process.exit(1);
    }
    const data = readPdFile();
    const sess = (0, utils_1.readJson)(SESSION_PATH, {});
    const id = nextId(data.items);
    const entry = {
        id,
        fromSession: sess.sessionId ?? 'unknown',
        fromTopic: sess.topicSlug ?? 'unknown',
        createdAt: new Date().toISOString().slice(0, 10),
        item,
        status: 'pending',
        ...(note ? { note } : {}),
    };
    data.items.push(entry);
    writePdFile(data);
    // current_session 추적
    if (!Array.isArray(sess.pendingDeferralsAdded))
        sess.pendingDeferralsAdded = [];
    sess.pendingDeferralsAdded.push(id);
    fs.writeFileSync(SESSION_PATH, JSON.stringify(sess, null, 2), 'utf-8');
    console.log(`PD 등록 완료: ${id} — "${item}"`);
}
function cmdRm(id) {
    const upper = id.toUpperCase();
    const data = readPdFile();
    const idx = data.items.findIndex(i => i.id === upper);
    if (idx === -1) {
        console.error(`${upper} 항목을 찾을 수 없음`);
        process.exit(1);
    }
    const target = data.items[idx];
    target.status = 'resolved';
    target.resolvedAt = new Date().toISOString().slice(0, 10);
    const sess = (0, utils_1.readJson)(SESSION_PATH, {});
    target.resolvedBy = sess.sessionId ?? 'unknown';
    writePdFile(data);
    console.log(`${upper} → resolved 처리 완료`);
}
const argv = process.argv;
const cmd = argv[2];
const rest = argv.slice(3);
if (!cmd || cmd === 'list') {
    cmdList();
}
else if (cmd === 'add') {
    cmdAdd(rest.join(' '));
}
else if (cmd === 'rm' || cmd === 'remove') {
    cmdRm(rest[0] ?? '');
}
else {
    console.error(`알 수 없는 명령: ${cmd}. list | add | rm`);
    process.exit(1);
}
//# sourceMappingURL=manage-pd.js.map