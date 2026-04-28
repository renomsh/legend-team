#!/usr/bin/env node
/**
 * PreToolUse(Task) hook — Asset #1 v2 (PD-033 / topic_121, 2026-04-28 개선).
 *
 * v1 (경로 힌트) → v2 (실제 내용 inject):
 *   - 세션 layer: 현재 세션 전체 turn 보고서 내용 직접 읽어서 박음
 *   - 토픽 layer: 이전 세션 Edi 보고서 내용 직접 읽어서 박음
 *   에이전트가 Read 도구를 따로 호출할 필요 없음.
 *
 * Agent(Task) 호출 직전 자동 발동. 호출되는 서브에이전트의 prompt에
 * "토픽 layer + 세션 layer" 컨텍스트를 자동 prepend.
 *
 * 안전:
 *   - 무한 루프 방지: prompt에 이미 [PRE-TOOL-USE-TASK-INJECTED] 마커 있으면 skip.
 *   - 에러 시 silent pass — 원본 호출 보호.
 *   - token cap: 보고서당 MAX_CHARS_PER_REPORT, 총합 TOTAL_CAP_CHARS 초과 시 절삭.
 *
 * 로그: logs/pre-tool-use-task.log (jsonl)
 */

const fs = require('fs');
const path = require('path');

const TARGET_TOOL_NAMES = ['Task', 'Agent'];
const ROLE_AGENT_PREFIX = 'role-';
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer'];
const INJECTION_MARKER = '[PRE-TOOL-USE-TASK-INJECTED]';
const MAX_CHARS_PER_REPORT = 6000;   // 보고서 1개당 최대 (약 1.5K tokens)
const MAX_CHARS_PER_EDI   = 8000;   // Edi 보고서는 좀 더 허용
const TOTAL_CAP_CHARS    = 80000;   // 전체 inject 총합 최대

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

function readTextFile(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch { return null; }
}

