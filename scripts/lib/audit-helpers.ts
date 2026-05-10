/**
 * audit-helpers.ts
 * topic_196 / session_233 Phase 1 — audit 스크립트 4종 공용 유틸.
 *
 * - 날짜 포맷, 보고서 디렉터리 생성
 * - JSON 안전 파싱 (line/col 추출)
 * - Markdown 표 빌더
 */

import * as fs from 'fs';
import * as path from 'path';

export function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function writeReport(reportPath: string, content: string): void {
  ensureDir(path.dirname(reportPath));
  fs.writeFileSync(reportPath, content, 'utf-8');
}

export interface JsonParseResult<T = unknown> {
  ok: boolean;
  data?: T | undefined;
  errorMessage?: string | undefined;
  line?: number | undefined;
  col?: number | undefined;
}

/**
 * JSON.parse 시도 + line/col 추출 (Node v8 메시지 패턴).
 * 메시지 예: "Unexpected token { in JSON at position 3245" 또는 v20+ "...at line 78 column 5..."
 */
export function safeParseJson<T = unknown>(text: string): JsonParseResult<T> {
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch (e) {
    const msg = (e as Error).message;
    let line: number | undefined;
    let col: number | undefined;

    // v20+ pattern: "...at line N column M"
    const lc = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (lc) {
      line = Number(lc[1]);
      col = Number(lc[2]);
    } else {
      // legacy: "at position N" → 줄·칼럼 직접 계산
      const pos = msg.match(/position\s+(\d+)/i);
      if (pos) {
        const p = Number(pos[1]);
        const head = text.slice(0, p);
        line = head.split('\n').length;
        const lastNl = head.lastIndexOf('\n');
        col = lastNl === -1 ? p + 1 : p - lastNl;
      }
    }
    return { ok: false, errorMessage: msg, line, col };
  }
}

export function mdTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.map((c) => String(c).replace(/\|/g, '\\|')).join(' | ')} |`).join('\n');
  return [head, sep, body].join('\n');
}

/**
 * 디렉터리 재귀 탐색 — 패턴 매칭 파일 경로 리스트.
 */
export function walk(dir: string, opts: { exclude?: RegExp; ext?: string[] } = {}): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  const stack: string[] = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (opts.exclude && opts.exclude.test(full)) continue;
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile()) {
        if (!opts.ext || opts.ext.some((e) => full.toLowerCase().endsWith(e))) out.push(full);
      }
    }
  }
  return out;
}
