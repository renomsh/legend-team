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
 * 세션 종료 시 edi가 turns에 없으면 무조건 자동 push.
 * Dev 작업 포함 모든 세션의 기록 주체는 edi. reportPath 유무와 무관.
 * current_session.json도 함께 갱신하여 session_index 전파 전 일관성 유지.
 *
 * PD-020b P0.3c (session_060): turns[] = 단일 원천. agentsCompleted는 turns에서 파생.
 * 기존 Set-의미 중복제거 버그 근절 (RK-1, D-048 "중복 허용 배열" 위반).
 */
// D-074 (session_093): auditInlineMainViolations 제거. D-058 dispatcher 폐기로 invocationMode 개념 삭제.

function ensureEdiInAgents(sess) {
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const turnRoles = turns.map(t => t && t.role).filter(r => typeof r === 'string');
  const hasEdi = turnRoles.includes('edi');

  if (!hasEdi) {
    turns.push({ role: 'edi', turnIdx: turns.length, phase: 'compile' });
    sess.turns = turns;
    turnRoles.push('edi');
  }
  // agentsCompleted는 turns.role 순서대로·중복 허용 배열로 재생성
  sess.agentsCompleted = turnRoles;

  writeJson(CURRENT_SESSION_PATH, sess);
  if (!hasEdi) {
    log('edi turn 자동 push + agentsCompleted를 turns에서 재생성');
    return true;
  }
  log('agentsCompleted를 turns에서 재생성 (중복 허용, 순서 보존)');
  return false;
}

/**
 * D-074 (session_093): agentsCompleted를 turns[].role에서 단순 파생.
 * D-058 폐기로 invocationMode/subagentId 조건 삭제. legacy 가드 유지.
 */
function filterAgentsCompletedByDualSatisfaction(sess) {
  if (sess.legacy === true) {
    log(`[agents] legacy 세션 ${sess.sessionId}: agentsCompleted 동결`);
    return;
  }
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  sess.agentsCompleted = turns
    .filter(t => t && typeof t.role === 'string')
    .map(t => t.role);
  log(`[agents] agentsCompleted turns에서 재생성: ${sess.agentsCompleted.length}건`);
}

