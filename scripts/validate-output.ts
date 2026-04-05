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

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

// ── Canonical schema ─────────────────────────────────────────────────────────

const CANONICAL_REQUIRED = ['topic', 'role', 'phase', 'revision', 'date', 'report_status', 'session_status', 'accessed_assets'];

const VALID_ROLES = ['ace', 'arki', 'fin', 'riki', 'editor', 'nova', 'master'];

const VALID_REPORT_STATUSES = ['draft', 'reviewed', 'approved', 'superseded', 'speculative'];

const VALID_SESSION_STATUSES = ['open', 'in-progress', 'review', 'suspended', 'closed'];

// ── Legacy schema (backward compat) ─────────────────────────────────────────

// Legacy files used `agent` instead of `role`, and a single `status` field.
// These are accepted with warnings unless --strict mode is active.
const LEGACY_STATUS_VALUES = ['draft', 'reviewed', 'master-approved', 'superseded', 'approved', 'final', 'completed'];

// ── Types ────────────────────────────────────────────────────────────────────

interface ValidationResult {
  file: string;
  valid: boolean;
  isLegacy: boolean;
  missingFields: string[];
  invalidValues: string[];
  warnings: string[];
}

// ── Parser ───────────────────────────────────────────────────────────────────

function parseFrontmatter(content: string): Record<string, string> | null {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('---', 3);
  if (end === -1) return null;
  const frontmatter = content.slice(3, end).trim();
  const result: Record<string, string> = {};
  for (const line of frontmatter.split('\n')) {
    // Skip indented lines (list items under a block key)
    if (line.match(/^\s+/)) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    result[key] = value === '' ? '__block__' : value;
  }
  return result;
}

// ── Validator ────────────────────────────────────────────────────────────────

function validateFile(filePath: string, strict: boolean): ValidationResult {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  const result: ValidationResult = {
    file: filePath,
    valid: true,
    isLegacy: false,
    missingFields: [],
    invalidValues: [],
    warnings: [],
  };

  if (!fs.existsSync(absPath)) {
    result.valid = false;
    result.warnings.push('File not found');
    return result;
  }

  const content = fs.readFileSync(absPath, 'utf8');
  const fm = parseFrontmatter(content);

  if (!fm) {
    result.valid = false;
    result.warnings.push('No frontmatter block found (expected --- delimiters)');
    return result;
  }

  // ── Detect legacy schema ──────────────────────────────────────────────────
  const hasLegacyAgent = 'agent' in fm && !('role' in fm);
  const hasLegacyStatus = 'status' in fm && !('report_status' in fm) && !('session_status' in fm);
  result.isLegacy = hasLegacyAgent || hasLegacyStatus;

  if (result.isLegacy) {
    result.warnings.push(
      'Legacy schema detected. Canonical schema requires: role (not agent), report_status + session_status (not status).'
    );
    if (strict) {
      result.valid = false;
      result.warnings.push('--strict mode: legacy schema is a hard failure.');
    }
  }

  // ── Resolve effective field names (support legacy fallbacks) ──────────────
  const effectiveRole = fm['role'] ?? fm['agent'] ?? '';
  const effectiveReportStatus = fm['report_status'] ?? (hasLegacyStatus ? fm['status'] : '');
  const effectiveSessionStatus = fm['session_status'] ?? '';

  // ── Required fields (canonical) ───────────────────────────────────────────
  const fieldsToCheck = result.isLegacy
    ? ['topic', 'revision', 'date']   // minimum hard-required for legacy files; accessed_assets is advisory
    : CANONICAL_REQUIRED;

  for (const field of fieldsToCheck) {
    const val = fm[field];
    if (!val) {
      result.missingFields.push(field);
      result.valid = false;
    }
  }

  // ── role / agent ──────────────────────────────────────────────────────────
  if (!effectiveRole) {
    if (!result.missingFields.includes('role')) {
      result.missingFields.push('role (or legacy: agent)');
      result.valid = false;
    }
  } else if (!VALID_ROLES.includes(effectiveRole)) {
    result.invalidValues.push(`role "${effectiveRole}" — valid: ${VALID_ROLES.join(', ')}`);
    result.valid = false;
  }

  // ── report_status ─────────────────────────────────────────────────────────
  if (effectiveReportStatus && !VALID_REPORT_STATUSES.includes(effectiveReportStatus)) {
    if (result.isLegacy && !strict) {
      // Legacy files: any unrecognized status value is a warning only
      result.warnings.push(
        `Legacy report_status "${effectiveReportStatus}" — canonical values: ${VALID_REPORT_STATUSES.join(', ')}`
      );
    } else if (LEGACY_STATUS_VALUES.includes(effectiveReportStatus)) {
      result.warnings.push(
        `Legacy report_status "${effectiveReportStatus}" — canonical values: ${VALID_REPORT_STATUSES.join(', ')}`
      );
    } else {
      result.invalidValues.push(`report_status "${effectiveReportStatus}" — valid: ${VALID_REPORT_STATUSES.join(', ')}`);
      result.valid = false;
    }
  }

  // ── session_status ────────────────────────────────────────────────────────
  if (effectiveSessionStatus && !VALID_SESSION_STATUSES.includes(effectiveSessionStatus)) {
    result.invalidValues.push(`session_status "${effectiveSessionStatus}" — valid: ${VALID_SESSION_STATUSES.join(', ')}`);
    result.valid = false;
  }

  // ── revision must be a number ─────────────────────────────────────────────
  if (fm['revision'] && isNaN(parseInt(fm['revision'], 10))) {
    result.warnings.push(`revision should be a number, got: "${fm['revision']}"`);
  }

  // ── accessed_assets should not be empty ───────────────────────────────────
  const aa = fm['accessed_assets'];
  if (aa === '' || aa === '[]') {
    result.warnings.push('accessed_assets appears empty — ensure required assets were queried');
  }

  return result;
}

