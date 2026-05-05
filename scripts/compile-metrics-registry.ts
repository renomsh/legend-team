// PD-023 P1 — Compile metrics_registry.json from per-role memory + derived_metrics.json
// v1.1 (PD-063 Phase 2, session_192) — A-1 aggregate-SOT 격상:
//   - role_memory.metrics 필드 ingest (D-092 정합. 이전 signatureMetrics 키는 dead)
//   - aggregate (self_scores.jsonl 산출)에 있는 historical ID는 stub으로 보존(폐기 아님)
//   - 누락 required 필드는 stub 기본값으로 fill (Jobs OUT 1번 위반 회피 — 새 정의 작성 X)
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import Ajv from "ajv";
import type { Metric, Axis, Scale, LifecycleState } from "./lib/signature-metrics-types";
import { writeAtomic } from "./lib/write-atomic";

const ROOT = path.join(__dirname, "..");
const ROLES_DIR = path.join(ROOT, "memory", "roles");
const GROWTH_DIR = path.join(ROOT, "memory", "growth");
const REGISTRY_PATH = path.join(GROWTH_DIR, "metrics_registry.json");
const REGISTRY_VERSION = "v1.1";
const HISTORY_PATH = path.join(GROWTH_DIR, "registry_history", `${REGISTRY_VERSION}.json`);
const AGGREGATE_PATH = path.join(GROWTH_DIR, "signature_metrics_aggregate.json");
const SELF_SCORES_PATH = path.join(GROWTH_DIR, "self_scores.jsonl");

const REQUIRED = [
  "id", "shortKey", "role", "scope", "axis", "scale", "polarity", "construct",
  "externalAnchor", "validityCheck", "rater", "raterWeights", "timing",
  "aggregation", "baselineSessions", "lifecycleState", "inputPriority",
  "defaultStrategy", "missingPenalty", "applicableTopicTypes",
  "participationExpectedTopicTypes",
] as const;

const errors: string[] = [];
const metrics: Metric[] = [];
const seenIds = new Set<string>();

function validateMetric(m: Partial<Metric>, source: string): void {
  for (const key of REQUIRED) {
    if (!(key in m) || m[key as keyof Metric] === undefined) {
      errors.push(`E-006 ${source}: missing required field '${key}' for metric '${m.id}'`);
    }
  }
  if (!m.externalAnchor || m.externalAnchor.length === 0) {
    errors.push(`E-008 ${source}: metric '${m.id}' missing externalAnchor`);
  }
  if (m.id) {
    if (seenIds.has(m.id)) errors.push(`duplicate metric id: ${m.id}`);
    seenIds.add(m.id);
  }
}

// Stub fill — required field defaults for partially-defined metrics
// (role_memory.metrics often carries only id/shortKey/scale/axis/construct after D-092 단순화)
function fillStub(m: Partial<Metric>, source: string, lifecycle: LifecycleState = "active"): Metric {
  const filled: any = { ...m };
  if (!filled.role && filled.id) filled.role = String(filled.id).split(".")[0];
  if (!filled.scope) filled.scope = "role";
  if (!filled.axis) filled.axis = "quality";
  // scale normalize — 'count' (역할 메모리 약식 표기) → '0-5'
  const validScales = ["0-5", "Y/N", "ratio", "percentile"];
  if (!filled.scale || !validScales.includes(filled.scale)) filled.scale = "0-5";
  if (!filled.polarity) filled.polarity = "higher-better";
  if (!filled.construct) filled.construct = `(stub) ${filled.id} — definition pending; preserved from ${source}`;
  if (!Array.isArray(filled.externalAnchor) || filled.externalAnchor.length === 0) {
    filled.externalAnchor = [`self_scores.jsonl historical record (${source})`];
  }
  if (!filled.validityCheck) filled.validityCheck = "monthly";
  // rater normalize — string → object (역할 메모리 약식 표기 호환)
  if (typeof filled.rater === "string") {
    const t = filled.rater;
    filled.rater = { type: (t === "self" || t === "external" || t === "automated") ? t : "self", by: filled.role };
  }
  if (!filled.rater || typeof filled.rater !== "object") filled.rater = { type: "self", by: filled.role };
  if (!filled.raterWeights) filled.raterWeights = { [filled.role]: 1 };
  if (!filled.timing) filled.timing = "immediate";
  if (!filled.aggregation) filled.aggregation = "all-sessions";
  if (filled.baselineSessions === undefined) filled.baselineSessions = 10;
  if (!filled.lifecycleState) filled.lifecycleState = lifecycle;
  if (!filled.inputPriority) filled.inputPriority = "extended";
  if (!filled.defaultStrategy) filled.defaultStrategy = "previous-session-value";
  if (!filled.missingPenalty) filled.missingPenalty = "silent";
  if (!Array.isArray(filled.applicableTopicTypes)) {
    filled.applicableTopicTypes = ["framing", "implementation", "standalone"];
  }
  if (!Array.isArray(filled.participationExpectedTopicTypes)) {
    filled.participationExpectedTopicTypes = ["framing", "implementation", "standalone"];
  }
  return filled as Metric;
}

