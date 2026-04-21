/**
 * append-pending-deferral.ts
 * A6-4: 실시간 PD append 스크립트 (D-055).
 *
 * 역할:
 *   - system_state.json.pendingDeferrals에 새 PD 항목 즉시 추가
 *   - current_session.json.pendingDeferralsAdded에 ID 기록 (Editor 역검사용)
 *   - PD ID 자동 채번 (현재 최고 번호 +1)
 *
 * Usage (CLI):
 *   npx ts-node scripts/append-pending-deferral.ts \
 *     --item "구현 설명" \
 *     --note "선택적 메모"
 *
 * Programmatic:
 *   import { appendPendingDeferral } from './append-pending-deferral';
 *   appendPendingDeferral({ item: '...', note: '...' });
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readJson } from './lib/utils';

const SYSTEM_STATE_PATH      = path.join(ROOT, 'memory', 'shared', 'system_state.json');
const CURRENT_SESSION_PATH   = path.join(ROOT, 'memory', 'sessions', 'current_session.json');

interface PendingDeferral {
  id: string;
  fromSession: string;
  fromTopic: string;
  item: string;
  status: 'pending' | 'resolved';
  note?: string;
  resolvedInSession?: string;
}

interface SystemState {
  pendingDeferrals?: PendingDeferral[];
  lastUpdated?: string;
  [k: string]: unknown;
}

interface CurrentSession {
  sessionId?: string;
  topicSlug?: string;
  pendingDeferralsAdded?: string[];
  [k: string]: unknown;
}

function nextPdId(existing: PendingDeferral[]): string {
  const nums = existing
    .map(p => parseInt(p.id.replace('PD-', ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `PD-${String(max + 1).padStart(3, '0')}`;
}

export interface AppendOptions {
  item: string;
  note?: string;
}

export function appendPendingDeferral(opts: AppendOptions): string {
  const state = readJson<SystemState>(SYSTEM_STATE_PATH, {});
  if (!Array.isArray(state.pendingDeferrals)) state.pendingDeferrals = [];

  const sess = readJson<CurrentSession>(CURRENT_SESSION_PATH, {});

  const id = nextPdId(state.pendingDeferrals);
  const entry: PendingDeferral = {
    id,
    fromSession: sess.sessionId ?? 'unknown',
    fromTopic: sess.topicSlug ?? 'unknown',
    item: opts.item,
    status: 'pending',
    ...(opts.note ? { note: opts.note } : {}),
  };

  state.pendingDeferrals.push(entry);
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(SYSTEM_STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');

  // current_session에 추적 기록
  if (!Array.isArray(sess.pendingDeferralsAdded)) sess.pendingDeferralsAdded = [];
  sess.pendingDeferralsAdded.push(id);
  fs.writeFileSync(CURRENT_SESSION_PATH, JSON.stringify(sess, null, 2), 'utf-8');

  return id;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = args.findIndex(a => a.startsWith(`--${flag}=`));
    if (idx >= 0) return (args[idx] as string).slice(flag.length + 3);
    const i2 = args.indexOf(`--${flag}`);
    if (i2 >= 0 && args[i2 + 1] !== undefined) return args[i2 + 1] as string;
    return '';
  };

  const item = get('item');
  if (!item) {
    console.error('Usage: append-pending-deferral.ts --item "설명" [--note "메모"]');
    process.exit(1);
  }

  const noteVal = get('note');
  const note: string | undefined = noteVal || undefined;
  const id = appendPendingDeferral({ item, ...(note ? { note } : {}) });
  console.log(`PD 등록 완료: ${id} — "${item}"`);
}
