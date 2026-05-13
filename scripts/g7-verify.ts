/**
 * g7-verify.ts — PD-079 / D-181 Phase 7 검증 게이트 (stretch)
 *
 * e2e 시나리오 (dry-run): create-mtopic → mD 박제 → close → autoMigrateOnOpen
 * + CLAUDE.md m* 절 존재 + dispatch_config 정합 + G5/G6 회귀 게이트.
 *
 * 공식 SOT 보호: dry-run만 사용. apply 경로는 P5 g5-verify에서 이미 검증.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawnSync } from 'child_process';
import { ROOT } from './lib/utils';
import { getWorktreeId } from './lib/m-worktree-id';
import { mNamespacePaths } from './lib/m-namespace-paths';
import { atomicWriteJSON } from './lib/atomic-write';
import { appendMDecision } from './lib/m-decision-write';
import { autoMigrateOnOpen } from './lib/auto-migrate-on-open';
import { nextMTopicId } from './lib/m-id-generator';
import { checkMtopicAvailable } from './lib/m-lock';
import type { MTopicIndex } from './lib/m-types';

interface GateResult {
  id: string;
  pass: boolean;
  detail: string;
}

const results: GateResult[] = [];
function record(id: string, pass: boolean, detail: string): void {
  results.push({ id, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}: ${detail}`);
}

const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md');
const DISPATCH_CONFIG = path.join(ROOT, 'memory', 'shared', 'dispatch_config.json');

function snapshot(absPath: string): string | null {
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
}
function restore(absPath: string, snap: string | null): void {
  if (snap === null) {
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } else {
    fs.writeFileSync(absPath, snap, 'utf8');
  }
}

async function main(): Promise<void> {
  const wid = getWorktreeId();
  const paths = mNamespacePaths(wid);
  const topicIndexSnap = snapshot(paths.topicIndex);
  const decisionLedgerSnap = snapshot(paths.decisionLedger);

  let createdMtopicId: string | null = null;

  try {
    // ── G7-1: e2e dry-run 시나리오 ───────────────────────────────────────
    try {
      // 1. mtopic 발급
      createdMtopicId = nextMTopicId(wid);
      const avail = checkMtopicAvailable(createdMtopicId);
      if (!avail.available) {
        throw new Error(`mtopicId ${createdMtopicId} not available: ${JSON.stringify(avail.conflicts)}`);
      }
      const idx: MTopicIndex = topicIndexSnap
        ? (JSON.parse(topicIndexSnap) as MTopicIndex)
        : {
            schema: 'm_topic_index.v1',
            worktreeId: wid,
            topics: [],
            lastUpdated: new Date().toISOString(),
          };
      idx.topics.unshift({
        id: createdMtopicId,
        mtopicId: createdMtopicId,
        worktreeId: wid,
        title: 'g7 e2e smoke',
        topicSlug: 'g7-e2e-smoke',
        grade: 'C',
        status: 'closed',
        created: new Date().toISOString().slice(0, 10),
        closedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      } as unknown as MTopicIndex['topics'][number]);
      idx.lastUpdated = new Date().toISOString();
      atomicWriteJSON(paths.topicIndex, idx);

      // 2. mD 박제
      const ap = appendMDecision(wid, {
        date: new Date().toISOString().slice(0, 10),
        mtopicId: createdMtopicId,
        axis: 'g7 e2e smoke axis',
        summary: 'g7 e2e smoke summary — autoMigrateOnOpen dry-run 검증용',
      });
      if (!ap.mId || ap.quarantined) {
        throw new Error(`appendMDecision failed: ${JSON.stringify(ap)}`);
      }

      // 3. autoMigrateOnOpen dry-run
      const r = await autoMigrateOnOpen({ dryRun: true });
      const ok =
        r.ran === true &&
        r.summary !== undefined &&
        r.summary.migrated >= 1 &&
        r.error === undefined;
      record(
        'G7-1',
        ok,
        `ran=${r.ran}, migrated=${r.summary?.migrated}, skipped=${r.summary?.skipped}, errors=${r.summary?.errors}`
      );
    } catch (e) {
      record('G7-1', false, `threw: ${e instanceof Error ? e.message : String(e)}`);
    }

    // ── G7-2: CLAUDE.md m* 절 존재 ───────────────────────────────────────
    try {
      const md = fs.readFileSync(CLAUDE_MD, 'utf8');
      const hasSection = /##\s+m\*\s+병행세션|##\s+m_\*\s+병행세션|m\*\s+병행세션 시스템/.test(md);
      const hasD181 = /D-181/.test(md);
      record('G7-2', hasSection && hasD181, `section=${hasSection}, D-181=${hasD181}`);
    } catch (e) {
      record('G7-2', false, `read-failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // ── G7-3: dispatch_config 정합 (m_* 차단 규칙 없음) ──────────────────
    try {
      const cfg = fs.readFileSync(DISPATCH_CONFIG, 'utf8');
      const parsed = JSON.parse(cfg);
      // m_*에 대한 명시적 차단 규칙이 없으면 PASS
      const noBlock = !/m_\*|mtopic.*block|m_decision.*deny/i.test(JSON.stringify(parsed));
      record('G7-3', noBlock, `no-explicit-m*-block=${noBlock}`);
    } catch (e) {
      record('G7-3', false, `read-failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // ── G7-4: G5 회귀 게이트 ─────────────────────────────────────────────
    try {
      const r = spawnSync('npx', ['ts-node', 'scripts/g5-verify.ts'], {
        cwd: ROOT,
        encoding: 'utf8',
        shell: true,
      });
      const pass = r.status === 0;
      const summary = ((r.stdout ?? '') + '\n' + (r.stderr ?? '')).match(/G5 summary[^\n]*/)?.[0] ?? 'no-summary';
      record('G7-4', pass, `g5-exit=${r.status}, ${summary}`);
    } catch (e) {
      record('G7-4', false, `threw: ${e instanceof Error ? e.message : String(e)}`);
    }

    // ── G7-5: G6 회귀 게이트 ─────────────────────────────────────────────
    try {
      const r = spawnSync('npx', ['ts-node', 'scripts/g6-verify.ts'], {
        cwd: ROOT,
        encoding: 'utf8',
        shell: true,
      });
      const pass = r.status === 0;
      const summary = ((r.stdout ?? '') + '\n' + (r.stderr ?? '')).match(/G6 summary[^\n]*/)?.[0] ?? 'no-summary';
      record('G7-5', pass, `g6-exit=${r.status}, ${summary}`);
    } catch (e) {
      record('G7-5', false, `threw: ${e instanceof Error ? e.message : String(e)}`);
    }
  } finally {
    // cleanup: m_topic_index / m_decision_ledger 원복
    restore(paths.topicIndex, topicIndexSnap);
    restore(paths.decisionLedger, decisionLedgerSnap);
  }

  const pass = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log('---');
  console.log(`G7 summary: ${pass}/${total} PASS`);
  if (pass !== total) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('g7-verify threw:', e);
  process.exit(1);
});
