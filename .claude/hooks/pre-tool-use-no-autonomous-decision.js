#!/usr/bin/env node
/**
 * Hook 2 — no-autonomous-decision (session_247 Dev rev2 재작성)
 *
 * 매처: PreToolUse(Edit|Write|Bash|NotebookEdit)
 * 동작: 직전 transcript 사용자 turn N=10 회수 → Master 명시 승인 패턴 매칭.
 *       매칭 0건 + 면제 미해당 + violation flag 무 → process.exit(2) 차단.
 *
 * Master 명시 (session_247): "Claude 본체는 향후 어떠한 판단 권한도 없음 / 매번 자기 검열 / Hook 작동 안되면 레전드팀 전체 포멧"
 *
 * Dev rev1 적출 FP-2 정정 (Master "부정문을 긍정문으로 바꾼거야?"):
 *   - 이전 Nexus 패턴: substring `/해줘/` `/진행해/` 등 → "분석해줘"·"왜 진행해야" false-pass.
 *   - 정정 방침:
 *     (a) 단답 승인어 (예/응/OK/네/a-c/1-9/계속/고고): 라인 단독일 때만 매칭 (^\s*X\s*$).
 *     (b) 동사 어미 명령 (진행해/구현해/실행해/적용해/박제해/해줘/해라): 어미 + 후행 조사/구두점 정확 매칭.
 *         AND 부정어 선행("안/않/못/말/없") 6자 내 차단. AND 같은 라인 `?` 종결 차단.
 *     (c) 명사 단독("진행"/"적용"/"박제") 패턴 제거 — 일반 한국어 빈출.
 *     (d) 그리스 옵션 라벨 (α)(β)(γ) 보존.
 *
 * 응급 우회: ENV NEXUS_EMERGENCY_OVERRIDE=1
 *
 * Stop hook violation flag (.nexus_violation_flag.json) 존재 시 무조건 차단 (Master 승인 패턴 무관).
 *
 * 면제 경로: tmp_*, logs/, current_session.json, token_log.json, hook 자기 자신.
 * 면제 Bash: ls, cat, grep, head, tail, find, git status/log/diff/show/branch, wc, sort, uniq, echo, pwd, which, test 등.
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// APPROVAL_PATTERNS (Dev rev2 — FP-2 정정 설계)
// ============================================================
//
// Group A: 단독 라인 단답 (^\s*X\s*$ 형태)
const APPROVAL_PATTERNS_STANDALONE = [
  /^\s*예\s*[.!]?\s*$/m,
  /^\s*네\s*[.!]?\s*$/m,
  /^\s*응\s*[.!]?\s*$/m,
  /^\s*OK\s*[.!]?\s*$/im,
  /^\s*[abc]\s*[.!]?\s*$/im,        // 옵션 단답 a/b/c 단독 라인
  /^\s*[1-9]\s*[.!]?\s*$/m,         // 1~9 단독 라인
  /^\s*계속\s*[.!]?\s*$/m,
  /^\s*고고\s*[.!]?\s*$/m,
  // English standalone (R-1, session_247 Master 결정) — case-insensitive, 단독 라인 한정
  /^\s*yes\s*[.!]?\s*$/im,
  /^\s*okay\s*[.!]?\s*$/im,
  /^\s*go\s*[.!]?\s*$/im,
  /^\s*proceed\s*[.!]?\s*$/im,
  /^\s*do\s+it\s*[.!]?\s*$/im,
  /^\s*go\s+ahead\s*[.!]?\s*$/im,
  /^\s*approved\s*[.!]?\s*$/im,
  /^\s*confirmed\s*[.!]?\s*$/im,
];

// Group B: 동사 어미 명령 — 어미 + 후행 정확 매칭, 부정어 선행 차단은 별도 로직.
//   매칭 = 명사·동사 어간 뒤 어미 정확. 후행 = 줘/주세요/요/.!,/끝.
//   '진행해', '진행해줘', '진행해라', '진행해 줘', '진행해주세요', '구현해', '실행해', '적용해', '박제해'
const APPROVAL_PATTERNS_VERB = [
  /(?<![가-힣A-Za-z])진행해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])구현해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])실행해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])적용해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])박제해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])등록해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])작성해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])수정해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])설치해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])커밋해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])머지해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])삭제해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])복원해(?:\s*줘|\s*주세요|\s*라|\s*요)?(?=[\s.!,]|$)/,
  /(?<![가-힣A-Za-z])승인(?:해|함|합니다|함\.)?(?=[\s.!,]|$)/,
  /\(α\)/,
  /\(β\)/,
  /\(γ\)/,
  // English verb forms (R-1, session_247 Master 결정) — word-boundary, case-insensitive
  /\bproceed\b/i,
  /\bexecute\b/i,
  /\bapply\b/i,
  /\bimplement\b/i,
  /\bdeploy\b/i,
  /\bgo\s+ahead\b/i,
];

// 부정어 — 동사 어미 매칭 시 같은 라인에서 매칭 위치 직전 12자 내 등장 시 거부.
// English negation tokens (R-3, session_247 Master 결정) 동시 확장.
const NEGATION_TOKENS = [
  '안 ', '안돼', '안 돼', '안된', '안 된', '안하', '안 하', '않', '못 ', '못해', '말고', '말아', '말라', '없',
  // English (case-insensitive matching applied via toLowerCase below)
  'do not ', "don't ", 'stop', 'cancel', 'abort', 'reject', 'no ', 'wait', 'hold',
];

// 의문 어미 — 같은 라인에 등장 시 거부.
//   '왜', '어떻게', '?', '나요', '까요', '죠?', '겠어'
const QUESTION_INDICATORS = [/\?/, /(^|\s)왜\s/, /(^|\s)어떻게\s/, /(^|[가-힣])(나요|까요|죠|을까|할까)[\s?]*$/m];

// ============================================================
// EXEMPT_PATH_PATTERNS
// ============================================================
const EXEMPT_PATH_PATTERNS = [
  /(^|[\\/])tmp_/,
  /(^|[\\/])logs[\\/]/,
  /memory[\\/]sessions[\\/]current_session\.json$/,
  /memory[\\/]sessions[\\/]token_log\.json$/,
  /pre-tool-use-no-autonomous-decision\.js$/,
  /stop-nexus-self-censor\.js$/,
  /\.nexus_violation_flag\.json$/,
];

// Bash 면제 (read-only 또는 안전 명령)
const READONLY_BASH_PATTERNS = [
  /^(ls|cat|head|tail|grep|rg|find|wc|sort|uniq|echo|pwd|which|test|file)\b/,
  /^git\s+(status|log|diff|show|branch|rev-parse|worktree|config\s+--get|remote\s+-v|stash\s+list)\b/,
  /^node\s+(-e\s|--version|-v$)/,
  /^npm\s+(ls|--version|-v$)/,
  /^npx\s+ts-node\s+\S+\s+(--dry-run|--help|-h)\b/,
  /^python\s+-c\s/,
];

const VIOLATION_FLAG_FILENAME = '.nexus_violation_flag.json';

// ============================================================
// helpers
// ============================================================

function logEntry(cwd, entry) {
  try {
    const logDir = path.join(cwd, 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'no-autonomous-decision.log');
    fs.appendFileSync(logPath, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf-8');
  } catch (_) {}
}

function readRecentUserTurns(transcriptPath, n) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return null;
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n').filter(Boolean);
    const out = [];
    for (let i = lines.length - 1; i >= 0 && out.length < n; i--) {
      try {
        const obj = JSON.parse(lines[i]);
        const role = obj.role || (obj.message && obj.message.role) || (obj.type === 'user' ? 'user' : null);
        if (role !== 'user') continue;
        const content = (obj.message && obj.message.content) || obj.content || '';
        let text = '';
        if (typeof content === 'string') {
          text = content;
        } else if (Array.isArray(content)) {
          // Skip tool_result blocks — only real user-typed text.
          const textBlocks = content.filter(c => c && c.type === 'text').map(c => c.text || '');
          if (textBlocks.length === 0) continue;
          text = textBlocks.join('\n');
        }
        if (text.trim()) out.unshift(text);
      } catch (_) {}
    }
    return out;
  } catch (_) {
    return null;
  }
}

/**
 * 동사 어미 매칭 시 부정어/의문 차단 검증.
 * @param {string} fullText  사용자 turn 전체 텍스트 (라인별 검사)
 * @returns {RegExp|null} 매칭 패턴 또는 null
 */
