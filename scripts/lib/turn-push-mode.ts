/**
 * turn-push-mode.ts
 * D-169 / Arki rev4 §5.5 / session_209 P2
 *
 * turnPushMode SOT = current_session.json.turnPushMode
 * 모든 hook이 이 단일 함수로 mode를 read한다.
 *
 * enum:
 *   "hook"   — legacy. post-tool-use-task.js가 turns[] 직접 write (D-166·D-168 정합)
 *   "nexus"  — 병렬 모드. post-tool-use-task.js가 pending_turns_{sessionId}.jsonl append,
 *              Nexus가 직접 turns[] push (D-169 Case B frame)
 *
 * export:
 *   readTurnPushMode(sessionPath?: string): TurnPushMode
 *   TURN_PUSH_MODE_DEFAULT
 */

import * as fs from 'fs';
import * as path from 'path';

export type TurnPushMode = 'hook' | 'nexus';

export const TURN_PUSH_MODE_DEFAULT: TurnPushMode = 'hook';

const CWD = process.cwd();
const DEFAULT_SESSION_PATH = path.join(CWD, 'memory', 'sessions', 'current_session.json');

/**
 * current_session.json에서 turnPushMode를 읽는다.
 * 파일 없음·파싱 실패·필드 없음 모두 default("hook") 반환 — silent.
 *
 * @param sessionPath  current_session.json 경로. 미지정 시 cwd 기준 default.
 */
export function readTurnPushMode(sessionPath?: string): TurnPushMode {
  const p = sessionPath ?? DEFAULT_SESSION_PATH;
  try {
    const raw = fs.readFileSync(p, 'utf8').trim();
    if (!raw) return TURN_PUSH_MODE_DEFAULT;
    const sess = JSON.parse(raw) as { turnPushMode?: unknown };
    const mode = sess.turnPushMode;
    if (mode === 'hook' || mode === 'nexus') return mode;
    return TURN_PUSH_MODE_DEFAULT;
  } catch {
    return TURN_PUSH_MODE_DEFAULT;
  }
}

/**
 * pending_turns 파일 경로 규칙 (A10 자산 매트릭스, Arki rev4 §1).
 * SOT: dispatch_config.json.path_policy.pending_turns_pattern (P7 박제 예정)
 * 현재: memory/sessions/pending_turns_{sessionId}.jsonl
 */
export function pendingTurnsPath(sessionId: string, cwd?: string): string {
  const base = cwd ?? CWD;
  return path.join(base, 'memory', 'sessions', `pending_turns_${sessionId}.jsonl`);
}
