// PD-023 P2 smoke — round-trip + extensions slot 보존 + orphan reject
import * as fs from "fs";
import * as path from "path";
import { appendScore, buildRecord, readScores, queueDeferred, quarantine, OrphanMetricError, ExtensionsNamespaceError, PATHS } from "./lib/self-scores-writer";

let pass = 0, fail = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}${detail ? "  -- " + detail : ""}`); }
}

// Use a temp jsonl path so we don't pollute prod self_scores.jsonl
const tmpJsonl = path.join(__dirname, "..", "tests", "fixtures", "_p2_test.jsonl");
const tmpPending = path.join(__dirname, "..", "tests", "fixtures", "_p2_pending.json");
const tmpQuar = path.join(__dirname, "..", "tests", "fixtures", "_p2_quarantine");
PATHS.jsonl = tmpJsonl;
PATHS.pending = tmpPending;
PATHS.quarantine = tmpQuar;
[tmpJsonl, tmpPending].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
if (fs.existsSync(tmpQuar)) fs.rmSync(tmpQuar, { recursive: true, force: true });

console.log("[buildRecord]");
const rec = buildRecord({
  sessionId: "session_test",
  topicId: "topic_test",
  topicType: "framing",
  role: "ace",
  metricId: "ace.angle_novelty",
  raterId: "ace",
  rawScore: 4,
  recordedBy: "test",
  recordSource: "yaml-block",
  sessionPhase: "framing",
  extensions: { "pd025": { tag: "shadow-only" } },
});
ok("normalized 4→80", rec.normalizedScore === 80);
ok("registryVersion populated", rec.registryVersion === "v1.0");
ok("extensions slot preserved", JSON.stringify(rec.extensions) === '{"pd025":{"tag":"shadow-only"}}');
ok("recordId present", typeof rec.recordId === "string" && rec.recordId.startsWith("r-"));

console.log("[orphan reject]");
let threwOrphan = false;
try {
  buildRecord({ ...common(), metricId: "no.such.metric" });
} catch (e) {
  threwOrphan = e instanceof OrphanMetricError;
}
ok("orphan metricId throws E-002", threwOrphan);

console.log("[extensions namespace E-022]");
let threwNs = false;
try {
  buildRecord({ ...common(), extensions: { foo: "bar" } as any });
} catch (e) {
  threwNs = e instanceof ExtensionsNamespaceError;
}
ok("extensions top-level scalar rejected", threwNs);

console.log("[append + roundtrip]");
appendScore(common());
appendScore({ ...common(), rawScore: 5 });
const back = readScores(r => r.sessionId === "session_test");
ok("2 records read back", back.length === 2);
ok("first is normalized 80", back[0]!.normalizedScore === 80);
ok("second is normalized 100", back[1]!.normalizedScore === 100);

console.log("[deferred queue]");
queueDeferred({
  recordId: "r-pending",
  sessionId: "session_test",
  metricId: "ace.reframe_trigger",
  raterId: "master",
  resolveCondition: "next master_feedback for session_test",
});
const pending = JSON.parse(fs.readFileSync(tmpPending, "utf8"));
ok("pending queue has 1 item", pending.items.length === 1);

console.log("[quarantine]");
const qpath = quarantine("test-corruption", { line: "garbage" });
ok("quarantine file created", fs.existsSync(qpath));

// Cleanup
[tmpJsonl, tmpPending].forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
if (fs.existsSync(tmpQuar)) fs.rmSync(tmpQuar, { recursive: true, force: true });

console.log(`\n[total] pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);

function common() {
  return {
    sessionId: "session_test",
    topicId: "topic_test",
    topicType: "framing" as const,
    role: "ace",
    metricId: "ace.angle_novelty",
    raterId: "ace",
    rawScore: 4,
    recordedBy: "test",
    recordSource: "yaml-block" as const,
    sessionPhase: "framing",
  };
}
