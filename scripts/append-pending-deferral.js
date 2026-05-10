"use strict";
/**
 * append-pending-deferral.ts
 * A6-4: 실시간 PD append 스크립트 (D-055).
 *
 * 역할:
 *   - system_state.json.pendingDeferrals에 새 PD 항목 즉시 추가
 *   - current_session.json.pendingDeferralsAdded에 ID 기록 (Editor 역검사용)
 *   - PD ID 자동 채번 (현재 최고 번호 +1)
 *
 * Usage (CLI):
 *   npx ts-node scripts/append-pending-deferral.ts \
 *     --item "구현 설명" \
 *     --note "선택적 메모"
 *
 * Programmatic:
 *   import { appendPendingDeferral } from './append-pending-deferral';
 *   appendPendingDeferral({ item: '...', note: '...' });
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
exports.appendPendingDeferral = appendPendingDeferral;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const SYSTEM_STATE_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'system_state.json');
const CURRENT_SESSION_PATH = path.join(utils_1.ROOT, 'memory', 'sessions', 'current_session.json');
function nextPdId(existing) {
    const nums = existing
        .map(p => parseInt(p.id.replace('PD-', ''), 10))
        .filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `PD-${String(max + 1).padStart(3, '0')}`;
}
function appendPendingDeferral(opts) {
    const state = (0, utils_1.readJson)(SYSTEM_STATE_PATH, {});
    if (!Array.isArray(state.pendingDeferrals))
        state.pendingDeferrals = [];
    const sess = (0, utils_1.readJson)(CURRENT_SESSION_PATH, {});
    const id = nextPdId(state.pendingDeferrals);
    const entry = {
        id,
        fromSession: sess.sessionId ?? 'unknown',
        fromTopic: sess.topicSlug ?? 'unknown',
        item: opts.item,
        status: 'pending',
        ...(opts.note ? { note: opts.note } : {}),
    };
    state.pendingDeferrals.push(entry);
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SYSTEM_STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
    // current_session에 추적 기록
    if (!Array.isArray(sess.pendingDeferralsAdded))
        sess.pendingDeferralsAdded = [];
    sess.pendingDeferralsAdded.push(id);
    fs.writeFileSync(CURRENT_SESSION_PATH, JSON.stringify(sess, null, 2), 'utf-8');
    return id;
}
if (require.main === module) {
    const args = process.argv.slice(2);
    const get = (flag) => {
        const idx = args.findIndex(a => a.startsWith(`--${flag}=`));
        if (idx >= 0)
            return args[idx].slice(flag.length + 3);
        const i2 = args.indexOf(`--${flag}`);
        if (i2 >= 0 && args[i2 + 1] !== undefined)
            return args[i2 + 1];
        return '';
    };
    const item = get('item');
    if (!item) {
        console.error('Usage: append-pending-deferral.ts --item "설명" [--note "메모"]');
        process.exit(1);
    }
    const noteVal = get('note');
    const note = noteVal || undefined;
    const id = appendPendingDeferral({ item, ...(note ? { note } : {}) });
    console.log(`PD 등록 완료: ${id} — "${item}"`);
}
//# sourceMappingURL=append-pending-deferral.js.map