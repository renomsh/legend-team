/**
 * validate-prime-directive.ts
 *
 * Affaan 4 Prime Directive 무결성 검증 (D-122, session_141, topic_131).
 *
 * - CLAUDE.md Rules 블록의 4 Prime Directive bullet 텍스트 추출 → SHA-256 → memory/shared/prime_directive.lock.json sha256 비교.
 * - mismatch → exit 1 + stderr "PRIME_DIRECTIVE_TAMPER_DETECTED".
 * - --init 모드: lock.json sha256 + lockedAt 갱신 (최초 박제 또는 의도적 변경 후 재잠금).
 *
 * D4 자기충실: validator 자체가 4 bullet 정규식·lock 경로를 const로 분리, 자기 검증 가능.
 */
export declare function extractDirectiveBullets(claudeMdPath: string): string[];
export declare function computeDirectiveHash(bullets: string[]): string;
export interface ValidateResult {
    ok: boolean;
    expected: string;
    actual: string;
    message: string;
}
export declare function validate(): ValidateResult;
export declare function init(sessionId?: string): void;
//# sourceMappingURL=validate-prime-directive.d.ts.map