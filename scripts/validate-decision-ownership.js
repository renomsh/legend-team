"use strict";
/**
 * validate-decision-ownership.ts
 * D-055 게이트 A 검증: decision_ledger의 owningTopicId + scopeCheck 무결성 확인.
 *
 * 검증 항목:
 * 1. 전 엔트리 owningTopicId 존재 (null 허용, undefined 불가)
 * 2. 전 엔트리 scopeCheck 존재 + 허용값
 * 3. owningTopicId가 non-null이면 topic_index에 실존
 * 4. cross-topic이면 relatedTopics 존재
 *
 * npx ts-node scripts/validate-decision-ownership.ts
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ROOT = path.resolve(__dirname, '..');
const LEDGER_PATH = path.join(ROOT, 'memory/shared/decision_ledger.json');
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory/shared/topic_index.json');
const VALID_SCOPE = ['topic-local', 'cross-topic', 'global', 'legacy-ambiguous'];
function main() {
    const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'));
    const topicIndex = JSON.parse(fs.readFileSync(TOPIC_INDEX_PATH, 'utf-8'));
    const topicIds = new Set(topicIndex.topics.map((t) => t.id));
    const errors = [];
    const warnings = [];
    for (const entry of ledger.decisions) {
        // 1. owningTopicId 존재 여부 (undefined 불가)
        if (entry.owningTopicId === undefined) {
            errors.push(`${entry.id}: owningTopicId missing`);
        }
        else if (entry.owningTopicId !== null && !topicIds.has(entry.owningTopicId)) {
            // 3. non-null owningTopicId는 topic_index에 실존해야 함
            errors.push(`${entry.id}: owningTopicId '${entry.owningTopicId}' not in topic_index`);
        }
        // 2. scopeCheck 존재 + 허용값
        if (entry.scopeCheck === undefined) {
            errors.push(`${entry.id}: scopeCheck missing`);
        }
        else if (!VALID_SCOPE.includes(entry.scopeCheck)) {
            errors.push(`${entry.id}: invalid scopeCheck '${entry.scopeCheck}'`);
        }
        // 4. cross-topic → relatedTopics 권고
        if (entry.scopeCheck === 'cross-topic' && (!entry.relatedTopics || entry.relatedTopics.length === 0)) {
            warnings.push(`${entry.id}: scopeCheck=cross-topic but relatedTopics missing`);
        }
    }
    if (errors.length > 0) {
        console.error('FAIL — 오류:');
        errors.forEach(e => console.error('  ✗', e));
        process.exit(1);
    }
    if (warnings.length > 0) {
        console.warn('경고:');
        warnings.forEach(w => console.warn('  ⚠', w));
    }
    console.log(`OK — ${ledger.decisions.length}개 엔트리 검증 통과`);
    if (warnings.length > 0)
        console.log(`   (경고 ${warnings.length}건 — 수동 확인 권장)`);
}
main();
//# sourceMappingURL=validate-decision-ownership.js.map