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
 * append-missing-tokens.ts — token_log.json에 누락 세션을 소급 append.
 *
 * Why: session_035~039 구간에서 hook이 transcript=MISSING cliSession=null로 ABORT.
 * 각 세션은 별개 worktree에서 종료됐으므로 세션→worktree 매핑이 필요.
 *
 * How: hook-diagnostics.log의 ABORT된 FIRED 이벤트를 시간순으로 정렬하고,
 * 타겟 세션 목록에 시간순으로 1:1 매칭. 해당 cwd의 Claude projects 디렉토리에서
 * ABORT 시각에 가장 가까운 .jsonl을 골라 aggregate.
 *
 * Usage:
 *   npx ts-node scripts/append-missing-tokens.ts session_036 session_037 session_038 [session_039]
 *
 * 한 번만 쓰는 복구 스크립트. 상시 운용은 session-end-tokens.js hook의 cwd fallback이 담당.
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const readline = __importStar(require("readline"));
const ROOT = path.resolve(__dirname, '..');
const TOKEN_LOG = path.join(ROOT, 'memory/sessions/token_log.json');
const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');
const DIAG = path.join(ROOT, 'logs', 'hook-diagnostics.log');
async function aggregate(fp) {
    const u = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, messageCount: 0, masterTurns: 0, total_billable: 0 };
    if (!fs.existsSync(fp))
        return u;
    const rl = readline.createInterface({ input: fs.createReadStream(fp, { encoding: 'utf-8' }), crlfDelay: Infinity });
    for await (const line of rl) {
        if (!line.trim())
            continue;
        try {
            const o = JSON.parse(line);
            if (o.type === 'user') {
                const c = o?.message?.content;
                const isMaster = typeof c === 'string' || (Array.isArray(c) && c[0]?.type === 'text');
                if (isMaster)
                    u.masterTurns += 1;
            }
            const usage = o?.message?.usage || o?.usage;
            if (usage) {
                u.input_tokens += usage.input_tokens || 0;
                u.output_tokens += usage.output_tokens || 0;
                u.cache_creation_input_tokens += usage.cache_creation_input_tokens || 0;
                u.cache_read_input_tokens += usage.cache_read_input_tokens || 0;
                u.messageCount += 1;
            }
        }
        catch { }
    }
    u.total_billable = u.input_tokens + u.output_tokens + u.cache_creation_input_tokens + u.cache_read_input_tokens;
    return u;
}
function cwdToDir(cwd) {
    // Claude Code encodes cwd as project-dir name by replacing :, \, /, . all with '-'
    return cwd.replace(/[\\/:.]/g, '-').toLowerCase();
}
function parseDiag() {
    const lines = fs.readFileSync(DIAG, 'utf-8').split(/\r?\n/);
    const fires = [];
    let pending = null;
    for (const line of lines) {
        const fm = line.match(/^\[([^\]]+)\] \[session-end-tokens\] FIRED .* cwd=(.+)$/);
        if (fm && fm[1] && fm[2]) {
            if (pending)
                fires.push(pending);
            pending = { ts: new Date(fm[1]).getTime(), cwd: fm[2].trim(), aborted: false };
            continue;
        }
        const am = line.match(/^\[([^\]]+)\] \[session-end-tokens\] ABORT/);
        if (am && pending) {
            pending.aborted = true;
            fires.push(pending);
            pending = null;
        }
        const om = line.match(/^\[([^\]]+)\] \[session-end-tokens\] OK/);
        if (om && pending) {
            pending.aborted = false;
            fires.push(pending);
            pending = null;
        }
    }
    if (pending)
        fires.push(pending);
    return fires;
}
async function main() {
    const targets = process.argv.slice(2);
    if (targets.length === 0) {
        console.error('Usage: ts-node scripts/append-missing-tokens.ts session_NNN ...');
        process.exit(1);
    }
    const log = JSON.parse(fs.readFileSync(TOKEN_LOG, 'utf-8'));
    const entries = log.entries || [];
    const fires = parseDiag().filter(f => f.aborted && /worktrees/i.test(f.cwd));
    fires.sort((a, b) => a.ts - b.ts);
    if (fires.length < targets.length) {
        console.warn(`Warning: ${fires.length} aborted worktree fires but ${targets.length} targets`);
    }
    for (let i = 0; i < targets.length; i++) {
        const sid = targets[i];
        const fire = fires[i + Math.max(0, fires.length - targets.length)];
        if (!sid || !fire) {
            console.warn(`${sid}: no fire slot`);
            continue;
        }
        const dirName = cwdToDir(fire.cwd);
        let matched = null;
        for (const d of fs.readdirSync(PROJECTS_DIR)) {
            if (d.toLowerCase() === dirName) {
                matched = d;
                break;
            }
        }
        if (!matched) {
            console.warn(`${sid}: no projects dir for ${fire.cwd}`);
            continue;
        }
        const dp = path.join(PROJECTS_DIR, matched);
        const files = fs.readdirSync(dp).filter(f => f.endsWith('.jsonl'))
            .map(f => { const fp = path.join(dp, f); const st = fs.statSync(fp); return { fp, mtime: st.mtimeMs, size: st.size }; })
            .filter(f => f.size > 0)
            .sort((a, b) => Math.abs(a.mtime - fire.ts) - Math.abs(b.mtime - fire.ts));
        if (files.length === 0) {
            console.warn(`${sid}: no .jsonl in ${matched}`);
            continue;
        }
        const chosen = files[0].fp;
        const usage = await aggregate(chosen);
        if (usage.messageCount === 0) {
            console.warn(`${sid}: empty transcript ${chosen}`);
            continue;
        }
        const filtered = entries.filter(e => e.legendSessionId !== sid);
        filtered.push({
            capturedAt: new Date().toISOString(),
            cliSessionId: path.basename(chosen, '.jsonl'),
            legendSessionId: sid,
            transcriptPath: chosen,
            usage,
            source: 'append-missing-tokens.ts (PD-016 recovery)',
        });
        entries.length = 0;
        entries.push(...filtered);
        console.log(`${sid}: via ${matched}  msg=${usage.messageCount} master=${usage.masterTurns} billable=${usage.total_billable} cache_read=${usage.cache_read_input_tokens}`);
    }
    entries.sort((a, b) => (a.legendSessionId || '').localeCompare(b.legendSessionId || ''));
    log.entries = entries;
    log.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TOKEN_LOG, JSON.stringify(log, null, 2) + '\n');
    console.log(`token_log.json entries=${entries.length}`);
}
main().catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=append-missing-tokens.js.map