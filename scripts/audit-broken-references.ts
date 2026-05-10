/**
 * audit-broken-references.ts
 * topic_196 / session_233 Phase 1 — Audit #2
 *
 * 코드·문서·hook 본문의 broken file path 참조 식별.
 *
 * 검사 패턴:
 *   - agents/role-*.md  (디렉터리 부재 → 모두 broken)
 *   - .claude/skills/<deprecated>/  (스텁 외)
 *   - memory/roles/personas/role-*.md / policies/role-*.md (실재 확인)
 *
 * 검사 위치:
 *   CLAUDE.md (project + global), memory/roles/policies/_common.md,
 *   memory/roles/personas/role-*.md, memory/roles/policies/role-*.md,
 *   memory/shared/dispatch_config.json, .claude/hooks/*.js
 *
 * 화이트리스트: reports/, topics/ (history)
 *
 * Export:
 *   auditBrokenReferences(rootDir?)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { todayYMD, writeReport, mdTable } from './lib/audit-helpers';

interface BrokenRef {
  file: string;
  line: number;
  ref: string;
  reason: string;
}

export interface AuditBrokenRefsResult {
  broken: BrokenRef[];
  filesScanned: number;
  summary: string;
}

const REF_PATTERNS = [
  // agents/role-*.md (현재 부재 디렉터리)
  /\bagents\/role-[a-z]+\.md\b/g,
  // memory/roles/personas/role-*.md
  /\bmemory\/roles\/personas\/role-[a-z]+\.md\b/g,
  // memory/roles/policies/role-*.md or _common.md
  /\bmemory\/roles\/policies\/(?:role-[a-z]+|_common)\.md\b/g,
  // .claude/skills/<name>/SKILL.md or directory
  /\.claude\/skills\/[a-z][\w-]+\/(?:SKILL\.md)?/g,
];

function scanFile(file: string, projectRoot: string): BrokenRef[] {
  let text: string;
  try {
    text = fs.readFileSync(file, 'utf-8');
  } catch {
    return [];
  }
  const lines = text.split('\n');
  const out: BrokenRef[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    for (const pat of REF_PATTERNS) {
      const re = new RegExp(pat.source, 'g');
      let m: RegExpExecArray | null;
      while ((m = re.exec(line)) !== null) {
        const ref = m[0];
        const key = `${file}::${i + 1}::${ref}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const refPath = path.join(projectRoot, ref.replace(/\/$/, ''));
        const exists = fs.existsSync(refPath);

        if (!exists) {
          let reason = 'file/dir not found';
          if (ref.startsWith('agents/')) reason = 'agents/ dir absent (D-126/D-127 broken link)';
          out.push({ file: path.relative(projectRoot, file), line: i + 1, ref, reason });
        }
      }
    }
  }
  return out;
}

export function auditBrokenReferences(rootDir?: string): AuditBrokenRefsResult {
  const root = rootDir || process.cwd();
  const broken: BrokenRef[] = [];
  let scanned = 0;

  const targets: string[] = [];

  // Project CLAUDE.md
  targets.push(path.join(root, 'CLAUDE.md'));

  // Global CLAUDE.md
  const globalClaude = path.join(os.homedir(), '.claude', 'CLAUDE.md');
  if (fs.existsSync(globalClaude)) targets.push(globalClaude);

  // memory/roles/policies/_common.md + role-*.md
  const policiesDir = path.join(root, 'memory', 'roles', 'policies');
  if (fs.existsSync(policiesDir)) {
    for (const f of fs.readdirSync(policiesDir)) {
      if (f.endsWith('.md')) targets.push(path.join(policiesDir, f));
    }
  }

  // memory/roles/personas/role-*.md
  const personasDir = path.join(root, 'memory', 'roles', 'personas');
  if (fs.existsSync(personasDir)) {
    for (const f of fs.readdirSync(personasDir)) {
      if (f.endsWith('.md')) targets.push(path.join(personasDir, f));
    }
  }

  // dispatch_config.json
  targets.push(path.join(root, 'memory', 'shared', 'dispatch_config.json'));

  // .claude/hooks/*.js
  const hooksDir = path.join(root, '.claude', 'hooks');
  if (fs.existsSync(hooksDir)) {
    for (const f of fs.readdirSync(hooksDir)) {
      if (f.endsWith('.js')) targets.push(path.join(hooksDir, f));
    }
  }

  for (const t of targets) {
    if (!fs.existsSync(t)) continue;
    scanned++;
    broken.push(...scanFile(t, root));
  }

  return {
    broken,
    filesScanned: scanned,
    summary: `scanned=${scanned}, broken=${broken.length}`,
  };
}

function renderReport(result: AuditBrokenRefsResult): string {
  const headers = ['file', 'line', 'ref', 'reason'];
  const rows = result.broken.map((b) => [b.file, String(b.line), b.ref, b.reason]);
  return [
    `# Broken References Audit — ${todayYMD()}`,
    ``,
    `**Summary**: ${result.summary}`,
    ``,
    `## Broken (${result.broken.length})`,
    ``,
    rows.length ? mdTable(headers, rows) : '_(none)_',
    ``,
  ].join('\n');
}

if (require.main === module) {
  const result = auditBrokenReferences();
  const out = path.join(process.cwd(), 'reports', `${todayYMD()}_broken-references-audit.md`);
  writeReport(out, renderReport(result));
  console.log(`[audit-broken-references] ${result.summary}`);
  console.log(`report: ${out}`);
}
