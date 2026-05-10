#!/usr/bin/env ts-node
/**
 * set-closed-in-session.ts
 * topic_index.json의 특정 엔트리에 closedInSession 필드를 기록한다.
 * session-end-finalize.js 훅에서 호출됨.
 *
 * 사용법:
 *   npx ts-node scripts/set-closed-in-session.ts --topicId topic_103 --sessionId session_098
 *
 * 성공: exit 0
 * 실패: exit 1 + stderr 출력 (조용한 실패 금지)
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readJson, writeJson } from './lib/utils';

const TOPIC_INDEX_PATH = path.join(ROOT, 'memory', 'shared', 'topic_index.json');

interface TopicEntry {
  id: string;
  [key: string]: unknown;
  closedInSession?: string | null;
}

interface TopicIndex {
  topics: TopicEntry[];
  lastUpdated: string;
}

function parseArgs(args: string[]): { topicId: string | undefined; sessionId: string | undefined } {
  const parsed = new Map<string, string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg !== undefined && arg.startsWith('--')) {
      const next = args[i + 1];
      parsed.set(arg.slice(2), next ?? '');
      i++;
    }
  }
  return {
    topicId: parsed.get('topicId'),
    sessionId: parsed.get('sessionId'),
  };
}

export function main(args: string[] = process.argv.slice(2)): void {
  const { topicId, sessionId } = parseArgs(args);

  if (!topicId || !sessionId) {
    throw new Error('❌ 필수 인수 누락: --topicId <id> --sessionId <id>');
  }

  let index: TopicIndex;
  try {
    index = readJson<TopicIndex>(TOPIC_INDEX_PATH, { topics: [], lastUpdated: new Date().toISOString() });
  } catch (err) {
    throw new Error(`❌ topic_index.json 읽기 실패: ${(err as Error).message}`);
  }

  const entry = index.topics.find(t => t.id === topicId);
  if (!entry) {
    throw new Error(`❌ topicId not found: ${topicId}`);
  }

  entry.closedInSession = sessionId;
  index.lastUpdated = new Date().toISOString();

  try {
    writeJson(TOPIC_INDEX_PATH, index);
  } catch (err) {
    throw new Error(`❌ topic_index.json 쓰기 실패: ${(err as Error).message}`);
  }

  console.log(`✅ topic_index.json 갱신 — ${topicId}.closedInSession = "${sessionId}"`);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    process.stderr.write((e as Error).message + '\n');
    process.exit(1);
  }
}
