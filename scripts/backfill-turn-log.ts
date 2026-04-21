/**
 * backfill-turn-log.ts
 * PD-020b P2b (session_061) — session_index의 turns[]로 topic turn_log.jsonl 소급 생성.
 *
 * 동작:
 *  1. session_index.json 전체 스캔
 *  2. legacy:true 또는 turns[] 없는 세션은 skip
 *  3. 각 세션의 topicId + turns[]로 turn_log.jsonl에 append
 *  4. 이미 해당 sessionId 엔트리가 turn_log에 있으면 skip (멱등)
 *
 * 보장:
 *  - turns[] 필드에 있는 데이터만 기록 (fabrication 없음)
 *  - ts 는 세션 startedAt 기준 + turnIdx * 1ms 로 단조증가 타임스탬프 생성
 *    (실제 발언 시각 불명 — 소급 backfill 임을 gist에 명시)
 *
 * Usage:
 *   npx ts-node scripts/backfill-turn-log.ts [--session=session_060] [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readJson, appendLog } from './lib/utils';
import { appendTurnLogEntry, readTurnLog } from './write-turn-log';
import type { Turn } from './lib/turn-types';

const SESSION_INDEX_PATH = path.join(ROOT, 'memory', 'sessions', 'session_index.json');
const TOPIC_INDEX_PATH   = path.join(ROOT, 'memory', 'shared', 'topic_index.json');

interface SessionEntry {
  sessionId: string;
  topicId?: string;
  topicSlug?: string;
  startedAt?: string;
  legacy?: boolean;
  turns?: Turn[];
}
interface SessionIndex { sessions: SessionEntry[] }
interface TopicEntry   { id: string; [k: string]: unknown }
interface TopicIndex   { topics: TopicEntry[] }

function resolveTopicId(session: SessionEntry, topicIndex: TopicIndex): string | null {
  if (session.topicId) return session.topicId;
  if (!session.topicSlug) return null;

  // topicSlug may include a date prefix ("2026-04-21_pd-020b-...") — strip it
  const slug = session.topicSlug.replace(/^\d{4}-\d{2}-\d{2}_/, '');

  const match = topicIndex.topics.find(t => {
    // Match against reportPath suffix (reports/{date}_{slug})
    const reportPath = (t['reportPath'] as string | undefined) ?? '';
    const reportSlug = reportPath.replace(/^reports\/\d{4}-\d{2}-\d{2}_/, '');
    if (reportSlug === slug) return true;

    // Match against controlPath leaf (topics/{id}/{slug} pattern is uncommon, skip)
    // Match topic_slug field if present
    const tSlug = (t['topicSlug'] as string | undefined) ?? '';
    return tSlug === slug || tSlug === session.topicSlug;
  });

  return match?.id ?? null;
}

function monoTs(baseIso: string, offsetMs: number): string {
  const base = new Date(baseIso).getTime();
  return new Date(base + offsetMs).toISOString();
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const sessionFilter = args.find(a => a.startsWith('--session='))?.split('=')[1];

  const index = readJson<SessionIndex>(SESSION_INDEX_PATH, { sessions: [] });
  const topicIndex = readJson<TopicIndex>(TOPIC_INDEX_PATH, { topics: [] });

  let processed = 0, skipped = 0, errors = 0;

  for (const session of index.sessions) {
    if (sessionFilter && session.sessionId !== sessionFilter) continue;
    if (session.legacy) { skipped++; continue; }
    if (!session.turns || session.turns.length === 0) { skipped++; continue; }

    const topicId = session.topicId ?? resolveTopicId(session, topicIndex);
    if (!topicId) {
      console.warn(`SKIP ${session.sessionId}: topicId 불명`);
      skipped++;
      continue;
    }

    // 멱등 체크 — 이미 이 세션 엔트리가 있으면 skip
    const existing = readTurnLog(topicId, session.sessionId);
    if (existing.length > 0) {
      console.log(`SKIP ${session.sessionId} (topic=${topicId}): 이미 ${existing.length}개 엔트리 존재`);
      skipped++;
      continue;
    }

    const baseTs = session.startedAt ?? '2026-01-01T00:00:00.000Z';
    console.log(`BACKFILL ${session.sessionId} → ${topicId} (${session.turns.length} turns)${dryRun ? ' [DRY]' : ''}`);

    for (const turn of session.turns) {
      const entry = {
        ts: monoTs(baseTs, turn.turnIdx),
        topicId,
        sessionId: session.sessionId,
        turnIdx: turn.turnIdx,
        role: turn.role,
        ...(turn.phase      ? { phase: turn.phase }           : {}),
        ...(turn.recallReason ? { recallReason: turn.recallReason } : {}),
        ...(turn.splitReason  ? { splitReason: turn.splitReason }   : {}),
        ...(turn.chars        ? { chars: turn.chars }               : {}),
        gist: `[backfill] ${session.sessionId}`,
      };

      if (!dryRun) {
        try {
          appendTurnLogEntry(topicId, entry);
        } catch (err) {
          console.error(`  ERROR turn ${turn.turnIdx}: ${(err as Error).message}`);
          errors++;
          continue;
        }
      } else {
        console.log('  DRY:', JSON.stringify(entry));
      }
    }
    processed++;
  }

  const msg = `backfill done | processed=${processed} skipped=${skipped} errors=${errors}${dryRun ? ' (dry-run)' : ''}`;
  console.log(msg);
  if (!dryRun) appendLog('backfill-turn-log', msg);
}

main();
