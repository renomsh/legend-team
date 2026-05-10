/**
 * backfill-turn-log.ts
 * PD-020b P2b (session_061) — session_index의 turns[]로 topic turn_log.jsonl 소급 생성.
 *
 * 동작:
 *  1. session_index.json 전체 스캔
 *  2. legacy:true 또는 turns[] 없는 세션은 skip
 *  3. 각 세션의 topicId + turns[]로 turn_log.jsonl에 append
 *  4. 이미 해당 sessionId 엔트리가 turn_log에 있으면 skip (멱등)
 *
 * 보장:
 *  - turns[] 필드에 있는 데이터만 기록 (fabrication 없음)
 *  - ts 는 세션 startedAt 기준 + turnIdx * 1ms 로 단조증가 타임스탬프 생성
 *    (실제 발언 시각 불명 — 소급 backfill 임을 gist에 명시)
 *
 * Usage:
 *   npx ts-node scripts/backfill-turn-log.ts [--session=session_060] [--dry-run]
 */
export {};
//# sourceMappingURL=backfill-turn-log.d.ts.map