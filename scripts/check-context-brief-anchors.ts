/**
 * check-context-brief-anchors.ts
 * A6-3: context_brief Key Anchors 섹션 lint (D-055).
 *
 * 규칙:
 *   - session_contributions 1개 이상 있는 토픽은 context_brief의
 *     "## Key Anchors" 섹션에 실제 내용이 있어야 함 (경고만, 차단 없음)
 *   - legacyCutoff 이전 생성 토픽은 면제
 *   - hold!=null 토픽 면제
 *
 * Usage:
 *   npx ts-node scripts/check-context-brief-anchors.ts
 *
 * Programmatic:
 *   import { checkContextBriefAnchors } from './check-context-brief-anchors';
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readJson } from './lib/utils';

const LIFECYCLE_RULES_PATH = path.join(ROOT, 'memory', 'shared', 'topic_lifecycle_rules.json');
const TOPIC_INDEX_PATH      = path.join(ROOT, 'memory', 'shared', 'topic_index.json');
const TOPICS_DIR            = path.join(ROOT, 'topics');

interface LifecycleRules {
  legacyCutoff?: string;
}

interface TopicIndexEntry {
  id: string;
  title: string;
  status: string;
  hold?: unknown;
  created?: string;
  [k: string]: unknown;
}

export interface AnchorWarning {
  topicId: string;
  title: string;
  detail: string;
}

function isLegacy(topic: TopicIndexEntry, cutoff: string): boolean {
  if (!topic.created) return true;
  return topic.created < cutoff;
}

function hasRealContent(section: string): boolean {
  const trimmed = section.trim();
  return trimmed.length > 0 && !trimmed.match(/^_\(없음\)_$/m);
}

function extractSection(md: string, heading: string): string {
  const idx = md.indexOf(heading);
  if (idx < 0) return '';
  const after = md.slice(idx + heading.length);
  const next = after.search(/\n## /);
  return (next < 0 ? after : after.slice(0, next)).trim();
}

function countSessionContributions(topicId: string): number {
  const dir = path.join(TOPICS_DIR, topicId, 'session_contributions');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
}

export function checkContextBriefAnchors(): AnchorWarning[] {
  const rules = readJson<LifecycleRules>(LIFECYCLE_RULES_PATH, {});
  const cutoff = rules.legacyCutoff ?? '2026-04-21';
  const topicIndex = readJson<{ topics: TopicIndexEntry[] }>(TOPIC_INDEX_PATH, { topics: [] });

  const warnings: AnchorWarning[] = [];

  for (const topic of topicIndex.topics) {
    if (topic.status === 'closed' || topic.status === 'completed') continue;
    if (topic.hold != null) continue;
    if (isLegacy(topic, cutoff)) continue;

    const sessionCount = countSessionContributions(topic.id);
    if (sessionCount === 0) continue;

    const briefPath = path.join(TOPICS_DIR, topic.id, 'context_brief.md');
    if (!fs.existsSync(briefPath)) continue;

    const raw = fs.readFileSync(briefPath, 'utf-8');
    const anchorsSection = extractSection(raw, '## Key Anchors');

    if (!hasRealContent(anchorsSection)) {
      warnings.push({
        topicId: topic.id,
        title: topic.title,
        detail: `session_contributions ${sessionCount}개 있으나 Key Anchors 비어있음 — regenerate-context-brief 재실행 권고`,
      });
    }
  }

  return warnings;
}

export function formatAnchorWarnings(warnings: AnchorWarning[]): string {
  if (warnings.length === 0) return '';
  const lines = ['⚠️  [anchor lint] context_brief Key Anchors 점검:\n'];
  for (const w of warnings) {
    lines.push(`  • ${w.topicId} — ${w.title.slice(0, 40)}`);
    lines.push(`    ${w.detail}`);
  }
  lines.push('');
  return lines.join('\n');
}

if (require.main === module) {
  const warnings = checkContextBriefAnchors();
  const out = formatAnchorWarnings(warnings);
  if (out) console.warn(out);
  else console.log('[anchor lint] context_brief 앵커 이상 없음.');
}
