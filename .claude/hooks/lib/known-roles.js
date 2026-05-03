/**
 * KNOWN_ROLES — 공통 역할 목록 단일 출처 (SOT)
 * PD-059 resolved (session_179, 2026-05-04)
 *
 * 역할 추가 시 이 파일만 수정. 3개 hook이 require()로 참조:
 *   .claude/hooks/post-tool-use-task.js
 *   .claude/hooks/pre-tool-use-task.js
 *   .claude/hooks/pre-tool-use-task-sage-gate.js
 */
const KNOWN_ROLES = [
  'ace', 'arki', 'fin', 'riki', 'nova',
  'dev', 'edi', 'designer', 'vera',
  'sage', 'zero', 'jobs'
];

module.exports = { KNOWN_ROLES };
