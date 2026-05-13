/**
 * m-id-generator.ts — PD-079 / D-181 Phase 1
 *
 * m_* 네임스페이스 ID 발급기. 각 파일의 최댓값 +1 → zero-pad 3자리.
 *   - nextMTopicId(wid)            → "mtopic_NNN_W{hash}" (R-1 worktree hash 접미사)
 *   - nextMDecisionId(wid)         → "mD-NNN"
 *   - nextMPendingDeferralId(wid)  → "mPD-NNN"
 *
 * 파일 미존재 시 NNN=001 부터 시작.
 */

import * as fs from 'fs';
import { mNamespacePaths } from './m-namespace-paths';
import { getWorktreeId, shortHash } from './m-worktree-id';
import type {
  MDecisionLedger,
  MTopicIndex,
  MPendingDeferrals,
} from './m-types';

function safeReadJson<T>(absPath: string): T | null {
  if (!fs.existsSync(absPath)) return null;
  const raw = fs.readFileSync(absPath, 'utf8').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 'mtopic_017_Wabcdef12' 또는 'mD-017' 같은 식별자 배열에서 NNN 부분만 추출. */
function maxNumeric(ids: string[], pattern: RegExp): number {
  let max = 0;
  for (const id of ids) {
    const m = pattern.exec(id);
    if (!m) continue;
    const n = parseInt(m[1]!, 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return max;
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

export function nextMTopicId(wid?: string): string {
  const w = wid ?? getWorktreeId();
  const paths = mNamespacePaths(w);
  const idx = safeReadJson<MTopicIndex>(paths.topicIndex);
  const ids = (idx?.topics ?? []).map((t) => t.mtopicId).filter(Boolean);
  const next = maxNumeric(ids, /^mtopic_(\d+)/i) + 1;
  return `mtopic_${pad3(next)}_W${shortHash(w)}`;
}

export function nextMDecisionId(wid?: string): string {
  const w = wid ?? getWorktreeId();
  const paths = mNamespacePaths(w);
  const ledger = safeReadJson<MDecisionLedger>(paths.decisionLedger);
  const ids = (ledger?.decisions ?? []).map((d) => d.mId).filter(Boolean);
  const next = maxNumeric(ids, /^mD-(\d+)/i) + 1;
  return `mD-${pad3(next)}`;
}

export function nextMPendingDeferralId(wid?: string): string {
  const w = wid ?? getWorktreeId();
  const paths = mNamespacePaths(w);
  const pd = safeReadJson<MPendingDeferrals>(paths.pendingDeferrals);
  const ids = (pd?.items ?? []).map((p) => p.mpdId).filter(Boolean);
  const next = maxNumeric(ids, /^mPD-(\d+)/i) + 1;
  return `mPD-${pad3(next)}`;
}

if (require.main === module) {
  const w = getWorktreeId();
  console.log(
    JSON.stringify(
      {
        wid: w,
        nextMTopicId: nextMTopicId(w),
        nextMDecisionId: nextMDecisionId(w),
        nextMPendingDeferralId: nextMPendingDeferralId(w),
      },
      null,
      2
    )
  );
}
