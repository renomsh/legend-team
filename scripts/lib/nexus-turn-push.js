"use strict";
/**
 * nexus-turn-push.ts
 * D-169 / Arki rev4 §4 / session_209 P4
 *
 * Nexus(Main Claude) 직접 turns[] push 헬퍼.
 * turnPushMode = "nexus" 일 때 병렬 dispatch 완료 후 호출.
 *
 * 흐름:
 *   1. pending_turns_{sessionId}.jsonl에서 agentId 매칭 entry 조회
 *   2. __hook_origin 검증 (D1 sentinel)
 *   3. sort_key(dispatch_order) 기준 정렬
 *   4. current_session.json.turns[] 순차 push (단일 스레드 — race 없음)
 *   5. pending_turns 파일 archive 이동
 *
 * export:
 *   pushTurnsFromPending(dispatches, sessionPath?, cwd?)
 *   extractSelfScoresFromContent(content)  [옵션 B fallback]
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
exports.extractSelfScoresFromContent = extractSelfScoresFromContent;
exports.pushTurnsFromPending = pushTurnsFromPending;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const turn_push_mode_1 = require("./turn-push-mode");
const CWD = process.cwd();
const DEFAULT_SESSION_PATH = path.join(CWD, 'memory', 'sessions', 'current_session.json');
const HOOK_ORIGIN_SENTINEL = 'post-tool-use-task';
// ─── extractSelfScores (옵션 B fallback — SKILL.md §Nexus push 흐름) ─────
function extractSelfScoresFromContent(content) {
    if (!content)
        return null;
    const text = content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');
    const idx = text.lastIndexOf('# self-scores');
    if (idx === -1)
        return null;
    const scores = {};
    const lines = text.slice(idx + '# self-scores'.length).split(/\r?\n/);
    for (const raw of lines) {
        const line = raw.trim();
        if (line.startsWith('```') || line.startsWith('---') || /^#{1,3} /.test(line))
            break;
        if (line === '') {
            if (Object.keys(scores).length > 0)
                break;
            continue;
        }
        if (line.startsWith('#'))
            continue;
        if (/^[A-Z][A-Z0-9_]*:/.test(line))
            break;
        const m = line.match(/^([\w.-]+):\s*(.+?)(?:\s+#.*)?$/);
        if (!m) {
            if (Object.keys(scores).length > 0)
                break;
            continue;
        }
        const key = m[1];
        const valRaw = m[2].trim();
        const num = Number(valRaw);
        scores[key] = Number.isFinite(num) && /^-?\d/.test(valRaw) ? num : valRaw;
    }
    return Object.keys(scores).length > 0 ? scores : null;
}
// ─── pending_turns 읽기 ───────────────────────────────────
function readPendingEntries(pendingPath) {
    if (!fs.existsSync(pendingPath))
        return [];
    const raw = fs.readFileSync(pendingPath, 'utf8');
    const entries = [];
    for (const line of raw.split('\n').filter(l => l.trim())) {
        try {
            entries.push(JSON.parse(line));
        }
        catch { }
    }
    return entries;
}
// ─── main push function ──────────────────────────────────
/**
 * N개 병렬 dispatch 완료 후 Nexus가 호출.
 * dispatches는 dispatch 호출 시 준비한 배열 — toolResult는 완료 후 채워넣음.
 */
async function pushTurnsFromPending(dispatches, sessionPath = DEFAULT_SESSION_PATH, cwd = CWD) {
    const sessRaw = fs.readFileSync(sessionPath, 'utf8');
    const sess = JSON.parse(sessRaw);
    const sessionId = sess.sessionId;
    if (!sessionId)
        throw new Error('current_session.sessionId 없음');
    const pendingPath = (0, turn_push_mode_1.pendingTurnsPath)(sessionId, cwd);
    const pendingEntries = readPendingEntries(pendingPath);
    const gaps = [];
    const pushed = [];
    // dispatch_order 기준 정렬 (sort_key = dispatch_order)
    const sorted = [...dispatches].sort((a, b) => a.dispatchOrder - b.dispatchOrder);
    const existingTurns = Array.isArray(sess.turns) ? sess.turns : [];
    let turnIdx = existingTurns.length;
    for (const dispatch of sorted) {
        const { role, dispatchOrder, agentId: dispatchAgentId, toolResult } = dispatch;
        // pending_turns에서 agentId 매칭
        const resolvedAgentId = dispatchAgentId ?? toolResult?.agentId ?? null;
        let pendingEntry;
        if (resolvedAgentId) {
            pendingEntry = pendingEntries.find(e => e.agentId === resolvedAgentId);
        }
        // D1 sentinel 검증
        if (pendingEntry && pendingEntry.__hook_origin !== HOOK_ORIGIN_SENTINEL) {
            gaps.push({
                kind: 'hook-origin-invalid',
                role,
                detail: `__hook_origin="${pendingEntry.__hook_origin}" ≠ "${HOOK_ORIGIN_SENTINEL}" → skip`,
            });
            pendingEntry = undefined;
        }
        // selfScores 결정: pending entry 우선, 없으면 옵션 B fallback
        let selfScores;
        if (pendingEntry?.selfScores) {
            selfScores = pendingEntry.selfScores;
        }
        else if (toolResult?.content) {
            const extracted = extractSelfScoresFromContent(toolResult.content);
            if (extracted) {
                selfScores = extracted;
                if (!pendingEntry) {
                    gaps.push({
                        kind: 'nexus-push-missing',
                        role,
                        detail: `agentId=${resolvedAgentId} pending_turns entry 없음 — optionB fallback selfScores 사용`,
                    });
                }
            }
        }
        const turn = {
            role,
            turnIdx,
            source: 'agent',
            ...(selfScores && { selfScores }),
            sort_key: dispatchOrder,
        };
        existingTurns.push(turn);
        pushed.push(turn);
        turnIdx++;
    }
    sess.turns = existingTurns;
    // gaps 병합 (기존 gaps 보존)
    if (gaps.length > 0) {
        sess.gaps = [...(Array.isArray(sess.gaps) ? sess.gaps : []), ...gaps];
    }
    // 단일 write (단일 스레드 — race 없음)
    fs.writeFileSync(sessionPath, JSON.stringify(sess, null, 2) + '\n', 'utf8');
    // pending_turns archive (다음 세션 영향 0)
    let pendingArchived = false;
    if (fs.existsSync(pendingPath)) {
        try {
            const archiveDir = path.join(cwd, 'memory', 'sessions', 'pending_turns_archive');
            if (!fs.existsSync(archiveDir))
                fs.mkdirSync(archiveDir, { recursive: true });
            const archivePath = path.join(archiveDir, path.basename(pendingPath));
            fs.renameSync(pendingPath, archivePath);
            pendingArchived = true;
        }
        catch { }
    }
    return { pushed, gaps, pendingArchived };
}
//# sourceMappingURL=nexus-turn-push.js.map