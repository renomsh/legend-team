/**
 * write-turn-log.ts
 * PD-020b P2 (session_061) — L1 turn_log.jsonl append writer.
 *
 * 역할: topics/{topicId}/turn_log.jsonl 에 TurnLogEntry 한 줄 append.
 * - D-048 C1: turn 발언 직후 append — 세션 종료 대기 없음.
 * - validates entry via validateTurnLogEntry before writing.
 * - creates directories and file if they don't exist.
 *
 * Usage (CLI):
 *   npx ts-node scripts/write-turn-log.ts <topicId> <jsonString>
 *
 * Usage (programmatic):
 *   import { appendTurnLogEntry } from './write-turn-log';
 *   appendTurnLogEntry('topic_064', { ts, topicId, sessionId, turnIdx, role, phase });
 */
import type { TurnLogEntry } from '../src/types/context-layers';
export declare function turnLogPath(topicId: string): string;
/**
 * Append a single TurnLogEntry to topics/{topicId}/turn_log.jsonl.
 * Validates the entry before writing; throws ContextLayerError on invalid input.
 * Creates the topics/{topicId}/ directory if absent.
 */
export declare function appendTurnLogEntry(topicId: string, entry: Omit<TurnLogEntry, 'ts'> & {
    ts?: string;
}): void;
/**
 * Read all TurnLogEntry rows for a topic, optionally filtered by sessionId.
 * Returns entries in file order (chronological).
 */
export declare function readTurnLog(topicId: string, sessionId?: string): TurnLogEntry[];
//# sourceMappingURL=write-turn-log.d.ts.map