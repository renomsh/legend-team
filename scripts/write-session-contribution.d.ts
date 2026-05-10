/**
 * write-session-contribution.ts
 * PD-020b P3 (session_061) — L2 session_contributions writer.
 *
 * 역할: topics/{topicId}/session_contributions/{sessionId}.md 생성.
 * - L1 turn_log.jsonl (해당 sessionId 범위)에서 rolesInOrder, turnsCount 파생
 * - session_index / current_session에서 메타(startedAt, closedAt, grade, decisions) 조회
 * - 필수 5섹션 Markdown 생성 + frontmatter YAML
 * - validateSessionContributionFM + validateL2Body 통과 후 파일 기록
 *
 * Usage (CLI):
 *   npx ts-node scripts/write-session-contribution.ts <topicId> <sessionId> [--next-action="..."]
 *
 * Usage (programmatic):
 *   import { writeSessionContribution } from './write-session-contribution';
 *   await writeSessionContribution('topic_063', 'session_060', { nextAction: '...' });
 */
export interface WriteSessionContributionOptions {
    /** Ace 종합검토 nextAction (없으면 placeholder) */
    nextAction?: string;
    /** 세션 오픈 노트에서 추출한 summary (없으면 자동 생성) */
    summary?: string;
    /** 추가 key findings (역할 발언 gist 외) */
    keyFindings?: string[];
    /** 추가 open issues */
    openIssues?: string[];
    /** 덮어쓰기 허용 여부 (기본: false — 이미 있으면 skip) */
    overwrite?: boolean;
}
export declare function sessionContributionPath(topicId: string, sessionId: string): string;
export declare function writeSessionContribution(topicId: string, sessionId: string, opts?: WriteSessionContributionOptions): void;
export declare function main(args?: string[]): Promise<void>;
//# sourceMappingURL=write-session-contribution.d.ts.map