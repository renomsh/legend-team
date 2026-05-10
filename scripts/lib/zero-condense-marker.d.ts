/**
 * zero-condense-marker.ts
 * PD-064 P1 (session_194, topic_167, 2026-05-05) — Zero D.Condense 마커 SOT.
 *
 * 결함 #1 (FP) root cause: 마커 키 드리프트(`session`/`topic`/`executedAt` vs `sessionId`/`topicId`/`completedAt`).
 * 해결: 표준 키를 헬퍼로 단일화. legacy migrate는 D-028 정신 보존 위해 회피하고, read 호환만 제공.
 *
 * - writeMarker(reportDir, sess, opts): canonical schema로 박제.
 * - readAndValidateMarker(reportDir, sess): legacy 키 호환 read + 스키마 검증.
 *
 * canonical schema (필수 키): sessionId, topicId, completedAt, files[]
 * legacy 호환 read: marker.sessionId || marker.session  /  marker.topicId || marker.topic  /  marker.completedAt || marker.executedAt
 *
 * Prime Directive D2 정합: 마커 존재만 신뢰 금지 — 실 페이로드 검증.
 */
export declare const MARKER_FILENAME = "_zero_condense.json";
export interface ZeroCondenseMarker {
    sessionId: string;
    topicId: string;
    completedAt: string;
    files: string[];
    refinedRoles?: string[];
    skippedRoles?: string[];
    phaseB?: {
        completedAt: string;
        ediCondensed?: string;
    };
    [k: string]: unknown;
}
export interface MarkerReadResult {
    valid: boolean;
    reason?: string;
    /** 정규화된 canonical view — read 시 legacy 키도 흡수 */
    canonical?: Pick<ZeroCondenseMarker, 'sessionId' | 'topicId' | 'completedAt' | 'files'>;
    /** 원본 raw JSON (참고용) */
    raw?: unknown;
}
export interface MinimalSession {
    sessionId?: string;
    topicId?: string;
}
export interface WriteMarkerOptions {
    refinedRoles?: string[];
    skippedRoles?: string[];
    files?: string[];
    extra?: Record<string, unknown>;
}
/**
 * canonical schema로 마커 박제. 존재 시 덮어쓴다.
 * `files`는 디렉토리에서 자동 추출 (*.md, _zero_condense.json 제외) — opts.files로 override 가능.
 */
export declare function writeMarker(reportDir: string, sess: MinimalSession, opts?: WriteMarkerOptions): string;
/**
 * 마커 read + 검증. legacy 키(`session`/`topic`/`executedAt`) 호환.
 * 파싱 실패·세션 mismatch·필수 키 부재 시 valid=false + reason.
 */
export declare function readAndValidateMarker(reportDir: string, sess: MinimalSession): MarkerReadResult;
//# sourceMappingURL=zero-condense-marker.d.ts.map