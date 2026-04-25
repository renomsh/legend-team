// PD-041 — regression test for compute-signature-metrics
// Reads fixtures from tests/fixtures/regression/, runs compute against each,
// canonicalizes the output, and diffs against expected_compute.json.
// Exit code 0 = all PASS, 1 = any FAIL.
//
// Usage:
//   npx ts-node scripts/test-regression.ts
//   npx ts-node scripts/test-regression.ts --update     # rewrite expected_compute.json from current output
//
// Scope: catches silent compute drift (cf. session_102 compile-metrics-registry incident).
import * as fs from "fs";
import * as path from "path";
import { compute } from "./compute-signature-metrics";

const ROOT = path.join(__dirname, "..");
export const FIXTURES_DIR = path.join(ROOT, "tests", "fixtures", "regression");

// Fields excluded from comparison — non-deterministic or environment-dependent.
const NON_DETERMINISTIC_FIELDS = new Set([
  "computedAt",
  "durationMs",
  "slaBreached",
  "slaWarnMs",
  "sourceJsonl",
]);

export interface RegressionResult {
  fixture: string;
  pass: boolean;
  diff?: string;
}

function listFixtures(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{2}_/.test(d.name))
    .map(d => d.name)
    .sort();
}

// Recursive deterministic stringify with sorted keys, dropping non-deterministic fields.
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) {
      if (NON_DETERMINISTIC_FIELDS.has(k)) continue;
      out[k] = canonicalize(obj[k]);
    }
    return out;
  }
  return value;
}

function canonicalString(value: unknown): string {
  return JSON.stringify(canonicalize(value), null, 2);
}

export function runRegression(fixturesDir: string = FIXTURES_DIR, update = false): RegressionResult[] {
  const results: RegressionResult[] = [];
  const fixtures = listFixtures(fixturesDir);
  if (fixtures.length === 0) {
    console.error(`[test-regression] no fixtures found in ${fixturesDir}`);
    return results;
  }

  for (const name of fixtures) {
    const fixturePath = path.join(fixturesDir, name);
    const registryPath = path.join(fixturePath, "registry.json");
    const expectedPath = path.join(fixturePath, "expected_compute.json");

    const actual = compute({
      fixture: fixturePath,
      registryPath,
      slaWarnMs: 999999, // suppress SLA noise in tests
    });
    const actualCanonical = canonicalString(actual);

    if (update || !fs.existsSync(expectedPath)) {
      fs.writeFileSync(expectedPath, actualCanonical + "\n", "utf8");
      results.push({ fixture: name, pass: true, diff: "(written)" });
      continue;
    }

    const expectedRaw = fs.readFileSync(expectedPath, "utf8").trimEnd();
    if (expectedRaw === actualCanonical) {
      results.push({ fixture: name, pass: true });
    } else {
      const diff = simpleDiff(expectedRaw, actualCanonical);
      results.push({ fixture: name, pass: false, diff });
    }
  }
  return results;
}

function simpleDiff(expected: string, actual: string): string {
  const e = expected.split("\n");
  const a = actual.split("\n");
  const max = Math.max(e.length, a.length);
  const lines: string[] = [];
  let shown = 0;
  for (let i = 0; i < max && shown < 20; i++) {
    if (e[i] !== a[i]) {
      lines.push(`  line ${i + 1}:`);
      lines.push(`    - ${e[i] ?? "(missing)"}`);
      lines.push(`    + ${a[i] ?? "(missing)"}`);
      shown++;
    }
  }
  if (shown >= 20) lines.push("  ... (truncated)");
  return lines.join("\n");
}

if (require.main === module) {
  const update = process.argv.includes("--update");
  const results = runRegression(FIXTURES_DIR, update);
  console.log("[test-regression]");
  let failed = 0;
  for (const r of results) {
    if (r.pass) {
      console.log(`  PASS  ${r.fixture}${r.diff ? " " + r.diff : ""}`);
    } else {
      failed++;
      console.log(`  FAIL  ${r.fixture}`);
      if (r.diff) console.log(r.diff);
    }
  }
  console.log(`  total: ${results.length}, failed: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
}
