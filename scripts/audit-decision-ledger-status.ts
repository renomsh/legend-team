/**
 * audit-decision-ledger-status.ts
 * topic_196 / session_233 Phase 1 — Audit #1
 *
 * 본문에 supersede/폐기/deprecat 명시되었으나 status 필드 미갱신된 결정 식별.
 *
 * mismatch 분류:
 *   (a) self-undeclared: 자기 본문에 supersede 명시인데 self.status가 active
 *   (b) referent-undeclared: 본문에서 'D-X supersede/폐기' 명시인데 D-X.status가 active
 *
 * CLI:
 *   node scripts/audit-decision-ledger-status.ts
 *   npx ts-node scripts/audit-decision-ledger-status.ts
 *
 * Export:
 *   auditDecisionLedgerStatus(ledgerPath?)
 */

import * as fs from 'fs';
import * as path from 'path';
import { todayYMD, writeReport, mdTable } from './lib/audit-helpers';

interface LedgerEntry {
  id: string;
  date?: string;
  axis?: string;
  summary?: string;
  decision?: string;
  status?: string;
  [k: string]: unknown;
}

const KW_RE = /(supersede[ds]?|폐기|deprecat(ed|ion|es)?)/i;
const ID_RE = /\b(D-\d{2,4}(?:-[A-Za-z0-9-]+)?)\b/g;
const ACTIVE_STATUSES = new Set(['active', undefined, '', null as unknown as string]);

export interface MismatchItem {
  id: string;
  type: 'self-undeclared' | 'referent-undeclared';
  selfStatus: string;
  referent?: string;
  referentStatus?: string;
  textSnippet: string;
}

export interface AuditLedgerResult {
  mismatches: MismatchItem[];
  totalDecisions: number;
  selfUndeclared: number;
  referentUndeclared: number;
  summary: string;
}

function isActive(status?: string | null): boolean {
  if (status === null || status === undefined) return true;
  return ACTIVE_STATUSES.has(status as string);
}

function snippet(text: string, kw: RegExpMatchArray): string {
  const idx = kw.index ?? 0;
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + 60);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

export function auditDecisionLedgerStatus(
  ledgerPath?: string,
): AuditLedgerResult {
  const lp = ledgerPath || path.join(process.cwd(), 'memory/shared/decision_ledger.json');
  const raw = fs.readFileSync(lp, 'utf-8');
  const data = JSON.parse(raw) as { decisions: LedgerEntry[] };
  const decisions = data.decisions;
  const byId = new Map<string, LedgerEntry>();
  for (const d of decisions) byId.set(d.id, d);

  const mismatches: MismatchItem[] = [];

  for (const d of decisions) {
    const body = `${d.summary || ''}\n${d.decision || ''}\n${d.axis || ''}`;
    const kwMatch = body.match(KW_RE);
    if (!kwMatch) continue;

    const selfStatusRaw = (d.status as string | undefined) || 'active';

    // (a) self-undeclared
    if (isActive(d.status)) {
      mismatches.push({
        id: d.id,
        type: 'self-undeclared',
        selfStatus: selfStatusRaw,
        textSnippet: snippet(body, kwMatch),
      });
    }

    // (b) referent-undeclared — extract D-IDs near keyword
    const refIds = new Set<string>();
    let m: RegExpExecArray | null;
    const re = new RegExp(ID_RE.source, 'g');
    while ((m = re.exec(body)) !== null) {
      const id = m[1];
      if (id && id !== d.id) refIds.add(id);
    }
    for (const ref of refIds) {
      const refEntry = byId.get(ref);
      if (!refEntry) continue; // unknown ref, skip
      if (isActive(refEntry.status)) {
        mismatches.push({
          id: d.id,
          type: 'referent-undeclared',
          // B-5 fix: referent 행에서는 self의 status 표시 회피 (의미 혼선 방지)
          // 핵심 정보는 referentStatus — 본 행 주체는 referent
          selfStatus: '',
          referent: ref,
          referentStatus: (refEntry.status as string) || 'active',
          textSnippet: snippet(body, kwMatch),
        });
      }
    }
  }

  const selfCount = mismatches.filter((m) => m.type === 'self-undeclared').length;
  const refCount = mismatches.filter((m) => m.type === 'referent-undeclared').length;

  return {
    mismatches,
    totalDecisions: decisions.length,
    selfUndeclared: selfCount,
    referentUndeclared: refCount,
    summary: `total=${decisions.length}, self-undeclared=${selfCount}, referent-undeclared=${refCount}`,
  };
}

function renderReport(result: AuditLedgerResult): string {
  const headers = ['id', 'type', 'selfStatus', 'referent', 'refStatus', 'snippet'];
  const rows = result.mismatches.map((m) => [
    m.id,
    m.type,
    m.selfStatus,
    m.referent || '',
    m.referentStatus || '',
    m.textSnippet,
  ]);
  return [
    `# Decision Ledger Status Audit — ${todayYMD()}`,
    ``,
    `**Summary**: ${result.summary}`,
    ``,
    `## Mismatches (${result.mismatches.length})`,
    ``,
    rows.length ? mdTable(headers, rows) : '_(none)_',
    ``,
  ].join('\n');
}

if (require.main === module) {
  const result = auditDecisionLedgerStatus();
  const out = path.join(process.cwd(), 'reports', `${todayYMD()}_ledger-status-audit.md`);
  writeReport(out, renderReport(result));
  console.log(`[audit-decision-ledger-status] ${result.summary}`);
  console.log(`report: ${out}`);
}
