/**
 * tests/fixtures/hook/pre-tool-use-task-fire.test.ts
 * pre-tool-use-task.js v3 단위 테스트 (topic_127 P2 G2 게이트)
 *
 * 테스트 3건:
 *   Test 1 — persona inject 정상 작동 (buildPersonaLayer 3층 concat)
 *   Test 2 — persona 절삭 금지 (PERSONA_OVER_CAP 마커)
 *   Test 3 — transition gate 미발동 (Grade C 토픽)
 *
 * 실행: npx ts-node tests/fixtures/hook/pre-tool-use-task-fire.test.ts
 *
 * 격리 전략:
 *   - os.tmpdir()에 임시 cwd 생성
 *   - mock 파일 작성 후 hook을 child_process.spawnSync로 stdin 주입 실행
 *   - stdout JSON 파싱으로 mutatedPrompt 검증
 *   - 완료 후 임시 디렉토리 cleanup
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawnSync } from 'child_process';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const HOOK_PATH = path.join(PROJECT_ROOT, '.claude', 'hooks', 'pre-tool-use-task.js');

type TestResult = { id: string; name: string; pass: boolean; reason?: string };
const results: TestResult[] = [];

function record(id: string, name: string, pass: boolean, reason?: string) {
  const r: TestResult = { id, name, pass };
  if (typeof reason === 'string') r.reason = reason;
  results.push(r);
  const tag = pass ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${id} ${name}${reason ? ' — ' + reason : ''}`);
}

function makeTmpCwd(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `hook-${prefix}-`));
  fs.mkdirSync(path.join(dir, 'memory', 'roles', 'policies'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'memory', 'roles', 'personas'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'memory', 'sessions'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'memory', 'shared'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'logs'), { recursive: true });
  return dir;
}

function writeFile(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}

function writeJson(p: string, obj: unknown) {
  writeFile(p, JSON.stringify(obj, null, 2) + '\n');
}

function runHook(cwd: string, toolInput: Record<string, unknown>): { stdout: string; stderr: string; status: number | null } {
  const stdinPayload = JSON.stringify({
    cwd,
    tool_name: 'Task',
    tool_input: toolInput,
  });

  const result = spawnSync('node', [HOOK_PATH], {
    input: stdinPayload,
    encoding: 'utf8',
    timeout: 10000,
  });

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
  };
}

function parseMutatedPrompt(stdout: string): string | null {
  try {
    const output = JSON.parse(stdout);
    return output?.hookSpecificOutput?.updatedInput?.prompt ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1 — persona inject 정상 작동
// ─────────────────────────────────────────────────────────────────────────────
function test1_personaInjectNormal(): void {
  const id = 'T-P2-01';
  const name = 'persona inject 정상 작동 (buildPersonaLayer 3층 concat)';
  const cwd = makeTmpCwd('t1');

  try {
    // mock 파일 작성 (3층)
    writeFile(path.join(cwd, 'memory', 'roles', 'policies', '_common.md'), '## COMMON_POLICY\n공통 정책 내용 mock');
    writeFile(path.join(cwd, 'memory', 'roles', 'policies', 'role-arki.md'), '## ARKI_POLICY\nArki 역할 정책 mock');
    writeFile(path.join(cwd, 'memory', 'roles', 'personas', 'role-arki.md'), '## ARKI_PERSONA\nArki 페르소나 mock — 톤 잔존');

    // current_session.json (최소)
    writeJson(path.join(cwd, 'memory', 'sessions', 'current_session.json'), {
      sessionId: 'session_test_001',
      topicId: null,
      turns: [],
      reportPath: null,
    });

    const result = runHook(cwd, {
      prompt: '## ROLE: arki\n\n테스트 프롬프트입니다.',
      description: 'arki test',
    });

    const mutated = parseMutatedPrompt(result.stdout);

    if (!mutated) {
      record(id, name, false, `stdout 파싱 실패: ${result.stdout.slice(0, 200)}`);
      return;
    }

    const hasCommon = mutated.includes('COMMON_POLICY');
    const hasPolicy = mutated.includes('ARKI_POLICY');
    const hasPersona = mutated.includes('ARKI_PERSONA');
    const hasMarker = mutated.includes('[PRE-TOOL-USE-TASK-INJECTED]');

    if (!hasCommon || !hasPolicy || !hasPersona || !hasMarker) {
      record(id, name, false,
        `3층 누락: common=${hasCommon} policy=${hasPolicy} persona=${hasPersona} marker=${hasMarker}`);
      return;
    }

    // 순서 검증: _common → policy → persona (index 순서)
    const commonIdx = mutated.indexOf('COMMON_POLICY');
    const policyIdx = mutated.indexOf('ARKI_POLICY');
    const personaIdx = mutated.indexOf('ARKI_PERSONA');

    if (!(commonIdx < policyIdx && policyIdx < personaIdx)) {
      record(id, name, false, `layer 순서 불일치: common=${commonIdx} policy=${policyIdx} persona=${personaIdx}`);
      return;
    }

    record(id, name, true, '3층 concat + 순서 정합');
  } catch (err: any) {
    record(id, name, false, `예외: ${err?.message}`);
  } finally {
    try { fs.rmSync(cwd, { recursive: true, force: true }); } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 2 — persona 절삭 금지 (PERSONA_OVER_CAP 마커)
// ─────────────────────────────────────────────────────────────────────────────
function test2_personaOverCap(): void {
  const id = 'T-P2-02';
  const name = 'persona 절삭 금지 — PERSONA_OVER_CAP 마커 검증';
  const cwd = makeTmpCwd('t2');

  try {
    // 큰 _common.md — TOTAL_CAP_CHARS(80000) 초과 유도
    // v3 hook의 TOTAL_CAP_CHARS = 80000이므로, 100KB 이상 콘텐츠 주입
    const bigContent = 'X'.repeat(90000);
    writeFile(path.join(cwd, 'memory', 'roles', 'policies', '_common.md'), `## COMMON_POLICY\n${bigContent}`);
    writeFile(path.join(cwd, 'memory', 'roles', 'policies', 'role-arki.md'), '## ARKI_POLICY\nmock');
    writeFile(path.join(cwd, 'memory', 'roles', 'personas', 'role-arki.md'), '## ARKI_PERSONA\nmock persona');

    writeJson(path.join(cwd, 'memory', 'sessions', 'current_session.json'), {
      sessionId: 'session_test_002',
      topicId: null,
      turns: [],
      reportPath: null,
    });

    const result = runHook(cwd, {
      prompt: '## ROLE: arki\n\n큰 콘텐츠 테스트',
      description: 'arki big content test',
    });

    const mutated = parseMutatedPrompt(result.stdout);

    if (!mutated) {
      record(id, name, false, `stdout 파싱 실패: ${result.stdout.slice(0, 200)}`);
      return;
    }

    // PERSONA_OVER_CAP 마커 존재 검증
    const hasOverCap = mutated.includes('PERSONA_OVER_CAP');
    // persona 내용은 있어야 함 (절삭 금지)
    const hasPersona = mutated.includes('ARKI_PERSONA');
    // COMMON_POLICY 내용(90KB)도 존재 (절삭 불가)
    const hasCommon = mutated.includes('COMMON_POLICY');

    if (!hasOverCap) {
      record(id, name, false, `PERSONA_OVER_CAP 마커 없음. mutated 길이: ${mutated.length}`);
      return;
    }

    if (!hasPersona) {
      record(id, name, false, `persona 내용 절삭됨 (절삭 금지 위반)`);
      return;
    }

    record(id, name, true, `PERSONA_OVER_CAP 마커 확인, persona 보존, 총 길이 ${mutated.length}`);
  } catch (err: any) {
    record(id, name, false, `예외: ${err?.message}`);
  } finally {
    try { fs.rmSync(cwd, { recursive: true, force: true }); } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 3 — transition gate 미발동 (Grade C 토픽)
// ─────────────────────────────────────────────────────────────────────────────
function test3_gateNotFiredForGradeC(): void {
  const id = 'T-P2-03';
  const name = 'transition gate 미발동 (Grade C 토픽 — D-G 정합)';
  const cwd = makeTmpCwd('t3');

  try {
    // Grade C 토픽 등록
    writeJson(path.join(cwd, 'memory', 'shared', 'topic_index.json'), {
      topics: [
        {
          id: 'topic_test',
          title: '테스트 토픽 C grade',
          status: 'open',
          grade: 'C',
          topicType: 'framing',
        },
      ],
    });

    // persona 파일 (최소)
    writeFile(path.join(cwd, 'memory', 'roles', 'policies', '_common.md'), '## COMMON\nmock');
    writeFile(path.join(cwd, 'memory', 'roles', 'personas', 'role-dev.md'), '## DEV_PERSONA\nmock');

    // current_session.json — topicId = topic_test
    writeJson(path.join(cwd, 'memory', 'sessions', 'current_session.json'), {
      sessionId: 'session_test_003',
      topicId: 'topic_test',
      turns: [],
      reportPath: null,
    });

    const result = runHook(cwd, {
      prompt: '## ROLE: dev\n\nGrade C 테스트',
      description: 'dev grade c test',
    });

    const mutated = parseMutatedPrompt(result.stdout);

    if (!mutated) {
      record(id, name, false, `stdout 파싱 실패: ${result.stdout.slice(0, 200)}`);
      return;
    }

    // TRANSITION_GATE 마커가 없어야 함 (C grade는 optional — D-G)
    const hasGate = mutated.includes('TRANSITION_GATE');

    if (hasGate) {
      record(id, name, false, `Grade C에 TRANSITION_GATE 마커 발동됨 (D-G 위반)`);
      return;
    }

    // 기본 inject는 정상 작동 확인
    const hasMarker = mutated.includes('[PRE-TOOL-USE-TASK-INJECTED]');
    if (!hasMarker) {
      record(id, name, false, 'INJECTION_MARKER 없음');
      return;
    }

    record(id, name, true, 'Grade C → TRANSITION_GATE 미발동, 기본 inject 정상');
  } catch (err: any) {
    record(id, name, false, `예외: ${err?.message}`);
  } finally {
    try { fs.rmSync(cwd, { recursive: true, force: true }); } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 추가: transition gate 발동 (Grade A framing, design-approved 상태)
// ─────────────────────────────────────────────────────────────────────────────
function test4_gateFiredForGradeA(): void {
  const id = 'T-P2-04';
  const name = 'transition gate 발동 (Grade A framing, design-approved 상태 — D-G 정합)';
  const cwd = makeTmpCwd('t4');

  try {
    // Grade A framing 토픽, design-approved 상태
    writeJson(path.join(cwd, 'memory', 'shared', 'topic_index.json'), {
      topics: [
        {
          id: 'topic_gate_test',
          title: '게이트 발동 테스트 토픽',
          status: 'design-approved',
          grade: 'A',
          topicType: 'framing',
        },
      ],
    });

    writeFile(path.join(cwd, 'memory', 'roles', 'policies', '_common.md'), '## COMMON\nmock');
    writeFile(path.join(cwd, 'memory', 'roles', 'personas', 'role-ace.md'), '## ACE_PERSONA\nmock');

    writeJson(path.join(cwd, 'memory', 'sessions', 'current_session.json'), {
      sessionId: 'session_test_004',
      topicId: 'topic_gate_test',
      turns: [],
      reportPath: null,
    });

    const result = runHook(cwd, {
      prompt: '## ROLE: ace\n\nGrade A gate test',
      description: 'ace grade a gate test',
    });

    const mutated = parseMutatedPrompt(result.stdout);

    if (!mutated) {
      record(id, name, false, `stdout 파싱 실패: ${result.stdout.slice(0, 200)}`);
      return;
    }

    // TRANSITION_GATE 마커가 있어야 함 (A grade framing, design-approved)
    const hasGate = mutated.includes('TRANSITION_GATE');

    if (!hasGate) {
      record(id, name, false, 'Grade A framing design-approved에 TRANSITION_GATE 미발동 (D-G 위반)');
      return;
    }

    // "구현 진입" 또는 "approve-impl" 가이드 텍스트 포함 확인
    const hasGuide = mutated.includes('구현 진입') || mutated.includes('approve-impl');
    if (!hasGuide) {
      record(id, name, false, 'TRANSITION_GATE 마커에 trigger 어휘 안내 없음');
      return;
    }

    record(id, name, true, 'Grade A framing design-approved → TRANSITION_GATE 정상 발동');
  } catch (err: any) {
    record(id, name, false, `예외: ${err?.message}`);
  } finally {
    try { fs.rmSync(cwd, { recursive: true, force: true }); } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 실행
// ─────────────────────────────────────────────────────────────────────────────
console.log('=== pre-tool-use-task.js v3 fixture 테스트 ===\n');

test1_personaInjectNormal();
test2_personaOverCap();
test3_gateNotFiredForGradeC();
test4_gateFiredForGradeA();

console.log('\n--- 결과 요약 ---');
const passed = results.filter(r => r.pass).length;
const total = results.length;
console.log(`${passed}/${total} PASS`);

if (passed < total) {
  console.log('\n실패 목록:');
  results.filter(r => !r.pass).forEach(r => {
    console.log(`  [FAIL] ${r.id} ${r.name}: ${r.reason}`);
  });
  process.exit(1);
} else {
  console.log('\nG2 게이트 기준 통과.');
  process.exit(0);
}
