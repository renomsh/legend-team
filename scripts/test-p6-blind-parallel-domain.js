#!/usr/bin/env ts-node
"use strict";
/**
 * test-p6-blind-parallel-domain.ts
 * D-170-A1 P6 — pre-tool-use-task.js blind-parallel domain prepend 검증
 * session_209, topic_176
 *
 * 시나리오:
 *   D1. operationMode 없음 → domain prepend 없음 (기존 동작 무변화)
 *   D2. operationMode='blind-parallel', role=arki → domain 주입 확인
 *   D3. operationMode='blind-parallel', role=riki → domain 주입 확인
 *   D4. operationMode='blind-parallel', role=unknown → 경고 마커 (unknown role)
 *   D5. operationMode='blind-parallel', role=arki, role_domain_template 미존재 → 경고 마커
 *   D6. operationMode='blind-parallel' + gateMarker 동시 → 둘 다 주입
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
const child_process_1 = require("child_process");
const CWD = process.cwd();
const HOOK_PATH = path.join(CWD, '.claude', 'hooks', 'pre-tool-use-task.js');
const KNOWN_ROLES_SRC = path.join(CWD, '.claude', 'hooks', 'lib', 'known-roles.js');
const FIXTURE_BASE = path.join(os.tmpdir(), `p6_test_${Date.now()}`);
// ─── helpers ─────────────────────────────────────────────────
function mkFixture(id) {
    const dir = path.join(FIXTURE_BASE, id);
    fs.mkdirSync(path.join(dir, 'memory', 'sessions'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'memory', 'shared'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'memory', 'roles', 'policies'), { recursive: true });
    fs.mkdirSync(path.join(dir, '.claude', 'hooks', 'lib'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'logs'), { recursive: true });
    // known-roles.js 복사
    if (fs.existsSync(KNOWN_ROLES_SRC)) {
        fs.writeFileSync(path.join(dir, '.claude', 'hooks', 'lib', 'known-roles.js'), fs.readFileSync(KNOWN_ROLES_SRC, 'utf8'));
    }
    else {
        fs.writeFileSync(path.join(dir, '.claude', 'hooks', 'lib', 'known-roles.js'), `module.exports = { KNOWN_ROLES: ['arki','jobs','riki','fin','ace','zero','edi','nova','sage','vera'] };`);
    }
    // _common.md (빈 파일)
    fs.writeFileSync(path.join(dir, 'memory', 'roles', 'policies', '_common.md'), '# 공통 정책\n');
    return dir;
}
function writeSession(dir, sess) {
    fs.writeFileSync(path.join(dir, 'memory', 'sessions', 'current_session.json'), JSON.stringify(sess, null, 2) + '\n');
}
function writeDispatchConfig(dir, config) {
    fs.writeFileSync(path.join(dir, 'memory', 'shared', 'dispatch_config.json'), JSON.stringify(config, null, 2) + '\n');
}
function buildInput(role, cwd) {
    return {
        tool_name: 'Task',
        tool_input: {
            subagent_type: `role-${role}`,
            description: `${role} analysis`,
            prompt: `## ROLE: ${role}\n분석 내용.`,
        },
        cwd,
        session_id: 'test_session',
    };
}
function spawnHook(input) {
    return new Promise((resolve) => {
        const child = (0, child_process_1.spawn)('node', [HOOK_PATH]);
        let stdout = '', stderr = '';
        child.stdin.write(JSON.stringify(input));
        child.stdin.end();
        child.stdout.on('data', (d) => (stdout += d.toString()));
        child.stderr.on('data', (d) => (stderr += d.toString()));
        child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }));
        setTimeout(() => { child.kill(); resolve({ code: 1, stdout: '', stderr: 'timeout' }); }, 8000);
    });
}
function parseOutputPrompt(stdout) {
    try {
        const obj = JSON.parse(stdout);
        return obj?.hookSpecificOutput?.updatedInput?.prompt ?? null;
    }
    catch {
        return null;
    }
}
const results = [];
function assert(name, cond, detail) {
    results.push({ name, pass: cond, detail });
    console.log(`  ${cond ? '✅' : '❌'} ${name}: ${detail}`);
}
const DOMAIN_TEMPLATE = {
    arki: '구조·의존성·게이트',
    riki: '실패 모드·전제 분쇄',
    fin: '자원·재무·비용 안분',
    ace: '구조·흐름 종합 (structured 모드 한정)',
    jobs: '본질·Why·What·Focus',
    edi: '산출물 박제·version_bump 확정·anchor governance',
};
// ─── D1: operationMode 없음 → domain 주입 없음 ────────────────
async function d1() {
    console.log('\n[D1] operationMode 없음 → blind-parallel domain prepend 없음');
    const dir = mkFixture('d1');
    writeSession(dir, { sessionId: 'test_session', topicId: 'topic_test', turns: [] });
    writeDispatchConfig(dir, { role_domain_template: DOMAIN_TEMPLATE });
    const { stdout } = await spawnHook(buildInput('arki', dir));
    const prompt = parseOutputPrompt(stdout);
    assert('D1-no-domain-prepend', !prompt?.includes('blind-parallel 도메인 범위'), `domain prepend present=${prompt?.includes('blind-parallel 도메인 범위')}`);
}
// ─── D2: blind-parallel + arki ────────────────────────────────
async function d2() {
    console.log('\n[D2] operationMode=blind-parallel + role=arki → domain 주입');
    const dir = mkFixture('d2');
    writeSession(dir, { sessionId: 'test_session', topicId: 'topic_test', turns: [], operationMode: 'blind-parallel' });
    writeDispatchConfig(dir, { role_domain_template: DOMAIN_TEMPLATE });
    const { stdout } = await spawnHook(buildInput('arki', dir));
    const prompt = parseOutputPrompt(stdout);
    assert('D2-domain-injected', !!prompt?.includes('blind-parallel 도메인 범위'), `injected=${!!prompt?.includes('blind-parallel 도메인 범위')}`);
    assert('D2-role-marker', !!prompt?.includes('역할: **arki**'), `arki marker=${!!prompt?.includes('역할: **arki**')}`);
    assert('D2-domain-text', !!prompt?.includes('구조·의존성·게이트'), `domain text=${!!prompt?.includes('구조·의존성·게이트')}`);
}
// ─── D3: blind-parallel + riki ────────────────────────────────
async function d3() {
    console.log('\n[D3] operationMode=blind-parallel + role=riki → domain 주입');
    const dir = mkFixture('d3');
    writeSession(dir, { sessionId: 'test_session', topicId: 'topic_test', turns: [], operationMode: 'blind-parallel' });
    writeDispatchConfig(dir, { role_domain_template: DOMAIN_TEMPLATE });
    const { stdout } = await spawnHook(buildInput('riki', dir));
    const prompt = parseOutputPrompt(stdout);
    assert('D3-domain-injected', !!prompt?.includes('blind-parallel 도메인 범위'), `injected=${!!prompt?.includes('blind-parallel 도메인 범위')}`);
    assert('D3-domain-text', !!prompt?.includes('실패 모드·전제 분쇄'), `domain=${!!prompt?.includes('실패 모드·전제 분쇄')}`);
}
// ─── D4: blind-parallel + unknown role → 경고 마커 ───────────
async function d4() {
    console.log('\n[D4] operationMode=blind-parallel + role=unknown → 경고 없음(unknown skip)');
    const dir = mkFixture('d4');
    writeSession(dir, { sessionId: 'test_session', topicId: 'topic_test', turns: [], operationMode: 'blind-parallel' });
    writeDispatchConfig(dir, { role_domain_template: DOMAIN_TEMPLATE });
    // unknown role
    const input = {
        tool_name: 'Task',
        tool_input: { prompt: '역할 마커 없는 프롬프트', description: '' },
        cwd: dir,
        session_id: 'test_session',
    };
    const { stdout } = await spawnHook(input);
    const prompt = parseOutputPrompt(stdout);
    // unknown role → buildBlindParallelDomainMarker가 null 반환 (role=unknown이면 skip)
    assert('D4-no-domain-for-unknown', !prompt?.includes('BLIND_PARALLEL_DOMAIN_UNDEFINED'), `undefined marker=${!!prompt?.includes('BLIND_PARALLEL_DOMAIN_UNDEFINED')}`);
}
// ─── D5: blind-parallel + role 미등록 → UNDEFINED 경고 ────────
async function d5() {
    console.log('\n[D5] operationMode=blind-parallel + role 미등록 → UNDEFINED 경고');
    const dir = mkFixture('d5');
    writeSession(dir, { sessionId: 'test_session', topicId: 'topic_test', turns: [], operationMode: 'blind-parallel' });
    // nova는 role_domain_template에 없음
    writeDispatchConfig(dir, { role_domain_template: DOMAIN_TEMPLATE });
    const { stdout } = await spawnHook(buildInput('nova', dir));
    const prompt = parseOutputPrompt(stdout);
    assert('D5-undefined-warning', !!prompt?.includes('BLIND_PARALLEL_DOMAIN_UNDEFINED'), `undefined marker=${!!prompt?.includes('BLIND_PARALLEL_DOMAIN_UNDEFINED')}`);
}
// ─── D6: transition gate + blind-parallel 동시 → 둘 다 주입 ──
async function d6() {
    console.log('\n[D6] transitionGate + blind-parallel 동시 → 둘 다 주입');
    const dir = mkFixture('d6');
    writeSession(dir, { sessionId: 'test_session', topicId: 'topic_test', turns: [], operationMode: 'blind-parallel' });
    writeDispatchConfig(dir, { role_domain_template: DOMAIN_TEMPLATE });
    // topic_index에 framing + design-approved 토픽 생성 → transition gate 발동
    const topicIndexPath = path.join(dir, 'memory', 'shared', 'topic_index.json');
    fs.writeFileSync(topicIndexPath, JSON.stringify({
        topics: [{ id: 'topic_test', grade: 'A', topicType: 'framing', status: 'design-approved' }]
    }, null, 2));
    const { stdout } = await spawnHook(buildInput('arki', dir));
    const prompt = parseOutputPrompt(stdout);
    assert('D6-transition-gate', !!prompt?.includes('TRANSITION_GATE'), `gate=${!!prompt?.includes('TRANSITION_GATE')}`);
    assert('D6-domain-prepend', !!prompt?.includes('blind-parallel 도메인 범위'), `domain=${!!prompt?.includes('blind-parallel 도메인 범위')}`);
}
// ─── main ─────────────────────────────────────────────────────
async function main() {
    console.log('=== P6 — blind-parallel domain prepend 검증 ===');
    await d1();
    await d2();
    await d3();
    await d4();
    await d5();
    await d6();
    try {
        fs.rmSync(FIXTURE_BASE, { recursive: true, force: true });
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
        console.log('✅ P6 전체 PASS');
        process.exit(0);
    }
}
main().catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=test-p6-blind-parallel-domain.js.map