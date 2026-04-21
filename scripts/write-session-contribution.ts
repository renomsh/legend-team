/**
 * write-session-contribution.ts
 * PD-020b P3 (session_061) — L2 session_contributions writer.
 *
 * 역할: topics/{topicId}/session_contributions/{sessionId}.md 생성.
 * - L1 turn_log.jsonl (해당 sessionId 범위)에서 rolesInOrder, turnsCount 파생
 * - session_index / current_session에서 메타(startedAt, closedAt, grade, decisions) 조회
 * - 필수 5섹션 Markdown 생성 + frontmatter YAML
 * - validateSessionContributionFM + validateL2Body 통과 후 파일 기록
 *
 * Usage (CLI):
 *   npx ts-node scripts/write-session-contribution.ts <topicId> <sessionId> [--next-action="..."]
 *
 * Usage (programmatic):
 *   import { writeSessionContribution } from './write-session-contribution';
 *   await writeSessionContribution('topic_063', 'session_060', { nextAction: '...' });
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readJson, appendLog } from './lib/utils';
import { readTurnLog } from './write-turn-log';
import {
  validateSessionContributionFM,
  validateL2Body,
} from './lib/validate-context-layers';
import type { SessionContributionFrontmatter } from '../src/types/context-layers';

const TOPICS_DIR        = path.join(ROOT, 'topics');
const SESSION_INDEX_PATH = path.join(ROOT, 'memory', 'sessions', 'session_index.json');
const CURRENT_SESSION_PATH = path.join(ROOT, 'memory', 'sessions', 'current_session.json');
const DECISION_LEDGER_PATH = path.join(ROOT, 'memory', 'shared', 'decision_ledger.json');

interface SessionIndexEntry {
  sessionId: string;
  topicId?: string;
  topicSlug?: string;
  startedAt?: string;
  closedAt?: string;
  grade?: string;
  gradeDeclared?: string;
  gradeActual?: string;
  turns?: Array<{ role: string; turnIdx: number; [k: string]: unknown }>;
  decisions?: Array<{ id: string; [k: string]: unknown }>;
  notes?: string[];
  [k: string]: unknown;
}

interface SessionIndex { sessions: SessionIndexEntry[] }

interface DecisionEntry {
  id: string;
  owningTopicId?: string;
  summary?: string;
  [k: string]: unknown;
}
interface DecisionLedger { decisions: DecisionEntry[] }

export interface WriteSessionContributionOptions {
  /** Ace 종합검토 nextAction (없으면 placeholder) */
  nextAction?: string;
  /** 세션 오픈 노트에서 추출한 summary (없으면 자동 생성) */
  summary?: string;
  /** 추가 key findings (역할 발언 gist 외) */
  keyFindings?: string[];
  /** 추가 open issues */
  openIssues?: string[];
  /** 덮어쓰기 허용 여부 (기본: false — 이미 있으면 skip) */
  overwrite?: boolean;
}

export function sessionContributionPath(topicId: string, sessionId: string): string {
  return path.join(TOPICS_DIR, topicId, 'session_contributions', `${sessionId}.md`);
}

function resolveSession(sessionId: string): SessionIndexEntry | null {
  // current_session 먼저 확인 (open session 포함)
  const current = readJson<Partial<SessionIndexEntry>>(CURRENT_SESSION_PATH, {});
  if (current.sessionId === sessionId) return current as SessionIndexEntry;

  const index = readJson<SessionIndex>(SESSION_INDEX_PATH, { sessions: [] });
  return index.sessions.find(s => s.sessionId === sessionId) ?? null;
}

function buildFrontmatter(
  fm: SessionContributionFrontmatter,
): string {
  const lines: string[] = ['---'];
  lines.push(`sessionId: ${fm.sessionId}`);
  lines.push(`topicId: ${fm.topicId}`);
  lines.push(`startedAt: ${fm.startedAt}`);
  lines.push(`closedAt: ${fm.closedAt}`);
  lines.push(`grade: ${fm.grade}`);
  if (fm.gradeActual != null) lines.push(`gradeActual: ${fm.gradeActual}`);
  lines.push(`rolesInOrder: [${fm.rolesInOrder.map(r => `"${r}"`).join(', ')}]`);
  lines.push(`turnsCount: ${fm.turnsCount}`);
  lines.push(`decisionIds: [${fm.decisionIds.map(d => `"${d}"`).join(', ')}]`);
  // nextAction: wrap in quotes if it contains special chars
  lines.push(`nextAction: "${fm.nextAction.replace(/"/g, '\\"')}"`);
  if (fm.l1WriteFailures != null) lines.push(`l1WriteFailures: ${fm.l1WriteFailures}`);
  lines.push('---');
  return lines.join('\n');
}

