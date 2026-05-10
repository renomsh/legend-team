"use strict";
/**
 * backfill-turns-integrity.ts
 * PD-020b P0.3d — session_047~059의 turns[].phase + agentsCompleted 규칙 기반 재작성.
 *
 * 작업:
 *  - phase enum drift 정규화 (C1)
 *  - agentsCompleted = turns[].role 순서·중복 허용 배열로 재생성 (C2)
 *  - current_session.json도 해당 세션이 현재 열려 있으면 갱신 (여기선 스킵 — closed 대상)
 *
 * 사용:
 *   npx ts-node scripts/backfill-turns-integrity.ts --dry-run    # diff 출력만
 *   npx ts-node scripts/backfill-turns-integrity.ts --apply      # 실제 수정
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CWD = process.cwd();
const SESSION_INDEX_PATH = path_1.default.join(CWD, 'memory', 'sessions', 'session_index.json');
// C1 phase enum 매핑
const PHASE_MAP = {
    'structural-analysis': 'analysis',
    'structural-refinement': 'analysis',
    'cost-evaluation': 'analysis',
    'risk-audit': 'analysis',
    'resource-evaluation': 'analysis',
    'design-spec': 'analysis',
    'design-critique': 'analysis',
    'review': 'synthesis',
    'decision-refinement': 'synthesis',
    'output': 'compile',
    // 'implementation'은 catalog에 신설됨 — 유지
};
function readJson(p) {
    return JSON.parse(fs_1.default.readFileSync(p, 'utf8'));
}
function writeJson(p, data) {
    fs_1.default.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
function processSession(sess) {
    const diff = {
        sessionId: sess.sessionId,
        phaseChanges: [],
        agentsBefore: (sess.agentsCompleted ?? []).slice(),
        agentsAfter: [],
        agentsChanged: false,
    };
    if (!Array.isArray(sess.turns))
        return diff;
    // C1: phase enum 정규화
    const newTurns = sess.turns.map((t, i) => {
        const newT = { ...t };
        const mapped = newT.phase ? PHASE_MAP[newT.phase] : undefined;
        if (newT.phase && mapped) {
            diff.phaseChanges.push({
                turnIdx: typeof t.turnIdx === 'number' ? t.turnIdx : i,
                before: newT.phase,
                after: mapped,
            });
            newT.phase = mapped;
        }
        return newT;
    });
    // C2: agentsCompleted를 turns.role 순서·중복 허용으로 재생성
    const newAgents = newTurns.map(t => t.role).filter(r => typeof r === 'string');
    diff.agentsAfter = newAgents;
    diff.agentsChanged = JSON.stringify(diff.agentsBefore) !== JSON.stringify(newAgents);
    sess.turns = newTurns;
    sess.agentsCompleted = newAgents;
    return diff;
}
function printDiff(d) {
    const hasPhase = d.phaseChanges.length > 0;
    if (!hasPhase && !d.agentsChanged)
        return;
    console.log(`\n── ${d.sessionId}`);
    if (hasPhase) {
        console.log(`  phase 변경 ${d.phaseChanges.length}건:`);
        d.phaseChanges.forEach(c => console.log(`    turns[${c.turnIdx}] "${c.before}" → "${c.after}"`));
    }
    if (d.agentsChanged) {
        console.log(`  agentsCompleted:`);
        console.log(`    before: [${d.agentsBefore.join(', ')}]  (len=${d.agentsBefore.length})`);
        console.log(`    after:  [${d.agentsAfter.join(', ')}]  (len=${d.agentsAfter.length})`);
    }
}
function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const apply = args.includes('--apply');
    if (!dryRun && !apply) {
        console.error('--dry-run 또는 --apply 필수');
        process.exit(2);
    }
    const index = readJson(SESSION_INDEX_PATH);
    const targets = index.sessions.filter(s => !s.legacy && Array.isArray(s.turns));
    console.log(`대상 세션: ${targets.length}개`);
    const diffs = targets.map(processSession);
    diffs.forEach(printDiff);
    const totalPhase = diffs.reduce((a, d) => a + d.phaseChanges.length, 0);
    const totalAgents = diffs.filter(d => d.agentsChanged).length;
    console.log(`\n요약: phase 변경 ${totalPhase}건 / agentsCompleted 수정 ${totalAgents}개 세션`);
    if (apply) {
        index.lastUpdated = new Date().toISOString();
        writeJson(SESSION_INDEX_PATH, index);
        console.log('\n✓ session_index.json 저장 완료');
    }
    else {
        console.log('\n[dry-run] 저장 안 함 — --apply 로 실행');
    }
}
main();
//# sourceMappingURL=backfill-turns-integrity.js.map