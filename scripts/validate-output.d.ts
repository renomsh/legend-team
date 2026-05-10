/**
 * validate-output.ts
 * Validates that a role output file has all required frontmatter fields
 * per canonical v0.3.0 schema.
 *
 * Canonical schema:
 *   topic, topic_slug (optional), role, phase, revision, date,
 *   report_status, session_status, accessed_assets
 *
 * Backward compatibility:
 *   Legacy files with `agent` instead of `role`, or a single `status` field
 *   instead of `report_status`/`session_status`, will trigger warnings but
 *   will not be treated as hard failures unless --strict flag is passed.
 *
 * Usage:
 *   ts-node scripts/validate-output.ts <filePath> [filePath2 ...]
 *   ts-node scripts/validate-output.ts --strict <filePath> [...]
 *
 * Example:
 *   ts-node scripts/validate-output.ts reports/2026-04-04_local-vs-server/ace_rev01.md
 */
export {};
//# sourceMappingURL=validate-output.d.ts.map