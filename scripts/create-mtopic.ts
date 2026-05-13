/**
 * create-mtopic.ts — PD-079 / D-181 Phase 2
 *
 * mtopic (m_topic_index_{wid}.json 단일 파일 entry) 생성기.
 * create-topic.ts와 달리 topics/{id}/ 컨트롤플레인 디렉토리는 생성하지 않음
 * (D1: mtopic = 임시 buffer, 컨트롤플레인 풀세트 불필요).
 *
 * Usage:
 *   npx ts-node scripts/create-mtopic.ts "<title>" [slug] [grade:S|A|B|C]
 *
 * 동작:
 *   1. getWorktreeId() → wid
 *   2. mNamespacePaths(wid).topicIndex read (없으면 init)
 *   3. nextMTopicId(wid) → mtopic_NNN_W{hash}
 *   4. checkMtopicAvailable(newId) → 충돌 시 에러 종료
 *   5. entry push + compareTopicDesc 정렬
 *   6. atomicWriteJSON 저장
 *   7. stdout 발급 id
 */

import * as fs from 'fs';
import { getWorktreeId } from './lib/m-worktree-id';
import { mNamespacePaths } from './lib/m-namespace-paths';
import { nextMTopicId } from './lib/m-id-generator';
import { checkMtopicAvailable } from './lib/m-lock';
import { atomicWriteJSON } from './lib/atomic-write';
import { compareTopicDesc, slugify } from './lib/topic-create-common';
import type { MTopicIndex, MTopicIndexEntry } from './lib/m-types';

const VALID_GRADES = new Set(['S', 'A', 'B', 'C']);

function readMTopicIndex(absPath: string, wid: string): MTopicIndex {
  if (!fs.existsSync(absPath)) {
    return {
      schema: 'm_topic_index.v1',
      worktreeId: wid,
      topics: [],
      lastUpdated: new Date().toISOString(),
    };
  }
  const raw = fs.readFileSync(absPath, 'utf8').trim();
  if (!raw) {
    return {
      schema: 'm_topic_index.v1',
      worktreeId: wid,
      topics: [],
      lastUpdated: new Date().toISOString(),
    };
  }
  const parsed = JSON.parse(raw) as MTopicIndex;
  if (!Array.isArray(parsed.topics)) parsed.topics = [];
  if (!parsed.schema) parsed.schema = 'm_topic_index.v1';
  if (!parsed.worktreeId) parsed.worktreeId = wid;
  return parsed;
}

function createMtopic(title: string, explicitSlug?: string, grade?: string): void {
  const wid = getWorktreeId();
  const paths = mNamespacePaths(wid);
  const index = readMTopicIndex(paths.topicIndex, wid);

  const mtopicId = nextMTopicId(wid);

  // R-2 정합: well-formed 의도 보존. 발급된 id가 이미 다른 워크트리(또는 본 워크트리)에
  // open 상태로 존재하면 거부. R-1 hash 접미사 덕분에 cross-worktree 충돌은 거의 0.
  const availability = checkMtopicAvailable(mtopicId);
  if (!availability.available) {
    console.error(
      `Error: mtopicId ${mtopicId} already open in: ${availability.conflicts
        .map((c) => `${c.wid}(${c.status})`)
        .join(', ')}`
    );
    process.exit(2);
  }

  const now = new Date().toISOString();
  const date = now.slice(0, 10);
  const topicSlug = explicitSlug ?? slugify(title);
  const reportPath = `reports/${date}_${topicSlug}`;

  const entry: MTopicIndexEntry = {
    // MTopicIndexEntry-specific
    mtopicId,
    worktreeId: wid,
    // TopicIndexEntry compatible fields
    id: mtopicId, // mtopicId를 id로도 채워 sort/compare 유틸 재사용
    title,
    status: 'open',
    phase: 'framing',
    hold: null,
    ...(grade && VALID_GRADES.has(grade)
      ? { grade: grade as 'S' | 'A' | 'B' | 'C' }
      : {}),
    created: date,
    controlPath: null as unknown as string, // D1: mtopic은 컨트롤플레인 디렉토리 미생성
    reportPath,
    reportFiles: [],
    published: false,
  } as MTopicIndexEntry;

  // entry에 lastUpdated mirror
  (entry as MTopicIndexEntry & { lastUpdated?: string }).lastUpdated = date;

  index.topics.push(entry);

  // mtopic_NNN_W{hash} desc 정렬 — compareTopicDesc는 prefix_NNN 패턴 호환
  index.topics.sort((a, b) =>
    compareTopicDesc(a.mtopicId ?? a.id, b.mtopicId ?? b.id)
  );
  index.lastUpdated = now;

  atomicWriteJSON(paths.topicIndex, index);

  // stdout: 발급된 id를 첫 줄에 (호출측이 capture할 수 있도록)
  console.log(mtopicId);
  console.error(
    `mtopic created: ${mtopicId} — "${title}" (wid=${wid}${grade && VALID_GRADES.has(grade) ? `, grade=${grade}` : ''})`
  );
  console.error(`  m_topic_index: ${paths.topicIndex}`);
  console.error(`  reportPath: ${reportPath}`);
}

// CLI 파싱
const args = process.argv.slice(2);
const title = args[0];
const slug = args[1];
const grade = args[2]?.toUpperCase();

if (!title || title.trim().length === 0) {
  console.error(
    'Usage: ts-node scripts/create-mtopic.ts "<title>" [slug] [grade:S|A|B|C]'
  );
  process.exit(1);
}
if (grade && !VALID_GRADES.has(grade)) {
  console.error(`Warning: grade "${grade}" 무시됨 — 유효값: S, A, B, C`);
}

createMtopic(title.trim(), slug?.trim(), grade);
