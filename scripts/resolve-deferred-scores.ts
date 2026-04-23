// PD-023 P4 — resolve-deferred-scores
// Reads memory/growth/pending_deferred_scores.json, attempts to resolve each item.
// resolveCondition is currently free-form text; this script only flushes items
// whose condition matches a simple syntax: "metric:<id> session:<sid>" or
// items explicitly marked ready=true. Anything else is reported as still-pending.
//
// Usage:
//   npx ts-node scripts/resolve-deferred-scores.ts            # dry-run
//   npx ts-node scripts/resolve-deferred-scores.ts --apply    # mutate jsonl + pending file
import * as fs from "fs";
import * as path from "path";
import { appendScore, PATHS } from "./lib/self-scores-writer";
import { writeAtomic } from "./lib/write-atomic";

const ROOT = path.join(__dirname, "..");

interface PendingItem {
  recordId?: string;
  sessionId: string;
  topicId?: string;
  topicType?: "framing" | "implementation" | "standalone";
  role: string;
  metricId: string;
  raterId: string;
  rawScore: number | string;
  recordSource?: string;
  resolveCondition: string;
  ready?: boolean;
  queuedAt: string;
  notes?: string;
}

interface ResolveReport {
  total: number;
  resolved: number;
  pendingRemaining: number;
  matches: { metricId: string; sessionId: string; raterId: string }[];
  stillPending: { metricId: string; reason: string }[];
}

function readPending(): PendingItem[] {
  if (!fs.existsSync(PATHS.pending)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(PATHS.pending, "utf8"));
    return j.items ?? [];
  } catch {
    return [];
  }
}

function writePending(items: PendingItem[]): void {
  writeAtomic(PATHS.pending, JSON.stringify({ items }, null, 2) + "\n");
}

function isReady(item: PendingItem): { ok: boolean; reason: string } {
  if (item.ready === true) return { ok: true, reason: "explicit ready flag" };
  // Simple keyword: "ready" / "now"
  const cond = (item.resolveCondition || "").toLowerCase().trim();
  if (cond === "" || cond === "now" || cond === "ready") {
    return { ok: true, reason: "trivial condition" };
  }
  return { ok: false, reason: `unmatched condition: "${item.resolveCondition}"` };
}

export function resolve(opts: { apply?: boolean } = {}): ResolveReport {
  const items = readPending();
  const report: ResolveReport = {
    total: items.length,
    resolved: 0,
    pendingRemaining: 0,
    matches: [],
    stillPending: [],
  };

  const remaining: PendingItem[] = [];
  for (const item of items) {
    const r = isReady(item);
    if (!r.ok) {
      remaining.push(item);
      report.stillPending.push({ metricId: item.metricId, reason: r.reason });
      continue;
    }
    if (opts.apply) {
      try {
        appendScore({
          sessionId: item.sessionId,
          topicId: item.topicId ?? "topic_unknown",
          topicType: item.topicType ?? "standalone",
          role: item.role,
          metricId: item.metricId,
          raterId: item.raterId,
          rawScore: item.rawScore,
          recordedBy: "resolve-deferred",
          recordSource: (item.recordSource as any) ?? "auto-scorer",
          sessionPhase: "deferred-resolve",
        });
      } catch (e) {
        remaining.push(item);
        report.stillPending.push({ metricId: item.metricId, reason: `append failed: ${(e as Error).message}` });
        continue;
      }
    }
    report.resolved++;
    report.matches.push({ metricId: item.metricId, sessionId: item.sessionId, raterId: item.raterId });
  }

  if (opts.apply && report.resolved > 0) {
    writePending(remaining);
  }
  report.pendingRemaining = remaining.length;
  return report;
}

if (require.main === module) {
  const apply = process.argv.includes("--apply");
  const r = resolve({ apply });
  console.log(`[resolve-deferred-scores] mode=${apply ? "apply" : "dry-run"}`);
  console.log(`  total queued:     ${r.total}`);
  console.log(`  resolved:         ${r.resolved}`);
  console.log(`  pending remaining: ${r.pendingRemaining}`);
  if (r.stillPending.length > 0) {
    for (const p of r.stillPending.slice(0, 5)) console.log(`    ⏸ ${p.metricId} — ${p.reason}`);
  }
  if (!apply && r.resolved > 0) {
    console.log(`  (dry-run: re-run with --apply to commit ${r.resolved} record(s))`);
  }
}