// Collect from role memories — D-092 정합: `metrics` 키 (이전 signatureMetrics dead)
const roleFiles = fs.readdirSync(ROLES_DIR).filter(f => f.endsWith("_memory.json"));
for (const f of roleFiles) {
  const mem = JSON.parse(fs.readFileSync(path.join(ROLES_DIR, f), "utf8"));
  // dead-key migration warn (signatureMetrics → metrics)
  if (Array.isArray(mem.signatureMetrics) && mem.signatureMetrics.length > 0 && !Array.isArray(mem.metrics)) {
    console.warn(`[compile-metrics-registry] WARN: ${f} uses dead 'signatureMetrics' key; rename to 'metrics' (D-092)`);
  }
  if (!Array.isArray(mem.metrics)) continue;
  for (const m of mem.metrics) {
    const filled = fillStub(m, f, "active");
    validateMetric(filled, f);
    metrics.push(filled);
  }
}

// Collect derived
const derivedPath = path.join(GROWTH_DIR, "derived_metrics.json");
if (fs.existsSync(derivedPath)) {
  const derived = JSON.parse(fs.readFileSync(derivedPath, "utf8"));
  for (const m of derived.derived || []) {
    validateMetric(m, "derived_metrics.json");
    metrics.push(m as Metric);
  }
}

// Collect composite sub-metric inputs (D-065, session_089)
// surface 노출 X — signatureMetrics 배열 외부. compile 시점에만 base로 등록되어 composite derived의 inputs 해석 가능.
const compositePath = path.join(GROWTH_DIR, "composite_inputs.json");
if (fs.existsSync(compositePath)) {
  const composites = JSON.parse(fs.readFileSync(compositePath, "utf8"));
  for (const m of composites.inputs || []) {
    validateMetric(m, "composite_inputs.json");
    metrics.push(m as Metric);
  }
}

// Historical IDs from aggregate / self_scores.jsonl (PD-063 Phase 2)
// 보존 정책: aggregate에 등장하나 위 source에서 정의되지 않은 ID는 stub으로 등록
//           lifecycleState="historical" — 폐기 아님, 정의 메타 부족 상태로 시각화 후보
function deriveShortKey(id: string): string {
  // fallback shortKey = id 마지막 segment 약어
  const tail = id.split(".").pop() || id;
  return tail.replace(/[_]/g, "").slice(0, 7);
}

