#!/usr/bin/env node
/**
 * UserPromptSubmit hook — Skill auto-recommend (D-176 RECOMMEND, D-177, topic_190 phase2 Phase C).
 *
 * 단일 책임 (SRP):
 *   - stdin JSON에서 prompt 추출
 *   - scripts/lib/skill-matcher.js로 top-N skill 매칭 (threshold 0.22)
 *   - 0건 → silent. 1건+ → advisory RECOMMEND stdout 출력.
 *   - logs/skill-recommend.jsonl append (best-effort).
 *
 * 규약:
 *   - exit 0 항상 (D-176 — BLOCK 폐기, advisory only)
 *   - latency cap 50ms 초과 시 결과 폐기·silent
 *   - 인덱스 부재 / matcher throw → silent (Claude 차단 금지)
 *   - 출력은 advisory 명시 — D1 적대적 컨텍스트 전제 대응
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const INDEX_REL = 'memory/shared/plugin_skill_index.json';
const INDEX_HASH_REL = 'memory/shared/plugin_skill_index.sha256';
const MATCHER_REL = 'scripts/lib/skill-matcher.js';
const LOG_REL = 'logs/skill-recommend.jsonl';
const LATENCY_CAP_MS = 50;
const TOP_N = 3;
const DESC_FIRST_SENTENCE_CAP = 80;
const DESC_TOTAL_CAP = 120;
const DESC_MIN_USEFUL = 10;

// R-2: Suspicious token patterns — redacted before stdout output.
// Each entry redacts only the matching token, not the full description.
const REDACT_PATTERNS = [
  /IGNORE\s+(?:PREVIOUS|ALL|PRIOR)\s+INSTRUCTIONS?/gi,
  /이전\s*지시\s*(?:무시|금지)/g,
  /rm\s+-rf/gi,
  /^\s*system\s*:/gim,
  /<\s*\/?\s*(?:system|user|assistant|tool)\s*>/gi,
  /\[\[\s*(?:SYSTEM|TOOL)\s*\]\]/gi,
  /disregard\s+(?:all|previous|prior)/gi,
];

function redactSuspicious(text, ctxLabel) {
  if (typeof text !== 'string' || !text) return { text: '', redacted: false };
  let out = text;
  let hit = false;
  for (const re of REDACT_PATTERNS) {
    if (re.test(out)) {
      hit = true;
      out = out.replace(re, '[REDACTED]');
    }
  }
  if (hit && ctxLabel) {
    try { process.stderr.write(`[skill-recommend] redacted suspicious token in ${ctxLabel}\n`); } catch {}
  }
  return { text: out, redacted: hit };
}

// R-9: First-sentence truncation for descriptions.
// Preserves semantic units; falls back to word-boundary cut if first sentence
// exceeds 80 chars. If first sentence is too short and more info exists, may
// include a second sentence up to 120 char total cap.
function truncateBySentence(s) {
  if (typeof s !== 'string' || !s) return '';
  const collapsed = s.replace(/\s+/g, ' ').trim();
  // Match first sentence terminator: . ! ? 。 ？ ！ followed by space or EOL.
  const re = /^([\s\S]*?[.!?。？！])(?:\s|$)/;
  const m = re.exec(collapsed);
  let first = m ? m[1] : collapsed;
  // Long first sentence: word-boundary cut at 80 + ellipsis.
  if (first.length > DESC_FIRST_SENTENCE_CAP) {
    const slice = first.slice(0, DESC_FIRST_SENTENCE_CAP);
    const sp = slice.lastIndexOf(' ');
    const cut = sp > 40 ? slice.slice(0, sp) : slice;
    return cut + '…';
  }
  // Short first sentence + meaningful remainder: try to include a second sentence
  // within 120 char total cap.
  if (first.length < DESC_MIN_USEFUL && m && m[0].length < collapsed.length) {
    const remainder = collapsed.slice(m[0].length);
    const m2 = re.exec(remainder);
    const second = m2 ? m2[1] : remainder;
    const combined = (first + ' ' + second).trim();
    if (combined.length <= DESC_TOTAL_CAP) return combined;
    return combined.slice(0, DESC_TOTAL_CAP) + '…';
  }
  return first;
}

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

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

function appendLog(cwd, payload) {
  try {
    const p = path.join(cwd, LOG_REL);
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(p, JSON.stringify(payload) + '\n', 'utf8');
  } catch { /* silent */ }
}

