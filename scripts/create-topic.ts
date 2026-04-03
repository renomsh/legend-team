import * as fs from 'fs';
import * as path from 'path';
import type { TopicIndex, TopicIndexEntry } from '../src/types/index';

const ROOT = path.resolve(__dirname, '..');
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory/shared/topic_index.json');

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

function readTopicIndex(): TopicIndex {
  if (!fs.existsSync(TOPIC_INDEX_PATH)) {
    return { topics: [], lastUpdated: new Date().toISOString() };
  }
  const raw = fs.readFileSync(TOPIC_INDEX_PATH, 'utf8').trim();
  if (!raw) {
    return { topics: [], lastUpdated: new Date().toISOString() };
  }
  return JSON.parse(raw) as TopicIndex;
}

function nextTopicId(index: TopicIndex): string {
  const nums = index.topics
    .map(t => parseInt(t.id.replace('topic_', ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `topic_${pad(next)}`;
}

function writeJson(absPath: string, content: unknown): void {
  fs.writeFileSync(absPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
}

function agendaTemplate(id: string, title: string, date: string): string {
  return [
    '---',
    `topic: ${id}`,
    `title: ${title}`,
    'agent: ace',
    'revision: 1',
    `date: ${date}`,
    'status: draft',
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

function createTopic(title: string): void {
  const index = readTopicIndex();
  const id = nextTopicId(index);
  const topicDir = path.join(ROOT, 'topics', id);

  if (fs.existsSync(topicDir)) {
    console.error(`Error: topic directory already exists: topics/${id}`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const date = now.slice(0, 10);

  // Create folder structure (reports/ subfolder included)
  fs.mkdirSync(path.join(topicDir, 'reports'), { recursive: true });

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

  // agenda.md — structured placeholder for Ace to fill in
  fs.writeFileSync(
    path.join(topicDir, 'agenda.md'),
    agendaTemplate(id, title, date),
    'utf8'
  );

  // Structured empty JSON files
  writeJson(path.join(topicDir, 'debate_log.json'), { topicId: id, entries: [] });
  writeJson(path.join(topicDir, 'decisions.json'), { topicId: id, decisions: [] });
  writeJson(path.join(topicDir, 'open_issues.json'), { topicId: id, issues: [] });
  writeJson(path.join(topicDir, 'master_feedback.json'), { topicId: id, feedback: [] });
  writeJson(path.join(topicDir, 'revision_history.json'), { topicId: id, revisions: [] });
  writeJson(path.join(topicDir, 'speculative_options.json'), { topicId: id, options: [] });

  // Register in topic_index.json
  const entry: TopicIndexEntry = {
    id,
    title,
    status: 'open',
    created: date,
    path: `topics/${id}`,
  };
  index.topics.push(entry);
  index.lastUpdated = now;
  writeJson(TOPIC_INDEX_PATH, index);

  // Summary
  console.log(`\nTopic created: ${id} — "${title}"`);
  console.log(`  topics/${id}/topic_meta.json`);
  console.log(`  topics/${id}/agenda.md`);
  console.log(`  topics/${id}/debate_log.json`);
  console.log(`  topics/${id}/decisions.json`);
  console.log(`  topics/${id}/open_issues.json`);
  console.log(`  topics/${id}/master_feedback.json`);
  console.log(`  topics/${id}/revision_history.json`);
  console.log(`  topics/${id}/speculative_options.json`);
  console.log(`  topics/${id}/reports/`);
  console.log(`\nRegistered in memory/shared/topic_index.json`);
}

const title = process.argv[2];
if (!title || title.trim().length === 0) {
  console.error('Usage: ts-node scripts/create-topic.ts "<topic title>"');
  process.exit(1);
}

createTopic(title.trim());
