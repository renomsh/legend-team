#!/usr/bin/env node
/**
 * PostToolUse(Task) hook — D-068 (session_091, topic_096).
 * D-074 (session_093): invocationMode/subagentId 제거.
 *
 * Agent(Task) 툴 반환 직후 자동 발동하여 role turn을
 * memory/sessions/current_session.json.turns 에 push 한다.
 *
 * 입력 (stdin JSON, Claude Code hook protocol 추정):
 *   {
 *     tool_name: "Task" | "Agent" | ...,
 *     tool_input: { subagent_type?: string, description?: string, prompt?: string, ... },
 *     tool_response: { ... } | string,
 *     cwd?: string,
 *     session_id?: string,
 *   }
 *
 * 박제 규칙:
 *   - tool_name이 "Task" 또는 "Agent"가 아니면 silent pass.
 *   - role 추출 실패 시 silent pass.
 *   - role 추출은 subagent_type 기반 ("role-ace" → "ace").
 *   - current_session.json 부재·파싱 실패도 silent pass (process.exit(0)).
 *
 * legacy 가드: legacy:true 세션엔 push하지 않음.
 */

const fs = require('fs');
const path = require('path');

const TARGET_TOOL_NAMES = ['Task', 'Agent']; // 양쪽 모두 cover
const ROLE_AGENT_PREFIX = 'role-';
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer'];

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    // safety timeout: 일부 hook 환경에서 end가 오지 않을 수 있음
    setTimeout(() => resolve(data), 2000);
  });
}

function safeParseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readJsonFile(p) {
  try {
    const raw = fs.readFileSync(p, 'utf8').trim();
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJsonFile(p, obj) {
  try {
    fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
    return true;
  } catch {
    return false;
  }
}

/**
 * role 식별 — Arki rev4 R-1 보강 (session_123 오분류 사고 후속).
 * 우선순위:
 *   1. prompt 본문 첫 500자에 `## ROLE: <name>` 또는 `[ROLE:<name>]` 명시 마커
 *      (PD-043 dispatch 규약 — 사고 재발 방지)
 *   2. tool_input.subagent_type (`role-<name>` prefix)
 *   3. description 첫 단어가 role명일 때만 (오분류 방지 — "Riki risk audit Ace direction" 같은
 *      케이스에서 "Ace"를 잡지 않음)
 *   4. 실패 → null (silent pass)
 */
function extractRole(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return null;

  // 우선순위 1: prompt 마커
  const prompt = (toolInput.prompt || '');
  const promptHead = typeof prompt === 'string' ? prompt.slice(0, 500) : '';
  const markerMatch = promptHead.match(/(?:##\s+ROLE:|\[ROLE:)\s*([a-zA-Z]+)\s*\]?/i);
  if (markerMatch) {
    const r = markerMatch[1].toLowerCase();
    if (KNOWN_ROLES.includes(r)) return r;
  }

  // 우선순위 2: subagent_type
  const subagentType = toolInput.subagent_type || toolInput.subagentType;
  if (typeof subagentType === 'string') {
    let s = subagentType.toLowerCase();
    if (s.startsWith(ROLE_AGENT_PREFIX)) s = s.slice(ROLE_AGENT_PREFIX.length);
    if (KNOWN_ROLES.includes(s)) return s;
  }

  // 우선순위 3: description 첫 단어만 (substring-include 회피)
  const desc = (toolInput.description || '').toLowerCase();
  const firstWord = desc.split(/[\s\-:]+/)[0];
  if (KNOWN_ROLES.includes(firstWord)) return firstWord;

  return null;
}

/**
 * topics/{topicId}/turn_log.jsonl에 한 줄 append.
 * 디렉토리 부재 시 자동 생성. 실패 silent.
 *
 * Arki rev4 Sec 2.2 시그니처:
 *   writeTurnLogEntry(topicId, role, turnIdx, sessionId, summaryHash?, reportsPath?)
 */
function writeTurnLogEntry(cwd, topicId, role, turnIdx, sessionId, extra = {}) {
  if (!topicId || !role || typeof turnIdx !== 'number' || !sessionId) return false;
  try {
    const topicDir = path.join(cwd, 'topics', topicId);
    if (!fs.existsSync(topicDir)) {
      fs.mkdirSync(topicDir, { recursive: true });
    }
    const filePath = path.join(topicDir, 'turn_log.jsonl');
    const entry = {
      ts: new Date().toISOString(),
      topicId,
      sessionId,
      turnIdx,
      role,
      ...(extra.phase && { phase: extra.phase }),
      ...(extra.recallReason && { recallReason: extra.recallReason }),
      ...(extra.splitReason && { splitReason: extra.splitReason }),
      ...(extra.reportsPath && { reportsPath: extra.reportsPath }),
      ...(extra.summaryHash && { summaryHash: extra.summaryHash }),
    };
    fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * tool_response 첫 줄에서 `{ROLE}_WRITE_DONE: <path>` 또는 `DEV_WRITE_DONE: ...` 등
 * 표준 마커 매칭하여 reports/ 경로 추출.
 */
function extractReportsPath(toolResponse) {
  if (!toolResponse) return null;
  let text = '';
  if (typeof toolResponse === 'string') text = toolResponse;
  else if (typeof toolResponse === 'object') {
    // tool_response가 객체면 content/result/text 필드 후보
    text = toolResponse.content || toolResponse.result || toolResponse.text || JSON.stringify(toolResponse);
  }
  const head = String(text).slice(0, 1000);
  const m = head.match(/[A-Z]+_WRITE_DONE:\s*([^\s\n\r]+)/);
  if (m) return m[1];
  return null;
}

function log(msg) {
  console.error(`[post-tool-use-task] ${msg}`);
}

(async () => {
  try {
    const raw = await readStdin();
    const input = safeParseJson(raw) || {};
    const toolName = input.tool_name || input.toolName || '';
    if (!TARGET_TOOL_NAMES.includes(toolName)) {
      // silent pass — 다른 PostToolUse 발동 (Edit, Bash 등) 무시
      process.exit(0);
    }

    const cwd = input.cwd || process.env.FINALIZE_CWD || process.cwd();
    const currentSessionPath = path.join(cwd, 'memory', 'sessions', 'current_session.json');
    if (!fs.existsSync(currentSessionPath)) {
      log('current_session.json 없음, silent pass');
      process.exit(0);
    }

    const sess = readJsonFile(currentSessionPath);
    if (!sess) {
      log('current_session.json 파싱 실패, silent pass');
      process.exit(0);
    }

    // legacy 가드 — legacy 세션엔 turns push 금지 (기준 #7)
    if (sess.legacy === true) {
      log(`legacy 세션 (${sess.sessionId}), turns 박제 skip`);
      process.exit(0);
    }

    const role = extractRole(input.tool_input || input.toolInput);
    if (!role) {
      log('role 추출 실패, silent pass');
      process.exit(0);
    }

    const turns = Array.isArray(sess.turns) ? sess.turns : [];
    const turnIdx = turns.length;
    const newTurn = {
      role,
      turnIdx,
    };
    turns.push(newTurn);
    sess.turns = turns;

    if (writeJsonFile(currentSessionPath, sess)) {
      log(`turn push: role=${role} turnIdx=${turnIdx}`);
    } else {
      log('current_session.json write 실패, silent pass');
    }

    // Asset #3 (Arki rev4 Sec 2.2) — turn_log.jsonl 자동 append
    const topicId = sess.topicId;
    const sessionId = sess.sessionId;
    if (topicId && sessionId) {
      const reportsPath = extractReportsPath(input.tool_response || input.toolResponse);
      const ok = writeTurnLogEntry(cwd, topicId, role, turnIdx, sessionId, {
        ...(reportsPath && { reportsPath }),
      });
      if (ok) {
        log(`turn_log append: ${topicId} turn=${turnIdx} role=${role}${reportsPath ? ' reportsPath=' + reportsPath : ''}`);
      } else {
        log(`turn_log append 실패 (silent): topicId=${topicId}`);
      }
    } else {
      log(`turn_log skip: topicId 또는 sessionId 없음`);
    }

    process.exit(0);
  } catch (err) {
    log(`error (silent): ${err && err.message}`);
    process.exit(0);
  }
})();
