/**
 * log-evidence.ts  [L-02 evidence_index 자동 갱신]
 * Appends a new evidence entry to memory/shared/evidence_index.json.
 * Agents (especially Riki and Arki) should call this when surfacing a key finding.
 *
 * Usage:
 *   ts-node scripts/log-evidence.ts <topicSlug> <type> <source> "<finding>" [status]
 *
 * Types: structural-diagnosis | principle-violation | risk | assumption | data | reference | expert-input
 * Status defaults to "open"
 *
 * Example:
 *   ts-node scripts/log-evidence.ts topic_002 risk riki "Memory files empty in v0.1.0" open
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Evidence, AgentId } from '../src/types/index';

const ROOT = path.resolve(__dirname, '..');
const EVIDENCE_PATH = path.join(ROOT, 'memory', 'shared', 'evidence_index.json');

const VALID_TYPES = [
  'structural-diagnosis', 'principle-violation', 'risk',
  'assumption', 'data', 'reference', 'expert-input',
];

const VALID_AGENTS: AgentId[] = ['ace', 'arki', 'fin', 'riki', 'editor', 'nova', 'master'];

function readJson<T>(absPath: string, fallback: T): T {
  if (!fs.existsSync(absPath)) return fallback;
  const raw = fs.readFileSync(absPath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function writeJson(absPath: string, content: unknown): void {
  fs.writeFileSync(absPath, JSON.stringify(content, null, 2) + '\n', 'utf8');
}

function appendLog(message: string): void {
  const logPath = path.join(ROOT, 'logs', 'app.log');
  const line = `[${new Date().toISOString()}] [log-evidence] ${message}\n`;
  fs.appendFileSync(logPath, line, 'utf8');
}

function nextId(entries: Array<{ id: string }>): string {
  const nums = entries
    .map(e => parseInt(e.id.replace('E-', ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `E-${String(next).padStart(3, '0')}`;
}

function run(): void {
  const [topicSlug, type, source, finding, status = 'open'] = process.argv.slice(2);

  if (!topicSlug || !type || !source || !finding) {
    console.error('Usage: ts-node scripts/log-evidence.ts <topicSlug> <type> <source> "<finding>" [status]');
    console.error(`Types: ${VALID_TYPES.join(' | ')}`);
    process.exit(1);
  }

  if (!VALID_TYPES.includes(type)) {
    console.error(`Invalid type: ${type}. Must be one of: ${VALID_TYPES.join(', ')}`);
    process.exit(1);
  }

  interface EvidenceIndex { evidence: Evidence[]; lastUpdated: string }
  const index = readJson<EvidenceIndex>(EVIDENCE_PATH, { evidence: [], lastUpdated: '' });

  const id = nextId(index.evidence);
  const date = new Date().toISOString().slice(0, 10);
  const sourceAgent = VALID_AGENTS.includes(source as AgentId) ? source as AgentId : 'master';

  const entry: Evidence & { topic: string; status: string } = {
    id,
    topicId: topicSlug,
    topic: topicSlug,
    date,
    description: finding,
    source: sourceAgent,
    type: type as Evidence['type'],
    usedBy: [sourceAgent],
    status,
  } as Evidence & { topic: string; status: string };

  index.evidence.push(entry as unknown as Evidence);
  index.lastUpdated = new Date().toISOString();
  writeJson(EVIDENCE_PATH, index);

  appendLog(`Logged evidence ${id}: [${type}] ${finding.slice(0, 60)}`);

  console.log(`✓ Evidence logged: ${id}`);
  console.log(`  topic: ${topicSlug} | type: ${type} | source: ${source}`);
  console.log(`  finding: ${finding}`);
}

run();
