/**
 * topic-lifecycle.ts
 * D-056 (session_066) + D-057 (session_067) — 토픽 생명주기 스키마.
 *
 * 핵심 모델:
 * - topicType: framing / implementation / standalone / undefined(legacy)
 * - parentTopicId + childTopicIds: framing ↔ implementation 관계
 * - resolveCondition: PD 자동 전이 트리거 (자연어 string)
 *
 * 레거시 호환: topicType undefined 허용. 기존 68개 토픽 무변경.
 * 신규 토픽(session_067+)부터 정식 적용.
 */
export type TopicType = 'framing' | 'implementation' | 'standalone';
export interface TopicLifecycleFields {
    topicType?: TopicType;
    parentTopicId?: string | null;
    childTopicIds?: string[];
}
export interface PendingDeferralLifecycleFields {
    resolveCondition?: string | null;
}
/** topicType 존재 여부 기반 판정 */
export declare function isLifecycleAware(topic: TopicLifecycleFields): boolean;
/** framing 토픽 자동 종결 가능 여부: 모든 children completed */
export declare function canAutoClose(topic: TopicLifecycleFields & {
    status: string;
}, childStatuses: Record<string, string>): {
    eligible: boolean;
    reason: string;
};
/** 스키마 drift 검증: topicType 존재 시 parent/child 정합성 */
export interface LifecycleValidationIssue {
    topicId: string;
    issue: string;
    severity: 'error' | 'warn';
}
export declare function validateLifecycleSchema(topics: Array<{
    id: string;
} & TopicLifecycleFields>): LifecycleValidationIssue[];
/** resolveCondition 자연어 매칭 — 공백·대소문자 무시 substring */
export declare function matchesResolveCondition(condition: string, signal: string): boolean;
export interface GitEvidenceEntry {
    commit: string;
    message: string;
    commitType: 'session-end' | 'implementation';
    scannedAt: string;
}
/**
 * git log --oneline --all --since="6 months ago" 실행 후
 * PD-NNN 패턴 매칭 → Map<pdId, GitEvidenceEntry[]> 반환
 * 실패 시 빈 Map (git 부재 환경 방어)
 */
export declare function scanGitLog(root: string): Map<string, GitEvidenceEntry[]>;
//# sourceMappingURL=topic-lifecycle.d.ts.map