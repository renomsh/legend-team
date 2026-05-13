/**
 * g3-verify.ts — PD-079 / D-181 Phase 3 검증 게이트
 *
 * G3-1 ~ G3-6 일괄 실행 + 정리.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { ROOT } from './lib/utils';
import { getWorktreeId, shortHash } from './lib/m-worktree-id';
import { mNamespacePaths } from './lib/m-namespace-paths';
import { appendMDecision } from './lib/m-decision-write';
import { appendMPendingDeferral } from './lib/m-pd-write';
import { validateMTopicIndexFile } from './lib/m-schema-validator';

const SHARED = path.join(ROOT, 'memory', 'shared');

interface GateResult {
  id: string;
  pass: boolean;
  detail: string;
}

const results: GateResult[] = [];

function record(id: string, pass: boolean, detail: string): void {
  results.push({ id, pass, detail });
  const tag = pass ? 'PASS' : 'FAIL';
  console.log(`[${tag}] ${id}: ${detail}`);
}

// G3-3: 본 검증 *실행 전후* 공식 SOT 바이트 동일성 확인.
// (HEAD 비교는 이전 세션 변경분도 잡혀서 부정확)
function snapshotFile(absPath: string): string | null {
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
}

const wid = getWorktreeId();
const paths = mNamespacePaths(wid);
const widHash = shortHash(wid);
const mtopicSample = `mtopic_001_W${widHash}`;

console.log(`wid=${wid}`);
console.log(`mtopicSample=${mtopicSample}`);
console.log(`paths.decisionLedger=${paths.decisionLedger}`);
console.log(`paths.pendingDeferrals=${paths.pendingDeferrals}`);
console.log(`paths.quarantineDir=${paths.quarantineDir}`);
console.log('---');

// G3-3 사전 스냅샷
const officialPaths = [
  path.join(SHARED, 'decision_ledger.json'),
  path.join(SHARED, 'pending_deferrals.json'),
  path.join(SHARED, 'topic_index.json'),
];
const officialSnapshots = officialPaths.map(snapshotFile);

// 사전 정리: 기존 m_* 파일 백업 후 제거 (이미 P1/P2에서 생성됐을 수 있음)
const backups: Array<{ orig: string; backup: string }> = [];
for (const p of [paths.decisionLedger, paths.pendingDeferrals]) {
  if (fs.existsSync(p)) {
    const b = p + '.g3bak';
    fs.renameSync(p, b);
    backups.push({ orig: p, backup: b });
    console.log(`backed up: ${path.basename(p)}`);
  }
}
if (fs.existsSync(paths.quarantineDir)) {
  const b = paths.quarantineDir + '.g3bak';
  if (fs.existsSync(b)) fs.rmSync(b, { recursive: true, force: true });
  fs.renameSync(paths.quarantineDir, b);
  backups.push({ orig: paths.quarantineDir, backup: b });
  console.log(`backed up: ${path.basename(paths.quarantineDir)}`);
}

let g3_1_pass = false;
let g3_2_pass = false;

try {
  // ── G3-1: mD-001 정상 append ──────────────────────────────────────────
  const r1 = appendMDecision(wid, {
    date: '2026-05-13',
    mtopicId: mtopicSample,
    axis: 'g3-1 normal append',
    summary: 'PD-079 P3 G3-1 verification',
  } as never);
  const ledger1 = JSON.parse(fs.readFileSync(paths.decisionLedger, 'utf8'));
  const ok1 =
    r1.mId === 'mD-001' &&
    r1.quarantined === false &&
    Array.isArray(ledger1.decisions) &&
    ledger1.decisions.length === 1 &&
    ledger1.decisions[0].mId === 'mD-001';
  g3_1_pass = ok1;
  record(
    'G3-1',
    ok1,
    `mId=${r1.mId} quarantined=${r1.quarantined} decisions.len=${ledger1.decisions.length}`
  );

  // ── G3-2: schema 위반(axis 누락) 격리 ────────────────────────────────
  const ledgerBefore = fs.readFileSync(paths.decisionLedger, 'utf8');
  const r2 = appendMDecision(wid, {
    date: '2026-05-13',
    mtopicId: mtopicSample,
    // axis 의도적 누락
    summary: 'g3-2 missing axis',
  } as never);
  const ledgerAfter = fs.readFileSync(paths.decisionLedger, 'utf8');
  const qFiles = fs.existsSync(paths.quarantineDir)
    ? fs.readdirSync(paths.quarantineDir)
    : [];
  const hasQuarantined = qFiles.some((f) => f.includes('mD-002'));
  const hasReason = qFiles.some(
    (f) => f.includes('mD-002') && f.endsWith('_reason.txt')
  );
  const ledgerUnchanged = ledgerBefore === ledgerAfter;
  const ok2 =
    r2.quarantined === true &&
    Array.isArray(r2.errors) &&
    r2.errors!.length > 0 &&
    hasQuarantined &&
    hasReason &&
    ledgerUnchanged;
  g3_2_pass = ok2;
  record(
    'G3-2',
    ok2,
    `quarantined=${r2.quarantined} errors=${r2.errors?.join('; ')} qFiles=${qFiles.length} ledgerUnchanged=${ledgerUnchanged}`
  );

  // ── G3-3: G3 실행 *전후* 공식 SOT 바이트 변경 0 ───────────────────────
  const officialAfter = officialPaths.map(snapshotFile);
  const drifted: string[] = [];
  officialPaths.forEach((p, i) => {
    if (officialSnapshots[i] !== officialAfter[i]) drifted.push(path.basename(p));
  });
  const ok3 = drifted.length === 0;
  record(
    'G3-3',
    ok3,
    ok3
      ? '공식 SOT 3종 P3 코드 실행 전후 바이트 동일'
      : `드리프트: ${drifted.join(', ')}`
  );

  // ── G3-4: mPD-001 정상 + 격리 케이스 ─────────────────────────────────
  const rp1 = appendMPendingDeferral(wid, {
    fromSession: 'session_244',
    fromMTopic: mtopicSample,
    createdAt: '2026-05-13T00:00:00Z',
    item: 'g3-4 normal mPD',
    status: 'pending',
  } as never);
  const pdFile1 = JSON.parse(fs.readFileSync(paths.pendingDeferrals, 'utf8'));
  const rp2 = appendMPendingDeferral(wid, {
    fromSession: 'session_244',
    fromMTopic: mtopicSample,
    createdAt: '2026-05-13T00:00:00Z',
    item: 'g3-4 bad status',
    status: 'unknown-bad-status', // enum 위반
  } as never);
  const qFiles2 = fs.existsSync(paths.quarantineDir)
    ? fs.readdirSync(paths.quarantineDir)
    : [];
  const hasMpdQ = qFiles2.some(
    (f) => f.includes('mPD-002') && f.endsWith('.json')
  );
  const hasMpdReason = qFiles2.some(
    (f) => f.includes('mPD-002') && f.endsWith('_reason.txt')
  );
  const ok4 =
    rp1.mpdId === 'mPD-001' &&
    rp1.quarantined === false &&
    pdFile1.items.length === 1 &&
    rp2.quarantined === true &&
    hasMpdQ &&
    hasMpdReason;
  record(
    'G3-4',
    ok4,
    `rp1.mpdId=${rp1.mpdId} rp1.q=${rp1.quarantined} rp2.q=${rp2.quarantined} pd.items=${pdFile1.items.length} mpdQ=${hasMpdQ}`
  );

  // ── G3-5: validateMTopicIndexFile — P2 create-mtopic 산출물 호환 ────
  // 실제 create-mtopic.ts 실행해 진짜 산출물 생성, validator로 검증
  if (fs.existsSync(paths.topicIndex)) {
    fs.renameSync(paths.topicIndex, paths.topicIndex + '.g3bak');
    backups.push({
      orig: paths.topicIndex,
      backup: paths.topicIndex + '.g3bak',
    });
  }
  execSync(
    `npx ts-node scripts/create-mtopic.ts "G3-5 schema compat test" g3-5-test A`,
    { cwd: ROOT, stdio: 'pipe' }
  );
  const idxRaw = fs.readFileSync(paths.topicIndex, 'utf8');
  const idxParsed = JSON.parse(idxRaw);
  const v5 = validateMTopicIndexFile(idxParsed);
  const ok5 = v5.valid === true;
  record(
    'G3-5',
    ok5,
    ok5
      ? `valid=true topics=${idxParsed.topics.length}`
      : `errors: ${v5.errors.join('; ')}`
  );

  // ── G3-6: mD-002, mD-003 연속 append → 번호 단조 증가 ────────────────
  // 현재 ledger에는 mD-001만 있음. 다음 발급 = mD-002 (격리된 mD-002는 ledger에 없음 → nextId가 최대치+1 → mD-002)
  const rA = appendMDecision(wid, {
    date: '2026-05-13',
    mtopicId: mtopicSample,
    axis: 'g3-6 seq A',
    summary: 'monotonic test A',
  } as never);
  const rB = appendMDecision(wid, {
    date: '2026-05-13',
    mtopicId: mtopicSample,
    axis: 'g3-6 seq B',
    summary: 'monotonic test B',
  } as never);
  const ledger6 = JSON.parse(fs.readFileSync(paths.decisionLedger, 'utf8'));
  const ids = ledger6.decisions.map((d: { mId: string }) => d.mId);
  // 기대: ['mD-001', 'mD-002', 'mD-003'] — 단조 증가
  const expectedSeq = ['mD-001', 'mD-002', 'mD-003'];
  const ok6 =
    rA.quarantined === false &&
    rB.quarantined === false &&
    JSON.stringify(ids) === JSON.stringify(expectedSeq);
  record(
    'G3-6',
    ok6,
    `seq=${JSON.stringify(ids)} expected=${JSON.stringify(expectedSeq)}`
  );
} finally {
  // ── 정리 ────────────────────────────────────────────────────────────
  console.log('---');
  console.log('cleanup: 생성한 m_* 파일과 quarantine 삭제');
  for (const p of [paths.decisionLedger, paths.pendingDeferrals, paths.topicIndex]) {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  rm ${path.basename(p)}`);
    }
  }
  if (fs.existsSync(paths.quarantineDir)) {
    fs.rmSync(paths.quarantineDir, { recursive: true, force: true });
    console.log(`  rm -rf ${path.basename(paths.quarantineDir)}`);
  }
  // 백업 복구
  for (const b of backups) {
    if (fs.existsSync(b.backup)) {
      fs.renameSync(b.backup, b.orig);
      console.log(`  restored ${path.basename(b.orig)}`);
    }
  }
  // .staging 디렉토리 정리 (atomic-write 잔존 가능성)
  const stagingDir = path.join(SHARED, '.staging');
  if (fs.existsSync(stagingDir)) {
    try {
      const remaining = fs.readdirSync(stagingDir);
      if (remaining.length === 0) fs.rmdirSync(stagingDir);
    } catch {
      /* ignore */
    }
  }
}

console.log('---');
const passCount = results.filter((r) => r.pass).length;
console.log(`SUMMARY: ${passCount}/${results.length} PASS`);
process.exit(passCount === results.length ? 0 : 1);
