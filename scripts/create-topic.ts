/**
 * create-topic.ts
 * Creates a new topic with control-plane workspace (topics/{id}) and registers
 * it in topic_index.json with both controlPath and reportPath.
 *
 * Usage:
 *   ts-node scripts/create-topic.ts "<topic title>"
 *   ts-node scripts/create-topic.ts "<topic title>" <slug>
 *
 * Example:
 *   ts-node scripts/create-topic.ts "팀 운영 구조 재설계" team-restructure
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

function createTopic(title: string, explicitSlug?: string): void {
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

  // topic_meta.json
  writeJson(path.join(topicDir, 'topic_meta.json'), {
    id,
    title,
    status: 'open',
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

  // Register in topic_index.json with 2-plane paths
  const entry: TopicIndexEntry = {
    id,
    title,
    status: 'open',
    created: date,
    controlPath: `topics/${id}`,
    reportPath,
    reportFiles: [],
    published: false,
    // legacy fallback
    path: `topics/${id}`,
  };
  index.topics.push(entry);
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
}

const args = process.argv.slice(2);
const title = args[0];
const slug = args[1];

if (!title || title.trim().length === 0) {
  console.error('Usage: ts-node scripts/create-topic.ts "<topic title>" [slug]');
  process.exit(1);
}

createTopic(title.trim(), slug?.trim());
