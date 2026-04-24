#!/usr/bin/env node
/**
 * PostToolUse(Task) hook — D-068 (session_091, topic_096).
 *
 * Agent(Task) 툴 반환 직후 자동 발동하여 subagentId·turnId를
 * memory/sessions/current_session.json.turns 에 push 한다.
 *
 * 입력 (stdin JSON, Claude Code hook protocol 추정):
 *   {
 *     tool_name: "Task" | "Agent" | ...,
 *     tool_input: { subagent_type?: string, description?: string, prompt?: string, ... },
 *     tool_response: { agentId?: string, subagent_id?: string, ... } | string,
 *     cwd?: string,
 *     session_id?: string,
 *   }
 *
 * 박제 규칙:
 *   - tool_name이 "Task" 또는 "Agent"가 아니면 silent pass.
 *   - subagentId 추출 실패해도 invocationMode=subagent + role 추정으로 turn은 push.
 *   - role 추출은 subagent_type 기반 ("role-ace" → "ace").
 *   - current_session.json 부재·파싱 실패도 silent pass (process.exit(0)).
 *
 * 9 기준 #3 (subagentId 박제) 자동 충족 경로.
 * legacy 가드: legacy:true 세션엔 push하지 않음 (기준 #7).
 */

const fs = require('fs');
const path = require('path');

const TARGET_TOOL_NAMES = ['Task', 'Agent']; // 양쪽 모두 cover
const ROLE_AGENT_PREFIX = 'role-';
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'editor', 'designer'];

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

function extractRole(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return null;
  const subagentType = toolInput.subagent_type || toolInput.subagentType;
  if (typeof subagentType === 'string') {
    let s = subagentType.toLowerCase();
    if (s.startsWith(ROLE_AGENT_PREFIX)) s = s.slice(ROLE_AGENT_PREFIX.length);
    if (KNOWN_ROLES.includes(s)) return s;
  }
  // fallback: description 텍스트에서 역할명 단어 매칭
  const desc = (toolInput.description || '').toLowerCase();
  for (const r of KNOWN_ROLES) {
    if (desc.includes(r)) return r;
  }
  return null;
}

function extractSubagentId(toolResponse, fallbackSessionId) {
  if (toolResponse && typeof toolResponse === 'object') {
    if (typeof toolResponse.agentId === 'string') return toolResponse.agentId;
    if (typeof toolResponse.subagent_id === 'string') return toolResponse.subagent_id;
    if (typeof toolResponse.subagentId === 'string') return toolResponse.subagentId;
    if (typeof toolResponse.id === 'string') return toolResponse.id;
  }
  // fallback: hook 호출 session_id + 타임스탬프로 합성
  const ts = Date.now().toString(36);
  if (fallbackSessionId) return `${fallbackSessionId.slice(0, 8)}-${ts}`;
  return `auto-${ts}`;
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

    const subagentId = extractSubagentId(
      input.tool_response || input.toolResponse,
      input.session_id || input.sessionId
    );

    const turns = Array.isArray(sess.turns) ? sess.turns : [];
    const turnIdx = turns.length;
    const newTurn = {
      role,
      turnIdx,
      invocationMode: 'subagent',
      subagentId,
    };
    turns.push(newTurn);
    sess.turns = turns;

    if (writeJsonFile(currentSessionPath, sess)) {
      log(`turn push: role=${role} turnIdx=${turnIdx} subagentId=${subagentId}`);
    } else {
      log('current_session.json write 실패, silent pass');
    }
    process.exit(0);
  } catch (err) {
    log(`error (silent): ${err && err.message}`);
    process.exit(0);
  }
})();
