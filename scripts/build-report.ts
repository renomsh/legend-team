/**
 * @deprecated superseded (session_007, v0.4.0)
 * debate_log.json 기반 리포트 빌드 — run-debate.ts(deprecated)에 의존.
 * 현재 리포트는 Claude Code가 직접 reports/{date}_{slug}/{role}_rev{n}.md로 작성(D-002).
 * package.json "report" 참조 제거 완료.
 *
 * build-report.ts (original description below)
 * Compiles a final report for a topic by:
 * 1. Resolving controlPath from topic_index.json
 * 2. Reading all role debate entries from controlPath/debate_log.json
 * 3. Writing a report manifest to reportPath/manifest.json
 * 4. Printing a structured summary of all contributions
 */

import * as fs from 'fs';
import * as path from 'path';
import type { DebateEntry, ReportMeta, RoleId, TopicIndex } from '../src/types/index';

const ROOT = path.resolve(__dirname, '..');
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory/shared/topic_index.json');

const ROLE_ORDER: RoleId[] = ['ace', 'arki', 'fin', 'riki', 'nova', 'editor'];

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

interface TopicPaths {
  controlPath: string;
  reportPath: string;
}

/** Resolve controlPath and reportPath for a topic from topic_index */
function resolveTopicPaths(topicId: string): TopicPaths {
  const index = readJson<TopicIndex>(TOPIC_INDEX_PATH, { topics: [], lastUpdated: '' });
  const entry = index.topics.find(t => t.id === topicId);

  const controlPath = entry?.controlPath ?? `topics/${topicId}`;
  // reportPath: prefer explicit field; fallback to control-plane topics/{id}/reports (legacy)
  const reportPath = entry?.reportPath ?? `topics/${topicId}/reports`;

  return { controlPath, reportPath };
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

  const { controlPath, reportPath } = resolveTopicPaths(topicId);
  const debateLogPath = path.join(ROOT, controlPath, 'debate_log.json');

  if (!fs.existsSync(debateLogPath)) {
    console.error(`No debate log found: ${controlPath}/debate_log.json`);
    console.error('Run run-debate.ts first to record role outputs.');
    process.exit(1);
  }

  interface DebateLog { topicId: string; entries: DebateEntry[] }
  const debateLog = readJson<DebateLog>(debateLogPath, { topicId, entries: [] });

  // Only include latest submitted entries per role
  const latestByRole = new Map<RoleId, DebateEntry>();
  for (const entry of debateLog.entries) {
    if (entry.status === 'submitted') {
      const roleKey = (entry.role ?? entry.agent) as RoleId;
      latestByRole.set(roleKey, entry);
    }
  }

  const contributingRoles = ROLE_ORDER.filter(r => latestByRole.has(r));
  const entries = contributingRoles.map(r => latestByRole.get(r)!);

  if (entries.length === 0) {
    console.error('No submitted debate entries found. Nothing to compile.');
    process.exit(1);
  }

  const date = new Date().toISOString().slice(0, 10);
  const reportsDir = path.join(ROOT, reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const revision = nextRevision(reportsDir);

  const reportMeta: ReportMeta = {
    topicId,
    revision,
    date,
    status: 'draft',
    contributingRoles,
    filePath: `${reportPath}/manifest.json`,
    summary: `Report rev${revision} — ${contributingRoles.length} roles: ${contributingRoles.join(', ')}`,
  };

  // Write/update manifest in reportPath
  const manifestPath = path.join(reportsDir, 'manifest.json');
  interface ManifestFile { topicId: string; reports: ReportMeta[] }
  const manifest = readJson<ManifestFile>(manifestPath, { topicId, reports: [] });
  manifest.reports.push(reportMeta);
  writeJson(manifestPath, manifest);

  appendLog(`Built report rev${revision} for ${topicId} — roles: ${contributingRoles.join(', ')} → ${reportPath}`);

  // Print summary
  console.log(`\n✓ Report compiled: ${topicId} rev${revision}`);
  console.log(`  date: ${date}`);
  console.log(`  roles: ${contributingRoles.join(', ')}`);
  console.log(`\n  Role contributions:`);
  for (const entry of entries) {
    const r = entry.role ?? entry.agent;
    console.log(`    [${r}] ${entry.phase} — ${entry.filePath}`);
    if (entry.summary) console.log(`           ${entry.summary}`);
  }
  console.log(`\n  Control plane:  ${controlPath}/debate_log.json`);
  console.log(`  Report plane:   ${reportPath}/manifest.json`);
  console.log(`  Status: draft (run apply-feedback.ts to mark as approved)`);
}

run();
