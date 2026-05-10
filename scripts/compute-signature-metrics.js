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
exports.compute = compute;
// PD-023 P4 — compute-signature-metrics
// Reads memory/growth/self_scores.jsonl + metrics_registry.json
// Produces memory/growth/signature_metrics_aggregate.json with 3 views (all/recent10/recent3)
// Supports stratified-by-grade, alerts, weighted-mean derived metrics, SLA measurement.
//
// Usage:
//   npx ts-node scripts/compute-signature-metrics.ts
//   npx ts-node scripts/compute-signature-metrics.ts --fixture tests/fixtures/signature-metrics/baseline-10
//   npx ts-node scripts/compute-signature-metrics.ts --out memory/growth/signature_metrics_aggregate.json
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const confidence_interval_1 = require("./lib/confidence-interval");
const aggregation_strategies_1 = require("./lib/aggregation-strategies");
const derived_metric_compute_1 = require("./lib/derived-metric-compute");
const alert_evaluator_1 = require("./lib/alert-evaluator");
const write_atomic_1 = require("./lib/write-atomic");
const ROOT = path.join(__dirname, "..");
function readJsonl(filePath) {
    if (!fs.existsSync(filePath))
        return [];
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
    const out = [];
    for (const line of lines) {
        try {
            out.push(JSON.parse(line));
        }
        catch {
            // skip corrupt lines
        }
    }
    return out;
}
function buildSessionGradeMap() {
    const idxPath = path.join(ROOT, "memory", "sessions", "session_index.json");
    if (!fs.existsSync(idxPath))
        return {};
    try {
        const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));
        const sessions = idx.sessions ?? idx;
        const map = {};
        if (Array.isArray(sessions)) {
            for (const s of sessions) {
                if (s.sessionId && s.grade)
                    map[s.sessionId] = s.grade;
            }
        }
        else if (typeof sessions === "object") {
            for (const sid of Object.keys(sessions)) {
                const s = sessions[sid];
                if (s && s.grade)
                    map[sid] = s.grade;
            }
        }
        return map;
    }
    catch {
        return {};
    }
}
const VIEWS = ["all", "recent10", "recent3"];
function takeView(records, view) {
    // records arrive sorted asc by (sessionId, raterId, ts)
    if (view === "all")
        return records;
    const k = view === "recent10" ? 10 : 3;
    return records.slice(Math.max(0, records.length - k));
}
function aggregateMetric(metric, records, sessionGrade, warnings) {
    const out = [];
    // Filter to this metric
    const metricRecords = records.filter(r => r.metricId === metric.id);
    if (metricRecords.length === 0) {
        for (const view of VIEWS) {
            out.push({
                metricId: metric.id,
                role: metric.role,
                view,
                mean: null,
                n: 0,
                std: 0,
                ci95: null,
            });
        }
        return out;
    }
    // Apply strategy (currently sorts; stratified handled below)
    const ctx = metric.aggregation === "stratified-by-grade"
        ? { sessionGrade }
        : {};
    const sorted = (0, aggregation_strategies_1.applyStrategy)(metricRecords, metric.aggregation, ctx);
    // Compute "main" view rows (no stratum)
    const mainViews = {};
    for (const view of VIEWS) {
        const slice = takeView(sorted, view);
        const values = slice.map(r => r.normalizedScore);
        const stats = (0, confidence_interval_1.meanStdCI)(values);
        if (slice.length > 0 && slice.length < 3) {
            // baseline note — under spec §4.3 view considered partial
        }
        const row = {
            metricId: metric.id,
            role: metric.role,
            view,
            mean: stats.n === 0 ? null : stats.mean,
            n: stats.n,
            std: stats.std,
            ci95: stats.ci95,
        };
        if (metric.alerts && row.mean !== null && view === "all") {
            // previous mean = mean excluding most recent slice (recent3) for trend
            const trendSlice = sorted.slice(0, Math.max(0, sorted.length - 3));
            const prev = trendSlice.length > 0
                ? (0, confidence_interval_1.meanStdCI)(trendSlice.map(r => r.normalizedScore)).mean
                : null;
            row.alert = (0, alert_evaluator_1.evaluateAlert)(row.mean, prev, metric.alerts);
        }
        mainViews[view] = row;
        out.push(row);
    }
    // Stratified-by-grade — also emit per-grade rows for view=all (read by drill-down)
    if (metric.aggregation === "stratified-by-grade") {
        const byGrade = {};
        for (const r of sorted) {
            const g = sessionGrade[r.sessionId];
            if (!g)
                continue;
            (byGrade[g] ||= []).push(r);
        }
        for (const grade of Object.keys(byGrade).sort()) {
            const slice = byGrade[grade];
            if (slice.length < 3) {
                warnings.push(`E-016 ${metric.id} stratum grade=${grade} n=${slice.length} < 3`);
            }
            const stats = (0, confidence_interval_1.meanStdCI)(slice.map(r => r.normalizedScore));
            out.push({
                metricId: metric.id,
                role: metric.role,
                view: "all",
                mean: stats.n === 0 ? null : stats.mean,
                n: stats.n,
                std: stats.std,
                ci95: stats.ci95,
                stratum: { grade },
            });
        }
    }
    return out;
}
function computeDerivedRows(registry, baseAggregates, warnings) {
    const out = [];
    const baseLookup = new Map();
    for (const a of baseAggregates) {
        if (a.stratum)
            continue;
        baseLookup.set(`${a.metricId}|${a.view}`, a);
    }
    const metricLookup = (id) => registry.metrics.find(m => m.id === id);
    for (const m of registry.metrics) {
        if (m.type !== "derived" || !m.composition)
            continue;
        for (const view of VIEWS) {
            const inputs = m.composition.inputs.map(i => {
                const row = baseLookup.get(`${i.metricId}|${view}`);
                return { metricId: i.metricId, normalizedScore: row?.mean ?? null };
            });
            try {
                const result = (0, derived_metric_compute_1.computeDerived)(m.composition, inputs, metricLookup);
                out.push({
                    metricId: m.id,
                    role: m.role,
                    view,
                    mean: result.value,
                    n: inputs.filter(i => i.normalizedScore !== null).length,
                    std: 0,
                    ci95: null,
                });
                if (result.reason)
                    warnings.push(`${m.id} ${view}: ${result.reason}`);
            }
            catch (e) {
                warnings.push(`${m.id} ${view}: derived failed — ${e.message}`);
            }
        }
    }
    return out;
}
function compute(opts = {}) {
    const registryPath = opts.registryPath ?? path.join(ROOT, "memory", "growth", "metrics_registry.json");
    const sourceJsonl = opts.fixture
        ? path.join(opts.fixture, "self_scores.jsonl")
        : path.join(ROOT, "memory", "growth", "self_scores.jsonl");
    const slaWarnMs = opts.slaWarnMs ?? readSlaThreshold();
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    const records = (0, aggregation_strategies_1.sortDeterministic)(readJsonl(sourceJsonl));
    const sessionGrade = buildSessionGradeMap();
    const warnings = [];
    const t0 = Date.now();
    const aggregates = [];
    for (const m of registry.metrics) {
        if (m.type === "derived")
            continue;
        aggregates.push(...aggregateMetric(m, records, sessionGrade, warnings));
    }
    const derived = computeDerivedRows(registry, aggregates, warnings);
    const durationMs = Date.now() - t0;
    const slaBreached = durationMs > slaWarnMs;
    if (slaBreached)
        warnings.push(`E-010 compute SLA exceeded: ${durationMs}ms > ${slaWarnMs}ms`);
    return {
        computedAt: new Date().toISOString(),
        registryVersion: registry.registryVersion,
        durationMs,
        slaWarnMs,
        slaBreached,
        sourceJsonl: path.relative(ROOT, sourceJsonl),
        recordCount: records.length,
        metricCount: registry.metrics.length,
        aggregates,
        derivedAggregates: derived,
        warnings,
    };
}
function readSlaThreshold() {
    const p = path.join(ROOT, "memory", "shared", "feature_flags.json");
    if (!fs.existsSync(p))
        return 3000;
    try {
        const f = JSON.parse(fs.readFileSync(p, "utf8"));
        return f.flags?.computeSlaWarnMs ?? 3000;
    }
    catch {
        return 3000;
    }
}
// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const opts = {};
    let outPath = path.join(ROOT, "memory", "growth", "signature_metrics_aggregate.json");
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--fixture")
            opts.fixture = args[++i];
        else if (args[i] === "--out")
            outPath = args[++i];
        else if (args[i] === "--registry")
            opts.registryPath = args[++i];
        else if (args[i] === "--sla-ms")
            opts.slaWarnMs = Number(args[++i]);
    }
    const out = compute(opts);
    (0, write_atomic_1.writeAtomic)(outPath, JSON.stringify(out, null, 2) + "\n");
    console.log("[compute-signature-metrics]");
    console.log(`  source:      ${out.sourceJsonl}`);
    console.log(`  records:     ${out.recordCount}`);
    console.log(`  metrics:     ${out.metricCount}`);
    console.log(`  aggregates:  ${out.aggregates.length}`);
    console.log(`  derived:     ${out.derivedAggregates.length}`);
    console.log(`  duration:    ${out.durationMs}ms (SLA ${out.slaWarnMs}ms ${out.slaBreached ? "BREACH" : "OK"})`);
    if (out.warnings.length > 0) {
        console.log(`  warnings:    ${out.warnings.length}`);
        for (const w of out.warnings.slice(0, 5))
            console.log(`    - ${w}`);
    }
    console.log(`  written:     ${path.relative(ROOT, outPath)}`);
}
//# sourceMappingURL=compute-signature-metrics.js.map