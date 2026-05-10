#!/usr/bin/env ts-node
/**
 * append-session.ts
 * session_index.json에 새 세션을 안전하게 추가.
 * Edit 도구 직접 수정 금지 — 이 스크립트만 사용.
 *
 * 사용법:
 *   ts-node scripts/append-session.ts \
 *     --sessionId session_028 \
 *     --topicSlug legend-team-dashboard \
 *     --topicId topic_042 \
 *     --topic "legend-team Dash board" \
 *     --startedAt 2026-04-17T04:00:00.000Z \
 *     --closedAt 2026-04-17T06:00:00.000Z \
 *     [--grade A] \
 *     [--gradeDeclared A] \
 *     [--gradeActual C] \
 *     [--decisions "D-027,D-028"] \
 *     [--plannedSequence "ace,dev"] \
 *     [--turns '[{"role":"ace","turnIdx":0,"phase":"framing"}]'] \
 *     [--note "메모"]
 *
 * D-051/D-052: topicId(N:1 링크), grade/gradeDeclared/gradeActual/gradeMismatch,
 *              turns(Turn[]), plannedSequence 강제 기록.
 */
export {};
//# sourceMappingURL=append-session.d.ts.map