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
 * 원칙 (D-188, session_242):
 *   - 함수 정의는 lib/finalize/{turns,session-index,gaps,version-bump,propagation}.js 5 모듈로 분리.
 *   - shared utility + 상수는 lib/finalize/shared.js.
 *   - 본 파일은 orchestrator — 각 모듈 step을 try/catch 격리 호출.
 *   - 한 step 실패 시 finalize-module-fail gap 박제 + 다음 step 진행 (silent corruption 가시화).
 *   - D-143 (4) supersede — Master 명시 승인. 실패 시 git revert 단일 커밋 원복.
 */

const { fs, log, readJson, writeJson, CURRENT_SESSION_PATH } = require('./lib/finalize/shared');
const t = require('./lib/finalize/turns');
const si = require('./lib/finalize/session-index');
const g = require('./lib/finalize/gaps');
const vb = require('./lib/finalize/version-bump');
const p = require('./lib/finalize/propagation');

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

    if (sess.finalizedAt) {
      log(`이미 finalized (finalizedAt=${sess.finalizedAt}) — 중복 실행 스킵`);
      process.exit(0);
    }

    if (!sess.sessionId || !sess.topicSlug || !sess.startedAt) {
      log('필수 필드 누락, 스킵');
      process.exit(0);
    }

    if (!Array.isArray(sess.gaps)) sess.gaps = [];

    // 원본 main 본체 호출 순서를 유지 (D-188: 의존성 보존 필수).
    const steps = [
      ['turns/joinOrphanPendingTurns', () => t.joinOrphanPendingTurns(sess)],
      ['turns/ensureNexusTurnIfDirectWork', () => t.ensureNexusTurnIfDirectWork(sess)],
      ['turns/checkSelfScoreScale', () => t.checkSelfScoreScale(sess)],
      ['turns/checkCommonPolicyCap', () => t.checkCommonPolicyCap(sess)],
      ['turns/ensureEdiInAgents', () => t.ensureEdiInAgents(sess)],
      ['turns/filterAgentsCompletedByDualSatisfaction', () => t.filterAgentsCompletedByDualSatisfaction(sess)],
      ['turns/validateInlineRoleHeaders', () => t.validateInlineRoleHeaders(sess)],
      ['turns/auditRoleImpersonation', () => t.auditRoleImpersonation(sess)],
      ['propagation/auditEdiLlmInvocation', () => p.auditEdiLlmInvocation(sess)],
      ['propagation/enforceEdiAgentSource', () => p.enforceEdiAgentSource(sess)],
      ['propagation/synthesizeMechanicalEdiReport', () => p.synthesizeMechanicalEdiReport(sess)],
      ['propagation/copyEdiReportToSessionContributions', () => p.copyEdiReportToSessionContributions(sess)],
      ['orchestrator/writeJson(sess)-pre-index', () => writeJson(CURRENT_SESSION_PATH, sess)],
      ['session-index/appendOrUpdateSessionIndex', () => si.appendOrUpdateSessionIndex(sess)],
      ['session-index/runL2Writer', () => si.runL2Writer(sess)],
      ['session-index/runL3Regenerator', () => si.runL3Regenerator(sess)],
      ['session-index/runCheckPendingDeferrals', () => si.runCheckPendingDeferrals(sess)],
      ['session-index/updateClosedInSession', () => si.updateClosedInSession(sess)],
      ['gaps/runAutoCloseDryRun', () => g.runAutoCloseDryRun()],
      ['gaps/runResolvePDDryRun', () => g.runResolvePDDryRun()],
      ['gaps/runChecklistDeltaCheck', () => g.runChecklistDeltaCheck(sess)],
      ['session-index/applyPendingDeferralsResolved', () => si.applyPendingDeferralsResolved(sess)],
      ['version-bump/detectVersionBump', () => vb.detectVersionBump(sess)],
      ['version-bump/applyVersionBump', () => vb.applyVersionBump(sess)],
      ['version-bump/checkVersionBumpConfirmation', () => vb.checkVersionBumpConfirmation(sess)],
      ['version-bump/consumeVersionBumpHookSkipFlag', () => vb.consumeVersionBumpHookSkipFlag(sess)],
      ['gaps/escalateAceAcksWithTTL', () => g.escalateAceAcksWithTTL(sess)],
      ['gaps/runSyncSystemState', () => g.runSyncSystemState()],
    ];

    let failCount = 0;
    for (const [label, fn] of steps) {
      try {
        fn();
      } catch (e) {
        failCount++;
        log(`module step failed: ${label}: ${e && e.message || e}`);
        sess.gaps.push({
          type: 'finalize-module-fail',
          severity: 'high',
          step: label,
          message: String(e && e.message || e),
          addedAt: new Date().toISOString(),
          ref: 'D-188',
        });
      }
    }

    sess.finalizedAt = new Date().toISOString();
    writeJson(CURRENT_SESSION_PATH, sess);

    log(`완료 — ${sess.sessionId} (turns=${(sess.turns || []).length}, agents=${(sess.agentsCompleted || []).length}, decisions=${(sess.masterDecisions || []).length}, moduleFails=${failCount})`);
    process.exit(0);
  } catch (err) {
    log(`error: ${err.message}`);
    process.exit(0);
  }
})();
