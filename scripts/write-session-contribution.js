"use strict";
/**
 * write-session-contribution.ts
 * PD-020b P3 (session_061) — L2 session_contributions writer.
 *
 * 역할: topics/{topicId}/session_contributions/{sessionId}.md 생성.
 * - L1 turn_log.jsonl (해당 sessionId 범위)에서 rolesInOrder, turnsCount 파생
 * - session_index / current_session에서 메타(startedAt, closedAt, grade, decisions) 조회
 * - 필수 5섹션 Markdown 생성 + frontmatter YAML
 * - validateSessionContributionFM + validateL2Body 통과 후 파일 기록
 *
 * Usage (CLI):
 *   npx ts-node scripts/write-session-contribution.ts <topicId> <sessionId> [--next-action="..."]
 *
 * Usage (programmatic):
 *   import { writeSessionContribution } from './write-session-contribution';
 *   await writeSessionContribution('topic_063', 'session_060', { nextAction: '...' });
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
exports.sessionContributionPath = sessionContributionPath;
exports.writeSessionContribution = writeSessionContribution;
exports.main = main;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const utils_1 = require("./lib/utils");
const write_turn_log_1 = require("./write-turn-log");
const validate_context_layers_1 = require("./lib/validate-context-layers");
const TOPICS_DIR = path.join(utils_1.ROOT, 'topics');
const SESSION_INDEX_PATH = path.join(utils_1.ROOT, 'memory', 'sessions', 'session_index.json');
const CURRENT_SESSION_PATH = path.join(utils_1.ROOT, 'memory', 'sessions', 'current_session.json');
const DECISION_LEDGER_PATH = path.join(utils_1.ROOT, 'memory', 'shared', 'decision_ledger.json');
function sessionContributionPath(topicId, sessionId) {
    return path.join(TOPICS_DIR, topicId, 'session_contributions', `${sessionId}.md`);
}
function resolveSession(sessionId) {
    // current_session 먼저 확인 (open session 포함)
    const current = (0, utils_1.readJson)(CURRENT_SESSION_PATH, {});
    if (current.sessionId === sessionId)
        return current;
    const index = (0, utils_1.readJson)(SESSION_INDEX_PATH, { sessions: [] });
    return index.sessions.find(s => s.sessionId === sessionId) ?? null;
}
function buildFrontmatter(fm) {
    const lines = ['---'];
    lines.push(`sessionId: ${fm.sessionId}`);
    lines.push(`topicId: ${fm.topicId}`);
    lines.push(`startedAt: ${fm.startedAt}`);
    lines.push(`closedAt: ${fm.closedAt}`);
    lines.push(`grade: ${fm.grade}`);
    if (fm.gradeActual != null)
        lines.push(`gradeActual: ${fm.gradeActual}`);
    lines.push(`rolesInOrder: [${fm.rolesInOrder.map(r => `"${r}"`).join(', ')}]`);
    lines.push(`turnsCount: ${fm.turnsCount}`);
    lines.push(`decisionIds: [${fm.decisionIds.map(d => `"${d}"`).join(', ')}]`);
    // nextAction: wrap in quotes if it contains special chars
    lines.push(`nextAction: "${fm.nextAction.replace(/"/g, '\\"')}"`);
    if (fm.l1WriteFailures != null)
        lines.push(`l1WriteFailures: ${fm.l1WriteFailures}`);
    lines.push('---');
    return lines.join('\n');
}
function buildL2Body(opts) {
    const sections = [];
    sections.push(`## Summary\n\n${opts.summary}`);
    if (opts.decisions.length > 0) {
        const decLines = opts.decisions.map(d => `- **${d.id}**: ${d['summary'] ?? d['axis'] ?? '(no summary)'}`);
        sections.push(`## Decisions\n\n${decLines.join('\n')}`);
    }
    else {
        sections.push('## Decisions\n\n_(없음)_');
    }
    if (opts.keyFindings.length > 0) {
        sections.push(`## Key Findings\n\n${opts.keyFindings.map(f => `- ${f}`).join('\n')}`);
    }
    else {
        sections.push('## Key Findings\n\n_(없음)_');
    }
    if (opts.openIssues.length > 0) {
        sections.push(`## Open Issues\n\n${opts.openIssues.map(i => `- ${i}`).join('\n')}`);
    }
    else {
        sections.push('## Open Issues\n\n_(없음)_');
    }
    sections.push(`## Next Action\n\n${opts.nextAction}`);
    return sections.join('\n\n');
}
function writeSessionContribution(topicId, sessionId, opts = {}) {
    const outPath = sessionContributionPath(topicId, sessionId);
    if (fs.existsSync(outPath) && !opts.overwrite) {
        (0, utils_1.appendLog)('L2-writer', `skip (already exists): ${outPath}`);
        console.log(`SKIP: ${outPath} already exists (pass overwrite:true to force)`);
        return;
    }
    const session = resolveSession(sessionId);
    if (!session) {
        throw new Error(`session ${sessionId} not found in session_index or current_session`);
    }
    // ── L1 turns 읽기 ────────────────────────────────────────────
    const turns = (0, write_turn_log_1.readTurnLog)(topicId, sessionId);
    const rolesInOrder = turns.map(t => t.role);
    const turnsCount = turns.length;
    // ── 결정 목록 ────────────────────────────────────────────────
    // decision_ledger.session 필드를 단일 원천으로 사용.
    // session.decisions는 문자열·객체 혼재 가능성이 있어 신뢰하지 않음.
    const ledger = (0, utils_1.readJson)(DECISION_LEDGER_PATH, { decisions: [] });
    const sessionDecisions = ledger.decisions.filter(d => d.session === sessionId);
    const sessionDecisionIds = sessionDecisions.map(d => d.id);
    // ── grade 확정 ────────────────────────────────────────────────
    const grade = (session.grade ?? session.gradeDeclared ?? 'A');
    const gradeActual = (session.gradeActual ?? null);
    // ── summary ──────────────────────────────────────────────────
    const summary = opts.summary
        ?? (session.notes?.[0] ?? `${sessionId} 세션 기여 요약`);
    // ── key findings: notes[1..] + gist 필드 기반 ────────────────
    const gistFindings = turns
        .filter(t => t.gist && !t.gist.startsWith('[backfill]'))
        .map(t => `[${t.role}] ${t.gist}`);
    const notesFindings = (session.notes ?? []).slice(1);
    const keyFindings = [...(opts.keyFindings ?? []), ...notesFindings, ...gistFindings];
    // ── open issues: session.gaps ────────────────────────────────
    const gapArr = Array.isArray(session.gaps) ? session.gaps : [];
    const openIssues = [...(opts.openIssues ?? []), ...gapArr];
    const nextAction = opts.nextAction ?? '다음 세션 주제 미확정';
    // ── frontmatter 객체 구성 ─────────────────────────────────────
    const fm = {
        sessionId,
        topicId,
        startedAt: session.startedAt ?? '',
        closedAt: session.closedAt ?? '',
        grade,
        ...(gradeActual !== null ? { gradeActual } : {}),
        rolesInOrder,
        turnsCount,
        decisionIds: sessionDecisionIds,
        nextAction,
    };
    // ── validate frontmatter ──────────────────────────────────────
    (0, validate_context_layers_1.validateSessionContributionFM)(fm);
    // ── body 구성 + validate ──────────────────────────────────────
    const body = buildL2Body({
        sessionId, topicId, summary,
        decisions: sessionDecisions,
        keyFindings, openIssues, nextAction,
    });
    (0, validate_context_layers_1.validateL2Body)(body);
    // ── write ─────────────────────────────────────────────────────
    const fullContent = buildFrontmatter(fm) + '\n\n' + body + '\n';
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, fullContent, 'utf8');
    (0, utils_1.appendLog)('L2-writer', `wrote ${outPath} | turns=${turnsCount} decisions=${sessionDecisionIds.length}`);
    console.log(`OK: wrote ${outPath}`);
}
// ── Programmatic entry point (in-process require) ───────────────────────────
async function main(args = []) {
    const [topicId, sessionId, ...rest] = args;
    if (!topicId || !sessionId) {
        throw new Error('Usage: write-session-contribution <topicId> <sessionId> [--next-action="..."] [--overwrite]');
    }
    const nextActionArg = rest.find(a => a.startsWith('--next-action='))?.split('=').slice(1).join('=') ?? undefined;
    const overwrite = rest.includes('--overwrite');
    writeSessionContribution(topicId, sessionId, {
        ...(nextActionArg !== undefined ? { nextAction: nextActionArg } : {}),
        overwrite,
    });
}
// ── CLI entry point ──────────────────────────────────────────────────────────
if (require.main === module) {
    main(process.argv.slice(2)).catch(err => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    });
}
//# sourceMappingURL=write-session-contribution.js.map