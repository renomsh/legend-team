/**
 * m-decision-write.ts — PD-079 / D-181 Phase 3
 *
 * mD (m_decision_ledger entry) 추가. schema 위반 시 quarantine.
 *
 * D4 박제: 공식 decision_ledger.json read/write 금지를 함수 구조 자체에서 차단.
 *   - 본 모듈은 `mNamespacePaths(wid)`만 사용 → m_decision_ledger_{wid}.json 단일 경로.
 *   - 공식 SOT 경로는 import도 하지 않음.
 *
 * exports: appendMDecision(wid, entryDraft)
 */

import * as fs from 'fs';
import * as path from 'path';
import { mNamespacePaths } from './m-namespace-paths';
import { nextMDecisionId } from './m-id-generator';
import { atomicWriteJSON } from './atomic-write';
import {
  validateMDecisionEntry,
  SCHEMA_M_DECISION_LEDGER,
} from './m-schema-validator';
import type { MDecisionLedger, MDecisionLedgerEntry } from './m-types';

export interface AppendResult {
  mId: string;
  quarantined: boolean;
  errors?: string[];
}

/**
 * entryDraft: mId 미포함. spec 필수 = date/mtopicId/axis/summary.
 * mD는 buffer라 공식 DecisionLedgerEntry의 광범위한 필수 필드(session/topic/decision/
 * authority/status/owningTopicId/scopeCheck)는 옵셔널 — validator가 spec 5필드만 강제.
 */
export interface MDecisionDraft {
  date: string;
  mtopicId: string;
  axis: string;
  summary: string;
  decision?: string;
  caveats?: string;
  relatedDecisions?: string[];
  [k: string]: unknown;
}

function readLedger(absPath: string, wid: string): MDecisionLedger {
  if (!fs.existsSync(absPath)) {
    return {
      schema: SCHEMA_M_DECISION_LEDGER,
      worktreeId: wid,
      decisions: [],
    };
  }
  const raw = fs.readFileSync(absPath, 'utf8').trim();
  if (!raw) {
    return {
      schema: SCHEMA_M_DECISION_LEDGER,
      worktreeId: wid,
      decisions: [],
    };
  }
  const parsed = JSON.parse(raw) as MDecisionLedger;
  if (!parsed.schema) parsed.schema = SCHEMA_M_DECISION_LEDGER;
  if (!parsed.worktreeId) parsed.worktreeId = wid;
  if (!Array.isArray(parsed.decisions)) parsed.decisions = [];
  return parsed;
}

function writeQuarantine(
  quarantineDir: string,
  mId: string,
  payload: unknown,
  errors: string[]
): void {
  fs.mkdirSync(quarantineDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `${ts}_mD_${mId}`;
  fs.writeFileSync(
    path.join(quarantineDir, `${base}.json`),
    JSON.stringify(payload, null, 2) + '\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(quarantineDir, `${base}_reason.txt`),
    errors.join('\n') + '\n',
    'utf8'
  );
}

export function appendMDecision(
  wid: string,
  entryDraft: MDecisionDraft
): AppendResult {
  if (!wid || typeof wid !== 'string') {
    throw new Error('appendMDecision: wid required');
  }
  const paths = mNamespacePaths(wid);
  const mId = nextMDecisionId(wid);

  const entry = {
    ...entryDraft,
    mId,
    worktreeId: wid,
  } as unknown as MDecisionLedgerEntry;

  const result = validateMDecisionEntry(entry);
  if (!result.valid) {
    writeQuarantine(paths.quarantineDir, mId, entry, result.errors);
    return { mId, quarantined: true, errors: result.errors };
  }

  const ledger = readLedger(paths.decisionLedger, wid);
  ledger.decisions.push(entry);
  ledger.lastUpdated = new Date().toISOString();
  atomicWriteJSON(paths.decisionLedger, ledger);

  return { mId, quarantined: false };
}

if (require.main === module) {
  const wid = process.argv[2];
  if (!wid) {
    console.error('Usage: ts-node m-decision-write.ts <wid> <axis> <summary> <mtopicId>');
    process.exit(1);
  }
  const r = appendMDecision(wid, {
    date: new Date().toISOString().slice(0, 10),
    mtopicId: process.argv[5] ?? 'mtopic_001_Wdeadbeef',
    axis: process.argv[3] ?? 'cli-test',
    summary: process.argv[4] ?? 'cli smoke',
  });
  console.log(JSON.stringify(r, null, 2));
}
