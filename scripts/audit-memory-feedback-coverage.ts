/**
 * audit-memory-feedback-coverage.ts
 * topic_196 / session_233 Phase 1 — Audit #3
 *
 * MEMORY.md 인덱스 vs 실파일 vs 정책/role/ledger 박제 cross-check.
 *
 * 분류:
 *   B: ledger 흡수 (decision_ledger.json grep hit)
 *   R: role 흡수 (memory/roles/policies/* 또는 personas/* hit)
 *   D: deprecated D-XXX 인용
 *   N: 미흡수 (유지 권고)
 *   P: project CLAUDE.md hit
 *   G: global CLAUDE.md hit
 *
 * Export:
 *   auditMemoryFeedbackCoverage(memoryDir?, projectRoot?)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { todayYMD, writeReport, mdTable } from './lib/audit-helpers';

interface CoverageItem {
  file: string;
  inIndex: boolean;
  category: string;  // 'B' | 'R' | 'D' | 'N' | 'P' | 'G' (조합 가능, '+' join)
  absorbedAt: string[];  // 발견 위치
  keywords: string[];    // 매칭에 쓴 키워드
}

export interface AuditCoverageResult {
  items: CoverageItem[];
  indexCount: number;
  fileCount: number;
  missingFromIndex: string[];
  archiveCandidates: number;
  summary: string;
}

const DEFAULT_MEMORY_DIR = path.join(
  os.homedir(),
  '.claude',
  'projects',
  'C--Projects-legend-team',
  'memory',
);

function extractIndexEntries(memoryMd: string): string[] {
  // MEMORY.md 형식: "- [Title](file.md) — desc"
  const out: string[] = [];
  for (const line of memoryMd.split('\n')) {
    const m = line.match(/\[\s*([^\]]+)\s*\]\(([^)]+\.md)\)/);
    if (m) out.push(m[2] as string);
  }
  return out;
}

function extractKeywords(filename: string, body: string): string[] {
  // 파일명 마지막 토큰 + 본문 첫 헤더에서 키워드 후보 추출
  const base = filename.replace(/^(feedback|project|reference)_/, '').replace(/\.md$/, '');
  const tokens = base.split('_').filter((t) => t.length >= 3);
  const out = new Set<string>(tokens);
  // 첫 # 헤더
  const h = body.match(/^#\s+(.+)$/m);
  if (h && h[1]) {
    h[1].split(/[\s—\-:]+/).forEach((w) => {
      if (w.length >= 3 && /^[A-Za-z가-힣0-9]+$/.test(w)) out.add(w);
    });
  }
  return [...out].slice(0, 8);
}

function grepCount(text: string, kw: string): number {
  if (!kw) return 0;
  try {
    const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const m = text.match(re);
    return m ? m.length : 0;
  } catch {
    return 0;
  }
}

export function auditMemoryFeedbackCoverage(
  memoryDir?: string,
  projectRoot?: string,
): AuditCoverageResult {
  const memDir = memoryDir || DEFAULT_MEMORY_DIR;
  const root = projectRoot || process.cwd();

  const memoryMdPath = path.join(memDir, 'MEMORY.md');
  const memoryMd = fs.existsSync(memoryMdPath) ? fs.readFileSync(memoryMdPath, 'utf-8') : '';
  const indexEntries = extractIndexEntries(memoryMd);
  const indexSet = new Set(indexEntries);

  const allFiles = fs.readdirSync(memDir).filter((f) =>
    /^(feedback|project|reference)_.+\.md$/.test(f),
  );

  // 흡수 위치 텍스트 미리 로드
  const ledgerText = (() => {
    const p = path.join(root, 'memory/shared/decision_ledger.json');
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '';
  })();

  const policyTexts: { name: string; text: string }[] = [];
  const policiesDir = path.join(root, 'memory', 'roles', 'policies');
  if (fs.existsSync(policiesDir)) {
    for (const f of fs.readdirSync(policiesDir)) {
      if (f.endsWith('.md')) {
        policyTexts.push({
          name: `policies/${f}`,
          text: fs.readFileSync(path.join(policiesDir, f), 'utf-8'),
        });
      }
    }
  }
  const personasDir = path.join(root, 'memory', 'roles', 'personas');
  if (fs.existsSync(personasDir)) {
    for (const f of fs.readdirSync(personasDir)) {
      if (f.endsWith('.md')) {
        policyTexts.push({
          name: `personas/${f}`,
          text: fs.readFileSync(path.join(personasDir, f), 'utf-8'),
        });
      }
    }
  }

  const projectClaude = fs.existsSync(path.join(root, 'CLAUDE.md'))
    ? fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf-8')
    : '';
  const globalClaude = fs.existsSync(path.join(os.homedir(), '.claude', 'CLAUDE.md'))
    ? fs.readFileSync(path.join(os.homedir(), '.claude', 'CLAUDE.md'), 'utf-8')
    : '';

  const items: CoverageItem[] = [];

  for (const f of allFiles) {
    const body = fs.readFileSync(path.join(memDir, f), 'utf-8');
    const kws = extractKeywords(f, body);

    const cats = new Set<string>();
    const where: string[] = [];

    // ledger 흡수 — 키워드 ≥2개 hit
    let ledgerHits = 0;
    for (const k of kws) ledgerHits += grepCount(ledgerText, k) > 0 ? 1 : 0;
    if (ledgerHits >= 2) {
      cats.add('B');
      where.push(`ledger(${ledgerHits} kw)`);
    }

    // role 흡수
    for (const p of policyTexts) {
      let h = 0;
      for (const k of kws) h += grepCount(p.text, k) > 0 ? 1 : 0;
      if (h >= 2) {
        cats.add('R');
        where.push(`${p.name}(${h} kw)`);
      }
    }

    // project CLAUDE.md
    let pHits = 0;
    for (const k of kws) pHits += grepCount(projectClaude, k) > 0 ? 1 : 0;
    if (pHits >= 2) {
      cats.add('P');
      where.push(`CLAUDE.md(${pHits} kw)`);
    }

    // global CLAUDE.md
    let gHits = 0;
    for (const k of kws) gHits += grepCount(globalClaude, k) > 0 ? 1 : 0;
    if (gHits >= 2) {
      cats.add('G');
      where.push(`global-CLAUDE(${gHits} kw)`);
    }

    // body 자체에 D-XXX 인용 + deprecated 가능성 표시
    if (/D-\d+/.test(body)) {
      cats.add('D');
    }

    if (cats.size === 0) cats.add('N');

    items.push({
      file: f,
      inIndex: indexSet.has(f),
      category: [...cats].join('+'),
      absorbedAt: where,
      keywords: kws,
    });
  }

  const missingFromIndex = allFiles.filter((f) => !indexSet.has(f));
  const archiveCandidates = items.filter(
    (i) => i.category.includes('B') || i.category.includes('R') || i.category.includes('P') || i.category.includes('G'),
  ).length;

  return {
    items,
    indexCount: indexEntries.length,
    fileCount: allFiles.length,
    missingFromIndex,
    archiveCandidates,
    summary: `index=${indexEntries.length}, files=${allFiles.length}, missing-from-index=${missingFromIndex.length}, archive-candidates=${archiveCandidates}`,
  };
}

function renderReport(result: AuditCoverageResult): string {
  const headers = ['file', 'inIndex', 'category', 'absorbedAt', 'keywords'];
  const rows = result.items.map((i) => [
    i.file,
    i.inIndex ? 'Y' : 'N',
    i.category,
    i.absorbedAt.join('; ').slice(0, 80),
    i.keywords.slice(0, 5).join(','),
  ]);
  return [
    `# Memory Feedback Coverage Audit — ${todayYMD()}`,
    ``,
    `**Summary**: ${result.summary}`,
    ``,
    `## Missing from MEMORY.md index (${result.missingFromIndex.length})`,
    ``,
    result.missingFromIndex.length
      ? result.missingFromIndex.map((f) => `- ${f}`).join('\n')
      : '_(none)_',
    ``,
    `## Coverage Items (${result.items.length})`,
    ``,
    `Category legend: B=ledger / R=role / P=project-CLAUDE / G=global-CLAUDE / D=cites-D-id / N=none(retain)`,
    ``,
    mdTable(headers, rows),
    ``,
  ].join('\n');
}

if (require.main === module) {
  const result = auditMemoryFeedbackCoverage();
  const out = path.join(process.cwd(), 'reports', `${todayYMD()}_memory-feedback-coverage-audit.md`);
  writeReport(out, renderReport(result));
  console.log(`[audit-memory-feedback-coverage] ${result.summary}`);
  console.log(`report: ${out}`);
}
