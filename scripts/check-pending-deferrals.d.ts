/**
 * check-pending-deferrals.ts
 * A6-4 Editor 역검사 (D-055): 세션 중 생성된 PD가 system_state에 실제 반영됐는지 확인.
 *
 * 검사 항목:
 *   1. current_session.pendingDeferralsAdded의 ID가 system_state에 존재하는지
 *   2. session.notes에 "이연" / "다음 세션" / "PD-" 키워드 있으나 pendingDeferralsAdded 비어있으면 경고
 *
 * 규칙:
 *   - 경고만 (차단 없음)
 *   - session-end-finalize.js에서 자동 호출 (Editor 역검사)
 *
 * Usage:
 *   npx ts-node scripts/check-pending-deferrals.ts
 *
 * Programmatic:
 *   import { checkPendingDeferrals } from './check-pending-deferrals';
 */
export interface DeferralCheckResult {
    missing: string[];
    suspectedMiss: boolean;
    suspectedNotes: string[];
}
export declare function checkPendingDeferrals(): DeferralCheckResult;
export declare function formatDeferralCheckResult(r: DeferralCheckResult): string;
export declare function main(_args?: string[]): Promise<void>;
//# sourceMappingURL=check-pending-deferrals.d.ts.map