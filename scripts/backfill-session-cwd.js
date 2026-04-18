/**
 * backfill-session-cwd.js
 *
 * token_log.json의 transcriptPath(확정 매핑)에서 worktree 이름을 추출하고
 * session_index.json의 cwd 필드에 기록한다.
 *
 * 왜 token_log를 소스로 쓰는가:
 *   - append-missing-tokens.ts가 이미 세션↔worktree 매핑을 정확히 확인함
 *   - hook-diagnostics.log의 타임스탬프 휴리스틱보다 신뢰도 높음
 *
 * 1회성 복구 스크립트. 이후엔 session-end-finalize.js가 자동 기록.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKEN_LOG = path.join(ROOT, 'memory', 'sessions', 'token_log.json');
const SESSION_INDEX = path.join(ROOT, 'memory', 'sessions', 'session_index.json');

const tokenLog = JSON.parse(fs.readFileSync(TOKEN_LOG, 'utf-8'));
const idx = JSON.parse(fs.readFileSync(SESSION_INDEX, 'utf-8'));

let updated = 0;
for (const entry of tokenLog.entries) {
  if (!entry.legendSessionId || !entry.transcriptPath) continue;

  // transcriptPath example:
  //   C:\Users\...\projects\C--Projects-legend-team--claude-worktrees-sad-dhawan-15d3e3\uuid.jsonl
  const projectDir = path.basename(path.dirname(entry.transcriptPath));

  // Extract worktree name from encoded project dir
  const m = projectDir.match(/--claude-worktrees-(.+)$/i);
  if (!m || !m[1]) continue;

  const worktreeName = m[1];
  const sessionCwd = ['C:', 'Projects', 'legend-team', '.claude', 'worktrees', worktreeName].join(path.sep);

  const sess = idx.sessions.find(s => s.sessionId === entry.legendSessionId);
  if (sess && !sess.cwd) {
    sess.cwd = sessionCwd;
    console.log(entry.legendSessionId, '->', sessionCwd);
    updated++;
  }
}

if (updated > 0) {
  idx.lastUpdated = new Date().toISOString();
  fs.writeFileSync(SESSION_INDEX, JSON.stringify(idx, null, 2) + '\n');
  console.log('session_index.json updated:', updated, 'sessions');
} else {
  console.log('No updates needed');
}
