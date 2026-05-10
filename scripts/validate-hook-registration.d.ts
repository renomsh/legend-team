/**
 * scripts/validate-hook-registration.ts
 * .claude/settings.json hooks 등록 상태 점검 (topic_127 P2, R-2 mitigation).
 *
 * 실행: npx ts-node scripts/validate-hook-registration.ts
 *
 * 검증 항목:
 *   1. .claude/settings.json 존재 확인
 *   2. hooks.PreToolUse에 pre-tool-use-task.js 등록 여부
 *   3. hooks.PostToolUse에 post-tool-use-task.js 등록 여부
 *   4. SessionEnd hook 존재 여부 (선택적 경고)
 *
 * 출력:
 *   - PASS/WARN 라인 (exit 0 — 강제 종료 X, 검증만)
 *   - 미등록 시 WARN 출력 + 최종 WARN_COUNT 보고
 */
export {};
//# sourceMappingURL=validate-hook-registration.d.ts.map