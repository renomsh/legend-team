"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const write_turn_log_1 = require("./write-turn-log");
const SESSION_INDEX_PATH = path.join(utils_1.ROOT, 'memory', 'sessions', 'session_index.json');
const TOPIC_INDEX_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'topic_index.json');
function resolveTopicId(session, topicIndex) {
    if (session.topicId)
        return session.topicId;
    if (!session.topicSlug)
        return null;
    // topicSlug may include a date prefix ("2026-04-21_pd-020b-...") — strip it
    const slug = session.topicSlug.replace(/^\d{4}-\d{2}-\d{2}_/, '');
    const match = topicIndex.topics.find(t => {
        // Match against reportPath suffix (reports/{date}_{slug})
        const reportPath = t['reportPath'] ?? '';
        const reportSlug = reportPath.replace(/^reports\/\d{4}-\d{2}-\d{2}_/, '');
        if (reportSlug === slug)
            return true;
        // Match against controlPath leaf (topics/{id}/{slug} pattern is uncommon, skip)
        // Match topic_slug field if present
        const tSlug = t['topicSlug'] ?? '';
        return tSlug === slug || tSlug === session.topicSlug;
    });
    return match?.id ?? null;
}
function monoTs(baseIso, offsetMs) {
    const base = new Date(baseIso).getTime();
    return new Date(base + offsetMs).toISOString();
}
function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const sessionFilter = args.find(a => a.startsWith('--session='))?.split('=')[1];
    const index = (0, utils_1.readJson)(SESSION_INDEX_PATH, { sessions: [] });
    const topicIndex = (0, utils_1.readJson)(TOPIC_INDEX_PATH, { topics: [] });
    let processed = 0, skipped = 0, errors = 0;
    for (const session of index.sessions) {
        if (sessionFilter && session.sessionId !== sessionFilter)
            continue;
        if (session.legacy) {
            skipped++;
            continue;
        }
        if (!session.turns || session.turns.length === 0) {
            skipped++;
            continue;
        }
        const topicId = session.topicId ?? resolveTopicId(session, topicIndex);
        if (!topicId) {
            console.warn(`SKIP ${session.sessionId}: topicId 불명`);
            skipped++;
            continue;
        }
        // 멱등 체크 — 이미 이 세션 엔트리가 있으면 skip
        const existing = (0, write_turn_log_1.readTurnLog)(topicId, session.sessionId);
        if (existing.length > 0) {
            console.log(`SKIP ${session.sessionId} (topic=${topicId}): 이미 ${existing.length}개 엔트리 존재`);
            skipped++;
            continue;
        }
        const baseTs = session.startedAt ?? '2026-01-01T00:00:00.000Z';
        console.log(`BACKFILL ${session.sessionId} → ${topicId} (${session.turns.length} turns)${dryRun ? ' [DRY]' : ''}`);
        for (const turn of session.turns) {
            const entry = {
                ts: monoTs(baseTs, turn.turnIdx),
                topicId,
                sessionId: session.sessionId,
                turnIdx: turn.turnIdx,
                role: turn.role,
                ...(turn.phase ? { phase: turn.phase } : {}),
                ...(turn.recallReason ? { recallReason: turn.recallReason } : {}),
                ...(turn.splitReason ? { splitReason: turn.splitReason } : {}),
                ...(turn.chars ? { chars: turn.chars } : {}),
                gist: `[backfill] ${session.sessionId}`,
            };
            if (!dryRun) {
                try {
                    (0, write_turn_log_1.appendTurnLogEntry)(topicId, entry);
                }
                catch (err) {
                    console.error(`  ERROR turn ${turn.turnIdx}: ${err.message}`);
                    errors++;
                    continue;
                }
            }
            else {
                console.log('  DRY:', JSON.stringify(entry));
            }
        }
        processed++;
    }
    const msg = `backfill done | processed=${processed} skipped=${skipped} errors=${errors}${dryRun ? ' (dry-run)' : ''}`;
    console.log(msg);
    if (!dryRun)
        (0, utils_1.appendLog)('backfill-turn-log', msg);
}
main();
//# sourceMappingURL=backfill-turn-log.js.map