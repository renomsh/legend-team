#!/usr/bin/env node
/**
 * PreToolUse(Skill) hook — jobs-framing 활성화 (D-139 확장, topic_141).
 *
 * 단일 책임 (SRP):
 *   - Skill 툴 호출 감지 → skill === 'jobs-framing' 확인
 *   - master_first_state.json에 jobsFramingActive: true 박제
 *   - 활성화 경로: Master(/jobs-framing 입력) = HookA, Nexus(Skill 호출) = 이 hook
 *
 * 항상 exit 0 (hook chain 중단 없음).
 */

const fs = require('fs');
const path = require('path');

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

function writeJsonFile(p, obj) {
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  } catch { /* silent */ }
}

function appendLog(cwd, logRel, payload) {
  try {
    const logPath = path.isAbsolute(logRel) ? logRel : path.join(cwd, logRel);
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(payload) + '\n', 'utf8');
  } catch { /* silent */ }
}

async function run() {
  const cwd = process.cwd();
  const ts = new Date().toISOString();

  try {
    const raw = await readStdin();
    const input = safeParseJson(raw) || {};

    // Skill 툴 확인
    const toolName = input.tool_name || input.toolName || '';
    if (toolName !== 'Skill') {
      process.exit(0);
    }

    // jobs-framing 스킬 확인
    const toolInput = input.tool_input || input.toolInput || {};
    const skillName = toolInput.skill || '';
    if (!skillName.includes('jobs-framing')) {
      process.exit(0);
    }

    const config = readJsonFile(path.join(cwd, CONFIG_REL));
    const logPath = (config && config.logPath) || 'logs/master-first.log';
    const statePath = path.join(cwd, (config && config.statePath) || 'memory/shared/master_first_state.json');

    const sess = readJsonFile(path.join(cwd, SESSION_REL));
    const sessionId = input.session_id || input.sessionId || (sess && sess.sessionId) || null;
    const grade = sess && sess.grade || null;

    // Grade 확인 — triggerGrades 외 no-op
    const triggerGrades = (config && config.triggerGrades) || ['A', 'B', 'S'];
    if (grade && !triggerGrades.includes(grade)) {
      appendLog(cwd, logPath, { ts, phase: 'no-op', reason: 'grade-skip', grade, sessionId, source: 'Skill' });
      process.exit(0);
    }

    // jobsFramingActive 활성화
    const existingState = readJsonFile(statePath) || {};
    const newState = {
      ...existingState,
      jobsFramingActive: true,
      sessionId,
      activatedAt: ts,
      activatedBy: 'nexus-skill',
      updatedAt: ts
    };
    writeJsonFile(statePath, newState);

    appendLog(cwd, logPath, {
      ts,
      phase: 'jobs-framing-activated',
      sessionId,
      grade,
      source: 'Nexus-Skill'
    });

  } catch {
    /* silent — hook chain 보호 */
  }

  process.exit(0);
}

run();
