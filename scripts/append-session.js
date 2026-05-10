#!/usr/bin/env ts-node
"use strict";
/**
 * append-session.ts
 * session_index.json에 새 세션을 안전하게 추가.
 * Edit 도구 직접 수정 금지 — 이 스크립트만 사용.
 *
 * 사용법:
 *   ts-node scripts/append-session.ts \
 *     --sessionId session_028 \
 *     --topicSlug legend-team-dashboard \
 *     --topicId topic_042 \
 *     --topic "legend-team Dash board" \
 *     --startedAt 2026-04-17T04:00:00.000Z \
 *     --closedAt 2026-04-17T06:00:00.000Z \
 *     [--grade A] \
 *     [--gradeDeclared A] \
 *     [--gradeActual C] \
 *     [--decisions "D-027,D-028"] \
 *     [--plannedSequence "ace,dev"] \
 *     [--turns '[{"role":"ace","turnIdx":0,"phase":"framing"}]'] \
 *     [--note "메모"]
 *
 * D-051/D-052: topicId(N:1 링크), grade/gradeDeclared/gradeActual/gradeMismatch,
 *              turns(Turn[]), plannedSequence 강제 기록.
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
const SESSION_INDEX_PATH = path.join(__dirname, '../memory/sessions/session_index.json');
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = new Map();
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg !== undefined && arg.startsWith('--')) {
            const next = args[i + 1];
            parsed.set(arg.slice(2), next ?? '');
            i++;
        }
    }
    if (parsed.has('help'))
        return { help: true };
    const result = {};
    const sessionId = parsed.get('sessionId');
    const topicId = parsed.get('topicId');
    const topicSlug = parsed.get('topicSlug');
    const topic = parsed.get('topic');
    const startedAt = parsed.get('startedAt');
    const closedAt = parsed.get('closedAt');
    const grade = parsed.get('grade');
    const gradeDeclared = parsed.get('gradeDeclared');
    const gradeActual = parsed.get('gradeActual');
    const decisions = parsed.get('decisions');
    const plannedSequence = parsed.get('plannedSequence');
    const turnsRaw = parsed.get('turns');
    const agentsCompleted = parsed.get('agentsCompleted');
    const note = parsed.get('note');
    const oneLineSummary = parsed.get('oneLineSummary');
    const decisionsAdded = parsed.get('decisionsAdded');
    if (sessionId)
        result.sessionId = sessionId;
    if (topicId)
        result.topicId = topicId;
    if (topicSlug)
        result.topicSlug = topicSlug;
    if (topic)
        result.topic = topic;
    if (startedAt)
        result.startedAt = startedAt;
    result.closedAt = closedAt ?? null;
    if (grade)
        result.grade = grade;
    if (gradeDeclared)
        result.gradeDeclared = gradeDeclared;
    if (gradeActual)
        result.gradeActual = gradeActual;
    if (decisions)
        result.decisions = decisions.split(',').map(d => d.trim()).filter(Boolean);
    if (plannedSequence)
        result.plannedSequence = plannedSequence.split(',').map(r => r.trim()).filter(Boolean);
    if (turnsRaw) {
        try {
            result.turns = JSON.parse(turnsRaw);
        }
        catch {
            console.error('⚠️  --turns JSON 파싱 실패 — 무시됨');
        }
    }
    if (agentsCompleted)
        result.agentsCompleted = agentsCompleted.split(',').map(a => a.trim()).filter(Boolean);
    if (note)
        result.note = note;
    if (oneLineSummary)
        result.oneLineSummary = oneLineSummary;
    if (decisionsAdded)
        result.decisionsAdded = decisionsAdded.split(',').map(d => d.trim()).filter(Boolean);
    return result;
}
function computeGradeMismatch(declared, actual) {
    if (!declared || !actual)
        return undefined;
    return declared !== actual;
}
function main() {
    const args = parseArgs();
    if (args.help) {
        console.log(`
Usage: ts-node scripts/append-session.ts \\
  --sessionId <id> \\
  --topicSlug <slug> \\
  [--topicId <topic_NNN>] \\
  [--topic <title>] \\
  --startedAt <ISO8601> \\
  [--closedAt <ISO8601>] \\
  [--grade <S|A|B|C>] \\
  [--gradeDeclared <S|A|B|C>] \\
  [--gradeActual <S|A|B|C>] \\
  [--decisions "D-001,D-002"] \\
  [--plannedSequence "ace,dev"] \\
  [--turns '[{"role":"ace","turnIdx":0,"phase":"framing"}]'] \\
  [--agentsCompleted "ace,arki,edi"] \\
  [--note <text>]

D-051/D-052 필드: topicId(N:1), grade/gradeDeclared/gradeActual/gradeMismatch(자동계산),
                  turns(Turn[]), plannedSequence
`);
        process.exit(0);
    }
    if (!args.sessionId || !args.topicSlug || !args.startedAt) {
        console.error('❌ 필수 항목 누락: --sessionId, --topicSlug, --startedAt');
        process.exit(1);
    }
    const gradeMismatch = computeGradeMismatch(args.gradeDeclared, args.gradeActual);
    const raw = fs.readFileSync(SESSION_INDEX_PATH, 'utf8');
    let index;
    try {
        index = JSON.parse(raw);
    }
    catch (e) {
        console.error('❌ session_index.json 파싱 오류:', e);
        process.exit(1);
    }
    const existing = index.sessions.find(s => s.sessionId === args.sessionId);
    if (existing) {
        console.log(`⚠️  ${args.sessionId} 이미 존재. 업데이트합니다.`);
        Object.assign(existing, {
            topicSlug: args.topicSlug,
            ...(args.topicId && { topicId: args.topicId }),
            ...(args.topic && { topic: args.topic }),
            startedAt: args.startedAt,
            closedAt: args.closedAt ?? existing.closedAt,
            ...(args.grade && { grade: args.grade }),
            ...(args.gradeDeclared && { gradeDeclared: args.gradeDeclared }),
            ...(args.gradeActual && { gradeActual: args.gradeActual }),
            ...(gradeMismatch !== undefined && { gradeMismatch }),
            ...(args.decisions && { decisions: args.decisions }),
            ...(args.plannedSequence && { plannedSequence: args.plannedSequence }),
            ...(args.turns && { turns: args.turns }),
            ...(args.agentsCompleted && { agentsCompleted: args.agentsCompleted }),
            ...(args.note && { note: args.note }),
            ...(args.oneLineSummary && { oneLineSummary: args.oneLineSummary }),
            ...(args.decisionsAdded && { decisionsAdded: args.decisionsAdded }),
        });
    }
    else {
        const entry = {
            sessionId: args.sessionId,
            ...(args.topicId && { topicId: args.topicId }),
            topicSlug: args.topicSlug,
            ...(args.topic && { topic: args.topic }),
            startedAt: args.startedAt,
            closedAt: args.closedAt ?? null,
            ...(args.grade && { grade: args.grade }),
            ...(args.gradeDeclared && { gradeDeclared: args.gradeDeclared }),
            ...(args.gradeActual && { gradeActual: args.gradeActual }),
            ...(gradeMismatch !== undefined && { gradeMismatch }),
            ...(args.decisions && { decisions: args.decisions }),
            ...(args.plannedSequence && { plannedSequence: args.plannedSequence }),
            ...(args.turns && { turns: args.turns }),
            ...(args.agentsCompleted && { agentsCompleted: args.agentsCompleted }),
            ...(args.note && { note: args.note }),
            ...(args.oneLineSummary && { oneLineSummary: args.oneLineSummary }),
            ...(args.decisionsAdded && { decisionsAdded: args.decisionsAdded }),
        };
        index.sessions.push(entry);
    }
    index.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SESSION_INDEX_PATH, JSON.stringify(index, null, 2), 'utf8');
    // 검증
    JSON.parse(fs.readFileSync(SESSION_INDEX_PATH, 'utf8'));
    const gradeInfo = args.gradeDeclared
        ? ` | grade: ${args.gradeDeclared}→${args.gradeActual ?? '?'} mismatch=${gradeMismatch}`
        : '';
    console.log(`✅ ${args.sessionId} 기록 완료 (total: ${index.sessions.length}개)${gradeInfo}`);
}
main();
//# sourceMappingURL=append-session.js.map