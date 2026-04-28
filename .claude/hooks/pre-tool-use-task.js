#!/usr/bin/env node
/**
 * PreToolUse(Task) hook — Asset #1 v3 (topic_127, 2026-04-28 P2 구현).
 *
 * v2 (topic+session layer inject) → v3 (+ persona 3층 compose + transition checkpoint):
 *   - buildPersonaLayer: _common.md + policies/role-{r}.md + personas/role-{r}.md concat
 *   - evaluateTransitionCheckpoint: Grade A/B/S framing 토픽의 design-approved → implementing 알림
 *   - KNOWN_ROLES에 vera 추가 (P2 흡수)
 *   - 절삭 우선순위: sessionLayer → topicLayer → persona-layer 절삭 금지
 *
 * 안전:
 *   - 무한 루프 방지: prompt에 이미 [PRE-TOOL-USE-TASK-INJECTED] 마커 있으면 skip.
 *   - 에러 시 silent pass — 원본 호출 보호.
 *   - token cap: 보고서당 MAX_CHARS_PER_REPORT, 총합 TOTAL_CAP_CHARS 초과 시 절삭.
 *
 * 로그: logs/pre-tool-use-task.log (jsonl)
 * 로그 phase: mutate-v3-persona | persona-missing | persona-over-cap | gate-check | gate-triggered | skip-already-injected | error
 */

const fs = require('fs');
const path = require('path');

const TARGET_TOOL_NAMES = ['Task', 'Agent'];
const ROLE_AGENT_PREFIX = 'role-';
// vera 추가 (P2, topic_127)
const KNOWN_ROLES = ['ace', 'arki', 'fin', 'riki', 'nova', 'dev', 'edi', 'designer', 'vera'];
const INJECTION_MARKER = '[PRE-TOOL-USE-TASK-INJECTED]';
const MAX_CHARS_PER_REPORT = 6000;   // 보고서 1개당 최대 (약 1.5K tokens)
const MAX_CHARS_PER_EDI   = 8000;   // Edi 보고서는 좀 더 허용
const TOTAL_CAP_CHARS    = 80000;   // 전체 inject 총합 최대

// transition checkpoint 적용 대상 grade (D-G)
const TRANSITION_GATE_GRADES = ['A', 'B', 'S'];

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
 * [v3 신규] buildPersonaLayer — 3층 페르소나 compose.
 *
 * 절삭 우선순위 (TOTAL_CAP_CHARS 초과 시):
 *   1. sessionLayer turns 절삭 (외부에서 처리)
 *   2. sessionLayer 전체 drop (외부에서 처리)
 *   3. topicLayer Edi 보고서 절삭 (외부에서 처리)
 *   4. topicLayer 전체 drop (외부에서 처리)
 *   5. persona-layer는 절삭 대상에서 제외 → PERSONA_OVER_CAP 마커 + 서브 발언 거부
 *
 * @param {string} cwd - 프로젝트 루트
 * @param {string} role - 역할명 (소문자)
 * @returns {{ content: string, markers: string[] }}
 */
function buildPersonaLayer(cwd, role) {
  const markers = [];
  const parts = [];

  // 1. _common.md
  const commonPath = path.join(cwd, 'memory', 'roles', 'policies', '_common.md');
  const commonContent = readTextFile(commonPath);
  if (commonContent) {
    parts.push(commonContent.trim());
  } else {
    markers.push('⚠ COMMON_POLICY_MISSING');
  }

  // 2. policies/role-{role}.md (없으면 조용히 스킵 — P3 완료 전 잔여 역할)
  if (role && role !== 'unknown') {
    const policyPath = path.join(cwd, 'memory', 'roles', 'policies', `role-${role}.md`);
    const policyContent = readTextFile(policyPath);
    if (policyContent) {
      parts.push(policyContent.trim());
    }
    // 없으면 조용히 스킵 (잔여 역할 P3 완료 전)
  }

  // 3. personas/role-{role}.md — 마지막에 와야 톤 잔존
  if (role && role !== 'unknown') {
    const personaPath = path.join(cwd, 'memory', 'roles', 'personas', `role-${role}.md`);
    const personaContent = readTextFile(personaPath);
    if (personaContent) {
      parts.push(personaContent.trim());
    } else {
      markers.push(`⚠ PERSONA_INJECT_FAILED: role=${role}`);
    }
  }

  const content = parts.join('\n\n---\n\n');
  return { content, markers };
}

