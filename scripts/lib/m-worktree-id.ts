/**
 * m-worktree-id.ts — PD-079 / D-181 Phase 1
 *
 * 현재 worktree 식별자(wid) 추출. git rev-parse --show-toplevel의 마지막 디렉토리명을
 * canonical wid로 사용. Windows 경로 분리자 `\` 정규화.
 *
 * - getWorktreeId(): 현재 wid 반환 (e.g. "strange-stonebraker-89cb59")
 * - shortHash(wid, len=8): wid의 결정적 short hash (R-1 mtopic_id 접미사용)
 *
 * 부수효과 없음. process.cwd() 비의존 (toplevel 기준).
 */

import { execFileSync } from 'child_process';
import * as crypto from 'crypto';
import * as path from 'path';

/** 현재 worktree의 최상위 디렉토리명. Windows `\` → `/` 정규화 후 basename. */
export function getWorktreeId(): string {
  const raw = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  })
    .toString()
    .trim();
  // Windows: git이 forward slash 반환하지만 안전하게 normalize
  const normalized = raw.replace(/\\/g, '/');
  return path.posix.basename(normalized);
}

/** wid의 결정적 short hash. R-1 mtopic_id 접미사 W{hash} 용. 기본 8자. */
export function shortHash(wid: string, len = 8): string {
  return crypto.createHash('sha1').update(wid).digest('hex').slice(0, len);
}

// CLI: `npx ts-node scripts/lib/m-worktree-id.ts --print`
if (require.main === module) {
  const args = process.argv.slice(2);
  const wid = getWorktreeId();
  if (args.includes('--print')) {
    console.log(JSON.stringify({ wid, shortHash: shortHash(wid) }, null, 2));
  } else {
    console.log(wid);
  }
}
