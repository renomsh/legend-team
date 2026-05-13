/**
 * m-kpi.ts — PD-079 / D-181 Phase 6
 *
 * KPI 3종 (Master `/open` args):
 *   1. mtopic_orphan_count     — git worktree list 외 wid의 m_topic_index 개수
 *   2. migration_execution_rate — 최근 마이그 success / (success + skipped + failed)
 *   3. migration_accuracy_proxy — 최근 migrated D-NNN의 재유사도. dedupeThreshold 미만 비율 (높을수록 dedupe 정확)
 *
 * 단일 출처: memory/shared/m_kpi.json (.gitattributes merge=ours)
 *
 * non-blocking: 측정 실패는 sentinel 값(-1)으로 박제. throw 안 함.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ROOT, readJson } from './utils';
import { atomicWriteJSON } from './atomic-write';
import { trigrams, cosine } from './similarity';
import {
  readMigrationLog,
  type MigrationLogEntry,
} from './m-migration-log';

const SHARED = path.join(ROOT, 'memory', 'shared');
const KPI_PATH = path.join(SHARED, 'm_kpi.json');
const M_CONFIG_PATH = path.join(SHARED, 'm_config.json');
const OFFICIAL_LEDGER_PATH = path.join(SHARED, 'decision_ledger.json');

export const M_KPI_SCHEMA = 'm_kpi.v1';

export interface MKPISnapshot {
  schema: typeof M_KPI_SCHEMA;
  sampledAt: string;
  orphanCount: number;
  executionRate: number;
  accuracyProxy: number;
  detail: {
    orphanWids: string[];
    totalMTopicsClosed: number;
    totalMigrationLogEntries: number;
    sampleSize: number;
  };
}

interface MConfigKpi {
  similarity?: { dedupeThreshold?: number };
  kpi?: { accuracySampleSize?: number };
}

interface DecisionLedgerFile {
  decisions: Array<{ id: string; axis?: string; decision?: string }>;
}

/** git worktree list --porcelain 파싱. 실패 시 null (sentinel). */
function activeWids(): Set<string> | null {
  try {
    const out = execSync('git worktree list --porcelain', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const wids = new Set<string>();
    for (const line of out.split(/\r?\n/)) {
      // worktree <abs-path>
      const m = /^worktree\s+(.+)$/.exec(line);
      if (!m || !m[1]) continue;
      const wpath = m[1];
      const base = path.basename(wpath);
      wids.add(base);
    }
    return wids;
  } catch {
    return null;
  }
}

/** m_topic_index_<wid>.json 파일에서 wid 추출. */
function listMTopicIndexWids(): string[] {
  if (!fs.existsSync(SHARED)) return [];
  const out: string[] = [];
  for (const f of fs.readdirSync(SHARED)) {
    const m = /^m_topic_index_(.+)\.json$/.exec(f);
    if (m && m[1]) out.push(m[1]);
  }
  return out;
}

function computeOrphan(): { count: number; orphanWids: string[] } {
  const active = activeWids();
  const indexed = listMTopicIndexWids();
  if (active === null) {
    // sentinel: -1 표시 (unknown)
    return { count: -1, orphanWids: [] };
  }
  // wid 비교 시 정확 일치만 (path basename 기반)
  const orphans = indexed.filter((w) => !active.has(w));
  return { count: orphans.length, orphanWids: orphans };
}

function computeExecutionRate(log: MigrationLogEntry[]): number {
  // 최근 30일 또는 전체. 30일 cutoff.
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = log.filter((e) => {
    const ts = Date.parse(e.timestamp);
    return Number.isFinite(ts) && ts >= cutoff;
  });
  if (recent.length === 0) return 1; // 마이그 시도 없음 = 100% (관측 가능 영역에서 fail 0)
  const success = recent.filter((e) => e.action === 'success').length;
  const denom = recent.filter((e) =>
    ['success', 'skipped', 'failed'].includes(e.action)
  ).length;
  if (denom === 0) return 1;
  return success / denom;
}

function computeAccuracyProxy(log: MigrationLogEntry[]): { value: number; sampleSize: number } {
  const cfg = readJson<MConfigKpi>(M_CONFIG_PATH, {});
  const N = cfg.kpi?.accuracySampleSize ?? 20;
  const threshold = cfg.similarity?.dedupeThreshold ?? 0.85;

  // 최근 success 마이그된 decision 샘플
  const successDecisions = log
    .filter(
      (e) =>
        e.action === 'success' &&
        e.details &&
        (e.details as { kind?: string }).kind === 'decision'
    )
    .slice(-N);

  if (successDecisions.length === 0) {
    return { value: 1, sampleSize: 0 };
  }

  const ledger = readJson<DecisionLedgerFile>(OFFICIAL_LEDGER_PATH, { decisions: [] });
  const decisionsById = new Map(ledger.decisions.map((d) => [d.id, d]));

  let exceeded = 0; // similarity ≥ threshold against OTHER decisions = potential dedupe miss
  let counted = 0;
  for (const e of successDecisions) {
    const det = e.details as { assignedId?: string };
    const assignedId = det?.assignedId;
    if (!assignedId) continue;
    const target = decisionsById.get(assignedId);
    if (!target) continue;
    const text = `${target.axis ?? ''} ${target.decision ?? ''}`.trim();
    if (!text) continue;
    const targetVec = trigrams(text);

    let maxScore = 0;
    for (const other of ledger.decisions) {
      if (other.id === target.id) continue;
      const otherText = `${other.axis ?? ''} ${other.decision ?? ''}`.trim();
      if (!otherText) continue;
      const s = cosine(targetVec, trigrams(otherText));
      if (s > maxScore) maxScore = s;
    }
    counted += 1;
    if (maxScore >= threshold) exceeded += 1;
  }

  if (counted === 0) return { value: 1, sampleSize: 0 };
  // accuracyProxy = 1 - (dedupe miss 비율). 높을수록 정확.
  return { value: 1 - exceeded / counted, sampleSize: counted };
}

export function computeMKPIs(): MKPISnapshot {
  const orphan = computeOrphan();
  const logFile = readMigrationLog();
  const exec = computeExecutionRate(logFile.entries);
  const acc = computeAccuracyProxy(logFile.entries);

  const closedCount = listMTopicIndexWids().length; // 근사: index 파일 수 (정확 closed scan은 비용 ↑)

  return {
    schema: M_KPI_SCHEMA,
    sampledAt: new Date().toISOString(),
    orphanCount: orphan.count,
    executionRate: exec,
    accuracyProxy: acc.value,
    detail: {
      orphanWids: orphan.orphanWids,
      totalMTopicsClosed: closedCount,
      totalMigrationLogEntries: logFile.entries.length,
      sampleSize: acc.sampleSize,
    },
  };
}

export function writeMKPISnapshot(snap: MKPISnapshot): void {
  atomicWriteJSON(KPI_PATH, snap);
}

if (require.main === module) {
  const snap = computeMKPIs();
  if (process.argv.includes('--apply')) {
    writeMKPISnapshot(snap);
  }
  console.log(JSON.stringify(snap, null, 2));
}
