// G1 split (D-188, session_242): turns module — extracted from session-end-finalize.js.
const { fs, path, spawnSync, log, readJson, writeJson, CWD, CURRENT_SESSION_PATH, SESSION_INDEX_PATH } = require('./shared');

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

  // PD-064 P3 (session_194): findTurnById helper + role_registry.json SOT read.
  let findTurnById;
  try {
    ({ findTurnById } = require(path.join(CWD, 'scripts', 'lib', 'turn-types.js')));
  } catch (e) {
    log(`inline-role-headers: findTurnById helper load 실패 — fallback to array index. ${e && e.message}`);
    findTurnById = (turns, turnIdx) => (turns && turnIdx < turns.length ? turns[turnIdx] : null);
  }

  // KNOWN role 리스트 — role_registry.json SOT read (jobs/zero/sage/vera 자동 포함)
  let KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer'];
  try {
    const regPath = path.join(CWD, 'memory', 'shared', 'role_registry.json');
    if (fs.existsSync(regPath)) {
      const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
      if (Array.isArray(reg.roles)) {
        KNOWN_ROLES = reg.roles.map(r => String(r.id || '').toLowerCase()).filter(Boolean);
        // designer는 vera의 별칭 — 둘 다 KNOWN 처리
        if (!KNOWN_ROLES.includes('designer') && KNOWN_ROLES.includes('vera')) {
          KNOWN_ROLES.push('designer');
        }
      }
    }
  } catch (e) {
    log(`inline-role-headers: role_registry.json load 실패, 정적 fallback. ${e && e.message}`);
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

    // PD-064 P3: turns[]와 cross-check — findTurnById 사용 (array index 직접 접근 폐기)
    const matchedTurn = findTurnById(turns, turnId);
    if (matchedTurn) {
      const turnRole = matchedTurn.role;
      if (turnRole && String(turnRole).toLowerCase() !== role) {
        violations.push({
          type: 'inline-role-header-mismatch',
          file: path.posix.join(sess.reportPath.replace(/\\/g, '/'), f),
          expected: role,
          actualInTurns: turnRole,
          turnId,
        });
      }
    } else if (turns.length > 0) {
      // turnId 박제됐으나 turns[]에 매칭 없음 — 신규 gap type
      violations.push({
        type: 'turn-not-found',
        file: path.posix.join(sess.reportPath.replace(/\\/g, '/'), f),
        turnId,
        note: 'frontmatter turnId가 turns[]에 존재하지 않음',
      });
    }

    // 본문 H1 ↔ frontmatter role — KNOWN은 role_registry SOT read
    const h1Match = content.match(/^#\s+(\w+)/m);
    if (h1Match) {
      const h1Role = h1Match[1].toLowerCase();
      if (KNOWN_ROLES.includes(h1Role) && h1Role !== role) {
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
 * count 스케일 면제 (Riki R-3, session_151): metrics_registry.json scale=count 지표는 상한 없음.
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
 * current_session.pendingDeferralsResolved 배열 기반으로 system_state.pendingDeferrals 및
 * pending_deferrals.json(SOT) 동시 갱신. (PD-070 fix)
 */

function ensureNexusTurnIfDirectWork(sess) {
  if (sess.legacy === true) {
    log('ensureNexusTurnIfDirectWork skip: legacy 세션');
    return;
  }
  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  if (turns.length > 0) {
    log(`ensureNexusTurnIfDirectWork skip: turns[]=${turns.length}건 이미 존재`);
    return;
  }
  const nexusTurn = {
    role: 'nexus',
    turnIdx: 0,
    source: 'direct',
    phase: 'execution',
    _autoInserted: true,
    _ref: 'PD-071',
  };
  sess.turns = [nexusTurn];
  writeJson(CURRENT_SESSION_PATH, sess);
  log('ensureNexusTurnIfDirectWork: turns[] 비어있음 → nexus direct turn 자동 삽입 (PD-071)');
}

/**
 * D-169 P5 (session_209, topic_176, 2026-05-08) — Nexus crash recovery.
 *
 * turnPushMode='nexus' 세션 종료 시 pending_turns_{sessionId}.jsonl이 남아있으면
 * Nexus crash로 미처리된 orphan entries로 판단하고 turns[]에 join하여 박제.
 *
 * 흐름:
 *   1. turnPushMode !== 'nexus' → skip (hook 모드는 이미 직접 push됨)
 *   2. pending_turns 파일 없음 → skip (정상 종료)
 *   3. 파일 읽기 → __hook_origin 검증 (D1 sentinel)
 *   4. valid entries를 ts 기준 정렬 → turns[] append
 *   5. gap: nexus-crash-recovery 박제
 *   6. pending_turns archive 처리
 */

function joinOrphanPendingTurns(sess) {
  if (sess.turnPushMode !== 'nexus') {
    log('joinOrphanPendingTurns skip: turnPushMode !== nexus');
    return;
  }

  const sessionId = sess.sessionId;

  // pendingTurnsPath inline (turn-push-mode.js 동적 require 불필요)
  const pendingPath = path.join(CWD, 'memory', 'sessions', `pending_turns_${sessionId}.jsonl`);

  if (!fs.existsSync(pendingPath)) {
    log('joinOrphanPendingTurns skip: pending_turns 없음 (정상 종료)');
    return;
  }

  // Nexus crash로 미처리 파일 감지
  log(`⚠ joinOrphanPendingTurns: pending_turns_${sessionId}.jsonl 발견 — Nexus crash recovery 시작`);

  const raw = fs.readFileSync(pendingPath, 'utf8');
  const lines = raw.split('\n').filter(l => l.trim());

  const HOOK_ORIGIN_SENTINEL = 'post-tool-use-task';
  const validEntries = [];
  const invalidEntries = [];

  for (const line of lines) {
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.__hook_origin === HOOK_ORIGIN_SENTINEL) {
      validEntries.push(entry);
    } else {
      invalidEntries.push(entry);
    }
  }

  // invalid entries → gap 박제 (origin 위변조 or 누락)
  if (invalidEntries.length > 0) {
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({
      type: 'nexus-crash-recovery-invalid-origin',
      count: invalidEntries.length,
      detail: invalidEntries.map(e => ({ agentId: e.agentId, role: e.role, origin: e.__hook_origin })),
    });
    log(`joinOrphanPendingTurns: invalid __hook_origin ${invalidEntries.length}건 → gap 박제 (D1 sentinel)`);
  }

  if (validEntries.length === 0) {
    log('joinOrphanPendingTurns: valid entries 없음 (all invalid origin)');
  } else {
    // ts 기준 정렬 (dispatch_order 정보 없음 — crash 시 순서 복원)
    validEntries.sort((a, b) => {
      const ta = a.ts ? new Date(a.ts).getTime() : 0;
      const tb = b.ts ? new Date(b.ts).getTime() : 0;
      return ta - tb;
    });

    const existingTurns = Array.isArray(sess.turns) ? sess.turns : [];
    let turnIdx = existingTurns.length;

    for (const entry of validEntries) {
      const turn = {
        role: entry.role,
        turnIdx,
        source: 'agent',
        ...(entry.selfScores && { selfScores: entry.selfScores }),
        sort_key: turnIdx,  // crash recovery: ts 순서 그대로 sort_key 부여
        _crashRecovery: true,
        _pendingTs: entry.ts || null,
      };
      existingTurns.push(turn);
      turnIdx++;
    }
    sess.turns = existingTurns;

    // gap: crash recovery 박제
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({
      type: 'nexus-crash-recovery',
      recovered: validEntries.length,
      invalid: invalidEntries.length,
      note: 'Nexus 미처리 pending_turns entries — crash recovery로 turns[] join',
      ref: 'D-169-P5',
    });

    log(`joinOrphanPendingTurns: valid ${validEntries.length}건 → turns[] join 완료`);
  }

  // pending_turns archive
  try {
    const archiveDir = path.join(CWD, 'memory', 'sessions', 'pending_turns_archive');
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
    const archiveName = `${path.basename(pendingPath, '.jsonl')}_crash_${Date.now()}.jsonl`;
    fs.renameSync(pendingPath, path.join(archiveDir, archiveName));
    log(`joinOrphanPendingTurns: pending_turns archived → ${archiveName}`);
  } catch (e) {
    log(`joinOrphanPendingTurns: archive 실패 (${e && e.message}) — 파일 삭제 시도`);
    try { fs.unlinkSync(pendingPath); } catch {}
  }

  writeJson(CURRENT_SESSION_PATH, sess);
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
/**
 * Riki R-1 mitigation (session_167, topic_144, 2026-05-02):
 * v0.00 era 진입 세션에서 versionBump hook 1회 skip 가드.
 * project_charter.charter.versionBumpHookSkipNextSession === sess.sessionId 이면
 * detectVersionBump/applyVersionBump/checkVersionBumpConfirmation 모두 skip.
 * 사용 후 자동으로 flag 제거.
 */

function checkSelfScoreScale(sess) {
  // count 스케일 shortKey 목록 — metrics_registry.json에서 로드
  let countScaleKeys = new Set();
  try {
    const regPath = path.join(CWD, 'memory', 'growth', 'metrics_registry.json');
    const reg = JSON.parse(fs.readFileSync(regPath, 'utf8'));
    for (const m of reg.metrics || []) {
      if (m.scale === 'count') countScaleKeys.add(m.shortKey);
    }
  } catch (e) { /* 로드 실패 시 면제 목록 없음 — 기존 동작 유지 */ }

  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const violations = [];

  for (const turn of turns) {
    if (!turn || !turn.selfScores || typeof turn.selfScores !== 'object') continue;
    for (const [key, val] of Object.entries(turn.selfScores)) {
      if (val === 'deferred' || val === null || val === undefined) continue;
      const num = Number(val);
      if (isNaN(num)) continue; // Y/N 등 비숫자 값은 스케일 검증 대상 아님
      if (countScaleKeys.has(key)) continue; // count 스케일은 상한 없음 — 면제
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

module.exports = { ensureEdiInAgents, filterAgentsCompletedByDualSatisfaction, validateInlineRoleHeaders, auditRoleImpersonation, ensureNexusTurnIfDirectWork, joinOrphanPendingTurns, checkSelfScoreScale, checkCommonPolicyCap };
