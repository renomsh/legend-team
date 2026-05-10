#!/usr/bin/env ts-node
/**
 * compute-dashboard.ts
 * 대시보드 지표 계산기 → memory/shared/dashboard_data.json 출력
 *
 * Size 공식 (D-027):
 *   Size = (decisionAxes × 2) + rolesCalled + (rolesRecalled × 2) + (sessionsSpanned × 3)
 *   masterTurns 제거 — 자율성 지표는 버블 색상으로만 표현
 *
 * 사용법:
 *   ts-node scripts/compute-dashboard.ts
 */
import { Turn } from './lib/turn-types';
interface DecisionEntry {
    id: string;
    date: string;
    session: string;
    topic: string;
    axis: string;
    caveats?: string[];
    caveatsMeta?: {
        acked: boolean;
        ackedBySession: string | null;
        ackedAt: string | null;
        resolvedAt: string | null;
        resolvedBySession: string | null;
    };
}
export interface AckedButUnresolvedItem {
    decisionId: string;
    caveat: string;
    ackedBySession: string | null;
    ackedAt: string | null;
    ageInSessions: number;
}
/**
 * 단일 출처 SOT: decision_ledger.json 의 caveatsMeta.
 * acked=true && resolvedAt=null && (currentSession - ackedBySession) >= ttl 인 caveat을 항목별로 평탄화.
 *
 * @param decisions decision_ledger.decisions
 * @param currentSessionNum 현재 세션 정수 (예: session_168 → 168)
 * @param ttl ack 후 미해결 노출 TTL (세션 수, default 2 — D-145 Master 결정)
 */
export declare function computeAckedButUnresolved(decisions: DecisionEntry[], currentSessionNum: number, ttl?: number): AckedButUnresolvedItem[];
/**
 * nexus/hook 모드 분포 + 운영 이상 집계.
 * session_index.sessions의 gaps + pending_turns 파일 현황으로 구성.
 */
export declare function computeNexusPushStats(sessionIdx: {
    sessions: Array<{
        sessionId: string;
        turnPushMode?: string;
        turns?: Turn[];
        gaps?: unknown[];
    }>;
}, cwd?: string): {
    turnPushModeDistribution: Record<string, number>;
    crashRecoveryCount: number;
    hookOriginViolations: number;
    nexusPushMissing: number;
    orphanPendingFiles: Array<{
        file: string;
        sizeBytes: number;
        lines: number;
    }>;
    archiveCount: number;
};
export declare function main(): void;
export {};
//# sourceMappingURL=compute-dashboard.d.ts.map