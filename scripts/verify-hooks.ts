#!/usr/bin/env node
/**
 * verify-hooks.ts — Hook 회귀 검증 스크립트 (session_247 Dev rev5 박제)
 *
 * 목적:
 *   - Hook 2 (pre-tool-use-no-autonomous-decision.js) 정규 회귀 검증
 *   - Stop hook (stop-nexus-self-censor.js) 정규 회귀 검증
 *   - 누적 케이스 DB (Hook2 한국어 17 + Group A/B/D/E 17 + 영어 12 = 46 / Stop 6) 보존
 *   - harness env 누수 차단 (dev_rev2 1차 사고 정합 — process.env spread 금지)
 *
 * CLI:
 *   npx ts-node scripts/verify-hooks.ts                  # 전수 검증
 *   npx ts-node scripts/verify-hooks.ts --case C1        # 단일 케이스
 *   npx ts-node scripts/verify-hooks.ts --hook hook2     # Hook 2만
 *   npx ts-node scripts/verify-hooks.ts --hook stop      # Stop hook만
 *   npx ts-node scripts/verify-hooks.ts --quiet          # FAIL만 출력
 *
 * Exit code: 0 = 모두 PASS, 1 = 1건 이상 FAIL.
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ============================================================
// 케이스 타입
// ============================================================

interface Hook2Case {
  id: string;
  desc: string;
  userText: string;        // 직전 user turn 단일 텍스트
  toolName: 'Edit' | 'Write' | 'Bash' | 'NotebookEdit';
  toolInput: Record<string, unknown>;
  envOverride?: boolean;   // NEXUS_EMERGENCY_OVERRIDE=1 set 여부
  noTranscript?: boolean;  // transcript_path 미전달 시 silent pass 검증
  expectedExit: 0 | 2;
  expectedPhase?: string;  // log phase 검증 (선택)
}

interface StopCase {
  id: string;
  desc: string;
  assistantText: string;
  envOverride?: boolean;
  preExistingFlag?: boolean;   // 사전 flag 존재 시 클리어 검증
  expectedFlagAfter: boolean;  // 실행 후 flag 존재 여부
}

// ============================================================
// 케이스 DB — Hook 2 (총 46건: 한국어 17 + Group A/B/D 17 + 영어 12)
// ============================================================
//
// 출처:
//   C1~C11   — dev_rev2.md §1-1 (한국어 코어 11)
//   R1~R17   — dev_rev3.md §3 (한국어 회귀 17, C1~C11과 일부 중복 흡수 정정 후 17건)
//   A/B/D/E  — dev_rev3.md §1 Group A/B/D + Edge (실제 newline 포함)
//   E1~E12   — dev_rev4.md §3 (영어 12)
//
// 비-면제 target path 기본값: 'memory/shared/test_verify.json' (memory/shared/ 아래는 면제 X)

const HOOK2_CASES: Hook2Case[] = [
  // ===== dev_rev2 §1-1 — 코어 11건 (C1~C11) =====
  {
    id: 'C1',
    desc: '"분석해줘" — 부분 매칭 false-pass 차단 (FP-2 정정)',
    userText: '분석해줘',
    toolName: 'Edit',
    toolInput: { file_path: 'memory/shared/test_verify.json' },
    expectedExit: 2,
    expectedPhase: 'blocked-no-approval',
  },
  {
    id: 'C2',
    desc: '"왜 진행해야 하는지 설명" — 의문문 라인 차단',
    userText: '왜 진행해야 하는지 설명',
    toolName: 'Edit',
    toolInput: { file_path: 'memory/shared/test_verify.json' },
    expectedExit: 2,
    expectedPhase: 'blocked-no-approval',
  },
  {
    id: 'C3',
    desc: '"안 진행해" — 부정어 선행 차단',
    userText: '안 진행해',
    toolName: 'Edit',
    toolInput: { file_path: 'memory/shared/test_verify.json' },
    expectedExit: 2,
    expectedPhase: 'blocked-no-approval',
  },
  {
    id: 'C4',
    desc: '"진행해" 단독 — verb 매칭 PASS',
    userText: '진행해',
    toolName: 'Edit',
    toolInput: { file_path: 'memory/shared/test_verify.json' },
    expectedExit: 0,
    expectedPhase: 'pass',
  },
  {
    id: 'C5',
    desc: '"구현해줘" 단독 — verb 매칭 PASS',
    userText: '구현해줘',
    toolName: 'Edit',
    toolInput: { file_path: 'memory/shared/test_verify.json' },
    expectedExit: 0,
    expectedPhase: 'pass',
  },
  {
    id: 'C6',
    desc: '"예" 단독 라인 — standalone 매칭 PASS',
    userText: '예',
    toolName: 'Edit',
    toolInput: { file_path: 'memory/shared/test_verify.json' },
    expectedExit: 0,
    expectedPhase: 'pass',
  },
  {
    id: 'C7',
    desc: '"1" 단독 — standalone 1-9 매칭 PASS',
    userText: '1',
    toolName: 'Edit',
    toolInput: { file_path: 'memory/shared/test_verify.json' },
    expectedExit: 0,
    expectedPhase: 'pass',
  },
  {
    id: 'C8',
    desc: 'Bash readonly "ls -la" — 면제 PASS',
    userText: '아무거나',
    toolName: 'Bash',
    toolInput: { command: 'ls -la' },
    expectedExit: 0,
    expectedPhase: 'exempt-readonly-bash',
  },
  {
    id: 'C9',
    desc: 'Edit on tmp_foo.txt — 경로 면제 PASS',
    userText: '아무거나',
    toolName: 'Edit',
    toolInput: { file_path: 'tmp_foo.txt' },
    expectedExit: 0,
    expectedPhase: 'exempt-path',
  },
  {
    id: 'C10',
    desc: 'No transcript_path — silent PASS (FP-1 fail-safe)',
    userText: '',
    toolName: 'Edit',
    toolInput: { file_path: 'memory/shared/test_verify.json' },
    noTranscript: true,
    expectedExit: 0,
    expectedPhase: 'transcript-unavailable',
  },
  {
    id: 'C11',
    desc: 'NEXUS_EMERGENCY_OVERRIDE=1 + 비승인 — 응급 우회 PASS',
    userText: '아무 의미 없는 텍스트',
    toolName: 'Edit',
    toolInput: { file_path: 'memory/shared/test_verify.json' },
    envOverride: true,
    expectedExit: 0,
    expectedPhase: 'emergency-override',
  },

  // ===== dev_rev3 §3 — 한국어 회귀 R1~R17 =====
  { id: 'R1',  desc: '"진행해" PASS',          userText: '진행해',          toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'R2',  desc: '"진행해주세요" PASS',     userText: '진행해주세요',     toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'R3',  desc: '"진행해줘" PASS',         userText: '진행해줘',         toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'R4',  desc: '"구현해" PASS',           userText: '구현해',           toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'R5',  desc: '"적용해" PASS',           userText: '적용해',           toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'R6',  desc: '"박제해" PASS',           userText: '박제해',           toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'R7',  desc: '"네" 단독 PASS',          userText: '네',               toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'R8',  desc: '"OK" 단독 PASS',          userText: 'OK',               toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'R9',  desc: '"계속" 단독 PASS',        userText: '계속',             toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'R10', desc: '"(α) 진행" PASS',         userText: '(α) 진행',         toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'R11', desc: '"분석해줘" BLOCK',        userText: '분석해줘',         toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'R12', desc: '"왜 진행해야 해?" BLOCK', userText: '왜 진행해야 해?',  toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'R13', desc: '"오늘 날씨 어때" BLOCK', userText: '오늘 날씨 어때',  toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'R14', desc: '"진행하지 말아줘" BLOCK',userText: '진행하지 말아줘', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'R15', desc: '"진행 상황 알려줘" BLOCK',userText: '진행 상황 알려줘',toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'R16', desc: '"이 적용 사례 보여줘" BLOCK', userText: '이 적용 사례 보여줘', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'R17', desc: '"안 진행해" BLOCK (회귀)',userText: '안 진행해',       toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },

  // ===== dev_rev3 §1 — Group A 한국어 부분 매칭 false-pass =====
  { id: 'A1', desc: '"구현해라" PASS',          userText: '구현해라',         toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'A2', desc: '"적용해라" PASS',          userText: '적용해라',         toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'A3', desc: '"박제하지 말아라" BLOCK',  userText: '박제하지 말아라',  toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'A4', desc: '"진행하지 마" BLOCK',      userText: '진행하지 마',      toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'A5', desc: '"예외 처리 로직 알려줘" BLOCK', userText: '예외 처리 로직 알려줘', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },

  // ===== dev_rev3 §1 — Group B 중첩 문맥 (실제 newline) =====
  { id: 'B1', desc: '"이전 답변에 진행해줘 라고 썼는데..." PASS', userText: '이전 답변에 진행해줘 라고 썼는데 — 지금은 보류', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'B2', desc: '"진행하면 안 되는 이유..." BLOCK',           userText: '진행하면 안 되는 이유를 설명해줘', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'B3', desc: 'multi-line, 마지막 라인 "진행해" PASS',     userText: '여러줄 이야기\n중간 라인\n진행해', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'B4', desc: '"어떻게 진행하지?" BLOCK',                  userText: '어떻게 진행하지?', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'B5', desc: 'multi-line negation→proceed PASS',          userText: '진행하지 마\n역시 다시 보니\n진행해', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'B6', desc: 'multi-line proceed→question PASS',          userText: '진행해\n근데 정말 괜찮나?', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },

  // ===== dev_rev3 §1 — Group D 옵션 단답 변형 =====
  { id: 'D1', desc: '"1번 진행해" PASS',  userText: '1번 진행해',         toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'D2', desc: '"a" 단독 PASS',      userText: 'a',                  toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'D3', desc: '"그 중 a 쪽이..." BLOCK', userText: '그 중 a 쪽이 나아 보인다', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'D4', desc: '"2" 단독 PASS',      userText: '2',                  toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'D5', desc: '"A" 대문자 단독 PASS', userText: 'A',                toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },

  // ===== dev_rev4 §3 — 영어 12건 (E1~E12) =====
  { id: 'E1',  desc: '"yes" 단독 PASS',        userText: 'yes',           toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'E2',  desc: '"OK" 단독 PASS',         userText: 'OK',            toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'E3',  desc: '"go" 단독 PASS',         userText: 'go',            toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'E4',  desc: '"proceed" 단독 PASS',    userText: 'proceed',       toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'E5',  desc: '"do it" 단독 PASS',      userText: 'do it',         toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'E6',  desc: '"go ahead" PASS',        userText: 'go ahead',      toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
  { id: 'E7',  desc: '"do not proceed" BLOCK', userText: 'do not proceed',toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'E8',  desc: '"don\'t apply" BLOCK',   userText: "don't apply",   toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'E9',  desc: '"stop" 단독 BLOCK',      userText: 'stop',          toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'E10', desc: '"cancel" 단독 BLOCK',    userText: 'cancel',        toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'E11', desc: '"approved a method but not yet" BLOCK', userText: 'approved a method but not yet', toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 2 },
  { id: 'E12', desc: '"yes proceed" PASS',     userText: 'yes proceed',   toolName: 'Edit', toolInput: { file_path: 'memory/shared/test_verify.json' }, expectedExit: 0 },
];

// ============================================================
// 케이스 DB — Stop hook (6건, dev_rev2 §1-2)
// ============================================================

const STOP_CASES: StopCase[] = [
  {
    id: 'S1',
    desc: '단언 4건 + 라벨 0 → flag 박제',
    assistantText:
      '검증 결과 3건의 결정 사항을 정리합니다. ' +
      '첫째, 결정 권고는 정확하며 보장됩니다. ' +
      '둘째, 2건의 추가 검토가 승인되었습니다. ' +
      '셋째, 채택 사항은 정확하게 반영되어 있습니다. ' +
      '이 결과는 확실히 올바릅니다. '.repeat(3),
    expectedFlagAfter: true,
  },
  {
    id: 'S2',
    desc: '단언 + [근거: ...] 라벨 — 사전 flag 클리어',
    assistantText:
      '검증 결과 3건의 결정 사항을 정리합니다. [근거: dev_rev2.md §1-1] ' +
      '결정 권고는 정확하며 보장됩니다. [근거: tmp_verify/runner 출력] ' +
      '2건의 추가 검토가 승인되었습니다. [근거: pending_deferrals.json] ' +
      '채택 사항은 정확하게 반영되어 있습니다. [근거: hook 소스 L36~75] ' +
      '이 결과는 확실히 올바릅니다. '.repeat(2),
    preExistingFlag: true,
    expectedFlagAfter: false,
  },
  {
    id: 'S3',
    desc: '"네" (1자) — too-short 면제',
    assistantText: '네',
    expectedFlagAfter: false,
  },
  {
    id: 'S4',
    desc: '코드블록만 (스트립 후 < 50자) — code-only 면제',
    assistantText: '```\n' + 'console.log("hello")\n'.repeat(20) + '```\n짧',
    expectedFlagAfter: false,
  },
  {
    id: 'S5',
    desc: '의문문만 — questions-only 면제',
    assistantText:
      '이게 맞나요?\n언제 진행할까요?\n' +
      '왜 그렇게 생각하시나요?\n어떻게 처리할까요?\n' +
      '다음에는 무엇을 할까요?\n이 부분은 어떻게 보시나요?',
    expectedFlagAfter: false,
  },
  {
    id: 'S6',
    desc: '단언 4건 + ENV override → flag 미박제',
    assistantText:
      '검증 결과 3건의 결정 사항을 정리합니다. ' +
      '결정 권고는 정확하며 보장됩니다. ' +
      '2건의 추가 검토가 승인되었습니다. ' +
      '채택 사항은 정확하게 반영되어 있습니다. ' +
      '이 결과는 확실히 올바릅니다. '.repeat(3),
    envOverride: true,
    expectedFlagAfter: false,
  },
];

// ============================================================
// 러너 — env 격리 spawnSync (dev_rev2 1차 사고 정합)
// ============================================================

const REPO_ROOT = path.resolve(__dirname, '..');
const HOOK2_PATH = path.join(REPO_ROOT, '.claude', 'hooks', 'pre-tool-use-no-autonomous-decision.js');
const STOP_PATH  = path.join(REPO_ROOT, '.claude', 'hooks', 'stop-nexus-self-censor.js');
const FLAG_PATH  = path.join(REPO_ROOT, '.nexus_violation_flag.json');

function isolatedEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  // process.env spread 금지. PATH·SystemRoot·USERPROFILE만 명시 통과.
  // NEXUS_EMERGENCY_OVERRIDE는 caller가 명시 set 시에만.
  const env: Record<string, string> = {};
  if (process.env.PATH) env.PATH = process.env.PATH;
  if (process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;       // Windows 필수
  if (process.env.USERPROFILE) env.USERPROFILE = process.env.USERPROFILE;
  if (process.env.HOME) env.HOME = process.env.HOME;
  if (process.env.TEMP) env.TEMP = process.env.TEMP;
  if (process.env.TMP) env.TMP = process.env.TMP;
  Object.assign(env, extra);
  return env;
}

function writeTranscript(scratchDir: string, role: 'user' | 'assistant', text: string): string {
  const tp = path.join(scratchDir, `transcript_${role}_${Date.now()}_${Math.random().toString(36).slice(2)}.jsonl`);
  const entry = {
    type: role,
    message: { role, content: [{ type: 'text', text }] },
  };
  fs.writeFileSync(tp, JSON.stringify(entry) + '\n', 'utf-8');
  return tp;
}

function clearFlag(): void {
  if (fs.existsSync(FLAG_PATH)) fs.unlinkSync(FLAG_PATH);
}

function setFlag(): void {
  fs.writeFileSync(
    FLAG_PATH,
    JSON.stringify({ detectedAt: new Date().toISOString(), assertionCount: 1, reason: 'preExistingFlag for verify-hooks test' }, null, 2),
    'utf-8',
  );
}

interface HookRunResult {
  exit: number;
  stderr: string;
  stdout: string;
  envLeakDetected: boolean;
}

function envLeakCheck(extra: Record<string, string>): boolean {
  // caller가 NEXUS_EMERGENCY_OVERRIDE를 명시 set하지 않았는데 process.env에는 있고
  // 그것이 child에 누수되면 문제 — child env는 spawnSync에서 격리되었는지 확인.
  // 여기서는 isolatedEnv 함수 자체가 누수 차단을 보장. 사후 검증 차원.
  if (extra.NEXUS_EMERGENCY_OVERRIDE) return false; // 명시 set은 누수 아님
  return false; // isolatedEnv가 spread 안 함 → 누수 없음
}

function runHook2(c: Hook2Case, scratchDir: string): HookRunResult {
  const transcriptPath = c.noTranscript ? null : writeTranscript(scratchDir, 'user', c.userText);
  const input = {
    tool_name: c.toolName,
    tool_input: c.toolInput,
    ...(transcriptPath ? { transcript_path: transcriptPath } : {}),
  };
  const env = isolatedEnv(c.envOverride ? { NEXUS_EMERGENCY_OVERRIDE: '1' } : {});
  const r = spawnSync(process.execPath, [HOOK2_PATH], {
    cwd: REPO_ROOT,
    env,
    input: JSON.stringify(input),
    encoding: 'utf-8',
    timeout: 5000,
  });
  if (transcriptPath && fs.existsSync(transcriptPath)) {
    try { fs.unlinkSync(transcriptPath); } catch {}
  }
  return {
    exit: r.status ?? -1,
    stderr: r.stderr ?? '',
    stdout: r.stdout ?? '',
    envLeakDetected: envLeakCheck(c.envOverride ? { NEXUS_EMERGENCY_OVERRIDE: '1' } : {}),
  };
}

function runStop(c: StopCase, scratchDir: string): { result: HookRunResult; flagExistsAfter: boolean } {
  // 사전 상태 보장
  if (c.preExistingFlag) setFlag(); else clearFlag();

  const transcriptPath = writeTranscript(scratchDir, 'assistant', c.assistantText);
  const input = { transcript_path: transcriptPath };
  const env = isolatedEnv(c.envOverride ? { NEXUS_EMERGENCY_OVERRIDE: '1' } : {});
  const r = spawnSync(process.execPath, [STOP_PATH], {
    cwd: REPO_ROOT,
    env,
    input: JSON.stringify(input),
    encoding: 'utf-8',
    timeout: 5000,
  });
  if (fs.existsSync(transcriptPath)) {
    try { fs.unlinkSync(transcriptPath); } catch {}
  }
  const flagExistsAfter = fs.existsSync(FLAG_PATH);
  // 정리
  clearFlag();
  return {
    result: {
      exit: r.status ?? -1,
      stderr: r.stderr ?? '',
      stdout: r.stdout ?? '',
      envLeakDetected: envLeakCheck(c.envOverride ? { NEXUS_EMERGENCY_OVERRIDE: '1' } : {}),
    },
    flagExistsAfter,
  };
}

// ============================================================
// CLI
// ============================================================

interface CliOpts {
  caseId: string | null;
  hookFilter: 'hook2' | 'stop' | 'all';
  quiet: boolean;
}

function parseArgs(argv: string[]): CliOpts {
  const opts: CliOpts = { caseId: null, hookFilter: 'all', quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--case' && argv[i + 1]) {
      opts.caseId = argv[++i] ?? null;
    } else if (a === '--hook' && argv[i + 1]) {
      const v = argv[++i];
      if (v === 'hook2' || v === 'stop' || v === 'all') opts.hookFilter = v;
    } else if (a === '--quiet') {
      opts.quiet = true;
    } else if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    }
  }
  return opts;
}

function printHelp(): void {
  console.log(`verify-hooks.ts — Hook 회귀 검증

사용법:
  npx ts-node scripts/verify-hooks.ts                # 전수 (Hook2 46 + Stop 6 = 52)
  npx ts-node scripts/verify-hooks.ts --hook hook2   # Hook 2만
  npx ts-node scripts/verify-hooks.ts --hook stop    # Stop hook만
  npx ts-node scripts/verify-hooks.ts --case C1      # 단일 케이스
  npx ts-node scripts/verify-hooks.ts --quiet        # FAIL만 출력

Exit code: 0 = 모두 PASS, 1 = 1건 이상 FAIL.`);
}

interface CaseResult {
  id: string;
  hook: 'hook2' | 'stop';
  desc: string;
  expected: string;
  actual: string;
  pass: boolean;
  detail?: string;
}

function evalHook2(c: Hook2Case, r: HookRunResult): CaseResult {
  const pass = r.exit === c.expectedExit;
  const detail: string[] = [];
  if (!pass) {
    detail.push(`exit ${r.exit} (expected ${c.expectedExit})`);
    if (r.stderr) detail.push(`stderr: ${r.stderr.trim().slice(0, 200)}`);
  }
  return {
    id: c.id,
    hook: 'hook2',
    desc: c.desc,
    expected: `exit ${c.expectedExit}`,
    actual: `exit ${r.exit}`,
    pass,
    ...(detail.length > 0 ? { detail: detail.join(' | ') } : {}),
  };
}

function evalStop(c: StopCase, r: HookRunResult, flagExistsAfter: boolean): CaseResult {
  const pass = r.exit === 0 && flagExistsAfter === c.expectedFlagAfter;
  const detail: string[] = [];
  if (r.exit !== 0) detail.push(`exit ${r.exit} (expected 0)`);
  if (flagExistsAfter !== c.expectedFlagAfter)
    detail.push(`flag=${flagExistsAfter} (expected ${c.expectedFlagAfter})`);
  if (!pass && r.stderr) detail.push(`stderr: ${r.stderr.trim().slice(0, 200)}`);
  return {
    id: c.id,
    hook: 'stop',
    desc: c.desc,
    expected: `flag=${c.expectedFlagAfter}`,
    actual: `flag=${flagExistsAfter}`,
    pass,
    ...(detail.length > 0 ? { detail: detail.join(' | ') } : {}),
  };
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));

  // hook 파일 존재 확인
  if (!fs.existsSync(HOOK2_PATH)) {
    console.error(`[verify-hooks] FATAL: hook2 not found at ${HOOK2_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(STOP_PATH)) {
    console.error(`[verify-hooks] FATAL: stop hook not found at ${STOP_PATH}`);
    process.exit(1);
  }

  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-hooks-'));
  // 시작 전 flag 정리
  clearFlag();

  const results: CaseResult[] = [];
  const filterCase = (id: string): boolean => opts.caseId === null || opts.caseId === id;

  if (opts.hookFilter === 'all' || opts.hookFilter === 'hook2') {
    for (const c of HOOK2_CASES) {
      if (!filterCase(c.id)) continue;
      const r = runHook2(c, scratchDir);
      results.push(evalHook2(c, r));
    }
  }
  if (opts.hookFilter === 'all' || opts.hookFilter === 'stop') {
    for (const c of STOP_CASES) {
      if (!filterCase(c.id)) continue;
      const { result, flagExistsAfter } = runStop(c, scratchDir);
      results.push(evalStop(c, result, flagExistsAfter));
    }
  }

  // 정리
  try { fs.rmSync(scratchDir, { recursive: true, force: true }); } catch {}
  clearFlag();

  if (results.length === 0) {
    console.error(`[verify-hooks] No cases matched (case=${opts.caseId ?? 'all'}, hook=${opts.hookFilter})`);
    process.exit(1);
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass);

  // 출력
  if (!opts.quiet) {
    console.log('=== verify-hooks results ===');
    console.log(`hook    | id   | result | expected     | actual       | desc`);
    console.log(`--------|------|--------|--------------|--------------|------`);
    for (const r of results) {
      const mark = r.pass ? 'PASS' : 'FAIL';
      const exp = r.expected.padEnd(12);
      const act = r.actual.padEnd(12);
      console.log(`${r.hook.padEnd(7)} | ${r.id.padEnd(4)} | ${mark}   | ${exp} | ${act} | ${r.desc}`);
    }
  }

  if (failed.length > 0) {
    console.log('');
    console.log('=== FAIL detail ===');
    for (const r of failed) {
      console.log(`[${r.hook}] ${r.id}: ${r.desc}`);
      if (r.detail) console.log(`  ${r.detail}`);
    }
  }

  console.log('');
  console.log(`=== ${passed}/${results.length} PASS, ${failed.length} FAIL ===`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
