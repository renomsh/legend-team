/**
 * backfill-decision-ownership.ts
 * D-055 백필: decision_ledger.json 전 엔트리에 owningTopicId + scopeCheck 추가.
 *
 * 규칙:
 * - 이미 두 필드 모두 있으면 스킵
 * - owningTopicId: session_index.topicId 역매핑 → 실패 시 topicSlug 역매핑 → null
 * - scopeCheck: 'legacy-ambiguous' (백필 기본값)
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const LEDGER_PATH = path.join(ROOT, 'memory/shared/decision_ledger.json');
const SESSION_INDEX_PATH = path.join(ROOT, 'memory/sessions/session_index.json');
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory/shared/topic_index.json');

interface LedgerEntry {
  id: string;
  session?: string;
  topic?: string;
  owningTopicId?: string | null;
  scopeCheck?: string;
  [key: string]: unknown;
}

interface SessionEntry {
  sessionId: string;
  topicId?: string;
  topicSlug?: string;
}

interface TopicEntry {
  id: string;
  controlPath?: string;
  reportPath?: string;
  [key: string]: unknown;
}

function slugFromReportPath(reportPath: string): string {
  // "reports/2026-04-21_pd-020b-context-3layer" → "pd-020b-context-3layer"
  const base = reportPath.replace(/^reports\//, '');
  return base.replace(/^\d{4}-\d{2}-\d{2}_/, '');
}

function main() {
  const ledger = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'));
  const sessionIndex = JSON.parse(fs.readFileSync(SESSION_INDEX_PATH, 'utf-8'));
  const topicIndex = JSON.parse(fs.readFileSync(TOPIC_INDEX_PATH, 'utf-8'));

  // session_id → topicId map (from session_index)
  const sessionToTopic: Record<string, string> = {};
  for (const s of sessionIndex.sessions as SessionEntry[]) {
    if (s.topicId) sessionToTopic[s.sessionId] = s.topicId;
  }

  // topicSlug → topicId map (from topic_index reportPath)
  const slugToTopic: Record<string, string> = {};
  for (const t of topicIndex.topics as TopicEntry[]) {
    if (t.reportPath) {
      const slug = slugFromReportPath(t.reportPath as string);
      slugToTopic[slug] = t.id;
    }
  }

  let skipped = 0;
  let backfilled = 0;
  let nullOwner = 0;

  for (const entry of ledger.decisions as LedgerEntry[]) {
    const hasOwner = entry.owningTopicId !== undefined;
    const hasScope = entry.scopeCheck !== undefined;

    if (hasOwner && hasScope) {
      skipped++;
      continue;
    }

    let owningTopicId: string | null = null;

    if (!hasOwner) {
      // 1. session_index 역매핑
      if (entry.session && sessionToTopic[entry.session]) {
        owningTopicId = sessionToTopic[entry.session] ?? null;
      }
      // 2. topic slug 역매핑 (session_index에 topicId 없는 경우)
      else if (entry.topic && slugToTopic[entry.topic]) {
        owningTopicId = slugToTopic[entry.topic] ?? null;
      }
      // 3. 매핑 실패 → null
      else {
        owningTopicId = null;
        nullOwner++;
      }

      entry.owningTopicId = owningTopicId;
    }

    if (!hasScope) {
      entry.scopeCheck = 'legacy-ambiguous';
    }

    backfilled++;
  }

  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf-8');

  console.log(`백필 완료:`);
  console.log(`  스킵 (이미 완료): ${skipped}`);
  console.log(`  백필: ${backfilled}`);
  console.log(`  owningTopicId=null (매핑 실패): ${nullOwner}`);
  console.log(`저장: ${LEDGER_PATH}`);
}

main();
