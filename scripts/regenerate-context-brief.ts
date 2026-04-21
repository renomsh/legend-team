/**
 * regenerate-context-brief.ts
 * PD-020b P4 (session_061) — L3 context_brief.md regenerator.
 *
 * 역할: topics/{topicId}/session_contributions/*.md 전체를 읽어
 *       topics/{topicId}/context_brief.md 를 재생성.
 *
 * 특성:
 *  - 멱등: 동일 입력 재실행 → 동일 출력 (타임스탬프 제외)
 *  - hold=true 토픽도 재생성 수행 (읽기 시 필터링은 /open 로더 담당, R2 해소)
 *  - L2 파일 없으면 empty state context_brief 생성 (R1 해소)
 *  - sizeBytes > L3_SIZE_LIMIT_BYTES 시 경고 (throws 하지 않음 — Editor 압축은 별도)
 *
 * Usage (CLI):
 *   npx ts-node scripts/regenerate-context-brief.ts <topicId>
 *
 * Usage (programmatic):
 *   import { regenerateContextBrief } from './regenerate-context-brief';
 *   regenerateContextBrief('topic_063');
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readJson, appendLog } from './lib/utils';
import {
  validateContextBriefFM,
  validateL3Body,
} from './lib/validate-context-layers';
import { L3_SIZE_LIMIT_BYTES } from '../src/types/context-layers';
import type {
  ContextBriefFrontmatter,
  SessionContributionFrontmatter,
} from '../src/types/context-layers';

const TOPICS_DIR     = path.join(ROOT, 'topics');
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory', 'shared', 'topic_index.json');

interface TopicEntry {
  id: string;
  title: string;
  phase?: string;
  hold?: null | object;
  grade?: string;
  gradeDeclared?: string;
  status?: string;
  [k: string]: unknown;
}
interface TopicIndex { topics: TopicEntry[] }

// ── frontmatter YAML parser (minimal, no dep) ────────────────────────────────
function parseFrontmatter(md: string): Record<string, unknown> {
  const match = md.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, unknown> = {};
  for (const line of (match[1] ?? '').split('\n')) {
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim();
    let val: unknown = line.slice(colon + 1).trim();

    // Parse arrays: [a, b, c]
    if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
    // Parse numbers
    else if (typeof val === 'string' && /^\d+$/.test(val)) {
      val = parseInt(val, 10);
    }
    result[key] = val;
  }
  return result;
}

function extractSection(md: string, heading: string): string {
  const idx = md.indexOf(heading);
  if (idx < 0) return '';
  const afterHeading = md.slice(idx + heading.length);
  // next ## boundary
  const next = afterHeading.search(/\n## /);
  return (next < 0 ? afterHeading : afterHeading.slice(0, next)).trim();
}

// ── L2 contribution reader ────────────────────────────────────────────────────
interface L2Summary {
  sessionId: string;
  fm: SessionContributionFrontmatter;
  summary: string;
  decisions: string;
  keyFindings: string;
  openIssues: string;
  nextAction: string;
}

function readAllContributions(topicId: string): L2Summary[] {
  const dir = path.join(TOPICS_DIR, topicId, 'session_contributions');
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .sort(); // lexicographic = session_XXX chronological order

  const results: L2Summary[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const rawFm = parseFrontmatter(content);
    const sessionId = (rawFm['sessionId'] as string | undefined) ?? file.replace('.md', '');

    results.push({
      sessionId,
      fm: rawFm as unknown as SessionContributionFrontmatter,
      summary:     extractSection(content, '## Summary'),
      decisions:   extractSection(content, '## Decisions'),
      keyFindings: extractSection(content, '## Key Findings'),
      openIssues:  extractSection(content, '## Open Issues'),
      nextAction:  extractSection(content, '## Next Action'),
    });
  }
  return results;
}

// ── L3 body builder ──────────────────────────────────────────────────────────
function buildL3Body(opts: {
  topicEntry: TopicEntry;
  contributions: L2Summary[];
  latestNextAction: string;
}): string {
  const { topicEntry, contributions, latestNextAction } = opts;
  const sections: string[] = [];

  // Current Phase
  const holdNote = topicEntry.hold
    ? `\n\n> **HOLD**: ${(topicEntry.hold as { reason?: string }).reason ?? '이유 미기재'}`
    : '';
  sections.push(
    `## Current Phase\n\n**${topicEntry.phase ?? 'framing'}**${holdNote}`
  );

  // Key Anchors — collect D-NNN refs from all decisions sections
  const dRefs = new Set<string>();
  for (const c of contributions) {
    const matches = c.decisions.matchAll(/\*\*(D-\d+)\*\*/g);
    for (const m of matches) { if (m[1]) dRefs.add(m[1]); }
  }
  if (dRefs.size > 0) {
    const anchorList = [...dRefs].sort().map(d => `- ${d}`).join('\n');
    sections.push(`## Key Anchors\n\n${anchorList}`);
  } else {
    sections.push('## Key Anchors\n\n_(없음)_');
  }

  // Decisions — concatenate all sessions' decisions sections (dedup)
  const allDecisions = contributions
    .flatMap(c => c.decisions.split('\n').filter(l => l.startsWith('- ')))
    .filter((line, i, arr) => arr.indexOf(line) === i); // dedup
  if (allDecisions.length > 0) {
    sections.push(`## Decisions\n\n${allDecisions.join('\n')}`);
  } else {
    sections.push('## Decisions\n\n_(없음)_');
  }

  // Open Issues — latest session's open issues only (stale issues not carried forward)
  const latestIssues: string = contributions.length > 0
    ? (contributions[contributions.length - 1]?.openIssues ?? '_(없음)_')
    : '_(없음)_';
  sections.push(`## Open Issues\n\n${latestIssues || '_(없음)_'}`);

  // Next Action
  sections.push(`## Next Action\n\n${latestNextAction || '_(미정)_'}`);

  return sections.join('\n\n');
}

