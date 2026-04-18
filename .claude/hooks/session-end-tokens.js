#!/usr/bin/env node
/**
 * SessionEnd hook — transcript .jsonl을 파싱하여 세션 토큰 사용량을 집계한다.
 * 결과를 memory/sessions/token_log.json에 append(중복 시 덮어쓰기)하고,
 * current_session.json의 tokenUsage 필드에도 기록한다.
 *
 * Hook input (stdin JSON): { session_id, transcript_path, cwd, ... }
 * D-024 Phase 3a 경로 (i) 구현.
 * PD-007: 동일 legendSessionId 중복 방지 (덮어쓰기)
 * PD-008: masterTurns 분리 파싱 (type=human 필터)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

// Bug 1 fix: worktree sessions store transcripts in worktree-specific project dirs.
// When the provided path doesn't exist, search ~/.claude/projects/ for the UUID.
// PD-016: when transcript_path is entirely missing, use cliSessionId as the UUID.
// PD-016 v2 (session_040): when BOTH transcript_path and cliSessionId are missing,
// derive project dir from cwd and pick the most recently modified .jsonl — this is
// the case that dropped session_035~039 cache data.
function cwdToProjectDirName(cwd) {
  // Claude Code encodes cwd as folder name by replacing ':', '\', '/', '.'
  // all with '-'. E.g. 'C:\Projects\legend-team\.claude\worktrees\foo' becomes
  // 'C--Projects-legend-team--claude-worktrees-foo'. Case varies — match case-insensitively.
  return cwd.replace(/[\\/:.]/g, '-');
}

function findRecentJsonlByCwd(cwd, projectsDir) {
  const target = cwdToProjectDirName(cwd).toLowerCase();
  // Also allow fuzzy match: worktree paths contain '--claude-worktrees-<name>',
  // but the jsonl might live in either the worktree dir OR parent project dir.
  const parent = cwdToProjectDirName(cwd.replace(/[\\/]\.claude[\\/]worktrees[\\/][^\\/]+.*$/i, '')).toLowerCase();
  const candidates = [];
  for (const dir of fs.readdirSync(projectsDir)) {
    const low = dir.toLowerCase();
    if (low !== target && low !== parent) continue;
    const dp = path.join(projectsDir, dir);
    if (!fs.statSync(dp).isDirectory()) continue;
    for (const f of fs.readdirSync(dp)) {
      if (!f.endsWith('.jsonl')) continue;
      const fp = path.join(dp, f);
      try {
        const st = fs.statSync(fp);
        candidates.push({ fp, mtime: st.mtimeMs, size: st.size });
      } catch {}
    }
  }
  // Most recently modified, non-empty
  candidates.sort((a, b) => b.mtime - a.mtime);
  const fresh = candidates.find(c => c.size > 0 && (Date.now() - c.mtime) < 15 * 60 * 1000);
  return fresh ? fresh.fp : (candidates[0]?.fp || null);
}

function resolveTranscriptPath(transcriptPath, cliSessionId, cwd) {
  if (transcriptPath && fs.existsSync(transcriptPath)) return transcriptPath;
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(projectsDir)) return transcriptPath || null;

  // Tier 1: UUID lookup (transcript_path basename or cliSessionId)
  const uuid = transcriptPath ? path.basename(transcriptPath) : cliSessionId;
  if (uuid) {
    for (const dir of fs.readdirSync(projectsDir)) {
      const candidate = path.join(projectsDir, dir, uuid);
      if (fs.existsSync(candidate)) return candidate;
      const candidateJsonl = path.join(projectsDir, dir, `${uuid}.jsonl`);
      if (fs.existsSync(candidateJsonl)) return candidateJsonl;
    }
  }

  // Tier 2: cwd-based fallback — most recent .jsonl in matching project dir.
  // Covers the session_035~039 drop: hook fired with transcript=MISSING cliSession=null
  // from worktree cwds, so UUID lookup had nothing to resolve.
  if (cwd) {
    const recent = findRecentJsonlByCwd(cwd, projectsDir);
    if (recent) return recent;
  }

  // Tier 3: session_index.json lookup — read the most recent open session's cwd
  // and retry findRecentJsonlByCwd with that cwd. Handles the edge case where
  // hook fires with a different cwd than the actual session worktree.
  try {
    const indexPath = path.join(cwd || process.cwd(), 'memory', 'sessions', 'session_index.json');
    if (fs.existsSync(indexPath)) {
      const idx = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      const sessions = (idx.sessions || []).filter(s => s.cwd);
      // Try from newest to oldest
      for (let i = sessions.length - 1; i >= 0; i--) {
        const sessionCwd = sessions[i].cwd;
        if (sessionCwd && sessionCwd !== cwd) {
          const recent = findRecentJsonlByCwd(sessionCwd, projectsDir);
          if (recent) return recent;
        }
      }
    }
  } catch {}

  return transcriptPath || null;
}

async function aggregateTokens(transcriptPath) {
  const sums = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    messageCount: 0,
    masterTurns: 0,
    total_billable: 0, // Bug 3 fix: initialize here so early return is safe
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

      // PD-008: Master 입력 턴 카운트
      // Claude Code transcript는 type='user'를 사용하지만 tool_result도 같은 type을 씀.
      // 진짜 master 입력은 content가 string이거나 첫 블록이 type='text'인 경우만.
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
    } catch {
      // skip malformed lines
    }
  }
  sums.total_billable =
    sums.input_tokens + sums.output_tokens + sums.cache_creation_input_tokens + sums.cache_read_input_tokens;
  return sums;
}

function appendLog(cwd, record) {
  const logPath = path.join(cwd, 'memory', 'sessions', 'token_log.json');
  let log = { entries: [], lastUpdated: null };
  if (fs.existsSync(logPath)) {
    try {
      log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
      if (!Array.isArray(log.entries)) log.entries = [];
    } catch {
      log = { entries: [], lastUpdated: null };
    }
  }

  // 동일 legendSessionId가 있으면 누산(compaction으로 분할된 경우), 없으면 append
  const existingIdx = record.legendSessionId
    ? log.entries.findIndex((e) => e.legendSessionId === record.legendSessionId)
    : -1;
  if (existingIdx >= 0) {
    const prev = log.entries[existingIdx].usage || {};
    const cur = record.usage || {};
    const merged = {
      input_tokens: (prev.input_tokens||0) + (cur.input_tokens||0),
      output_tokens: (prev.output_tokens||0) + (cur.output_tokens||0),
      cache_creation_input_tokens: (prev.cache_creation_input_tokens||0) + (cur.cache_creation_input_tokens||0),
      cache_read_input_tokens: (prev.cache_read_input_tokens||0) + (cur.cache_read_input_tokens||0),
      messageCount: (prev.messageCount||0) + (cur.messageCount||0),
      masterTurns: (prev.masterTurns||0) + (cur.masterTurns||0),
    };
    merged.total_billable = merged.input_tokens + merged.output_tokens + merged.cache_creation_input_tokens + merged.cache_read_input_tokens;
    log.entries[existingIdx] = { ...log.entries[existingIdx], ...record, usage: merged, capturedAt: record.capturedAt };
  } else {
    log.entries.push(record);
  }

  log.lastUpdated = new Date().toISOString();
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n');
}

function updateCurrentSession(cwd, usage) {
  const sessPath = path.join(cwd, 'memory', 'sessions', 'current_session.json');
  if (!fs.existsSync(sessPath)) return null;
  try {
    const sess = JSON.parse(fs.readFileSync(sessPath, 'utf-8'));
    sess.tokenUsage = usage;
    fs.writeFileSync(sessPath, JSON.stringify(sess, null, 2) + '\n');
    return sess.sessionId || null;
  } catch {
    return null;
  }
}

function logDiag(cwd, msg) {
  try {
    const p = path.join(cwd, 'logs', 'hook-diagnostics.log');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, `[${new Date().toISOString()}] [session-end-tokens] ${msg}\n`);
  } catch {}
}

(async () => {
  const firedAt = new Date().toISOString();
  try {
    const raw = await readStdin();
    const input = raw ? JSON.parse(raw) : {};
    const transcriptPath = input.transcript_path;
    const cwd = input.cwd || process.cwd();
    const cliSessionId = input.session_id || null;

    logDiag(cwd, `FIRED transcript=${transcriptPath || 'MISSING'} cliSession=${cliSessionId || 'null'} cwd=${cwd}`);

    // PD-016: if transcript_path missing, attempt cliSessionId-based reverse lookup
    // PD-016 v2: if cliSessionId also missing, fall back to cwd-based recent .jsonl
    const resolvedPath = resolveTranscriptPath(transcriptPath, cliSessionId, cwd);
    if (!transcriptPath && resolvedPath) {
      logDiag(cwd, `PD-016 FALLBACK: transcript_path missing, found via cliSessionId at ${resolvedPath}`);
    } else if (resolvedPath && resolvedPath !== transcriptPath) {
      logDiag(cwd, `FALLBACK: found transcript at ${resolvedPath}`);
    }

    // Abort only when no path could be resolved at all
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      const reason = !resolvedPath
        ? 'transcript_path missing and cliSessionId fallback found nothing'
        : `transcript file not found at ${transcriptPath} (fallback also failed)`;
      logDiag(cwd, `ABORT: ${reason}`);
      process.exit(0);
    }

    const usage = await aggregateTokens(resolvedPath);
    const legendSessionId = updateCurrentSession(cwd, usage);

    appendLog(cwd, {
      capturedAt: new Date().toISOString(),
      cliSessionId,
      legendSessionId,
      transcriptPath: resolvedPath,
      usage,
    });

    console.error(
      `[session-end-tokens] ${legendSessionId || cliSessionId} total=${usage.total_billable} master=${usage.masterTurns} msg=${usage.messageCount}`
    );
    logDiag(cwd, `OK legend=${legendSessionId || 'null'} total=${usage.total_billable} master=${usage.masterTurns} msg=${usage.messageCount}`);
    process.exit(0);
  } catch (err) {
    console.error('[session-end-tokens] error:', err.message);
    try { logDiag(process.cwd(), `ERROR ${err.message}`); } catch {}
    process.exit(0);
  }
})();
