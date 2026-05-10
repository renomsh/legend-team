#!/usr/bin/env ts-node
/**
 * SPIKE-R6 — PostToolUse(Task) hook race detection
 * topic_176, session_206, 2026-05-07
 *
 * 핵심 질문: Claude Code가 Task 툴을 병렬 호출할 때 PostToolUse hook의
 * read-modify-write가 자연 직렬화되는가, 또는 race가 발생하는가.
 *
 * 본 spike는 hook 자체를 직접 spawn (외부 프로세스로) 하여 동시성 면에서
 * Claude Code 본체가 병렬 spawn 한 케이스의 lower-bound를 시뮬레이트한다.
 * Claude Code가 자연 직렬화한다면 우리 spike에서도 race 미관측이 정상 (negative);
 * race가 우리 spike에서 관측되면 lock 무방비 시 위험 존재 → lock 필수.
 *
 * 사용:
 *   npx ts-node scripts/spike-r6-task-race.ts
 *
 * D2 Prime Directive: 외부 라이브러리 description 신뢰 금지. 본 spike는
 * stdlib(child_process, fs)만 사용하여 hook 동작을 직접 측정.
 */
declare function main(): Promise<void>;
export { main as runSpikeR6 };
//# sourceMappingURL=spike-r6-task-race.d.ts.map