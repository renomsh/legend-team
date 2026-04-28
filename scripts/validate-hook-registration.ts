/**
 * scripts/validate-hook-registration.ts
 * .claude/settings.json hooks 등록 상태 점검 (topic_127 P2, R-2 mitigation).
 *
 * 실행: npx ts-node scripts/validate-hook-registration.ts
 *
 * 검증 항목:
 *   1. .claude/settings.json 존재 확인
 *   2. hooks.PreToolUse에 pre-tool-use-task.js 등록 여부
 *   3. hooks.PostToolUse에 post-tool-use-task.js 등록 여부
 *   4. SessionEnd hook 존재 여부 (선택적 경고)
 *
 * 출력:
 *   - PASS/WARN 라인 (exit 0 — 강제 종료 X, 검증만)
 *   - 미등록 시 WARN 출력 + 최종 WARN_COUNT 보고
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SETTINGS_PATH = path.join(PROJECT_ROOT, '.claude', 'settings.json');

interface HookEntry {
  type?: string;
  command?: string;
}

interface HookGroup {
  matcher?: string;
  hooks?: HookEntry[];
}

interface Settings {
  hooks?: {
    PreToolUse?: HookGroup[];
    PostToolUse?: HookGroup[];
    SessionEnd?: HookGroup[];
    [key: string]: HookGroup[] | undefined;
  };
}

type CheckResult = { label: string; pass: boolean; warn: boolean; message: string };
const results: CheckResult[] = [];
let warnCount = 0;

function check(label: string, pass: boolean, warn: boolean, message: string) {
  const r: CheckResult = { label, pass, warn, message };
  results.push(r);
  const tag = pass ? 'PASS' : warn ? 'WARN' : 'FAIL';
  console.log(`[${tag}] ${label}: ${message}`);
  if (warn || !pass) warnCount++;
}

function findCommandInHookGroups(groups: HookGroup[] | undefined, targetFragment: string): boolean {
  if (!groups || !Array.isArray(groups)) return false;
  for (const group of groups) {
    if (!group.hooks || !Array.isArray(group.hooks)) continue;
    for (const hook of group.hooks) {
      if (hook.command && hook.command.includes(targetFragment)) return true;
    }
  }
  return false;
}

// 1. settings.json 존재 확인
if (!fs.existsSync(SETTINGS_PATH)) {
  check('settings.json 존재', false, false, `파일 없음: ${SETTINGS_PATH}`);
  console.log('\n[FATAL] settings.json이 없습니다. 훅 등록 불가.');
  process.exit(0);
}

// 2. JSON 파싱
let settings: Settings;
try {
  const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
  settings = JSON.parse(raw) as Settings;
  check('settings.json 파싱', true, false, '정상 파싱');
} catch (err: any) {
  check('settings.json 파싱', false, false, `파싱 오류: ${err?.message}`);
  process.exit(0);
}

// 3. PreToolUse — pre-tool-use-task.js 등록 확인
const preToolUse = settings.hooks?.PreToolUse;
const preHookRegistered = findCommandInHookGroups(preToolUse, 'pre-tool-use-task.js');
check(
  'PreToolUse: pre-tool-use-task.js',
  preHookRegistered,
  !preHookRegistered,
  preHookRegistered
    ? 'hooks.PreToolUse에 등록 확인'
    : '미등록 — .claude/settings.json hooks.PreToolUse에 "node .claude/hooks/pre-tool-use-task.js" 추가 필요'
);

// 4. PostToolUse — post-tool-use-task.js 등록 확인
const postToolUse = settings.hooks?.PostToolUse;
const postHookRegistered = findCommandInHookGroups(postToolUse, 'post-tool-use-task.js');
check(
  'PostToolUse: post-tool-use-task.js',
  postHookRegistered,
  !postHookRegistered,
  postHookRegistered
    ? 'hooks.PostToolUse에 등록 확인'
    : '미등록 — .claude/settings.json hooks.PostToolUse에 "node .claude/hooks/post-tool-use-task.js" 추가 필요'
);

// 5. SessionEnd hook 존재 확인 (선택적)
const sessionEnd = settings.hooks?.SessionEnd;
const sessionEndRegistered = !!(sessionEnd && sessionEnd.length > 0);
check(
  'SessionEnd hook',
  sessionEndRegistered,
  !sessionEndRegistered,
  sessionEndRegistered
    ? `${sessionEnd!.length}개 그룹 등록 확인`
    : '없음 — auto-push.js 등 세션 종료 훅 미등록 (선택적 경고)'
);

// 최종 보고
console.log('\n--- validate-hook-registration 결과 ---');
const passed = results.filter(r => r.pass).length;
console.log(`${passed}/${results.length} 항목 정상`);
if (warnCount > 0) {
  console.log(`경고/실패 ${warnCount}건 — 위 WARN/FAIL 항목 확인`);
} else {
  console.log('모든 훅 정상 등록 확인.');
}

// exit 0 — 검증만, 강제 종료 X
process.exit(0);
