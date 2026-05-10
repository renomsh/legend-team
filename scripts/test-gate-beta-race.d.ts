#!/usr/bin/env ts-node
/**
 * test-gate-beta-race.ts
 * D-169 GATE β — race 0 검증
 * session_209, topic_176
 *
 * 검증 항목:
 *   B1. N=10 병렬 appendFileSync (hook race 시뮬) → 10줄, 0 corruption
 *   B2. pushTurnsFromPending N=10 → turns[] 10건, turnIdx 순서 정합
 *   B3. 중복 turnIdx 없음
 *   B4. sort_key=dispatch_order 매핑 정합 (0~9 전부 존재)
 *   B5. selfScores 보존율 — agentId 매칭 시 pending entry 우선
 *   B6. 적대적: 일부 agentId=null → optionB fallback gap 박제
 *   B7. pending_turns archive 완료 후 파일 존재 확인
 */
export {};
//# sourceMappingURL=test-gate-beta-race.d.ts.map