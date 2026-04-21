/**
 * reclassify-topic.ts
 * D-057 — 토픽 수동 재분류 (topicType/parentTopicId 변경).
 *
 * 변경 이력은 topics/{id}/revision_history.json에 자동 append (Riki R-4 방어).
 *
 * 사용:
 *   npx ts-node scripts/reclassify-topic.ts <topicId> <topicType> [parentTopicId]
 *
 * 예:
 *   npx ts-node scripts/reclassify-topic.ts topic_044 implementation topic_030
 *   npx ts-node scripts/reclassify-topic.ts topic_012 standalone
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
const TOPIC_INDEX = path.join(ROOT, 'memory', 'shared', 'topic_index.json');

const VALID_TYPES = ['framing', 'implementation', 'standalone'];

function main() {
  const [, , topicId, topicType, parentTopicId] = process.argv;
  if (!topicId || !topicType) {
    console.error(
      'Usage: npx ts-node scripts/reclassify-topic.ts <topicId> <framing|implementation|standalone> [parentTopicId]'
    );
    process.exit(1);
  }
  if (!VALID_TYPES.includes(topicType)) {
    console.error(`Invalid topicType: ${topicType}. Must be one of ${VALID_TYPES.join('|')}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(TOPIC_INDEX, 'utf-8'));
  const topics: any[] = data.topics;
  const entry = topics.find((t) => t.id === topicId);
  if (!entry) {
    console.error(`Topic ${topicId} not found`);
    process.exit(1);
  }

  const before = {
    topicType: entry.topicType,
    parentTopicId: entry.parentTopicId,
    childTopicIds: entry.childTopicIds,
  };

  entry.topicType = topicType;
  if (parentTopicId) {
    entry.parentTopicId = parentTopicId;
    // parent의 childTopicIds에 추가 (중복 없이)
    const parent = topics.find((t) => t.id === parentTopicId);
    if (parent) {
      parent.childTopicIds = parent.childTopicIds ?? [];
      if (!parent.childTopicIds.includes(topicId)) {
        parent.childTopicIds.push(topicId);
      }
    }
  } else if (topicType === 'standalone' || topicType === 'framing') {
    entry.parentTopicId = null;
  }
  if (topicType !== 'framing' && !entry.childTopicIds) {
    entry.childTopicIds = [];
  }
  if (topicType === 'framing' && !entry.childTopicIds) {
    entry.childTopicIds = [];
  }

  fs.writeFileSync(TOPIC_INDEX, JSON.stringify(data, null, 2) + '\n');

  // revision_history 기록
  const revisionDir = path.join(ROOT, 'topics', topicId);
  if (fs.existsSync(revisionDir)) {
    const revPath = path.join(revisionDir, 'revision_history.json');
    const rev = fs.existsSync(revPath)
      ? JSON.parse(fs.readFileSync(revPath, 'utf-8'))
      : { revisions: [] };
    rev.revisions.push({
      at: new Date().toISOString(),
      op: 'reclassify',
      before,
      after: {
        topicType: entry.topicType,
        parentTopicId: entry.parentTopicId,
        childTopicIds: entry.childTopicIds,
      },
      triggeredBy: 'reclassify-topic.ts',
    });
    fs.writeFileSync(revPath, JSON.stringify(rev, null, 2) + '\n');
    console.log(`✓ revision_history updated: ${revPath}`);
  } else {
    console.log(`(warn) topics/${topicId}/ not found — revision_history skipped`);
  }

  console.log(`✓ ${topicId} reclassified`);
  console.log(`  before: ${JSON.stringify(before)}`);
  console.log(`  after:  topicType=${entry.topicType}, parentTopicId=${entry.parentTopicId ?? 'null'}`);
}

main();
