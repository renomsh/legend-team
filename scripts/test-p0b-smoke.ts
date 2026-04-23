// PD-023 P0b smoke test — lib unit + fixture schema check
import * as fs from "fs";
import * as path from "path";
import { normalize, applyPolarity } from "./lib/metric-normalizer";
import { sortDeterministic, applyStrategy } from "./lib/aggregation-strategies";
import { evaluateAlert } from "./lib/alert-evaluator";
import { writeAtomic } from "./lib/write-atomic";
import { computeDerived } from "./lib/derived-metric-compute";
import { meanStdCI } from "./lib/confidence-interval";
import type { Metric, ScoreRecord } from "./lib/signature-metrics-types";

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? "  -- " + detail : ""}`);
  }
}

console.log("[normalizer]");
ok("0-5 ×20", normalize(4, "0-5") === 80);
ok("0-5 boundary 0", normalize(0, "0-5") === 0);
ok("0-5 boundary 5", normalize(5, "0-5") === 100);
ok("Y/N Y=100", normalize("Y", "Y/N") === 100);
ok("Y/N N=0", normalize("N", "Y/N") === 0);
ok("ratio ×100", normalize(0.75, "ratio") === 75);
ok("percentile passthrough", normalize(42, "percentile") === 42);
let threw = false;
try { normalize(6, "0-5"); } catch { threw = true; }
ok("0-5 reject >5 (E-004)", threw);
ok("polarity higher unchanged", applyPolarity(80, "higher-better") === 80);
ok("polarity lower flips", applyPolarity(80, "lower-better") === 20);

console.log("[aggregation]");
const r1: ScoreRecord = mockScore("session_002", "ace", 1);
const r2: ScoreRecord = mockScore("session_001", "ace", 0);
const sorted = sortDeterministic([r1, r2]);
ok("sort by sessionId asc", sorted[0]!.sessionId === "session_001");
ok("strategy all-sessions returns all", applyStrategy([r1, r2], "all-sessions").length === 2);
ok("strategy invoked filters", applyStrategy([r1, r2], "invoked-sessions-only", { invokedSessions: new Set(["session_001"]) }).length === 1);

console.log("[alerts]");
ok("red below threshold", evaluateAlert(40, null, { redBelow: 50 }).level === "red");
ok("yellow below threshold", evaluateAlert(60, null, { yellowBelow: 70 }).level === "yellow");
ok("ok above thresholds", evaluateAlert(80, null, { redBelow: 50, yellowBelow: 70 }).level === "ok");
ok("trend drop triggers yellow", evaluateAlert(70, 100, { trendDropPct: 20 }).level === "yellow");

console.log("[derived weighted-mean]");
const metrics: Metric[] = [stubMetric("a", "higher-better"), stubMetric("b", "lower-better")];
const lookup = (id: string) => metrics.find(m => m.id === id);
const dr = computeDerived(
  { formula: "weighted-mean", inputs: [{ metricId: "a", weight: 1 }, { metricId: "b", weight: 1 }], polarityNormalized: true, nullPolicy: "weight-renormalize" },
  [{ metricId: "a", normalizedScore: 80 }, { metricId: "b", normalizedScore: 30 }],
  lookup,
);
// b is lower-better → flipped to 70; mean(80,70)=75
ok("derived weighted-mean polarity-normalized", dr.value === 75, `got ${dr.value}`);

const drNull = computeDerived(
  { formula: "weighted-mean", inputs: [{ metricId: "a", weight: 1 }, { metricId: "b", weight: 1 }], polarityNormalized: false, nullPolicy: "propagate-null" },
  [{ metricId: "a", normalizedScore: 80 }, { metricId: "b", normalizedScore: null }],
  lookup,
);
ok("derived propagate-null", drNull.value === null);

console.log("[confidence-interval]");
const ci = meanStdCI([60, 80, 60, 80, 100, 80, 60, 80, 100, 80]);
ok("mean=78", ci.mean === 78);
ok("n=10", ci.n === 10);
ok("ci95 present (n>=3)", Array.isArray(ci.ci95));
const ciSmall = meanStdCI([80, 80]);
ok("ci95 null when n<3", ciSmall.ci95 === null);

console.log("[write-atomic]");
const tmpFile = path.join(__dirname, "..", "tests", "fixtures", "_atomic_test.txt");
writeAtomic(tmpFile, "hello");
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
if (fail > 0) process.exit(1);

function mockScore(sessionId: string, role: string, n: number): ScoreRecord {
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

function stubMetric(id: string, polarity: "higher-better" | "lower-better"): Metric {
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
