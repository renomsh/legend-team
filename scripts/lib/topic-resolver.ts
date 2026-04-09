/**
 * lib/topic-resolver.ts — topic path resolution from topic_index.json
 */

import * as path from 'path';
import type { TopicIndex } from '../../src/types/index';
import { ROOT, readJson } from './utils';

const TOPIC_INDEX_PATH = path.join(ROOT, 'memory/shared/topic_index.json');

export interface TopicPaths {
  controlPath: string;
  reportPath: string;
}

export function resolveTopicPaths(topicId: string): TopicPaths {
  const index = readJson<TopicIndex>(TOPIC_INDEX_PATH, { topics: [], lastUpdated: '' });
  const entry = index.topics.find(t => t.id === topicId);

  return {
    controlPath: entry?.controlPath ?? `topics/${topicId}`,
    reportPath: entry?.reportPath ?? `topics/${topicId}/reports`,
  };
}

export function resolveControlPath(topicId: string): string {
  return resolveTopicPaths(topicId).controlPath;
}
