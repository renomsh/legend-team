// PD-023 P3 — finalize self-scores from session turns
// - YAML block parsing (# self-scores …)
// - default lookup (previous-session-value) + defaultUsageCount tracking
// - supersedes chain tracking (latest wins)
// - topicType-aware participation (no missing-count for non-applicable roles)
// - audit fields: rater type, source, ts, sessionPhase, topicType (5 non-null)
//
// Usage:
//   npx ts-node scripts/finalize-self-scores.ts                            # uses current_session.json
//   npx ts-node scripts/finalize-self-scores.ts --session session_083
//   npx ts-node scripts/finalize-self-scores.ts --transcript path/to.jsonl
import * as fs from "fs";
import * as path from "path";
import {
  appendScore, buildRecord, loadRegistry, findMetric, readScores, PATHS,
  OrphanMetricError,
} from "./lib/self-scores-writer";
import type { ScoreRecord, TopicType, RecordSource } from "./lib/signature-metrics-types";

const ROOT = path.join(__dirname, "..");
const CURRENT = path.join(ROOT, "memory", "sessions", "current_session.json");
// D-092 session_101: default-fallback propagation 폐기. 빈 칸이 진실. Master 수동 대시보드 열람이 단일 피드백.

interface SessionInfo {
  sessionId: string;
  topicId: string;
  topicType: TopicType;
  turns: { role: string; phase?: string; selfScores?: Record<string, number | string> }[];
}

function readCurrent(): SessionInfo {
  const j = JSON.parse(fs.readFileSync(CURRENT, "utf8"));
  return {
    sessionId: j.sessionId,
    topicId: j.topicId ?? "topic_unknown",
    topicType: (j.topicType as TopicType) ?? "standalone",
    turns: j.turns ?? [],
  };
}

