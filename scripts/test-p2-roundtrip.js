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
// PD-023 P2 smoke — round-trip + extensions slot 보존 + orphan reject
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const self_scores_writer_1 = require("./lib/self-scores-writer");
let pass = 0, fail = 0;
function ok(name, cond, detail) {
    if (cond) {
        pass++;
        console.log(`  PASS  ${name}`);
    }
    else {
        fail++;
        console.log(`  FAIL  ${name}${detail ? "  -- " + detail : ""}`);
    }
}
// Use a temp jsonl path so we don't pollute prod self_scores.jsonl
const tmpJsonl = path.join(__dirname, "..", "tests", "fixtures", "_p2_test.jsonl");
const tmpPending = path.join(__dirname, "..", "tests", "fixtures", "_p2_pending.json");
const tmpQuar = path.join(__dirname, "..", "tests", "fixtures", "_p2_quarantine");
self_scores_writer_1.PATHS.jsonl = tmpJsonl;
self_scores_writer_1.PATHS.pending = tmpPending;
self_scores_writer_1.PATHS.quarantine = tmpQuar;
[tmpJsonl, tmpPending].forEach(p => { if (fs.existsSync(p))
    fs.unlinkSync(p); });
if (fs.existsSync(tmpQuar))
    fs.rmSync(tmpQuar, { recursive: true, force: true });
console.log("[buildRecord]");
const rec = (0, self_scores_writer_1.buildRecord)({
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
    (0, self_scores_writer_1.buildRecord)({ ...common(), metricId: "no.such.metric" });
}
catch (e) {
    threwOrphan = e instanceof self_scores_writer_1.OrphanMetricError;
}
ok("orphan metricId throws E-002", threwOrphan);
console.log("[extensions namespace E-022]");
let threwNs = false;
try {
    (0, self_scores_writer_1.buildRecord)({ ...common(), extensions: { foo: "bar" } });
}
catch (e) {
    threwNs = e instanceof self_scores_writer_1.ExtensionsNamespaceError;
}
ok("extensions top-level scalar rejected", threwNs);
console.log("[append + roundtrip]");
(0, self_scores_writer_1.appendScore)(common());
(0, self_scores_writer_1.appendScore)({ ...common(), rawScore: 5 });
const back = (0, self_scores_writer_1.readScores)(r => r.sessionId === "session_test");
ok("2 records read back", back.length === 2);
ok("first is normalized 80", back[0].normalizedScore === 80);
ok("second is normalized 100", back[1].normalizedScore === 100);
console.log("[deferred queue]");
(0, self_scores_writer_1.queueDeferred)({
    recordId: "r-pending",
    sessionId: "session_test",
    metricId: "ace.reframe_trigger",
    raterId: "master",
    resolveCondition: "next master_feedback for session_test",
});
const pending = JSON.parse(fs.readFileSync(tmpPending, "utf8"));
ok("pending queue has 1 item", pending.items.length === 1);
console.log("[quarantine]");
const qpath = (0, self_scores_writer_1.quarantine)("test-corruption", { line: "garbage" });
ok("quarantine file created", fs.existsSync(qpath));
// Cleanup
[tmpJsonl, tmpPending].forEach(p => { if (fs.existsSync(p))
    fs.unlinkSync(p); });
if (fs.existsSync(tmpQuar))
    fs.rmSync(tmpQuar, { recursive: true, force: true });
console.log(`\n[total] pass=${pass} fail=${fail}`);
if (fail > 0)
    process.exit(1);
function common() {
    return {
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
    };
}
//# sourceMappingURL=test-p2-roundtrip.js.map