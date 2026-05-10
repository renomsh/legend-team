"use strict";
/**
 * backfill-decision-ownership.ts
 * D-055 백필: decision_ledger.json 전 엔트리에 owningTopicId + scopeCheck 추가.
 *
 * 규칙:
 * - 이미 두 필드 모두 있으면 스킵
 * - owningTopicId: session_index.topicId 역매핑 → 실패 시 topicSlug 역매핑 → null
 * - scopeCheck: 'legacy-ambiguous' (백필 기본값)
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
const SESSION_INDEX_PATH = path.join(ROOT, 'memory/sessions/session_index.json');
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory/shared/topic_index.json');
function slugFromReportPath(reportPath) {
    // "reports/2026-04-21_pd-020b-context-3layer" → "pd-020b-context-3layer"
    const base = reportPath.replace(/^reports\//, '');
    return base.replace(/^\d{4}-\d{2}-\d{2}_/, '');
}
function main() {
    const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'));
    const sessionIndex = JSON.parse(fs.readFileSync(SESSION_INDEX_PATH, 'utf-8'));
    const topicIndex = JSON.parse(fs.readFileSync(TOPIC_INDEX_PATH, 'utf-8'));
    // session_id → topicId map (from session_index)
    const sessionToTopic = {};
    for (const s of sessionIndex.sessions) {
        if (s.topicId)
            sessionToTopic[s.sessionId] = s.topicId;
    }
    // topicSlug → topicId map (from topic_index reportPath)
    const slugToTopic = {};
    for (const t of topicIndex.topics) {
        if (t.reportPath) {
            const slug = slugFromReportPath(t.reportPath);
            slugToTopic[slug] = t.id;
        }
    }
    let skipped = 0;
    let backfilled = 0;
    let nullOwner = 0;
    for (const entry of ledger.decisions) {
        const hasOwner = entry.owningTopicId !== undefined;
        const hasScope = entry.scopeCheck !== undefined;
        if (hasOwner && hasScope) {
            skipped++;
            continue;
        }
        let owningTopicId = null;
        if (!hasOwner) {
            // 1. session_index 역매핑
            if (entry.session && sessionToTopic[entry.session]) {
                owningTopicId = sessionToTopic[entry.session] ?? null;
            }
            // 2. topic slug 역매핑 (session_index에 topicId 없는 경우)
            else if (entry.topic && slugToTopic[entry.topic]) {
                owningTopicId = slugToTopic[entry.topic] ?? null;
            }
            // 3. 매핑 실패 → null
            else {
                owningTopicId = null;
                nullOwner++;
            }
            entry.owningTopicId = owningTopicId;
        }
        if (!hasScope) {
            entry.scopeCheck = 'legacy-ambiguous';
        }
        backfilled++;
    }
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf-8');
    console.log(`백필 완료:`);
    console.log(`  스킵 (이미 완료): ${skipped}`);
    console.log(`  백필: ${backfilled}`);
    console.log(`  owningTopicId=null (매핑 실패): ${nullOwner}`);
    console.log(`저장: ${LEDGER_PATH}`);
}
main();
//# sourceMappingURL=backfill-decision-ownership.js.map