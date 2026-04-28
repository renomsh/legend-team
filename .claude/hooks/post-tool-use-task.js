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
  if (typeof toolResponse === 'string') text = toolResponse;
  else if (typeof toolResponse === 'object') {
    text = toolResponse.content || toolResponse.result || toolResponse.text || JSON.stringify(toolResponse);
  }
  text = String(text);
  const idx = text.indexOf('# self-scores');
  if (idx === -1) return null;

  const scores = {};
  let consecutiveNonKv = 0;
  const lines = text.slice(idx + '# self-scores'.length).split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    // 섹션 종료 마커: 코드 펜스 닫기, 구분선, 새 헤더
    if (line.startsWith('```') || line.startsWith('---') || /^#{1,3} /.test(line)) break;
    // 빈 줄 또는 순수 주석은 skip (블록 내 여백 허용)
    if (line === '' || line.startsWith('#')) { consecutiveNonKv++; if (consecutiveNonKv >= 3) break; continue; }
    const m = line.match(/^([\w.-]+):\s*(.+?)(?:\s+#.*)?$/);
    if (!m) { consecutiveNonKv++; if (consecutiveNonKv >= 2) break; continue; }
    consecutiveNonKv = 0;
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
      source: 'agent', // PD-052: Agent 툴 경유 마킹
    };

    // self-scores 자동 추출 — PostToolUse에서 tool_response 파싱
    const selfScores = extractSelfScores(input.tool_response || input.toolResponse);
    if (selfScores) {
      newTurn.selfScores = selfScores;
      log(`selfScores 추출: role=${role} keys=[${Object.keys(selfScores).join(',')}]`);
    }

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
          const alreadyRecorded = sess.gaps.some(
            g => g.type === 'missing-report' && g.role === role && g.turnIdx === turnIdx
          );
          if (!alreadyRecorded) {
            sess.gaps.push({
              type: 'missing-report',
              role,
              turnIdx,
              reportPath,
              detectedAt: new Date().toISOString(),
              note: `${role} turn${turnIdx} 완료 후 reports/${role}_rev*.md 미발견 — 다음 에이전트에게 내용 미전달`,
            });
            writeJsonFile(currentSessionPath, sess);
            log(`⚠ missing-report gap 기록: ${role} turn${turnIdx} (${reportPath})`);
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
