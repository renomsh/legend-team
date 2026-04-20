/**
 * migrate-topic-index.ts
 * 일회성 마이그레이션 + 재사용 가능한 정렬/정규화 유틸.
 * - closed → completed (status_catalog.aliases 기반)
 * - topics 배열을 id 내림차순(natural)으로 재정렬
 *
 * 사용:
 *   npx ts-node scripts/migrate-topic-index.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const TOPIC_INDEX = path.join(ROOT, 'memory/shared/topic_index.json');
const STATUS_CATALOG = path.join(ROOT, 'memory/shared/status_catalog.json');

interface StatusCatalog {
  statuses: Array<{ id: string; terminal: boolean }>;
  aliases: Record<string, string>;
  defaultStatus: string;
}

interface TopicEntry {
  id: string;
  status: string;
  [k: string]: unknown;
}

/** topic_NNN[suffix] → { num, suffix } */
export function parseTopicId(id: string): { num: number; suffix: string } {
  const m = /^topic_(\d+)([a-z]*)$/i.exec(id);
  if (!m) return { num: -1, suffix: id };
  return { num: parseInt(m[1]!, 10), suffix: (m[2] ?? '').toLowerCase() };
}

/** 내림차순(큰 num 먼저; 같은 num이면 suffix 긴 게 먼저 → 10a가 10 위). */
export function compareTopicDesc(a: string, b: string): number {
  const pa = parseTopicId(a);
  const pb = parseTopicId(b);
  if (pa.num !== pb.num) return pb.num - pa.num;
  if (pa.suffix === pb.suffix) return 0;
  return pb.suffix.localeCompare(pa.suffix);
}

export function normalizeStatus(raw: string, catalog: StatusCatalog): string {
  if (catalog.aliases[raw]) return catalog.aliases[raw]!;
  const valid = catalog.statuses.some(s => s.id === raw);
  return valid ? raw : catalog.defaultStatus;
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(STATUS_CATALOG, 'utf8')) as StatusCatalog;
  const idx = JSON.parse(fs.readFileSync(TOPIC_INDEX, 'utf8')) as { topics: TopicEntry[]; lastUpdated: string };

  let statusChanged = 0;
  for (const t of idx.topics) {
    const before = t.status;
    const after = normalizeStatus(before, catalog);
    if (before !== after) {
      t.status = after;
      statusChanged++;
    }
  }

  const before = idx.topics.map(t => t.id);
  idx.topics.sort((a, b) => compareTopicDesc(a.id, b.id));
  const after = idx.topics.map(t => t.id);
  const reordered = before.some((v, i) => v !== after[i]);

  idx.lastUpdated = new Date().toISOString();
  fs.writeFileSync(TOPIC_INDEX, JSON.stringify(idx, null, 2) + '\n', 'utf8');

  console.log(`[migrate-topic-index] status normalized: ${statusChanged}건`);
  console.log(`[migrate-topic-index] reordered: ${reordered ? 'yes' : 'no'} (${idx.topics.length} topics)`);
  console.log(`[migrate-topic-index] first 5 after sort: ${after.slice(0, 5).join(', ')}`);
}

if (require.main === module) main();
