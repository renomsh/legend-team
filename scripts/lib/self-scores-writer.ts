// PD-023 P2 — self_scores.jsonl writer + validator + pending_deferred + quarantine
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { appendAtomicLine, writeAtomic } from "./write-atomic";
import { normalize } from "./metric-normalizer";
import type { ScoreRecord, Metric, TopicType, RecordSource } from "./signature-metrics-types";

const ROOT = path.join(__dirname, "..", "..");
export const PATHS = {
  jsonl: path.join(ROOT, "memory", "growth", "self_scores.jsonl"),
  pending: path.join(ROOT, "memory", "growth", "pending_deferred_scores.json"),
  quarantine: path.join(ROOT, "memory", "growth", "_quarantine"),
  registry: path.join(ROOT, "memory", "growth", "metrics_registry.json"),
};

export interface RegistrySnapshot {
  registryVersion: string;
  metrics: Metric[];
}

let cachedRegistry: RegistrySnapshot | null = null;
export function loadRegistry(force = false): RegistrySnapshot {
  if (cachedRegistry && !force) return cachedRegistry;
  if (!fs.existsSync(PATHS.registry)) {
    throw new Error(`E-001 registry not found: ${PATHS.registry}`);
  }
  cachedRegistry = JSON.parse(fs.readFileSync(PATHS.registry, "utf8"));
  return cachedRegistry!;
}

export function findMetric(metricId: string): Metric | undefined {
  return loadRegistry().metrics.find(m => m.id === metricId);
}

export interface ScoreInput {
  sessionId: string;
  topicId: string;
  topicType: TopicType;
  role: string;
  metricId: string;
  raterId: string;
  rawScore: number | string;
  recordedBy: string;
  recordSource: RecordSource;
  sessionPhase: string;
  confidence?: number;
  supersedes?: string;
  overrideReason?: string;
  extensions?: Record<string, unknown>;
}

export class OrphanMetricError extends Error {
  code = "E-002" as const;
  constructor(metricId: string) { super(`E-002 orphan metricId: ${metricId}`); }
}

export class ExtensionsNamespaceError extends Error {
  code = "E-022" as const;
  constructor(key: string) { super(`E-022 extensions namespace violation: ${key} (must be extensions.{moduleId}.*)`); }
}

function validateExtensions(ext: Record<string, unknown> | undefined): void {
  if (!ext) return;
  for (const k of Object.keys(ext)) {
    const v = ext[k];
    if (typeof v !== "object" || v === null || Array.isArray(v)) {
      throw new ExtensionsNamespaceError(k);
    }
  }
}

export function buildRecord(input: ScoreInput): ScoreRecord {
  const metric = findMetric(input.metricId);
  if (!metric) throw new OrphanMetricError(input.metricId);
  const normalizedScore = normalize(input.rawScore, metric.scale);
  validateExtensions(input.extensions);
  const reg = loadRegistry();
  const ts = new Date().toISOString();
  const recordId = "r-" + crypto.createHash("sha1")
    .update(`${input.sessionId}|${input.role}|${input.metricId}|${input.raterId}|${ts}`)
    .digest("hex").slice(0, 12);
  const rec: ScoreRecord = {
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
  if (input.confidence !== undefined) rec.confidence = input.confidence;
  if (input.supersedes !== undefined) rec.supersedes = input.supersedes;
  if (input.overrideReason !== undefined) rec.overrideReason = input.overrideReason;
  return rec;
}

export function appendScore(input: ScoreInput): ScoreRecord {
  const rec = buildRecord(input);
  appendAtomicLine(PATHS.jsonl, JSON.stringify(rec));
  return rec;
}

export interface PendingDeferred {
  recordId: string;
  sessionId: string;
  metricId: string;
  raterId: string;
  resolveCondition: string;
  queuedAt: string;
}

export function queueDeferred(item: Omit<PendingDeferred, "queuedAt">): void {
  const list: PendingDeferred[] = fs.existsSync(PATHS.pending)
    ? JSON.parse(fs.readFileSync(PATHS.pending, "utf8")).items ?? []
    : [];
  list.push({ ...item, queuedAt: new Date().toISOString() });
  writeAtomic(PATHS.pending, JSON.stringify({ items: list }, null, 2) + "\n");
}

export function quarantine(reason: string, payload: unknown): string {
  fs.mkdirSync(PATHS.quarantine, { recursive: true });
  const fname = `q-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.json`;
  const fpath = path.join(PATHS.quarantine, fname);
  writeAtomic(fpath, JSON.stringify({ reason, payload, ts: new Date().toISOString() }, null, 2) + "\n");
  return fpath;
}

export function readScores(filterFn?: (r: ScoreRecord) => boolean): ScoreRecord[] {
  if (!fs.existsSync(PATHS.jsonl)) return [];
  const lines = fs.readFileSync(PATHS.jsonl, "utf8").split(/\r?\n/).filter(Boolean);
  const records: ScoreRecord[] = [];
  for (const line of lines) {
    try {
      const r = JSON.parse(line) as ScoreRecord;
      if (!filterFn || filterFn(r)) records.push(r);
    } catch (e) {
      // corrupt line — quarantine
      quarantine("E-003 jsonl line parse failure", { line, error: String(e) });
    }
  }
  return records;
}
