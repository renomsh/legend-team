#!/usr/bin/env ts-node
/**
 * test-p3-turn-push-mode.ts
 * D-169 P3 단위 테스트 — post-tool-use-task.js nexus/hook 분기 검증
 * session_209, topic_176
 *
 * 테스트 케이스:
 *   T1. hook 모드: turns[] 직접 push + selfScores 추출
 *   T2. hook 모드: selfScores 없는 경우 turns[] push
 *   T3. nexus 모드: pending_turns.jsonl append + __hook_origin sentinel 박제
 *   T4. nexus 모드: turns[] 미변경 확인 (③ skip)
 *   T5. nexus 모드: agentId 필드 보존
 *   T6. nexus 모드 N=5 동시 append — 손실·오염 0건
 *   T7. turnPushMode 필드 없음(legacy) → hook 동작
 */
export {};
//# sourceMappingURL=test-p3-turn-push-mode.d.ts.map