// ── Logger ───────────────────────────────────────────────────────────────────

function appendLog(message: string): void {
  const logPath = path.join(ROOT, 'logs', 'app.log');
  const line = `[${new Date().toISOString()}] [validate-output] ${message}\n`;
  fs.appendFileSync(logPath, line, 'utf8');
}

// ── Runner ───────────────────────────────────────────────────────────────────

function run(): void {
  const args = process.argv.slice(2);
  const strict = args[0] === '--strict';
  const files = strict ? args.slice(1) : args;

  if (files.length === 0) {
    console.error('Usage: ts-node scripts/validate-output.ts [--strict] <filePath> [filePath2 ...]');
    process.exit(1);
  }

  if (strict) {
    console.log('Mode: --strict (legacy schema = hard failure)\n');
  }

  const results = files.map(f => validateFile(f, strict));
  const passed = results.filter(r => r.valid);
  const failed = results.filter(r => !r.valid);
  const legacy = results.filter(r => r.isLegacy);

  console.log(`Validation results: ${passed.length}/${results.length} passed${legacy.length > 0 ? ` (${legacy.length} legacy)` : ''}\n`);

  for (const r of results) {
    const icon = r.valid ? '✓' : '✗';
    const tag = r.isLegacy ? ' [legacy]' : '';
    console.log(`${icon}${tag} ${r.file}`);
    if (r.missingFields.length > 0) {
      console.log(`    Missing fields: ${r.missingFields.join(', ')}`);
    }
    for (const iv of r.invalidValues) {
      console.log(`    Invalid value: ${iv}`);
    }
    for (const w of r.warnings) {
      console.log(`    ⚠ ${w}`);
    }
  }

  const summary = `Validated ${results.length} files — ${passed.length} passed, ${failed.length} failed, ${legacy.length} legacy`;
  appendLog(summary);

  if (failed.length > 0) {
    console.log(`\n✗ ${failed.length} file(s) failed validation`);
    process.exit(1);
  } else {
    console.log('\n✓ All files passed validation');
  }
}

run();
