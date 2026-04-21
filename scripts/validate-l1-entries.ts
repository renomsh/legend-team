/**
 * validate-l1-entries.ts — Gate: L1 turn_log.jsonl 전수 검증
 * Usage: npx ts-node scripts/validate-l1-entries.ts [topicId ...]
 *   without args: scans all topics/ directories
 */
import * as fs from 'fs';
import * as path from 'path';
import { validateTurnLogEntry } from './lib/validate-context-layers';
import { ROOT } from './lib/utils';

const TOPICS_DIR = path.join(ROOT, 'topics');

function validateTopic(topicId: string): { ok: number; fail: number } {
  const logPath = path.join(TOPICS_DIR, topicId, 'turn_log.jsonl');
  if (!fs.existsSync(logPath)) return { ok: 0, fail: 0 };

  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  let ok = 0, fail = 0;
  for (const line of lines) {
    let e: unknown;
    try { e = JSON.parse(line); } catch { console.error(`  PARSE ERROR: ${line.slice(0, 60)}`); fail++; continue; }
    try {
      validateTurnLogEntry(e, { expectedTopicId: topicId });
      ok++;
    } catch(err) {
      console.error(`  FAIL [${topicId}]: ${(err as Error).message}`);
      fail++;
    }
  }
  return { ok, fail };
}

const args = process.argv.slice(2);
const topicIds = args.length > 0
  ? args
  : fs.existsSync(TOPICS_DIR)
    ? fs.readdirSync(TOPICS_DIR).filter(d => fs.statSync(path.join(TOPICS_DIR, d)).isDirectory())
    : [];

let totalOk = 0, totalFail = 0;
for (const topicId of topicIds) {
  const { ok, fail } = validateTopic(topicId);
  if (ok + fail > 0) {
    const icon = fail === 0 ? '✓' : '✗';
    console.log(`[${icon}] ${topicId}: ${ok} OK, ${fail} FAIL`);
    totalOk += ok; totalFail += fail;
  }
}
console.log(`\n총계: ${totalOk} OK, ${totalFail} FAIL`);
process.exit(totalFail > 0 ? 1 : 0);
