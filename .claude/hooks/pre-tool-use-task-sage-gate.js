#!/usr/bin/env node
/**
 * PreToolUse(Task) hook — Sage same-session isolation gate (D-128).
 *
 * 단일 책임 (SRP, Martin 2003 + NIST SP 800-160 Vol.2 Defense in Depth):
 *   - role === 'sage' 시 same-session에 다른 페르소나 turn 존재하면 차단
 *   - 직전 turn이 sage였는데 다른 role 호출 시 차단 (sage 후 다른 페르소나 진입 차단)
 *   - 그 외 silent pass
 *
 * 본 hook은 pre-tool-use-task.js와 분리되어 단일 책임 보존 (Fin SRP anchor 정합).
 * 별도 hook chain entry (settings.json PreToolUse Task hooks 배열 2번째).
 *
 * 차단 메커니즘: process.exit(2) + stderr 메시지 — Claude Code가 hook 실패 시 tool 호출 차단.
 *
 * dispatch_config.json `rules.sage.session_isolation: "exclusive"` read해 활성화.
 *
 * R-1 자기참조 paradox 잔존 (caveat):
 *   - extractRole()이 ## ROLE: 마커 우선이라 마커 위조 시 우회 가능.
 *   - 후속 토픽 (topic_138 후보)에서 subagent_type AND marker 이중 검증 + PostToolUse 재검증 강화 예정.
 *   - 본 시점은 "honest best-effort" — D4 부분 정합, 자기참조 paradox는 정직 박제 (D-126 본문).
 *
 * 로그: logs/sage-gate.log (jsonl)
 * 안전: 에러 시 silent pass — 원본 호출 보호 (단, role==='sage' 명시 위반은 hard block).
 */

const fs = require('fs');
const path = require('path');

const TARGET_TOOL_NAMES = ['Task', 'Agent'];
const ROLE_AGENT_PREFIX = 'role-';
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer', 'vera', 'sage', 'zero'];

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    setTimeout(() => resolve(data), 2000);
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

function logEntry(cwd, payload) {
  try {
    const logDir = path.join(cwd, 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'sage-gate.log');
    fs.appendFileSync(logPath, JSON.stringify(payload) + '\n', 'utf8');
  } catch { /* silent */ }
}

/**
 * D-103 extractRole 동형 (pre-tool-use-task.js 1:1 재현):
 *   1. prompt 본문 첫 500자에 `## ROLE: <name>` 또는 `[ROLE:<name>]` 마커
 *   2. tool_input.subagent_type (`role-<name>` prefix)
 *   3. description 첫 단어 휴리스틱
 *   4. 실패 → "unknown"
 */
function extractRole(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return 'unknown';

  const prompt = (toolInput.prompt || '');
  const promptHead = prompt.slice(0, 500);
  const markerMatch = promptHead.match(/(?:##\s+ROLE:|\[ROLE:)\s*([a-zA-Z]+)\s*\]?/i);
  if (markerMatch) {
    const r = markerMatch[1].toLowerCase();
    if (KNOWN_ROLES.includes(r)) return r;
  }

  const subagentType = toolInput.subagent_type || toolInput.subagentType;
  if (typeof subagentType === 'string') {
    let s = subagentType.toLowerCase();
    if (s.startsWith(ROLE_AGENT_PREFIX)) s = s.slice(ROLE_AGENT_PREFIX.length);
    if (KNOWN_ROLES.includes(s)) return s;
  }

  const desc = (toolInput.description || '').toLowerCase();
  const firstWord = desc.split(/[\s\-:]+/)[0];
  if (KNOWN_ROLES.includes(firstWord)) return firstWord;

  return 'unknown';
}

function reject(cwd, ts, payload, reason) {
  logEntry(cwd, { ts, phase: 'sage-gate-reject', ...payload, reason });
  process.stderr.write(`[sage-gate] BLOCKED: ${reason}\n`);
  process.exit(2);
}

(async () => {
  const ts = new Date().toISOString();
  let cwd = process.cwd();
  try {
    const raw = await readStdin();
    const input = safeParseJson(raw) || {};
    cwd = input.cwd || cwd;
    const toolName = input.tool_name || input.toolName || '';

    if (!TARGET_TOOL_NAMES.includes(toolName)) {
      process.exit(0);
    }

    const toolInput = input.tool_input || input.toolInput || {};
    const role = extractRole(toolInput);

    // dispatch_config 정책 확인 (옵션 — 파일 없어도 default sage isolation 동작)
    const cfgPath = path.join(cwd, 'memory', 'shared', 'dispatch_config.json');
    const cfg = readJsonFile(cfgPath);
    const sageIsolation = cfg && cfg.rules && cfg.rules.sage && cfg.rules.sage.session_isolation
      ? cfg.rules.sage.session_isolation
      : 'exclusive'; // default

    // exclusive 모드 아니면 silent pass
    if (sageIsolation !== 'exclusive') {
      logEntry(cwd, { ts, phase: 'sage-gate-skip-non-exclusive', role, sageIsolation });
      process.exit(0);
    }

    // 현 세션 turns 로드
    const sessPath = path.join(cwd, 'memory', 'sessions', 'current_session.json');
    const sess = readJsonFile(sessPath);
    const turns = (sess && Array.isArray(sess.turns)) ? sess.turns : [];
    const turnRoles = turns.map(t => (t && t.role) ? t.role : null).filter(Boolean);

    // Case 1: role === 'sage' AND 다른 role turn 1건 이상 존재 → reject
    if (role === 'sage') {
      const nonSage = turnRoles.filter(r => r !== 'sage');
      if (nonSage.length > 0) {
        reject(cwd, ts, { role, turnRoles }, `Sage same-session isolation violation: existing roles=[${nonSage.join(',')}]. Open separate session via /sage. (D-128, dispatch_config.sage.session_isolation=exclusive)`);
      }
    }

    // Case 2: role !== 'sage' AND 마지막 turn이 sage → reject
    if (role !== 'sage' && turnRoles.length > 0 && turnRoles[turnRoles.length - 1] === 'sage') {
      reject(cwd, ts, { role, lastTurnRole: 'sage' }, `Cannot dispatch role='${role}' after Sage turn. Sage requires session isolation. (D-128)`);
    }

    // Case 3: role !== 'sage' AND turns에 sage 포함 (sage가 첫 주자였을 수 있음) → reject
    if (role !== 'sage' && turnRoles.includes('sage')) {
      reject(cwd, ts, { role, turnRoles }, `This session contains Sage turn (idx=${turnRoles.indexOf('sage')}). Sage exclusive — no other persona allowed in same session. (D-128)`);
    }

    // 통과
    logEntry(cwd, { ts, phase: 'sage-gate-pass', role, turnRolesCount: turnRoles.length });
    process.exit(0);
  } catch (err) {
    // 에러 시 silent pass — 원본 호출 보호 (단, sage 위반 hard block은 위에서 이미 process.exit(2))
    logEntry(cwd, { ts, phase: 'sage-gate-error', message: err && err.message });
    process.exit(0);
  }
})();
