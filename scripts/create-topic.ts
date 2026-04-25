/**
 * create-topic.ts
 * Creates a new topic with control-plane workspace (topics/{id}) and registers
 * it in topic_index.json with both controlPath and reportPath.
 *
 * Usage:
 *   ts-node scripts/create-topic.ts "<topic title>"
 *   ts-node scripts/create-topic.ts "<topic title>" <slug>
 *   ts-node scripts/create-topic.ts "<topic title>" <slug> <grade>
 *
 * Example:
 *   ts-node scripts/create-topic.ts "팀 운영 구조 재설계" team-restructure A
 *
 * D-052: phase:"framing" + hold:null 강제 기록. grade 선택 파라미터.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TopicIndex, TopicIndexEntry } from '../src/types/index';
import { ROOT, readJson, writeJson, nextId } from './lib/utils';
import { compareTopicDesc } from './migrate-topic-index';

const TOPIC_INDEX_PATH = path.join(ROOT, 'memory/shared/topic_index.json');

function readTopicIndex(): TopicIndex {
  return readJson<TopicIndex>(TOPIC_INDEX_PATH, { topics: [], lastUpdated: new Date().toISOString() });
}

function nextTopicId(index: TopicIndex): string {
  return nextId(index.topics, 'topic_');
}

/** Canonical v0.3.0 frontmatter template for Ace's agenda */
function agendaTemplate(id: string, topicSlug: string, title: string, date: string): string {
  return [
    '---',
    `topic: ${id}`,
    `topic_slug: ${topicSlug}`,
    `title: ${title}`,
    'role: ace',
    'phase: framing',
    'revision: 1',
    `date: ${date}`,
    'report_status: draft',
    'session_status: open',
    'accessed_assets:',
    '  - topic_index.json',
    '  - decision_ledger.json',
    '---',
    '',
    '## Topic Statement',
    '',
    '## Decision Axes',
    '',
    '## Scope',
    '',
    '### In',
    '',
    '### Out',
    '',
    '## Key Assumptions',
    '',
    '## Agent Sequence',
    '',
    '## Open Questions',
    '',
  ].join('\n');
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

const VALID_GRADES = new Set(['S', 'A', 'B', 'C']);
const VALID_TOPIC_TYPES = new Set(['framing', 'implementation', 'standalone']);

function createTopic(
  title: string,
  explicitSlug?: string,
  grade?: string,
  topicType?: string,
  parentTopicId?: string
): void {
  const index = readTopicIndex();
  const id = nextTopicId(index);
  const topicDir = path.join(ROOT, 'topics', id);

  if (fs.existsSync(topicDir)) {
    console.error(`Error: topic directory already exists: topics/${id}`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const date = now.slice(0, 10);
  const topicSlug = explicitSlug ?? slugify(title);
  const reportPath = `reports/${date}_${topicSlug}`;

  // Create control-plane folder structure
  fs.mkdirSync(topicDir, { recursive: true });

  // topic_meta.json — D-052: phase×hold 강제 기록
  writeJson(path.join(topicDir, 'topic_meta.json'), {
    id,
    title,
    status: 'open',
    phase: 'framing',
    hold: null,
    created: date,
    lastUpdated: date,
    description: '',
    tags: [],
  });

  // agenda.md — canonical v0.3.0 frontmatter
  fs.writeFileSync(
    path.join(topicDir, 'agenda.md'),
    agendaTemplate(id, topicSlug, title, date),
    'utf8'
  );

  // Structured empty JSON files
  writeJson(path.join(topicDir, 'debate_log.json'), { topicId: id, entries: [] });
  writeJson(path.join(topicDir, 'decisions.json'), { topicId: id, decisions: [] });
  writeJson(path.join(topicDir, 'open_issues.json'), { topicId: id, issues: [] });
  writeJson(path.join(topicDir, 'master_feedback.json'), { topicId: id, feedback: [] });
  writeJson(path.join(topicDir, 'revision_history.json'), { topicId: id, revisions: [] });
  writeJson(path.join(topicDir, 'speculative_options.json'), { topicId: id, options: [] });

  // Register in topic_index.json with 2-plane paths + D-052 fields
  const entry: TopicIndexEntry = {
    id,
    title,
    status: 'open',
    phase: 'framing',
    hold: null,
    ...(grade && VALID_GRADES.has(grade) ? { grade: grade as 'S' | 'A' | 'B' | 'C' } : {}),
    ...(topicType && VALID_TOPIC_TYPES.has(topicType)
      ? {
          topicType: topicType as 'framing' | 'implementation' | 'standalone',
          parentTopicId: parentTopicId ?? null,
          childTopicIds: [] as string[],
        }
      : {}),
    created: date,
    controlPath: `topics/${id}`,
    reportPath,
    reportFiles: [],
    published: false,
    /** 이 토픽이 종결된 세션 ID (session-end-finalize.js가 set-closed-in-session.ts로 기록) */
    closedInSession: null,
    // legacy fallback
    path: `topics/${id}`,
  } as TopicIndexEntry & { closedInSession: string | null };
  index.topics.push(entry);

  // D-057: parentTopicId 지정 시 parent의 childTopicIds에 자동 추가
  if (topicType && VALID_TOPIC_TYPES.has(topicType) && parentTopicId) {
    const parent = index.topics.find((t: any) => t.id === parentTopicId);
    if (parent) {
      (parent as any).childTopicIds = (parent as any).childTopicIds ?? [];
      if (!(parent as any).childTopicIds.includes(id)) {
        (parent as any).childTopicIds.push(id);
      }
    }
  }

  // Keep topic_index sorted by id desc so the board never goes out of order.
  index.topics.sort((a, b) => compareTopicDesc(a.id, b.id));
  index.lastUpdated = now;
  writeJson(TOPIC_INDEX_PATH, index);

  // Summary
  console.log(`\nTopic created: ${id} — "${title}"`);
  console.log(`  Control plane:  topics/${id}/`);
  console.log(`    topic_meta.json, agenda.md, debate_log.json`);
  console.log(`    decisions.json, open_issues.json, master_feedback.json`);
  console.log(`    revision_history.json, speculative_options.json`);
  console.log(`  Report plane:   ${reportPath}/  (created on first build-report run)`);
  console.log(`\nRegistered in memory/shared/topic_index.json`);
  console.log(`  controlPath: topics/${id}`);
  console.log(`  reportPath:  ${reportPath}`);
  console.log(`  phase: framing | hold: null${grade && VALID_GRADES.has(grade) ? ` | grade: ${grade}` : ''}`);
}

// 위치 인자와 플래그 분리 파싱
const rawArgs = process.argv.slice(2);
const positionals: string[] = [];
let topicType: string | undefined;
let parentTopicId: string | undefined;
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--topicType') { topicType = rawArgs[++i]; }
  else if (a === '--parentTopicId') { parentTopicId = rawArgs[++i]; }
  else if (a !== undefined) { positionals.push(a); }
}
const title = positionals[0];
const slug = positionals[1];
const grade = positionals[2]?.toUpperCase();

if (!title || title.trim().length === 0) {
  console.error('Usage: ts-node scripts/create-topic.ts "<topic title>" [slug] [grade:S|A|B|C] [--topicType framing|implementation|standalone] [--parentTopicId topic_NNN]');
  process.exit(1);
}

if (grade && !VALID_GRADES.has(grade)) {
  console.error(`⚠️  grade "${grade}" 무시됨 — 유효값: S, A, B, C`);
}

if (topicType && !VALID_TOPIC_TYPES.has(topicType)) {
  console.error(`⚠️  topicType "${topicType}" 무시됨 — 유효값: framing, implementation, standalone`);
  topicType = undefined;
}

createTopic(title.trim(), slug?.trim(), grade, topicType, parentTopicId);
