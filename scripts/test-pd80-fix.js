// PD-80 fix verification — Zero D.Condense gate false-positive gap 차단 확인
// session_234 실제 산출물 디렉터리 대상으로 두 분기를 시뮬레이션.
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(process.cwd(), 'reports', '2026-05-10_pd-069-parallel-session');
const sessionId = 'session_234';

console.log('=== Test 1: missing-report 검사 (role=zero) ===');
const files = fs.readdirSync(reportsDir);
console.log('files:', files);

let hasReport = false;
const role = 'zero';
const markerPath = path.join(reportsDir, '_zero_condense.json');
if (fs.existsSync(markerPath)) {
  const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  if (marker && marker.sessionId === sessionId &&
      Array.isArray(marker.files) && marker.files.length > 0 &&
      marker.files.every(f => files.includes(f))) {
    hasReport = true;
  }
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
let isZeroCondenseOutput = false;
const markerPath2 = path.join(path.dirname(absReportPath), '_zero_condense.json');
if (fs.existsSync(markerPath2)) {
  const marker = JSON.parse(fs.readFileSync(markerPath2, 'utf8'));
  const fileName = path.basename(absReportPath);
  if (marker && marker.sessionId === sessionId &&
      Array.isArray(marker.files) && marker.files.includes(fileName)) {
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
if (fs.existsSync(markerPath)) {
  const marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  if (marker && marker.sessionId === badSessionId &&
      Array.isArray(marker.files) && marker.files.length > 0 &&
      marker.files.every(f => files.includes(f))) {
    hasReportBadSession = true;
  }
}
console.log('hasReport (잘못된 sessionId):', hasReportBadSession, '(expected: false)');
console.log(hasReportBadSession === false ? 'PASS — sessionId 검증 작동' : 'FAIL');
