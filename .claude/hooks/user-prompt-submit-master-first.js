#!/usr/bin/env node
/**
 * UserPromptSubmit hook — Master-first mode HookA (D-129, topic_132).
 * audit-emit 확장 (topic_139, session_157).
 *
 * 단일 책임 (SRP):
 *   - Master 발언(prompt)에서 echo trigger / intent reconfirm 키워드 매칭
 *   - master_first_state.json 박제
 *   - logs/master-first.log append
 *   - echo/intent 감지 시 logs/master-first-audit.md emit (source: UserPromptSubmit)
 *
 * 모드: warn-only (MVP P1~P3). LLM 호출 없음.
 * Grade C/D 또는 non-framing topic → no-op.
 * 항상 exit 0 (warn-only).
 *
 * 측정 sink 확장 이유: HookB(PreToolUse Task)만으로는 Task 미호출 경로에서
 * audit-emit 0건 발생. UserPromptSubmit 시점 emit으로 보완. (Ace rev1 §7 (c)가설)
 * source 필드로 HookA/HookB 발원 구분 — 중복 허용, 의미적으로 별개.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_REL = 'memory/shared/master_first_config.json';
const SESSION_REL = 'memory/sessions/current_session.json';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 1500);
  });
}

function safeParseJson(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function readJsonFile(p) {
  try {
    const raw = fs.readFileSync(p, 'utf8').trim();
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeJsonFile(p, obj) {
  try {
    fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
    return true;
  } catch { return false; }
}

function appendLog(cwd, logRel, payload) {
  try {
    const logPath = path.isAbsolute(logRel) ? logRel : path.join(cwd, logRel);
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(payload) + '\n', 'utf8');
  } catch { /* silent */ }
}

function appendAuditReport(cwd, auditPath, { ts, sessionId, toolName, flags, matched, utterance }) {
  try {
    const p = path.isAbsolute(auditPath) ? auditPath : path.join(cwd, auditPath);
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const line = `| ${ts.slice(0, 19).replace('T', ' ')} | ${sessionId || '-'} | ${toolName} | ${flags} | \`${matched}\` | ${utterance ? utterance.slice(0, 60) : '-'} |\n`;
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p,
        '# Master-first Audit Log\n\n' +
        '> /open 브리핑 자동 포함. echo-trigger / intent-reconfirm 감지 기록. (D-129)\n\n' +
        '| 시각 | 세션 | 도구 | 플래그 | 키워드 | 발언(60자) |\n' +
        '|---|---|---|---|---|---|\n' + line, 'utf8');
    } else {
      fs.appendFileSync(p, line, 'utf8');
    }
  } catch { /* silent */ }
}

/**
 * 키워드 매칭 (case-insensitive 부분 매칭).
 * 한국어 키워드는 그대로, 영문은 lower-case 비교.
 */
function matchKeywords(prompt, keywords) {
  if (!prompt || !Array.isArray(keywords)) return [];
  const matched = [];
  const lower = prompt.toLowerCase();
  for (const kw of keywords) {
    const kwLower = String(kw).toLowerCase();
    if (lower.includes(kwLower)) matched.push(kw);
  }
  return matched;
}

/**
 * Core: prompt를 분석해 새 state 객체 반환. Pure function (테스트 용이).
 */
function classifyPrompt(prompt, sessionId, config) {
  const echoMatched = matchKeywords(prompt, config.echoTriggerKeywords || []);
  const intentMatched = matchKeywords(prompt, config.intentReconfirmKeywords || []);
  return {
    lastMasterUtterance: typeof prompt === 'string' ? prompt.slice(0, 500) : null,
    echoTriggerDetected: echoMatched.length > 0,
    intentReconfirmRequested: intentMatched.length > 0,
    matchedKeywords: [...echoMatched, ...intentMatched],
    sessionId: sessionId || null,
    updatedAt: new Date().toISOString()
  };
}

