#!/usr/bin/env node
// PostToolUse hook: scripts/*.ts 변경 시 자동 빌드 + export 검증

const { execSync } = require('child_process');
const path = require('path');

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const filePath = input.tool_input?.file_path || '';

    // scripts/ 디렉토리 내 .ts 파일인지 확인
    const normalized = filePath.replace(/\\/g, '/');
    const isScriptTs = /\/scripts\/[^/]+\.ts$/.test(normalized) || /^scripts\/[^/]+\.ts$/.test(normalized);

    if (!isScriptTs) {
      process.exit(0);
    }

    const cwd = process.cwd();
    const messages = [];

    // npm run build:scripts 실행
    messages.push(`[build-scripts] 변경 감지: ${path.basename(filePath)} → npm run build:scripts 실행`);

    try {
      execSync('npm run build:scripts', { cwd, encoding: 'utf-8', timeout: 60000, stdio: 'pipe' });
      messages.push('[build-scripts] ✅ 빌드 성공');
    } catch (buildErr) {
      const errOut = (buildErr.stderr || buildErr.stdout || buildErr.message || '').trim();
      messages.push('[build-scripts] ❌ 빌드 실패');
      if (errOut) messages.push(errOut.split('\n').slice(0, 10).join('\n'));

      const result = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: messages.join('\n')
        }
      };
      process.stdout.write(JSON.stringify(result));
      process.exit(0); // Claude를 block하지 않음
    }

    // verify-scripts-exports.js 실행
    let verifyOut = '';
    try {
      verifyOut = execSync('node scripts/verify-scripts-exports.js', {
        cwd,
        encoding: 'utf-8',
        timeout: 30000,
        stdio: 'pipe'
      }).trim();
      messages.push('[build-scripts] ✅ export 검증 통과');
      if (verifyOut) messages.push(verifyOut);
    } catch (verifyErr) {
      const out = (verifyErr.stdout || '').trim();
      const err = (verifyErr.stderr || '').trim();
      messages.push('[build-scripts] ⚠️ export 검증 실패:');
      if (out) messages.push(out);
      if (err) messages.push(err.split('\n').slice(0, 5).join('\n'));
    }

    const result = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: messages.join('\n')
      }
    };
    process.stdout.write(JSON.stringify(result));
  } catch {
    process.exit(0);
  }
});
