/**
 * validate-role-memory-json.ts
 * topic_196 / session_233 Phase 1 — Audit #4
 *
 * 11개 역할 *_memory.json JSON 파싱 + 공통 키 검증.
 *
 * 검증:
 *   1. JSON.parse 성공 여부 (실패 시 line/col 표시)
 *   2. 공통 필수 키 부분 검증 (lessonLog 또는 metrics 중 1개 이상)
 *
 * Exit code: 오류 시 1, 정상 0
 *
 * Export:
 *   validateRoleMemoryJson(rolesDir?)
 */

import * as fs from 'fs';
import * as path from 'path';
import { todayYMD, writeReport, mdTable, safeParseJson } from './lib/audit-helpers';

interface RoleMemoryError {
  file: string;
  line?: number | undefined;
  col?: number | undefined;
  msg: string;
}

interface RoleMemoryRow {
  file: string;
  parseOk: boolean;
  hasLessonLog: boolean;
  hasMetrics: boolean;
  size: number;
  error?: string | undefined;
}

export interface ValidateRoleMemoryResult {
  rows: RoleMemoryRow[];
  errors: RoleMemoryError[];
  summary: string;
}

export function validateRoleMemoryJson(rolesDir?: string): ValidateRoleMemoryResult {
  const dir = rolesDir || path.join(process.cwd(), 'memory', 'roles');
  const files = fs.readdirSync(dir).filter((f) => /^[a-z]+_memory\.json$/.test(f));

  const rows: RoleMemoryRow[] = [];
  const errors: RoleMemoryError[] = [];

  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    const text = fs.readFileSync(full, 'utf-8');
    const result = safeParseJson<Record<string, unknown>>(text);

    if (!result.ok) {
      errors.push({
        file: f,
        line: result.line,
        col: result.col,
        msg: result.errorMessage || 'parse error',
      });
      rows.push({
        file: f,
        parseOk: false,
        hasLessonLog: false,
        hasMetrics: false,
        size: stat.size,
        error: `${result.errorMessage} @ line ${result.line ?? '?'} col ${result.col ?? '?'}`,
      });
      continue;
    }

    const data = result.data as Record<string, unknown>;
    const hasLessonLog = 'lessonLog' in data && Array.isArray(data['lessonLog']);
    const hasMetrics = 'metrics' in data;

    const missingKeys = !hasLessonLog && !hasMetrics;
    const missingKeysMsg = 'missing both lessonLog and metrics keys';

    rows.push({
      file: f,
      parseOk: true,
      hasLessonLog,
      hasMetrics,
      size: stat.size,
      // B-4 fix: row.error에도 동일 메시지 박제 (보고서 표 error 칼럼 노출)
      error: missingKeys ? missingKeysMsg : undefined,
    });

    if (missingKeys) {
      errors.push({
        file: f,
        msg: missingKeysMsg,
      });
    }
  }

  return {
    rows,
    errors,
    summary: `files=${rows.length}, errors=${errors.length}`,
  };
}

function renderReport(result: ValidateRoleMemoryResult): string {
  const headers = ['file', 'parse', 'lessonLog', 'metrics', 'size', 'error'];
  const rows = result.rows.map((r) => [
    r.file,
    r.parseOk ? 'OK' : 'FAIL',
    r.hasLessonLog ? 'Y' : 'N',
    r.hasMetrics ? 'Y' : 'N',
    String(r.size),
    r.error || '',
  ]);
  return [
    `# Role Memory JSON Validation — ${todayYMD()}`,
    ``,
    `**Summary**: ${result.summary}`,
    ``,
    mdTable(headers, rows),
    ``,
    `## Errors (${result.errors.length})`,
    ``,
    result.errors.length
      ? result.errors
          .map((e) => `- ${e.file}: ${e.msg}` + (e.line ? ` @ line ${e.line} col ${e.col ?? '?'}` : ''))
          .join('\n')
      : '_(none)_',
    ``,
  ].join('\n');
}

if (require.main === module) {
  const result = validateRoleMemoryJson();
  const out = path.join(process.cwd(), 'reports', `${todayYMD()}_role-memory-validation.md`);
  writeReport(out, renderReport(result));
  console.log(`[validate-role-memory-json] ${result.summary}`);
  for (const e of result.errors) {
    console.log(`  ERR ${e.file}: ${e.msg}` + (e.line ? ` @line ${e.line} col ${e.col}` : ''));
  }
  console.log(`report: ${out}`);
  process.exit(result.errors.length > 0 ? 1 : 0);
}
