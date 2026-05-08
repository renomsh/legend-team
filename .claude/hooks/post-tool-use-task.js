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
// PD-059 resolved (session_179): KNOWN_ROLES 단일 출처 — lib/known-roles.js SOT
const { KNOWN_ROLES } = require('./lib/known-roles');
// D-169 P3 — turnPushMode 분기 (session_209)
// CWD 기준 동적 require: hook이 다른 cwd에서 실행될 수 있으므로 top-level 고정 경로 회피.
// readTurnPushMode / pendingTurnsPath 는 main IIFE 진입 후 cwd 확정 시점에 호출.

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
 * tool_response 전체 텍스트에서 `# self-scores` YAML 블록 파싱.
 * 역할 발언 말미의 형식:
 *   # self-scores
 *   metric_key: value
 *   another: Y
 * 반환: { shortKey: value, ... } 또는 null (블록 없으면)
 */
function extractSelfScores(toolResponse) {
  if (!toolResponse) return null;
  let text = '';
  // helper: flatten content-block array → joined text
  const flattenBlocks = (arr) => arr
    .filter(item => item && item.type === 'text')
    .map(item => item.text || '')
    .join('\n');
  if (Array.isArray(toolResponse)) {
    // content block array 형식: [{"type":"text","text":"..."}]
    // JSON.stringify fallback 시 \\n 이스케이프로 split 불발 — D-155 fix (session_179)
    text = flattenBlocks(toolResponse);
  } else if (typeof toolResponse === 'string') {
    text = toolResponse;
  } else if (typeof toolResponse === 'object') {
    // PostToolUse(Task) 실제 protocol: tool_response = toolUseResult 객체
    // (keys: status, prompt, agentId, agentType, content[], usage, ...)
    // .content 가 content-block 배열이면 flatten — 이전엔 String(array)로 손실 (session_192 fix)
    if (Array.isArray(toolResponse.content)) {
      text = flattenBlocks(toolResponse.content);
    } else if (typeof toolResponse.content === 'string') {
      text = toolResponse.content;
    } else if (typeof toolResponse.result === 'string') {
      text = toolResponse.result;
    } else if (typeof toolResponse.text === 'string') {
      text = toolResponse.text;
    } else {
      text = JSON.stringify(toolResponse);
    }
  }
  text = String(text);
  // 실제 score 블록은 통상 응답 말미에 위치. 본문 narrative 내 marker 인용을 피하려고
  // lastIndexOf 사용 — session_192 turn 4 (arki rev2)에서 narrative 내 spec 축 인용이
  // 실제 블록을 가린 사례 fix.
  const idx = text.lastIndexOf('# self-scores');
  if (idx === -1) return null;

  const scores = {};
  const lines = text.slice(idx + '# self-scores'.length).split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    // 섹션 종료 마커: 코드 펜스, 구분선, 새 헤더
    if (line.startsWith('```') || line.startsWith('---') || /^#{1,3} /.test(line)) break;
    // 빈 줄: 첫 score 수집 전엔 skip (마커 직후 여백 허용), 수집 후엔 즉시 종료 (트레일링 마커 오염 방지)
    if (line === '') {
      if (Object.keys(scores).length > 0) break;
      continue;
    }
    // 순수 주석 줄 skip
    if (line.startsWith('#')) continue;
    // SCREAMING_SNAKE 패턴 (예: ACE_WRITE_DONE) — score 키 아닌 마커로 간주, 종료
    if (/^[A-Z][A-Z0-9_]*:/.test(line)) break;
    const m = line.match(/^([\w.-]+):\s*(.+?)(?:\s+#.*)?$/);
    if (!m) {
      // 비매칭 줄 발견: score 1건 이상 수집됐으면 종료 (블록 종료 추정)
      if (Object.keys(scores).length > 0) break;
      continue;
    }
    const key = m[1];
    const valRaw = m[2].trim();
    const num = Number(valRaw);
    scores[key] = Number.isFinite(num) && /^-?\d/.test(valRaw) ? num : valRaw;
  }
  return Object.keys(scores).length > 0 ? scores : null;
}

/**
 * tool_response 첫 줄에서 `{ROLE}_WRITE_DONE: <path>` 또는 `DEV_WRITE_DONE: ...` 등
 * 표준 마커 매칭하여 reports/ 경로 추출.
 */
function extractReportsPath(toolResponse) {
  if (!toolResponse) return null;
  let text = '';
  if (typeof toolResponse === 'string') text = toolResponse;
  else if (Array.isArray(toolResponse)) {
    text = toolResponse
      .filter(item => item && item.type === 'text')
      .map(item => item.text || '')
      .join('\n');
  } else if (typeof toolResponse === 'object') {
    // tool_response가 객체면 content/result/text 필드 후보 (content 가 배열이면 flatten — session_192 fix)
    if (Array.isArray(toolResponse.content)) {
      text = toolResponse.content
        .filter(item => item && item.type === 'text')
        .map(item => item.text || '')
        .join('\n');
    } else if (typeof toolResponse.content === 'string') {
      text = toolResponse.content;
    } else if (typeof toolResponse.result === 'string') {
      text = toolResponse.result;
    } else if (typeof toolResponse.text === 'string') {
      text = toolResponse.text;
    } else {
      text = JSON.stringify(toolResponse);
    }
  }
  const head = String(text).slice(0, 1000);
  const m = head.match(/[A-Z]+_WRITE_DONE:\s*([^\s\n\r]+)/);
  if (m) return m[1];
  return null;
}

/**
 * 보고서 파일 frontmatter의 turnId를 correctTurnIdx로 패치.
 * - frontmatter 블록(--- ... ---) 내 `turnId: N` 줄만 교체.
 * - 이미 맞으면 no-op.
 * - 파일 없거나 frontmatter 없으면 silent return (no throw).
 * @returns {boolean} true=패치 성공(또는 no-op), false=실패
 */
function patchFrontmatterTurnId(filePath, correctTurnIdx) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, 'utf8');
    // frontmatter 블록 추출 (파일 시작 '---' ... '---')
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) return false;

    const fmText = fmMatch[1];
    const turnIdMatch = fmText.match(/^turnId:\s*(\d+)/m);
    if (!turnIdMatch) return false; // turnId 필드 없으면 no-op (패치 불필요)

    const currentVal = parseInt(turnIdMatch[1], 10);
    if (currentVal === correctTurnIdx) return true; // 이미 맞음 — no-op

    // turnId 줄만 교체
    const patchedFm = fmText.replace(/^turnId:\s*\d+/m, `turnId: ${correctTurnIdx}`);
    const patchedContent = content.replace(fmMatch[0], fmMatch[0].replace(fmText, patchedFm));
    fs.writeFileSync(filePath, patchedContent, 'utf8');
    return true;
  } catch {
    return false;
  }
}

