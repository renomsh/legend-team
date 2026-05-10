#!/usr/bin/env ts-node
"use strict";
/**
 * SPIKE-R6 — PostToolUse(Task) hook race detection
 * topic_176, session_206, 2026-05-07
 *
 * 핵심 질문: Claude Code가 Task 툴을 병렬 호출할 때 PostToolUse hook의
 * read-modify-write가 자연 직렬화되는가, 또는 race가 발생하는가.
 *
 * 본 spike는 hook 자체를 직접 spawn (외부 프로세스로) 하여 동시성 면에서
 * Claude Code 본체가 병렬 spawn 한 케이스의 lower-bound를 시뮬레이트한다.
 * Claude Code가 자연 직렬화한다면 우리 spike에서도 race 미관측이 정상 (negative);
 * race가 우리 spike에서 관측되면 lock 무방비 시 위험 존재 → lock 필수.
 *
 * 사용:
 *   npx ts-node scripts/spike-r6-task-race.ts
 *
 * D2 Prime Directive: 외부 라이브러리 description 신뢰 금지. 본 spike는
 * stdlib(child_process, fs)만 사용하여 hook 동작을 직접 측정.
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
exports.runSpikeR6 = main;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
// ─────── config (하드코딩 회피 — 모두 cwd·env 기반) ───────
const CWD = process.cwd();
const HOOK_PATH = path.join(CWD, '.claude', 'hooks', 'post-tool-use-task.js');
const SESSION_PATH = path.join(CWD, 'memory', 'sessions', 'current_session.json');
const BACKUP_PATH = path.join(CWD, 'memory', 'sessions', 'current_session.spike-backup.json');
const REPORT_DIR = path.join(CWD, 'reports', '2026-05-07_topic_176_spike');
const RESULT_PATH = path.join(REPORT_DIR, 'spike_results.json');
const TIMING_LOG = path.join(REPORT_DIR, 'timing.jsonl');
// ─────── helpers ───────
function readJson(p) {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function writeJson(p, obj) {
    fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}
function ensureDir(p) {
    if (!fs.existsSync(p))
        fs.mkdirSync(p, { recursive: true });
}
function buildHookInput(role, marker) {
    return {
        tool_name: 'Task',
        tool_input: {
            subagent_type: `role-${role}`,
            description: `${role} spike turn ${marker}`,
            prompt: `## ROLE: ${role}\nspike marker ${marker}`,
        },
        tool_response: {
            content: [
                {
                    type: 'text',
                    text: `${role.toUpperCase()}_WRITE_DONE: reports/spike/${role}_rev1.md\n\n[ROLE:${role}]\n# self-scores\nspike_marker: ${marker}\n`,
                },
            ],
        },
        cwd: CWD,
        session_id: 'session_206',
    };
}
function spawnHook(input, env) {
    return new Promise((resolve) => {
        const startMs = Date.now();
        const child = (0, child_process_1.spawn)('node', [HOOK_PATH], {
            cwd: CWD,
            env: { ...process.env, ...env },
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stderr = '';
        child.stderr?.on('data', (d) => (stderr += d.toString()));
        child.on('exit', (code) => {
            resolve({
                pid: child.pid || -1,
                exitCode: code,
                stderr,
                startMs,
                endMs: Date.now(),
            });
        });
        child.stdin?.write(JSON.stringify(input));
        child.stdin?.end();
    });
}
// ─────── 백업/원복 ───────
function backupSession() {
    if (fs.existsSync(SESSION_PATH)) {
        fs.copyFileSync(SESSION_PATH, BACKUP_PATH);
    }
}
function restoreSession() {
    if (fs.existsSync(BACKUP_PATH)) {
        fs.copyFileSync(BACKUP_PATH, SESSION_PATH);
    }
}
function turnsBefore() {
    const sess = readJson(SESSION_PATH);
    return Array.isArray(sess.turns) ? sess.turns.length : 0;
}
function detectDuplicates(turns) {
    const seen = new Map();
    for (const t of turns) {
        if (typeof t.turnIdx === 'number') {
            seen.set(t.turnIdx, (seen.get(t.turnIdx) || 0) + 1);
        }
    }
    return [...seen.entries()].filter(([, c]) => c > 1).map(([k]) => k);
}
function analyzeTimingOverlaps(timingLog) {
    if (!fs.existsSync(timingLog))
        return 0;
    const lines = fs
        .readFileSync(timingLog, 'utf8')
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => JSON.parse(l));
    // pid별로 read-before와 write-after 시점 수집
    const intervals = [];
    const byPid = new Map();
    for (const e of lines) {
        if (!byPid.has(e.pid))
            byPid.set(e.pid, {});
        const slot = byPid.get(e.pid);
        if (e.phase === 'turns-read-before')
            slot.read = BigInt(e.ts);
        if (e.phase === 'turns-write-after')
            slot.write = BigInt(e.ts);
    }
    for (const [pid, slot] of byPid) {
        if (slot.read && slot.write) {
            intervals.push({ pid, readNs: slot.read, writeNs: slot.write });
        }
    }
    // 모든 쌍에 대해 read-write 구간 겹침 검사
    let overlaps = 0;
    for (let i = 0; i < intervals.length; i++) {
        for (let j = i + 1; j < intervals.length; j++) {
            const a = intervals[i];
            const b = intervals[j];
            const overlap = a.readNs <= b.writeNs && b.readNs <= a.writeNs;
            if (overlap)
                overlaps++;
        }
    }
    return overlaps;
}
async function runScenario(id, description, concurrent, options = {}) {
    // 시나리오 시작 시 timing log truncate (시나리오별 격리)
    if (fs.existsSync(TIMING_LOG))
        fs.unlinkSync(TIMING_LOG);
    const before = turnsBefore();
    const startMs = Date.now();
    const inputs = Array.from({ length: concurrent }, (_, i) => buildHookInput('dev', `${id}_${i}`));
    // Promise.all로 동시 spawn — 같은 tick에서 child_process spawn 호출
    const promiseAll = Promise.all(inputs.map((inp) => spawnHook(inp, { SPIKE_R6_LOG: TIMING_LOG })));
    // S5: 외부 프로세스가 동시에 session 파일에 write 시도 (외부 충돌)
    let externalWritePromise = null;
    if (options.externalWriteDuringRun) {
        externalWritePromise = (async () => {
            // 외부 write: 짧게 file touch (스키마 보존)
            for (let i = 0; i < 20; i++) {
                try {
                    const sess = readJson(SESSION_PATH);
                    sess._spikeS5Touch = Date.now();
                    writeJson(SESSION_PATH, sess);
                }
                catch { }
                await new Promise((r) => setTimeout(r, 5));
            }
        })();
    }
    const spawnResults = await promiseAll;
    if (externalWritePromise)
        await externalWritePromise;
    const endMs = Date.now();
    const after = readJson(SESSION_PATH);
    const turns = Array.isArray(after.turns) ? after.turns : [];
    // 외부 touch 필드 제거
    if (after._spikeS5Touch !== undefined) {
        delete after._spikeS5Touch;
        writeJson(SESSION_PATH, after);
    }
    const observedDelta = turns.length - before;
    const expectedDelta = concurrent;
    const lostWrites = expectedDelta - observedDelta;
    const duplicateTurnIdx = detectDuplicates(turns);
    const timingOverlaps = analyzeTimingOverlaps(TIMING_LOG);
    const raceReason = [];
    if (lostWrites > 0)
        raceReason.push(`lost_writes=${lostWrites}`);
    if (duplicateTurnIdx.length > 0)
        raceReason.push(`duplicate_turnIdx=[${duplicateTurnIdx.join(',')}]`);
    if (timingOverlaps > 0)
        raceReason.push(`timing_overlap_pairs=${timingOverlaps}`);
    return {
        id,
        description,
        concurrent,
        expectedDelta,
        observedDelta,
        duplicateTurnIdx,
        lostWrites,
        raceDetected: raceReason.length > 0,
        raceReason,
        durationMs: endMs - startMs,
        timingOverlaps,
        spawnResults,
    };
}
// ─────── 메인 ───────
async function main() {
    ensureDir(REPORT_DIR);
    console.log(`[spike-r6] 시작 cwd=${CWD}`);
    console.log(`[spike-r6] hook=${HOOK_PATH}`);
    if (!fs.existsSync(HOOK_PATH)) {
        console.error(`[spike-r6] FATAL: hook not found at ${HOOK_PATH}`);
        process.exit(1);
    }
    if (!fs.existsSync(SESSION_PATH)) {
        console.error(`[spike-r6] FATAL: session not found at ${SESSION_PATH}`);
        process.exit(1);
    }
    backupSession();
    console.log(`[spike-r6] 백업 완료 → ${BACKUP_PATH}`);
    const results = [];
    try {
        // S1: 2개 동시
        console.log('[S1] Task 2개 동시 dispatch');
        results.push(await runScenario('S1', 'Task 2개 동시 dispatch', 2));
        restoreSession();
        // S2: 5개 동시
        console.log('[S2] Task 5개 동시 dispatch');
        results.push(await runScenario('S2', 'Task 5개 동시 dispatch', 5));
        restoreSession();
        // S3: hook chain 간섭 — finalize 직접 spawn은 무거우므로
        // session-end-tokens 등 다른 hook을 SIGINT 가능 시간 안에 함께 spawn
        // 단, 본 spike는 turns push hook 자체의 안전성에 집중 → 같은 hook 다회 동시
        // (S2와 의미 중복 회피 위해 S3는 "hook이 진행 중일 때 추가 hook 도착"
        // 계단식 케이스로 변형)
        console.log('[S3] 계단식: 100ms 간격 5회 (hook 진행 중 추가 도착)');
        results.push(await runScenarioStaggered('S3', '계단식 5회 (100ms 간격)', 5, 100));
        restoreSession();
        // S4: 의도적 race — Promise.all 10개 high concurrency
        console.log('[S4] 적대적: 10개 동시 dispatch');
        results.push(await runScenario('S4', '적대적 10개 동시 dispatch', 10));
        restoreSession();
        // S5: 외부 write와 동시
        console.log('[S5] 외부 프로세스 write 중 hook 5개 dispatch');
        results.push(await runScenario('S5', 'hook 5개 + 외부 write 병렬', 5, {
            externalWriteDuringRun: true,
        }));
        restoreSession();
    }
    finally {
        restoreSession();
        console.log(`[spike-r6] 원복 완료`);
    }
    // 종합
    const positives = results.filter((r) => r.raceDetected);
    const verdict = positives.length === 0
        ? 'NEGATIVE — race 미관측. lock 불요 가능성 시사 (단 직접 spawn 측정 한계 명시)'
        : `POSITIVE — ${positives.length}/${results.length} 시나리오에서 race 관측. lock 필요`;
    const summary = {
        spike: 'R-6 PostToolUse(Task) race detection',
        topic: 'topic_176',
        session: 'session_206',
        runAt: new Date().toISOString(),
        cwd: CWD,
        hookPath: HOOK_PATH,
        scenarios: results,
        verdict,
        positiveCount: positives.length,
        totalCount: results.length,
        note: [
            '본 spike는 외부 child_process spawn으로 hook 다회 동시 호출 시뮬레이트.',
            'Claude Code 본체가 PostToolUse hook spawn을 자연 직렬화한다면 운영 환경에선 race 0.',
            '본 spike에서 race 관측 시: 동시성이 가능해질 때(향후 변경·외부 트리거) 즉시 위험.',
            '본 spike에서 race 미관측 시: 운영 환경에서 충분 가능성, 다만 OS 스케줄러 영향 여지 잔존.',
        ],
    };
    writeJson(RESULT_PATH, summary);
    console.log(`\n[spike-r6] 결과 → ${RESULT_PATH}`);
    console.log(`[spike-r6] verdict: ${verdict}\n`);
    for (const r of results) {
        console.log(`  ${r.id}: race=${r.raceDetected} | expected=${r.expectedDelta} observed=${r.observedDelta} dup=${r.duplicateTurnIdx.length} overlaps=${r.timingOverlaps}${r.raceReason.length ? ' | ' + r.raceReason.join(',') : ''}`);
    }
}
async function runScenarioStaggered(id, description, concurrent, intervalMs) {
    if (fs.existsSync(TIMING_LOG))
        fs.unlinkSync(TIMING_LOG);
    const before = turnsBefore();
    const startMs = Date.now();
    const inputs = Array.from({ length: concurrent }, (_, i) => buildHookInput('dev', `${id}_${i}`));
    const promises = [];
    for (let i = 0; i < concurrent; i++) {
        promises.push(spawnHook(inputs[i], { SPIKE_R6_LOG: TIMING_LOG }));
        if (i < concurrent - 1)
            await new Promise((r) => setTimeout(r, intervalMs));
    }
    const spawnResults = await Promise.all(promises);
    const endMs = Date.now();
    const after = readJson(SESSION_PATH);
    const turns = Array.isArray(after.turns) ? after.turns : [];
    const observedDelta = turns.length - before;
    const lostWrites = concurrent - observedDelta;
    const duplicateTurnIdx = detectDuplicates(turns);
    const timingOverlaps = analyzeTimingOverlaps(TIMING_LOG);
    const raceReason = [];
    if (lostWrites > 0)
        raceReason.push(`lost_writes=${lostWrites}`);
    if (duplicateTurnIdx.length > 0)
        raceReason.push(`duplicate_turnIdx=[${duplicateTurnIdx.join(',')}]`);
    if (timingOverlaps > 0)
        raceReason.push(`timing_overlap_pairs=${timingOverlaps}`);
    return {
        id,
        description,
        concurrent,
        expectedDelta: concurrent,
        observedDelta,
        duplicateTurnIdx,
        lostWrites,
        raceDetected: raceReason.length > 0,
        raceReason,
        durationMs: endMs - startMs,
        timingOverlaps,
        spawnResults,
    };
}
if (require.main === module) {
    main().catch((e) => {
        console.error('[spike-r6] FATAL', e);
        process.exit(1);
    });
}
//# sourceMappingURL=spike-r6-task-race.js.map