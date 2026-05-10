#!/usr/bin/env ts-node
/**
 * test-p5-crash-recovery.ts
 * D-169 P5 — session-end-finalize.js joinOrphanPendingTurns crash recovery 검증
 * session_209, topic_176
 *
 * 시나리오:
 *   C1. 정상: turnPushMode=hook → pending_turns 무시 (skip)
 *   C2. 정상: turnPushMode=nexus, pending_turns 없음 → skip
 *   C3. crash: turnPushMode=nexus, pending_turns 있음 → turns[] join + gap 박제 + archive
 *   C4. crash + D1 위변조: invalid origin entries → gap 박제 + valid만 join
 *   C5. crash: 기존 turns[] 있을 때 turnIdx 연속성 유지
 */
export {};
//# sourceMappingURL=test-p5-crash-recovery.d.ts.map