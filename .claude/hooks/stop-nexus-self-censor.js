#!/usr/bin/env node
/**
 * Stop Hook — nexus-self-censor (session_247 Dev rev2 재작성)
 *
 * 매처: Stop (Nexus assistant 응답 종료 시점)
 * 동작: 직전 assistant message 전체 텍스트 회수 → 단언 추출 → 라벨 부착 검증.
 *       단언 ≥1건 + 라벨 0건 → .nexus_violation_flag.json 박제.
 *       정상 → 기존 flag 클리어.
 *
 * 라벨 형식 (어느 하나라도):
 *   [근거] / [근거: ...] / [추측] / [제안] / [Tn/An/On]
 *
 * 단언 패턴 (보수적 — false-positive 회피):
 *   - 수치/카운트: '\d+건', '\d+개', '\d+%' 등
 *   - 단정 동사 어미: '~다', '확실/정확/보장/확정' (의문 제외)
 *   - 결정/판정: '결정/선택/권고/채택/승인'
 *
 * 면제:
 *   - 응답 길이 < 100자 (단순 확인)
 *   - 코드 fence 제거 후 텍스트 < 50자 (코드 단독)
 *   - 모든 라인이 의문문 (?, 까?, 나?)
 *
 * 응급 우회: ENV NEXUS_EMERGENCY_OVERRIDE=1
 *
 * Master 명시 (session_247): "매번 자기 검열" — 매 발화마다 라벨 의무화.
 */

const fs = require('fs');
const path = require('path');

const ASSERTION_PATTERNS = [
  /\b\d+\s*(건|개|줄|회|차례|명|%)/g,
  /(?<![가-힣A-Za-z])(맞|확실|정확|보장|확정)(?![가-힣A-Za-z])/g,
  /(?<![가-힣A-Za-z])(결정|선택|권고|채택|승인)(?![가-힣A-Za-z])/g,
];

const LABEL_PATTERNS = [
  /\[근거(?::[^\]]*)?\]/,
  /\[추측\]/,
  /\[제안\]/,
  /\[T\d+\s*\/\s*A\d+\s*\/\s*O\d+\]/,
];

const VIOLATION_FLAG_FILENAME = '.nexus_violation_flag.json';

function logEntry(cwd, entry) {
  try {
    const logDir = path.join(cwd, 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'nexus-self-censor.log');
    fs.appendFileSync(logPath, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n', 'utf-8');
  } catch (_) {}
}

function readLastAssistantMessage(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return null;
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const obj = JSON.parse(lines[i]);
        const role = obj.role || (obj.message && obj.message.role) || (obj.type === 'assistant' ? 'assistant' : null);
        if (role !== 'assistant') continue;
        const content = (obj.message && obj.message.content) || obj.content || '';
        if (Array.isArray(content)) {
          const text = content.filter(c => c && c.type === 'text').map(c => c.text || '').join('\n');
          return text;
        }
        return typeof content === 'string' ? content : JSON.stringify(content);
      } catch (_) {}
    }
  } catch (_) {}
  return null;
}

function shouldExempt(text) {
  if (!text || text.length < 100) return { exempt: true, reason: 'too-short' };
  const noCode = text.replace(/```[\s\S]*?```/g, '');
  if (noCode.trim().length < 50) return { exempt: true, reason: 'code-only' };
  const lines = noCode.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return { exempt: true, reason: 'empty-after-code' };
  const questionLines = lines.filter(l => l.endsWith('?') || l.endsWith('까?') || l.endsWith('나?'));
  if (questionLines.length === lines.length) return { exempt: true, reason: 'questions-only' };
  return { exempt: false };
}

(function main() {
  const cwd = process.cwd();

  let raw = '';
  try { raw = fs.readFileSync(0, 'utf-8'); } catch (_) { process.exit(0); }
  let input;
  try { input = JSON.parse(raw); } catch (_) { process.exit(0); }

  if (process.env.NEXUS_EMERGENCY_OVERRIDE === '1') {
    logEntry(cwd, { phase: 'emergency-override' });
    process.exit(0);
  }

  const transcriptPath = input.transcript_path || input.transcriptPath;
  const lastMsg = readLastAssistantMessage(transcriptPath);

  if (!lastMsg) {
    logEntry(cwd, { phase: 'transcript-unavailable' });
    process.exit(0);
  }

  const exempt = shouldExempt(lastMsg);
  if (exempt.exempt) {
    logEntry(cwd, { phase: 'exempt', reason: exempt.reason, len: lastMsg.length });
    process.exit(0);
  }

  // 단언 추출
  const assertions = [];
  for (const pat of ASSERTION_PATTERNS) {
    const matches = lastMsg.match(pat);
    if (matches) assertions.push(...matches);
  }

  const hasLabel = LABEL_PATTERNS.some(p => p.test(lastMsg));

  const flagPath = path.join(cwd, VIOLATION_FLAG_FILENAME);

  if (assertions.length > 0 && !hasLabel) {
    const flag = {
      detectedAt: new Date().toISOString(),
      assertionsFound: assertions.slice(0, 10),
      assertionCount: assertions.length,
      msgPreview: lastMsg.slice(0, 300),
      reason: '단언 발화에 [근거]/[추측]/[제안]/[Tn/An/On] 태그 미부착',
    };
    try { fs.writeFileSync(flagPath, JSON.stringify(flag, null, 2), 'utf-8'); } catch (_) {}
    logEntry(cwd, { phase: 'violation', assertionCount: assertions.length, sample: assertions.slice(0, 3) });
    process.stderr.write(`[nexus-self-censor] VIOLATION: 단언 ${assertions.length}건 발견, 라벨 0건. 다음 mutation tool 차단됨. 우회: NEXUS_EMERGENCY_OVERRIDE=1.\n`);
    process.exit(0);
  }

  // 정상 — 기존 flag 클리어
  if (fs.existsSync(flagPath)) {
    try { fs.unlinkSync(flagPath); } catch (_) {}
  }
  logEntry(cwd, { phase: 'pass', assertionCount: assertions.length, hasLabel });
  process.exit(0);
})();
