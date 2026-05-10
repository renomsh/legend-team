#!/usr/bin/env ts-node
"use strict";
/**
 * test-gate-beta-race.ts
 * D-169 GATE β — race 0 검증
 * session_209, topic_176
 *
 * 검증 항목:
 *   B1. N=10 병렬 appendFileSync (hook race 시뮬) → 10줄, 0 corruption
 *   B2. pushTurnsFromPending N=10 → turns[] 10건, turnIdx 순서 정합
 *   B3. 중복 turnIdx 없음
 *   B4. sort_key=dispatch_order 매핑 정합 (0~9 전부 존재)
 *   B5. selfScores 보존율 — agentId 매칭 시 pending entry 우선
 *   B6. 적대적: 일부 agentId=null → optionB fallback gap 박제
 *   B7. pending_turns archive 완료 후 파일 존재 확인
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
const os = __importStar(require("os"));
const nexus_turn_push_1 = require("./lib/nexus-turn-push");
const FIXTURE_DIR = path.join(os.tmpdir(), `gate_beta_${Date.now()}`);
const N = 10;
const ROLES = ['arki', 'jobs', 'riki', 'fin', 'ace', 'zero', 'edi', 'nova', 'sage', 'vera'];
// ─── helpers ─────────────────────────────────────────────────
function setup() {
    fs.mkdirSync(path.join(FIXTURE_DIR, 'memory', 'sessions', 'pending_turns_archive'), { recursive: true });
    const sessionPath = path.join(FIXTURE_DIR, 'memory', 'sessions', 'current_session.json');
    fs.writeFileSync(sessionPath, JSON.stringify({ sessionId: 'gate_session', turns: [], gaps: [] }, null, 2));
    const pendingPath = path.join(FIXTURE_DIR, 'memory', 'sessions', 'pending_turns_gate_session.jsonl');
    return { sessionPath, pendingPath };
}
const results = [];
function assert(name, cond, detail) {
    results.push({ name, pass: cond, detail });
    console.log(`  ${cond ? '✅' : '❌'} ${name}: ${detail}`);
}
// ─── B1: N=10 병렬 hook append ────────────────────────────────
async function b1(pendingPath) {
    console.log('\n[B1] N=10 병렬 appendFileSync (hook race 시뮬)');
    const agentIds = Array.from({ length: N }, (_, i) => `agent_${i.toString().padStart(3, '0')}`);
    // 실제 hook과 동일: 각 process가 동시에 appendFileSync
    await Promise.all(ROLES.map((role, i) => {
        return new Promise((resolve) => {
            const entry = {
                ts: new Date().toISOString(),
                sessionId: 'gate_session',
                agentId: agentIds[i],
                role,
                selfScores: { [`score_${role}`]: i + 1, origin_check: 'Y' },
                __hook_origin: 'post-tool-use-task',
            };
            // appendFileSync는 원자적 — race 조건에서도 줄 단위 보존
            fs.appendFileSync(pendingPath, JSON.stringify(entry) + '\n', 'utf8');
            resolve();
        });
    }));
    // 검증
    const raw = fs.readFileSync(pendingPath, 'utf8');
    const lines = raw.split('\n').filter(l => l.trim());
    let corrupt = 0;
    const parsedAgentIds = [];
    for (const line of lines) {
        try {
            const e = JSON.parse(line);
            parsedAgentIds.push(e.agentId);
        }
        catch {
            corrupt++;
        }
    }
    assert('B1-line-count', lines.length === N, `lines=${lines.length}/${N}`);
    assert('B1-no-corruption', corrupt === 0, `corrupt=${corrupt}`);
    assert('B1-all-agentIds', parsedAgentIds.length === N, `parsed=${parsedAgentIds.length}/${N}`);
}
// ─── B2~B7: pushTurnsFromPending N=10 ────────────────────────
async function b2_b7(sessionPath, pendingPath) {
    console.log('\n[B2~B7] pushTurnsFromPending N=10 turns[] 정합 검증');
    // N=10 dispatches — agentId 중 2개는 null (적대적 케이스 포함)
    const agentIds = Array.from({ length: N }, (_, i) => i === 3 || i === 7 ? null : `agent_${i.toString().padStart(3, '0')}`);
    const dispatches = ROLES.map((role, i) => ({
        role,
        dispatchOrder: i,
        agentId: agentIds[i],
        toolResult: {
            agentId: agentIds[i],
            content: [{ type: 'text', text: `[ROLE:${role}]\n본문.\n\n# self-scores\nfallback_score: ${i}\nfb_ok: Y\n` }],
        },
    }));
    const { pushed, gaps, pendingArchived } = await (0, nexus_turn_push_1.pushTurnsFromPending)(dispatches, sessionPath, FIXTURE_DIR);
    const sess = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    // B2: turns[] 10건
    assert('B2-turns-count', sess.turns.length === N, `turns.length=${sess.turns.length}/${N}`);
    assert('B2-pushed-count', pushed.length === N, `pushed.length=${pushed.length}/${N}`);
    // B3: 중복 turnIdx 없음
    const turnIdxSet = new Set(sess.turns.map((t) => t.turnIdx));
    assert('B3-no-dup-turnIdx', turnIdxSet.size === N, `unique turnIdx=${turnIdxSet.size}/${N}`);
    // B4: sort_key 0~9 전부 존재, 순서 정렬됨
    const sortKeys = sess.turns.map((t) => t.sort_key);
    const sortKeysExpected = Array.from({ length: N }, (_, i) => i);
    const sortKeyMatch = sortKeys.every((sk, i) => sk === i);
    assert('B4-sort_key-all', sortKeys.length === N && sortKeyMatch, `sort_keys=${sortKeys.join(',')}`);
    // B5: selfScores 보존 — agentId 매칭된 것들 (i≠3,7)은 pending entry scores 사용
    const matchedTurns = sess.turns.filter((_, i) => i !== 3 && i !== 7);
    const selfScoresOk = matchedTurns.every((t) => t.selfScores && t.selfScores.origin_check === 'Y');
    assert('B5-selfScores-from-pending', selfScoresOk, `matched turns with origin_check=Y: ${matchedTurns.filter((t) => t.selfScores?.origin_check === 'Y').length}/${matchedTurns.length}`);
    // B6: agentId=null 케이스 (i=3,7) → nexus-push-missing gap + optionB fallback
    const missingGaps = gaps.filter(g => g.kind === 'nexus-push-missing');
    assert('B6-null-agentId-gaps', missingGaps.length === 2, `nexus-push-missing gaps=${missingGaps.length} (expected 2)`);
    // 해당 turns는 optionB fallback scores 사용
    const nullAgentTurns = [sess.turns[3], sess.turns[7]];
    const fallbackOk = nullAgentTurns.every((t) => t.selfScores && t.selfScores.fb_ok === 'Y');
    assert('B6-optionB-fallback', fallbackOk, `fallback turns fb_ok=Y: ${nullAgentTurns.filter((t) => t.selfScores?.fb_ok === 'Y').length}/2`);
    // B7: archive 완료
    assert('B7-archived', pendingArchived, `pendingArchived=${pendingArchived}`);
    assert('B7-pending-removed', !fs.existsSync(pendingPath), `pending still exists=${fs.existsSync(pendingPath)}`);
    const archivePath = path.join(FIXTURE_DIR, 'memory', 'sessions', 'pending_turns_archive', path.basename(pendingPath));
    assert('B7-archive-file-exists', fs.existsSync(archivePath), `archivePath exists=${fs.existsSync(archivePath)}`);
}
// ─── main ─────────────────────────────────────────────────────
async function main() {
    console.log('=== GATE β — race 0 검증 (N=10 병렬 dispatch + turns[] 정합) ===');
    const { sessionPath, pendingPath } = setup();
    await b1(pendingPath);
    await b2_b7(sessionPath, pendingPath);
    try {
        fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
    }
    catch { }
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    console.log(`\n=== 결과: ${passed}/${results.length} PASS, ${failed} FAIL ===`);
    if (failed > 0) {
        results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.name}: ${r.detail}`));
        process.exit(1);
    }
    else {
        console.log('✅ GATE β PASS');
        process.exit(0);
    }
}
main().catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=test-gate-beta-race.js.map