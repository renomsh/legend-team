/**
 * validate-schema-lifecycle.ts
 * D-057 — topicType/parent/child 정합성 검증기.
 * Gate G1 통과 조건: drift=0, topic_062/066 소급 결과 정합성 확보.
 *
 * 사용:
 *   npx ts-node scripts/validate-schema-lifecycle.ts
 * 종료코드: issues 0건이면 0, 그 외 1.
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
  const raw = fs.readFileSync(TOPIC_INDEX, 'utf-8');
  const data = JSON.parse(raw);
  const topics: Array<{ id: string } & TopicLifecycleFields> = data.topics.map(
    (t: any) => ({
      id: t.id,
      topicType: t.topicType,
      parentTopicId: t.parentTopicId ?? null,
      childTopicIds: t.childTopicIds ?? [],
    })
  );

  const issues = validateLifecycleSchema(topics);
  const awareCount = topics.filter((t) => t.topicType !== undefined).length;
  const legacyCount = topics.length - awareCount;

  console.log(`[validate-schema-lifecycle]`);
  console.log(`  total topics: ${topics.length}`);
  console.log(`  lifecycle-aware: ${awareCount}`);
  console.log(`  legacy (undefined): ${legacyCount}`);
  console.log(`  issues: ${issues.length}`);

  if (issues.length > 0) {
    for (const i of issues) {
      console.log(`  [${i.severity}] ${i.topicId}: ${i.issue}`);
    }
    process.exit(1);
  }
  console.log('  ✓ schema drift = 0');
}

main();