function truncate(s, n) {
  if (typeof s !== 'string') return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function formatRecommend(results) {
  const lines = [];
  lines.push('💡 관련 skill 발견 (advisory — Master 명시 호출 시만 발동):');
  for (const r of results) {
    const head = `- ${r.skill.namespace}:${r.skill.name} (score ${r.score.toFixed(2)})`;
    const ctxLabel = `${r.skill.namespace}:${r.skill.name}`;
    // R-2: redact suspicious tokens before output.
    const safe = redactSuspicious(String(r.skill.description || ''), ctxLabel);
    // R-9: first-sentence semantic truncation instead of raw 80-char cut.
    const desc = truncateBySentence(safe.text);
    lines.push(`${head} — ${desc}`);
  }
  return lines.join('\n');
}

async function run() {
  const startedAt = Date.now();
  const cwd = process.cwd();
  const ts = new Date().toISOString();

  try {
    const raw = await readStdin();
    const input = safeParseJson(raw) || {};
    const prompt = input.prompt || input.user_prompt || '';
    const sessionId = input.session_id || input.sessionId || null;

    if (!prompt || typeof prompt !== 'string') {
      process.exit(0);
    }

    const indexPath = path.join(cwd, INDEX_REL);
    if (!fs.existsSync(indexPath)) {
      appendLog(cwd, { ts, sessionId, phase: 'no-index', skipped: true });
      process.exit(0);
    }

    let matcher;
    try {
      matcher = require(path.join(cwd, MATCHER_REL));
    } catch (e) {
      appendLog(cwd, { ts, sessionId, phase: 'matcher-load-error', message: e && e.message });
      process.exit(0);
    }

    let index;
    let indexBuf;
    try {
      indexBuf = fs.readFileSync(indexPath);
      index = JSON.parse(indexBuf.toString('utf8'));
    } catch (e) {
      appendLog(cwd, { ts, sessionId, phase: 'index-parse-error', message: e && e.message });
      process.exit(0);
    }

    // R-4: Index integrity check via separate .sha256 file.
    // Absent → silent exit 0 (back-compat with environments where R-4 not yet built).
    // Present + mismatch → silent exit 0 + stderr warning + log.
    const hashPath = path.join(cwd, INDEX_HASH_REL);
    if (fs.existsSync(hashPath)) {
      try {
        const expected = fs.readFileSync(hashPath, 'utf8').trim().toLowerCase();
        const actual = sha256Hex(indexBuf).toLowerCase();
        if (expected && expected !== actual) {
          try { process.stderr.write('[skill-recommend] index hash mismatch, skipping\n'); } catch {}
          appendLog(cwd, { ts, sessionId, phase: 'index-tampered', expected, actual });
          process.exit(0);
        }
      } catch (e) {
        appendLog(cwd, { ts, sessionId, phase: 'index-hash-read-error', message: e && e.message });
        process.exit(0);
      }
    }

    let results = [];
    try {
      results = matcher.matchSkills(prompt, index, { topN: TOP_N });
    } catch (e) {
      // matcher throw 시 silent — Claude 차단 금지
      try { process.stderr.write(`[skill-recommend] matcher error: ${e && e.message}\n`); } catch {}
      appendLog(cwd, { ts, sessionId, phase: 'matcher-throw', message: e && e.message });
      process.exit(0);
    }

    const elapsedMs = Date.now() - startedAt;

    // latency cap — 초과 시 결과 폐기 (사용자 critical path 보호)
    if (elapsedMs > LATENCY_CAP_MS) {
      appendLog(cwd, {
        ts, sessionId, phase: 'latency-exceeded',
        elapsedMs, cap: LATENCY_CAP_MS,
        promptHead: truncate(prompt, 60),
        resultCount: results.length
      });
      process.exit(0);
    }

    if (!Array.isArray(results) || results.length === 0) {
      appendLog(cwd, {
        ts, sessionId, phase: 'no-match',
        elapsedMs, promptHead: truncate(prompt, 60)
      });
      process.exit(0);
    }

    // RECOMMEND 출력 — stdout. exit 0 (advisory only).
    const out = formatRecommend(results);
    process.stdout.write(out + '\n');

    const top1 = results[0];
    appendLog(cwd, {
      ts, sessionId, phase: 'recommend',
      elapsedMs,
      promptHead: truncate(prompt, 60),
      top1: { ns: top1.skill.namespace, name: top1.skill.name, score: top1.score },
      count: results.length
    });

    process.exit(0);
  } catch (err) {
    appendLog(cwd, { ts, phase: 'error', message: err && err.message });
    process.exit(0);
  }
}

module.exports = { formatRecommend, truncate, truncateBySentence, redactSuspicious, sha256Hex };

if (require.main === module) {
  run();
}
