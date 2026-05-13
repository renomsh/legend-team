/**
 * m-lock.ts — PD-079 / D-181 Phase 2
 *
 * mtopic 동시 오픈 차단. 모든 워크트리의 m_topic_index_*.json을 scan하여
 * 같은 mtopicId가 status='open'으로 존재하는지 확인.
 *
 * Riki R-1 적출 정합: R-1 worktree hash 접미사로 cross-worktree 충돌 거의 0.
 * 본 scan은 보조 경보 — 같은 worktree에서 같은 id 재오픈 거부에 주로 사용.
 * R-2 정합: scan 자체는 lock-free (단순 read). TOCTOU race는 hash 접미사가 1차 방어,
 * 본 함수는 well-formed 의도 보존 (이미 open인 토픽을 재 create 차단).
 *
 * - checkMtopicAvailable(mtopicId): {available, conflicts: [{wid, status}, ...]}
 *   거부 동작 자체는 호출측이 결정.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from './utils';
import type { MTopicIndex } from './m-types';

const SHARED_BASE = path.join(ROOT, 'memory', 'shared');
const M_TOPIC_INDEX_PATTERN = /^m_topic_index_(.+)\.json$/;

export interface MtopicConflict {
  wid: string;
  status: string;
}

export interface MtopicAvailability {
  available: boolean;
  conflicts: MtopicConflict[];
}

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

/**
 * mtopicId가 다른 워크트리 또는 본 워크트리에서 이미 status='open' 인지 확인.
 *
 * @param mtopicId 확인할 mtopic_NNN_W{hash} id
 * @returns available=true: 충돌 없음(생성/오픈 진행 가능). false: 충돌 존재.
 */
export function checkMtopicAvailable(mtopicId: string): MtopicAvailability {
  if (!mtopicId || typeof mtopicId !== 'string') {
    throw new Error(
      `checkMtopicAvailable: mtopicId must be non-empty string, got ${JSON.stringify(mtopicId)}`
    );
  }

  const conflicts: MtopicConflict[] = [];

  if (!fs.existsSync(SHARED_BASE)) {
    return { available: true, conflicts: [] };
  }

  const files = fs.readdirSync(SHARED_BASE);
  for (const filename of files) {
    const m = M_TOPIC_INDEX_PATTERN.exec(filename);
    if (!m) continue;
    const fileWid = m[1]!;
    const filePath = path.join(SHARED_BASE, filename);
    const idx = safeReadJson<MTopicIndex>(filePath);
    if (!idx?.topics) continue;
    for (const entry of idx.topics) {
      if (entry.mtopicId === mtopicId && entry.status === 'open') {
        conflicts.push({ wid: fileWid, status: entry.status });
      }
    }
  }

  return { available: conflicts.length === 0, conflicts };
}

if (require.main === module) {
  const targetId = process.argv[2];
  if (!targetId) {
    console.error('Usage: ts-node scripts/lib/m-lock.ts <mtopicId>');
    process.exit(1);
  }
  const result = checkMtopicAvailable(targetId);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.available ? 0 : 1);
}
