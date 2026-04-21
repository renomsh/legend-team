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
 * 세션 종료 시 editor가 turns에 없으면 무조건 자동 push.
 * Dev 작업 포함 모든 세션의 기록 주체는 editor. reportPath 유무와 무관.
 * current_session.json도 함께 갱신하여 session_index 전파 전 일관성 유지.
 *
 * PD-020b P0.3c (session_060): turns[] = 단일 원천. agentsCompleted는 turns에서 파생.
 * 기존 Set-의미 중복제거 버그 근절 (RK-1, D-048 "중복 허용 배열" 위반).
 */
function ensureEditorInAgents(sess) {
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const turnRoles = turns.map(t => t && t.role).filter(r => typeof r === 'string');
  const hasEditor = turnRoles.includes('editor');

  if (!hasEditor) {
    turns.push({ role: 'editor', turnIdx: turns.length, phase: 'compile' });
    sess.turns = turns;
    turnRoles.push('editor');
  }
  // agentsCompleted는 turns.role 순서대로·중복 허용 배열로 재생성
  sess.agentsCompleted = turnRoles;

  writeJson(CURRENT_SESSION_PATH, sess);
  if (!hasEditor) {
    log('editor turn 자동 push + agentsCompleted를 turns에서 재생성');
    return true;
  }
  log('agentsCompleted를 turns에서 재생성 (중복 허용, 순서 보존)');
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

/**
 * P5 (session_061): L2 session_contributions writer 호출.
 * topicId 없거나 legacy 세션이면 skip.
 * 실패해도 hook 체인 중단하지 않음.
 */
function runL2Writer(sess) {
  const topicId = sess.topicId;
  const sessionId = sess.sessionId;
  if (!topicId) {
    log('L2-writer skip: topicId 없음');
    return;
  }
  if (sess.legacy) {
    log(`L2-writer skip: legacy 세션 (${sessionId})`);
    return;
  }

  const scriptPath = path.join(CWD, 'scripts', 'write-session-contribution.ts');
  if (!fs.existsSync(scriptPath)) {
    log('L2-writer skip: write-session-contribution.ts 없음');
    return;
  }

  // nextAction 추출: sess.nextAction 필드 우선, 없으면 sess.notes[0]
  const nextAction = sess.nextAction
    || (Array.isArray(sess.notes) && sess.notes.length > 0 ? sess.notes[0] : undefined);

  const args = ['ts-node', scriptPath, topicId, sessionId];
  if (nextAction) args.push(`--next-action=${nextAction}`);

  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';
  const result = require('child_process').spawnSync(cmd, args, {
    cwd: CWD,
    encoding: 'utf8',
    shell: isWin,
  });
  if (result.status !== 0) {
    log(`L2-writer 실패 (code ${result.status}): ${result.stderr || result.stdout || ''}`);
  } else {
    log(`L2-writer 완료 — ${topicId}/${sessionId}`);
  }
}

/**
 * P5 (session_061): L3 context_brief regenerator 호출.
 * topicId 없거나 legacy 세션이면 skip.
 * 실패해도 hook 체인 중단하지 않음.
 */
function runL3Regenerator(sess) {
  const topicId = sess.topicId;
  if (!topicId) {
    log('L3-regenerator skip: topicId 없음');
    return;
  }
  if (sess.legacy) {
    log(`L3-regenerator skip: legacy 세션 (${sess.sessionId})`);
    return;
  }

  const scriptPath = path.join(CWD, 'scripts', 'regenerate-context-brief.ts');
  if (!fs.existsSync(scriptPath)) {
    log('L3-regenerator skip: regenerate-context-brief.ts 없음');
    return;
  }

  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';
  const result = require('child_process').spawnSync(cmd, ['ts-node', scriptPath, topicId], {
    cwd: CWD,
    encoding: 'utf8',
    shell: isWin,
  });
  if (result.status !== 0) {
    log(`L3-regenerator 실패 (code ${result.status}): ${result.stderr || result.stdout || ''}`);
  } else {
    log(`L3-regenerator 완료 — ${topicId}`);
  }
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
    runL2Writer(sess);
    runL3Regenerator(sess);
    runSyncSystemState();

    log(`완료 — ${sess.sessionId} (turns=${(sess.turns || []).length}, agents=${(sess.agentsCompleted || []).length}, decisions=${(sess.masterDecisions || []).length})`);
    process.exit(0);
  } catch (err) {
    log(`error: ${err.message}`);
    process.exit(0);
  }
})();
