/**
 * append-pending-deferral.ts
 * A6-4: 실시간 PD append 스크립트 (D-055).
 *
 * 역할:
 *   - system_state.json.pendingDeferrals에 새 PD 항목 즉시 추가
 *   - current_session.json.pendingDeferralsAdded에 ID 기록 (Editor 역검사용)
 *   - PD ID 자동 채번 (현재 최고 번호 +1)
 *
 * Usage (CLI):
 *   npx ts-node scripts/append-pending-deferral.ts \
 *     --item "구현 설명" \
 *     --note "선택적 메모"
 *
 * Programmatic:
 *   import { appendPendingDeferral } from './append-pending-deferral';
 *   appendPendingDeferral({ item: '...', note: '...' });
 */
export interface AppendOptions {
    item: string;
    note?: string;
}
export declare function appendPendingDeferral(opts: AppendOptions): string;
//# sourceMappingURL=append-pending-deferral.d.ts.map