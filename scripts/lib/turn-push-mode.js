/**
 * turn-push-mode.js — CJS build of turn-push-mode.ts
 * D-169 / Arki rev4 §5.5 / session_209 P2
 * post-tool-use-task.js hook 등 CJS 환경에서 require 가능.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TURN_PUSH_MODE_DEFAULT = 'hook';

/**
 * current_session.json에서 turnPushMode를 읽는다.
 * 파일 없음·파싱 실패·필드 없음 모두 default("hook") 반환 — silent.
 *
 * @param {string} [sessionPath]  current_session.json 경로. 미지정 시 process.cwd() 기준 default.
 * @returns {'hook'|'nexus'}
 */
function readTurnPushMode(sessionPath) {
  const p = sessionPath || path.join(process.cwd(), 'memory', 'sessions', 'current_session.json');
  try {
    const raw = fs.readFileSync(p, 'utf8').trim();
    if (!raw) return TURN_PUSH_MODE_DEFAULT;
    const sess = JSON.parse(raw);
    const mode = sess.turnPushMode;
    if (mode === 'hook' || mode === 'nexus') return mode;
    return TURN_PUSH_MODE_DEFAULT;
  } catch {
    return TURN_PUSH_MODE_DEFAULT;
  }
}

/**
 * pending_turns 파일 경로 규칙 (A10 자산 매트릭스, Arki rev4 §1).
 * memory/sessions/pending_turns_{sessionId}.jsonl
 *
 * @param {string} sessionId
 * @param {string} [cwd]
 * @returns {string}
 */
function pendingTurnsPath(sessionId, cwd) {
  const base = cwd || process.cwd();
  return path.join(base, 'memory', 'sessions', `pending_turns_${sessionId}.jsonl`);
}

module.exports = { readTurnPushMode, pendingTurnsPath, TURN_PUSH_MODE_DEFAULT };
