#!/usr/bin/env ts-node
/**
 * set-closed-in-session.ts
 * topic_index.json의 특정 엔트리에 closedInSession 필드를 기록한다.
 * session-end-finalize.js 훅에서 호출됨.
 *
 * 사용법:
 *   npx ts-node scripts/set-closed-in-session.ts --topicId topic_103 --sessionId session_098
 *
 * 성공: exit 0
 * 실패: exit 1 + stderr 출력 (조용한 실패 금지)
 */
export declare function main(args?: string[]): void;
//# sourceMappingURL=set-closed-in-session.d.ts.map