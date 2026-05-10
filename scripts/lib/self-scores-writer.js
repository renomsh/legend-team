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
exports.ExtensionsNamespaceError = exports.OrphanMetricError = exports.PATHS = void 0;
exports.loadRegistry = loadRegistry;
exports.findMetric = findMetric;
exports.buildRecord = buildRecord;
exports.appendScore = appendScore;
exports.queueDeferred = queueDeferred;
exports.quarantine = quarantine;
exports.readScores = readScores;
// PD-023 P2 — self_scores.jsonl writer + validator + pending_deferred + quarantine
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const write_atomic_1 = require("./write-atomic");
const metric_normalizer_1 = require("./metric-normalizer");
const ROOT = path.join(__dirname, "..", "..");
exports.PATHS = {
    jsonl: path.join(ROOT, "memory", "growth", "self_scores.jsonl"),
    pending: path.join(ROOT, "memory", "growth", "pending_deferred_scores.json"),
    quarantine: path.join(ROOT, "memory", "growth", "_quarantine"),
    registry: path.join(ROOT, "memory", "growth", "metrics_registry.json"),
};
let cachedRegistry = null;
function loadRegistry(force = false) {
    if (cachedRegistry && !force)
        return cachedRegistry;
    if (!fs.existsSync(exports.PATHS.registry)) {
        throw new Error(`E-001 registry not found: ${exports.PATHS.registry}`);
    }
    cachedRegistry = JSON.parse(fs.readFileSync(exports.PATHS.registry, "utf8"));
    return cachedRegistry;
}
function findMetric(metricId) {
    return loadRegistry().metrics.find(m => m.id === metricId);
}
class OrphanMetricError extends Error {
    code = "E-002";
    constructor(metricId) { super(`E-002 orphan metricId: ${metricId}`); }
}
exports.OrphanMetricError = OrphanMetricError;
class ExtensionsNamespaceError extends Error {
    code = "E-022";
    constructor(key) { super(`E-022 extensions namespace violation: ${key} (must be extensions.{moduleId}.*)`); }
}
exports.ExtensionsNamespaceError = ExtensionsNamespaceError;
function validateExtensions(ext) {
    if (!ext)
        return;
    for (const k of Object.keys(ext)) {
        const v = ext[k];
        if (typeof v !== "object" || v === null || Array.isArray(v)) {
            throw new ExtensionsNamespaceError(k);
        }
    }
}
function buildRecord(input) {
    const metric = findMetric(input.metricId);
    if (!metric)
        throw new OrphanMetricError(input.metricId);
    // D-092 session_101: polarity-aligned 100점 환산 (높을수록 좋음 단일 방향)
    const normalizedScore = (0, metric_normalizer_1.applyPolarity)((0, metric_normalizer_1.normalize)(input.rawScore, metric.scale), metric.polarity);
    validateExtensions(input.extensions);
    const reg = loadRegistry();
    const ts = new Date().toISOString();
    const recordId = "r-" + crypto.createHash("sha1")
        .update(`${input.sessionId}|${input.role}|${input.metricId}|${input.raterId}|${ts}`)
        .digest("hex").slice(0, 12);
    const rec = {
        recordId,
        sessionId: input.sessionId,
        topicId: input.topicId,
        topicType: input.topicType,
        role: input.role,
        metricId: input.metricId,
        raterId: input.raterId,
        rawScore: input.rawScore,
        normalizedScore,
        registryVersion: reg.registryVersion,
        recordedBy: input.recordedBy,
        recordSource: input.recordSource,
        sessionPhase: input.sessionPhase,
        ts,
        extensions: input.extensions ?? {},
    };
    if (input.confidence !== undefined)
        rec.confidence = input.confidence;
    if (input.supersedes !== undefined)
        rec.supersedes = input.supersedes;
    if (input.overrideReason !== undefined)
        rec.overrideReason = input.overrideReason;
    return rec;
}
function appendScore(input) {
    const rec = buildRecord(input);
    (0, write_atomic_1.appendAtomicLine)(exports.PATHS.jsonl, JSON.stringify(rec));
    return rec;
}
function queueDeferred(item) {
    const list = fs.existsSync(exports.PATHS.pending)
        ? JSON.parse(fs.readFileSync(exports.PATHS.pending, "utf8")).items ?? []
        : [];
    list.push({ ...item, queuedAt: new Date().toISOString() });
    (0, write_atomic_1.writeAtomic)(exports.PATHS.pending, JSON.stringify({ items: list }, null, 2) + "\n");
}
function quarantine(reason, payload) {
    fs.mkdirSync(exports.PATHS.quarantine, { recursive: true });
    const fname = `q-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.json`;
    const fpath = path.join(exports.PATHS.quarantine, fname);
    (0, write_atomic_1.writeAtomic)(fpath, JSON.stringify({ reason, payload, ts: new Date().toISOString() }, null, 2) + "\n");
    return fpath;
}
function readScores(filterFn) {
    if (!fs.existsSync(exports.PATHS.jsonl))
        return [];
    const lines = fs.readFileSync(exports.PATHS.jsonl, "utf8").split(/\r?\n/).filter(Boolean);
    const records = [];
    for (const line of lines) {
        try {
            const r = JSON.parse(line);
            if (!filterFn || filterFn(r))
                records.push(r);
        }
        catch (e) {
            // corrupt line — quarantine
            quarantine("E-003 jsonl line parse failure", { line, error: String(e) });
        }
    }
    return records;
}
//# sourceMappingURL=self-scores-writer.js.map