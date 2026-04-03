/**
 * build-report.ts
 * Compiles a final report for a topic by:
 * 1. Reading all agent debate entries from debate_log.json
 * 2. Writing a report manifest to topics/{topicId}/reports/manifest.json
 * 3. Printing a structured summary of all contributions
 *
 * Usage:
 *   ts-node scripts/build-report.ts <topicId>
 *
 * Example:
 *   ts-node scripts/build-report.ts topic_002
 */

import * as fs from 'fs';
import * as path from 'path';
import type { DebateEntry, ReportMeta, AgentId } from '../src/types/index';

const ROOT = path.resolve(__dirname, '..');

const AGENT_ORDER: AgentId[] = ['ace', 'arki', 'fin', 'riki', 'nova', 'editor'];

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
  const line = `[${new Date().toISOString()}] [build-report] ${message}\n`;
  fs.appendFileSync(logPath, line, 'utf8');
}

function nextRevision(reportsDir: string): number {
  const manifestPath = path.join(reportsDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return 1;
  const raw = fs.readFileSync(manifestPath, 'utf8').trim();
  if (!raw) return 1;
  interface ManifestFile { reports: ReportMeta[] }
  const data = JSON.parse(raw) as ManifestFile;
  if (!data.reports || data.reports.length === 0) return 1;
  return Math.max(...data.reports.map(r => r.revision)) + 1;
}

function run(): void {
  const topicId = process.argv[2];

  if (!topicId) {
    console.error('Usage: ts-node scripts/build-report.ts <topicId>');
    process.exit(1);
  }

  const topicDir = path.join(ROOT, 'topics', topicId);
  const debateLogPath = path.join(topicDir, 'debate_log.json');

  if (!fs.existsSync(debateLogPath)) {
    console.error(`No debate log found: topics/${topicId}/debate_log.json`);
    console.error('Run run-debate.ts first to record agent outputs.');
    process.exit(1);
  }

  interface DebateLog { topicId: string; entries: DebateEntry[] }
  const debateLog = readJson<DebateLog>(debateLogPath, { topicId, entries: [] });

  // Only include latest submitted entries per agent
  const latestByAgent = new Map<AgentId, DebateEntry>();
  for (const entry of debateLog.entries) {
    if (entry.status === 'submitted') {
      latestByAgent.set(entry.agent, entry);
    }
  }

  const contributingAgents = AGENT_ORDER.filter(a => latestByAgent.has(a));
  const entries = contributingAgents.map(a => latestByAgent.get(a)!);

  if (entries.length === 0) {
    console.error('No submitted debate entries found. Nothing to compile.');
    process.exit(1);
  }

  const date = new Date().toISOString().slice(0, 10);
  const reportsDir = path.join(topicDir, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const revision = nextRevision(reportsDir);

  const reportMeta: ReportMeta = {
    topicId,
    revision,
    date,
    status: 'draft',
    contributingAgents,
    filePath: `topics/${topicId}/reports/manifest.json`,
    summary: `Report rev${revision} — ${contributingAgents.length} agents: ${contributingAgents.join(', ')}`,
  };

  // Write/update manifest
  const manifestPath = path.join(reportsDir, 'manifest.json');
  interface ManifestFile { topicId: string; reports: ReportMeta[] }
  const manifest = readJson<ManifestFile>(manifestPath, { topicId, reports: [] });
  manifest.reports.push(reportMeta);
  writeJson(manifestPath, manifest);

  appendLog(`Built report rev${revision} for ${topicId} — agents: ${contributingAgents.join(', ')}`);

  // Print summary
  console.log(`\n✓ Report compiled: ${topicId} rev${revision}`);
  console.log(`  date: ${date}`);
  console.log(`  agents: ${contributingAgents.join(', ')}`);
  console.log(`\n  Agent contributions:`);
  for (const entry of entries) {
    console.log(`    [${entry.agent}] ${entry.phase} — ${entry.filePath}`);
    if (entry.summary) console.log(`           ${entry.summary}`);
  }
  console.log(`\n  Manifest: topics/${topicId}/reports/manifest.json`);
  console.log(`  Status: draft (run apply-feedback.ts to mark as master-approved)`);
}

run();
