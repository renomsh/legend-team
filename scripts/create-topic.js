"use strict";
/**
 * create-topic.ts
 * Creates a new topic with control-plane workspace (topics/{id}) and registers
 * it in topic_index.json with both controlPath and reportPath.
 *
 * Usage:
 *   ts-node scripts/create-topic.ts "<topic title>"
 *   ts-node scripts/create-topic.ts "<topic title>" <slug>
 *   ts-node scripts/create-topic.ts "<topic title>" <slug> <grade>
 *
 * Example:
 *   ts-node scripts/create-topic.ts "팀 운영 구조 재설계" team-restructure A
 *
 * D-052: phase:"framing" + hold:null 강제 기록. grade 선택 파라미터.
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
const utils_1 = require("./lib/utils");
const migrate_topic_index_1 = require("./migrate-topic-index");
const TOPIC_INDEX_PATH = path.join(utils_1.ROOT, 'memory/shared/topic_index.json');
function readTopicIndex() {
    return (0, utils_1.readJson)(TOPIC_INDEX_PATH, { topics: [], lastUpdated: new Date().toISOString() });
}
function nextTopicId(index) {
    return (0, utils_1.nextId)(index.topics, 'topic_');
}
/** Canonical v0.3.0 frontmatter template for Ace's agenda */
function agendaTemplate(id, topicSlug, title, date) {
    return [
        '---',
        `topic: ${id}`,
        `topic_slug: ${topicSlug}`,
        `title: ${title}`,
        'role: ace',
        'phase: framing',
        'revision: 1',
        `date: ${date}`,
        'report_status: draft',
        'session_status: open',
        'accessed_assets:',
        '  - topic_index.json',
        '  - decision_ledger.json',
        '---',
        '',
        '## Topic Statement',
        '',
        '## Decision Axes',
        '',
        '## Scope',
        '',
        '### In',
        '',
        '### Out',
        '',
        '## Key Assumptions',
        '',
        '## Agent Sequence',
        '',
        '## Open Questions',
        '',
    ].join('\n');
}
function slugify(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 50);
}
const VALID_GRADES = new Set(['S', 'A', 'B', 'C']);
const VALID_TOPIC_TYPES = new Set(['framing', 'implementation', 'standalone']);
function createTopic(title, explicitSlug, grade, topicType, parentTopicId) {
    const index = readTopicIndex();
    const id = nextTopicId(index);
    const topicDir = path.join(utils_1.ROOT, 'topics', id);
    if (fs.existsSync(topicDir)) {
        console.error(`Error: topic directory already exists: topics/${id}`);
        process.exit(1);
    }
    const now = new Date().toISOString();
    const date = now.slice(0, 10);
    const topicSlug = explicitSlug ?? slugify(title);
    const reportPath = `reports/${date}_${topicSlug}`;
    // Create control-plane folder structure
    fs.mkdirSync(topicDir, { recursive: true });
    // topic_meta.json — D-052: phase×hold 강제 기록
    (0, utils_1.writeJson)(path.join(topicDir, 'topic_meta.json'), {
        id,
        title,
        status: 'open',
        phase: 'framing',
        hold: null,
        created: date,
        lastUpdated: date,
        description: '',
        tags: [],
    });
    // agenda.md — canonical v0.3.0 frontmatter
    fs.writeFileSync(path.join(topicDir, 'agenda.md'), agendaTemplate(id, topicSlug, title, date), 'utf8');
    // Structured empty JSON files
    (0, utils_1.writeJson)(path.join(topicDir, 'debate_log.json'), { topicId: id, entries: [] });
    (0, utils_1.writeJson)(path.join(topicDir, 'decisions.json'), { topicId: id, decisions: [] });
    (0, utils_1.writeJson)(path.join(topicDir, 'open_issues.json'), { topicId: id, issues: [] });
    (0, utils_1.writeJson)(path.join(topicDir, 'master_feedback.json'), { topicId: id, feedback: [] });
    (0, utils_1.writeJson)(path.join(topicDir, 'revision_history.json'), { topicId: id, revisions: [] });
    (0, utils_1.writeJson)(path.join(topicDir, 'speculative_options.json'), { topicId: id, options: [] });
    // Asset #4 (D-103, 2026-04-28) — context layer auto-init
    // turn_log.jsonl: PostToolUse hook이 append. 첫 에이전트 호출 전 파일 존재 보장.
    const turnLogPath = path.join(topicDir, 'turn_log.jsonl');
    if (!fs.existsSync(turnLogPath)) {
        fs.writeFileSync(turnLogPath, '', 'utf8');
    }
    // context_brief.md: regenerate-context-brief.ts가 세션 종료 시 재생성. stub으로 init.
    const contextBriefPath = path.join(topicDir, 'context_brief.md');
    if (!fs.existsSync(contextBriefPath)) {
        fs.writeFileSync(contextBriefPath, [
            '---',
            `topicId: ${id}`,
            `topicTitle: "${title}"`,
            'phase: framing',
            'hold: null',
            `grade: ${grade || 'A'}`,
            'sessionCount: 0',
            `lastUpdated: ${now}`,
            '---',
            '',
            '## Current Phase',
            '',
            '**framing**',
            '',
            '## Key Anchors',
            '',
            '(신규 토픽 — 아직 결정 없음)',
            '',
            '## Next Action',
            '',
            'Ace 프레이밍',
            '',
        ].join('\n'), 'utf8');
    }
    // session_contributions/: 이전 세션 Edi 보고서 저장 디렉토리 (pre-tool-use-task.js가 읽음)
    const scDir = path.join(topicDir, 'session_contributions');
    if (!fs.existsSync(scDir)) {
        fs.mkdirSync(scDir, { recursive: true });
    }
    // Register in topic_index.json with 2-plane paths + D-052 fields
    const entry = {
        id,
        title,
        status: 'open',
        phase: 'framing',
        hold: null,
        ...(grade && VALID_GRADES.has(grade) ? { grade: grade } : {}),
        ...(topicType && VALID_TOPIC_TYPES.has(topicType)
            ? {
                topicType: topicType,
                parentTopicId: parentTopicId ?? null,
                childTopicIds: [],
            }
            : {}),
        created: date,
        controlPath: `topics/${id}`,
        reportPath,
        reportFiles: [],
        published: false,
        /** 이 토픽이 종결된 세션 ID (session-end-finalize.js가 set-closed-in-session.ts로 기록) */
        closedInSession: null,
        // legacy fallback
        path: `topics/${id}`,
    };
    index.topics.push(entry);
    // D-057: parentTopicId 지정 시 parent의 childTopicIds에 자동 추가
    if (topicType && VALID_TOPIC_TYPES.has(topicType) && parentTopicId) {
        const parent = index.topics.find((t) => t.id === parentTopicId);
        if (parent) {
            parent.childTopicIds = parent.childTopicIds ?? [];
            if (!parent.childTopicIds.includes(id)) {
                parent.childTopicIds.push(id);
            }
        }
    }
    // Keep topic_index sorted by id desc so the board never goes out of order.
    index.topics.sort((a, b) => (0, migrate_topic_index_1.compareTopicDesc)(a.id, b.id));
    index.lastUpdated = now;
    (0, utils_1.writeJson)(TOPIC_INDEX_PATH, index);
    // Summary
    console.log(`\nTopic created: ${id} — "${title}"`);
    console.log(`  Control plane:  topics/${id}/`);
    console.log(`    topic_meta.json, agenda.md, debate_log.json`);
    console.log(`    decisions.json, open_issues.json, master_feedback.json`);
    console.log(`    revision_history.json, speculative_options.json`);
    console.log(`  Report plane:   ${reportPath}/  (created on first build-report run)`);
    console.log(`\nRegistered in memory/shared/topic_index.json`);
    console.log(`  controlPath: topics/${id}`);
    console.log(`  reportPath:  ${reportPath}`);
    console.log(`  phase: framing | hold: null${grade && VALID_GRADES.has(grade) ? ` | grade: ${grade}` : ''}`);
}
// 위치 인자와 플래그 분리 파싱
const rawArgs = process.argv.slice(2);
const positionals = [];
let topicType;
let parentTopicId;
for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i];
    if (a === '--topicType') {
        topicType = rawArgs[++i];
    }
    else if (a === '--parentTopicId') {
        parentTopicId = rawArgs[++i];
    }
    else if (a !== undefined) {
        positionals.push(a);
    }
}
const title = positionals[0];
const slug = positionals[1];
const grade = positionals[2]?.toUpperCase();
if (!title || title.trim().length === 0) {
    console.error('Usage: ts-node scripts/create-topic.ts "<topic title>" [slug] [grade:S|A|B|C] [--topicType framing|implementation|standalone] [--parentTopicId topic_NNN]');
    process.exit(1);
}
if (grade && !VALID_GRADES.has(grade)) {
    console.error(`⚠️  grade "${grade}" 무시됨 — 유효값: S, A, B, C`);
}
if (topicType && !VALID_TOPIC_TYPES.has(topicType)) {
    console.error(`⚠️  topicType "${topicType}" 무시됨 — 유효값: framing, implementation, standalone`);
    topicType = undefined;
}
createTopic(title.trim(), slug?.trim(), grade, topicType, parentTopicId);
//# sourceMappingURL=create-topic.js.map