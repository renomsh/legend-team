/**
 * topic-status.ts + finalize R-6 검증 시나리오
 * session_133 D grade — 2026-04-28
 *
 * S1~S4: updateTopicStatus() SOT+mirror 동시 갱신 시나리오
 * S5~S7: checkSelfScoreScale() R-6 dry-run 시나리오
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { updateTopicStatus, TopicStatus } from '../scripts/lib/topic-status';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

/** 임시 프로젝트 루트 구성 */
function makeRoot(topicId: string, topicIndex: object, metaContent?: object): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'legend-ts-'));
  const sharedDir = path.join(root, 'memory', 'shared');
  const topicDir = path.join(root, 'topics', topicId);
  fs.mkdirSync(sharedDir, { recursive: true });
  fs.mkdirSync(topicDir, { recursive: true });
  fs.writeFileSync(path.join(sharedDir, 'topic_index.json'), JSON.stringify(topicIndex, null, 2));
  if (metaContent !== undefined) {
    fs.writeFileSync(path.join(topicDir, 'topic_meta.json'), JSON.stringify(metaContent, null, 2));
  }
  return root;
}

function readIndex(root: string): { topics: Record<string, unknown>[] } {
  return JSON.parse(fs.readFileSync(path.join(root, 'memory', 'shared', 'topic_index.json'), 'utf-8'));
}

function readMeta(root: string, topicId: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(root, 'topics', topicId, 'topic_meta.json'), 'utf-8'));
}

// ─── checkSelfScoreScale 인라인 구현 (finalize 함수 재현) ───────────────────

interface Turn {
  role?: string;
  turnIdx?: number;
  selfScores?: Record<string, unknown>;
}

interface Session {
  turns?: Turn[];
  gaps?: unknown[];
}

function checkSelfScoreScale(sess: Session): { violations: number; gapAdded: boolean; log: string[] } {
  const turns: Turn[] = Array.isArray(sess.turns) ? sess.turns : [];
  const violations: { role: string; turnIdx: number; key: string; val: unknown; reason: string }[] = [];
  const logLines: string[] = [];

  for (const turn of turns) {
    if (!turn || !turn.selfScores || typeof turn.selfScores !== 'object') continue;
    for (const [key, val] of Object.entries(turn.selfScores)) {
      if (val === 'deferred' || val === null || val === undefined) continue;
      const num = Number(val);
      if (isNaN(num)) continue;
      if (num < 0 || num > 100) {
        violations.push({ role: turn.role ?? '', turnIdx: turn.turnIdx ?? -1, key, val, reason: 'out-of-range' });
      }
    }
  }

  let gapAdded = false;
  if (violations.length > 0) {
    sess.gaps = Array.isArray(sess.gaps) ? sess.gaps : [];
    sess.gaps.push({ type: 'self-score-scale-violation', count: violations.length, detail: violations });
    logLines.push(`⚠ selfScores 스케일 위반 ${violations.length}건 → gaps 박제`);
    gapAdded = true;
  } else {
    logLines.push('selfScores 스케일 검증 OK');
  }

  return { violations: violations.length, gapAdded, log: logLines };
}

// ─── S1: 정상 갱신 (status + phase 동시) ────────────────────────────────────

console.log('\nS1 — 정상 갱신 (status + phase 동시)');
{
  const topicId = 'topic_127';
  const index = { topics: [{ id: topicId, status: 'open', phase: 'framing' }] };
  const meta = { id: topicId, status: 'open', phase: 'framing' };
  const root = makeRoot(topicId, index, meta);

  const result = updateTopicStatus(root, topicId, { status: 'implementing', phase: 'implementation' });
  const updatedIndex = readIndex(root);
  const updatedMeta = readMeta(root, topicId);
  const topic = updatedIndex.topics[0]!;

  assert('sotUpdated: true', result.sotUpdated === true);
  assert('mirrorUpdated: true', result.mirrorUpdated === true);
  assert('warnings: 0건', result.warnings.length === 0);
  assert('SOT status = implementing', topic['status'] === 'implementing');
  assert('SOT phase = implementation', topic['phase'] === 'implementation');
  assert('mirror status = implementing', updatedMeta['status'] === 'implementing');
  assert('mirror phase = implementation', updatedMeta['phase'] === 'implementation');
  assert('lastUpdated 갱신됨', typeof topic['lastUpdated'] === 'string');
}

// ─── S2: topicId 없음 ─────────────────────────────────────────────────────────

console.log('\nS2 — topicId 없음 → SOT not found warning + 조기 반환');
{
  const topicId = 'topic_999';
  const index = { topics: [{ id: 'topic_127', status: 'open' }] };
  const root = makeRoot(topicId, index);

  const result = updateTopicStatus(root, topicId, { status: 'completed' });

  assert('sotUpdated: false', result.sotUpdated === false);
  assert('mirrorUpdated: false', result.mirrorUpdated === false);
  assert('warning 포함', result.warnings.some(w => w.includes('not found')));
  // SOT 변경 없음 확인
  const idx = readIndex(root);
  assert('SOT 미변경', idx.topics[0]!['status'] === 'open');
}