function appendOrUpdateSessionIndex(sess) {
  const index = readJson(SESSION_INDEX_PATH, { sessions: [] });
  if (!Array.isArray(index.sessions)) index.sessions = [];

  const existing = index.sessions.find(s => s.sessionId === sess.sessionId);

  // D-070 (session_091, topic_096) — immutable snapshot 가드.
  // immutable=true entry는 어떤 갱신 시도도 차단 (기준 #8: session_090 snapshot 유지).
  if (existing && existing.immutable === true) {
    log(`[immutable] ${sess.sessionId} entry는 immutable=true (frozenAt=${existing.frozenAt || 'unknown'}). 갱신 차단 → no-op + gap 박제`);
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({
      type: 'immutable-update-blocked',
      sessionId: sess.sessionId,
      frozenAt: existing.frozenAt || null,
      attemptedAt: new Date().toISOString(),
      ref: 'D-070',
    });
    writeJson(CURRENT_SESSION_PATH, sess);
    return index.sessions.length;
  }
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
    // P3-A (PD-036): oneLineSummary — 없으면 placeholder 삽입 (G3 안전장치)
    oneLineSummary: sess.oneLineSummary || `[summary 없음 — ${sess.topicSlug}]`,
    // P3-A (PD-036): decisionsAdded — sess.decisions(string[]) 또는 masterDecisions ID 목록 재사용
    decisionsAdded: (() => {
      if (Array.isArray(sess.decisionsAdded) && sess.decisionsAdded.length > 0) return sess.decisionsAdded;
      if (Array.isArray(sess.masterDecisions) && sess.masterDecisions.length > 0) {
        return sess.masterDecisions.map(d => (typeof d === 'string' ? d : (d && d.id ? d.id : String(d))));
      }
      return [];
    })(),
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

/**
 * A6-4 Edi 역검사 (D-055): PD 누락 여부 경고.
 * 실패해도 hook 체인 중단하지 않음.
 */
function runCheckPendingDeferrals(sess) {
  const scriptPath = path.join(CWD, 'scripts', 'check-pending-deferrals.ts');
  if (!fs.existsSync(scriptPath)) {
    log('check-pending-deferrals skip: 스크립트 없음');
    return;
  }
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';
  const result = spawnSync(cmd, ['ts-node', scriptPath], {
    cwd: CWD,
    encoding: 'utf8',
    shell: isWin,
  });
  const output = (result.stdout || '') + (result.stderr || '');
  if (output.includes('⚠️')) {
    log(`[PD 역검사 경고]\n${output.trim()}`);
  } else {
    log('PD 역검사 완료 — 이상 없음');
  }
}

/**
 * P3-A (PD-036): topic_index.json의 closedInSession 필드 기록.
 * set-closed-in-session.ts를 호출하여 topicId가 있는 세션의 종결 세션 ID를 박제.
 * 실패 시 sess.gaps에 기록하고 hook 체인 계속 (조용한 실패 금지).
 */
function updateClosedInSession(sess) {
  const topicId = sess.topicId;
  const sessionId = sess.sessionId;
  if (!topicId) {
    log('updateClosedInSession skip: topicId 없음');
    return;
  }
  if (sess.legacy) {
    log(`updateClosedInSession skip: legacy 세션 (${sessionId})`);
    return;
  }

  const scriptPath = path.join(CWD, 'scripts', 'set-closed-in-session.ts');
  if (!fs.existsSync(scriptPath)) {
    log('updateClosedInSession skip: set-closed-in-session.ts 없음');
    return;
  }

  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';
  const result = spawnSync(cmd, ['ts-node', scriptPath, '--topicId', topicId, '--sessionId', sessionId], {
    cwd: CWD,
    encoding: 'utf8',
    shell: isWin,
  });

  if (result.status !== 0) {
    const errMsg = (result.stderr || result.stdout || '').trim();
    log(`updateClosedInSession 실패 (code ${result.status}): ${errMsg}`);
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({ type: 'topic-index-write-failed', topicId, sessionId, detail: errMsg });
    writeJson(CURRENT_SESSION_PATH, sess);
  } else {
    log(`updateClosedInSession 완료 — ${topicId}.closedInSession = "${sessionId}"`);
  }
}

/**
 * D-057 — framing 토픽 자동 종결 dry-run + PD 자동 전이 dry-run.
 * 저마찰 원칙: 훅 체인에서는 dry-run만 실행하여 로그로 제안 출력.
 * 실제 적용은 마스터가 --apply로 재호출 (무응답=해당 제안 보류).
 */
function runAutoCloseDryRun() {
  const scriptPath = path.join(CWD, 'scripts', 'auto-close-topics.ts');
  if (!fs.existsSync(scriptPath)) {
    log('auto-close-topics skip: 스크립트 없음');
    return;
  }
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';
  const result = spawnSync(cmd, ['ts-node', scriptPath], {
    cwd: CWD, encoding: 'utf8', shell: isWin,
  });
  const out = (result.stdout || '').trim();
  if (out.includes('proposals: 0')) {
    log('auto-close dry-run — 제안 없음');
  } else if (out) {
    log(`[auto-close dry-run 제안]\n${out}`);
  }
}

function runResolvePDDryRun() {
  const scriptPath = path.join(CWD, 'scripts', 'resolve-pending-deferrals.ts');
  if (!fs.existsSync(scriptPath)) {
    log('resolve-pending-deferrals skip: 스크립트 없음');
    return;
  }
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'npx.cmd' : 'npx';
  const result = spawnSync(cmd, ['ts-node', scriptPath], {
    cwd: CWD, encoding: 'utf8', shell: isWin,
  });
  const out = (result.stdout || '').trim();
  if (out.includes('matches: 0') && !out.includes('⚠')) {
    log('resolve-PD dry-run — 전이 제안 없음');
  } else if (out) {
    log(`[resolve-PD dry-run]\n${out}`);
  }
}

/**
 * D-101 (session_119, PD-039 resolved): close.md 14단계 중 LLM 자율 수행 4개 핵심 단계
 * (3 decision_ledger / 4 topic_index / 6 master_feedback / 7 role_memory) delta-check.
 * 누락 검출 시 WARN 출력 (ERROR 게이트 아님 — Master 인지 후 재-close로 보완).
 */
function runChecklistDeltaCheck(sess) {
  const warns = [];
  const sessionStartMs = sess.startedAt ? Date.parse(sess.startedAt) : 0;

  // Step 3 — decision_ledger: sess.decisions/masterDecisions에 D-NNN가 있으면 ledger에 박혀 있어야
  const sessDecisions = [...(sess.decisions || []), ...(sess.masterDecisions || [])];
  const dIds = sessDecisions
    .map(d => (d && d.id) || '')
    .filter(id => /^D-\d+$/.test(id));
  if (dIds.length > 0) {
    const ledgerPath = path.join(CWD, 'memory', 'shared', 'decision_ledger.json');
    const ledger = readJson(ledgerPath, { decisions: [] });
    const ledgerIds = new Set((ledger.decisions || []).map(d => d.id));
    const missing = dIds.filter(id => !ledgerIds.has(id));
    if (missing.length > 0) {
      warns.push(`Step 3 누락 — decision_ledger에 미반영: ${missing.join(', ')}`);
    }
  }

  // Step 4 — topic_index: 현 세션의 topicId 엔트리 status가 open이면 누락 의심
  if (sess.topicId) {
    const tiPath = path.join(CWD, 'memory', 'shared', 'topic_index.json');
    const ti = readJson(tiPath, { topics: [] });
    const entry = (ti.topics || []).find(t => t.id === sess.topicId);
    if (entry && entry.status === 'open') {
      warns.push(`Step 4 누락 — topic_index ${sess.topicId} status=open (completed/suspended/in-progress 미전환)`);
    }
  }

  // Step 6 — master_feedback_log: sess.masterFeedback에 항목이 있으면 log에도 박혀 있어야
  const mfCount = (sess.masterFeedback || []).length;
  if (mfCount > 0) {
    const mfPath = path.join(CWD, 'memory', 'master', 'master_feedback_log.json');
    const mf = readJson(mfPath, { feedback: [] });
    const arr = mf.feedback || mf.entries || [];
    const fromThisSession = arr.filter(e => e && e.sessionId === sess.sessionId).length;
    if (fromThisSession < mfCount) {
      warns.push(`Step 6 누락 — current_session.masterFeedback ${mfCount}건 중 master_feedback_log 반영 ${fromThisSession}건`);
    }
  }

  // Step 7 — role_memory: edi 외 역할이 turns에 있으면 해당 role memory mtime이 세션 시작 이후여야
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const speakingRoles = [...new Set(turns.map(t => t && t.role).filter(r => r && r !== 'edi'))];
  if (speakingRoles.length > 0 && sessionStartMs > 0) {
    const stale = [];
    for (const role of speakingRoles) {
      const rmPath = path.join(CWD, 'memory', 'roles', `${role}_memory.json`);
      if (!fs.existsSync(rmPath)) continue;
      const stat = fs.statSync(rmPath);
      if (stat.mtimeMs < sessionStartMs) {
        stale.push(role);
      }
    }
    if (stale.length > 0) {
      warns.push(`Step 7 누락 가능 — role_memory mtime < 세션 시작: ${stale.join(', ')}`);
    }
  }

  if (warns.length > 0) {
    log(`⚠ checklist delta-check (${warns.length}건):`);
    for (const w of warns) log(`  - ${w}`);
    log(`  → Master 재-close로 보완 권고`);
  } else {
    log('checklist delta-check OK (4 단계 정상)');
  }
}

/**
 * Asset #2 (PD-033 / topic_121, Arki rev4 Sec 2.4) — PD-043 inline-role-header 검증.
 *
 * reports/{date}_{topicSlug}/*.md frontmatter parse → turns[]와 cross-check.
 * mismatch 검출 시 sess.gaps[]에 박제. 차단 X (warning만).
 *
 * 검증 항목:
 *   1. frontmatter `role`이 turns[turnId].role와 일치
 *   2. 본문 H1 헤더(`# {ROLE} —`)가 frontmatter role과 일치 (PD-043 사칭 검출)
 *
 * Master 메인 컨텍스트가 Agent 툴 미경유 상태로 직접 작성한 라인은 frontmatter 자체가
 * 없거나 turnId 매핑이 깨지므로 turns[]와의 cross-check에서 자동 검출됨.
 */
function validateInlineRoleHeaders(sess) {
  if (!sess.reportPath) {
    log('inline-role-headers skip: reportPath 없음');
    return;
  }
  const reportsDir = path.join(CWD, sess.reportPath);
  if (!fs.existsSync(reportsDir)) {
    log(`inline-role-headers skip: ${sess.reportPath} 없음`);
    return;
  }

  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const violations = [];

  let files = [];
  try {
    files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.md'));
  } catch {
    log('inline-role-headers skip: reports dir read 실패');
    return;
  }

  for (const f of files) {
    const filePath = path.join(reportsDir, f);
    let content = '';
    try { content = fs.readFileSync(filePath, 'utf8'); } catch { continue; }

    // frontmatter parse — 단순 YAML 정규식 (key: value)
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      // frontmatter 부재 — Main 직접 작성 의심
      violations.push({
        type: 'inline-role-header-missing-frontmatter',
        file: path.posix.join(sess.reportPath.replace(/\\/g, '/'), f),
      });
      continue;
    }

    const fmText = fmMatch[1];
    const roleMatch = fmText.match(/^role:\s*(\S+)/m);
    const turnIdMatch = fmText.match(/^turnId:\s*(\d+)/m);
    const role = roleMatch ? roleMatch[1].toLowerCase() : null;
    const turnId = turnIdMatch ? parseInt(turnIdMatch[1], 10) : null;

    if (!role || turnId === null) continue; // 식별 불가 — skip

    // turns[]와 cross-check
    if (turnId < turns.length) {
      const turnRole = turns[turnId] && turns[turnId].role;
      if (turnRole && turnRole.toLowerCase() !== role) {
        violations.push({
          type: 'inline-role-header-mismatch',
          file: path.posix.join(sess.reportPath.replace(/\\/g, '/'), f),
          expected: role,
          actualInTurns: turnRole,
          turnId,
        });
      }
    }

    // 본문 H1 ↔ frontmatter role
    const h1Match = content.match(/^#\s+(\w+)/m);
    if (h1Match) {
      const h1Role = h1Match[1].toLowerCase();
      const KNOWN = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer'];
      if (KNOWN.includes(h1Role) && h1Role !== role) {
        violations.push({
          type: 'inline-role-header-h1-mismatch',
          file: path.posix.join(sess.reportPath.replace(/\\/g, '/'), f),
          frontmatterRole: role,
          h1Role,
        });
      }
    }
  }

  if (violations.length > 0) {
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    for (const v of violations) sess.gaps.push(v);
    writeJson(CURRENT_SESSION_PATH, sess);
    log(`⚠ inline-role-header 위반 ${violations.length}건 → gaps 박제`);
    for (const v of violations) log(`  - ${v.type}: ${v.file}`);
  } else {
    log('inline-role-header 검증 OK (위반 0건)');
  }
}

/**
 * R-6 (topic_127 P4, 2026-04-28) — turns[].selfScores 스케일 검증.
 * selfScores 값이 [0, 100] 범위를 벗어나거나 숫자가 아닌 경우 gaps 박제. 차단 X.
 * D-092: selfScores: {shortKey: value} 포맷. 유효 범위 0~100.
 */
function checkSelfScoreScale(sess) {
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const violations = [];

  for (const turn of turns) {
    if (!turn || !turn.selfScores || typeof turn.selfScores !== 'object') continue;
    for (const [key, val] of Object.entries(turn.selfScores)) {
      if (val === 'deferred' || val === null || val === undefined) continue;
      const num = Number(val);
      if (isNaN(num)) continue; // Y/N 등 비숫자 값은 스케일 검증 대상 아님
      if (num < 0 || num > 100) {
        violations.push({ role: turn.role, turnIdx: turn.turnIdx, key, val, reason: 'out-of-range' });
      }
    }
  }

  if (violations.length > 0) {
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({ type: 'self-score-scale-violation', count: violations.length, detail: violations });
    log(`⚠ selfScores 스케일 위반 ${violations.length}건 → gaps 박제`);
    for (const v of violations) log(`  - turn[${v.turnIdx}] ${v.role}.${v.key}=${v.val} (${v.reason})`);
  } else {
    log('selfScores 스케일 검증 OK');
  }
}

/**
 * P3 (topic_127, 2026-04-28) — _common.md 100줄 cap 검증.
 * 초과 시 sess.gaps에 'common-policy-over-cap' 박제. 차단 X.
 */
function checkCommonPolicyCap(sess) {
  const commonPath = path.join(CWD, 'memory', 'roles', 'policies', '_common.md');
  try {
    if (!fs.existsSync(commonPath)) {
      log('_common.md 없음 — cap 검증 스킵');
      return;
    }
    const lineCount = fs.readFileSync(commonPath, 'utf8').split('\n').length;
    if (lineCount > 100) {
      sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
      sess.gaps.push({ type: 'common-policy-over-cap', lineCount, cap: 100 });
      log(`⚠ _common.md ${lineCount}줄 — 100줄 cap 초과 → gaps 박제`);
    } else {
      log(`_common.md cap 검증 OK (${lineCount}줄)`);
    }
  } catch (e) {
    log(`checkCommonPolicyCap 오류: ${e.message}`);
  }
}

/**
 * Asset #1 v2 (PD-033 / D-103, 2026-04-28 개선) — Edi 보고서 session_contributions 복사.
 * 세션 종료 시 Edi 최종 보고서를 topics/{topicId}/session_contributions/{sessionId}_edi_report.md 에 복사.
 * 다음 세션의 pre-tool-use-task.js가 이 파일을 읽어 토픽 layer inject에 사용함.
 */
function copyEdiReportToSessionContributions(sess) {
  const topicId = sess.topicId;
  const sessionId = sess.sessionId;
  const reportPath = sess.reportPath;

  if (!topicId || !sessionId || !reportPath) {
    log('copyEdiReport skip: topicId/sessionId/reportPath 없음');
    return;
  }
  if (sess.legacy) {
    log(`copyEdiReport skip: legacy 세션 (${sessionId})`);
    return;
  }

  // Edi 최신 rev 파일 찾기 — LLM 작성 edi_rev*.md만 (auto-compiled 제외) [R-1, R-8 mitigation]
  const reportsDir = path.join(CWD, reportPath);
  if (!fs.existsSync(reportsDir)) {
    log(`copyEdiReport skip: reportsDir 없음 (${reportPath})`);
    return;
  }

  let ediFiles = [];
  try {
    ediFiles = fs.readdirSync(reportsDir)
      .filter(f => /^edi_rev\d+\.md$/.test(f)); // edi_auto_rev*.md 제외
  } catch {
    log('copyEdiReport skip: reportsDir read 실패');
    return;
  }

  // auto-compiled frontmatter 가진 파일 추가 제외 (R-1: 파일명 분리 우회 방어)
  ediFiles = ediFiles.filter(f => {
    try {
      const head = fs.readFileSync(path.join(reportsDir, f), 'utf8').slice(0, 500);
      return !/^auto-compiled:\s*true/m.test(head);
    } catch { return true; }
  });

  if (ediFiles.length === 0) {
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({
      type: 'edi-llm-report-absent',
      sessionId,
      reportPath,
      grade: sess.grade || null,
      note: 'LLM Edi 작성 edi_rev*.md 부재 — session_contributions 복사 skip',
    });
    writeJson(CURRENT_SESSION_PATH, sess);
    log('copyEdiReport skip: LLM Edi 보고서 없음 (auto-compiled 파일 제외) → gaps 박제');
    return;
  }

  // mtime 최신 1건
  let latestEdi = null, latestMtime = 0;
  for (const f of ediFiles) {
    try {
      const stat = fs.statSync(path.join(reportsDir, f));
      if (stat.mtimeMs > latestMtime) { latestEdi = f; latestMtime = stat.mtimeMs; }
    } catch {}
  }
  if (!latestEdi) return;

  const srcPath = path.join(reportsDir, latestEdi);
  const scDir = path.join(CWD, 'topics', topicId, 'session_contributions');
  try {
    fs.mkdirSync(scDir, { recursive: true });
  } catch {}

  const destName = `${sessionId}_edi_report.md`;
  const destPath = path.join(scDir, destName);

  try {
    const content = fs.readFileSync(srcPath, 'utf8');
    fs.writeFileSync(destPath, content, 'utf8');
    log(`copyEdiReport 완료 — ${topicId}/session_contributions/${destName} (${content.length} chars)`);
  } catch (e) {
    log(`copyEdiReport 실패: ${e && e.message}`);
  }
}

/**
 * D-131 (PD-053, session_147, topic_133, 2026-04-30) — Hybrid C L1 mechanical compile.
 *
 * Edi LLM 미호출 세션의 fallback 보고서 자동 생성. LLM 호출 X (current_session.json fields만 사용).
 *
 * 출력: reports/{reportPath}/edi_auto_rev1.md  (네임스페이스 분리 — R-1 mitigation)
 * frontmatter `auto-compiled: true` 마킹.
 *
 * versionBump 필드는 박제하지 않음 (참조 인용만 — R-4 mitigation).
 *
 * 작동 조건:
 *   - reportPath 존재
 *   - LLM 작성 edi_rev*.md 부재 (auto-compiled 아닌 것)
 * 그렇지 않으면 skip (LLM 산출물 보존).
 */
function synthesizeMechanicalEdiReport(sess) {
  const reportPath = sess.reportPath;
  if (!reportPath) {
    log('synthesizeMechanicalEdi skip: reportPath 없음');
    return;
  }
  if (sess.legacy) {
    log(`synthesizeMechanicalEdi skip: legacy 세션 (${sess.sessionId})`);
    return;
  }

  const reportsDir = path.join(CWD, reportPath);
  try { fs.mkdirSync(reportsDir, { recursive: true }); } catch {}

  // LLM Edi 보고서 존재 검사 (auto-compiled 제외)
  let llmEdiExists = false;
  try {
    const files = fs.readdirSync(reportsDir).filter(f => /^edi_rev\d+\.md$/.test(f));
    for (const f of files) {
      try {
        const head = fs.readFileSync(path.join(reportsDir, f), 'utf8').slice(0, 500);
        if (!/^auto-compiled:\s*true/m.test(head)) { llmEdiExists = true; break; }
      } catch {}
    }
  } catch {}

  if (llmEdiExists) {
    log('synthesizeMechanicalEdi skip: LLM Edi 보고서 존재 — 보존');
    return;
  }

  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const masterDecisions = Array.isArray(sess.masterDecisions) ? sess.masterDecisions : [];
  const notes = Array.isArray(sess.notes) ? sess.notes : [];
  const gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
  const pdAdded = Array.isArray(sess.pendingDeferralsAdded) ? sess.pendingDeferralsAdded : [];
  const pdResolved = Array.isArray(sess.pendingDeferralsResolved) ? sess.pendingDeferralsResolved : [];

  // 신규 D-NNN — decisions ledger와 cross-ref
  const newDecisions = [];
  try {
    const ledgerPath = path.join(CWD, 'memory', 'shared', 'decision_ledger.json');
    const ledger = readJson(ledgerPath, { decisions: [] });
    const ledgerIds = new Set((ledger.decisions || []).map(d => d.id));
    const candidates = [...(sess.decisions || []), ...masterDecisions];
    for (const c of candidates) {
      const id = (c && c.id) || (typeof c === 'string' && /^D-\d+$/.test(c) ? c : null);
      if (id && ledgerIds.has(id)) newDecisions.push(id);
    }
  } catch {}

  const turnsTable = turns.length > 0
    ? '| # | role | phase | recallReason | source |\n|---|---|---|---|---|\n' +
      turns.map((t, i) => `| ${i} | ${t.role || '-'} | ${t.phase || '-'} | ${t.recallReason || '-'} | ${t.source || '-'} |`).join('\n')
    : '_turns 없음_';

  const masterDecList = masterDecisions.length > 0
    ? masterDecisions.map((d, i) => `${i + 1}. ${typeof d === 'string' ? d : (d.id || JSON.stringify(d))}`).join('\n')
    : '_없음_';

  const newDecList = newDecisions.length > 0 ? newDecisions.map(id => `- ${id}`).join('\n') : '_없음_';
  const notesBlock = notes.length > 0 ? notes.map(n => `- ${n}`).join('\n') : '_없음_';
  const gapsBlock = gaps.length > 0 ? gaps.map(g => `- ${g.type || 'unknown'}: ${JSON.stringify(g)}`).join('\n') : '_없음_';
  const pdAddedStr = pdAdded.length > 0 ? pdAdded.join(', ') : '없음';
  const pdResolvedStr = pdResolved.length > 0 ? pdResolved.join(', ') : '없음';

  const vbs = sess.versionBumpSuggested;
  const vbBlock = vbs
    ? `- 자동 감지: +${vbs.value} (${vbs.type})\n- 사유: ${vbs.reason}\n- 변경 파일: ${vbs.changedFilesCount || (vbs.changedFiles || []).length}건\n- ⚠ **Edi LLM 미호출 — 본 mechanical은 \`versionBump\` 필드를 박제하지 않습니다** (role-edi.md §6.4 + R-4 mitigation).`
    : '_변경 없음 — bump 0_';

  const inheritance = (sess.nextAction || notes[0] || '_없음_');

  const turnIdx = turns.length;
  const date = (sess.startedAt || '').slice(0, 10);

  const body = `---
role: edi
session: ${sess.sessionId}
topic: ${sess.topicId || '-'}
topicSlug: ${sess.topicSlug || '-'}
date: ${date}
turnId: ${turnIdx}
rev: 1
auto-compiled: true
auto-compiled-at: ${new Date().toISOString()}
authorship: hook:session-end-finalize.js
---

# Edi (auto-compiled) — ${sess.topicSlug || '-'}

> ⚠ **AUTO-COMPILED** — turns=${turns.length}, masterDecisions=${masterDecisions.length}, gaps=${gaps.length}, decisionsAdded=${newDecisions.length}.
> **Edi LLM 미호출 → mechanical fallback** (D-131 Hybrid C L1). authorship: hook (\`session-end-finalize.js#synthesizeMechanicalEdiReport\`).
> 본 보고서는 LLM 합성 없이 \`current_session.json\` 필드를 기계 컴파일한 결과입니다. 의미 해석·우선순위 판단은 부재합니다.

## 1. Executive Summary

${sess.oneLineSummary || `[summary 없음 — ${sess.topicSlug || '?'}]`}

## 2. 결정 흐름 (turns)

${turnsTable}

## 3. Master 결정

${masterDecList}

## 4. 신규 D-NNN 박제 (decision_ledger 신규 항목)

${newDecList}

## 5. PD 변동

- 추가: ${pdAddedStr}
- 해소: ${pdResolvedStr}

## 6. Notes & Gaps

### Notes
${notesBlock}

### Gaps
${gapsBlock}

## 7. versionBump (참조 인용 — 미확정)

${vbBlock}

## 8. 인계 메모

${inheritance}

## 9. 세션 종결 readiness

\`logs/hook-diagnostics.log\`의 \`checklist delta-check\` 항목 참조.
`;

  const destPath = path.join(reportsDir, 'edi_auto_rev1.md');
  try {
    fs.writeFileSync(destPath, body, 'utf8');
    log(`synthesizeMechanicalEdi 완료 — ${reportPath}/edi_auto_rev1.md (${body.length} chars)`);
  } catch (e) {
    log(`synthesizeMechanicalEdi 실패: ${e && e.message}`);
  }
}

/**
 * D-131 (PD-053, session_147, topic_133, 2026-04-30) — Hybrid C L2 enforcement.
 *
 * Edi LLM 호출 검증 + 다축 5신호 박제 (R-2, R-5 mitigation).
 *
 * Detection:
 *   - turns에 {role:'edi', source:'agent'} 있으면 LLM 호출됨
 *   - 또는 reports/.../edi_rev*.md 중 auto-compiled 아닌 것 존재
 *
 * Grade D는 enforcement 면제 (info-level만, R-6 mitigation).
 * Grade A/B/S에서 LLM 미호출 시:
 *   1. gaps 'edi-llm-skipped' 박제
 *   2. system_state.openMasterAlerts prepend
 *   3. master_feedback_log auto-entry severity=high
 *   4. log 출력 (dashboard 카운터 source)
 */
function auditEdiLlmInvocation(sess) {
  const grade = (sess.grade || '').toUpperCase();
  const isEnforced = grade === 'A' || grade === 'B' || grade === 'S';

  // LLM Edi 호출 검출
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const llmEdiTurn = turns.some(t => t && t.role === 'edi' && t.source === 'agent');

  let llmEdiFile = false;
  if (sess.reportPath) {
    const reportsDir = path.join(CWD, sess.reportPath);
    if (fs.existsSync(reportsDir)) {
      try {
        const files = fs.readdirSync(reportsDir).filter(f => /^edi_rev\d+\.md$/.test(f));
        for (const f of files) {
          try {
            const head = fs.readFileSync(path.join(reportsDir, f), 'utf8').slice(0, 500);
            if (!/^auto-compiled:\s*true/m.test(head)) { llmEdiFile = true; break; }
          } catch {}
        }
      } catch {}
    }
  }

  const llmEdiPresent = llmEdiTurn || llmEdiFile;

  if (llmEdiPresent) {
    log(`auditEdiLlm OK — LLM Edi 검출 (turn=${llmEdiTurn}, file=${llmEdiFile})`);
    return;
  }

  if (!isEnforced) {
    log(`auditEdiLlm info — Grade ${grade || 'unknown'} (enforcement 면제), mechanical fallback만 박제`);
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({
      type: 'mechanical-fallback-graded',
      sessionId: sess.sessionId,
      grade: grade || null,
      severity: 'info',
    });
    writeJson(CURRENT_SESSION_PATH, sess);
    return;
  }

  // Grade A/B/S — 다축 5신호 박제
  const ts = new Date().toISOString();

  // 신호 1: gaps 박제
  sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
  sess.gaps.push({
    type: 'edi-llm-skipped',
    sessionId: sess.sessionId,
    grade,
    severity: 'high',
    detectedAt: ts,
    note: 'Grade A/B/S 세션에서 Edi LLM 미호출 — mechanical fallback 박제됨',
  });
  writeJson(CURRENT_SESSION_PATH, sess);

  // 신호 2: openMasterAlerts prepend
  try {
    const statePath = path.join(CWD, 'memory', 'shared', 'system_state.json');
    if (fs.existsSync(statePath)) {
      const state = readJson(statePath, null);
      if (state) {
        if (!Array.isArray(state.openMasterAlerts)) state.openMasterAlerts = [];
        const dup = state.openMasterAlerts.some(a => a && a.type === 'edi-llm-skipped' && a.sessionId === sess.sessionId);
        if (!dup) {
          state.openMasterAlerts.unshift({
            type: 'edi-llm-skipped',
            sessionId: sess.sessionId,
            topicId: sess.topicId || null,
            grade,
            severity: 'high',
            detectedAt: ts,
          });
          state.lastUpdated = ts;
          writeJson(statePath, state);
        }
      }
    }
  } catch (e) {
    log(`auditEdiLlm openMasterAlerts 실패: ${e && e.message}`);
  }

  // 신호 3: master_feedback_log auto-entry
  try {
    const mfPath = path.join(CWD, 'memory', 'master', 'master_feedback_log.json');
    if (fs.existsSync(mfPath)) {
      const mf = readJson(mfPath, { feedbackLog: [] });
      const arr = mf.feedbackLog || mf.feedback || mf.entries;
      if (Array.isArray(arr)) {
        const dup = arr.some(e => e && e.source === 'hook' && e.sessionId === sess.sessionId && e.type === 'edi-llm-skipped');
        if (!dup) {
          const nextId = `MF-AUTO-${sess.sessionId}-edi`;
          arr.push({
            id: nextId,
            date: ts.slice(0, 10),
            session: sess.sessionId,
            sessionId: sess.sessionId,
            topic: sess.topicId || null,
            type: 'edi-llm-skipped',
            severity: 'high',
            source: 'hook',
            feedback: `Grade ${grade} 세션 ${sess.sessionId}에서 Edi LLM 미호출 — mechanical fallback(edi_auto_rev1.md) 박제됨. role-edi.md §6.4 검토 필요.`,
            status: 'pending',
          });
          writeJson(mfPath, mf);
        }
      }
    }
  } catch (e) {
    log(`auditEdiLlm master_feedback_log 실패: ${e && e.message}`);
  }

  // 신호 4: 로그 (dashboard 카운터 소스)
  log(`⚠ auditEdiLlm — Grade ${grade} 세션에서 Edi LLM 미호출 → 다축 4신호 박제 (gaps + openMasterAlerts + master_feedback_log + 본 로그). frontmatter auto-compiled:true는 synthesizeMechanicalEdiReport에서 박제.`);
}

/**
 * PD-052 (2026-04-28): 역할 사칭 사후 탐지 — source 마킹 기반.
 *
 * post-tool-use-task.js가 Agent 툴 경유 turns에 source='agent'를 박제한다.
 * source 없는 turns는 Phase 1 배포 이전 legacy-unmarked로 분류 (false-positive 방지).
 * violations 실제 생성 조건: source='agent' turn의 role 변조 탐지 시 (향후 확장 지점).
 *
 * PD-033 준수 전제: extractRole() null 반환 시 turn push skip → turnIdx 갭 탐지는 Phase 5 후속.
 */
function auditRoleImpersonation(sess) {
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  let legacyUnmarkedCount = 0;

  for (const turn of turns) {
    if (!turn || typeof turn.role !== 'string') continue;

    if (turn.source === 'agent') {
      // 정상 Agent 경유 turn — violations 대상 아님
      continue;
    }

    // source 없음 또는 'agent' 아님 → legacy-unmarked (Phase 1 배포 전 turn)
    legacyUnmarkedCount++;
  }

  if (legacyUnmarkedCount > 0) {
    log(`[PD-052] legacy-unmarked turns ${legacyUnmarkedCount}건 (source 미마킹, violations 미생성)`);
  } else {
    log('[PD-052] auditRoleImpersonation OK — violations 0건');
  }
}

/**
 * current_session.pendingDeferralsResolved 배열 기반으로 system_state.pendingDeferrals 갱신.
 * resolved 처리된 PD를 system_state에서 status='resolved'로 마킹.
 */
function applyPendingDeferralsResolved(sess) {
  const resolved = Array.isArray(sess.pendingDeferralsResolved) ? sess.pendingDeferralsResolved : [];
  if (resolved.length === 0) {
    log('pendingDeferralsResolved 없음 — skip');
    return;
  }

  const statePath = path.join(CWD, 'memory', 'shared', 'system_state.json');
  if (!fs.existsSync(statePath)) {
    log('applyPendingDeferralsResolved skip: system_state.json 없음');
    return;
  }

  let state;
  try {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (e) {
    log(`applyPendingDeferralsResolved skip: 파싱 실패 — ${e && e.message}`);
    return;
  }

  if (!Array.isArray(state.pendingDeferrals)) {
    log('applyPendingDeferralsResolved skip: pendingDeferrals 없음');
    return;
  }

  let changed = 0;
  for (const pd of state.pendingDeferrals) {
    if (resolved.includes(pd.id) && pd.status !== 'resolved') {
      pd.status = 'resolved';
      pd.resolvedInSession = sess.sessionId || null;
      changed++;
    }
  }

  if (changed > 0) {
    try {
      writeJson(statePath, state);
      log(`applyPendingDeferralsResolved 완료 — ${changed}건 resolved: ${resolved.join(', ')}`);
    } catch (e) {
      log(`applyPendingDeferralsResolved 실패: ${e && e.message}`);
    }
  } else {
    log(`applyPendingDeferralsResolved — resolved 대상 없음 (${resolved.join(', ')} 이미 resolved 또는 미존재)`);
  }
}

/**
 * D-130 (session_146, topic_131, 2026-04-30): versionBump 자동 감지.
 *
 * Nexus 자동 감지 → versionBumpSuggested 박제 → Edi 세션 종료 시 확정 (D-130 책임 분배).
 *
 * 감지 카테고리 (CLAUDE.md D-130 매핑):
 *   - structural (+0.1): persona/policy/skill SKILL.md / CLAUDE.md / role *_memory.json
 *   - capacity (+0.01): decision_ledger.json / dispatch_config.json / .claude/hooks (paths)
 *   - bugfix (+0.001): scripts (paths) OR .ts/.js files, Grade C/D 한정
 *
 * 인정 임계값: 변경 파일 ≥ 1건 + reason 자동 생성. 세션당 최대 +0.1 캡.
 *
 * 출력: sess.versionBumpSuggested = { value, type, reason, autoDetectedAt, changedFiles, changedFilesCount, cappedAt }
 *
 * Edi가 확정 시: sess.versionBump = { value, reason, ... } 박제 (별도 turn 책임).
 *               이미 sess.versionBump가 있으면 auto-detect skip (Edi 수동 박제 우선).
 */
function detectVersionBump(sess) {
  if (sess.versionBump && (sess.versionBump.value || sess.versionBump.to)) {
    log('detectVersionBump skip: versionBump 이미 박제됨 (Edi 수동 우선)');
    return;
  }

  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: CWD,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    log(`detectVersionBump skip: git status 실패 (code ${result.status})`);
    return;
  }

  const lines = (result.stdout || '').split('\n').filter(Boolean);
  const files = lines
    .map(l => l.slice(3).trim().replace(/\\/g, '/'))
    .filter(Boolean);

  if (files.length === 0) {
    log('detectVersionBump: 변경 파일 0건 — bump 없음');
    return;
  }

  const categories = { structural: [], capacity: [], bugfix: [] };

  for (const f of files) {
    if (
      f.startsWith('memory/roles/personas/') ||
      f.startsWith('memory/roles/policies/') ||
      (f.startsWith('.claude/skills/') && f.endsWith('SKILL.md')) ||
      f === 'CLAUDE.md' ||
      (f.startsWith('memory/roles/') && f.endsWith('_memory.json'))
    ) {
      categories.structural.push(f);
    } else if (
      f === 'memory/shared/decision_ledger.json' ||
      f === 'memory/shared/dispatch_config.json' ||
      f.startsWith('.claude/hooks/')
    ) {
      categories.capacity.push(f);
    } else if (
      f.startsWith('scripts/') ||
      (f.endsWith('.ts') || f.endsWith('.js'))
    ) {
      categories.bugfix.push(f);
    }
  }

  let bumpValue = 0;
  let bumpType = 'none';
  if (categories.structural.length > 0) {
    bumpValue = 0.1;
    bumpType = 'structural';
  } else if (categories.capacity.length > 0) {
    bumpValue = 0.01;
    bumpType = 'capacity';
  } else if (
    categories.bugfix.length > 0 &&
    (sess.grade === 'C' || sess.grade === 'D')
  ) {
    bumpValue = 0.001;
    bumpType = 'bugfix';
  }

  if (bumpValue === 0) {
    log('detectVersionBump: 인정 카테고리 매칭 없음 — bump 없음');
    return;
  }

  const sample = categories[bumpType].slice(0, 3).join(', ');
  const more = categories[bumpType].length > 3 ? ' …' : '';
  let reason;
  if (bumpType === 'structural') {
    reason = `구조 변경 자동 감지: persona/policy/skill/CLAUDE.md ${categories.structural.length}건 (${sample}${more})`;
  } else if (bumpType === 'capacity') {
    reason = `역량 확장 자동 감지: ledger/dispatch_config/hooks ${categories.capacity.length}건 (${sample}${more})`;
  } else {
    reason = `버그·패치 자동 감지 (Grade ${sess.grade || 'unknown'}): ${categories.bugfix.length}건 (${sample}${more})`;
  }

  sess.versionBumpSuggested = {
    value: bumpValue,
    type: bumpType,
    reason,
    autoDetectedAt: new Date().toISOString(),
    changedFiles: files.slice(0, 20),
    changedFilesCount: files.length,
    cappedAt: 0.1,
    confirmedBy: null,
  };

  writeJson(CURRENT_SESSION_PATH, sess);
  log(`versionBumpSuggested = +${bumpValue} (${bumpType}) | ${categories.structural.length}/${categories.capacity.length}/${categories.bugfix.length} files | Edi 확정 대기`);
}

/**
 * D-104 (2026-04-28): versionBump 자동 전파.
 * current_session.json에 versionBump 필드가 있으면 project_charter.json에 반영.
 * 없으면 pass (경고 없음).
 */
function applyVersionBump(sess) {
  const bump = sess.versionBump;
  if (!bump || !bump.to || !bump.reason) {
    log('versionBump 없음 — project_charter 업데이트 skip');
    return;
  }
  // R-4 mitigation (D-131, PD-053): Edi LLM 확정만 인정
  if (bump.confirmedBy !== 'edi' || !bump.confirmedAt) {
    log(`applyVersionBump skip: confirmedBy='${bump.confirmedBy}' (edi 아님) 또는 confirmedAt 부재 — Edi LLM 검증 미통과`);
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({
      type: 'version-bump-unverified',
      sessionId: sess.sessionId,
      attempted: bump,
      note: 'confirmedBy !== edi 또는 confirmedAt 부재 — project_charter 미반영',
    });
    writeJson(CURRENT_SESSION_PATH, sess);
    return;
  }

  const charterPath = path.join(CWD, 'memory', 'shared', 'project_charter.json');
  if (!fs.existsSync(charterPath)) {
    log('applyVersionBump skip: project_charter.json 없음');
    return;
  }

  let charter;
  try {
    charter = JSON.parse(fs.readFileSync(charterPath, 'utf8'));
  } catch (e) {
    log(`applyVersionBump skip: project_charter.json 파싱 실패 — ${e && e.message}`);
    return;
  }

  const prevVersion = charter.charter && charter.charter.version;
  charter.charter.version = bump.to;
  charter.lastUpdated = new Date().toISOString().slice(0, 10);

  // history 배열에 이미 해당 버전이 없으면 추가
  if (!Array.isArray(charter.history)) charter.history = [];
  const alreadyExists = charter.history.some(h => h.version === bump.to);
  if (!alreadyExists) {
    charter.history.push({
      version: bump.to,
      date: charter.lastUpdated,
      summary: bump.reason,
      sessionId: sess.sessionId || null,
    });
  }

  try {
    writeJson(charterPath, charter);
    log(`applyVersionBump 완료 — ${prevVersion} → ${bump.to} (${bump.reason})`);
  } catch (e) {
    log(`applyVersionBump 실패: ${e && e.message}`);
  }
}

/**
 * D-124 (session_141): Ace ack TTL escalate stub.
 *
 * master_feedback_log.json에서 status='pending' AND acknowledgedBy='ace' 항목 중
 * (현재 sessionId - ackedSessionId) >= TTL_SESSIONS 인 entry를
 * system_state.json.openMasterAlerts 배열에 prepend (중복 제거).
 *
 * Phase A v0 (본 세션 박제): TTL=2 세션. 단순 문자열 비교 (session_141 - session_139 = 2).
 * 누락 필드는 graceful skip (zombie data 방지). ackReason 50자 의무는 별도 hook(P2 후속).
 */
function escalateAceAcksWithTTL(sess) {
  const TTL_SESSIONS = 2;
  const STATE_PATH = path.join(CWD, 'memory', 'shared', 'system_state.json');
  const FEEDBACK_PATH = path.join(CWD, 'memory', 'master', 'master_feedback_log.json');

  if (!fs.existsSync(STATE_PATH)) {
    log('system_state.json 없음, openMasterAlerts 스킵');
    return;
  }
  const state = readJson(STATE_PATH, null);
  if (!state) return;
  if (!Array.isArray(state.openMasterAlerts)) state.openMasterAlerts = [];

  if (!fs.existsSync(FEEDBACK_PATH)) {
    // 빈 alerts 배열 보존, write back skip
    writeJson(STATE_PATH, state);
    log('master_feedback_log.json 없음, openMasterAlerts 빈 배열 유지');
    return;
  }
  const feedback = readJson(FEEDBACK_PATH, null);
  if (!feedback) return;

  const entries = Array.isArray(feedback) ? feedback : (feedback.entries || feedback.feedback || []);
  if (!Array.isArray(entries) || entries.length === 0) {
    writeJson(STATE_PATH, state);
    return;
  }

  const currentSid = sess.sessionId || state.lastSessionId;
  if (!currentSid) return;
  const currentN = parseInt(String(currentSid).replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(currentN)) return;

  const stale = [];
  for (const e of entries) {
    if (!e || typeof e !== 'object') continue;
    if (e.status !== 'pending') continue;
    if (e.acknowledgedBy !== 'ace') continue;
    const ackedSid = e.ackedSessionId;
    if (!ackedSid) continue;
    const ackedN = parseInt(String(ackedSid).replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(ackedN)) continue;
    if (currentN - ackedN >= TTL_SESSIONS) {
      stale.push({
        type: 'ace_ack_stale',
        feedbackId: e.id || null,
        ackedSessionId: ackedSid,
        currentSessionId: currentSid,
        ttl: TTL_SESSIONS,
        escalatedAt: new Date().toISOString(),
      });
    }
  }

  // prepend + dedup by feedbackId (keep newest escalatedAt)
  if (stale.length > 0) {
    const existingIds = new Set(state.openMasterAlerts.map(a => a && a.feedbackId).filter(Boolean));
    const toPrepend = stale.filter(s => !existingIds.has(s.feedbackId));
    state.openMasterAlerts = [...toPrepend, ...state.openMasterAlerts];
    log(`Ace ack TTL escalate: +${toPrepend.length} entries to openMasterAlerts`);
  }

  state.lastUpdated = new Date().toISOString();
  writeJson(STATE_PATH, state);
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

    checkSelfScoreScale(sess);
    checkCommonPolicyCap(sess);
    ensureEdiInAgents(sess);
    filterAgentsCompletedByDualSatisfaction(sess);
    validateInlineRoleHeaders(sess);
    auditRoleImpersonation(sess); // PD-052
    auditEdiLlmInvocation(sess); // D-131 (PD-053): L2 enforcement — 다축 5신호
    synthesizeMechanicalEdiReport(sess); // D-131 (PD-053): L1 mechanical fallback (LLM 미호출 시 edi_auto_rev1.md 박제)
    copyEdiReportToSessionContributions(sess);
    writeJson(CURRENT_SESSION_PATH, sess);
    appendOrUpdateSessionIndex(sess);
    runL2Writer(sess);
    runL3Regenerator(sess);
    runCheckPendingDeferrals(sess);
    updateClosedInSession(sess);
    runAutoCloseDryRun();
    runResolvePDDryRun();
    runChecklistDeltaCheck(sess);
    applyPendingDeferralsResolved(sess);
    detectVersionBump(sess); // D-130: Nexus 자동 감지 → versionBumpSuggested 박제
    applyVersionBump(sess);
    escalateAceAcksWithTTL(sess);
    runSyncSystemState();

    log(`완료 — ${sess.sessionId} (turns=${(sess.turns || []).length}, agents=${(sess.agentsCompleted || []).length}, decisions=${(sess.masterDecisions || []).length})`);
    process.exit(0);
  } catch (err) {
    log(`error: ${err.message}`);
    process.exit(0);
  }
})();
