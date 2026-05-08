'use strict';
/**
 * TDD: discussion 모드 D-170/A1/A2 문서 박제 검증
 *
 * 구현 전 예상:
 *   1 ❌ — open.md step 6에 operationType/phase 미포함
 *   2 ❌ — CLAUDE.md에 operationType(structured/discussion) 미선언
 *   3 ❌ — CLAUDE.md에 discussion 모드 phase 시퀀스 미기재
 *   4 ❌ — CLAUDE.md에 /ace-synthesis structured 한정 명시 미포함 (D-170-A2)
 *   5 ❌ — nexus_memory_open.json에 discussionMode 필드 없음
 *   6 ❌ — .claude/commands/discussion.md 파일 없음
 *   7 ❌ — .claude/commands/structured.md 파일 없음
 *
 * 박제 후 전체 pass.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

function readFile(relPath) {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  } catch {
    return null;
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

// ─── runner ──────────────────────────────────────────────────────────────────

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

// ─── TEST 1 ───────────────────────────────────────────────────────────────────
// open.md step 6: current_session.json 갱신 목록에 operationType와 phase 포함
test('1: open.md step 6 includes operationType and phase fields', () => {
  const content = readFile('.claude/commands/open.md');
  assert.ok(content, 'open.md not found');

  assert.ok(
    content.includes('operationType'),
    'open.md step 6 must include operationType field'
  );
  assert.ok(
    content.includes('phase'),
    'open.md step 6 must include phase field'
  );
});

// ─── TEST 2 ───────────────────────────────────────────────────────────────────
// CLAUDE.md에 operationType enum (structured / discussion) 선언
test('2: CLAUDE.md declares operationType enum (structured | discussion)', () => {
  const content = readFile('CLAUDE.md');
  assert.ok(content, 'CLAUDE.md not found');

  assert.ok(
    content.includes('operationType'),
    'CLAUDE.md must mention operationType field'
  );
  assert.ok(
    content.includes('structured') && content.includes('discussion'),
    'CLAUDE.md must mention both structured and discussion values'
  );
});

// ─── TEST 3 ───────────────────────────────────────────────────────────────────
// CLAUDE.md에 discussion 모드 5단계 phase 시퀀스 기재
test('3: CLAUDE.md documents discussion mode phase sequence', () => {
  const content = readFile('CLAUDE.md');
  assert.ok(content, 'CLAUDE.md not found');

  // phase_enum values: framing, blind-parallel, open, debate, synthesis
  const requiredPhases = ['blind-parallel', 'debate', 'synthesis'];
  for (const ph of requiredPhases) {
    assert.ok(
      content.includes(ph),
      `CLAUDE.md must mention discussion phase '${ph}'`
    );
  }
});

// ─── TEST 4 ───────────────────────────────────────────────────────────────────
// CLAUDE.md의 Ace 종합검토 Protocol에 /ace-synthesis = structured 모드 한정 명시 (D-170-A2)
test('4: CLAUDE.md ace-synthesis protocol explicitly says structured mode only (D-170-A2)', () => {
  const content = readFile('CLAUDE.md');
  assert.ok(content, 'CLAUDE.md not found');

  // D-170-A2 결정: /ace-synthesis = structured 모드 한정
  assert.ok(
    content.includes('D-170-A2') ||
      (content.includes('ace-synthesis') && content.includes('structured')),
    'CLAUDE.md Ace 종합검토 section must mention /ace-synthesis is structured mode only (D-170-A2)'
  );
});

// ─── TEST 5 ───────────────────────────────────────────────────────────────────
// nexus_memory_open.json에 discussionMode 가이드 추가
test('5: nexus_memory_open.json has discussionMode field', () => {
  const raw = readFile('memory/shared/nexus_memory_open.json');
  assert.ok(raw, 'nexus_memory_open.json not found');

  let json;
  try { json = JSON.parse(raw); } catch (e) {
    assert.fail(`nexus_memory_open.json parse error: ${e.message}`);
  }

  assert.ok(
    json.discussionMode !== undefined,
    'nexus_memory_open.json must have discussionMode key'
  );
});

// ─── TEST 6 ───────────────────────────────────────────────────────────────────
// .claude/commands/discussion.md 파일 존재
test('6: .claude/commands/discussion.md exists', () => {
  assert.ok(
    fileExists('.claude/commands/discussion.md'),
    '.claude/commands/discussion.md not found'
  );
});

// ─── TEST 7 ───────────────────────────────────────────────────────────────────
// .claude/commands/structured.md 파일 존재
test('7: .claude/commands/structured.md exists', () => {
  assert.ok(
    fileExists('.claude/commands/structured.md'),
    '.claude/commands/structured.md not found'
  );
});

// ─── summary ─────────────────────────────────────────────────────────────────

console.log('');
console.log(`결과: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\n실패 목록:');
  for (const f of failures) console.log(`  - ${f.name}`);
}
process.exit(failed > 0 ? 1 : 0);
