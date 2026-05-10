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
exports.finalize = finalize;
// PD-023 P3 — finalize self-scores from session turns
// - YAML block parsing (# self-scores …)
// - default lookup (previous-session-value) + defaultUsageCount tracking
// - supersedes chain tracking (latest wins)
// - topicType-aware participation (no missing-count for non-applicable roles)
// - audit fields: rater type, source, ts, sessionPhase, topicType (5 non-null)
//
// Usage:
//   npx ts-node scripts/finalize-self-scores.ts                            # uses current_session.json
//   npx ts-node scripts/finalize-self-scores.ts --session session_083
//   npx ts-node scripts/finalize-self-scores.ts --transcript path/to.jsonl
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const self_scores_writer_1 = require("./lib/self-scores-writer");
const ROOT = path.join(__dirname, "..");
const CURRENT = path.join(ROOT, "memory", "sessions", "current_session.json");
function readCurrent() {
    const j = JSON.parse(fs.readFileSync(CURRENT, "utf8"));
    return {
        sessionId: j.sessionId,
        topicId: j.topicId ?? "topic_unknown",
        topicType: j.topicType ?? "standalone",
        turns: j.turns ?? [],
    };
}
// Parse YAML blocks of form:
//   # self-scores
//   metric_short_or_id: value
//   another: Y
function parseYamlBlocks(text) {
    const out = new Map();
    const lines = text.split(/\r?\n/);
    let inBlock = false;
    let currentRole = null;
    let bag = {};
    function flush() {
        if (currentRole && Object.keys(bag).length > 0) {
            out.set(currentRole, { ...(out.get(currentRole) ?? {}), ...bag });
        }
        bag = {};
        inBlock = false;
    }
    for (const raw of lines) {
        const line = raw.trim();
        const roleMarker = line.match(/^\[ROLE:(\w+)\]$/);
        if (roleMarker) {
            flush();
            currentRole = roleMarker[1];
            continue;
        }
        if (line.startsWith("# self-scores")) {
            inBlock = true;
            continue;
        }
        if (inBlock) {
            if (line === "" || line.startsWith("#") || line.startsWith("---")) {
                flush();
                continue;
            }
            const m = line.match(/^([\w.-]+):\s*(.+?)\s*(#.*)?$/);
            if (!m) {
                flush();
                continue;
            }
            const key = m[1];
            const valRaw = m[2].trim();
            const num = Number(valRaw);
            bag[key] = Number.isFinite(num) && /^-?\d/.test(valRaw) ? num : valRaw;
        }
    }
    flush();
    return out;
}
// Resolve shortKey OR full id → metricId
function resolveMetricId(key, role) {
    if ((0, self_scores_writer_1.findMetric)(key))
        return key;
    const reg = (0, self_scores_writer_1.loadRegistry)();
    const hit = reg.metrics.find(m => m.role === role && (m.shortKey === key || m.id === key || m.id.endsWith("." + key)));
    return hit ? hit.id : null;
}
function previousValue(metricId, role) {
    // Look at the most recent record for (role, metricId)
    const all = (0, self_scores_writer_1.readScores)(r => r.role === role && r.metricId === metricId);
    if (all.length === 0)
        return null;
    const latest = all.sort((a, b) => a.ts < b.ts ? 1 : -1)[0];
    return { rawScore: latest.rawScore, raterId: latest.raterId };
}
function auditNonNullRatio(rec) {
    const fields = [rec.recordSource, rec.ts, rec.sessionPhase, rec.topicType, rec.rater?.type ?? rec.recordedBy];
    return fields.filter(f => f !== null && f !== undefined && f !== "").length / fields.length;
}
function finalize(opts = {}) {
    const info = opts.sessionInfo ?? readCurrent();
    const reg = (0, self_scores_writer_1.loadRegistry)();
    // 1) Build per-role score bag
    const roleScores = new Map();
    if (opts.transcript && fs.existsSync(opts.transcript)) {
        const text = fs.readFileSync(opts.transcript, "utf8");
        parseYamlBlocks(text).forEach((v, k) => roleScores.set(k, v));
    }
    for (const t of info.turns) {
        if (t.selfScores && Object.keys(t.selfScores).length > 0) {
            const cur = roleScores.get(t.role) ?? {};
            roleScores.set(t.role, { ...cur, ...t.selfScores });
        }
    }
    const report = {
        sessionId: info.sessionId,
        topicId: info.topicId,
        topicType: info.topicType,
        recordsWritten: 0,
        defaultsUsed: [],
        orphans: [],
        supersededChains: 0,
        participationGaps: [],
        auditNonNullRate: 1,
    };
    const auditScores = [];
    const turnPhase = {};
    for (const t of info.turns)
        if (t.phase)
            turnPhase[t.role] = t.phase;
    // 2) Iterate registry per metric — D-092: 발언한 역할(selfScores 박제) = 적재. 토픽 타입별 expected 게이트 폐기.
    for (const metric of reg.metrics) {
        if (!metric.applicableTopicTypes.includes(info.topicType))
            continue;
        const role = metric.role;
        if (role === "session" || role === "cross-role")
            continue; // derived handled by compute
        const bag = roleScores.get(role) ?? {};
        // try shortKey then full id
        const presentKey = Object.keys(bag).find(k => {
            const rid = resolveMetricId(k, role);
            return rid === metric.id;
        });
        let rawScore = null;
        let source = "yaml-block";
        let raterId = role;
        if (presentKey !== undefined) {
            rawScore = bag[presentKey];
        }
        // D-092 session_101: default-fallback 폐기. 미기입은 빈 칸으로 둠.
        if (rawScore === null) {
            continue;
        }
        try {
            const prevForSupersede = previousValue(metric.id, role);
            const rec = (0, self_scores_writer_1.appendScore)({
                sessionId: info.sessionId,
                topicId: info.topicId,
                topicType: info.topicType,
                role,
                metricId: metric.id,
                raterId: metric.rater.type === "external" && metric.rater.by ? metric.rater.by : raterId,
                rawScore,
                recordedBy: "finalize:yaml",
                recordSource: source,
                sessionPhase: turnPhase[role] ?? "unknown",
            });
            report.recordsWritten++;
            auditScores.push(auditNonNullRatio(rec));
        }
        catch (e) {
            if (e instanceof self_scores_writer_1.OrphanMetricError) {
                report.orphans.push({ role, key: metric.id });
            }
            else {
                throw e;
            }
        }
    }
    if (auditScores.length > 0) {
        report.auditNonNullRate = auditScores.reduce((a, b) => a + b, 0) / auditScores.length;
    }
    return report;
}
// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    let transcript;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--transcript")
            transcript = args[++i];
    }
    const opts = {};
    if (transcript)
        opts.transcript = transcript;
    const r = finalize(opts);
    console.log("[finalize-self-scores]");
    console.log(`  session:        ${r.sessionId}`);
    console.log(`  topicType:      ${r.topicType}`);
    console.log(`  recordsWritten: ${r.recordsWritten}`);
    console.log(`  defaultsUsed:   ${r.defaultsUsed.length}`);
    console.log(`  orphans:        ${r.orphans.length}`);
    console.log(`  participationGaps (expected but missing, no prev value): ${r.participationGaps.length}`);
    console.log(`  audit non-null rate: ${(r.auditNonNullRate * 100).toFixed(1)}%`);
    if (r.auditNonNullRate < 0.95) {
        console.error(`  WARN: audit non-null rate < 95% (DoD breach)`);
    }
}
//# sourceMappingURL=finalize-self-scores.js.map