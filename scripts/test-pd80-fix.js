// PD-80 fix verification — Zero D.Condense gate false-positive gap 차단 확인
// PD-85 (session_248): R-4 mitigation — 인라인 fs.readFileSync 재구현 제거,
// post-tool-use-task.js와 동일한 SOT 헬퍼(readAndValidateMarker) import.
// 본 파일은 hook 치환의 행위 동치성을 직접 검증함.
const fs = require('fs');
const path = require('path');
const { readAndValidateMarker } = require('./lib/zero-condense-marker.js');

const reportsDir = path.join(process.cwd(), 'reports', '2026-05-10_pd-069-parallel-session');
const sessionId = 'session_234';

console.log('=== Test 1: missing-report 검사 (role=zero) ===');
const files = fs.readdirSync(reportsDir);
console.log('files:', files);

let hasReport = false;
// PD-85: post-tool-use-task.js L510 치환 후와 동일 분기
const result = readAndValidateMarker(reportsDir, { sessionId });
if (result.valid &&
    result.canonical.files.length > 0 &&
    result.canonical.files.every(f => files.includes(f))) {
  hasReport = true;
}
if (!hasReport) {
  hasReport = files.some(f =>
    (f.startsWith('zero_rev') && f.endsWith('.md')) ||
    f === 'condensed.md' || f === 'zero_condensed.md'
  );
}
console.log('hasReport:', hasReport, '(expected: true)');
console.log('PASS' + (hasReport ? '' : ' — FAIL'));

console.log('\n=== Test 2: frontmatter-patch Zero D.Condense skip ===');
const absReportPath = path.join(reportsDir, 'condensed.md');
// PD-85: post-tool-use-task.js L442 치환 후와 동일 분기
let isZeroCondenseOutput = false;
const markerDir2 = path.dirname(absReportPath);
const result2 = readAndValidateMarker(markerDir2, { sessionId });
if (result2.valid) {
  const fileName = path.basename(absReportPath);
  if (result2.canonical.files.includes(fileName)) {
    isZeroCondenseOutput = true;
  }
}
console.log('isZeroCondenseOutput:', isZeroCondenseOutput, '(expected: true)');
console.log(isZeroCondenseOutput ? 'PASS — frontmatter patch 우회 작동' : 'FAIL');

console.log('\n=== Test 3: 비-Zero 역할은 기존 검사 유지 ===');
const otherRole = 'arki';
const hasArkiReport = files.some(f => f.startsWith(`${otherRole}_rev`) && f.endsWith('.md'));
console.log(`${otherRole} rev files:`, hasArkiReport, '(expected: false — Arki는 Nexus 직접 작성)');
console.log(hasArkiReport === false ? 'PASS — 비-Zero 검사 변경 없음' : 'FAIL');

console.log('\n=== Test 4: 다른 sessionId 마커는 통과 안 함 ===');
let hasReportBadSession = false;
const badSessionId = 'session_999';
const resultBad = readAndValidateMarker(reportsDir, { sessionId: badSessionId });
if (resultBad.valid &&
    resultBad.canonical.files.length > 0 &&
    resultBad.canonical.files.every(f => files.includes(f))) {
  hasReportBadSession = true;
}
console.log('hasReport (잘못된 sessionId):', hasReportBadSession, '(expected: false)');
console.log(hasReportBadSession === false ? 'PASS — sessionId 검증 작동' : 'FAIL');
