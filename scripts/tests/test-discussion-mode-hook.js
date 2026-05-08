'use strict';
/**
 * TDD: discussion 모드 D-170/A1/A2 hook 검증
 *
 * 테스트 대상: .claude/hooks/pre-tool-use-task.js
 *
 * 구현 전 예상:
 *   A ❌ — sess.phase 체크 미구현 (operationMode만 확인)
 *   B ❌ — blind-parallel sessionLayer 억제 미구현
 *   C ❌ — discussion+synthesis Ace 차단 미구현
 *   D ✅ — structured 모드 Ace 차단 없음 (sanity)
 *   E ✅ — open phase 도메인 마커 없음 (sanity)
 *
 * 구현 후 전체 pass.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const HOOK_PATH = path.join(__dirname, '../../.claude/hooks/pre-tool-use-task.js');
const PROJECT_ROOT = path.join(__dirname, '../..');

// ─── fixture helpers ─────────────────────────────────────────────────────────

function createFixture(sessionOverrides = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'legend-discussion-test-'));

  const dirs = [
    'memory/sessions',
    'memory/shared',
    'memory/roles/policies',
    'memory/roles/personas',
    'logs',
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(tmpDir, d), { recursive: true });
  }

  // minimal dispatch_config (D-170-A1 role_domain_template 포함)
  const dispatchConfig = {
    role_domain_template: {
      arki: '구조·의존성·게이트',
      riki: '실패 모드·전제 분쇄',
      fin: '자원·재무·비용 안분',
      ace: '구조·흐름 종합 (structured 모드 한정)',
      edi: '산출물 박제·version_bump 확정·anchor governance',
    },
    phase_enum: {
      values: ['framing', 'blind-parallel', 'open', 'debate', 'synthesis'],
    },
  };
  fs.writeFileSync(
    path.join(tmpDir, 'memory/shared/dispatch_config.json'),
    JSON.stringify(dispatchConfig)
  );

  // minimal topic_index
  fs.writeFileSync(
    path.join(tmpDir, 'memory/shared/topic_index.json'),
    JSON.stringify({ topics: [] })
  );

  // minimal _common.md
  fs.writeFileSync(
    path.join(tmpDir, 'memory/roles/policies/_common.md'),
    '# Common Policy\nBe helpful.'
  );

  // default session
  const session = {
    sessionId: 'test_session_001',
    topicId: 'topic_test',
    reportPath: 'reports/test-report',
    phase: 'open',
    operationType: 'structured',
    operationMode: 'observation',
    turns: [],
    ...sessionOverrides,
  };
  fs.writeFileSync(
    path.join(tmpDir, 'memory/sessions/current_session.json'),
    JSON.stringify(session)
  );

  return tmpDir;
}

function callHook(tmpDir, toolInputOverrides = {}) {
  const toolInput = {
    prompt: 'Default test prompt',
    description: 'arki structural analysis',
    ...toolInputOverrides,
  };
  const hookInput = JSON.stringify({
    cwd: tmpDir,
    tool_name: 'Agent',
    tool_input: toolInput,
  });

  const result = spawnSync('node', [HOOK_PATH], {
    input: hookInput,
    encoding: 'utf8',
    cwd: tmpDir,
  });

  if (result.error) throw result.error;
  if (!result.stdout || result.stdout.trim() === '') return null;
  return JSON.parse(result.stdout);
}

function getPrompt(hookOutput) {
  return hookOutput?.hookSpecificOutput?.updatedInput?.prompt || '';
}

function cleanup(tmpDir) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
}

// ─── test runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   ${e.message}`);
    failures.push({ name, error: e.message });
    failed++;
  }
}

// ─── TEST A ───────────────────────────────────────────────────────────────────
// sess.phase='blind-parallel' (operationMode=observation) → 도메인 마커 inject
// 현재 hook은 operationMode만 체크 → FAIL 예상
test('A: sess.phase=blind-parallel triggers domain marker (not just operationMode)', () => {
  const tmpDir = createFixture({
    phase: 'blind-parallel',
    operationMode: 'observation', // operationMode는 blind-parallel이 아님
  });
  try {
    const output = callHook(tmpDir, { description: 'arki structural analysis' });
    const prompt = getPrompt(output);
    assert.ok(
      prompt.includes('blind-parallel'),
      `Expected 'blind-parallel' in prompt. First 300 chars:\n${prompt.slice(0, 300)}`
    );
    assert.ok(
      prompt.includes('구조·의존성·게이트'),
      `Expected arki domain text in prompt`
    );
  } finally {
    cleanup(tmpDir);
  }
});

// ─── TEST B ───────────────────────────────────────────────────────────────────
// sess.phase='blind-parallel' + turns 존재 → sessionLayer 억제 (이전 발언 미노출)
// 현재 hook은 항상 sessionLayer 빌드 → FAIL 예상
test('B: sess.phase=blind-parallel suppresses sessionLayer (blind isolation)', () => {
  const tmpDir = createFixture({
    phase: 'blind-parallel',
    operationMode: 'observation',
    turns: [{ role: 'riki', turnIdx: 0, phase: 'blind-parallel' }],
  });

  // riki가 이전에 발언한 것처럼 보고서 생성
  const reportDir = path.join(tmpDir, 'reports/test-report');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, 'riki_rev1.md'),
    '# Riki Report\nRIKI_SECRET_CONTENT_XYZ'
  );

  try {
    const output = callHook(tmpDir, { description: 'arki structural analysis' });
    const prompt = getPrompt(output);
    assert.ok(
      !prompt.includes('RIKI_SECRET_CONTENT_XYZ'),
      `Session layer should be suppressed in blind-parallel. Got prompt (first 400):\n${prompt.slice(0, 400)}`
    );
  } finally {
    cleanup(tmpDir);
  }
});

// ─── TEST C ───────────────────────────────────────────────────────────────────
// operationType='discussion' + phase='synthesis' + role='ace' → 차단
// 현재 hook에 이 로직 없음 → FAIL 예상
test('C: discussion+synthesis phase blocks ace dispatch (D-170-A2)', () => {
  const tmpDir = createFixture({
    phase: 'synthesis',
    operationType: 'discussion',
    operationMode: 'observation',
  });
  try {
    const output = callHook(tmpDir, {
      prompt: '## ROLE: ace\nPlease synthesize all role outputs and give a final recommendation.',
    });
    const prompt = getPrompt(output);
    const isBlocked =
      prompt.includes('ACE_SYNTHESIS_BLOCKED') ||
      (prompt.toUpperCase().includes('ACE') &&
        (prompt.includes('BLOCK') || prompt.includes('차단')));
    assert.ok(
      isBlocked,
      `Ace should be blocked in discussion+synthesis. Got prompt (first 400):\n${prompt.slice(0, 400)}`
    );
  } finally {
    cleanup(tmpDir);
  }
});

// ─── TEST D ───────────────────────────────────────────────────────────────────
// operationType='structured' + phase='synthesis' + role='ace' → 차단 없음 (sanity)
test('D: structured+synthesis does NOT block ace (sanity check)', () => {
  const tmpDir = createFixture({
    phase: 'synthesis',
    operationType: 'structured',
    operationMode: 'observation',
  });
  try {
    const output = callHook(tmpDir, {
      prompt: '## ROLE: ace\nPlease synthesize all role outputs.',
    });
    const prompt = getPrompt(output);
    const isBlocked = prompt.includes('ACE_SYNTHESIS_BLOCKED');
    assert.ok(
      !isBlocked,
      `Ace should NOT be blocked in structured+synthesis mode`
    );
  } finally {
    cleanup(tmpDir);
  }
});

// ─── TEST E ───────────────────────────────────────────────────────────────────
// phase='open' + operationMode='observation' → 도메인 마커 없음 (sanity)
test('E: phase=open does NOT trigger blind-parallel domain marker (sanity check)', () => {
  const tmpDir = createFixture({
    phase: 'open',
    operationMode: 'observation',
  });
  try {
    const output = callHook(tmpDir, { description: 'arki structural analysis' });
    const prompt = getPrompt(output);
    assert.ok(
      !prompt.includes('blind-parallel 도메인 범위'),
      `Should NOT have domain marker in open phase`
    );
  } finally {
    cleanup(tmpDir);
  }
});

// ─── summary ─────────────────────────────────────────────────────────────────

console.log('');
console.log(`결과: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\n실패 목록:');
  for (const f of failures) {
    console.log(`  - ${f.name}`);
  }
}
process.exit(failed > 0 ? 1 : 0);