async function run() {
  const startedAt = Date.now();
  const cwd = process.cwd();
  const ts = new Date().toISOString();

  try {
    const raw = await readStdin();
    const input = safeParseJson(raw) || {};
    const prompt = input.prompt || input.user_prompt || '';
    const sessionIdInput = input.session_id || input.sessionId || null;

    const cfgPath = path.join(cwd, CONFIG_REL);
    const config = readJsonFile(cfgPath);
    if (!config) {
      appendLog(cwd, 'logs/master-first.log', { ts, phase: 'no-config', skipped: true });
      process.exit(0);
    }

    const sess = readJsonFile(path.join(cwd, SESSION_REL));
    const grade = sess && sess.grade ? sess.grade : null;
    const sessionId = sessionIdInput || (sess && sess.sessionId) || null;

    // Trigger gate: grade
    const gradeOk = !grade || (config.triggerGrades || []).includes(grade);
    if (!gradeOk) {
      appendLog(cwd, config.logPath || 'logs/master-first.log', {
        ts, phase: 'no-op', reason: 'grade-mismatch', grade
      });
      process.exit(0);
    }

    // jobs-framing 감지 기반 활성화
    const statePath = path.join(cwd, config.statePath || 'memory/shared/master_first_state.json');
    const existingState = readJsonFile(statePath) || {};

    // sessionId 달라지면 state 리셋 (stale state 방지)
    const stateSessionId = existingState.sessionId || null;
    const jobsFramingActive = (stateSessionId === sessionId) ? (existingState.jobsFramingActive || false) : false;

    // /jobs-framing 호출 감지
    const isJobsFramingCall = typeof prompt === 'string' && /\/jobs-framing\b/i.test(prompt);
    if (isJobsFramingCall) {
      // jobs-framing 활성화 — echo 분류 없이 flag만 박제
      const activationState = {
        jobsFramingActive: true,
        sessionId,
        activatedAt: ts,
        lastMasterUtterance: null,
        echoTriggerDetected: false,
        intentReconfirmRequested: false,
        matchedKeywords: [],
        updatedAt: ts
      };
      writeJsonFile(statePath, activationState);
      appendLog(cwd, config.logPath || 'logs/master-first.log', {
        ts, phase: 'jobs-framing-activated', sessionId, grade
      });
      process.exit(0);
    }

    // jobs-framing가 이 세션에서 활성화되지 않았으면 no-op
    if (!jobsFramingActive) {
      appendLog(cwd, config.logPath || 'logs/master-first.log', {
        ts, phase: 'no-op', reason: 'jobs-framing-not-active', sessionId, grade
      });
      process.exit(0);
    }

    // 분류 + state write
    const newState = classifyPrompt(prompt, sessionId, config);
    newState.jobsFramingActive = true;
    writeJsonFile(statePath, newState);

    const elapsedMs = Date.now() - startedAt;
    appendLog(cwd, config.logPath || 'logs/master-first.log', {
      ts, phase: 'classified',
      sessionId, grade,
      echoTriggerDetected: newState.echoTriggerDetected,
      intentReconfirmRequested: newState.intentReconfirmRequested,
      matchedKeywords: newState.matchedKeywords,
      elapsedMs
    });

    // audit-emit at UserPromptSubmit (topic_139: sink 확장)
    // HookB(PreToolUse Task)가 Task 미호출 경로에서 emit 0 되는 gap 보완.
    // source: 'UserPromptSubmit' 로 HookB emit과 구분.
    if (newState.echoTriggerDetected || newState.intentReconfirmRequested) {
      const flags = [];
      if (newState.echoTriggerDetected) flags.push('echo-trigger');
      if (newState.intentReconfirmRequested) flags.push('intent-reconfirm');
      appendAuditReport(cwd, config.auditReportPath || 'logs/master-first-audit.md', {
        ts, sessionId, toolName: 'UserPromptSubmit',
        flags: flags.join('+'),
        matched: newState.matchedKeywords.join(', '),
        utterance: newState.lastMasterUtterance || ''
      });
      appendLog(cwd, config.logPath || 'logs/master-first.log', {
        ts, phase: 'audit-emit', source: 'UserPromptSubmit',
        echoTriggerDetected: newState.echoTriggerDetected,
        intentReconfirmRequested: newState.intentReconfirmRequested,
        matchedKeywords: newState.matchedKeywords
      });
    }

    if (elapsedMs > (config.timeoutMs || 2000)) {
      appendLog(cwd, config.logPath || 'logs/master-first.log', {
        ts, phase: 'timeout-warn', elapsedMs, cap: config.timeoutMs
      });
    }

    process.exit(0);
  } catch (err) {
    appendLog(cwd, 'logs/master-first.log', { ts, phase: 'error', message: err && err.message });
    process.exit(0);
  }
}

// callable export (test 용이)
module.exports = { classifyPrompt, matchKeywords };

if (require.main === module) {
  run();
}
