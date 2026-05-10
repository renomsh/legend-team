#!/usr/bin/env ts-node
/**
 * backfill-agents.ts
 * topic_index.json의 reportFiles에서 역할명을 추출하여
 * session_index.json 엔트리에 agentsCompleted를 소급 주입.
 *
 * 파일명 규칙: {role}_rev{n}.md → role 추출
 * 데이터 품질: 'backfill' (참여 여부만, 발화 순서/재호출 정보 없음)
 *
 * 사용법: ts-node scripts/backfill-agents.ts [--dry-run]
 */
export {};
//# sourceMappingURL=backfill-agents.d.ts.map