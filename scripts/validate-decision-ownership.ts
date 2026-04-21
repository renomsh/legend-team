/**
 * validate-decision-ownership.ts
 * D-055 게이트 A 검증: decision_ledger의 owningTopicId + scopeCheck 무결성 확인.
 *
 * 검증 항목:
 * 1. 전 엔트리 owningTopicId 존재 (null 허용, undefined 불가)
 * 2. 전 엔트리 scopeCheck 존재 + 허용값
 * 3. owningTopicId가 non-null이면 topic_index에 실존
 * 4. cross-topic이면 relatedTopics 존재
 *
 * npx ts-node scripts/validate-decision-ownership.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { ScopeCheck } from '../src/types/index';

const ROOT = path.resolve(__dirname, '..');
const LEDGER_PATH = path.join(ROOT, 'memory/shared/decision_ledger.json');
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory/shared/topic_index.json');

const VALID_SCOPE: ScopeCheck[] = ['topic-local', 'cross-topic', 'global', 'legacy-ambiguous'];

interface LedgerEntry {
  id: string;
  owningTopicId?: string | null;
  scopeCheck?: string;
  relatedTopics?: string[];
  [key: string]: unknown;
}

function main() {
  const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'));
  const topicIndex = JSON.parse(fs.readFileSync(TOPIC_INDEX_PATH, 'utf-8'));

  const topicIds = new Set<string>(topicIndex.topics.map((t: { id: string }) => t.id));

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const entry of ledger.decisions as LedgerEntry[]) {
    // 1. owningTopicId 존재 여부 (undefined 불가)
    if (entry.owningTopicId === undefined) {
      errors.push(`${entry.id}: owningTopicId missing`);
    } else if (entry.owningTopicId !== null && !topicIds.has(entry.owningTopicId)) {
      // 3. non-null owningTopicId는 topic_index에 실존해야 함
      errors.push(`${entry.id}: owningTopicId '${entry.owningTopicId}' not in topic_index`);
    }

    // 2. scopeCheck 존재 + 허용값
    if (entry.scopeCheck === undefined) {
      errors.push(`${entry.id}: scopeCheck missing`);
    } else if (!VALID_SCOPE.includes(entry.scopeCheck as ScopeCheck)) {
      errors.push(`${entry.id}: invalid scopeCheck '${entry.scopeCheck}'`);
    }

    // 4. cross-topic → relatedTopics 권고
    if (entry.scopeCheck === 'cross-topic' && (!entry.relatedTopics || entry.relatedTopics.length === 0)) {
      warnings.push(`${entry.id}: scopeCheck=cross-topic but relatedTopics missing`);
    }
  }

  if (errors.length > 0) {
    console.error('FAIL — 오류:');
    errors.forEach(e => console.error('  ✗', e));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('경고:');
    warnings.forEach(w => console.warn('  ⚠', w));
  }

  console.log(`OK — ${ledger.decisions.length}개 엔트리 검증 통과`);
  if (warnings.length > 0) console.log(`   (경고 ${warnings.length}건 — 수동 확인 권장)`);
}

main();
