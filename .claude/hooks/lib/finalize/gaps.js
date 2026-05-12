// G1 split (D-188, session_242): gaps module — extracted from session-end-finalize.js.
const { fs, path, spawnSync, log, readJson, writeJson, CWD, CURRENT_SESSION_PATH, SESSION_INDEX_PATH } = require('./shared');

function runAutoCloseDryRun() {
  const scriptPath = path.join(CWD, 'scripts', 'auto-close-topics.ts');
  if (!fs.existsSync(scriptPath)) {
    log('auto-close-topics skip: 스크립트 없음');
    return;
  }
  try {
    const { main } = require(scriptPath);
    main([]);
    log('auto-close dry-run 완료');
  } catch (err) {
    log(`auto-close dry-run 실패: ${err.message}`);
  }
}


function runResolvePDDryRun() {
  const scriptPath = path.join(CWD, 'scripts', 'resolve-pending-deferrals.ts');
  if (!fs.existsSync(scriptPath)) {
    log('resolve-pending-deferrals skip: 스크립트 없음');
    return;
  }
  try {
    const { main } = require(scriptPath);
    main([]);
    log('resolve-PD dry-run 완료');
  } catch (err) {
    log(`resolve-PD dry-run 실패: ${err.message}`);
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
  try {
    const { main } = require(tsPath);
    main();
    log('sync-system-state 완료');
  } catch (err) {
    log(`sync-system-state 실패: ${err.message}`);
  }
}

module.exports = { runAutoCloseDryRun, runResolvePDDryRun, runChecklistDeltaCheck, escalateAceAcksWithTTL, runSyncSystemState };
