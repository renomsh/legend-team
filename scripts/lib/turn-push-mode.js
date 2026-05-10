"use strict";
/**
 * turn-push-mode.ts
 * D-169 / Arki rev4 §5.5 / session_209 P2
 *
 * turnPushMode SOT = current_session.json.turnPushMode
 * 모든 hook이 이 단일 함수로 mode를 read한다.
 *
 * enum:
 *   "hook"   — legacy. post-tool-use-task.js가 turns[] 직접 write (D-166·D-168 정합)
 *   "nexus"  — 병렬 모드. post-tool-use-task.js가 pending_turns_{sessionId}.jsonl append,
 *              Nexus가 직접 turns[] push (D-169 Case B frame)
 *
 * export:
 *   readTurnPushMode(sessionPath?: string): TurnPushMode
 *   TURN_PUSH_MODE_DEFAULT
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
exports.TURN_PUSH_MODE_DEFAULT = void 0;
exports.readTurnPushMode = readTurnPushMode;
exports.pendingTurnsPath = pendingTurnsPath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.TURN_PUSH_MODE_DEFAULT = 'hook';
const CWD = process.cwd();
const DEFAULT_SESSION_PATH = path.join(CWD, 'memory', 'sessions', 'current_session.json');
/**
 * current_session.json에서 turnPushMode를 읽는다.
 * 파일 없음·파싱 실패·필드 없음 모두 default("hook") 반환 — silent.
 *
 * @param sessionPath  current_session.json 경로. 미지정 시 cwd 기준 default.
 */
function readTurnPushMode(sessionPath) {
    const p = sessionPath ?? DEFAULT_SESSION_PATH;
    try {
        const raw = fs.readFileSync(p, 'utf8').trim();
        if (!raw)
            return exports.TURN_PUSH_MODE_DEFAULT;
        const sess = JSON.parse(raw);
        const mode = sess.turnPushMode;
        if (mode === 'hook' || mode === 'nexus')
            return mode;
        return exports.TURN_PUSH_MODE_DEFAULT;
    }
    catch {
        return exports.TURN_PUSH_MODE_DEFAULT;
    }
}
/**
 * pending_turns 파일 경로 규칙 (A10 자산 매트릭스, Arki rev4 §1).
 * SOT: dispatch_config.json.path_policy.pending_turns_pattern (P7 박제 예정)
 * 현재: memory/sessions/pending_turns_{sessionId}.jsonl
 */
function pendingTurnsPath(sessionId, cwd) {
    const base = cwd ?? CWD;
    return path.join(base, 'memory', 'sessions', `pending_turns_${sessionId}.jsonl`);
}
//# sourceMappingURL=turn-push-mode.js.map