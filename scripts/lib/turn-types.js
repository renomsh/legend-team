/**
 * turn-types.js (CommonJS sidecar)
 * PD-064 P3 (session_194, topic_167) — turn-types.ts의 런타임 등가물.
 *
 * SOT는 turn-types.ts. 본 파일은 .claude/hooks/*.js (CommonJS) require 용도.
 *
 * findTurnById: turnIdx → Turn lookup. turnIdx는 session 내 globally unique 식별자이며
 * array position과 무관 (D-048 Turn Push C1 분리/병합 정합).
 */

function findTurnById(turns, turnIdx) {
  if (!Array.isArray(turns) || turns.length === 0) return null;
  let first = null;
  let dupCount = 0;
  for (const t of turns) {
    if (t && t.turnIdx === turnIdx) {
      if (first === null) first = t;
      else dupCount++;
    }
  }
  if (dupCount > 0) {
    console.warn(`findTurnById: duplicate turnIdx=${turnIdx} 감지 (${dupCount + 1}건). 첫 매치 반환.`);
  }
  return first;
}

module.exports = { findTurnById };
