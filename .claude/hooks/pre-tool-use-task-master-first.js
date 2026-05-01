#!/usr/bin/env node
/**
 * PreToolUse(Task) hook — Master-first mode HookB (D-129, topic_132).
 *
 * 단일 책임 (SRP):
 *   - Task 호출 시 master_first_state.json 읽음
 *   - echoTriggerDetected || intentReconfirmRequested → stderr audit 메시지 (warn-only)
 *   - LLM-free 강제 (Riki R-302 mitigation): 키워드/state read만, LLM 호출 절대 금지
 *   - 2초 timeout cap
 *   - 항상 exit 0 (warn-only mode)
 */

const fs = require('fs');
const path = require('path');

const TARGET_TOOL_NAMES = ['Task', 'Agent'];
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

function appendLog(cwd, logRel, payload) {
  try {
    const logPath = path.isAbsolute(logRel) ? logRel : path.join(cwd, logRel);
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(payload) + '\n', 'utf8');
  } catch { /* silent */ }
}

/**
 * Core: state로부터 audit 메시지 생성. Pure function.
 * @returns {string|null} audit msg or null if no flag set
 */
function buildAuditMessage(state) {
  if (!state) return null;
  const flags = [];
  if (state.echoTriggerDetected) flags.push('echo-trigger');
  if (state.intentReconfirmRequested) flags.push('intent-reconfirm');
  if (flags.length === 0) return null;
  const matched = Array.isArray(state.matchedKeywords) ? state.matchedKeywords.join(', ') : '';
  return `[master-first] WARN: ${flags.join('+')} 감지 (matched: ${matched}). Master 의도 재확인 권고. (D-129, warn-only)`;
}

/**
 * audit 발생 시 logs/master-first-audit.md 갱신 — /open 브리핑용.
 */
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

async function run() {
  const startedAt = Date.now();
  const cwd = process.cwd();
  const ts = new Date().toISOString();

  try {
    const raw = await readStdin();
    const input = safeParseJson(raw) || {};
    const toolName = input.tool_name || input.toolName || '';

    if (!TARGET_TOOL_NAMES.includes(toolName)) {
      process.exit(0);
    }

    const config = readJsonFile(path.join(cwd, CONFIG_REL));
    const statePath = path.join(cwd, (config && config.statePath) || 'memory/shared/master_first_state.json');
    const state = readJsonFile(statePath);

    // stale state 방지: 현재 세션 ID와 state의 sessionId 비교
    const sess = readJsonFile(path.join(cwd, SESSION_REL));
    const currentSessionId = input.session_id || input.sessionId || (sess && sess.sessionId) || null;
    if (state && currentSessionId && state.sessionId !== currentSessionId) {
      appendLog(cwd, (config && config.logPath) || 'logs/master-first.log', {
        ts, phase: 'stale-state-skip', toolName,
        stateSessionId: state.sessionId, currentSessionId
      });
      process.exit(0);
    }

    const auditMsg = buildAuditMessage(state);
    if (auditMsg) {
      const flags = [];
      if (state.echoTriggerDetected) flags.push('echo-trigger');
      if (state.intentReconfirmRequested) flags.push('intent-reconfirm');
      appendLog(cwd, (config && config.logPath) || 'logs/master-first.log', {
        ts, phase: 'audit-emit', toolName,
        echoTriggerDetected: state.echoTriggerDetected,
        intentReconfirmRequested: state.intentReconfirmRequested,
        matchedKeywords: state.matchedKeywords
      });
      appendAuditReport(cwd, (config && config.auditReportPath) || 'logs/master-first-audit.md', {
        ts, sessionId: currentSessionId, toolName,
        flags: flags.join('+'),
        matched: Array.isArray(state.matchedKeywords) ? state.matchedKeywords.join(', ') : '',
        utterance: state.lastMasterUtterance || ''
      });
    } else {
      appendLog(cwd, (config && config.logPath) || 'logs/master-first.log', {
        ts, phase: 'no-audit', toolName
      });
    }

    const elapsedMs = Date.now() - startedAt;
    const cap = (config && config.timeoutMs) || 2000;
    if (elapsedMs > cap) {
      appendLog(cwd, (config && config.logPath) || 'logs/master-first.log', {
        ts, phase: 'timeout-warn', elapsedMs, cap
      });
    }

    // warn-only — always pass
    process.exit(0);
  } catch (err) {
    appendLog(cwd, 'logs/master-first.log', { ts, phase: 'error', message: err && err.message });
    process.exit(0);
  }
}

module.exports = { buildAuditMessage, appendAuditReport };

if (require.main === module) {
  run();
}
