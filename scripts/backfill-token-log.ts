/**
 * token_log.json 백필 — 모든 transcript를 스캔하여 legendSessionId별로 재집계.
 *
 * Why: session-end-tokens hook의 과거 파싱 버그(type==='human' / 경로 미발견 등)로
 * 대부분 세션이 누락 or masterTurns=0. 고정된 로직으로 전체 재계산.
 *
 * How: ~/.claude/projects/ 하위 legend-team 폴더의 .jsonl 스캔 →
 *   첫 /open 타임스탬프 기준 session_index.json startedAt에 최근접 매칭 →
 *   aggregateTokens (수정된 파서) →
 *   token_log.json 재작성.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';

interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  messageCount: number;
  masterTurns: number;
  total_billable: number;
}

interface Entry {
  capturedAt: string;
  cliSessionId: string | null;
  legendSessionId: string | null;
  transcriptPath: string;
  usage: Usage;
}

const ROOT = path.resolve(__dirname, '..');
const SESSION_INDEX = path.join(ROOT, 'memory/sessions/session_index.json');
const TOKEN_LOG = path.join(ROOT, 'memory/sessions/token_log.json');
const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');

async function aggregate(transcriptPath: string): Promise<Usage> {
  const sums: Usage = {
    input_tokens: 0, output_tokens: 0,
    cache_creation_input_tokens: 0, cache_read_input_tokens: 0,
    messageCount: 0, masterTurns: 0, total_billable: 0,
  };
  if (!fs.existsSync(transcriptPath)) return sums;
  const rl = readline.createInterface({
    input: fs.createReadStream(transcriptPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'user') {
        const c = obj?.message?.content;
        const isMasterTurn =
          typeof c === 'string' ||
          (Array.isArray(c) && c[0]?.type === 'text');
        if (isMasterTurn) sums.masterTurns += 1;
      }
      const usage = obj?.message?.usage || obj?.usage;
      if (usage) {
        sums.input_tokens += usage.input_tokens || 0;
        sums.output_tokens += usage.output_tokens || 0;
        sums.cache_creation_input_tokens += usage.cache_creation_input_tokens || 0;
        sums.cache_read_input_tokens += usage.cache_read_input_tokens || 0;
        sums.messageCount += 1;
      }
    } catch {}
  }
  sums.total_billable =
    sums.input_tokens + sums.output_tokens +
    sums.cache_creation_input_tokens + sums.cache_read_input_tokens;
  return sums;
}

async function findFirstOpenTs(transcriptPath: string): Promise<string | null> {
  const rl = readline.createInterface({
    input: fs.createReadStream(transcriptPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      if (o.type === 'user') {
        const c = o?.message?.content;
        const text = typeof c === 'string' ? c
          : (Array.isArray(c) && c[0]?.type === 'text' ? c[0].text || '' : '');
        if (text.includes('/open') && (text.includes('<command-name>') || text.startsWith('/open'))) {
          return o.timestamp || null;
        }
      }
    } catch {}
  }
  return null;
}

async function main() {
  const idx = JSON.parse(fs.readFileSync(SESSION_INDEX, 'utf-8'));
  const sessions: Array<{ sessionId: string; startedAt: string }> = idx.sessions;

  // Scan project dirs
  const dirs = fs.readdirSync(PROJECTS_DIR).filter(d => /legend-team/i.test(d));
  const mapped: Record<string, { file: string; openTs: string; usage: Usage }> = {};

  for (const d of dirs) {
    const dirPath = path.join(PROJECTS_DIR, d);
    if (!fs.statSync(dirPath).isDirectory()) continue;
    for (const f of fs.readdirSync(dirPath)) {
      if (!f.endsWith('.jsonl')) continue;
      const fp = path.join(dirPath, f);
      const stat = fs.statSync(fp);
      if (stat.size < 1000) continue;
      if (stat.mtime < new Date('2026-04-01')) continue;

      const openTs = await findFirstOpenTs(fp);
      if (!openTs) continue;

      // Find nearest startedAt within 6 hours
      const openMs = new Date(openTs).getTime();
      let best: { sessionId: string; diff: number } | null = null;
      for (const s of sessions) {
        if (!s.startedAt) continue;
        const diff = Math.abs(new Date(s.startedAt).getTime() - openMs);
        if (diff > 6 * 3600 * 1000) continue;
        if (!best || diff < best.diff) best = { sessionId: s.sessionId, diff };
      }
      if (!best) continue;

      const usage = await aggregate(fp);

      // Merge into existing (multiple transcripts may map to same session)
      const existing = mapped[best.sessionId];
      if (!existing || usage.messageCount > existing.usage.messageCount) {
        // Prefer larger transcript; but if multiple, sum them
        if (existing) {
          usage.input_tokens += existing.usage.input_tokens;
          usage.output_tokens += existing.usage.output_tokens;
          usage.cache_creation_input_tokens += existing.usage.cache_creation_input_tokens;
          usage.cache_read_input_tokens += existing.usage.cache_read_input_tokens;
          usage.messageCount += existing.usage.messageCount;
          usage.masterTurns += existing.usage.masterTurns;
          usage.total_billable =
            usage.input_tokens + usage.output_tokens +
            usage.cache_creation_input_tokens + usage.cache_read_input_tokens;
        }
        mapped[best.sessionId] = { file: fp, openTs, usage };
      } else {
        existing.usage.input_tokens += usage.input_tokens;
        existing.usage.output_tokens += usage.output_tokens;
        existing.usage.cache_creation_input_tokens += usage.cache_creation_input_tokens;
        existing.usage.cache_read_input_tokens += usage.cache_read_input_tokens;
        existing.usage.messageCount += usage.messageCount;
        existing.usage.masterTurns += usage.masterTurns;
        existing.usage.total_billable =
          existing.usage.input_tokens + existing.usage.output_tokens +
          existing.usage.cache_creation_input_tokens + existing.usage.cache_read_input_tokens;
      }
    }
  }

  // Write token_log.json
  const entries: Entry[] = Object.entries(mapped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([legendSessionId, v]) => ({
      capturedAt: new Date().toISOString(),
      cliSessionId: path.basename(v.file, '.jsonl'),
      legendSessionId,
      transcriptPath: v.file,
      usage: v.usage,
    }));

  const out = { entries, lastUpdated: new Date().toISOString() };
  fs.writeFileSync(TOKEN_LOG, JSON.stringify(out, null, 2) + '\n');

  console.log(`Backfilled ${entries.length} sessions:`);
  for (const e of entries) {
    console.log(`  ${e.legendSessionId}  msg=${e.usage.messageCount}  master=${e.usage.masterTurns}  billable=${e.usage.total_billable}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
