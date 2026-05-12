// G1 split (D-188, session_242): session-index module — extracted from session-end-finalize.js.
const { fs, path, spawnSync, log, readJson, writeJson, CWD, CURRENT_SESSION_PATH, SESSION_INDEX_PATH } = require('./shared');

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

  const args = [topicId, sessionId];
  if (nextAction) args.push(`--next-action=${nextAction}`);

  try {
    const { main } = require(scriptPath);
    main(args);
    log(`L2-writer 완료 — ${topicId}/${sessionId}`);
  } catch (err) {
    const detail = String(err && err.message ? err.message : err).slice(0, 200);
    log(`L2-writer 실패: ${detail}`);
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({ type: 'spawn-failed', fn: 'runL2Writer', topicId, sessionId, detail });
    writeJson(CURRENT_SESSION_PATH, sess);
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

  try {
    const { main } = require(scriptPath);
    main([topicId]);
    log(`L3-regenerator 완료 — ${topicId}`);
  } catch (err) {
    const detail = String(err && err.message ? err.message : err).slice(0, 200);
    log(`L3-regenerator 실패: ${detail}`);
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({ type: 'spawn-failed', fn: 'runL3Regenerator', topicId, detail });
    writeJson(CURRENT_SESSION_PATH, sess);
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

  try {
    const { checkPendingDeferrals, formatDeferralCheckResult } = require(scriptPath);
    const result = checkPendingDeferrals();
    const out = formatDeferralCheckResult(result);
    if (out && out.includes('⚠️')) {
      log(`[PD 역검사 경고]\n${out.trim()}`);
    } else {
      log('PD 역검사 완료 — 이상 없음');
    }
  } catch (err) {
    const detail = String(err && err.message ? err.message : err).slice(0, 200);
    log(`check-pending-deferrals 실패: ${detail}`);
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({ type: 'spawn-failed', fn: 'runCheckPendingDeferrals', detail });
    writeJson(CURRENT_SESSION_PATH, sess);
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

  try {
    const { main } = require(scriptPath);
    main(['--topicId', topicId, '--sessionId', sessionId]);
    log(`updateClosedInSession 완료 — ${topicId}.closedInSession = "${sessionId}"`);
  } catch (err) {
    const errMsg = String(err && err.message ? err.message : err).slice(0, 200);
    log(`updateClosedInSession 실패: ${errMsg}`);
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({ type: 'topic-index-write-failed', topicId, sessionId, detail: errMsg });
    writeJson(CURRENT_SESSION_PATH, sess);
  }
}

/**
 * D-057 — framing 토픽 자동 종결 dry-run + PD 자동 전이 dry-run.
 * 저마찰 원칙: 훅 체인에서는 dry-run만 실행하여 로그로 제안 출력.
 * 실제 적용은 마스터가 --apply로 재호출 (무응답=해당 제안 보류).
 */

function applyPendingDeferralsResolved(sess) {
  const resolved = Array.isArray(sess.pendingDeferralsResolved) ? sess.pendingDeferralsResolved : [];
  if (resolved.length === 0) {
    log('pendingDeferralsResolved 없음 — skip');
    return;
  }

  const resolvedDate = new Date().toISOString().slice(0, 10);
  const sessionId = sess.sessionId || null;

  // 1. system_state.json pendingDeferrals 갱신 (mirror)
  const statePath = path.join(CWD, 'memory', 'shared', 'system_state.json');
  if (!fs.existsSync(statePath)) {
    log('applyPendingDeferralsResolved skip: system_state.json 없음');
  } else {
    let state;
    try {
      state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch (e) {
      log(`applyPendingDeferralsResolved system_state 파싱 실패 — ${e && e.message}`);
      state = null;
    }

    if (state && Array.isArray(state.pendingDeferrals)) {
      let changed = 0;
      for (const pd of state.pendingDeferrals) {
        if (resolved.includes(pd.id) && pd.status !== 'resolved') {
          pd.status = 'resolved';
          pd.resolvedInSession = sessionId;
          changed++;
        }
      }
      if (changed > 0) {
        try {
          writeJson(statePath, state);
          log(`applyPendingDeferralsResolved system_state 완료 — ${changed}건: ${resolved.join(', ')}`);
        } catch (e) {
          log(`applyPendingDeferralsResolved system_state 쓰기 실패: ${e && e.message}`);
        }
      } else {
        log(`applyPendingDeferralsResolved system_state — resolved 대상 없음 (${resolved.join(', ')})`);
      }
    }
  }

  // 2. pending_deferrals.json(SOT) 갱신 (PD-070)
  const pdPath = path.join(CWD, 'memory', 'shared', 'pending_deferrals.json');
  if (!fs.existsSync(pdPath)) {
    log('applyPendingDeferralsResolved skip: pending_deferrals.json 없음');
    return;
  }

  let pdFile;
  try {
    pdFile = JSON.parse(fs.readFileSync(pdPath, 'utf8'));
  } catch (e) {
    log(`applyPendingDeferralsResolved pending_deferrals 파싱 실패 — ${e && e.message}`);
    return;
  }

  if (!Array.isArray(pdFile.items)) {
    log('applyPendingDeferralsResolved skip: pending_deferrals.items 없음');
    return;
  }

  let sotChanged = 0;
  for (const item of pdFile.items) {
    if (resolved.includes(item.id) && item.status !== 'resolved') {
      item.status = 'resolved';
      item.resolvedAt = resolvedDate;
      item.resolvedBy = sessionId;
      sotChanged++;
    }
  }

  if (sotChanged > 0) {
    try {
      writeJson(pdPath, pdFile);
      log(`applyPendingDeferralsResolved SOT 완료 — ${sotChanged}건 resolved: ${resolved.join(', ')}`);
    } catch (e) {
      log(`applyPendingDeferralsResolved SOT 쓰기 실패: ${e && e.message}`);
    }
  } else {
    log(`applyPendingDeferralsResolved SOT — resolved 대상 없음 (${resolved.join(', ')} 이미 resolved 또는 미존재)`);
  }
}

/**
 * PD-071 (session_220, topic_186, 2026-05-09) — Nexus 직접 작업 세션 turns[] 자동삽입.
 *
 * Agent 툴 미경유 Nexus 직접 작업(Edit/Write/Bash 직접, 인라인 답변)은
 * pending_turns 경로를 거치지 않아 turns[]가 비어있는 채로 세션이 종료된다.
 * joinOrphanPendingTurns 이후에도 turns[] 비어있으면 Nexus 직접 작업 세션으로 판단하고
 * {role:'nexus', source:'direct'} 1건을 자동 삽입한다.
 *
 * 삽입 조건:
 *   - sess.legacy !== true
 *   - joinOrphanPendingTurns 이후에도 turns[] 비어있음
 *
 * 효과:
 *   - agentsCompleted: ['edi'] → ['nexus', 'edi']
 *   - session_index.turns 전파에 nexus turn 포함
 */

module.exports = { appendOrUpdateSessionIndex, runL2Writer, runL3Regenerator, runCheckPendingDeferrals, updateClosedInSession, applyPendingDeferralsResolved };
