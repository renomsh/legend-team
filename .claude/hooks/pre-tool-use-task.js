#!/usr/bin/env node
/**
 * PreToolUse(Task) hook — Asset #1 (PD-033 / topic_121, Arki rev4 spec).
 *
 * Agent(Task) 호출 직전 자동 발동. 호출되는 서브에이전트의 prompt에
 * "토픽 layer + 세션 layer" 컨텍스트를 자동 prepend하여 메인 컨텍스트
 * 휘발성을 보강한다.
 *
 * 입력 (stdin JSON, Claude Code hook protocol):
 *   {
 *     tool_name: "Task" | "Agent",
 *     tool_input: { subagent_type?, description?, prompt? },
 *     cwd?: string,
 *     session_id?: string,
 *   }
 *
 * 출력 (stdout JSON, 공식 docs PreToolUse decision control):
 *   {
 *     hookSpecificOutput: {
 *       hookEventName: "PreToolUse",
 *       permissionDecision: "allow",
 *       updatedInput: { ...full tool_input with mutated prompt }
 *     }
 *   }
 *
 * 박제 규칙 (Arki rev4 Sec 2.1 알고리즘 정합):
 *   - tool_name이 "Task"/"Agent" 아니면 silent pass.
 *   - role 추출 실패해도 컨텍스트 inject은 수행 (role 무관 토픽 layer).
 *   - 에러 시 silent pass — 원본 호출 보호.
 *   - token cap 30K char 초과 시: 토픽 layer 요약, 세션 layer 직전 1 turn만.
 *
 * 안전:
 *   - 무한 루프 방지: prompt에 이미 [PRE-TOOL-USE-TASK-INJECTED] 마커 있으면 skip.
 *
 * 로그: logs/pre-tool-use-task.log (jsonl)
 */

const fs = require('fs');
const path = require('path');

const TARGET_TOOL_NAMES = ['Task', 'Agent'];
const ROLE_AGENT_PREFIX = 'role-';
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer'];
const INJECTION_MARKER = '[PRE-TOOL-USE-TASK-INJECTED]';
const TOKEN_CAP_CHARS = 30 * 1024; // 30K chars (rough proxy for ~7-8K tokens)
const SESSION_LAYER_TURNS_DEFAULT = 3; // 직전 N turn

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
    const logPath = path.join(logDir, 'pre-tool-use-task.log');
    fs.appendFileSync(logPath, JSON.stringify(payload) + '\n', 'utf8');
  } catch {
    // silent — log 실패가 hook 자체를 망가뜨리지 않음
  }
}

/**
 * role 식별 — 다음 우선순위:
 *   1. prompt 본문 첫 부분에 `## ROLE: <name>` 또는 `[ROLE:<name>]` 명시 마커 (PD-043 표준)
 *   2. tool_input.subagent_type (`role-<name>` prefix)
 *   3. description prefix 휴리스틱 (호환)
 *   4. 실패 → "unknown"
 */
function extractRole(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return 'unknown';

  // 우선순위 1: prompt 마커
  const prompt = (toolInput.prompt || '');
  const promptHead = prompt.slice(0, 500);
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

  // 우선순위 3: description fallback (호환)
  const desc = (toolInput.description || '').toLowerCase();
  // description 첫 단어가 role명일 때만 match (오분류 방지 — Riki "Ace direction" 사고 회피)
  const firstWord = desc.split(/[\s\-:]+/)[0];
  if (KNOWN_ROLES.includes(firstWord)) return firstWord;

  return 'unknown';
}

/**
 * 세션 layer 조립 — 직전 N turn의 reports/ 경로 list.
 */
function buildSessionLayer(cwd, sess, n) {
  if (!sess || !Array.isArray(sess.turns) || sess.turns.length === 0) return null;

  const reportPath = sess.reportPath; // 예: reports/2026-04-28_pd033-agent-continuity-design
  const recentTurns = sess.turns.slice(-n);
  const lines = [];

  lines.push(`### Session Layer — 직전 ${recentTurns.length} turns (sessionId: ${sess.sessionId})`);

  for (const t of recentTurns) {
    const role = t.role || '?';
    const turnIdx = t.turnIdx ?? '?';
    // reports/ 글로브 패턴: {role}_rev{n}.md — 마지막 mtime 1건 추출
    const candidate = findLatestReport(cwd, reportPath, role);
    if (candidate) {
      lines.push(`- turn ${turnIdx} [${role}] → ${candidate}`);
    } else {
      lines.push(`- turn ${turnIdx} [${role}] (report 미발견)`);
    }
  }
  return lines.join('\n');
}

function findLatestReport(cwd, reportPath, role) {
  if (!reportPath || !role) return null;
  try {
    const dir = path.join(cwd, reportPath);
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith(`${role}_rev`) && f.endsWith('.md'));
    if (files.length === 0) return null;
    // mtime 최신 1건
    let latest = null, latestMtime = 0;
    for (const f of files) {
      const stat = fs.statSync(path.join(dir, f));
      if (stat.mtimeMs > latestMtime) {
        latest = f;
        latestMtime = stat.mtimeMs;
      }
    }
    return latest ? path.posix.join(reportPath.replace(/\\/g, '/'), latest) : null;
  } catch { return null; }
}

