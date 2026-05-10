"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDirectiveBullets = extractDirectiveBullets;
exports.computeDirectiveHash = computeDirectiveHash;
exports.validate = validate;
exports.init = init;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
// ---- Constants (no hardcoded literals scattered) ------------------------
const ROOT = path.resolve(__dirname, '..');
const CLAUDE_MD_PATH = path.join(ROOT, 'CLAUDE.md');
const LOCK_PATH = path.join(ROOT, 'memory', 'shared', 'prime_directive.lock.json');
const DIRECTIVE_BULLET_REGEX = /^- \*\*Prime Directive D[1-4] —/;
const PLACEHOLDER_HASH = '<COMPUTE_AT_RUNTIME>';
const EXPECTED_BULLET_COUNT = 4;
const TAMPER_TAG = 'PRIME_DIRECTIVE_TAMPER_DETECTED';
// ---- Pure functions (callable, exportable) -----------------------------
function extractDirectiveBullets(claudeMdPath) {
    if (!fs.existsSync(claudeMdPath)) {
        throw new Error(`CLAUDE.md not found at ${claudeMdPath}`);
    }
    const lines = fs.readFileSync(claudeMdPath, 'utf-8').split(/\r?\n/);
    const bullets = lines.filter((l) => DIRECTIVE_BULLET_REGEX.test(l));
    if (bullets.length !== EXPECTED_BULLET_COUNT) {
        throw new Error(`Expected ${EXPECTED_BULLET_COUNT} Prime Directive bullets, found ${bullets.length}.`);
    }
    return bullets;
}
function computeDirectiveHash(bullets) {
    const normalized = bullets.join('\n');
    return crypto.createHash('sha256').update(normalized, 'utf-8').digest('hex');
}
function validate() {
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
            message: `lock.json contains placeholder. Run: npx ts-node scripts/validate-prime-directive.ts --init`,
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
function init(sessionId = 'session_141') {
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
        }
        catch (e) {
            console.error(`[validate-prime-directive] init failed: ${e.message}`);
            process.exit(1);
        }
    }
    else {
        try {
            const result = validate();
            if (result.ok) {
                console.log(`[validate-prime-directive] OK (${result.actual.substring(0, 12)}...)`);
                process.exit(0);
            }
            else {
                console.error(`[validate-prime-directive] ${result.message}`);
                process.exit(1);
            }
        }
        catch (e) {
            console.error(`[validate-prime-directive] ${TAMPER_TAG}: ${e.message}`);
            process.exit(1);
        }
    }
}
//# sourceMappingURL=validate-prime-directive.js.map