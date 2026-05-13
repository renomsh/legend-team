/**
 * m-pd-write.ts — PD-079 / D-181 Phase 3
 *
 * mPD (m_pending_deferrals item) 추가. schema 위반 시 quarantine.
 *
 * D4 박제: 공식 pending_deferrals.json read/write 금지를 함수 구조 자체에서 차단.
 *   - 본 모듈은 `mNamespacePaths(wid)`만 사용 → m_pending_deferrals_{wid}.json 단일 경로.
 *
 * exports: appendMPendingDeferral(wid, entryDraft)
 */

import * as fs from 'fs';
import * as path from 'path';
import { mNamespacePaths } from './m-namespace-paths';
import { nextMPendingDeferralId } from './m-id-generator';
import { atomicWriteJSON } from './atomic-write';
import {
  validateMPendingDeferralEntry,
  SCHEMA_M_PENDING_DEFERRALS,
} from './m-schema-validator';
import type { MPendingDeferrals, MPendingDeferralEntry } from './m-types';

export interface AppendPDResult {
  mpdId: string;
  quarantined: boolean;
  errors?: string[];
}

export interface MPendingDeferralDraft {
  fromSession: string;
  fromMTopic: string;
  createdAt: string;
  item: string;
  status: 'pending' | 'resolved' | string;
  title?: string;
  resolveCondition?: string;
  dependsOn?: string[];
  relatedDecisions?: string[];
  [k: string]: unknown;
}

function readPDFile(absPath: string, wid: string): MPendingDeferrals {
  if (!fs.existsSync(absPath)) {
    return {
      schema: SCHEMA_M_PENDING_DEFERRALS,
      worktreeId: wid,
      createdAt: new Date().toISOString(),
      items: [],
    };
  }
  const raw = fs.readFileSync(absPath, 'utf8').trim();
  if (!raw) {
    return {
      schema: SCHEMA_M_PENDING_DEFERRALS,
      worktreeId: wid,
      createdAt: new Date().toISOString(),
      items: [],
    };
  }
  const parsed = JSON.parse(raw) as MPendingDeferrals;
  if (!parsed.schema) parsed.schema = SCHEMA_M_PENDING_DEFERRALS;
  if (!parsed.worktreeId) parsed.worktreeId = wid;
  if (!parsed.createdAt) parsed.createdAt = new Date().toISOString();
  if (!Array.isArray(parsed.items)) parsed.items = [];
  return parsed;
}

function writeQuarantine(
  quarantineDir: string,
  mpdId: string,
  payload: unknown,
  errors: string[]
): void {
  fs.mkdirSync(quarantineDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `${ts}_mPD_${mpdId}`;
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

export function appendMPendingDeferral(
  wid: string,
  entryDraft: MPendingDeferralDraft
): AppendPDResult {
  if (!wid || typeof wid !== 'string') {
    throw new Error('appendMPendingDeferral: wid required');
  }
  const paths = mNamespacePaths(wid);
  const mpdId = nextMPendingDeferralId(wid);

  const entry = {
    ...entryDraft,
    mpdId,
    worktreeId: wid,
    id: mpdId, // PendingDeferralEntry.id 필수 호환
  } as unknown as MPendingDeferralEntry;

  const result = validateMPendingDeferralEntry(entry);
  if (!result.valid) {
    writeQuarantine(paths.quarantineDir, mpdId, entry, result.errors);
    return { mpdId, quarantined: true, errors: result.errors };
  }

  const file = readPDFile(paths.pendingDeferrals, wid);
  file.items.push(entry);
  atomicWriteJSON(paths.pendingDeferrals, file);

  return { mpdId, quarantined: false };
}

if (require.main === module) {
  const wid = process.argv[2];
  if (!wid) {
    console.error('Usage: ts-node m-pd-write.ts <wid>');
    process.exit(1);
  }
  const r = appendMPendingDeferral(wid, {
    fromSession: 'session_244',
    fromMTopic: 'mtopic_001_Wdeadbeef',
    createdAt: new Date().toISOString(),
    item: 'cli smoke item',
    status: 'pending',
  });
  console.log(JSON.stringify(r, null, 2));
}
