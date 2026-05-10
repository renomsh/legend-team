"use strict";
/**
 * validate-topic-schema.ts
 * D-052 topic_meta.json phase × hold 검증기.
 * topic_phase_catalog.json + hold_reasons_catalog.json 런타임 로드.
 *
 * 사용:
 *   npx ts-node scripts/validate-topic-schema.ts                        # topics/ 전체 검사
 *   npx ts-node scripts/validate-topic-schema.ts topic_058              # 특정 토픽 검사
 *   npx ts-node scripts/validate-topic-schema.ts --path topics/topic_058/topic_meta.json
 *
 * 함수 export: assertPhase(), assertHold(), validateTopicMeta()
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertPhase = assertPhase;
exports.assertHold = assertHold;
exports.validateTopicMeta = validateTopicMeta;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CWD = process.cwd();
const TOPIC_PHASE_CATALOG_PATH = path_1.default.join(CWD, 'memory', 'shared', 'topic_phase_catalog.json');
const HOLD_REASONS_CATALOG_PATH = path_1.default.join(CWD, 'memory', 'shared', 'hold_reasons_catalog.json');
const TOPICS_DIR = path_1.default.join(CWD, 'topics');
function readJson(p) {
    try {
        return JSON.parse(fs_1.default.readFileSync(p, 'utf8'));
    }
    catch {
        return null;
    }
}
function loadPhaseCatalog() {
    const raw = readJson(TOPIC_PHASE_CATALOG_PATH);
    if (!raw?.phases) {
        throw new Error(`topic_phase_catalog.json 로드 실패: ${TOPIC_PHASE_CATALOG_PATH}`);
    }
    return raw;
}
function loadHoldReasonsCatalog() {
    const raw = readJson(HOLD_REASONS_CATALOG_PATH);
    if (!raw?.reasons) {
        throw new Error(`hold_reasons_catalog.json 로드 실패: ${HOLD_REASONS_CATALOG_PATH}`);
    }
    return raw;
}
/**
 * phase 값이 catalog에서 허용된 값인지 검사.
 * phases ∪ aliases.keys() ∪ deprecated 모두 허용 (D-052 spec).
 * null은 legacy 토픽 허용값.
 */
function assertPhase(value, catalog) {
    if (value === null || value === undefined)
        return;
    const c = catalog ?? loadPhaseCatalog();
    const validSet = new Set([...c.phases, ...Object.keys(c.aliases ?? {}), ...(c.deprecated ?? [])]);
    if (!validSet.has(value)) {
        throw new Error(`유효하지 않은 topic phase: "${value}". 허용값: ${[...validSet].join(', ')}`);
    }
}
/**
 * hold 객체가 catalog 규칙을 준수하는지 검사.
 * null은 active 상태 허용값.
 */
function assertHold(hold, catalog) {
    if (hold === null || hold === undefined)
        return;
    const c = catalog ?? loadHoldReasonsCatalog();
    const validSet = new Set([...c.reasons, ...Object.keys(c.aliases ?? {}), ...(c.deprecated ?? [])]);
    if (!hold.reason) {
        throw new Error('hold.reason 누락');
    }
    if (!validSet.has(hold.reason)) {
        throw new Error(`유효하지 않은 hold.reason: "${hold.reason}". 허용값: ${[...validSet].join(', ')}`);
    }
    if (!hold.heldAt) {
        throw new Error('hold.heldAt 누락 (ISO 8601 날짜 필요)');
    }
}
function validateTopicMeta(topicId, meta) {
    const result = { topicId, ok: true, errors: [], warnings: [] };
    if (meta.legacy === true) {
        result.warnings.push('legacy:true — phase/hold 검증 스킵 (null 보장 권장)');
        if (meta.phase !== null && meta.phase !== undefined) {
            result.warnings.push(`legacy 토픽에 phase="${meta.phase}" 설정됨 — null 권장`);
        }
        return result;
    }
    try {
        const phaseCatalog = loadPhaseCatalog();
        assertPhase(meta.phase, phaseCatalog);
    }
    catch (e) {
        result.errors.push(String(e));
        result.ok = false;
    }
    try {
        const holdCatalog = loadHoldReasonsCatalog();
        assertHold(meta.hold, holdCatalog);
    }
    catch (e) {
        result.errors.push(String(e));
        result.ok = false;
    }
    return result;
}
function printResult(r) {
    const status = r.ok ? '✓ OK' : '✗ FAIL';
    console.log(`\n[${status}] ${r.topicId}`);
    if (r.errors.length > 0)
        r.errors.forEach(e => console.log(`  ERROR: ${e}`));
    if (r.warnings.length > 0)
        r.warnings.forEach(w => console.log(`  WARN:  ${w}`));
}
function main() {
    const args = process.argv.slice(2);
    const results = [];
    if (args.includes('--path')) {
        const idx = args.indexOf('--path');
        const filePath = args[idx + 1];
        if (!filePath) {
            console.error('--path 뒤에 파일 경로 필요');
            process.exit(1);
        }
        const meta = readJson(path_1.default.resolve(CWD, filePath));
        if (!meta) {
            console.error(`파일 읽기 실패: ${filePath}`);
            process.exit(1);
        }
        results.push(validateTopicMeta(meta.id ?? path_1.default.basename(path_1.default.dirname(filePath)), meta));
    }
    else if (args.length > 0 && !args[0].startsWith('--')) {
        const topicId = args[0];
        const metaPath = path_1.default.join(TOPICS_DIR, topicId, 'topic_meta.json');
        const meta = readJson(metaPath);
        if (!meta) {
            console.error(`topic_meta.json 없음: ${metaPath}`);
            process.exit(1);
        }
        results.push(validateTopicMeta(topicId, meta));
    }
    else {
        if (!fs_1.default.existsSync(TOPICS_DIR)) {
            console.error(`topics/ 디렉토리 없음: ${TOPICS_DIR}`);
            process.exit(1);
        }
        const topicDirs = fs_1.default.readdirSync(TOPICS_DIR).filter(d => fs_1.default.existsSync(path_1.default.join(TOPICS_DIR, d, 'topic_meta.json')));
        for (const dir of topicDirs) {
            const meta = readJson(path_1.default.join(TOPICS_DIR, dir, 'topic_meta.json'));
            if (meta)
                results.push(validateTopicMeta(dir, meta));
        }
        if (results.length === 0) {
            console.log('검사할 topic_meta.json 없음');
            process.exit(0);
        }
    }
    results.forEach(printResult);
    const failCount = results.filter(r => !r.ok).length;
    console.log(`\n총 ${results.length}개 토픽 검사 — OK: ${results.length - failCount}, FAIL: ${failCount}`);
    process.exit(failCount > 0 ? 1 : 0);
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=validate-topic-schema.js.map