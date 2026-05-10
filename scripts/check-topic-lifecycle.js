"use strict";
/**
 * check-topic-lifecycle.ts
 * A6-2: 활성 토픽 lifecycle 경고 점검 (D-055).
 *
 * 경고 기준:
 *   - sessionCount >= maxSessions (기본 5)
 *   - lastActivity 미갱신 >= lastActivityDays (기본 30일)
 *
 * 규칙:
 *   - hold!=null 토픽 제외
 *   - expectedDuration 필드 있는 토픽 제외
 *   - 경고만 출력 — 자동 status 변경 없음
 *
 * Usage:
 *   npx ts-node scripts/check-topic-lifecycle.ts
 *
 * Programmatic:
 *   import { checkTopicLifecycle } from './check-topic-lifecycle';
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
exports.checkTopicLifecycle = checkTopicLifecycle;
exports.formatLifecycleWarnings = formatLifecycleWarnings;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const LIFECYCLE_RULES_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'topic_lifecycle_rules.json');
const TOPIC_INDEX_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'topic_index.json');
const TOPICS_DIR = path.join(utils_1.ROOT, 'topics');
function countSessionContributions(topicId) {
    const dir = path.join(TOPICS_DIR, topicId, 'session_contributions');
    if (!fs.existsSync(dir))
        return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
}
function getLastUpdated(topicId) {
    const metaPath = path.join(TOPICS_DIR, topicId, 'topic_meta.json');
    if (!fs.existsSync(metaPath))
        return null;
    try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        return meta.lastUpdated ?? meta.created ?? null;
    }
    catch {
        return null;
    }
}
function daysSince(dateStr) {
    const then = new Date(dateStr).getTime();
    const now = Date.now();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}
function checkTopicLifecycle() {
    const rules = (0, utils_1.readJson)(LIFECYCLE_RULES_PATH, {
        rules: { maxSessions: { threshold: 5 }, lastActivityDays: { threshold: 30 } },
        exemptions: { holdTopics: true },
    });
    const topicIndex = (0, utils_1.readJson)(TOPIC_INDEX_PATH, { topics: [] });
    const maxSessions = rules.rules.maxSessions.threshold;
    const lastActivityDays = rules.rules.lastActivityDays.threshold;
    const warnings = [];
    for (const topic of topicIndex.topics) {
        // 완전 종료 토픽 제외
        if (topic.status === 'closed' || topic.status === 'completed')
            continue;
        // hold 토픽 제외
        if (rules.exemptions.holdTopics && topic.hold != null)
            continue;
        // expectedDuration 예외
        if (topic.expectedDuration)
            continue;
        const sessionCount = countSessionContributions(topic.id);
        const lastUpdated = getLastUpdated(topic.id);
        // 경고 1: maxSessions 초과
        if (sessionCount >= maxSessions) {
            warnings.push({
                topicId: topic.id,
                title: topic.title,
                type: 'maxSessions',
                detail: `세션 ${sessionCount}회 (기준: ${maxSessions}) — 마무리 또는 분할 검토 권고`,
            });
        }
        // 경고 2: stale (lastActivity)
        if (lastUpdated) {
            const days = daysSince(lastUpdated);
            if (days >= lastActivityDays) {
                warnings.push({
                    topicId: topic.id,
                    title: topic.title,
                    type: 'stale',
                    detail: `마지막 활동 ${days}일 전 (기준: ${lastActivityDays}일) — hold 또는 close 검토 권고`,
                });
            }
        }
    }
    return warnings;
}
function formatLifecycleWarnings(warnings) {
    if (warnings.length === 0)
        return '';
    const lines = ['⚠️  [lifecycle 경고] 활성 토픽 점검 결과:\n'];
    for (const w of warnings) {
        lines.push(`  • ${w.topicId} — ${w.title.slice(0, 40)}`);
        lines.push(`    ${w.detail}`);
    }
    lines.push('');
    return lines.join('\n');
}
if (require.main === module) {
    const warnings = checkTopicLifecycle();
    const out = formatLifecycleWarnings(warnings);
    if (out)
        console.warn(out);
    else
        console.log('[lifecycle 경고] 활성 토픽 이상 없음.');
}
//# sourceMappingURL=check-topic-lifecycle.js.map