function matchVerbApproval(fullText) {
  const lines = fullText.split('\n');
  for (const line of lines) {
    // 의문문 라인 제외
    if (QUESTION_INDICATORS.some(p => p.test(line))) continue;
    for (const pat of APPROVAL_PATTERNS_VERB) {
      const m = pat.exec(line);
      if (!m) continue;
      // 부정어 선행 검사 — 매칭 위치 직전 12자 (영어 토큰 case-insensitive)
      const matchStart = m.index;
      const before = line.slice(Math.max(0, matchStart - 12), matchStart);
      const beforeLower = before.toLowerCase();
      if (NEGATION_TOKENS.some(t => beforeLower.includes(t.toLowerCase()))) continue;
      return pat;
    }
  }
  return null;
}

function matchStandalone(fullText) {
  for (const pat of APPROVAL_PATTERNS_STANDALONE) {
    if (pat.test(fullText)) return pat;
  }
  return null;
}

// ============================================================
// main
// ============================================================

(function main() {
  const cwd = process.cwd();

  let raw = '';
  try { raw = fs.readFileSync(0, 'utf-8'); } catch (_) { process.exit(0); }
  let input;
  try { input = JSON.parse(raw); } catch (_) { process.exit(0); }

  const toolName = input.tool_name || input.toolName || '';
  if (!['Edit', 'Write', 'Bash', 'NotebookEdit'].includes(toolName)) {
    process.exit(0);
  }

  // 응급 우회
  if (process.env.NEXUS_EMERGENCY_OVERRIDE === '1') {
    logEntry(cwd, { phase: 'emergency-override', toolName });
    process.exit(0);
  }

  const toolInput = input.tool_input || input.toolInput || {};

  // 경로 면제
  const targetPath = toolInput.file_path || toolInput.notebook_path || '';
  if (targetPath && EXEMPT_PATH_PATTERNS.some(p => p.test(targetPath))) {
    logEntry(cwd, { phase: 'exempt-path', toolName, targetPath });
    process.exit(0);
  }

  // Bash 면제
  if (toolName === 'Bash') {
    const cmd = (toolInput.command || '').trim();
    if (READONLY_BASH_PATTERNS.some(p => p.test(cmd))) {
      logEntry(cwd, { phase: 'exempt-readonly-bash', cmdHead: cmd.slice(0, 80) });
      process.exit(0);
    }
  }

  // Stop hook violation flag 검증 — 존재 시 무조건 차단
  const flagPath = path.join(cwd, VIOLATION_FLAG_FILENAME);
  if (fs.existsSync(flagPath)) {
    let flagInfo = '';
    try {
      const fj = JSON.parse(fs.readFileSync(flagPath, 'utf-8'));
      flagInfo = `assertions=${fj.assertionCount || 0}, detected=${fj.detectedAt || '?'}`;
    } catch (_) { flagInfo = 'parse-error'; }
    const msg = `[no-autonomous-decision] BLOCKED: Stop hook violation flag 활성. (${flagInfo}) Master 응답 후 자동 클리어. 응급 우회: NEXUS_EMERGENCY_OVERRIDE=1`;
    logEntry(cwd, { phase: 'blocked-by-flag', toolName, flagInfo });
    process.stderr.write(msg + '\n');
    process.exit(2);
  }

  // transcript 회수
  const transcriptPath = input.transcript_path || input.transcriptPath;
  const recentUserTurns = readRecentUserTurns(transcriptPath, 10);

  if (recentUserTurns === null) {
    // transcript 미가용 — silent pass (FP-1 회피, Arki Risk)
    logEntry(cwd, { phase: 'transcript-unavailable', toolName });
    process.exit(0);
  }

  if (recentUserTurns.length === 0) {
    // 사용자 turn 0건 — 안전 측 차단
    const msg = `[no-autonomous-decision] BLOCKED: ${toolName} — 직전 user turn 0건. 응급 우회: NEXUS_EMERGENCY_OVERRIDE=1`;
    logEntry(cwd, { phase: 'blocked-no-user-turn', toolName });
    process.stderr.write(msg + '\n');
    process.exit(2);
  }

  // 모든 user turn 텍스트 합쳐서 검사
  const recentText = recentUserTurns.join('\n---\n');

  let matchedPattern = matchStandalone(recentText);
  let matchType = matchedPattern ? 'standalone' : null;
  if (!matchedPattern) {
    matchedPattern = matchVerbApproval(recentText);
    if (matchedPattern) matchType = 'verb';
  }

  if (!matchedPattern) {
    const tail = recentText.slice(-300).replace(/\n/g, ' / ');
    const msg = `[no-autonomous-decision] BLOCKED: ${toolName} — 직전 ${recentUserTurns.length} user turn에 Master 명시 승인 패턴 매칭 0건. 우회: NEXUS_EMERGENCY_OVERRIDE=1. 직전 user tail: "${tail}"`;
    logEntry(cwd, { phase: 'blocked-no-approval', toolName, targetPath: targetPath || null, userTurnCount: recentUserTurns.length, recentTail: tail });
    process.stderr.write(msg + '\n');
    process.exit(2);
  }

  logEntry(cwd, { phase: 'pass', toolName, matchType, pattern: matchedPattern.toString().slice(0, 100) });
  process.exit(0);
})();
