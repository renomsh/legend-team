#!/usr/bin/env ts-node
"use strict";
/**
 * test-p4-nexus-push.ts
 * D-169 P4 smoke test — Nexus 직접 turns[] push 흐름 검증
 * session_209, topic_176
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
const FIXTURE_DIR = path.join(os.tmpdir(), `p4_smoke_${Date.now()}`);
function setup(sess) {
    fs.mkdirSync(path.join(FIXTURE_DIR, 'memory', 'sessions', 'pending_turns_archive'), { recursive: true });
    const sessionPath = path.join(FIXTURE_DIR, 'memory', 'sessions', 'current_session.json');
    fs.writeFileSync(sessionPath, JSON.stringify(sess, null, 2));
    const pendingPath = path.join(FIXTURE_DIR, 'memory', 'sessions', 'pending_turns_test_session.jsonl');
    if (fs.existsSync(pendingPath))
        fs.unlinkSync(pendingPath);
    return { sessionPath, pendingPath };
}
function writePending(pendingPath, entries) {
    fs.writeFileSync(pendingPath, entries.map(e => JSON.stringify(e)).join('\n') + '\n');
}
const results = [];
function assert(name, cond, detail) {
    results.push({ name, pass: cond, detail });
    console.log(`  ${cond ? '✅' : '❌'} ${name}: ${detail}`);
}
// ──────────────────────────────────────────────────────────
// S1: N=3 병렬 dispatch_order 정렬 + selfScores 보존
// ──────────────────────────────────────────────────────────
async function s1() {
    console.log('\n[S1] N=3 병렬 dispatch_order 정렬 + selfScores 보존');
    const { sessionPath, pendingPath } = setup({ sessionId: 'test_session', turns: [], gaps: [] });
    writePending(pendingPath, [
        { ts: new Date().toISOString(), sessionId: 'test_session', agentId: 'a001', role: 'arki', selfScores: { str_fd: 5, spc_lck: 'Y' }, __hook_origin: 'post-tool-use-task' },
        { ts: new Date().toISOString(), sessionId: 'test_session', agentId: 'a002', role: 'jobs', selfScores: { focus_sharp: 4 }, __hook_origin: 'post-tool-use-task' },
        { ts: new Date().toISOString(), sessionId: 'test_session', agentId: 'a003', role: 'riki', selfScores: { crt_rcl: 0.9 }, __hook_origin: 'post-tool-use-task' },
    ]);
    // dispatch 순서와 다른 agentId 도착 순서 시뮬 (역순)
    const dispatches = [
        { role: 'riki', dispatchOrder: 2, agentId: 'a003' },
        { role: 'arki', dispatchOrder: 0, agentId: 'a001' },
        { role: 'jobs', dispatchOrder: 1, agentId: 'a002' },
    ];
    const { pushed, gaps, pendingArchived } = await (0, nexus_turn_push_1.pushTurnsFromPending)(dispatches, sessionPath, FIXTURE_DIR);
    const sess = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert('S1-count', pushed.length === 3, `pushed=${pushed.length}`);
    assert('S1-order-arki-first', sess.turns[0]?.role === 'arki', `turns[0].role=${sess.turns[0]?.role}`);
    assert('S1-order-jobs-second', sess.turns[1]?.role === 'jobs', `turns[1].role=${sess.turns[1]?.role}`);
    assert('S1-order-riki-third', sess.turns[2]?.role === 'riki', `turns[2].role=${sess.turns[2]?.role}`);
    assert('S1-turnIdx-sequential', sess.turns[2]?.turnIdx === 2, `turns[2].turnIdx=${sess.turns[2]?.turnIdx}`);
    assert('S1-selfScores', sess.turns[0]?.selfScores?.spc_lck === 'Y', `spc_lck=${sess.turns[0]?.selfScores?.spc_lck}`);
    assert('S1-sort_key', sess.turns[0]?.sort_key === 0 && sess.turns[2]?.sort_key === 2, `sort_keys=${sess.turns.map((t) => t.sort_key).join(',')}`);
    assert('S1-no-gaps', gaps.length === 0, `gaps=${gaps.length}`);
    assert('S1-archived', pendingArchived, `archived=${pendingArchived}`);
}
// ──────────────────────────────────────────────────────────
// S2: __hook_origin 검증 실패 → gap 박제 + optionB fallback
// ──────────────────────────────────────────────────────────
async function s2() {
    console.log('\n[S2] __hook_origin 위변조 → gap + optionB fallback');
    const { sessionPath, pendingPath } = setup({ sessionId: 'test_session', turns: [], gaps: [] });
    writePending(pendingPath, [
        { ts: new Date().toISOString(), sessionId: 'test_session', agentId: 'b001', role: 'ace',
            selfScores: { fake: 99 }, __hook_origin: 'INJECTED' }, // 위변조
    ]);
    const dispatches = [
        { role: 'ace', dispatchOrder: 0, agentId: 'b001', toolResult: {
                content: [{ type: 'text', text: '[ROLE:ace]\n# self-scores\nrfrm_trg: Y\nctx_car: 5' }]
            } },
    ];
    const { pushed, gaps } = await (0, nexus_turn_push_1.pushTurnsFromPending)(dispatches, sessionPath, FIXTURE_DIR);
    const sess = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert('S2-gap-injected', gaps.some(g => g.kind === 'hook-origin-invalid'), `gaps=${JSON.stringify(gaps.map(g => g.kind))}`);
    assert('S2-fallback-scores', sess.turns[0]?.selfScores?.rfrm_trg === 'Y', `rfrm_trg=${sess.turns[0]?.selfScores?.rfrm_trg}`);
    assert('S2-fake-not-used', sess.turns[0]?.selfScores?.fake !== 99, `fake=${sess.turns[0]?.selfScores?.fake}`);
}
// ──────────────────────────────────────────────────────────
// S3: pending_turns 없음 → optionB fallback
// ──────────────────────────────────────────────────────────
async function s3() {
    console.log('\n[S3] pending_turns 없음 → optionB fallback selfScores');
    const { sessionPath } = setup({ sessionId: 'test_session', turns: [], gaps: [] });
    // pendingPath 미생성
    const dispatches = [
        { role: 'fin', dispatchOrder: 0, agentId: 'c001', toolResult: {
                agentId: 'c001',
                content: [{ type: 'text', text: '[ROLE:fin]\n# self-scores\ncst_acc: Y\nroi_dir: 4' }]
            } },
    ];
    const { pushed, gaps } = await (0, nexus_turn_push_1.pushTurnsFromPending)(dispatches, sessionPath, FIXTURE_DIR);
    const sess = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert('S3-pushed', pushed.length === 1, `pushed=${pushed.length}`);
    assert('S3-fallback-scores', sess.turns[0]?.selfScores?.cst_acc === 'Y', `cst_acc=${sess.turns[0]?.selfScores?.cst_acc}`);
    assert('S3-gap-missing', gaps.some(g => g.kind === 'nexus-push-missing'), `gaps=${JSON.stringify(gaps.map(g => g.kind))}`);
}
// ──────────────────────────────────────────────────────────
// S4: extractSelfScoresFromContent 독립 테스트
// ──────────────────────────────────────────────────────────
function s4() {
    console.log('\n[S4] extractSelfScoresFromContent 단위 테스트');
    const content = [{ type: 'text', text: '[ROLE:zero]\n본문...\n\n# self-scores\nref_cnt: 5\nhc_found: 0\ncln_rt: 1\n' }];
    const scores = (0, nexus_turn_push_1.extractSelfScoresFromContent)(content);
    assert('S4-ref_cnt', scores?.ref_cnt === 5, `ref_cnt=${scores?.ref_cnt}`);
    assert('S4-hc_found', scores?.hc_found === 0, `hc_found=${scores?.hc_found}`);
    assert('S4-cln_rt', scores?.cln_rt === 1, `cln_rt=${scores?.cln_rt}`);
    const noScores = (0, nexus_turn_push_1.extractSelfScoresFromContent)([{ type: 'text', text: '발언만 있고 self-scores 없음' }]);
    assert('S4-null-when-missing', noScores === null, `result=${noScores}`);
}
// ──────────────────────────────────────────────────────────
async function main() {
    console.log('=== P4 Smoke Test — Nexus Turn Push 흐름 검증 ===');
    await s1();
    await s2();
    await s3();
    s4();
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
        console.log('✅ 전체 PASS');
        process.exit(0);
    }
}
main().catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=test-p4-nexus-push.js.map