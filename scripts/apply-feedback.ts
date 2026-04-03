/**
 * apply-feedback.ts
 * Records master feedback to the topic's master_feedback.json
 * and appends to the global memory/master/master_feedback_log.json.
 *
 * Usage:
 *   ts-node scripts/apply-feedback.ts <topicId> <phase> "<feedback>" "<directive>" [appliedTo...]
 *
 * Example:
 *   ts-node scripts/apply-feedback.ts topic_002 editor "Approved. Proceed." "Save reports." ace_rev01.md editor_rev01.md
 */

import * as fs from 'fs';
import * as path from 'path';
import type { MasterFeedback } from '../src/types/index';

const ROOT = path.resolve(__dirname, '..');

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
  const line = `[${new Date().toISOString()}] [apply-feedback] ${message}\n`;
  fs.appendFileSync(logPath, line, 'utf8');
}

function nextId(entries: MasterFeedback[]): string {
  const nums = entries
    .map(e => parseInt(e.id.replace('MF-', ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `MF-${String(next).padStart(3, '0')}`;
}

function run(): void {
  const args = process.argv.slice(2);
  const [topicId, phase, feedback, directive, ...appliedTo] = args;

  if (!topicId || !phase || !feedback || !directive) {
    console.error('Usage: ts-node scripts/apply-feedback.ts <topicId> <phase> "<feedback>" "<directive>" [appliedTo...]');
    process.exit(1);
  }

  const date = new Date().toISOString().slice(0, 10);

  // ── Topic-level feedback log ──────────────────────────────────────────────
  const topicDir = path.join(ROOT, 'topics', topicId);
  const topicFeedbackPath = path.join(topicDir, 'master_feedback.json');

  interface TopicFeedbackLog { topicId: string; feedback: MasterFeedback[] }
  const topicLog = readJson<TopicFeedbackLog>(topicFeedbackPath, { topicId, feedback: [] });

  // ── Global master feedback log ────────────────────────────────────────────
  const globalLogPath = path.join(ROOT, 'memory', 'master', 'master_feedback_log.json');
  interface GlobalFeedbackLog { feedbackLog: MasterFeedback[] }
  const globalLog = readJson<GlobalFeedbackLog>(globalLogPath, { feedbackLog: [] });

  const id = nextId([...topicLog.feedback, ...globalLog.feedbackLog]);

  const entry: MasterFeedback = {
    id,
    topicId,
    date,
    phase,
    feedback,
    directive,
    appliedTo: appliedTo.length > 0 ? appliedTo : ['all'],
    status: 'applied',
  };

  // Mark previous entries for same topic as applied if still pending
  topicLog.feedback = topicLog.feedback.map(f =>
    f.status === 'pending' ? { ...f, status: 'applied' as const } : f
  );
  topicLog.feedback.push(entry);

  globalLog.feedbackLog.push(entry);

  // Ensure topic dir exists
  if (!fs.existsSync(topicDir)) {
    fs.mkdirSync(topicDir, { recursive: true });
  }

  writeJson(topicFeedbackPath, topicLog);
  writeJson(globalLogPath, globalLog);
  appendLog(`Recorded feedback ${id} for ${topicId} / ${phase}`);

  console.log(`✓ Master feedback recorded: ${id}`);
  console.log(`  topic: ${topicId} | phase: ${phase}`);
  console.log(`  feedback: ${feedback}`);
  console.log(`  directive: ${directive}`);
  console.log(`  appliedTo: ${entry.appliedTo.join(', ')}`);
}

run();
