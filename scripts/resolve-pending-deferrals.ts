/**
 * resolve-pending-deferrals.ts
 * D-057 — PD 자동 전이 + stale 리포트 (Riki R-2 방어).
 *
 * 동작:
 *   1) system_state.json.pendingDeferrals에서 status='pending' + resolveCondition 있는 항목 수집
 *   2) 최근 종결된 토픽들의 title·outcome과 resolveCondition 자연어 매칭
 *   3) 매칭 성공 → resolved 제안 (dry-run 기본)
 *   4) 매칭 후보 0건인 PD → stale 리포트로 별도 출력
 *
 * 사용:
 *   npx ts-node scripts/resolve-pending-deferrals.ts            # dry-run
 *   npx ts-node scripts/resolve-pending-deferrals.ts --apply    # 적용
 */
import * as fs from 'fs';
import * as path from 'path';
import { matchesResolveCondition } from './lib/topic-lifecycle';

const ROOT = path.join(__dirname, '..');
const SYSTEM_STATE = path.join(ROOT, 'memory', 'shared', 'system_state.json');
const TOPIC_INDEX = path.join(ROOT, 'memory', 'shared', 'topic_index.json');

interface PD {
  id: string;
  status: string;
  item: string;
  resolveCondition?: string | null;
  resolvedInSession?: string;
  note?: string;
  [k: string]: any;
}

interface Topic {
  id: string;
  title: string;
  status: string;
  outcome?: string;
  [k: string]: any;
}

function main() {
  const apply = process.argv.includes('--apply');

  const state = JSON.parse(fs.readFileSync(SYSTEM_STATE, 'utf-8'));
  const topicIdx = JSON.parse(fs.readFileSync(TOPIC_INDEX, 'utf-8'));
  const pds: PD[] = state.pendingDeferrals ?? [];
  const completedTopics: Topic[] = (topicIdx.topics ?? []).filter(
    (t: Topic) => t.status === 'completed'
  );

  const pendingWithCondition = pds.filter(
    (p) => p.status === 'pending' && p.resolveCondition
  );
  const pendingWithoutCondition = pds.filter(
    (p) => p.status === 'pending' && !p.resolveCondition
  );

  const matches: Array<{ pd: PD; topic: Topic }> = [];
  const stale: PD[] = [];

  for (const pd of pendingWithCondition) {
    const cond = pd.resolveCondition!;
    let found: Topic | undefined;
    for (const t of completedTopics) {
      const signal = `${t.title} ${t.outcome ?? ''}`;
      if (matchesResolveCondition(cond, signal)) {
        found = t;
        break;
      }
    }
    if (found) matches.push({ pd, topic: found });
    else stale.push(pd);
  }

  console.log(`[resolve-pending-deferrals] mode=${apply ? 'APPLY' : 'dry-run'}`);
  console.log(`  total PDs: ${pds.length}`);
  console.log(`  pending + with resolveCondition: ${pendingWithCondition.length}`);
  console.log(`  pending WITHOUT resolveCondition: ${pendingWithoutCondition.length}`);
  console.log(`  matches: ${matches.length}`);
  console.log(`  stale (condition set but no match): ${stale.length}`);

  if (matches.length > 0) {
    console.log('\n  → Match proposals:');
    for (const m of matches) {
      console.log(`    ${m.pd.id} → ${m.topic.id} "${m.topic.title}"`);
      console.log(`      condition: ${m.pd.resolveCondition}`);
    }
  }

  if (stale.length > 0) {
    console.log('\n  ⚠ Stale PDs (condition set but no topic match):');
    for (const p of stale) {
      console.log(`    ${p.id}: ${p.resolveCondition}`);
    }
  }

  if (pendingWithoutCondition.length > 0) {
    console.log('\n  (info) PDs without resolveCondition — manual resolution only:');
    for (const p of pendingWithoutCondition) {
      console.log(`    ${p.id}`);
    }
  }

  if (apply && matches.length > 0) {
    for (const m of matches) {
      const pd = pds.find((p) => p.id === m.pd.id);
      if (!pd) continue;
      pd.status = 'resolved';
      pd.resolvedInSession = m.topic.id;
      if (!pd.note) pd.note = '';
      pd.note += ` [auto-resolved via resolveCondition match → ${m.topic.id}]`;
    }
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SYSTEM_STATE, JSON.stringify(state, null, 2) + '\n');
    console.log(`\n  ✓ applied: ${matches.length} PD(s) resolved`);
  } else if (!apply) {
    console.log('\n  (dry-run: no changes. Re-run with --apply to commit.)');
  }
}

main();