// ─── S3: mirror 없음 → SOT만 갱신 + warning ─────────────────────────────────

console.log('\nS3 — mirror 없음 → SOT 갱신, mirror warning');
{
  const topicId = 'topic_127';
  const index = { topics: [{ id: topicId, status: 'open' }] };
  const root = makeRoot(topicId, index); // topic_meta.json 생성 안 함

  const result = updateTopicStatus(root, topicId, { status: 'completed' });
  const idx = readIndex(root);

  assert('sotUpdated: true', result.sotUpdated === true);
  assert('mirrorUpdated: false', result.mirrorUpdated === false);
  assert('mirror warning 포함', result.warnings.some(w => w.includes('mirror')));
  assert('SOT status = completed', idx.topics[0]!['status'] === 'completed');
}

// ─── S4: status만 partial 갱신 ───────────────────────────────────────────────

console.log('\nS4 — status만 partial 갱신 (phase 미변경)');
{
  const topicId = 'topic_127';
  const index = { topics: [{ id: topicId, status: 'framing', phase: 'design' }] };
  const meta = { id: topicId, status: 'framing', phase: 'design' };
  const root = makeRoot(topicId, index, meta);

  const result = updateTopicStatus(root, topicId, { status: 'design-approved' });
  const topic = readIndex(root).topics[0]!;
  const m = readMeta(root, topicId);

  assert('sotUpdated: true', result.sotUpdated === true);
  assert('SOT status = design-approved', topic['status'] === 'design-approved');
  assert('SOT phase 유지 = design', topic['phase'] === 'design');
  assert('mirror status = design-approved', m['status'] === 'design-approved');
  assert('mirror phase 유지 = design', m['phase'] === 'design');
}

// ─── S5: R-6 정상 범위 (0~100) ───────────────────────────────────────────────

console.log('\nS5 — R-6 selfScores 정상 (0~100) → gaps 미박제');
{
  const sess: Session = {
    turns: [
      { role: 'ace', turnIdx: 0, selfScores: { gp_acc: 85, scc: 'Y', cs_cnt: 4 } },
      { role: 'dev', turnIdx: 1, selfScores: { gp_acc: 100, art_cmp: 1.0 } },
    ],
    gaps: [],
  };

  const { violations, gapAdded, log } = checkSelfScoreScale(sess);

  assert('violations: 0건', violations === 0);
  assert('gapAdded: false', gapAdded === false);
  assert('log: OK 메시지', (log[0] ?? '').includes('OK'));
  assert('sess.gaps: 빈 배열 유지', Array.isArray(sess.gaps) && sess.gaps.length === 0);
}

// ─── S6: R-6 범위 위반 (101, -1) → gaps 박제 ────────────────────────────────

console.log('\nS6 — R-6 selfScores 위반 (101, -1) → gaps 박제');
{
  const sess: Session = {
    turns: [
      { role: 'ace', turnIdx: 0, selfScores: { gp_acc: 101, art_cmp: 0.9 } },
      { role: 'riki', turnIdx: 1, selfScores: { risk_rc: -1, scc: 'Y' } },
    ],
    gaps: [],
  };

  const { violations, gapAdded, log } = checkSelfScoreScale(sess);

  assert('violations: 2건', violations === 2);
  assert('gapAdded: true', gapAdded === true);
  assert('log: 위반 메시지', (log[0] ?? '').includes('위반'));
  const g0 = (sess.gaps ?? [])[0] as Record<string, unknown> | undefined;
  assert('sess.gaps에 self-score-scale-violation 추가됨',
    Array.isArray(sess.gaps) && sess.gaps.length === 1 && g0?.['type'] === 'self-score-scale-violation'
  );
  assert('gaps count = 2', g0?.['count'] === 2);
}

// ─── S7: R-6 비숫자/deferred → 스킵 ─────────────────────────────────────────

console.log('\nS7 — R-6 deferred/Y/N/null → 스케일 검증 스킵, gaps 미박제');
{
  const sess: Session = {
    turns: [
      { role: 'edi', turnIdx: 0, selfScores: { scc: 'Y', gp_acc: 'deferred', art_cmp: null } },
      { role: 'dev', turnIdx: 1, selfScores: { scc: 'N', gap_fc: undefined } },
    ],
    gaps: [],
  };

  const { violations, gapAdded } = checkSelfScoreScale(sess);

  assert('violations: 0건', violations === 0);
  assert('gapAdded: false', gapAdded === false);
}

// ─── 결과 ─────────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`결과: ${passed + failed}건 중 ${passed} PASS, ${failed} FAIL`);
if (failed === 0) {
  console.log('✅ 전체 PASS');
} else {
  console.log('❌ FAIL 항목 있음');
  process.exit(1);
}
