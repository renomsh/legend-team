#!/usr/bin/env node
// scripts/verify-scripts-exports.js
// in-process require가 필요한 스크립트들의 export 존재 여부 검증
// 사용: node scripts/verify-scripts-exports.js

'use strict';

const path = require('path');

// ts-node 등록 (transpileOnly — 타입 체크 없이 빠르게)
require('ts-node').register({
  transpileOnly: true,
  skipProject: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2020',
    esModuleInterop: true,
    skipLibCheck: true,
    ignoreDeprecations: '6.0'
  }
});

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS_DIR = __dirname;

function resolve(rel) {
  return path.join(SCRIPTS_DIR, rel);
}

const CHECKS = [
  {
    file: 'write-session-contribution.ts',
    exports: ['main', 'writeSessionContribution']
  },
  {
    file: 'regenerate-context-brief.ts',
    exports: ['main', 'regenerateContextBrief']
  },
  {
    file: 'check-pending-deferrals.ts',
    exports: ['main', 'checkPendingDeferrals']
  },
  {
    file: 'finalize-self-scores.ts',
    exports: ['finalize']
  },
  {
    file: 'compute-signature-metrics.ts',
    exports: ['compute']
  },
  {
    file: 'compute-dashboard.ts',
    exports: ['main']
  },
  {
    file: 'set-closed-in-session.ts',
    exports: ['main']
  }
];

let allPassed = true;

for (const check of CHECKS) {
  const filePath = resolve(check.file);
  try {
    const mod = require(filePath);
    const missing = check.exports.filter(name => typeof mod[name] !== 'function');
    if (missing.length === 0) {
      console.log(`OK  ${check.file}  [${check.exports.join(', ')}]`);
    } else {
      console.log(`FAIL  ${check.file}  missing exports: [${missing.join(', ')}]`);
      allPassed = false;
    }
  } catch (err) {
    console.log(`FAIL  ${check.file}  require error: ${err.message}`);
    allPassed = false;
  }
}

console.log('');
if (allPassed) {
  console.log('결과: 7/7 통과');
  process.exit(0);
} else {
  console.log('결과: 일부 실패 — 위 FAIL 항목 확인');
  process.exit(1);
}
