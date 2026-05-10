/**
 * check-context-brief-anchors.ts
 * A6-3: context_brief Key Anchors 섹션 lint (D-055).
 *
 * 규칙:
 *   - session_contributions 1개 이상 있는 토픽은 context_brief의
 *     "## Key Anchors" 섹션에 실제 내용이 있어야 함 (경고만, 차단 없음)
 *   - legacyCutoff 이전 생성 토픽은 면제
 *   - hold!=null 토픽 면제
 *
 * Usage:
 *   npx ts-node scripts/check-context-brief-anchors.ts
 *
 * Programmatic:
 *   import { checkContextBriefAnchors } from './check-context-brief-anchors';
 */
export interface AnchorWarning {
    topicId: string;
    title: string;
    detail: string;
}
export declare function checkContextBriefAnchors(): AnchorWarning[];
export declare function formatAnchorWarnings(warnings: AnchorWarning[]): string;
//# sourceMappingURL=check-context-brief-anchors.d.ts.map