function buildL2Body(opts: {
  sessionId: string;
  topicId: string;
  summary: string;
  decisions: DecisionEntry[];
  keyFindings: string[];
  openIssues: string[];
  nextAction: string;
}): string {
  const sections: string[] = [];

  sections.push(`## Summary\n\n${opts.summary}`);

  if (opts.decisions.length > 0) {
    const decLines = opts.decisions.map(
      d => `- **${d.id}**: ${d['summary'] ?? d['axis'] ?? '(no summary)'}`
    );
    sections.push(`## Decisions\n\n${decLines.join('\n')}`);
  } else {
    sections.push('## Decisions\n\n_(없음)_');
  }

  if (opts.keyFindings.length > 0) {
    sections.push(`## Key Findings\n\n${opts.keyFindings.map(f => `- ${f}`).join('\n')}`);
  } else {
    sections.push('## Key Findings\n\n_(없음)_');
  }

  if (opts.openIssues.length > 0) {
    sections.push(`## Open Issues\n\n${opts.openIssues.map(i => `- ${i}`).join('\n')}`);
  } else {
    sections.push('## Open Issues\n\n_(없음)_');
  }

  sections.push(`## Next Action\n\n${opts.nextAction}`);

  return sections.join('\n\n');
}

export function writeSessionContribution(
  topicId: string,
  sessionId: string,
  opts: WriteSessionContributionOptions = {},
): void {
  const outPath = sessionContributionPath(topicId, sessionId);

  if (fs.existsSync(outPath) && !opts.overwrite) {
    appendLog('L2-writer', `skip (already exists): ${outPath}`);
    console.log(`SKIP: ${outPath} already exists (pass overwrite:true to force)`);
    return;
  }

  const session = resolveSession(sessionId);
  if (!session) {
    throw new Error(`session ${sessionId} not found in session_index or current_session`);
  }

  // ── L1 turns 읽기 ────────────────────────────────────────────
  const turns = readTurnLog(topicId, sessionId);
  const rolesInOrder = turns.map(t => t.role);
  const turnsCount = turns.length;

  // ── 결정 목록 ────────────────────────────────────────────────
  const ledger = readJson<DecisionLedger>(DECISION_LEDGER_PATH, { decisions: [] });
  const sessionDecisionIds: string[] = (session.decisions ?? []).map(
    (d: { id: string }) => d.id
  );
  const sessionDecisions = ledger.decisions.filter(d => sessionDecisionIds.includes(d.id));

  // ── grade 확정 ────────────────────────────────────────────────
  const grade = (session.grade ?? session.gradeDeclared ?? 'A') as 'S' | 'A' | 'B' | 'C';
  const gradeActual = (session.gradeActual ?? null) as 'S' | 'A' | 'B' | 'C' | null;

  // ── summary ──────────────────────────────────────────────────
  const summary = opts.summary
    ?? (session.notes?.[0] ?? `${sessionId} 세션 기여 요약`);

  // ── key findings: notes[1..] + gist 필드 기반 ────────────────
  const gistFindings = turns
    .filter(t => t.gist && !t.gist.startsWith('[backfill]'))
    .map(t => `[${t.role}] ${t.gist}`);
  const notesFindings = (session.notes ?? []).slice(1);
  const keyFindings = [...(opts.keyFindings ?? []), ...notesFindings, ...gistFindings];

  // ── open issues: session.gaps ────────────────────────────────
  const gapArr: string[] = Array.isArray(session.gaps) ? (session.gaps as string[]) : [];
  const openIssues = [...(opts.openIssues ?? []), ...gapArr];

  const nextAction = opts.nextAction ?? '다음 세션 주제 미확정';

  // ── frontmatter 객체 구성 ─────────────────────────────────────
  const fm: SessionContributionFrontmatter = {
    sessionId,
    topicId,
    startedAt: session.startedAt ?? '',
    closedAt: session.closedAt ?? '',
    grade,
    ...(gradeActual !== null ? { gradeActual } : {}),
    rolesInOrder,
    turnsCount,
    decisionIds: sessionDecisionIds,
    nextAction,
  };

  // ── validate frontmatter ──────────────────────────────────────
  validateSessionContributionFM(fm);

  // ── body 구성 + validate ──────────────────────────────────────
  const body = buildL2Body({
    sessionId, topicId, summary,
    decisions: sessionDecisions,
    keyFindings, openIssues, nextAction,
  });
  validateL2Body(body);

  // ── write ─────────────────────────────────────────────────────
  const fullContent = buildFrontmatter(fm) + '\n\n' + body + '\n';

  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outPath, fullContent, 'utf8');
  appendLog('L2-writer', `wrote ${outPath} | turns=${turnsCount} decisions=${sessionDecisionIds.length}`);
  console.log(`OK: wrote ${outPath}`);
}

// ── CLI entry point ──────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const [topicId, sessionId, ...rest] = args;

  if (!topicId || !sessionId) {
    console.error('Usage: ts-node write-session-contribution.ts <topicId> <sessionId> [--next-action="..."] [--overwrite]');
    process.exit(1);
  }

  const nextActionArg = rest.find(a => a.startsWith('--next-action='))?.split('=').slice(1).join('=') ?? undefined;
  const overwrite = rest.includes('--overwrite');

  try {
    writeSessionContribution(topicId, sessionId, {
      ...(nextActionArg !== undefined ? { nextAction: nextActionArg } : {}),
      overwrite,
    });
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}
