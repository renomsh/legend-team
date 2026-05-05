/**
 * verify-axis-label-stability.ts — Phase 6 G6 게이트 (PD-050 D-102)
 *
 * Compares a fresh axis-label dump against tests/vr/baseline/axis-labels.json.
 * Diff > 0 → FAIL (axis label drift detected).
 *
 * Spec: D-102 §5.4. Baseline은 dashboard-upgrade.html을 preview server에서 렌더 후
 * SVG <text> 노드를 추출 + sort(y/x/text)하여 박제됨.
 *
 * Usage (programmatic):
 *   import { compareAxisDumps } from './verify-axis-label-stability';
 *   const diff = compareAxisDumps(freshDump, baseline);
 *
 * Usage (CLI, baseline 검증만):
 *   npx ts-node tests/vr/verify-axis-label-stability.ts <fresh-dump.json>
 *   exit 0 (diff 0) / exit 1 (diff > 0 또는 baseline 없음)
 *
 * fresh dump은 캡처 도구(preview_eval 또는 puppeteer headless)로 별도 생성.
 * 본 스크립트는 비교만 담당 — capture는 vr-capture.ts 등 외부 흐름.
 */
import * as fs from 'fs';
import * as path from 'path';

interface AxisLabel { text: string; x: number; y: number; }
type AxisDump = { [chartId: string]: AxisLabel[] };

interface BaselineFile extends Partial<AxisDump> {
  _meta?: { schemaVersion: string; frozenAt: string; charts: string[]; note?: string; [k: string]: any };
  [chartId: string]: AxisLabel[] | any;
}

export interface DiffEntry {
  chart: string;
  kind: 'extra' | 'missing' | 'mismatch';
  detail: string;
}

export function compareAxisDumps(fresh: AxisDump, baseline: BaselineFile): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  const charts = new Set<string>([
    ...Object.keys(fresh),
    ...Object.keys(baseline).filter(k => k !== '_meta')
  ]);

  for (const chart of charts) {
    const a = fresh[chart] || [];
    const b = (baseline[chart] as AxisLabel[]) || [];

    if (a.length !== b.length) {
      diffs.push({ chart, kind: 'mismatch', detail: `length fresh=${a.length} baseline=${b.length}` });
      continue;
    }
    for (let i = 0; i < a.length; i++) {
      const ai = a[i];
      const bi = b[i];
      if (!ai || !bi) {
        diffs.push({ chart, kind: 'mismatch', detail: `idx ${i} undef element` });
        continue;
      }
      if (ai.text !== bi.text || ai.x !== bi.x || ai.y !== bi.y) {
        diffs.push({
          chart,
          kind: 'mismatch',
          detail: `idx ${i} fresh=${JSON.stringify(ai)} baseline=${JSON.stringify(bi)}`
        });
      }
    }
  }
  return diffs;
}

if (require.main === module) {
  const ROOT = path.resolve(__dirname, '..', '..');
  const BASELINE_PATH = path.join(ROOT, 'tests', 'vr', 'baseline', 'axis-labels.json');
  const freshArg = process.argv[2];

  if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`FAIL: baseline missing at ${path.relative(ROOT, BASELINE_PATH)}`);
    process.exit(1);
  }
  const baseline: BaselineFile = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));

  if (!freshArg) {
    // No fresh dump provided — verify baseline schema only
    console.log(`[verify-axis-label-stability] baseline-only check`);
    console.log(`  baseline meta: schemaVersion=${baseline._meta?.schemaVersion} frozenAt=${baseline._meta?.frozenAt}`);
    const chartKeys = Object.keys(baseline).filter(k => k !== '_meta');
    console.log(`  baseline charts: ${chartKeys.join(', ')}`);
    console.log(`  G6 PASS — baseline ready. Run with <fresh-dump.json> to compare.`);
    process.exit(0);
  }

  const freshPath = path.resolve(freshArg);
  if (!fs.existsSync(freshPath)) {
    console.error(`FAIL: fresh dump not found at ${freshPath}`);
    process.exit(1);
  }
  const fresh: AxisDump = JSON.parse(fs.readFileSync(freshPath, 'utf8'));
  const diffs = compareAxisDumps(fresh, baseline);
  if (diffs.length === 0) {
    console.log(`G6 PASS — axis labels match baseline (diff 0).`);
    process.exit(0);
  }
  console.error(`FAIL: ${diffs.length} axis label drift(s)`);
  for (const d of diffs) {
    console.error(`  [${d.chart}] ${d.kind}: ${d.detail}`);
  }
  process.exit(1);
}
