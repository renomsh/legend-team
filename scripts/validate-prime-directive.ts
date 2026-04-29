/**
 * validate-prime-directive.ts
 *
 * Affaan 4 Prime Directive 무결성 검증 (D-122, session_141, topic_131).
 *
 * - CLAUDE.md Rules 블록의 4 Prime Directive bullet 텍스트 추출 → SHA-256 → memory/shared/prime_directive.lock.json sha256 비교.
 * - mismatch → exit 1 + stderr "PRIME_DIRECTIVE_TAMPER_DETECTED".
 * - --init 모드: lock.json sha256 + lockedAt 갱신 (최초 박제 또는 의도적 변경 후 재잠금).
 *
 * D4 자기충실: validator 자체가 4 bullet 정규식·lock 경로를 const로 분리, 자기 검증 가능.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ---- Constants (no hardcoded literals scattered) ------------------------
const ROOT = path.resolve(__dirname, '..');
const CLAUDE_MD_PATH = path.join(ROOT, 'CLAUDE.md');
const LOCK_PATH = path.join(ROOT, 'memory', 'shared', 'prime_directive.lock.json');
const DIRECTIVE_BULLET_REGEX = /^- \*\*Prime Directive D[1-4] —/;
const PLACEHOLDER_HASH = '<COMPUTE_AT_RUNTIME>';
const EXPECTED_BULLET_COUNT = 4;
const TAMPER_TAG = 'PRIME_DIRECTIVE_TAMPER_DETECTED';

// ---- Pure functions (callable, exportable) -----------------------------

export function extractDirectiveBullets(claudeMdPath: string): string[] {
  if (!fs.existsSync(claudeMdPath)) {
    throw new Error(`CLAUDE.md not found at ${claudeMdPath}`);
  }
  const lines = fs.readFileSync(claudeMdPath, 'utf-8').split(/\r?\n/);
  const bullets = lines.filter((l) => DIRECTIVE_BULLET_REGEX.test(l));
  if (bullets.length !== EXPECTED_BULLET_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_BULLET_COUNT} Prime Directive bullets, found ${bullets.length}.`
    );
  }
  return bullets;
}

export function computeDirectiveHash(bullets: string[]): string {
  const normalized = bullets.join('\n');
  return crypto.createHash('sha256').update(normalized, 'utf-8').digest('hex');
}

export interface ValidateResult {
  ok: boolean;
  expected: string;
  actual: string;
  message: string;
}

export function validate(): ValidateResult {
  const bullets = extractDirectiveBullets(CLAUDE_MD_PATH);
  const actual = computeDirectiveHash(bullets);

  if (!fs.existsSync(LOCK_PATH)) {
    return {
      ok: false,
      expected: '(lock missing)',
      actual,
      message: `${TAMPER_TAG}: lock file missing at ${LOCK_PATH}`,
    };
  }
  const lock = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf-8'));
  const expected = lock.sha256;

  if (expected === PLACEHOLDER_HASH) {
    return {
      ok: false,
      expected,
      actual,
      message:
        `lock.json contains placeholder. Run: npx ts-node scripts/validate-prime-directive.ts --init`,
    };
  }

  const ok = expected === actual;
  return {
    ok,
    expected,
    actual,
    message: ok
      ? 'Prime directive integrity verified.'
      : `${TAMPER_TAG}: expected=${expected} actual=${actual}`,
  };
}

export function init(sessionId: string = 'session_141'): void {
  const bullets = extractDirectiveBullets(CLAUDE_MD_PATH);
  const hash = computeDirectiveHash(bullets);
  const lock = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf-8'));
  lock.sha256 = hash;
  lock.lockedAt = new Date().toISOString();
  lock.lockedBy = sessionId;
  fs.writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2) + '\n', 'utf-8');
  console.log(`[validate-prime-directive] Initialized lock: sha256=${hash}`);
}

// ---- CLI entrypoint ----------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--init')) {
    try {
      init();
      process.exit(0);
    } catch (e: any) {
      console.error(`[validate-prime-directive] init failed: ${e.message}`);
      process.exit(1);
    }
  } else {
    try {
      const result = validate();
      if (result.ok) {
        console.log(`[validate-prime-directive] OK (${result.actual.substring(0, 12)}...)`);
        process.exit(0);
      } else {
        console.error(`[validate-prime-directive] ${result.message}`);
        process.exit(1);
      }
    } catch (e: any) {
      console.error(`[validate-prime-directive] ${TAMPER_TAG}: ${e.message}`);
      process.exit(1);
    }
  }
}