function log(msg) {
  console.error(`[post-tool-use-task] ${msg}`);
}

// SPIKE-R6 START — race detection instrumentation (topic_176, 2026-05-07)
// 환경변수 SPIKE_R6_LOG=<경로> 설정 시 hook 진입/turns read/turns write 3 시점을
// JSONL append. 운영 시 미설정 → no-op. spike 종료 후 본 블록 제거 가능.
function spikeLog(phase, extra = {}) {
  const logPath = process.env.SPIKE_R6_LOG;
  if (!logPath) return;
  try {
    const entry = {
      ts: process.hrtime.bigint().toString(),
      iso: new Date().toISOString(),
      pid: process.pid,
      phase,
      ...extra,
    };
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch {}
}
// SPIKE-R6 END

(async () => {
  try {
    spikeLog('hook-entry'); // SPIKE-R6
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

    // D-169 P3 — turnPushMode 분기 read (session_209)
    let turnPushModeFn, pendingTurnsPathFn;
    try {
      const tpm = require(path.join(cwd, 'scripts', 'lib', 'turn-push-mode'));
      turnPushModeFn = tpm.readTurnPushMode;
      pendingTurnsPathFn = tpm.pendingTurnsPath;
    } catch {
      turnPushModeFn = () => 'hook';
      pendingTurnsPathFn = (sid, c) => path.join(c || cwd, 'memory', 'sessions', `pending_turns_${sid}.jsonl`);
    }
    const turnPushMode = turnPushModeFn(currentSessionPath);

    // self-scores 자동 추출 — PostToolUse에서 tool_response 파싱 (nexus / hook 공통)
    const selfScores = extractSelfScores(input.tool_response || input.toolResponse);
    if (selfScores) {
      log(`selfScores 추출: role=${role} keys=[${Object.keys(selfScores).join(',')}]`);
    }

    if (turnPushMode === 'nexus') {
      // ─── nexus 모드 (D-169 Case B) ─────────────────────────────────────────
      // ③ turns[] 직접 push skip. ② self-scores → pending_turns append + __hook_origin sentinel.
      const sessionId = sess.sessionId;
      if (!sessionId) {
        log('nexus 모드: sessionId 없음, pending_turns skip');
        process.exit(0);
      }
      const agentId = (input.tool_response && input.tool_response.agentId) || null;
      const pendingPath = pendingTurnsPathFn(sessionId, cwd);
      const pendingEntry = {
        ts: new Date().toISOString(),
        sessionId,
        agentId,
        role,
        ...(selfScores && { selfScores }),
        __hook_origin: 'post-tool-use-task', // D1 sentinel (Arki rev4 §5.3)
      };
      try {
        const dir = path.dirname(pendingPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(pendingPath, JSON.stringify(pendingEntry) + '\n', 'utf8');
        log(`nexus: pending_turns append: role=${role} agentId=${agentId} path=${pendingPath}`);
      } catch (e) {
        log(`nexus: pending_turns append 실패 (silent): ${e && e.message}`);
      }
      // ③ skip 완료 — turns[] write 없음. Nexus가 직접 push.
    } else {
      // ─── hook 모드 (legacy, default) ───────────────────────────────────────
      spikeLog('turns-read-before', { sessionPath: currentSessionPath }); // SPIKE-R6
      const turns = Array.isArray(sess.turns) ? sess.turns : [];
      const turnIdx = turns.length;
      spikeLog('turns-read-after', { turnsLen: turns.length, plannedTurnIdx: turnIdx }); // SPIKE-R6
      const newTurn = {
        role,
        turnIdx,
        source: 'agent', // PD-052: Agent 툴 경유 마킹
      };
      if (selfScores) newTurn.selfScores = selfScores;

      // D-141 caveat resolved (session_168, topic_145, D-145) —
      // duplicate-agent-turn warn gap 폐기. feedback_no_auto_role_recall_surveillance 정합.
      // Master 의도적 재호출(예: phase-transition)과 진짜 중복 구분 불가 → false positive ROI 0.

      turns.push(newTurn);
      sess.turns = turns;

      spikeLog('turns-write-before', { turnIdx, role }); // SPIKE-R6
      if (writeJsonFile(currentSessionPath, sess)) {
        log(`turn push: role=${role} turnIdx=${turnIdx}`);
        spikeLog('turns-write-after', { turnIdx, role, ok: true }); // SPIKE-R6
      } else {
        log('current_session.json write 실패, silent pass');
        spikeLog('turns-write-after', { turnIdx, role, ok: false }); // SPIKE-R6
      }
    }

    // Asset #3·#4·#5 (Arki rev4 §5.5) — turn_log·frontmatter·turn_log
    // nexus 모드: ④ frontmatter·⑤ turn_log는 Nexus가 turnIdx 부여 후 처리 → hook skip.
    // hook 모드: hook ④⑤ 직접 처리 (legacy).
    const topicId = sess.topicId;
    const _sessionId = sess.sessionId;
    if (topicId && _sessionId && turnPushMode !== 'nexus') {
      // hook 모드 전용: turnIdx는 hook 분기에서 정의됨
      const _turnIdx = Array.isArray(sess.turns) ? sess.turns.length - 1 : 0; // push 완료 후 last idx
      const reportsPath = extractReportsPath(input.tool_response || input.toolResponse);

      // frontmatter turnId 패치 — D-067/PD-055 (session_178)
      if (reportsPath) {
        const absReportPath = path.isAbsolute(reportsPath)
          ? reportsPath
          : path.join(cwd, reportsPath);
        const patched = patchFrontmatterTurnId(absReportPath, _turnIdx);
        if (patched) {
          log(`frontmatter turnId 패치: ${reportsPath} → turnId: ${_turnIdx}`);
        } else {
          sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
          const alreadyRecorded = sess.gaps.some(
            g => g.type === 'frontmatter-patch-failed' && g.role === role && g.turnIdx === _turnIdx
          );
          if (!alreadyRecorded) {
            sess.gaps.push({
              type: 'frontmatter-patch-failed',
              role,
              turnIdx: _turnIdx,
              reportsPath,
              detectedAt: new Date().toISOString(),
              note: `frontmatter turnId 패치 실패 — 파일 없거나 frontmatter 없음: ${reportsPath}`,
            });
            writeJsonFile(currentSessionPath, sess);
            log(`⚠ frontmatter-patch-failed gap 기록: ${role} turn${_turnIdx} (${reportsPath})`);
          }
        }
      }

      const ok = writeTurnLogEntry(cwd, topicId, role, _turnIdx, _sessionId, {
        ...(reportsPath && { reportsPath }),
      });
      if (ok) {
        log(`turn_log append: ${topicId} turn=${_turnIdx} role=${role}${reportsPath ? ' reportsPath=' + reportsPath : ''}`);
      } else {
        log(`turn_log append 실패 (silent): topicId=${topicId}`);
      }
    } else if (turnPushMode === 'nexus') {
      log(`nexus 모드: turn_log·frontmatter 패치 skip (Nexus turnIdx 부여 후 처리)`);
    } else {
      log(`turn_log skip: topicId 또는 sessionId 없음`);
    }

    // Item 3 (2026-04-28) — 보고서 파일 존재 검증 (silent fail 감지)
    // 에이전트가 발언 후 reports/{role}_rev{n}.md를 쓰지 않으면 다음 에이전트에게 내용 미전달.
    // 차단은 하지 않되 current_session.json.gaps에 경고 기록.
    const reportPath = sess.reportPath;
    if (reportPath && role && role !== 'unknown') {
      const reportsDir = path.join(cwd, reportPath);
      if (fs.existsSync(reportsDir)) {
        let hasReport = false;
        try {
          const files = fs.readdirSync(reportsDir);
          hasReport = files.some(f => f.startsWith(`${role}_rev`) && f.endsWith('.md'));
        } catch {}
        if (!hasReport) {
          // 보고서 없음 → gaps 기록
          sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
          // 중복 기록 방지
          const gapTurnIdx = Array.isArray(sess.turns) ? sess.turns.length - 1 : 0;
          const alreadyRecorded = sess.gaps.some(
            g => g.type === 'missing-report' && g.role === role && g.turnIdx === gapTurnIdx
          );
          if (!alreadyRecorded) {
            sess.gaps.push({
              type: 'missing-report',
              role,
              turnIdx: gapTurnIdx,
              reportPath,
              detectedAt: new Date().toISOString(),
              note: `${role} turn${gapTurnIdx} 완료 후 reports/${role}_rev*.md 미발견 — 다음 에이전트에게 내용 미전달`,
            });
            writeJsonFile(currentSessionPath, sess);
            log(`⚠ missing-report gap 기록: ${role} turn${gapTurnIdx} (${reportPath})`);
          }
        }
      }
    }

    process.exit(0);
  } catch (err) {
    log(`error (silent): ${err && err.message}`);
    process.exit(0);
  }
})();
