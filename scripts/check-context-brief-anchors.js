"use strict";
/**
 * check-context-brief-anchors.ts
 * A6-3: context_brief Key Anchors 섹션 lint (D-055).
 *
 * 규칙:
 *   - session_contributions 1개 이상 있는 토픽은 context_brief의
 *     "## Key Anchors" 섹션에 실제 내용이 있어야 함 (경고만, 차단 없음)
 *   - legacyCutoff 이전 생성 토픽은 면제
 *   - hold!=null 토픽 면제
 *
 * Usage:
 *   npx ts-node scripts/check-context-brief-anchors.ts
 *
 * Programmatic:
 *   import { checkContextBriefAnchors } from './check-context-brief-anchors';
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
exports.checkContextBriefAnchors = checkContextBriefAnchors;
exports.formatAnchorWarnings = formatAnchorWarnings;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const LIFECYCLE_RULES_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'topic_lifecycle_rules.json');
const TOPIC_INDEX_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'topic_index.json');
const TOPICS_DIR = path.join(utils_1.ROOT, 'topics');
function isLegacy(topic, cutoff) {
    if (!topic.created)
        return true;
    return topic.created < cutoff;
}
function hasRealContent(section) {
    const trimmed = section.trim();
    return trimmed.length > 0 && !trimmed.match(/^_\(없음\)_$/m);
}
function extractSection(md, heading) {
    const idx = md.indexOf(heading);
    if (idx < 0)
        return '';
    const after = md.slice(idx + heading.length);
    const next = after.search(/\n## /);
    return (next < 0 ? after : after.slice(0, next)).trim();
}
function countSessionContributions(topicId) {
    const dir = path.join(TOPICS_DIR, topicId, 'session_contributions');
    if (!fs.existsSync(dir))
        return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
}
function checkContextBriefAnchors() {
    const rules = (0, utils_1.readJson)(LIFECYCLE_RULES_PATH, {});
    const cutoff = rules.legacyCutoff ?? '2026-04-21';
    const topicIndex = (0, utils_1.readJson)(TOPIC_INDEX_PATH, { topics: [] });
    const warnings = [];
    for (const topic of topicIndex.topics) {
        if (topic.status === 'closed' || topic.status === 'completed')
            continue;
        if (topic.hold != null)
            continue;
        if (isLegacy(topic, cutoff))
            continue;
        const sessionCount = countSessionContributions(topic.id);
        if (sessionCount === 0)
            continue;
        const briefPath = path.join(TOPICS_DIR, topic.id, 'context_brief.md');
        if (!fs.existsSync(briefPath))
            continue;
        const raw = fs.readFileSync(briefPath, 'utf-8');
        const anchorsSection = extractSection(raw, '## Key Anchors');
        if (!hasRealContent(anchorsSection)) {
            warnings.push({
                topicId: topic.id,
                title: topic.title,
                detail: `session_contributions ${sessionCount}개 있으나 Key Anchors 비어있음 — regenerate-context-brief 재실행 권고`,
            });
        }
    }
    return warnings;
}
function formatAnchorWarnings(warnings) {
    if (warnings.length === 0)
        return '';
    const lines = ['⚠️  [anchor lint] context_brief Key Anchors 점검:\n'];
    for (const w of warnings) {
        lines.push(`  • ${w.topicId} — ${w.title.slice(0, 40)}`);
        lines.push(`    ${w.detail}`);
    }
    lines.push('');
    return lines.join('\n');
}
if (require.main === module) {
    const warnings = checkContextBriefAnchors();
    const out = formatAnchorWarnings(warnings);
    if (out)
        console.warn(out);
    else
        console.log('[anchor lint] context_brief 앵커 이상 없음.');
}
//# sourceMappingURL=check-context-brief-anchors.js.map