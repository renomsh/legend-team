#!/usr/bin/env node
/**
 * SessionEnd hook — 세션 종료 시 agentsCompleted/decisions/topic을
 * current_session.json에서 session_index.json으로 자동 전파.
 * 그 후 system_state.json fast-path를 재계산한다.
 *
 * 실행 조건:
 *   - current_session.json.status === 'closed' 인 경우만 동작
 *   - 이미 /close에서 status가 closed로 바뀐 뒤 SessionEnd가 발동한다고 가정
 *
 * 원칙:
 *   - 에러 발생 시에도 hook 체인 중단 방지를 위해 process.exit(0)
 *   - append-session.ts 로직을 인라인으로 재구현 (TS 컴파일 의존 제거)
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CWD = process.env.FINALIZE_CWD || process.cwd();
const CURRENT_SESSION_PATH = process.env.FINALIZE_CURRENT_SESSION || path.join(CWD, 'memory', 'sessions', 'current_session.json');
const SESSION_INDEX_PATH = process.env.FINALIZE_SESSION_INDEX || path.join(CWD, 'memory', 'sessions', 'session_index.json');

function log(msg) {
  console.error(`[session-end-finalize] ${msg}`);
}

function readJson(p, fallback) {
  try {
    const raw = fs.readFileSync(p, 'utf8').trim();
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

/**
 * 세션 종료 시 editor가 agentsCompleted에 없으면 무조건 자동 push.
 * Dev 작업 포함 모든 세션의 기록 주체는 editor. reportPath 유무와 무관.
 * current_session.json도 함께 갱신하여 session_index 전파 전 일관성 유지.
 */
function ensureEditorInAgents(sess) {
  const agents = Array.isArray(sess.agentsCompleted) ? sess.agentsCompleted : [];
  if (!agents.includes('editor')) {
    agents.push('editor');
    sess.agentsCompleted = agents;
    // turns에도 반영 (마지막 turn으로 추가)
    const turns = Array.isArray(sess.turns) ? sess.turns : [];
    turns.push({ role: 'editor', turnIdx: turns.length, phase: 'output' });
    sess.turns = turns;
    writeJson(CURRENT_SESSION_PATH, sess);
    log('editor → agentsCompleted + turns 자동 push (reports 저장 확인)');
    return true;
  }
  return false;
}

function appendOrUpdateSessionIndex(sess) {
  const index = readJson(SESSION_INDEX_PATH, { sessions: [] });
  if (!Array.isArray(index.sessions)) index.sessions = [];

  const existing = index.sessions.find(s => s.sessionId === sess.sessionId);
  // cwd: hook이 발동된 디렉토리 = 세션이 실행된 worktree 경로.
  // session-end-tokens.js의 tier 3 fallback이 이 값을 조회해 transcript를 역탐색한다.
  const sessionCwd = sess.cwd || CWD;
  const entry = {
    sessionId: sess.sessionId,
    topicSlug: sess.topicSlug,
    ...(sess.topic && { topic: sess.topic }),
    startedAt: sess.startedAt,
    closedAt: sess.closedAt || null,
    cwd: sessionCwd,
    ...(Array.isArray(sess.masterDecisions) && sess.masterDecisions.length > 0 && { decisions: sess.masterDecisions }),
    ...(Array.isArray(sess.agentsCompleted) && sess.agentsCompleted.length > 0 && { agentsCompleted: sess.agentsCompleted }),
    // D-048: Turn[] 전파
    ...(Array.isArray(sess.turns) && sess.turns.length > 0 && { turns: sess.turns }),
    ...(Array.isArray(sess.plannedSequence) && sess.plannedSequence.length > 0 && { plannedSequence: sess.plannedSequence }),
    ...(sess.grade && { grade: sess.grade }),
    ...(sess.legacy === true && { legacy: true }),
    ...(Array.isArray(sess.notes) && sess.notes.length > 0 && { note: sess.notes.join(' | ') }),
  };

  if (existing) {
    Object.assign(existing, entry);
    log(`session_index 업데이트: ${sess.sessionId}`);
  } else {
    index.sessions.push(entry);
    log(`session_index append: ${sess.sessionId} (total ${index.sessions.length})`);
  }

  index.lastUpdated = new Date().toISOString();
  writeJson(SESSION_INDEX_PATH, index);
  return index.sessions.length;
}

function runSyncSystemState() {
  const tsPath = path.join(CWD, 'scripts', 'sync-system-state.ts');
  if (!fs.existsSync(tsPath)) {
    log('sync-system-state.ts 없음, 스킵');
    return;
  }
  // npx ts-node 대신 기존 패턴 재사용
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';
  const result = spawnSync(cmd, ['ts-node', tsPath], {
    cwd: CWD,
    encoding: 'utf8',
    shell: isWin,
  });
  if (result.status !== 0) {
    log(`sync-system-state 실패 (code ${result.status}): ${result.stderr || ''}`);
  } else {
    log('sync-system-state 완료');
  }
}

(async () => {
  try {
    // stdin 소비 (hook protocol) — 사용하지는 않음
    let _raw = '';
    process.stdin.on('data', chunk => (_raw += chunk));
    await new Promise(resolve => process.stdin.on('end', resolve));

    if (!fs.existsSync(CURRENT_SESSION_PATH)) {
      log('current_session.json 없음, 스킵');
      process.exit(0);
    }

    const sess = readJson(CURRENT_SESSION_PATH, null);
    if (!sess) {
      log('current_session.json 파싱 실패, 스킵');
      process.exit(0);
    }

    if (sess.status !== 'closed') {
      log(`status=${sess.status} (closed 아님), 스킵`);
      process.exit(0);
    }

    if (!sess.sessionId || !sess.topicSlug || !sess.startedAt) {
      log('필수 필드 누락, 스킵');
      process.exit(0);
    }

    ensureEditorInAgents(sess);
    appendOrUpdateSessionIndex(sess);
    runSyncSystemState();

    log(`완료 — ${sess.sessionId} (turns=${(sess.turns || []).length}, agents=${(sess.agentsCompleted || []).length}, decisions=${(sess.masterDecisions || []).length})`);
    process.exit(0);
  } catch (err) {
    log(`error: ${err.message}`);
    process.exit(0);
  }
})();
