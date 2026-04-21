/**
 * validate-topic-closure.ts
 * D-057 — Editor 역검사용: 세션 종료 시 토픽 생명주기 일관성 확인.
 *
 * 검사 항목:
 *   1) validate-schema-lifecycle 재사용 (drift 감시)
 *   2) framing 토픽인데 childTopicIds 비어있음 → warn
 *   3) implementation 토픽인데 parent가 status=completed이고 이 토픽은 open → warn
 *      (parent이 이미 closed인데 child가 남아있으면 정합성 문제)
 *
 * 종료코드: error 있으면 1, warn만이면 0.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  validateLifecycleSchema,
  TopicLifecycleFields,
} from './lib/topic-lifecycle';

const TOPIC_INDEX = path.join(
  __dirname,
  '..',
  'memory',
  'shared',
  'topic_index.json'
);

function main() {
  const data = JSON.parse(fs.readFileSync(TOPIC_INDEX, 'utf-8'));
  const topics: Array<{ id: string; status: string } & TopicLifecycleFields> =
    data.topics;

  const issues = validateLifecycleSchema(topics);
  const errors = issues.filter((i) => i.severity === 'error');
  const warns = [...issues.filter((i) => i.severity === 'warn')];

  const byId = new Map(topics.map((t) => [t.id, t]));
  for (const t of topics) {
    if (t.topicType === 'framing' && (t.childTopicIds ?? []).length === 0) {
      warns.push({
        topicId: t.id,
        issue: 'framing topic with no childTopicIds',
        severity: 'warn',
      });
    }
    if (t.topicType === 'implementation' && t.parentTopicId) {
      const parent = byId.get(t.parentTopicId);
      if (
        parent &&
        parent.status === 'completed' &&
        t.status !== 'completed' &&
        t.status !== 'closed'
      ) {
        warns.push({
          topicId: t.id,
          issue: `parent ${parent.id} already closed but this implementation topic still open`,
          severity: 'warn',
        });
      }
    }
  }

  console.log(`[validate-topic-closure]`);
  console.log(`  errors: ${errors.length}`);
  console.log(`  warns:  ${warns.length}`);
  for (const e of errors) console.log(`  [error] ${e.topicId}: ${e.issue}`);
  for (const w of warns) console.log(`  [warn]  ${w.topicId}: ${w.issue}`);
  if (errors.length > 0) process.exit(1);
  if (warns.length === 0) console.log('  ✓ closure integrity OK');
}

main();