function collectAggregateIds(): { id: string; role: string }[] {
  const seen = new Map<string, string>();
  if (fs.existsSync(AGGREGATE_PATH)) {
    try {
      const agg = JSON.parse(fs.readFileSync(AGGREGATE_PATH, "utf8"));
      for (const a of agg.aggregates || []) {
        if (a.metricId && !seen.has(a.metricId)) {
          seen.set(a.metricId, a.role || a.metricId.split(".")[0]);
        }
      }
    } catch (e) {
      console.warn(`[compile-metrics-registry] WARN: aggregate read failed: ${(e as Error).message}`);
    }
  }
  if (fs.existsSync(SELF_SCORES_PATH)) {
    const lines = fs.readFileSync(SELF_SCORES_PATH, "utf8").split("\n").filter(l => l.trim());
    for (const line of lines) {
      try {
        const rec = JSON.parse(line);
        if (rec.metricId && !seen.has(rec.metricId)) {
          seen.set(rec.metricId, rec.role || rec.metricId.split(".")[0]);
        }
      } catch { /* skip malformed */ }
    }
  }
  return Array.from(seen.entries()).map(([id, role]) => ({ id, role }));
}

const histCandidates = collectAggregateIds();
let histAdded = 0;
for (const { id, role } of histCandidates) {
  if (seenIds.has(id)) continue; // 이미 정의됨 — skip
  const stub: Partial<Metric> = {
    id,
    shortKey: deriveShortKey(id),
    role,
  };
  const filled = fillStub(stub, "self_scores.jsonl/aggregate", "historical");
  validateMetric(filled, "historical");
  metrics.push(filled);
  histAdded++;
}

// Axis distribution
const axisDistribution: Record<Axis, number> = {
  "learning": 0, "quality": 0, "judgment-consistency": 0, "execution-transfer": 0,
};
for (const m of metrics) {
  if (m.axis in axisDistribution) axisDistribution[m.axis]++;
}

// sourceHash — deterministic content hash over canonical sorted ids
const canonical = JSON.stringify(metrics.map(m => ({ id: m.id, shortKey: m.shortKey, axis: m.axis, scale: m.scale, polarity: m.polarity })).sort((a, b) => a.id < b.id ? -1 : 1));
const sourceHash = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

const compiled = {
  registryVersion: REGISTRY_VERSION,
  compiledAt: new Date().toISOString(),
  sourceHash,
  axisDistribution,
  aggregationViews: ["all", "recent10", "recent3"] as const,
  metrics,
};

if (errors.length > 0) {
  console.error(`\n[compile-metrics-registry] FAIL — ${errors.length} errors:`);
  errors.forEach(e => console.error("  " + e));
  process.exit(1);
}

// Ajv schema validation
const schemaPath = path.join(ROOT, "memory", "schemas", "metrics-registry.schema.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
if (!validate(compiled)) {
  console.error("\n[compile-metrics-registry] E-006 Ajv schema validation failed:");
  for (const err of validate.errors ?? []) {
    console.error(`  ${err.instancePath} ${err.message}`);
  }
  process.exit(1);
}

writeAtomic(REGISTRY_PATH, JSON.stringify(compiled, null, 2) + "\n");
writeAtomic(HISTORY_PATH, JSON.stringify(compiled, null, 2) + "\n");

console.log(`[compile-metrics-registry] OK`);
console.log(`  registryVersion: ${REGISTRY_VERSION}`);
console.log(`  sourceHash:      ${sourceHash}`);
console.log(`  total metrics:   ${metrics.length}`);
console.log(`  axis distribution:`);
for (const [axis, n] of Object.entries(axisDistribution)) {
  console.log(`    ${axis.padEnd(22)} ${n}`);
}
console.log(`  written:`);
console.log(`    ${path.relative(ROOT, REGISTRY_PATH)}`);
console.log(`    ${path.relative(ROOT, HISTORY_PATH)}`);

// Diagnostic — historical addition count + aggregate ⊆ registry IDs check
console.log(`  historical stubs added: ${histAdded}`);
const registryIds = new Set(metrics.map(m => m.id));
const aggregateIds = histCandidates.map(h => h.id);
const missing = aggregateIds.filter(id => !registryIds.has(id));
if (missing.length > 0) {
  console.error(`  ERROR: ${missing.length} aggregate IDs missing from registry: ${missing.join(", ")}`);
  process.exit(3);
}
console.log(`  aggregate IDs ⊆ registry IDs: OK (${aggregateIds.length} aggregate, ${registryIds.size} registry)`);
