// PD-023 P4 — compute-signature-metrics
// Reads memory/growth/self_scores.jsonl + metrics_registry.json
// Produces memory/growth/signature_metrics_aggregate.json with 3 views (all/recent10/recent3)
// Supports stratified-by-grade, alerts, weighted-mean derived metrics, SLA measurement.
//
// Usage:
//   npx ts-node scripts/compute-signature-metrics.ts
//   npx ts-node scripts/compute-signature-metrics.ts --fixture tests/fixtures/signature-metrics/baseline-10
//   npx ts-node scripts/compute-signature-metrics.ts --out memory/growth/signature_metrics_aggregate.json
import * as fs from "fs";
import * as path from "path";
import { meanStdCI } from "./lib/confidence-interval";
import { applyStrategy, sortDeterministic } from "./lib/aggregation-strategies";
import { computeDerived } from "./lib/derived-metric-compute";
import { evaluateAlert, AlertLevel } from "./lib/alert-evaluator";
import { writeAtomic } from "./lib/write-atomic";
import type { ScoreRecord, Metric } from "./lib/signature-metrics-types";

const ROOT = path.join(__dirname, "..");

interface RegistrySnapshot {
  registryVersion: string;
  metrics: Metric[];
  aggregationViews?: ("all" | "recent10" | "recent3")[];
}

interface SessionGradeMap {
  [sessionId: string]: string; // grade S/A/B/C
}

interface ViewAggregate {
  metricId: string;
  role: string;
  view: "all" | "recent10" | "recent3";
  mean: number | null;
  n: number;
  std: number;
  ci95: [number, number] | null;
  stratum?: { grade?: string };
  alert?: { level: AlertLevel; reasons: string[] };
}

interface ComputeOutput {
  computedAt: string;
  registryVersion: string;
  durationMs: number;
  slaWarnMs: number;
  slaBreached: boolean;
  sourceJsonl: string;
  recordCount: number;
  metricCount: number;
  aggregates: ViewAggregate[];
  derivedAggregates: ViewAggregate[];
  warnings: string[];
}

interface CliOpts {
  fixture?: string;
  outPath?: string;
  registryPath?: string;
  slaWarnMs?: number;
}

function readJsonl(filePath: string): ScoreRecord[] {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const out: ScoreRecord[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line));
    } catch {
      // skip corrupt lines
    }
  }
  return out;
}

function buildSessionGradeMap(): SessionGradeMap {
  const idxPath = path.join(ROOT, "memory", "sessions", "session_index.json");
  if (!fs.existsSync(idxPath)) return {};
  try {
    const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));
    const sessions = idx.sessions ?? idx;
    const map: SessionGradeMap = {};
    if (Array.isArray(sessions)) {
      for (const s of sessions) {
        if (s.sessionId && s.grade) map[s.sessionId] = s.grade;
      }
    } else if (typeof sessions === "object") {
      for (const sid of Object.keys(sessions)) {
        const s = sessions[sid];
        if (s && s.grade) map[sid] = s.grade;
      }
    }
    return map;
  } catch {
    return {};
  }
}

const VIEWS: ("all" | "recent10" | "recent3")[] = ["all", "recent10", "recent3"];

function takeView(records: ScoreRecord[], view: "all" | "recent10" | "recent3"): ScoreRecord[] {
  // records arrive sorted asc by (sessionId, raterId, ts)
  if (view === "all") return records;
  const k = view === "recent10" ? 10 : 3;
  return records.slice(Math.max(0, records.length - k));
}