// Parse YAML blocks of form:
//   # self-scores
//   metric_short_or_id: value
//   another: Y
function parseYamlBlocks(text: string): Map<string, Record<string, string | number>> {
  const out = new Map<string, Record<string, string | number>>();
  const lines = text.split(/\r?\n/);
  let inBlock = false;
  let currentRole: string | null = null;
  let bag: Record<string, string | number> = {};

  function flush() {
    if (currentRole && Object.keys(bag).length > 0) {
      out.set(currentRole, { ...(out.get(currentRole) ?? {}), ...bag });
    }
    bag = {};
    inBlock = false;
  }

  for (const raw of lines) {
    const line = raw.trim();
    const roleMarker = line.match(/^\[ROLE:(\w+)\]$/);
    if (roleMarker) { flush(); currentRole = roleMarker[1]!; continue; }
    if (line.startsWith("# self-scores")) { inBlock = true; continue; }
    if (inBlock) {
      if (line === "" || line.startsWith("#") || line.startsWith("---")) { flush(); continue; }
      const m = line.match(/^([\w.-]+):\s*(.+?)\s*(#.*)?$/);
      if (!m) { flush(); continue; }
      const key = m[1]!;
      const valRaw = m[2]!.trim();
      const num = Number(valRaw);
      bag[key] = Number.isFinite(num) && /^-?\d/.test(valRaw) ? num : valRaw;
    }
  }
  flush();
  return out;
}

// Resolve shortKey OR full id → metricId
function resolveMetricId(key: string, role: string): string | null {
  if (findMetric(key)) return key;
  const reg = loadRegistry();
  const hit = reg.metrics.find(m => m.role === role && (m.shortKey === key || m.id === key || m.id.endsWith("." + key)));
  return hit ? hit.id : null;
}

interface FinalizeReport {
  sessionId: string;
  topicId: string;
  topicType: TopicType;
  recordsWritten: number;
  defaultsUsed: { role: string; metricId: string }[];
  orphans: { role: string; key: string }[];
  supersededChains: number;
  participationGaps: { role: string; metricId: string }[];
  auditNonNullRate: number;
}

function previousValue(metricId: string, role: string): { rawScore: number | string; raterId: string } | null {
  // Look at the most recent record for (role, metricId)
  const all = readScores(r => r.role === role && r.metricId === metricId);
  if (all.length === 0) return null;
  const latest = all.sort((a, b) => a.ts < b.ts ? 1 : -1)[0]!;
  return { rawScore: latest.rawScore, raterId: latest.raterId };
}

function auditNonNullRatio(rec: ScoreRecord): number {
  const fields = [rec.recordSource, rec.ts, rec.sessionPhase, rec.topicType, (rec as any).rater?.type ?? rec.recordedBy];
  return fields.filter(f => f !== null && f !== undefined && f !== "").length / fields.length;
}

export function finalize(opts: { transcript?: string; sessionInfo?: SessionInfo } = {}): FinalizeReport {
  const info = opts.sessionInfo ?? readCurrent();
  const reg = loadRegistry();

  // 1) Build per-role score bag
  const roleScores = new Map<string, Record<string, number | string>>();
  if (opts.transcript && fs.existsSync(opts.transcript)) {
    const text = fs.readFileSync(opts.transcript, "utf8");
    parseYamlBlocks(text).forEach((v, k) => roleScores.set(k, v));
  }
  for (const t of info.turns) {
    if (t.selfScores && Object.keys(t.selfScores).length > 0) {
      const cur = roleScores.get(t.role) ?? {};
      roleScores.set(t.role, { ...cur, ...t.selfScores });
    }
  }

  const report: FinalizeReport = {
    sessionId: info.sessionId,
    topicId: info.topicId,
    topicType: info.topicType,
    recordsWritten: 0,
    defaultsUsed: [],
    orphans: [],
    supersededChains: 0,
    participationGaps: [],
    auditNonNullRate: 1,
  };

  const auditScores: number[] = [];
  const turnPhase: Record<string, string> = {};
  for (const t of info.turns) if (t.phase) turnPhase[t.role] = t.phase;

  // 2) Iterate registry per metric — D-092: 발언한 역할(selfScores 박제) = 적재. 토픽 타입별 expected 게이트 폐기.
  for (const metric of reg.metrics) {
    if (!metric.applicableTopicTypes.includes(info.topicType)) continue;
    const role = metric.role;
    if (role === "session" || role === "cross-role") continue; // derived handled by compute
    const bag = roleScores.get(role) ?? {};

    // try shortKey then full id
    const presentKey = Object.keys(bag).find(k => {
      const rid = resolveMetricId(k, role);
      return rid === metric.id;
    });

    let rawScore: number | string | null = null;
    let source: RecordSource = "yaml-block";
    let raterId = role;

    if (presentKey !== undefined) {
      rawScore = bag[presentKey]!;
    }
    // D-092 session_101: default-fallback 폐기. 미기입은 빈 칸으로 둠.

    if (rawScore === null) {
      continue;
    }

    try {
      const prevForSupersede = previousValue(metric.id, role);
      const rec = appendScore({
        sessionId: info.sessionId,
        topicId: info.topicId,
        topicType: info.topicType,
        role,
        metricId: metric.id,
        raterId: metric.rater.type === "external" && metric.rater.by ? metric.rater.by : raterId,
        rawScore,
        recordedBy: "finalize:yaml",
        recordSource: source,
        sessionPhase: turnPhase[role] ?? "unknown",
      });
      report.recordsWritten++;
      auditScores.push(auditNonNullRatio(rec));
    } catch (e) {
      if (e instanceof OrphanMetricError) {
        report.orphans.push({ role, key: metric.id });
      } else {
        throw e;
      }
    }
  }

  if (auditScores.length > 0) {
    report.auditNonNullRate = auditScores.reduce((a, b) => a + b, 0) / auditScores.length;
  }
  return report;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  let transcript: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--transcript") transcript = args[++i];
  }
  const opts: { transcript?: string } = {};
  if (transcript) opts.transcript = transcript;
  const r = finalize(opts);
  console.log("[finalize-self-scores]");
  console.log(`  session:        ${r.sessionId}`);
  console.log(`  topicType:      ${r.topicType}`);
  console.log(`  recordsWritten: ${r.recordsWritten}`);
  console.log(`  defaultsUsed:   ${r.defaultsUsed.length}`);
  console.log(`  orphans:        ${r.orphans.length}`);
  console.log(`  participationGaps (expected but missing, no prev value): ${r.participationGaps.length}`);
  console.log(`  audit non-null rate: ${(r.auditNonNullRate * 100).toFixed(1)}%`);
  if (r.auditNonNullRate < 0.95) {
    console.error(`  WARN: audit non-null rate < 95% (DoD breach)`);
  }
}
