/**
 * load-context-briefs.ts
 * PD-020b P6 (session_062) — /open 로더용 context_brief 자동 로드.
 *
 * 역할: system_state.json의 openTopics 중 hold=null인 항목의
 *       topics/{id}/context_brief.md를 읽어 요약 출력.
 *
 * 특성:
 *  - hold!=null 토픽은 스킵 (보류 중 토픽은 로드 불필요)
 *  - context_brief.md 미존재 시 해당 토픽 스킵 (조용히)
 *  - excludeId 옵션: 신규 생성 토픽 ID는 제외 (자기 자신 로드 방지)
 *
 * Usage (CLI):
 *   npx ts-node scripts/load-context-briefs.ts [--exclude <topicId>]
 *
 * Usage (programmatic):
 *   import { loadContextBriefs } from './load-context-briefs';
 *   const results = loadContextBriefs({ excludeId: 'topic_065' });
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readJson } from './lib/utils';
import { checkTopicLifecycle, formatLifecycleWarnings } from './check-topic-lifecycle';
import { checkContextBriefAnchors, formatAnchorWarnings } from './check-context-brief-anchors';

const TOPICS_DIR        = path.join(ROOT, 'topics');
const SYSTEM_STATE_PATH = path.join(ROOT, 'memory', 'shared', 'system_state.json');

interface OpenTopic {
  id: string;
  title: string;
  status?: string;
  note?: string;
  [k: string]: unknown;
}

interface SystemState {
  openTopics?: OpenTopic[];
  [k: string]: unknown;
}

interface TopicContextEntry {
  topicId: string;
  title: string;
  phase: string;
  hold: unknown;
  grade: string;
  nextAction: string;
  raw: string;
}

function parseFrontmatterField(md: string, field: string): string {
  const regex = new RegExp(`^${field}:\\s*(.*)$`, 'm');
  const m = md.match(regex);
  return m?.[1]?.trim() ?? '';
}

function extractSection(md: string, heading: string): string {
  const idx = md.indexOf(heading);
  if (idx < 0) return '_(없음)_';
  const after = md.slice(idx + heading.length);
  const next = after.search(/\n## /);
  return (next < 0 ? after : after.slice(0, next)).trim() || '_(없음)_';
}

export interface LoadOptions {
  excludeId?: string | undefined;
}

export function loadContextBriefs(opts: LoadOptions = {}): TopicContextEntry[] {
  const state = readJson<SystemState>(SYSTEM_STATE_PATH, {});
  const openTopics: OpenTopic[] = state.openTopics ?? [];

  const results: TopicContextEntry[] = [];

  for (const topic of openTopics) {
    // Skip held topics
    if ((topic as Record<string, unknown>)['hold'] != null) continue;

    // Skip explicitly excluded topic (e.g., newly created one)
    if (opts.excludeId && topic.id === opts.excludeId) continue;

    const briefPath = path.join(TOPICS_DIR, topic.id, 'context_brief.md');
    if (!fs.existsSync(briefPath)) continue;

    const raw = fs.readFileSync(briefPath, 'utf8');
    const hold = parseFrontmatterField(raw, 'hold');
    if (hold && hold !== 'null') continue; // double-check hold in frontmatter

    const phase      = parseFrontmatterField(raw, 'phase') || 'unknown';
    const grade      = parseFrontmatterField(raw, 'grade') || '?';
    const nextAction = extractSection(raw, '## Next Action');

    results.push({ topicId: topic.id, title: topic.title, phase, hold, grade, nextAction, raw });
  }

  return results;
}

function formatOutput(entries: TopicContextEntry[]): string {
  if (entries.length === 0) {
    return '[context_brief 로드] 활성 토픽 없음 (또는 context_brief 미생성).';
  }

  const lines: string[] = ['[context_brief 로드] 활성 openTopics 컨텍스트 브리프:\n'];
  for (const e of entries) {
    lines.push(`### ${e.topicId} — ${e.title}`);
    lines.push(`- Phase: ${e.phase} | Grade: ${e.grade}`);
    lines.push(`- Next Action: ${e.nextAction}`);
    lines.push('');
  }
  return lines.join('\n');
}

// ── CLI entry point ───────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  let excludeId: string | undefined;
  const exIdx = args.indexOf('--exclude');
  if (exIdx >= 0 && args[exIdx + 1]) {
    excludeId = args[exIdx + 1];
  }

  const entries = loadContextBriefs({ excludeId });
  console.log(formatOutput(entries));

  // A6-2 lifecycle 경고
  const lifecycleWarnings = checkTopicLifecycle();
  const lifecycleOut = formatLifecycleWarnings(lifecycleWarnings);
  if (lifecycleOut) process.stderr.write(lifecycleOut + '\n');

  // A6-3 anchor lint 경고
  const anchorWarnings = checkContextBriefAnchors();
  const anchorOut = formatAnchorWarnings(anchorWarnings);
  if (anchorOut) process.stderr.write(anchorOut + '\n');
}
