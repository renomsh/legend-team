/**
 * validate-output.ts  [L-03]
 * Validates that an agent output file has all required frontmatter fields
 * per config/output.json requiredFrontmatter spec.
 *
 * Usage:
 *   ts-node scripts/validate-output.ts <filePath> [filePath2 ...]
 *
 * Example:
 *   ts-node scripts/validate-output.ts reports/2026-04-03_legend-team-upgrade/ace_rev01.md
 *   ts-node scripts/validate-output.ts reports/2026-04-03_legend-team-upgrade/*.md
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

// Required frontmatter fields per output.json
const REQUIRED_FIELDS = ['topic', 'role', 'revision', 'date', 'status', 'accessed_assets'];

// Valid status values per output.json
const VALID_STATUSES = ['draft', 'reviewed', 'master-approved', 'superseded', 'approved', 'final'];

interface ValidationResult {
  file: string;
  valid: boolean;
  missingFields: string[];
  invalidStatus: boolean;
  warnings: string[];
}

function parseFrontmatter(content: string): Record<string, string> | null {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('---', 3);
  if (end === -1) return null;
  const frontmatter = content.slice(3, end).trim();
  const result: Record<string, string> = {};
  for (const line of frontmatter.split('\n')) {
    // Skip indented lines (they are children of a block key, e.g. accessed_assets list items)
    if (line.match(/^\s+/)) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    // For block keys (value is empty), mark as present with sentinel
    result[key] = value === '' ? '__block__' : value;
  }
  return result;
}

function validateFile(filePath: string): ValidationResult {
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  const result: ValidationResult = {
    file: filePath,
    valid: true,
    missingFields: [],
    invalidStatus: false,
    warnings: [],
  };

  if (!fs.existsSync(absPath)) {
    result.valid = false;
    result.warnings.push('File not found');
    return result;
  }

  const content = fs.readFileSync(absPath, 'utf8');
  const frontmatter = parseFrontmatter(content);

  if (!frontmatter) {
    result.valid = false;
    result.warnings.push('No frontmatter block found (expected --- delimiters)');
    return result;
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in frontmatter) || !frontmatter[field]) {
      result.missingFields.push(field);
      result.valid = false;
    }
  }

  // Check status value
  if (frontmatter['status'] && !VALID_STATUSES.includes(frontmatter['status'])) {
    result.invalidStatus = true;
    result.valid = false;
    result.warnings.push(`Invalid status: "${frontmatter['status']}". Valid: ${VALID_STATUSES.join(', ')}`);
  }

  // Warn if accessed_assets field exists but looks empty
  const aa = frontmatter['accessed_assets'];
  if (aa === '' || aa === '[]') {
    result.warnings.push('accessed_assets appears empty — ensure required assets were queried');
  }

  // Check revision is a number
  if (frontmatter['revision'] && isNaN(parseInt(frontmatter['revision'], 10))) {
    result.warnings.push(`revision should be a number, got: "${frontmatter['revision']}"`);
  }

  return result;
}

function appendLog(message: string): void {
  const logPath = path.join(ROOT, 'logs', 'app.log');
  const line = `[${new Date().toISOString()}] [validate-output] ${message}\n`;
  fs.appendFileSync(logPath, line, 'utf8');
}

function run(): void {
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.error('Usage: ts-node scripts/validate-output.ts <filePath> [filePath2 ...]');
    process.exit(1);
  }

  const results = files.map(validateFile);
  const passed = results.filter(r => r.valid);
  const failed = results.filter(r => !r.valid);

  console.log(`\nValidation results: ${passed.length}/${results.length} passed\n`);

  for (const r of results) {
    const icon = r.valid ? '✓' : '✗';
    console.log(`${icon} ${r.file}`);
    if (r.missingFields.length > 0) {
      console.log(`    Missing fields: ${r.missingFields.join(', ')}`);
    }
    if (r.invalidStatus) {
      console.log(`    Invalid status`);
    }
    for (const w of r.warnings) {
      console.log(`    ⚠ ${w}`);
    }
  }

  const summary = `Validated ${results.length} files — ${passed.length} passed, ${failed.length} failed`;
  appendLog(summary);

  if (failed.length > 0) {
    console.log(`\n✗ ${failed.length} file(s) failed validation`);
    process.exit(1);
  } else {
    console.log('\n✓ All files passed validation');
  }
}

run();
