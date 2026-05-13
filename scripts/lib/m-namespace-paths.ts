/**
 * m-namespace-paths.ts — PD-079 / D-181 Phase 1
 *
 * m_* 네임스페이스 파일 경로 단일 출처. 다른 모듈은 이 파일에서만 경로 생성.
 * 하드코딩 금지 — 파일명 패턴 변경 시 본 모듈만 수정.
 *
 * base = memory/shared/
 *   - m_decision_ledger_{wid}.json
 *   - m_topic_index_{wid}.json
 *   - m_pending_deferrals_{wid}.json
 *   - m_quarantine/{wid}/   (격리 디렉토리)
 */

import * as path from 'path';
import { ROOT } from './utils';

export interface MNamespacePaths {
  decisionLedger: string;
  topicIndex: string;
  pendingDeferrals: string;
  quarantineDir: string;
}

const SHARED_BASE = path.join(ROOT, 'memory', 'shared');

export function mNamespacePaths(wid: string): MNamespacePaths {
  if (!wid || typeof wid !== 'string') {
    throw new Error(`mNamespacePaths: wid must be non-empty string, got ${JSON.stringify(wid)}`);
  }
  return {
    decisionLedger: path.join(SHARED_BASE, `m_decision_ledger_${wid}.json`),
    topicIndex: path.join(SHARED_BASE, `m_topic_index_${wid}.json`),
    pendingDeferrals: path.join(SHARED_BASE, `m_pending_deferrals_${wid}.json`),
    quarantineDir: path.join(SHARED_BASE, 'm_quarantine', wid),
  };
}

if (require.main === module) {
  const wid = process.argv[2] ?? 'test';
  console.log(JSON.stringify(mNamespacePaths(wid), null, 2));
}
