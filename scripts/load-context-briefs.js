"use strict";
/**
 * load-context-briefs.ts
 * PD-020b P6 (session_062) — /open 로더용 context_brief 자동 로드.
 *
 * 역할: system_state.json의 openTopics 중 hold=null인 항목의
 *       topics/{id}/context_brief.md를 읽어 요약 출력.
 *
 * 특성:
 *  - hold!=null 토픽은 스킵 (보류 중 토픽은 로드 불필요)
 *  - context_brief.md 미존재 시 해당 토픽 스킵 (조용히)
 *  - excludeId 옵션: 신규 생성 토픽 ID는 제외 (자기 자신 로드 방지)
 *
 * Usage (CLI):
 *   npx ts-node scripts/load-context-briefs.ts [--exclude <topicId>]
 *
 * Usage (programmatic):
 *   import { loadContextBriefs } from './load-context-briefs';
 *   const results = loadContextBriefs({ excludeId: 'topic_065' });
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
exports.loadContextBriefs = loadContextBriefs;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const check_topic_lifecycle_1 = require("./check-topic-lifecycle");
const check_context_brief_anchors_1 = require("./check-context-brief-anchors");
const TOPICS_DIR = path.join(utils_1.ROOT, 'topics');
const SYSTEM_STATE_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'system_state.json');
function parseFrontmatterField(md, field) {
    const regex = new RegExp(`^${field}:\\s*(.*)$`, 'm');
    const m = md.match(regex);
    return m?.[1]?.trim() ?? '';
}
function extractSection(md, heading) {
    const idx = md.indexOf(heading);
    if (idx < 0)
        return '_(없음)_';
    const after = md.slice(idx + heading.length);
    const next = after.search(/\n## /);
    return (next < 0 ? after : after.slice(0, next)).trim() || '_(없음)_';
}
function loadContextBriefs(opts = {}) {
    const state = (0, utils_1.readJson)(SYSTEM_STATE_PATH, {});
    const openTopics = state.openTopics ?? [];
    const results = [];
    for (const topic of openTopics) {
        // Skip held topics
        if (topic['hold'] != null)
            continue;
        // Skip explicitly excluded topic (e.g., newly created one)
        if (opts.excludeId && topic.id === opts.excludeId)
            continue;
        const briefPath = path.join(TOPICS_DIR, topic.id, 'context_brief.md');
        if (!fs.existsSync(briefPath))
            continue;
        const raw = fs.readFileSync(briefPath, 'utf8');
        const hold = parseFrontmatterField(raw, 'hold');
        if (hold && hold !== 'null')
            continue; // double-check hold in frontmatter
        const phase = parseFrontmatterField(raw, 'phase') || 'unknown';
        const grade = parseFrontmatterField(raw, 'grade') || '?';
        const nextAction = extractSection(raw, '## Next Action');
        results.push({ topicId: topic.id, title: topic.title, phase, hold, grade, nextAction, raw });
    }
    return results;
}
function formatOutput(entries) {
    if (entries.length === 0) {
        return '[context_brief 로드] 활성 토픽 없음 (또는 context_brief 미생성).';
    }
    const lines = ['[context_brief 로드] 활성 openTopics 컨텍스트 브리프:\n'];
    for (const e of entries) {
        lines.push(`### ${e.topicId} — ${e.title}`);
        lines.push(`- Phase: ${e.phase} | Grade: ${e.grade}`);
        lines.push(`- Next Action: ${e.nextAction}`);
        lines.push('');
    }
    return lines.join('\n');
}
// ── CLI entry point ───────────────────────────────────────────────────────────
if (require.main === module) {
    const args = process.argv.slice(2);
    let excludeId;
    const exIdx = args.indexOf('--exclude');
    if (exIdx >= 0 && args[exIdx + 1]) {
        excludeId = args[exIdx + 1];
    }
    const entries = loadContextBriefs({ excludeId });
    console.log(formatOutput(entries));
    // A6-2 lifecycle 경고
    const lifecycleWarnings = (0, check_topic_lifecycle_1.checkTopicLifecycle)();
    const lifecycleOut = (0, check_topic_lifecycle_1.formatLifecycleWarnings)(lifecycleWarnings);
    if (lifecycleOut)
        process.stderr.write(lifecycleOut + '\n');
    // A6-3 anchor lint 경고
    const anchorWarnings = (0, check_context_brief_anchors_1.checkContextBriefAnchors)();
    const anchorOut = (0, check_context_brief_anchors_1.formatAnchorWarnings)(anchorWarnings);
    if (anchorOut)
        process.stderr.write(anchorOut + '\n');
}
//# sourceMappingURL=load-context-briefs.js.map