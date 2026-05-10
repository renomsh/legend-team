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
// PD-023 P0b smoke test — lib unit + fixture schema check
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const metric_normalizer_1 = require("./lib/metric-normalizer");
const aggregation_strategies_1 = require("./lib/aggregation-strategies");
const alert_evaluator_1 = require("./lib/alert-evaluator");
const write_atomic_1 = require("./lib/write-atomic");
const derived_metric_compute_1 = require("./lib/derived-metric-compute");
const confidence_interval_1 = require("./lib/confidence-interval");
let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
    if (cond) {
        pass++;
        console.log(`  PASS  ${name}`);
    }
    else {
        fail++;
        console.log(`  FAIL  ${name}${detail ? "  -- " + detail : ""}`);
    }
}
console.log("[normalizer]");
ok("0-5 ×20", (0, metric_normalizer_1.normalize)(4, "0-5") === 80);
ok("0-5 boundary 0", (0, metric_normalizer_1.normalize)(0, "0-5") === 0);
ok("0-5 boundary 5", (0, metric_normalizer_1.normalize)(5, "0-5") === 100);
ok("Y/N Y=100", (0, metric_normalizer_1.normalize)("Y", "Y/N") === 100);
ok("Y/N N=0", (0, metric_normalizer_1.normalize)("N", "Y/N") === 0);
ok("ratio ×100", (0, metric_normalizer_1.normalize)(0.75, "ratio") === 75);
ok("percentile passthrough", (0, metric_normalizer_1.normalize)(42, "percentile") === 42);
let threw = false;
try {
    (0, metric_normalizer_1.normalize)(6, "0-5");
}
catch {
    threw = true;
}
ok("0-5 reject >5 (E-004)", threw);
ok("polarity higher unchanged", (0, metric_normalizer_1.applyPolarity)(80, "higher-better") === 80);
ok("polarity lower flips", (0, metric_normalizer_1.applyPolarity)(80, "lower-better") === 20);
console.log("[aggregation]");
const r1 = mockScore("session_002", "ace", 1);
const r2 = mockScore("session_001", "ace", 0);
const sorted = (0, aggregation_strategies_1.sortDeterministic)([r1, r2]);
ok("sort by sessionId asc", sorted[0].sessionId === "session_001");
ok("strategy all-sessions returns all", (0, aggregation_strategies_1.applyStrategy)([r1, r2], "all-sessions").length === 2);
ok("strategy invoked filters", (0, aggregation_strategies_1.applyStrategy)([r1, r2], "invoked-sessions-only", { invokedSessions: new Set(["session_001"]) }).length === 1);
console.log("[alerts]");
ok("red below threshold", (0, alert_evaluator_1.evaluateAlert)(40, null, { redBelow: 50 }).level === "red");
ok("yellow below threshold", (0, alert_evaluator_1.evaluateAlert)(60, null, { yellowBelow: 70 }).level === "yellow");
ok("ok above thresholds", (0, alert_evaluator_1.evaluateAlert)(80, null, { redBelow: 50, yellowBelow: 70 }).level === "ok");
ok("trend drop triggers yellow", (0, alert_evaluator_1.evaluateAlert)(70, 100, { trendDropPct: 20 }).level === "yellow");
console.log("[derived weighted-mean]");
const metrics = [stubMetric("a", "higher-better"), stubMetric("b", "lower-better")];
const lookup = (id) => metrics.find(m => m.id === id);
const dr = (0, derived_metric_compute_1.computeDerived)({ formula: "weighted-mean", inputs: [{ metricId: "a", weight: 1 }, { metricId: "b", weight: 1 }], polarityNormalized: true, nullPolicy: "weight-renormalize" }, [{ metricId: "a", normalizedScore: 80 }, { metricId: "b", normalizedScore: 30 }], lookup);
// b is lower-better → flipped to 70; mean(80,70)=75
ok("derived weighted-mean polarity-normalized", dr.value === 75, `got ${dr.value}`);
const drNull = (0, derived_metric_compute_1.computeDerived)({ formula: "weighted-mean", inputs: [{ metricId: "a", weight: 1 }, { metricId: "b", weight: 1 }], polarityNormalized: false, nullPolicy: "propagate-null" }, [{ metricId: "a", normalizedScore: 80 }, { metricId: "b", normalizedScore: null }], lookup);
ok("derived propagate-null", drNull.value === null);
console.log("[confidence-interval]");
const ci = (0, confidence_interval_1.meanStdCI)([60, 80, 60, 80, 100, 80, 60, 80, 100, 80]);
ok("mean=78", ci.mean === 78);
ok("n=10", ci.n === 10);
ok("ci95 present (n>=3)", Array.isArray(ci.ci95));
const ciSmall = (0, confidence_interval_1.meanStdCI)([80, 80]);
ok("ci95 null when n<3", ciSmall.ci95 === null);
console.log("[write-atomic]");
const tmpFile = path.join(__dirname, "..", "tests", "fixtures", "_atomic_test.txt");
(0, write_atomic_1.writeAtomic)(tmpFile, "hello");
ok("atomic write", fs.readFileSync(tmpFile, "utf8") === "hello");
fs.unlinkSync(tmpFile);
console.log("[fixtures schema sanity]");
const baselinePath = path.join(__dirname, "..", "tests", "fixtures", "signature-metrics", "baseline-10", "self_scores.jsonl");
const lines = fs.readFileSync(baselinePath, "utf8").trim().split(/\r?\n/);
ok("baseline-10 line count", lines.length === 10);
const required = ["recordId", "sessionId", "topicId", "topicType", "role", "metricId", "raterId", "rawScore", "normalizedScore", "registryVersion", "recordedBy", "recordSource", "sessionPhase", "ts"];
const allHave = lines.every(l => {
    const obj = JSON.parse(l);
    return required.every(k => k in obj);
});
ok("baseline-10 records have required fields", allHave);
console.log("[role_registry / phase_dod / feature_flags]");
const rr = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "memory", "shared", "role_registry.json"), "utf8"));
ok("role_registry has 8 roles", rr.roles.length === 8);
const pd = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "memory", "growth", "phase_dod.json"), "utf8"));
ok("phase_dod has 7 phases (P0a~P5)", Object.keys(pd.phases).length === 7);
const ff = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "memory", "shared", "feature_flags.json"), "utf8"));
ok("feature_flags signatureMetricsEnabled=true", ff.flags.signatureMetricsEnabled === true);
console.log(`\n[total] pass=${pass} fail=${fail}`);
if (fail > 0)
    process.exit(1);
function mockScore(sessionId, role, n) {
    return {
        recordId: `r-${n}`,
        sessionId,
        topicId: "topic_x",
        topicType: "framing",
        role,
        metricId: "m.x",
        raterId: role,
        rawScore: 4,
        normalizedScore: 80,
        registryVersion: "v1.0",
        recordedBy: role,
        recordSource: "yaml-block",
        sessionPhase: "framing",
        ts: `2026-04-${String(10 + n).padStart(2, "0")}T00:00:00Z`,
    };
}
function stubMetric(id, polarity) {
    return {
        id, shortKey: id, role: "x", scope: "role", axis: "learning",
        scale: "0-5", polarity, construct: "stub", externalAnchor: ["stub"],
        validityCheck: "monthly", rater: { type: "self" }, raterWeights: { self: 1 },
        timing: "immediate", aggregation: "all-sessions", baselineSessions: 0,
        lifecycleState: "active", inputPriority: "core",
        defaultStrategy: "previous-session-value", missingPenalty: "warn",
        applicableTopicTypes: ["framing"], participationExpectedTopicTypes: ["framing"],
    };
}
//# sourceMappingURL=test-p0b-smoke.js.map