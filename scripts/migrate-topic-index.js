"use strict";
/**
 * migrate-topic-index.ts
 * 일회성 마이그레이션 + 재사용 가능한 정렬/정규화 유틸.
 * - closed → completed (status_catalog.aliases 기반)
 * - topics 배열을 id 내림차순(natural)으로 재정렬
 *
 * 사용:
 *   npx ts-node scripts/migrate-topic-index.ts
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
exports.parseTopicId = parseTopicId;
exports.compareTopicDesc = compareTopicDesc;
exports.normalizeStatus = normalizeStatus;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ROOT = path.resolve(__dirname, '..');
const TOPIC_INDEX = path.join(ROOT, 'memory/shared/topic_index.json');
const STATUS_CATALOG = path.join(ROOT, 'memory/shared/status_catalog.json');
/** topic_NNN[suffix] → { num, suffix } */
function parseTopicId(id) {
    const m = /^topic_(\d+)([a-z]*)$/i.exec(id);
    if (!m)
        return { num: -1, suffix: id };
    return { num: parseInt(m[1], 10), suffix: (m[2] ?? '').toLowerCase() };
}
/** 내림차순(큰 num 먼저; 같은 num이면 suffix 긴 게 먼저 → 10a가 10 위). */
function compareTopicDesc(a, b) {
    const pa = parseTopicId(a);
    const pb = parseTopicId(b);
    if (pa.num !== pb.num)
        return pb.num - pa.num;
    if (pa.suffix === pb.suffix)
        return 0;
    return pb.suffix.localeCompare(pa.suffix);
}
function normalizeStatus(raw, catalog) {
    if (catalog.aliases[raw])
        return catalog.aliases[raw];
    const valid = catalog.statuses.some(s => s.id === raw);
    return valid ? raw : catalog.defaultStatus;
}
function main() {
    const catalog = JSON.parse(fs.readFileSync(STATUS_CATALOG, 'utf8'));
    const idx = JSON.parse(fs.readFileSync(TOPIC_INDEX, 'utf8'));
    let statusChanged = 0;
    for (const t of idx.topics) {
        const before = t.status;
        const after = normalizeStatus(before, catalog);
        if (before !== after) {
            t.status = after;
            statusChanged++;
        }
    }
    const before = idx.topics.map(t => t.id);
    idx.topics.sort((a, b) => compareTopicDesc(a.id, b.id));
    const after = idx.topics.map(t => t.id);
    const reordered = before.some((v, i) => v !== after[i]);
    idx.lastUpdated = new Date().toISOString();
    fs.writeFileSync(TOPIC_INDEX, JSON.stringify(idx, null, 2) + '\n', 'utf8');
    console.log(`[migrate-topic-index] status normalized: ${statusChanged}건`);
    console.log(`[migrate-topic-index] reordered: ${reordered ? 'yes' : 'no'} (${idx.topics.length} topics)`);
    console.log(`[migrate-topic-index] first 5 after sort: ${after.slice(0, 5).join(', ')}`);
}
if (require.main === module)
    main();
//# sourceMappingURL=migrate-topic-index.js.map