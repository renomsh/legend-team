/**
 * g4-verify.ts — PD-079 / D-181 Phase 4 검증 게이트
 *
 * G4-1 ~ G4-6 일괄 실행 + cleanup. g3-verify.ts 패턴.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT } from './lib/utils';
import { similarity, trigrams, cosine } from './lib/similarity';
import { crossCheckMD } from './lib/m-cross-check';
import { getMConfig } from './lib/m-config';
import {
  scanClosedMTopics,
  buildPreview,
  loadOfficialLedger,
  loadOfficialPDs,
} from './lib/migration-preview';
import { getWorktreeId, shortHash } from './lib/m-worktree-id';
import { mNamespacePaths } from './lib/m-namespace-paths';
import { atomicWriteJSON } from './lib/atomic-write';
import type {
  MDecisionLedger,
  MDecisionLedgerEntry,
  MTopicIndex,
} from './lib/m-types';
import type { DecisionLedgerEntry } from '../src/types/index';

const SHARED = path.join(ROOT, 'memory', 'shared');

interface GateResult {
  id: string;
  pass: boolean;
  detail: string;
}
const results: GateResult[] = [];
function record(id: string, pass: boolean, detail: string): void {
  results.push({ id, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${id}: ${detail}`);
}

function snapshotFile(absPath: string): string | null {
  return fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
}

const wid = getWorktreeId();
const paths = mNamespacePaths(wid);
const widHash = shortHash(wid);
const fakeMtopic = `mtopic_999_W${widHash}`;

const officialPaths = [
  path.join(SHARED, 'decision_ledger.json'),
  path.join(SHARED, 'pending_deferrals.json'),
  path.join(SHARED, 'topic_index.json'),
];
const officialSnapshots = officialPaths.map(snapshotFile);

// 기존 m_* 백업
const backups: Array<{ orig: string; backup: string }> = [];
for (const p of [paths.decisionLedger, paths.pendingDeferrals, paths.topicIndex]) {
  if (fs.existsSync(p)) {
    const b = p + '.g4bak';
    if (fs.existsSync(b)) fs.rmSync(b, { force: true });
    fs.renameSync(p, b);
    backups.push({ orig: p, backup: b });
  }
}

try {
  // ── G4-1: similarity unit ──────────────────────────────────────────
  const s1 = similarity('hello', 'hello');
  const s2 = similarity('hello world', 'world hello');
  const s3 = similarity('apple', 'xyz123');
  const s4 = similarity('결정 박제 시스템', '결정 박제 정합성');
  const ok1 = s1 >= 0.99 && s2 > 0.5 && s3 < 0.1 && s4 > 0.3;
  record(
    'G4-1',
    ok1,
    `identical=${s1.toFixed(3)} reorder=${s2.toFixed(3)} disjoint=${s3.toFixed(3)} ko-partial=${s4.toFixed(3)}`
  );

  // ── G4-2: cross-check unit ──────────────────────────────────────────
  const mkEntry = (id: string, axis: string): DecisionLedgerEntry =>
    ({
      id,
      date: '2026-01-01',
      session: 'session_x',
      topic: 'topic_x',
      axis,
      decision: 'd',
      authority: 'master',
      status: 'confirmed',
      owningTopicId: 'topic_x',
      scopeCheck: { isCrossTopic: false, evidence: 'n/a' },
    }) as unknown as DecisionLedgerEntry;
  const fakeOfficial: DecisionLedgerEntry[] = [
    mkEntry('D-200', 'completely unrelated quantum computing axis'),
    mkEntry('D-181', 'mtopic buffer + auto-1 silent migration'),
    mkEntry('D-300', 'mtopic buffer + auto-1 silent migration'),
  ];

  // (a) id-match
  const mA: MDecisionLedgerEntry = {
    mId: 'mD-001',
    worktreeId: wid,
    id: 'mD-001',
    date: '2026-05-13',
    session: 'session_244',
    topic: fakeMtopic,
    axis: 'D-181 supersede check',
    decision: 'pending',
    authority: 'team',
    status: 'confirmed',
    owningTopicId: fakeMtopic,
    scopeCheck: { isCrossTopic: false, evidence: 'n/a' },
    summary: 'related to D-181',
  } as unknown as MDecisionLedgerEntry;
  const rA = crossCheckMD(mA, fakeOfficial);
  const aOk =
    rA.candidates.some((c) => c.officialId === 'D-181' && c.reason === 'id-match' && c.score === 1.0) &&
    rA.recommendedAction === 'preview';

  // (b) similarity ≥ dedupe (axis 거의 동일)
  const mB: MDecisionLedgerEntry = {
    ...mA,
    mId: 'mD-002',
    id: 'mD-002',
    axis: 'mtopic buffer + auto-1 silent migration',
    summary: 'dup test',
  } as unknown as MDecisionLedgerEntry;
  const rB = crossCheckMD(mB, fakeOfficial);
  const bOk = rB.recommendedAction === 'auto-dedupe' && (rB.candidates[0]?.score ?? 0) >= 0.85;

  // (c) new-d
  const mC: MDecisionLedgerEntry = {
    ...mA,
    mId: 'mD-003',
    id: 'mD-003',
    axis: 'zzz qqq xxx vvv kkk',
    summary: 'no match',
  } as unknown as MDecisionLedgerEntry;
  const rC = crossCheckMD(mC, fakeOfficial);
  const cOk = rC.recommendedAction === 'new-d' && rC.candidates.length === 0;

  record(
    'G4-2',
    aOk && bOk && cOk,
    `id-match=${aOk}(rec=${rA.recommendedAction}) dedupe=${bOk}(rec=${rB.recommendedAction},score=${rB.candidates[0]?.score?.toFixed(3)}) new-d=${cOk}(rec=${rC.recommendedAction})`
  );

  // ── G4-3: mD↔mD 차단 (런타임 가드) ──────────────────────────────────
  const fakeMDarr = [
    { ...mA, id: 'mD-001' } as unknown as DecisionLedgerEntry,
    { ...mB, id: 'mD-002' } as unknown as DecisionLedgerEntry,
  ];
  const mTest: MDecisionLedgerEntry = {
    ...mA,
    mId: 'mD-test',
    id: 'mD-test',
    axis: 'mtopic buffer + auto-1 silent migration',
  } as unknown as MDecisionLedgerEntry;
  const rGuard = crossCheckMD(mTest, fakeMDarr);
  // 모든 후보가 'mD-' prefix 아니어야 함
  const guardOk =
    rGuard.candidates.every((c) => !c.officialId.startsWith('mD-')) &&
    rGuard.candidates.length === 0;
  record('G4-3', guardOk, `mD-prefix candidates filtered (count=${rGuard.candidates.length})`);

  // ── G4-4: migration-preview dry-run ────────────────────────────────
  // 가짜 closed mtopic 1건 생성
  const fakeTopicIndex: MTopicIndex = {
    schema: 'm_topic_index.v1',
    worktreeId: wid,
    topics: [
      {
        mtopicId: fakeMtopic,
        worktreeId: wid,
        id: fakeMtopic,
        title: 'G4 dry-run test',
        status: 'closed',
        created: '2026-05-13',
        lastUpdated: '2026-05-13',
        description: 'g4 test',
        tags: ['test'],
        closedAt: '2026-05-13T00:00:00Z',
      } as unknown as MTopicIndex['topics'][number],
    ],
    lastUpdated: '2026-05-13T00:00:00Z',
  };
  const fakeLedger: MDecisionLedger = {
    schema: 'm_decision_ledger.v1',
    worktreeId: wid,
    decisions: [
      {
        ...mA,
        mtopicId: fakeMtopic,
      } as unknown as MDecisionLedgerEntry,
    ],
  };
  atomicWriteJSON(paths.topicIndex, fakeTopicIndex);
  atomicWriteJSON(paths.decisionLedger, fakeLedger);

  const scanned = scanClosedMTopics();
  const scanFound = scanned.find((s) => s.mtopicId === fakeMtopic);

  const officialLedger = loadOfficialLedger();
  const officialPDs = loadOfficialPDs();
  const officialLedgerLenBefore = officialLedger.length;

  let preview = null;
  if (scanFound) {
    preview = buildPreview(scanFound, officialLedger, officialPDs);
  }

  // 공식 SOT 바이트 동일
  const officialAfter = officialPaths.map(snapshotFile);
  const drifted: string[] = [];
  officialPaths.forEach((p, i) => {
    if (officialSnapshots[i] !== officialAfter[i]) drifted.push(path.basename(p));
  });

  const ok4 =
    !!scanFound &&
    scanFound.mDecisions.length === 1 &&
    !!preview &&
    preview.summary.totalMD === 1 &&
    drifted.length === 0 &&
    officialLedger.length === officialLedgerLenBefore;
  record(
    'G4-4',
    ok4,
    `scanned=${scanned.length} mD=${scanFound?.mDecisions.length} preview.summary=${JSON.stringify(preview?.summary)} drifted=[${drifted.join(',')}]`
  );

  // ── G4-5: m_config.json 외부화 (하드코딩 grep) ─────────────────────
  // similarity.ts·m-cross-check.ts·migration-preview.ts 본문에 0.20, 0.85 리터럴 없어야
  const filesToScan = [
    path.join(ROOT, 'scripts', 'lib', 'similarity.ts'),
    path.join(ROOT, 'scripts', 'lib', 'm-cross-check.ts'),
    path.join(ROOT, 'scripts', 'lib', 'migration-preview.ts'),
  ];
  const violators: string[] = [];
  // 임계 리터럴 + ID 패턴 리터럴 검사
  const forbiddenPatterns = [
    /\b0\.20?\b/,           // 0.2 / 0.20
    /\b0\.85\b/,
    /D-\\d/,                // regex 리터럴 박제
    /PD-\\d/,
  ];
  for (const f of filesToScan) {
    const src = fs.readFileSync(f, 'utf8');
    // 주석 제거(단순 // ...): 라인 기반
    const stripped = src
      .split('\n')
      .filter((l) => !l.trim().startsWith('*') && !l.trim().startsWith('//'))
      .join('\n');
    for (const p of forbiddenPatterns) {
      if (p.test(stripped)) {
        violators.push(`${path.basename(f)}: ${p}`);
      }
    }
  }
  // 임계 사용 모듈만 getMConfig 의무 (m-cross-check)
  // similarity.ts: raw score만 반환(임계 미사용) / migration-preview.ts: 임계 비교를 cross-check에 위임
  const crossCheckSrc = fs.readFileSync(
    path.join(ROOT, 'scripts', 'lib', 'm-cross-check.ts'),
    'utf8'
  );
  const usesConfig = crossCheckSrc.includes('getMConfig');
  const ok5 = violators.length === 0 && usesConfig;
  record('G4-5', ok5, `violators=[${violators.join('; ')}] usesGetMConfig=${usesConfig}`);

  // ── G4-6: 공식 SOT 변경 0 (최종 확인) ──────────────────────────────
  const officialFinal = officialPaths.map(snapshotFile);
  const finalDrift: string[] = [];
  officialPaths.forEach((p, i) => {
    if (officialSnapshots[i] !== officialFinal[i]) finalDrift.push(path.basename(p));
  });
  record(
    'G4-6',
    finalDrift.length === 0,
    finalDrift.length === 0
      ? '공식 SOT 3종 P4 전후 바이트 동일'
      : `드리프트: ${finalDrift.join(', ')}`
  );

  // Bonus: getMConfig 동작 확인
  const cfg = getMConfig();
  console.log(
    `[info] m_config: previewThreshold=${cfg.similarity.previewThreshold} dedupeThreshold=${cfg.similarity.dedupeThreshold} mode=${cfg.migration.mode}`
  );
} finally {
  // cleanup: 가짜 m_* 파일 삭제
  for (const p of [paths.decisionLedger, paths.pendingDeferrals, paths.topicIndex]) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  if (fs.existsSync(paths.quarantineDir)) {
    fs.rmSync(paths.quarantineDir, { recursive: true, force: true });
  }
  // 백업 복구
  for (const b of backups) {
    if (fs.existsSync(b.backup)) fs.renameSync(b.backup, b.orig);
  }
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
