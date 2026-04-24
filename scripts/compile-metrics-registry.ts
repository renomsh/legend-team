// PD-023 P1 — Compile metrics_registry.json from per-role memory + derived_metrics.json
// DoD: 29지표 compile + sourceHash + snapshot v1.0 + axis 분포 표시
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import Ajv from "ajv";
import type { Metric, Axis } from "./lib/signature-metrics-types";
import { writeAtomic } from "./lib/write-atomic";

const ROOT = path.join(__dirname, "..");
const ROLES_DIR = path.join(ROOT, "memory", "roles");
const GROWTH_DIR = path.join(ROOT, "memory", "growth");
const REGISTRY_PATH = path.join(GROWTH_DIR, "metrics_registry.json");
const HISTORY_PATH = path.join(GROWTH_DIR, "registry_history", "v1.0.json");
const REGISTRY_VERSION = "v1.0";

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

// Collect from role memories
const roleFiles = fs.readdirSync(ROLES_DIR).filter(f => f.endsWith("_memory.json"));
for (const f of roleFiles) {
  const mem = JSON.parse(fs.readFileSync(path.join(ROLES_DIR, f), "utf8"));
  if (!Array.isArray(mem.signatureMetrics)) continue;
  for (const m of mem.signatureMetrics) {
    validateMetric(m, f);
    metrics.push(m as Metric);
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

if (metrics.length !== 29) {
  console.error(`\n  WARN: expected 29 metrics, got ${metrics.length}`);
  process.exit(2);
}
