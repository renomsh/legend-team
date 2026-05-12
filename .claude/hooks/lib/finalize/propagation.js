// G1 split (D-188, session_242): propagation module — extracted from session-end-finalize.js.
const { fs, path, spawnSync, log, readJson, writeJson, CWD, CURRENT_SESSION_PATH, SESSION_INDEX_PATH } = require('./shared');

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
  // Grade C: Edi 생략이 설계 의도 (CLAUDE.md: Grade C = 경량 선택. D-175로 Grade D 폐기)
  const gradeUpper = (sess.grade || '').toUpperCase();
  if (gradeUpper === 'C') {
    log('grade C: edi mechanical fallback skipped by design');
    return { skipped: true, reason: 'grade-c-by-design' };
  }

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
 * D-138 (session_161, topic_141, 2026-05-01): Grade A/B/S 세션 종결 시
 * Edi Agent 툴 호출 강제 검증 (turns[].source === 'agent' 체크).
 *
 * Ace 권고 옵션 B 구현:
 *   - Grade A/B/S 세션에서 turns[] 중 role==='edi' && source==='agent' turn 없으면
 *     hard warning 출력 (D-066 위반 경보)
 *   - Grade C/D/undefined → skip (D-137로 이미 Grade C/D는 Edi 생략이 설계 의도)
 *   - 기존 auditEdiLlmInvocation은 llmEdiFile(2신호) 포함 — 본 함수는 turns 단신호 전용
 *
 * D4 Prime Directive 정합: enforcement는 코드(hook)에 박제, 모델 자율 판단에 의존 안 함.
 * SRP 준수: auditEdiLlmInvocation(탐지+다축 박제) vs enforceEdiAgentSource(turns 단신호 차단형 경보).
 */

function enforceEdiAgentSource(sess) {
  const grade = (sess.grade || '').toUpperCase();

  // Grade C/D/undefined → skip
  if (grade !== 'A' && grade !== 'B' && grade !== 'S') {
    log(`enforceEdiAgentSource skip: Grade ${grade || 'undefined'} (A/B/S 아님)`);
    return;
  }

  const turns = Array.isArray(sess.turns) ? sess.turns : [];
  const hasEdiAgentTurn = turns.some(t => t && t.role === 'edi' && t.source === 'agent');

  if (hasEdiAgentTurn) {
    log('enforceEdiAgentSource OK — Edi agent turn 확인됨 (D-066 정상)');
    return;
  }

  // Hard warning — Grade A/B/S에 Edi agent turn 없음
  log(`⚠ [edi-agent-enforce] Grade ${grade} 세션에 Edi LLM turn(source:agent) 없음 — D-066 위반`);

  // gaps 박제 (추적 목적)
  sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
  const alreadyGapped = sess.gaps.some(g => g && g.type === 'edi-agent-source-missing' && g.sessionId === sess.sessionId);
  if (!alreadyGapped) {
    sess.gaps.push({
      type: 'edi-agent-source-missing',
      sessionId: sess.sessionId,
      grade,
      severity: 'high',
      detectedAt: new Date().toISOString(),
      note: 'turns[]에 role=edi && source=agent turn 없음 — D-066(Grade A/S 서브에이전트 강제) + D4(hook 박제) 위반',
      ref: 'D-138',
    });
    writeJson(CURRENT_SESSION_PATH, sess);
  }
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

module.exports = { copyEdiReportToSessionContributions, synthesizeMechanicalEdiReport, auditEdiLlmInvocation, enforceEdiAgentSource };
