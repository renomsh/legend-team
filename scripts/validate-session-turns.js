"use strict";
/**
 * validate-session-turns.ts
 * D-048 Turn[] 구조 검증기.
 * current_session.json 또는 session_index.json 엔트리의 turns 배열을 검사한다.
 *
 * D-074 (session_093): dispatch_config 참조 제거, invocationMode/subagentId 검증 제거.
 *
 * 사용:
 *   npx ts-node scripts/validate-session-turns.ts                    # current_session 검사
 *   npx ts-node scripts/validate-session-turns.ts session_047        # 특정 세션 검사
 *   npx ts-node scripts/validate-session-turns.ts --all              # session_index 전체 검사
 *
 * 함수 export: validateTurns() — 다른 스크립트에서 programmatic 호출 가능
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTurns = validateTurns;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const turn_types_1 = require("./lib/turn-types");
const CWD = process.cwd();
const CURRENT_SESSION_PATH = path_1.default.join(CWD, 'memory', 'sessions', 'current_session.json');
const SESSION_INDEX_PATH = path_1.default.join(CWD, 'memory', 'sessions', 'session_index.json');
const PHASE_CATALOG_PATH = path_1.default.join(CWD, 'memory', 'shared', 'phase_catalog.json');
function readJson(p) {
    try {
        return JSON.parse(fs_1.default.readFileSync(p, 'utf8'));
    }
    catch {
        return null;
    }
}
function loadValidPhases() {
    const catalog = readJson(PHASE_CATALOG_PATH);
    if (!catalog?.phases) {
        console.warn('[validate-session-turns] phase_catalog.json 로드 실패 — phase 검증 스킵');
        return [];
    }
    return catalog.phases.map(p => p.id);
}
function validateTurns(sessionId, turns, legacy, validPhases) {
    const result = { sessionId, ok: true, errors: [], warnings: [], turnsCount: 0 };
    if (legacy) {
        result.warnings.push('legacy:true — turns 검증 스킵');
        return result;
    }
    if (turns === undefined || turns === null) {
        result.warnings.push('turns 필드 없음 (D-048 이전 세션이면 legacy:true 추가 권장)');
        return result;
    }
    if (!Array.isArray(turns)) {
        result.errors.push(`turns가 배열이 아님: ${typeof turns}`);
        result.ok = false;
        return result;
    }
    result.turnsCount = turns.length;
    const phases = validPhases ?? loadValidPhases();
    turns.forEach((t, i) => {
        const turn = t;
        const prefix = `turns[${i}]`;
        if (!turn.role || typeof turn.role !== 'string') {
            result.errors.push(`${prefix}: role 누락 또는 비문자열`);
            result.ok = false;
        }
        if (turn.turnIdx === undefined || turn.turnIdx === null) {
            result.errors.push(`${prefix}: turnIdx 누락`);
            result.ok = false;
        }
        else if (typeof turn.turnIdx !== 'number') {
            result.errors.push(`${prefix}: turnIdx가 숫자가 아님: ${typeof turn.turnIdx}`);
            result.ok = false;
        }
        else if (turn.turnIdx !== i) {
            result.warnings.push(`${prefix}: turnIdx=${turn.turnIdx} vs 배열 위치=${i} 불일치`);
        }
        if (phases.length > 0 && turn.phase !== undefined && !phases.includes(turn.phase)) {
            result.errors.push(`${prefix}: 알 수 없는 phase="${turn.phase}" (catalog: ${phases.join(', ')})`);
            result.ok = false;
        }
        if (turn.recallReason !== undefined && !turn_types_1.VALID_RECALL_REASONS.includes(turn.recallReason)) {
            result.errors.push(`${prefix}: 알 수 없는 recallReason="${turn.recallReason}"`);
            result.ok = false;
        }
        if (turn.chars !== undefined && typeof turn.chars !== 'number') {
            result.warnings.push(`${prefix}: chars가 숫자가 아님`);
        }
        if (turn.segments !== undefined && typeof turn.segments !== 'number') {
            result.warnings.push(`${prefix}: segments가 숫자가 아님`);
        }
    });
    return result;
}
function printResult(r) {
    const status = r.ok ? '✓ OK' : '✗ FAIL';
    console.log(`\n[${status}] ${r.sessionId} — turns: ${r.turnsCount}`);
    if (r.errors.length > 0)
        r.errors.forEach(e => console.log(`  ERROR: ${e}`));
    if (r.warnings.length > 0)
        r.warnings.forEach(w => console.log(`  WARN:  ${w}`));
}
function main() {
    const args = process.argv.slice(2);
    const results = [];
    const validPhases = loadValidPhases();
    if (args.includes('--all')) {
        const index = readJson(SESSION_INDEX_PATH);
        if (!index || !Array.isArray(index.sessions)) {
            console.error('session_index.json 읽기 실패 또는 sessions 배열 없음');
            process.exit(1);
        }
        for (const sess of index.sessions) {
            results.push(validateTurns(String(sess['sessionId'] ?? 'unknown'), sess['turns'], sess['legacy'] === true, validPhases));
        }
    }
    else if (args.length > 0 && !args[0].startsWith('--')) {
        const targetId = args[0];
        const index = readJson(SESSION_INDEX_PATH);
        const sess = index?.sessions?.find(s => s['sessionId'] === targetId);
        if (!sess) {
            const cur = readJson(CURRENT_SESSION_PATH);
            if (!cur || cur['sessionId'] !== targetId) {
                console.error(`세션 "${targetId}" 를 찾을 수 없음`);
                process.exit(1);
            }
            results.push(validateTurns(targetId, cur['turns'], cur['legacy'] === true, validPhases));
        }
        else {
            results.push(validateTurns(targetId, sess['turns'], sess['legacy'] === true, validPhases));
        }
    }
    else {
        const cur = readJson(CURRENT_SESSION_PATH);
        if (!cur) {
            console.error('current_session.json 읽기 실패');
            process.exit(1);
        }
        results.push(validateTurns(String(cur['sessionId'] ?? 'unknown'), cur['turns'], cur['legacy'] === true, validPhases));
    }
    results.forEach(printResult);
    const failCount = results.filter(r => !r.ok).length;
    const total = results.length;
    console.log(`\n총 ${total}개 세션 검사 — OK: ${total - failCount}, FAIL: ${failCount}`);
    process.exit(failCount > 0 ? 1 : 0);
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=validate-session-turns.js.map