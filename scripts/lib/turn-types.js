"use strict";
/**
 * turn-types.ts
 * D-048 (session_045) — agentsCompleted Turn[] 스키마 정의.
 * phase 값은 memory/shared/phase_catalog.json enum 참조.
 *
 * D-074 (session_093, topic_098): InvocationMode/subagentId 제거.
 * orchestrationMode: "manual"|"auto" 신설. (D-058 dispatcher 폐기 unwind)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_RECALL_REASONS = void 0;
exports.findTurnById = findTurnById;
exports.VALID_RECALL_REASONS = [
    'post-intervention', 'post-master', 'phase-transition', 'master-direct-nomination', 'manual',
];
/**
 * PD-064 P3 (session_194, topic_167, 2026-05-05) — turnIdx → Turn lookup helper.
 *
 * **불변성 명문화**: `turnIdx`는 session 내 globally unique 식별자이며 array position과 무관.
 * D-048 Turn Push C1 분리/병합 4조건에 따라 array index와 turnIdx 일치는 우발적이다.
 *
 * 따라서 `turns[turnIdx]` 직접 접근은 fragile — 본 헬퍼 사용 의무.
 * 첫 매치만 반환. duplicate turnIdx 감지 시 console.warn (호출측 결정 영향 없음).
 *
 * @returns 매칭 Turn, 없으면 null.
 */
function findTurnById(turns, turnIdx) {
    if (!Array.isArray(turns) || turns.length === 0)
        return null;
    let first = null;
    let dupCount = 0;
    for (const t of turns) {
        if (t && t.turnIdx === turnIdx) {
            if (first === null)
                first = t;
            else
                dupCount++;
        }
    }
    if (dupCount > 0) {
        // eslint-disable-next-line no-console
        console.warn(`findTurnById: duplicate turnIdx=${turnIdx} 감지 (${dupCount + 1}건). 첫 매치 반환.`);
    }
    return first;
}
//# sourceMappingURL=turn-types.js.map