function aggregateMetric(
  metric: Metric,
  records: ScoreRecord[],
  sessionGrade: SessionGradeMap,
  warnings: string[],
): ViewAggregate[] {
  const out: ViewAggregate[] = [];
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
  const sorted = applyStrategy(metricRecords, metric.aggregation as any, ctx);

  // Compute "main" view rows (no stratum)
  const mainViews: Record<string, ViewAggregate> = {};
  for (const view of VIEWS) {
    const slice = takeView(sorted, view);
    const values = slice.map(r => r.normalizedScore);
    const stats = meanStdCI(values);
    if (slice.length > 0 && slice.length < 3) {
      // baseline note — under spec §4.3 view considered partial
    }
    const row: ViewAggregate = {
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
        ? meanStdCI(trendSlice.map(r => r.normalizedScore)).mean
        : null;
      row.alert = evaluateAlert(row.mean, prev, metric.alerts);
    }
    mainViews[view] = row;
    out.push(row);
  }

  // Stratified-by-grade — also emit per-grade rows for view=all (read by drill-down)
  if (metric.aggregation === "stratified-by-grade") {
    const byGrade: Record<string, ScoreRecord[]> = {};
    for (const r of sorted) {
      const g = sessionGrade[r.sessionId];
      if (!g) continue;
      (byGrade[g] ||= []).push(r);
    }
    for (const grade of Object.keys(byGrade).sort()) {
      const slice = byGrade[grade]!;
      if (slice.length < 3) {
        warnings.push(`E-016 ${metric.id} stratum grade=${grade} n=${slice.length} < 3`);
      }
      const stats = meanStdCI(slice.map(r => r.normalizedScore));
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

function computeDerivedRows(
  registry: RegistrySnapshot,
  baseAggregates: ViewAggregate[],
  warnings: string[],
): ViewAggregate[] {
  const out: ViewAggregate[] = [];
  const baseLookup = new Map<string, ViewAggregate>();
  for (const a of baseAggregates) {
    if (a.stratum) continue;
    baseLookup.set(`${a.metricId}|${a.view}`, a);
  }
  const metricLookup = (id: string): Metric | undefined =>
    registry.metrics.find(m => m.id === id);

  for (const m of registry.metrics) {
    if (m.type !== "derived" || !m.composition) continue;
    for (const view of VIEWS) {
      const inputs = m.composition.inputs.map(i => {
        const row = baseLookup.get(`${i.metricId}|${view}`);
        return { metricId: i.metricId, normalizedScore: row?.mean ?? null };
      });
      try {
        const result = computeDerived(m.composition, inputs, metricLookup);
        out.push({
          metricId: m.id,
          role: m.role,
          view,
          mean: result.value,
          n: inputs.filter(i => i.normalizedScore !== null).length,
          std: 0,
          ci95: null,
        });
        if (result.reason) warnings.push(`${m.id} ${view}: ${result.reason}`);
      } catch (e) {
        warnings.push(`${m.id} ${view}: derived failed — ${(e as Error).message}`);
      }
    }
  }
  return out;
}

export function compute(opts: CliOpts = {}): ComputeOutput {
  const registryPath = opts.registryPath ?? path.join(ROOT, "memory", "growth", "metrics_registry.json");
  const sourceJsonl = opts.fixture
    ? path.join(opts.fixture, "self_scores.jsonl")
    : path.join(ROOT, "memory", "growth", "self_scores.jsonl");
  const slaWarnMs = opts.slaWarnMs ?? readSlaThreshold();

  const registry: RegistrySnapshot = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const records = sortDeterministic(readJsonl(sourceJsonl));
  const sessionGrade = buildSessionGradeMap();
  const warnings: string[] = [];

  const t0 = Date.now();
  const aggregates: ViewAggregate[] = [];
  for (const m of registry.metrics) {
    if (m.type === "derived") continue;
    aggregates.push(...aggregateMetric(m, records, sessionGrade, warnings));
  }
  const derived = computeDerivedRows(registry, aggregates, warnings);
  const durationMs = Date.now() - t0;
  const slaBreached = durationMs > slaWarnMs;
  if (slaBreached) warnings.push(`E-010 compute SLA exceeded: ${durationMs}ms > ${slaWarnMs}ms`);

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

function readSlaThreshold(): number {
  const p = path.join(ROOT, "memory", "shared", "feature_flags.json");
  if (!fs.existsSync(p)) return 3000;
  try {
    const f = JSON.parse(fs.readFileSync(p, "utf8"));
    return f.flags?.computeSlaWarnMs ?? 3000;
  } catch {
    return 3000;
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const opts: CliOpts = {};
  let outPath = path.join(ROOT, "memory", "growth", "signature_metrics_aggregate.json");
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--fixture") opts.fixture = args[++i]!;
    else if (args[i] === "--out") outPath = args[++i]!;
    else if (args[i] === "--registry") opts.registryPath = args[++i]!;
    else if (args[i] === "--sla-ms") opts.slaWarnMs = Number(args[++i]);
  }
  const out = compute(opts);
  writeAtomic(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log("[compute-signature-metrics]");
  console.log(`  source:      ${out.sourceJsonl}`);
  console.log(`  records:     ${out.recordCount}`);
  console.log(`  metrics:     ${out.metricCount}`);
  console.log(`  aggregates:  ${out.aggregates.length}`);
  console.log(`  derived:     ${out.derivedAggregates.length}`);
  console.log(`  duration:    ${out.durationMs}ms (SLA ${out.slaWarnMs}ms ${out.slaBreached ? "BREACH" : "OK"})`);
  if (out.warnings.length > 0) {
    console.log(`  warnings:    ${out.warnings.length}`);
    for (const w of out.warnings.slice(0, 5)) console.log(`    - ${w}`);
  }
  console.log(`  written:     ${path.relative(ROOT, outPath)}`);
}
