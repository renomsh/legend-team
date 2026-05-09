#!/usr/bin/env node
// verification-before-completion 스킬 자동 발동 훅
// Edit/Write 후 코드 파일 작성 시 검증 컨텍스트 주입

const CODE_EXTS = /\.(ts|js|mjs|cjs|tsx|jsx|py|sh|rb|go|rs|java|kt|swift|php|cs)$/i;

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const filePath = input.tool_input?.file_path || input.tool_response?.filePath || '';

    if (!CODE_EXTS.test(filePath)) {
      process.exit(0);
    }

    const result = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          '[verification-before-completion] 코드 파일 작성 완료. ' +
          '완료/done 선언 전 반드시: ' +
          '①실제 실행·호출 ②출력 확인 ③증거 기록. ' +
          '증거 없는 완료 선언 = 미완료.'
      }
    };

    process.stdout.write(JSON.stringify(result));
  } catch {
    process.exit(0);
  }
});
