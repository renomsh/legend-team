// G1 split (D-188, session_242): version-bump module — extracted from session-end-finalize.js.
const { fs, path, spawnSync, log, readJson, writeJson, CWD, CURRENT_SESSION_PATH, SESSION_INDEX_PATH } = require('./shared');

function isVersionBumpHookSkipped(sess) {
  try {
    const charterPath = path.join(CWD, 'memory', 'shared', 'project_charter.json');
    if (!fs.existsSync(charterPath)) return false;
    const charter = JSON.parse(fs.readFileSync(charterPath, 'utf8'));
    const flag = charter && charter.charter && charter.charter.versionBumpHookSkipNextSession;
    if (flag && flag === sess.sessionId) {
      log(`versionBump hook skip: charter.versionBumpHookSkipNextSession === ${sess.sessionId} (R-1 mitigation, 1회용 가드)`);
      return true;
    }
  } catch (e) {
    log(`isVersionBumpHookSkipped read error: ${e && e.message}`);
  }
  return false;
}

/**
 * R-1 mitigation 1회용 가드 자동 제거 (session_167).
 * 본 세션에서 hook 3종이 모두 skip 처리되었다면 charter flag를 제거하여
 * 다음 세션부터는 정상 동작하도록 한다.
 */

function consumeVersionBumpHookSkipFlag(sess) {
  try {
    const charterPath = path.join(CWD, 'memory', 'shared', 'project_charter.json');
    if (!fs.existsSync(charterPath)) return;
    const charter = JSON.parse(fs.readFileSync(charterPath, 'utf8'));
    const flag = charter && charter.charter && charter.charter.versionBumpHookSkipNextSession;
    if (flag && flag === sess.sessionId) {
      delete charter.charter.versionBumpHookSkipNextSession;
      writeJson(charterPath, charter);
      log(`consumeVersionBumpHookSkipFlag: 1회용 가드(${flag}) 사용 후 자동 제거 — 다음 세션부터 정상 동작`);
    }
  } catch (e) {
    log(`consumeVersionBumpHookSkipFlag error: ${e && e.message}`);
  }
}


function detectVersionBump(sess) {
  if (isVersionBumpHookSkipped(sess)) return;
  if (sess.versionBump && (sess.versionBump.value || sess.versionBump.to)) {
    log('detectVersionBump skip: versionBump 이미 박제됨 (Edi 수동 우선)');
    return;
  }

  const grade = (sess.grade || '').toUpperCase();

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
    sess.grade === 'C'
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

  // Grade C: Edi LLM 미호출 → Nexus가 직접 확정 (Edi deadlock 없음, D-175로 Grade D 폐기)
  if (grade === 'C') {
    const now = new Date().toISOString();
    sess.versionBump = {
      value: bumpValue,
      type: bumpType,
      reason,
      from: null,
      to: null,
      confirmedBy: 'nexus',
      confirmedAt: now,
      autoDetectedAt: sess.versionBumpSuggested.autoDetectedAt,
    };
    sess.versionBumpSuggested.confirmedBy = 'nexus';
    writeJson(CURRENT_SESSION_PATH, sess);
    log(`versionBump Nexus 확정 (Grade ${grade}) = +${bumpValue} (${bumpType}) | ${categories.structural.length}/${categories.capacity.length}/${categories.bugfix.length} files`);
    return;
  }

  writeJson(CURRENT_SESSION_PATH, sess);
  log(`versionBumpSuggested = +${bumpValue} (${bumpType}) | ${categories.structural.length}/${categories.capacity.length}/${categories.bugfix.length} files | Edi 확정 대기`);
}

/**
 * D-104 (2026-04-28): versionBump 자동 전파.
 * current_session.json에 versionBump 필드가 있으면 project_charter.json에 반영.
 * 없으면 pass (경고 없음).
 */

