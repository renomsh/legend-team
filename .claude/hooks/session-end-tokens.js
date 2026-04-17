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
const readline = require('readline');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

async function aggregateTokens(transcriptPath) {
  const sums = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    messageCount: 0,
    masterTurns: 0,
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
      if (obj.type === 'human' || obj.role === 'user') {
        sums.masterTurns += 1;
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

  // PD-007: 동일 legendSessionId가 있으면 덮어쓰기, 없으면 append
  const existingIdx = record.legendSessionId
    ? log.entries.findIndex((e) => e.legendSessionId === record.legendSessionId)
    : -1;
  if (existingIdx >= 0) {
    log.entries[existingIdx] = record;
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

(async () => {
  try {
    const raw = await readStdin();
    const input = raw ? JSON.parse(raw) : {};
    const transcriptPath = input.transcript_path;
    const cwd = input.cwd || process.cwd();
    const cliSessionId = input.session_id || null;

    if (!transcriptPath) {
      console.error('[session-end-tokens] transcript_path missing');
      process.exit(0);
    }

    const usage = await aggregateTokens(transcriptPath);
    const legendSessionId = updateCurrentSession(cwd, usage);

    appendLog(cwd, {
      capturedAt: new Date().toISOString(),
      cliSessionId,
      legendSessionId,
      transcriptPath,
      usage,
    });

    console.error(
      `[session-end-tokens] ${legendSessionId || cliSessionId} total=${usage.total_billable} master=${usage.masterTurns} msg=${usage.messageCount}`
    );
    process.exit(0);
  } catch (err) {
    console.error('[session-end-tokens] error:', err.message);
    process.exit(0);
  }
})();
