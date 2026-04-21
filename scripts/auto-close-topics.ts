/**
 * auto-close-topics.ts
 * D-057 — framing 토픽 자동 종결 dry-run 2단.
 *
 * 동작:
 *   1) topic_index에서 topicType='framing' + status!=completed 스캔
 *   2) childTopicIds 모두 completed/closed면 종결 제안
 *   3) dry-run 모드(기본): 제안만 출력, 실제 변경 없음
 *   4) --apply: 제안 반영 (status: "completed", closedAt 추가)
 *
 * 저마찰 원칙: dry-run 제안 → 마스터 무응답=승인 → --apply 재호출
 * (훅 체인에서는 dry-run으로 호출, 사용자가 승인 시 --apply)
 *
 * 사용:
 *   npx ts-node scripts/auto-close-topics.ts           # dry-run
 *   npx ts-node scripts/auto-close-topics.ts --apply   # 적용
 */
import * as fs from 'fs';
import * as path from 'path';
import { canAutoClose, TopicLifecycleFields } from './lib/topic-lifecycle';

const TOPIC_INDEX = path.join(
  __dirname,
  '..',
  'memory',
  'shared',
  'topic_index.json'
);

interface TopicEntry extends TopicLifecycleFields {
  id: string;
  title: string;
  status: string;
  closedAt?: string;
  [key: string]: any;
}

interface Proposal {
  topicId: string;
  title: string;
  reason: string;
  childStatuses: Record<string, string>;
}

function main() {
  const apply = process.argv.includes('--apply');
  const raw = fs.readFileSync(TOPIC_INDEX, 'utf-8');
  const data = JSON.parse(raw);
  const topics: TopicEntry[] = data.topics;

  const statusById: Record<string, string> = {};
  for (const t of topics) statusById[t.id] = t.status;

  const proposals: Proposal[] = [];
  for (const t of topics) {
    const result = canAutoClose(t, statusById);
    if (result.eligible) {
      const childStatuses: Record<string, string> = {};
      for (const cid of t.childTopicIds ?? []) {
        childStatuses[cid] = statusById[cid] ?? 'unknown';
      }
      proposals.push({
        topicId: t.id,
        title: t.title,
        reason: result.reason,
        childStatuses,
      });
    }
  }

  console.log(`[auto-close-topics] mode=${apply ? 'APPLY' : 'dry-run'}`);
  console.log(`  proposals: ${proposals.length}`);
  if (proposals.length === 0) {
    console.log('  (no framing topics eligible for closure)');
    return;
  }

  for (const p of proposals) {
    console.log(`\n  → ${p.topicId} "${p.title}"`);
    console.log(`    reason: ${p.reason}`);
    console.log(`    children:`);
    for (const [cid, s] of Object.entries(p.childStatuses)) {
      console.log(`      ${cid}: ${s}`);
    }
  }

  if (apply) {
    const now = new Date().toISOString().slice(0, 10);
    for (const p of proposals) {
      const entry = topics.find((t) => t.id === p.topicId);
      if (!entry) continue;
      entry.status = 'completed';
      if (!entry.closedAt) entry.closedAt = now;
      if (entry.phase !== 'validated') entry.phase = 'validated';
    }
    fs.writeFileSync(TOPIC_INDEX, JSON.stringify(data, null, 2) + '\n');
    console.log(`\n  ✓ applied: ${proposals.length} topic(s) closed`);
  } else {
    console.log(
      `\n  (dry-run: no changes. Re-run with --apply to commit, or ignore to leave open.)`
    );
  }
}

main();
