#!/usr/bin/env node
/**
 * UserPromptSubmit hook — Master-first mode HookA (D-129, topic_132).
 *
 * 단일 책임 (SRP):
 *   - Master 발언(prompt)에서 echo trigger / intent reconfirm 키워드 매칭
 *   - master_first_state.json 박제
 *   - logs/master-first.log append
 *
 * 모드: warn-only (MVP P1~P3). LLM 호출 없음 (HookA는 키워드 1차만, LLM 2차는 P4 별도 hook).
 * Grade C/D 또는 non-framing topic → no-op.
 * 항상 exit 0 (warn-only).
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
    const topicType = sess && sess.topicType ? sess.topicType : null;
    const sessionId = sessionIdInput || (sess && sess.sessionId) || null;

    // Trigger gate: grade + topicType
    const gradeOk = !grade || (config.triggerGrades || []).includes(grade);
    const typeOk = !topicType || (config.triggerTopicTypes || []).includes(topicType);
    if (!gradeOk || !typeOk) {
      appendLog(cwd, config.logPath || 'logs/master-first.log', {
        ts, phase: 'no-op', reason: 'grade-or-type-mismatch', grade, topicType
      });
      process.exit(0);
    }

    // 분류 + state write
    const newState = classifyPrompt(prompt, sessionId, config);
    const statePath = path.join(cwd, config.statePath || 'memory/shared/master_first_state.json');
    writeJsonFile(statePath, newState);

    const elapsedMs = Date.now() - startedAt;
    appendLog(cwd, config.logPath || 'logs/master-first.log', {
      ts, phase: 'classified',
      sessionId, grade, topicType,
      echoTriggerDetected: newState.echoTriggerDetected,
      intentReconfirmRequested: newState.intentReconfirmRequested,
      matchedKeywords: newState.matchedKeywords,
      elapsedMs
    });

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