function applyVersionBump(sess) {
  if (isVersionBumpHookSkipped(sess)) return;
  const bump = sess.versionBump;
  if (!bump || !bump.reason) {
    log('versionBump 없음 — project_charter 업데이트 skip');
    return;
  }
  // R-4 mitigation (D-131, PD-053): Edi LLM 또는 Nexus(Grade C/D) 확정만 인정
  const validConfirmers = ['edi', 'nexus'];
  if (!validConfirmers.includes(bump.confirmedBy) || !bump.confirmedAt) {
    log(`applyVersionBump skip: confirmedBy='${bump.confirmedBy}' (edi/nexus 아님) 또는 confirmedAt 부재 — 검증 미통과`);
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({
      type: 'version-bump-unverified',
      sessionId: sess.sessionId,
      attempted: bump,
      note: 'confirmedBy !== edi/nexus 또는 confirmedAt 부재 — project_charter 미반영',
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

  const prevVersion = (charter.charter && charter.charter.version) || '0.00';

  // bump.to 미설정 시 value + 현재 버전으로 계산 (Edi가 from/to를 비워둔 경우 대응)
  // 형식: vX.YYY ("v" prefix 보존). parseFloat 전 "v" 제거 후 재부착.
  if (!bump.to && bump.value) {
    const hasVPrefix = /^v/.test(prevVersion);
    const prevNumeric = prevVersion.replace(/^v/, '');
    const prev = parseFloat(prevNumeric) || 0;
    const nextNumeric = (prev + bump.value).toFixed(3);
    const next = hasVPrefix ? 'v' + nextNumeric : nextNumeric;
    bump.to = next;
    bump.from = prevVersion;
    log(`applyVersionBump: bump.to 미설정 → 계산으로 보완 ${prevVersion} + ${bump.value} = ${next}`);
  }

  if (!bump.to) {
    log('applyVersionBump skip: bump.to 및 bump.value 모두 없음');
    return;
  }

  charter.charter.version = bump.to;
  charter.version = bump.to; // 최상위 version 필드 동기화 (charter.charter.version와 항상 일치)
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
 * G-1 hard enforcement (D-140, topic_141, session_162):
 * versionBumpSuggested가 박제되었으나 Edi 확정(versionBump.confirmedBy === 'edi')이
 * 없는 경우 gaps(severity: 'high') + openMasterAlerts + stderr error 발령.
 *
 * 적용 범위: Grade A/B/S만. Grade C/D는 versionBump Edi 확정 대상 아님.
 * Riki R-1 mitigation: changedFiles에 session-end-finalize.js만 포함 시 severity 'info' 강등 (유지).
 * Riki R-2 mitigation: 이미 'version-bump-edi-unconfirmed' gap 존재 시 early return (이중 박제 방지).
 * Arki legacy guard: sess.legacy === true 시 skip.
 */

function checkVersionBumpConfirmation(sess) {
  if (isVersionBumpHookSkipped(sess)) return;
  const suggested = sess.versionBumpSuggested;

  // trigger 조건 1: versionBumpSuggested 없음 → skip
  if (!suggested || !suggested.value || suggested.value <= 0) {
    return;
  }

  const grade = (sess.grade || '').toUpperCase();

  // trigger 조건 2: Grade C + nexus 확정이면 skip (이미 자동 확정됨, D-175로 Grade D 폐기)
  if (grade === 'C' && sess.versionBump && sess.versionBump.confirmedBy === 'nexus') {
    log(`checkVersionBumpConfirmation skip: Grade ${grade} + nexus 확정됨`);
    return;
  }

  // Grade A/B/S가 아니고 nexus 확정도 아니면 skip
  if (grade !== 'A' && grade !== 'B' && grade !== 'S') {
    log(`checkVersionBumpConfirmation skip: Grade ${grade || 'undefined'} (A/B/S 아님)`);
    return;
  }

  // trigger 조건 3: legacy 세션 → skip
  if (sess.legacy === true) {
    log('checkVersionBumpConfirmation skip: legacy 세션');
    return;
  }

  // R-2 mitigation: 이미 unconfirmed/not-dispatched 박제 시 early return (PD-064 P4 type 추가)
  sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
  if (sess.gaps.some(g =>
    g.type === 'version-bump-edi-unconfirmed' ||
    g.type === 'version-bump-edi-not-dispatched'
  )) {
    log('checkVersionBumpConfirmation skip: version-bump 관련 gap 이미 박제됨 (R-2 이중 박제 방지)');
    return;
  }

  // Edi 또는 Nexus(Grade C/D) 확정 여부 검사
  const bump = sess.versionBump;
  const confirmed = bump && ['edi', 'nexus'].includes(bump.confirmedBy) && bump.confirmedAt;
  if (confirmed) {
    // PD-064 P2 (session_194): suggested vs confirmed value 차이 감지 → info gap만 박제
    // (자동 reconcile 룰 도입 보류 — D-130 'Edi 단일 책임' 보존, Riki 권고)
    if (suggested.value != null && bump.value != null && suggested.value !== bump.value) {
      const hasOverrideReason = bump.overrideReason && String(bump.overrideReason).trim();
      if (!hasOverrideReason) {
        sess.gaps.push({
          type: 'version-bump-suggested-vs-confirmed-diff',
          severity: 'info',
          detail: `suggested=${suggested.value} vs confirmed=${bump.value} (overrideReason 없음)`,
          suggestedValue: suggested.value,
          confirmedValue: bump.value,
          addedBy: 'checkVersionBumpConfirmation',
          ref: 'PD-064-P2',
        });
        writeJson(CURRENT_SESSION_PATH, sess);
        log(`checkVersionBumpConfirmation: info gap — suggested(${suggested.value}) vs confirmed(${bump.value}) overrideReason 누락`);
      } else {
        log(`checkVersionBumpConfirmation: suggested(${suggested.value}) vs confirmed(${bump.value}) — overrideReason 명시됨, gap 박제 skip`);
      }
    } else {
      log('checkVersionBumpConfirmation: Edi 확정 확인됨 — 경고 없음');
    }
    return;
  }

  // PD-064 P4 (session_194): Edi turn 자체가 dispatch 안 된 케이스 분리.
  // agentsCompleted 또는 turns에서 edi 부재이면 'version-bump-edi-not-dispatched' 별도 gap.
  const agentsCompleted = Array.isArray(sess.agentsCompleted) ? sess.agentsCompleted : [];
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const ediInAgents = agentsCompleted.some(a => String(a).toLowerCase() === 'edi');
  const ediInTurns = turns.some(t => t && String(t.role || '').toLowerCase() === 'edi');
  const ediDispatched = ediInAgents || ediInTurns;

  // R-1 mitigation: session-end-finalize.js 단독 변경 세션 → severity 'info' 강등
  const changedFiles = suggested.changedFiles || [];
  const isSingleHookSelf =
    changedFiles.length === 1 &&
    changedFiles[0] === '.claude/hooks/session-end-finalize.js';
  const severity = isSingleHookSelf ? 'info' : 'high';

  // gaps 박제 — PD-064 P4: Edi dispatch 부재 시 별도 type
  const gapType = ediDispatched
    ? 'version-bump-edi-unconfirmed'
    : 'version-bump-edi-not-dispatched';
  sess.gaps.push({
    type: gapType,
    severity,
    detail: ediDispatched
      ? 'versionBumpSuggested 존재하나 Edi 확정(confirmedBy: edi) 미기록'
      : 'versionBumpSuggested 존재하나 Edi turn 자체가 dispatch되지 않음 (호출 부재)',
    addedBy: 'checkVersionBumpConfirmation',
    ref: ediDispatched ? 'D-140' : 'PD-064-P4',
    suggestedValue: suggested.value,
  });

  // openMasterAlerts prepend
  sess.openMasterAlerts = Array.isArray(sess.openMasterAlerts) ? sess.openMasterAlerts : [];
  sess.openMasterAlerts.unshift({
    severity,
    message: `versionBump 미확정: Edi가 confirmedBy: 'edi' 박제 필요 (suggested value: ${suggested.value})`,
    addedBy: 'checkVersionBumpConfirmation',
    ref: 'D-140',
  });

  console.error(`⛔ [finalize] versionBumpSuggested 미확정 — Edi confirmedBy: 'edi' 박제 필요 (suggested +${suggested.value}) [D-140]`);
  log(`checkVersionBumpConfirmation: ${severity} — versionBump confirmedBy 없음 (suggested +${suggested.value})`);

  writeJson(CURRENT_SESSION_PATH, sess);
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

module.exports = { isVersionBumpHookSkipped, consumeVersionBumpHookSkipFlag, detectVersionBump, applyVersionBump, checkVersionBumpConfirmation };
