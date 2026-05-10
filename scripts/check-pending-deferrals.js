"use strict";
/**
 * check-pending-deferrals.ts
 * A6-4 Editor 역검사 (D-055): 세션 중 생성된 PD가 system_state에 실제 반영됐는지 확인.
 *
 * 검사 항목:
 *   1. current_session.pendingDeferralsAdded의 ID가 system_state에 존재하는지
 *   2. session.notes에 "이연" / "다음 세션" / "PD-" 키워드 있으나 pendingDeferralsAdded 비어있으면 경고
 *
 * 규칙:
 *   - 경고만 (차단 없음)
 *   - session-end-finalize.js에서 자동 호출 (Editor 역검사)
 *
 * Usage:
 *   npx ts-node scripts/check-pending-deferrals.ts
 *
 * Programmatic:
 *   import { checkPendingDeferrals } from './check-pending-deferrals';
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
exports.checkPendingDeferrals = checkPendingDeferrals;
exports.formatDeferralCheckResult = formatDeferralCheckResult;
exports.main = main;
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const SYSTEM_STATE_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'system_state.json');
const CURRENT_SESSION_PATH = path.join(utils_1.ROOT, 'memory', 'sessions', 'current_session.json');
const DEFERRAL_KEYWORDS = ['이연', '다음 세션', 'PD-', '보류', 'defer', 'next session'];
function checkPendingDeferrals() {
    const state = (0, utils_1.readJson)(SYSTEM_STATE_PATH, {});
    const sess = (0, utils_1.readJson)(CURRENT_SESSION_PATH, {});
    const existingIds = new Set((state.pendingDeferrals ?? []).map(p => p.id));
    const added = Array.isArray(sess.pendingDeferralsAdded) ? sess.pendingDeferralsAdded : [];
    // 검사 1: added ID가 system_state에 실존하는지
    const missing = added.filter(id => !existingIds.has(id));
    // 검사 2: 노트에 이연 키워드 있으나 added 비어있음
    const allNotes = [
        ...(Array.isArray(sess.notes) ? sess.notes : []),
        ...(Array.isArray(sess.masterFeedback) ? sess.masterFeedback : []),
    ];
    const suspectedNotes = allNotes.filter(n => DEFERRAL_KEYWORDS.some(kw => n.includes(kw)));
    const suspectedMiss = suspectedNotes.length > 0 && added.length === 0;
    return { missing, suspectedMiss, suspectedNotes };
}
function formatDeferralCheckResult(r) {
    const lines = [];
    if (r.missing.length > 0) {
        lines.push('⚠️  [PD 역검사] pendingDeferralsAdded에 있으나 system_state에 없음:');
        r.missing.forEach(id => lines.push(`  ✗ ${id} — system_state.json에 미반영`));
    }
    if (r.suspectedMiss) {
        lines.push('⚠️  [PD 역검사] 이연 관련 노트 감지 — PD가 등록됐는지 확인 필요:');
        r.suspectedNotes.slice(0, 3).forEach(n => lines.push(`  • "${n.slice(0, 80)}"`));
        lines.push('  → append-pending-deferral.ts 로 등록하거나 "해당 없음" 확인');
    }
    return lines.join('\n');
}
// ── Programmatic entry point (in-process require) ────────────────────────────
async function main(_args = []) {
    const result = checkPendingDeferrals();
    const out = formatDeferralCheckResult(result);
    if (out)
        console.warn(out);
    else
        console.log('[PD 역검사] 이상 없음.');
}
// ── CLI entry point ───────────────────────────────────────────────────────────
if (require.main === module) {
    main(process.argv.slice(2)).catch(err => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    });
}
//# sourceMappingURL=check-pending-deferrals.js.map