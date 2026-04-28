#!/usr/bin/env node
/**
 * K6 SPIKE — PreToolUse(Task) prompt mutation 실측 hook.
 *
 * 목적: Claude Code의 PreToolUse hook이 Task tool input의 prompt 필드에
 * 텍스트를 prepend 했을 때, 서브에이전트가 그 추가 텍스트를 실제로 수신하는지
 * 단일 실측으로 PASS/FAIL 판정.
 *
 * 공식 docs (https://code.claude.com/docs/en/hooks) 기준:
 *   PreToolUse decision control → "updatedInput" 필드가 tool input을 mutate.
 *   stdout JSON 형식:
 *   {
 *     "hookSpecificOutput": {
 *       "hookEventName": "PreToolUse",
 *       "permissionDecision": "allow",
 *       "updatedInput": { ...full input with prompt mutated... }
 *     }
 *   }
 *   "updatedInput replaces the entire input object" — 모든 필드 동봉 의무.
 *
 * 본 spike: tool_input.prompt 시작에 K6 sentinel 마커 prepend.
 * 로그: logs/k6-spike.log 에 호출 시각 / input snapshot / output snapshot 기록.
 *
 * 검증 후 settings.json 등록 해제 의무 (Dev 책임). 본 hook 파일은 보존.
 */

const fs = require('fs');
const path = require('path');

const SENTINEL = '<<K6_SPIKE_MARKER:';
const TARGET_TOOL_NAMES = ['Task', 'Agent'];

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

function logSpike(cwd, payload) {
  try {
    const logDir = path.join(cwd, 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'k6-spike.log');
    fs.appendFileSync(logPath, JSON.stringify(payload) + '\n', 'utf8');
  } catch (e) {
    // silent — log 실패가 spike 자체를 망가뜨리지 않음
    console.error('[spike-k6] log write 실패: ' + (e && e.message));
  }
}

(async () => {
  const ts = new Date().toISOString();
  try {
    const raw = await readStdin();
    const input = safeParseJson(raw) || {};
    const cwd = input.cwd || process.cwd();
    const toolName = input.tool_name || input.toolName || '';

    if (!TARGET_TOOL_NAMES.includes(toolName)) {
      // 다른 tool 호출은 silent pass (mutation 없음)
      logSpike(cwd, { ts, phase: 'skip-non-task', toolName });
      process.exit(0);
    }

    const toolInput = input.tool_input || input.toolInput || {};
    const originalPrompt = typeof toolInput.prompt === 'string' ? toolInput.prompt : '';

    const marker = `${SENTINEL} ${ts}>>`;
    const mutatedPrompt = marker + '\n\n응답 첫 줄에 다음 형식으로 보고하세요: "MARKER_RECEIVED: <감지된 마커>" 또는 "MARKER_NOT_RECEIVED".\n\n' + originalPrompt;

    const updatedInput = { ...toolInput, prompt: mutatedPrompt };

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        permissionDecisionReason: 'K6 spike — prompt mutation test',
        updatedInput
      }
    };

    logSpike(cwd, {
      ts,
      phase: 'mutate',
      toolName,
      originalPromptLen: originalPrompt.length,
      mutatedPromptLen: mutatedPrompt.length,
      marker,
      originalPromptHead: originalPrompt.slice(0, 200),
      mutatedPromptHead: mutatedPrompt.slice(0, 300)
    });

    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  } catch (err) {
    logSpike(process.cwd(), { ts, phase: 'error', message: err && err.message });
    // 실패 시 silent pass — 원본 호출은 계속
    process.exit(0);
  }
})();