function buildFrontmatter(fm: ContextBriefFrontmatter): string {
  const lines = ['---'];
  lines.push(`topicId: ${fm.topicId}`);
  lines.push(`topicTitle: "${fm.topicTitle.replace(/"/g, '\\"')}"`);
  lines.push(`phase: ${fm.phase}`);
  lines.push(`hold: ${fm.hold === null ? 'null' : JSON.stringify(fm.hold)}`);
  lines.push(`grade: ${fm.grade}`);
  lines.push(`sessionCount: ${fm.sessionCount}`);
  lines.push(`lastUpdated: ${fm.lastUpdated}`);
  lines.push(`sizeBytes: ${fm.sizeBytes}`);
  lines.push('---');
  return lines.join('\n');
}

export function contextBriefPath(topicId: string): string {
  return path.join(TOPICS_DIR, topicId, 'context_brief.md');
}

export function regenerateContextBrief(topicId: string): void {
  const topicIndex = readJson<TopicIndex>(TOPIC_INDEX_PATH, { topics: [] });
  const topicEntry = topicIndex.topics.find(t => t.id === topicId);
  if (!topicEntry) {
    throw new Error(`topic ${topicId} not found in topic_index`);
  }

  const contributions = readAllContributions(topicId);
  const latest = contributions[contributions.length - 1];
  const latestNextAction = latest?.nextAction ?? '_(미정)_';

  const body = buildL3Body({ topicEntry, contributions, latestNextAction });

  // resolve valid phase value
  const phaseRaw = topicEntry.phase ?? 'framing';
  const validPhases = ['framing', 'design', 'implementation', 'validated'];
  const phase = validPhases.includes(phaseRaw)
    ? (phaseRaw as ContextBriefFrontmatter['phase'])
    : 'framing';

  const grade = (topicEntry.grade ?? topicEntry.gradeDeclared ?? 'A') as 'S' | 'A' | 'B' | 'C';

  const now = new Date().toISOString();
  const tempSizeBytes = Buffer.byteLength(body, 'utf8');

  const fm: ContextBriefFrontmatter = {
    topicId,
    topicTitle: topicEntry.title,
    phase,
    hold: (topicEntry.hold ?? null) as ContextBriefFrontmatter['hold'],
    grade,
    sessionCount: contributions.length,
    lastUpdated: now,
    sizeBytes: tempSizeBytes,
  };

  validateContextBriefFM(fm);
  validateL3Body(body);

  const fullContent = buildFrontmatter(fm) + '\n\n' + body + '\n';
  const actualSizeBytes = Buffer.byteLength(fullContent, 'utf8');

  // Update sizeBytes with actual full content size
  fm.sizeBytes = actualSizeBytes;
  const finalContent = buildFrontmatter(fm) + '\n\n' + body + '\n';

  if (actualSizeBytes > L3_SIZE_LIMIT_BYTES) {
    console.warn(
      `WARN: context_brief for ${topicId} is ${actualSizeBytes}B > ${L3_SIZE_LIMIT_BYTES}B — Editor 요약 압축 권장`
    );
    appendLog('L3-regenerator', `size-warn ${topicId}: ${actualSizeBytes}B`);
  }

  const outPath = contextBriefPath(topicId);
  const topicDir = path.join(TOPICS_DIR, topicId);
  if (!fs.existsSync(topicDir)) fs.mkdirSync(topicDir, { recursive: true });

  fs.writeFileSync(outPath, finalContent, 'utf8');
  appendLog('L3-regenerator', `wrote ${outPath} | sessions=${contributions.length} size=${actualSizeBytes}B`);
  console.log(`OK: wrote ${outPath} (${actualSizeBytes}B, ${contributions.length} sessions)`);
}

// ── CLI entry point ───────────────────────────────────────────────────────────
if (require.main === module) {
  const [, , topicId] = process.argv;
  if (!topicId) {
    console.error('Usage: ts-node regenerate-context-brief.ts <topicId>');
    process.exit(1);
  }
  try {
    regenerateContextBrief(topicId);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
