// PD-023 P3 — registry freshness check
// Recompiles in-memory and compares sourceHash to on-disk metrics_registry.json.
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type { Metric } from "./lib/signature-metrics-types";

const ROOT = path.join(__dirname, "..");
const ROLES_DIR = path.join(ROOT, "memory", "roles");
const REGISTRY_PATH = path.join(ROOT, "memory", "growth", "metrics_registry.json");
const DERIVED_PATH = path.join(ROOT, "memory", "growth", "derived_metrics.json");

if (!fs.existsSync(REGISTRY_PATH)) {
  console.error("E-001 metrics_registry.json missing — run compile-metrics-registry.ts");
  process.exit(1);
}

const onDisk = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));

const collected: Metric[] = [];
for (const f of fs.readdirSync(ROLES_DIR)) {
  if (!f.endsWith("_memory.json")) continue;
  const mem = JSON.parse(fs.readFileSync(path.join(ROLES_DIR, f), "utf8"));
  if (Array.isArray(mem.signatureMetrics)) collected.push(...mem.signatureMetrics);
}
if (fs.existsSync(DERIVED_PATH)) {
  const d = JSON.parse(fs.readFileSync(DERIVED_PATH, "utf8"));
  collected.push(...(d.derived ?? []));
}

const canonical = JSON.stringify(
  collected.map(m => ({ id: m.id, shortKey: m.shortKey, axis: m.axis, scale: m.scale, polarity: m.polarity }))
    .sort((a, b) => a.id < b.id ? -1 : 1)
);
const expected = crypto.createHash("sha256").update(canonical).digest("hex").slice(0, 16);

console.log(`[validate-registry-freshness]`);
console.log(`  on-disk sourceHash:  ${onDisk.sourceHash}`);
console.log(`  recomputed:          ${expected}`);
console.log(`  on-disk metrics:     ${onDisk.metrics.length}`);
console.log(`  collected metrics:   ${collected.length}`);

if (onDisk.sourceHash !== expected) {
  console.error("\n  E-009 sourceHash mismatch — registry stale. Run: npx ts-node scripts/compile-metrics-registry.ts");
  process.exit(1);
}
if (onDisk.metrics.length !== collected.length) {
  console.error("\n  metric count mismatch — recompile required");
  process.exit(1);
}
console.log("  OK — registry fresh");