/**
 * [v3 신규] evaluateTransitionCheckpoint — transition gate 평가.
 *
 * D-G 조건:
 *   1. 해당 토픽 grade가 A/B/S인가?
 *   2. topicType === 'framing'인가?
 *   3. status가 'implementing'이 아닌가? (이미 진입했으면 패스)
 *
 * 3조건 모두 true → ⚠ TRANSITION_GATE 마커 반환.
 * 조건 미충족 → null 반환 (조용히 패스).
 * 파일 없음/파싱 실패 → null (gate는 선택적, D-G 정합).
 *
 * 활성화 조건 (D-G / R-5): PD-052 resolved 후에만 status 토글 발동.
 * 현재 세션은 마커 prepend만 — status 토글 비활성.
 *
 * @param {string} cwd
 * @param {string} topicId
 * @returns {string|null} 마커 문자열 또는 null
 */
function evaluateTransitionCheckpoint(cwd, topicId) {
  if (!topicId) return null;

  try {
    const indexPath = path.join(cwd, 'memory', 'shared', 'topic_index.json');
    const index = readJsonFile(indexPath);
    if (!index || !Array.isArray(index.topics)) return null;

    const topic = index.topics.find(t => t.id === topicId);
    if (!topic) return null;

    // D-G: Grade A/B/S framing 토픽만 적용
    const grade = (topic.grade || '').toUpperCase();
    if (!TRANSITION_GATE_GRADES.includes(grade)) return null;

    // framing topicType만 적용
    if (topic.topicType !== 'framing') return null;

    // 이미 implementing 상태면 패스
    if (topic.status === 'implementing') return null;

    // design-approved 상태에서만 게이트 발동 (또는 아직 미전이된 framing 토픽)
    // status가 completed/suspended/cancelled면 패스
    const passStatuses = ['completed', 'suspended', 'cancelled'];
    if (passStatuses.includes(topic.status)) return null;

    return `⚠ TRANSITION_GATE: topic '${topicId}' 상태 '${topic.status}' — 구현 진입 전 "구현 진입" 또는 "approve-impl" 확인 필요 (D-G, PD-052 resolved 후 활성화)`;
  } catch {
    return null; // 파일 없음/파싱 실패 → 조용히 패스
  }
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

/**
 * [v3] composeInjection — persona layer 포함 최종 합성.
 *
 * 절삭 계층 (외부에서 단계적 호출):
 *   level 0 (기본): personaLayer + topicLayer + sessionLayer
 *   level 1: personaLayer + topicLayer + sessionLayerShort (최근 5 turns)
 *   level 2: personaLayer + topicLayer + null (session drop)
 *   level 3: personaLayer + null + null (topic drop)
 *   level 4: 여전히 초과 → ⚠ PERSONA_OVER_CAP 마커 + 서브 발언 거부
 */
function composeInjection(personaContent, personaMarkers, topicLayer, sessionLayer, role, gateMarker) {
  const parts = [];
  parts.push(`<dispatch-context ${INJECTION_MARKER}>`);
  parts.push(`# 자동 주입 컨텍스트 — pre-tool-use-task.js v3 (topic_127, 2026-04-28 P2)`);
  parts.push(`# role: ${role}`);
  parts.push(`# 이 블록을 먼저 읽고 이전 발언자들의 내용을 파악한 후 발언하세요.`);
  parts.push(``);

  // transition gate 마커 (최상단)
  if (gateMarker) {
    parts.push(gateMarker);
    parts.push(``);
  }

  // persona 마커 (오류 알림)
  if (personaMarkers && personaMarkers.length > 0) {
    for (const m of personaMarkers) {
      parts.push(m);
    }
    parts.push(``);
  }

  // persona layer
  if (personaContent) {
    parts.push(`## 페르소나 및 역할 정책`);
    parts.push(``);
    parts.push(personaContent);
    parts.push(``);
  }

  // topic layer
  if (topicLayer) {
    parts.push(topicLayer);
    parts.push('');
  }

  // session layer
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

    // [v3] persona layer 빌드
    const { content: personaContent, markers: personaMarkers } = buildPersonaLayer(cwd, role);

    // [v3] transition gate 평가
    const gateMarker = evaluateTransitionCheckpoint(cwd, topicId);

    const topicLayer = buildTopicLayer(cwd, topicId, sessionId);
    const sessionLayer = buildSessionLayer(cwd, sess);

    // 단계적 절삭 (persona layer는 절삭 금지)
    let injection = composeInjection(personaContent, personaMarkers, topicLayer, sessionLayer, role, gateMarker);

    // Level 1: session turns 절삭 (최근 5건)
    if (injection.length > TOTAL_CAP_CHARS) {
      const truncatedSess = sess ? { ...sess, turns: (sess.turns || []).slice(-5) } : sess;
      const sessionLayerShort = buildSessionLayer(cwd, truncatedSess);
      injection = composeInjection(personaContent, personaMarkers, topicLayer, sessionLayerShort, role, gateMarker);
    }

    // Level 2: session layer 전체 drop
    if (injection.length > TOTAL_CAP_CHARS) {
      injection = composeInjection(personaContent, personaMarkers, topicLayer, null, role, gateMarker);
    }

    // Level 3: topic layer drop
    if (injection.length > TOTAL_CAP_CHARS) {
      injection = composeInjection(personaContent, personaMarkers, null, null, role, gateMarker);
    }

    // Level 4: 여전히 초과 → PERSONA_OVER_CAP (persona layer는 절삭 불가)
    if (injection.length > TOTAL_CAP_CHARS) {
      const overCapMarkers = [...(personaMarkers || []), '⚠ PERSONA_OVER_CAP: 페르소나 크기가 cap을 초과합니다. 이 서브에이전트 발언을 진행하기 전에 Master에게 보고하세요.'];
      injection = composeInjection(personaContent, overCapMarkers, null, null, role, gateMarker);
      logEntry(cwd, { ts, phase: 'persona-over-cap', role, topicId, injectionLen: injection.length });
    }

    const mutatedPrompt = injection + originalPrompt;
    const updatedInput = { ...toolInput, prompt: mutatedPrompt };

    // permissionDecision 제거 (2026-04-28, topic_130) — auto mode/bypass permissions와 충돌.
    // updatedInput만 반환하여 페르소나·컨텍스트 주입은 유지하되 권한 결정엔 개입하지 않음.
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        updatedInput,
      },
    };

    // 로그 phase 분리 (v3)
    const logPhase = personaMarkers.some(m => m.includes('PERSONA_INJECT_FAILED'))
      ? 'persona-missing'
      : 'mutate-v3-persona';

    logEntry(cwd, {
      ts,
      phase: logPhase,
      toolName,
      role,
      topicId,
      sessionId,
      gateTriggered: !!gateMarker,
      personaMarkers,
      originalPromptLen: originalPrompt.length,
      injectionLen: injection.length,
      mutatedPromptLen: mutatedPrompt.length,
    });

    if (gateMarker) {
      logEntry(cwd, { ts, phase: 'gate-triggered', topicId, role, gateMarker });
    }

    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  } catch (err) {
    logEntry(cwd, { ts, phase: 'error', message: err && err.message });
    process.exit(0);
  }
})();