function truncate(text, maxChars, label) {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + `\n\n... [이하 생략 — ${label} 전문은 Read 도구로 확인]\n`;
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
 *   3. description 첫 단어 휴리스틱 (호환)
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

/**
 * 역할별 최신 보고서 파일 찾기 (mtime 기준)
 */
function findLatestReport(cwd, reportPath, role) {
  if (!reportPath || !role) return null;
  try {
    const dir = path.join(cwd, reportPath);
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith(`${role}_rev`) && f.endsWith('.md'));
    if (files.length === 0) return null;
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
 * 세션 layer — 현재 세션 전체 turn 보고서 실제 내용 inject.
 * 이전 발언자가 무슨 말을 했는지 에이전트가 Read 없이 바로 알 수 있음.
 */
function buildSessionLayer(cwd, sess) {
  if (!sess || !Array.isArray(sess.turns) || sess.turns.length === 0) return null;

  const reportPath = sess.reportPath;
  const turns = sess.turns;
  const parts = [];

  parts.push(`### 세션 내 이전 발언 전문 (${sess.sessionId}, 총 ${turns.length} turns)`);
  parts.push(`> 아래 내용을 파악한 후 발언하세요. 이전 발언자들의 결론과 충돌하거나 중복되지 않게 하세요.\n`);

  // 역할별 최신 rev만 추출 (같은 역할이 여러 번 발언해도 최신 1건)
  const seenRoles = new Map(); // role -> { turnIdx, reportFile }
  for (const t of turns) {
    const role = t.role || '?';
    const turnIdx = t.turnIdx ?? '?';
    const reportFile = findLatestReport(cwd, reportPath, role);
    if (reportFile) {
      // 동일 역할 복수 발언 시 모두 포함 (rev 번호로 구분됨)
      seenRoles.set(`${role}_turn${turnIdx}`, { role, turnIdx, reportFile });
    }
  }

  // turn 순서대로 정렬하여 inject
  const entries = [];
  for (const t of turns) {
    const role = t.role || '?';
    const turnIdx = t.turnIdx ?? '?';
    const key = `${role}_turn${turnIdx}`;
    if (seenRoles.has(key)) {
      entries.push({ ...seenRoles.get(key) });
      seenRoles.delete(key); // 중복 방지
    }
  }

  for (const { role, turnIdx, reportFile } of entries) {
    const absPath = path.join(cwd, reportFile.replace(/\//g, path.sep));
    const raw = readTextFile(absPath);
    if (!raw) {
      parts.push(`\n#### turn ${turnIdx} [${role}] — 보고서 없음 (${reportFile})`);
      continue;
    }
    const content = truncate(raw, MAX_CHARS_PER_REPORT, `${reportFile}`);
    parts.push(`\n#### turn ${turnIdx} [${role}] (${reportFile})`);
    parts.push(content);
    parts.push('---');
  }

  return parts.join('\n');
}

/**
 * 토픽 layer — 이전 세션 Edi 보고서 실제 내용 inject.
 * session-end-finalize.js가 세션 종료 시 edi 보고서를
 * topics/{topicId}/session_contributions/{sessionId}_edi_report.md 로 복사해둔다.
 */
function buildTopicLayer(cwd, topicId, currentSessionId) {
  if (!topicId) return null;
  const lines = [];
  lines.push(`### 이전 세션 Edi 요약 (${topicId})`);

  const scDir = path.join(cwd, 'topics', topicId, 'session_contributions');
  if (!fs.existsSync(scDir)) {
    lines.push('- 이전 세션 기록 없음 (신규 토픽)');
    return lines.join('\n');
  }

  let ediFiles = [];
  try {
    ediFiles = fs.readdirSync(scDir)
      .filter(f => f.endsWith('_edi_report.md'))
      .sort();
  } catch {}

  if (ediFiles.length === 0) {
    // fallback: 세션 기여 요약 파일만 있는 경우
    let metaFiles = [];
    try {
      metaFiles = fs.readdirSync(scDir)
        .filter(f => f.endsWith('.md') && !f.includes('_edi_report'))
        .sort();
    } catch {}

    if (metaFiles.length === 0) {
      lines.push('- 이전 세션 Edi 기록 없음');
    } else {
      lines.push(`> Edi 전문 보고서 미생성. 세션 메타 요약만 제공 (session-end 이후 _edi_report.md 생성됨)\n`);
      for (const f of metaFiles.slice(-3)) {
        const absPath = path.join(scDir, f);
        const raw = readTextFile(absPath);
        if (raw) {
          lines.push(`\n#### ${f}`);
          lines.push(truncate(raw, 3000, f));
          lines.push('---');
        }
      }
    }
    return lines.join('\n');
  }

  lines.push(`> 이전 ${ediFiles.length}개 세션의 Edi 최종 정리 내용입니다. 이 토픽의 결정·컨텍스트를 파악하세요.\n`);

  for (const f of ediFiles) {
    // 현재 세션 것은 skip (아직 작성 중)
    if (currentSessionId && f.startsWith(currentSessionId)) continue;
    const absPath = path.join(scDir, f);
    const raw = readTextFile(absPath);
    if (!raw) continue;
    lines.push(`\n#### ${f}`);
    lines.push(truncate(raw, MAX_CHARS_PER_EDI, f));
    lines.push('---');
  }

  return lines.join('\n');
}

function composeInjection(topicLayer, sessionLayer, role) {
  const parts = [];
  parts.push(`<dispatch-context ${INJECTION_MARKER}>`);
  parts.push(`# 자동 주입 컨텍스트 — pre-tool-use-task.js v2 (PD-033 / D-103)`);
  parts.push(`# role: ${role}`);
  parts.push(`# 이 블록을 먼저 읽고 이전 발언자들의 내용을 파악한 후 발언하세요.`);
  parts.push(``);
  if (topicLayer) {
    parts.push(topicLayer);
    parts.push('');
  }
  if (sessionLayer) {
    parts.push(sessionLayer);
    parts.push('');
  }
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
      process.exit(0);
    }

    const toolInput = input.tool_input || input.toolInput || {};
    const originalPrompt = typeof toolInput.prompt === 'string' ? toolInput.prompt : '';

    // 무한 루프 방지
    if (originalPrompt.includes(INJECTION_MARKER)) {
      logEntry(cwd, { ts, phase: 'skip-already-injected', toolName });
      process.exit(0);
    }

    const role = extractRole(toolInput);

    const sessPath = path.join(cwd, 'memory', 'sessions', 'current_session.json');
    const sess = readJsonFile(sessPath);

    const topicId = sess && sess.topicId ? sess.topicId : null;
    const sessionId = sess && sess.sessionId ? sess.sessionId : null;

    const topicLayer = buildTopicLayer(cwd, topicId, sessionId);
    const sessionLayer = buildSessionLayer(cwd, sess);

    let injection = composeInjection(topicLayer, sessionLayer, role);

    // 총합 cap: 초과 시 단계적 절삭
    if (injection.length > TOTAL_CAP_CHARS) {
      // 세션 layer만 재구성 (최근 5 turns 한도, 더 공격적 절삭)
      const truncatedSess = sess ? { ...sess, turns: (sess.turns || []).slice(-5) } : sess;
      const sessionLayerShort = buildSessionLayer(cwd, truncatedSess);
      injection = composeInjection(topicLayer, sessionLayerShort, role);
    }
    if (injection.length > TOTAL_CAP_CHARS) {
      // 토픽 layer만 보존
      injection = composeInjection(topicLayer, null, role);
    }

    const mutatedPrompt = injection + originalPrompt;
    const updatedInput = { ...toolInput, prompt: mutatedPrompt };

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: 'Asset #1 v2 — auto-inject topic+session content',
        updatedInput,
      },
    };

    logEntry(cwd, {
      ts,
      phase: 'mutate-v2',
      toolName,
      role,
      topicId,
      sessionId,
      originalPromptLen: originalPrompt.length,
      injectionLen: injection.length,
      mutatedPromptLen: mutatedPrompt.length,
    });

    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  } catch (err) {
    logEntry(cwd, { ts, phase: 'error', message: err && err.message });
    process.exit(0);
  }
})();