/**
 * 토픽 layer 조립 — turn_log.jsonl + context_brief.md 경로 + session_contributions/.
 */
function buildTopicLayer(cwd, topicId) {
  if (!topicId) return null;
  const lines = [];
  lines.push(`### Topic Layer — ${topicId}`);

  const briefPath = path.posix.join('topics', topicId, 'context_brief.md');
  const briefAbs = path.join(cwd, briefPath);
  if (fs.existsSync(briefAbs)) {
    lines.push(`- context_brief: ${briefPath}`);
  } else {
    lines.push(`- context_brief: (없음)`);
  }

  const turnLogPath = path.posix.join('topics', topicId, 'turn_log.jsonl');
  const turnLogAbs = path.join(cwd, turnLogPath);
  if (fs.existsSync(turnLogAbs)) {
    let lineCount = 0;
    try {
      const raw = fs.readFileSync(turnLogAbs, 'utf8');
      lineCount = raw.split('\n').filter(l => l.trim()).length;
    } catch {}
    lines.push(`- turn_log: ${turnLogPath} (${lineCount} entries)`);
  } else {
    lines.push(`- turn_log: (없음)`);
  }

  const scDir = path.join(cwd, 'topics', topicId, 'session_contributions');
  if (fs.existsSync(scDir)) {
    try {
      const scFiles = fs.readdirSync(scDir).filter(f => f.endsWith('.md'));
      if (scFiles.length > 0) {
        lines.push(`- session_contributions (${scFiles.length}건):`);
        for (const f of scFiles.slice(-5)) {
          lines.push(`  - ${path.posix.join('topics', topicId, 'session_contributions', f)}`);
        }
      }
    } catch {}
  }
  return lines.join('\n');
}

function composeInjection(topicLayer, sessionLayer, role) {
  const parts = [];
  parts.push(`<dispatch-context ${INJECTION_MARKER}>`);
  parts.push(`# Auto-prepended by pre-tool-use-task.js (Asset #1, PD-033)`);
  parts.push(`# 본 컨텍스트는 메인 휘발성 보강용. 필요 시 Read 도구로 위 경로를 직접 열어 확인하세요.`);
  parts.push(``);
  if (topicLayer) parts.push(topicLayer);
  if (sessionLayer) parts.push(sessionLayer);
  parts.push(``);
  parts.push(`role-detected: ${role}`);
  parts.push(`</dispatch-context>`);
  parts.push(``);
  parts.push(``);
  return parts.join('\n');
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
      // silent pass
      process.exit(0);
    }

    const toolInput = input.tool_input || input.toolInput || {};
    const originalPrompt = typeof toolInput.prompt === 'string' ? toolInput.prompt : '';

    // 무한 루프 방지: 이미 inject 마커 존재하면 skip
    if (originalPrompt.includes(INJECTION_MARKER)) {
      logEntry(cwd, { ts, phase: 'skip-already-injected', toolName });
      process.exit(0);
    }

    const role = extractRole(toolInput);

    // current_session.json read
    const sessPath = path.join(cwd, 'memory', 'sessions', 'current_session.json');
    const sess = readJsonFile(sessPath);

    const topicId = sess && sess.topicId ? sess.topicId : null;

    const topicLayer = buildTopicLayer(cwd, topicId);
    let sessionLayer = buildSessionLayer(cwd, sess, SESSION_LAYER_TURNS_DEFAULT);

    let injection = composeInjection(topicLayer, sessionLayer, role);

    // token cap 처리
    if (injection.length + originalPrompt.length > TOKEN_CAP_CHARS) {
      // 세션 layer 1 turn으로 축소
      sessionLayer = buildSessionLayer(cwd, sess, 1);
      injection = composeInjection(topicLayer, sessionLayer, role);
    }
    if (injection.length + originalPrompt.length > TOKEN_CAP_CHARS) {
      // 토픽 layer만 보존
      injection = composeInjection(topicLayer, null, role);
    }

    const mutatedPrompt = injection + originalPrompt;
    const updatedInput = { ...toolInput, prompt: mutatedPrompt };

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: 'Asset #1 — auto-prepend topic+session context',
        updatedInput,
      },
    };

    logEntry(cwd, {
      ts,
      phase: 'mutate',
      toolName,
      role,
      topicId,
      sessionId: sess && sess.sessionId,
      originalPromptLen: originalPrompt.length,
      injectionLen: injection.length,
      mutatedPromptLen: mutatedPrompt.length,
    });

    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  } catch (err) {
    logEntry(cwd, { ts, phase: 'error', message: err && err.message });
    // silent pass — 원본 호출 보호
    process.exit(0);
  }
})();
