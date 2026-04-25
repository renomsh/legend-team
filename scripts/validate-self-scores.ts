// PD-023 — validate-self-scores: jsonl 전건 구조·일관성 검증 CLI
// CLI: npx ts-node scripts/validate-self-scores.ts [--file <path>]
import * as fs from "fs";
import * as path from "path";
import Ajv, { ValidateFunction } from "ajv";
import { PATHS, loadRegistry, findMetric } from "./lib/self-scores-writer";
import { normalize } from "./lib/metric-normalizer";

const ROOT = path.join(__dirname, "..");
const SCHEMA_PATH = path.join(ROOT, "memory", "schemas", "self-scores.schema.json");

export interface ValidateReport {
  total: number;
  valid: number;
  orphan: number;
  scaleViolation: number;
  schemaFail: number;
  parseFail: number;
  failures: { line: number; recordId?: string; reason: string }[];
}

function loadSchema(): ValidateFunction | null {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.warn(`WARN: schema not found at ${SCHEMA_PATH} — schema check skipped`);
    return null;
  }
  const raw = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile(raw);
}

export function validateFile(filePath: string): ValidateReport {
  const report: ValidateReport = {
    total: 0,
    valid: 0,
    orphan: 0,
    scaleViolation: 0,
    schemaFail: 0,
    parseFail: 0,
    failures: [],
  };
  if (!fs.existsSync(filePath)) {
    console.error(`E: file not found: ${filePath}`);
    return report;
  }
  loadRegistry();
  const validator = loadSchema();
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    report.total++;
    let rec: any;
    try {
      rec = JSON.parse(line);
    } catch (e) {
      report.parseFail++;
      report.failures.push({ line: i + 1, reason: `parse: ${(e as Error).message}` });
      continue;
    }
    let lineOk = true;
    if (validator && !validator(rec)) {
      report.schemaFail++;
      lineOk = false;
      report.failures.push({
        line: i + 1,
        recordId: rec.recordId,
        reason: `schema: ${validator.errors?.map(e => `${e.instancePath} ${e.message}`).join("; ")}`,
      });
    }
    const metric = findMetric(rec.metricId);
    if (!metric) {
      report.orphan++;
      lineOk = false;
      report.failures.push({
        line: i + 1,
        recordId: rec.recordId,
        reason: `orphan metricId: ${rec.metricId}`,
      });
    } else {
      try {
        normalize(rec.rawScore, metric.scale);
      } catch (e) {
        report.scaleViolation++;
        lineOk = false;
        report.failures.push({
          line: i + 1,
          recordId: rec.recordId,
          reason: `scale: ${(e as Error).message}`,
        });
      }
    }
    if (lineOk) report.valid++;
  }
  return report;
}

function parseArgs(argv: string[]): { file?: string; help?: boolean } {
  const out: { file?: string; help?: boolean } = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--file") {
      const next = argv[++i];
      if (next) out.file = next;
    }
  }
  return out;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: npx ts-node scripts/validate-self-scores.ts [--file <path>]");
    process.exit(0);
  }
  const target = args.file ? path.resolve(args.file) : PATHS.jsonl;
  console.log(`validating ${target}`);
  const r = validateFile(target);
  console.log(
    `total=${r.total} valid=${r.valid} orphan=${r.orphan} scaleViolation=${r.scaleViolation} schemaFail=${r.schemaFail} parseFail=${r.parseFail}`
  );
  if (r.failures.length > 0) {
    console.log("failures:");
    for (const f of r.failures.slice(0, 20)) {
      console.log(`  line ${f.line}${f.recordId ? ` (${f.recordId})` : ""}: ${f.reason}`);
    }
    if (r.failures.length > 20) console.log(`  ... and ${r.failures.length - 20} more`);
  }
  process.exit(r.valid === r.total && r.parseFail === 0 ? 0 : 1);
}
