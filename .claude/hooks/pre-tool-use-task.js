#!/usr/bin/env node
/**
 * PreToolUse(Task) hook — Asset #1 v4 (topic_157, session_183).
 *
 * v3 → v4 (+ Zero 정제 게이트 자동 강제):
 *   - findLatestReport(): {role}_condensed.md 우선 체크. 있으면 condensed 사용, 없으면 최신 rev fallback.
 *   - evaluateZeroCondenseGate(): role==='edi' 호출 시 _zero_condense.json 마커 체크.
 *     마커 없으면 Edi 프롬프트를 BLOCK 응답으로 mutate → Nexus가 Zero 먼저 dispatch하도록 유도.
 *   - 마커 파일: reports/{reportPath}/_zero_condense.json — Zero가 D.Condense 완료 시 생성.
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
// PD-059 resolved (session_179): KNOWN_ROLES 단일 출처 — lib/known-roles.js SOT
const { KNOWN_ROLES } = require('./lib/known-roles');
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
 * 역할별 최신 보고서 파일 찾기.
 * Zero 정제 게이트 output({role}_condensed.md) 우선 사용. 없으면 최신 rev fallback.
 */
function findLatestReport(cwd, reportPath, role) {
  if (!reportPath || !role) return null;
  try {
    const dir = path.join(cwd, reportPath);
    if (!fs.existsSync(dir)) return null;

    // Zero 정제 게이트 output 우선 (topic_157, session_183)
    const condensedName = `${role}_condensed.md`;
    if (fs.existsSync(path.join(dir, condensedName))) {
      return path.posix.join(reportPath.replace(/\\/g, '/'), condensedName);
    }

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
 * [v4] Zero Condense 게이트 평가.
 *
 * role === 'edi' 호출 시:
 *   - reports/{reportPath}/_zero_condense.json 마커 파일 체크
 *   - 마커가 있고 sessionId 일치 → null (게이트 통과)
 *   - 마커 없거나 sessionId 불일치 → BLOCK 메시지 반환
 *
 * 마커 없을 때 Edi 프롬프트는 BLOCK 응답으로 교체됨 (Edi가 차단 메시지만 출력 후 종료).
 * Nexus는 차단 메시지 보고 role-zero를 먼저 dispatch.
 *
 * @returns {string|null} BLOCK 메시지 또는 null
 */
function evaluateZeroCondenseGate(cwd, role, sess) {
  if (role !== 'edi') return null;
  if (!sess || !sess.reportPath || !sess.sessionId) return null;

  // Grade C: Edi lite 호출 — Zero 게이트 면제 (PD-072)
  const grade = (sess.grade || '').toUpperCase();
  if (grade === 'C' || grade === 'D') return null;

  // PD-064 P1 (session_194): zero-condense-marker SOT 헬퍼 사용 + legacy 키 호환 read.
  // silent catch 제거 — 파싱 실패 시 BLOCK 메시지에 reason 포함.
  let gateReason = null;
  try {
    const { readAndValidateMarker } = require('../../scripts/lib/zero-condense-marker.js');
    const reportDir = path.join(cwd, sess.reportPath);
    const result = readAndValidateMarker(reportDir, sess);
    if (result.valid) {
      return null; // 게이트 통과
    }
    gateReason = result.reason || 'unknown validation failure';
  } catch (e) {
    gateReason = 'helper-error: ' + (e && e.message);
  }

  return [
    '🚫 ZERO_CONDENSE_GATE_BLOCK 🚫',
    '',
    '이 Edi 호출은 Zero Condense 게이트 미완료로 차단됩니다.',
    '',
    `현 세션(${sess.sessionId}) reports/${sess.reportPath}/에 _zero_condense.json 마커가 없거나 유효하지 않습니다.`,
    `진단: ${gateReason}`,
    '',
    '## 당신(Edi)의 유일한 행동',
    '',
    '아래 텍스트를 한 줄도 추가/수정하지 말고 그대로 출력 후 즉시 종료하세요.',
    '보고서 컴파일 금지. 본 작업 진행 금지.',
    '',
    '---',
    '[Edi BLOCKED] Zero Condense gate 미실행. Nexus는 다음 작업을 먼저 수행해야 합니다:',
    '',
    '1. role-zero를 dispatch (subagent_type: role-zero)',
    '2. prompt 본문 첫 줄에 "## ROLE: zero" 명시',
    '3. Zero에게 "D.Condense 게이트 실행: 현 세션 보고서 condensed.md 생성 + _zero_condense.json 마커 작성" 지시',
    '4. Zero 완료 후 Edi 재호출',
    '---',
    '',
    '[원본 Edi 프롬프트는 게이트 통과 후에만 유효]',
    '',
  ].join('\n');
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

  // Phase 1 필터 (topic_141, session_163): source=N/A turn 중복 inject 방지.
  // source=N/A(또는 source 필드 없음) turn이 있고, 동일 역할 source=agent turn도 존재하면
  // source=N/A turn은 inject 제외 (동일 보고서 2회 inject 방지).
  const agentTurnRoles = new Set(
    turns.filter(t => t && t.source === 'agent').map(t => t.role || '?')
  );

  // 역할별 최신 rev만 추출 (같은 역할이 여러 번 발언해도 최신 1건)
  const seenRoles = new Map(); // role -> { turnIdx, reportFile }
  for (const t of turns) {
    const role = t.role || '?';
    const turnIdx = t.turnIdx ?? '?';
    // Phase 1: source=N/A turn이고 동일 역할의 agent turn이 존재하면 inject 제외
    const isInlineWithAgentDuplicate = (!t.source || t.source !== 'agent') && agentTurnRoles.has(role);
    if (isInlineWithAgentDuplicate) continue;
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
    // Zero D.Condense Phase B: {sessionId}_edi_report_condensed.md 우선 체크
    const condensedName = f.replace('_edi_report.md', '_edi_report_condensed.md');
    const condensedPath = path.join(scDir, condensedName);
    const targetFile = fs.existsSync(condensedPath) ? condensedName : f;
    const absPath = path.join(scDir, targetFile);
    const raw = readTextFile(absPath);
    if (!raw) continue;
    lines.push(`\n#### ${targetFile}`);
    lines.push(truncate(raw, MAX_CHARS_PER_EDI, targetFile));
    lines.push('---');
  }

  return lines.join('\n');
}

/**
 * D-170-A1 P6 (session_209, topic_176, 2026-05-08) — blind-parallel 도메인 범위 prepend.
 *
 * operationMode='blind-parallel' 인 세션에서 Task/Agent 툴 dispatch 시
 * dispatch_config.json.role_domain_template[role] 을 읽어 프롬프트 최상단에 주입.
 *
 * 목적:
 *   - blind-parallel phase에서 각 역할이 자신의 분석 범위를 명시적으로 인지
 *   - 다른 역할 발언 미열람(격리) 상태에서 도메인 오버랩 방지
 *
 * 역할이 role_domain_template에 없으면 경고 마커 반환 (role_domain_map 검증).
 * operationMode !== 'blind-parallel' → null 반환 (조용히 pass).
 */
function buildBlindParallelDomainMarker(cwd, role, sess) {
  if (!sess) return null;
  const isBlindParallel =
    sess.operationMode === 'blind-parallel' || sess.phase === 'blind-parallel';
  if (!isBlindParallel) return null;
  if (!role || role === 'unknown') return null;

  try {
    const configPath = path.join(cwd, 'memory', 'shared', 'dispatch_config.json');
    const config = readJsonFile(configPath);
    if (!config || !config.role_domain_template) {
      return `⚠ BLIND_PARALLEL_DOMAIN_MISSING: dispatch_config.role_domain_template 없음 — 도메인 범위 주입 불가 (D-170-A1)`;
    }

    const domain = config.role_domain_template[role];
    if (!domain) {
      return `⚠ BLIND_PARALLEL_DOMAIN_UNDEFINED: role='${role}'이 role_domain_template에 없음 — 도메인 범위 미지정 (D-170-A1)`;
    }

    return [
      `## 🔲 blind-parallel 도메인 범위 (D-170-A1)`,
      ``,
      `역할: **${role}**`,
      `담당 도메인: **${domain}**`,
      ``,
      `이 분석은 위 도메인 범위 내에서만 수행하세요.`,
      `다른 역할의 도메인을 침범하지 말고, 위 범위에 집중하세요.`,
      `phase: blind-parallel — 다른 역할의 발언을 볼 수 없습니다 (격리 실행).`,
    ].join('\n');
  } catch (e) {
    return `⚠ BLIND_PARALLEL_DOMAIN_ERROR: ${e && e.message}`;
  }
}

/**
 * D-170-A2 (session_215) — discussion 모드 synthesis phase Ace 차단.
 *
 * operationType='discussion' + phase='synthesis' + role='ace' 조합에서
 * Ace dispatch를 차단. synthesis는 Edi 단일 호출만 허용.
 * /ace-synthesis는 structured 모드 한정.
 *
 * @returns {string|null} BLOCK 메시지 또는 null
 */
function evaluateSynthesisAceBlock(role, sess) {
  if (role !== 'ace') return null;
  if (!sess || sess.operationType !== 'discussion') return null;
  if (sess.phase !== 'synthesis') return null;

  return [
    '🚫 ACE_SYNTHESIS_BLOCKED (D-170-A2) 🚫',
    '',
    '이 Ace 호출은 discussion 모드 synthesis phase에서 차단됩니다.',
    '',
    `현재 세션: operationType=discussion, phase=synthesis`,
    'synthesis phase에서는 Edi 단일 호출만 허용됩니다.',
    '/ace-synthesis는 structured 모드 한정입니다.',
    '',
    '## 당신(Ace)의 유일한 행동',
    '',
    '아래 메시지를 한 줄도 추가하지 말고 그대로 출력 후 즉시 종료하세요.',
    '',
    '---',
    '[Ace BLOCKED] discussion 모드 synthesis phase에서 /ace-synthesis는 허용되지 않습니다.',
    'Nexus는 Edi를 대신 dispatch하세요.',
    '---',
    '',
  ].join('\n');
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

    // [D-170-A2] discussion 모드 synthesis phase Ace 차단 (session_215)
    const synthAceBlock = evaluateSynthesisAceBlock(role, sess);
    if (synthAceBlock) {
      const blockedPrompt = synthAceBlock + '\n' + originalPrompt;
      const blockedInput = { ...toolInput, prompt: blockedPrompt };
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          updatedInput: blockedInput,
        },
      };
      logEntry(cwd, {
        ts,
        phase: 'discussion-synthesis-ace-block',
        role,
        sessionId,
        operationType: sess ? sess.operationType : null,
        sessionPhase: sess ? sess.phase : null,
      });
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    // [v4] Zero Condense 게이트 — Edi 호출 시 마커 미존재면 차단
    const condenseBlock = evaluateZeroCondenseGate(cwd, role, sess);
    if (condenseBlock) {
      const blockedPrompt = condenseBlock + '\n' + originalPrompt;
      const blockedInput = { ...toolInput, prompt: blockedPrompt };
      const output = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          updatedInput: blockedInput,
        },
      };
      logEntry(cwd, {
        ts,
        phase: 'zero-condense-gate-block',
        role,
        sessionId,
        reportPath: sess ? sess.reportPath : null,
      });
      process.stdout.write(JSON.stringify(output));
      process.exit(0);
    }

    // [v3] persona layer 빌드
    const { content: personaContent, markers: personaMarkers } = buildPersonaLayer(cwd, role);

    // [v3] transition gate 평가
    const gateMarker = evaluateTransitionCheckpoint(cwd, topicId);

    // [P6] blind-parallel 도메인 범위 마커 (D-170-A1)
    const blindDomainMarker = buildBlindParallelDomainMarker(cwd, role, sess);
    // gateMarker + blindDomainMarker 합성 → composeInjection에 단일 파라미터로 전달
    const compositeTopMarker = [gateMarker, blindDomainMarker].filter(Boolean).join('\n\n') || null;

    const topicLayer = buildTopicLayer(cwd, topicId, sessionId);
    // blind-parallel phase: sessionLayer 억제 (D-170-A1 격리 강제)
    const sessionLayer =
      sess && sess.phase === 'blind-parallel' ? null : buildSessionLayer(cwd, sess);

    // 단계적 절삭 (persona layer는 절삭 금지)
    let injection = composeInjection(personaContent, personaMarkers, topicLayer, sessionLayer, role, compositeTopMarker);

    // Level 1: session turns 절삭 (최근 5건)
    if (injection.length > TOTAL_CAP_CHARS) {
      const truncatedSess = sess ? { ...sess, turns: (sess.turns || []).slice(-5) } : sess;
      const sessionLayerShort = buildSessionLayer(cwd, truncatedSess);
      injection = composeInjection(personaContent, personaMarkers, topicLayer, sessionLayerShort, role, compositeTopMarker);
    }

    // Level 2: session layer 전체 drop
    if (injection.length > TOTAL_CAP_CHARS) {
      injection = composeInjection(personaContent, personaMarkers, topicLayer, null, role, compositeTopMarker);
    }

    // Level 3: topic layer drop
    if (injection.length > TOTAL_CAP_CHARS) {
      injection = composeInjection(personaContent, personaMarkers, null, null, role, compositeTopMarker);
    }

    // Level 4: 여전히 초과 → PERSONA_OVER_CAP (persona layer는 절삭 불가)
    if (injection.length > TOTAL_CAP_CHARS) {
      const overCapMarkers = [...(personaMarkers || []), '⚠ PERSONA_OVER_CAP: 페르소나 크기가 cap을 초과합니다. 이 서브에이전트 발언을 진행하기 전에 Master에게 보고하세요.'];
      injection = composeInjection(personaContent, overCapMarkers, null, null, role, compositeTopMarker);
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
      blindParallelDomain: !!blindDomainMarker,
      operationMode: sess ? (sess.operationMode || null) : null,
      personaMarkers,
      originalPromptLen: originalPrompt.length,
      injectionLen: injection.length,
      mutatedPromptLen: mutatedPrompt.length,
    });

    if (gateMarker) {
      logEntry(cwd, { ts, phase: 'gate-triggered', topicId, role, gateMarker });
    }
    if (blindDomainMarker) {
      logEntry(cwd, { ts, phase: 'blind-parallel-domain-prepend', role, operationMode: sess ? sess.operationMode : null, blindDomainMarker });
    }

    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  } catch (err) {
    logEntry(cwd, { ts, phase: 'error', message: err && err.message });
    process.exit(0);
  }
})();
