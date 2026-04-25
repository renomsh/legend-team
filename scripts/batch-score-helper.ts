// PD-023 — batch-score-helper: 수동 호출 전용 대화형 self-score 일괄 입력 보조 도구
// Spec: reports/2026-04-23_pd023-self-scores-thin-impl/arki_rev1.md §5.1
// Hook 자동 트리거 금지. CLI: npx ts-node scripts/batch-score-helper.ts <sessionId>
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { appendScore, loadRegistry, findMetric, ScoreInput } from "./lib/self-scores-writer";
import type { Metric, RecordSource, TopicType } from "./lib/signature-metrics-types";

const ROOT = path.join(__dirname, "..");
const CURRENT_SESSION_PATH = path.join(ROOT, "memory", "sessions", "current_session.json");
const VALID_ROLES = ["ace", "arki", "fin", "riki", "nova", "dev", "vera", "editor"];
const SESSION_ID_RE = /^session_\d{3,}$/;

interface CurrentSession {
  sessionId: string;
  topicId: string;
  topicType?: TopicType;
}

export interface RunOptions {
  sessionId: string;
  dryRun?: boolean;
}

export function loadCurrentSession(): CurrentSession {
  if (!fs.existsSync(CURRENT_SESSION_PATH)) {
    throw new Error(`current_session.json not found at ${CURRENT_SESSION_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CURRENT_SESSION_PATH, "utf8"));
}

export function filterRoleMetrics(role: string): Metric[] {
  return loadRegistry().metrics.filter(
    m => m.role === role && m.lifecycleState === "active"
  );
}

function ask(rl: readline.Interface, q: string): Promise<string> {
  return new Promise(resolve => rl.question(q, ans => resolve(ans.trim())));
}

async function pickRole(rl: readline.Interface): Promise<string> {
  while (true) {
    const ans = await ask(rl, `역할 선택 [${VALID_ROLES.join("/")}]: `);
    if (VALID_ROLES.includes(ans)) return ans;
    console.log(`  유효하지 않습니다. 다음 중 선택: ${VALID_ROLES.join(", ")}`);
  }
}

async function collectScore(rl: readline.Interface, m: Metric): Promise<number | string | null> {
  const ans = await ask(
    rl,
    `  [${m.id}] (${m.scale}, ${m.construct.slice(0, 40)}) 점수 입력 (Enter=skip): `
  );
  if (!ans) return null;
  return ans;
}

export async function runInteractive(opts: RunOptions): Promise<number> {
  if (!SESSION_ID_RE.test(opts.sessionId)) {
    console.error(`E: invalid sessionId format: ${opts.sessionId} (expected session_NNN)`);
    return 0;
  }
  const cs = loadCurrentSession();
  const topicId = cs.topicId;
  const topicType: TopicType = (cs.topicType as TopicType) || "implementation";
  console.log(`session=${opts.sessionId} topic=${topicId} topicType=${topicType}`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let appended = 0;
  try {
    const role = await pickRole(rl);
    const metrics = filterRoleMetrics(role);
    if (metrics.length === 0) {
      console.log(`role=${role} 활성 metric 없음. 종료.`);
      return 0;
    }
    console.log(`${role} 활성 metrics: ${metrics.length}건. 각 항목 점수 입력 또는 Enter로 skip.`);
    for (const m of metrics) {
      const raw = await collectScore(rl, m);
      if (raw === null) continue;
      const input: ScoreInput = {
        sessionId: opts.sessionId,
        topicId,
        topicType,
        role,
        metricId: m.id,
        raterId: role,
        rawScore: isNaN(Number(raw)) ? raw : Number(raw),
        recordedBy: "batch-score-helper",
        recordSource: "cli" as RecordSource,
        sessionPhase: "post-session",
      };
      if (opts.dryRun) {
        console.log(`  [dry-run] would append ${m.id}=${raw}`);
        appended++;
      } else {
        try {
          const rec = appendScore(input);
          console.log(`  ok ${rec.recordId} ${m.id}=${raw} -> normalized=${rec.normalizedScore}`);
          appended++;
        } catch (e) {
          console.error(`  FAIL ${m.id}: ${(e as Error).message}`);
        }
      }
    }
  } finally {
    rl.close();
  }
  console.log(`${appended} records ${opts.dryRun ? "would be appended (dry-run)" : "appended"}`);
  return appended;
}

function parseArgs(argv: string[]): { sessionId?: string; help?: boolean; dryRun?: boolean } {
  const out: { sessionId?: string; help?: boolean; dryRun?: boolean } = {};
  for (const a of argv) {
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (!a.startsWith("--")) out.sessionId = a;
  }
  return out;
}

function printHelp(): void {
  console.log(
    [
      "Usage: npx ts-node scripts/batch-score-helper.ts <sessionId> [--dry-run]",
      "  sessionId: session_NNN 형식",
      "  --dry-run: 입력만 받고 jsonl append 안 함",
      "  --help: 사용법 출력",
      "수동 호출 전용. hook 자동 트리거 금지 (spec §5.1).",
    ].join("\n")
  );
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.sessionId) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }
  const opts: RunOptions = { sessionId: args.sessionId };
  if (args.dryRun) opts.dryRun = true;
  runInteractive(opts).then(
    n => process.exit(n >= 0 ? 0 : 1),
    err => {
      console.error(err);
      process.exit(1);
    }
  );
}
