/**
 * validate-context-layers.ts
 * PD-020b P1.2 — L1/L2/L3 throws-on-invalid 검증 함수.
 *
 * 호출자: session_061 L1/L2/L3 쓰기 구현부 + session_062 /open 로더.
 * 본 세션에선 타입과 규칙을 박아두기만 한다.
 */
import type { TurnLogEntry, SessionContributionFrontmatter, ContextBriefFrontmatter } from '../../src/types/context-layers';
export declare class ContextLayerError extends Error {
    readonly layer: 'L1' | 'L2' | 'L3';
    constructor(layer: 'L1' | 'L2' | 'L3', message: string);
}
export declare function validateTurnLogEntry(obj: unknown, ctx?: {
    expectedTopicId?: string;
}): TurnLogEntry;
export declare function validateSessionContributionFM(obj: unknown): SessionContributionFrontmatter;
/** L2 Markdown 본문에 필수 섹션이 모두 있는지 검증 */
export declare function validateL2Body(md: string): void;
export declare function validateContextBriefFM(obj: unknown): ContextBriefFrontmatter;
export declare function validateL3Body(md: string): void;
//# sourceMappingURL=validate-context-layers.d.ts.map