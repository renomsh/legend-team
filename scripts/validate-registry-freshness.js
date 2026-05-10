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
// PD-023 P3 — registry freshness check
// Recompiles in-memory and compares sourceHash to on-disk metrics_registry.json.
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const ROOT = path.join(__dirname, "..");
const ROLES_DIR = path.join(ROOT, "memory", "roles");
const REGISTRY_PATH = path.join(ROOT, "memory", "growth", "metrics_registry.json");
const DERIVED_PATH = path.join(ROOT, "memory", "growth", "derived_metrics.json");
if (!fs.existsSync(REGISTRY_PATH)) {
    console.error("E-001 metrics_registry.json missing — run compile-metrics-registry.ts");
    process.exit(1);
}
const onDisk = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
const collected = [];
for (const f of fs.readdirSync(ROLES_DIR)) {
    if (!f.endsWith("_memory.json"))
        continue;
    const mem = JSON.parse(fs.readFileSync(path.join(ROLES_DIR, f), "utf8"));
    // D-092 정합: `metrics` 키 사용. signatureMetrics는 dead (PD-063 Phase 2).
    if (Array.isArray(mem.metrics))
        collected.push(...mem.metrics);
}
if (fs.existsSync(DERIVED_PATH)) {
    const d = JSON.parse(fs.readFileSync(DERIVED_PATH, "utf8"));
    collected.push(...(d.derived ?? []));
}
const canonical = JSON.stringify(collected.map(m => ({ id: m.id, shortKey: m.shortKey, axis: m.axis, scale: m.scale, polarity: m.polarity }))
    .sort((a, b) => a.id < b.id ? -1 : 1));
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
//# sourceMappingURL=validate-registry-freshness.js.map