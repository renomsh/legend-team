#!/usr/bin/env ts-node
/**
 * SPIKE P1 — 옵션 A·B 동시 검증
 * topic_176, Arki rev4 §3, session_209
 *
 * 옵션 A: hook → pending_turns_{sessionId}.jsonl append → Nexus agentId join
 *   - N=10 concurrent hook spawn
 *   - agentId 매칭률 (hook input.tool_response.agentId vs join key)
 *   - GATE α A 기준: 10/10 (100%)
 *
 * 옵션 B: Nexus message stream에서 self-scores 직접 파싱
 *   - N=10 realistic payload (100~300 bytes)
 *   - truncation 발생률 측정 (extractSelfScores 파싱 실패 = truncation 간주)
 *   - GATE α B 기준: 0/10 (0% truncation)
 *
 * 사용:
 *   npx ts-node scripts/spike-p1-option-ab-compare.ts
 *
 * 산출: reports/2026-05-07_topic_176_arki/spike_p1_option_ab_compare.json
 *
 * D2 Prime: stdlib만 사용. 외부 라이브러리 의존 없음.
 */
export {};
//# sourceMappingURL=spike-p1-option-ab-compare.d.ts.map