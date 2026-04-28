/**
 * topic-status.ts
 * D-F (D-104-s130 / topic_127 P4, 2026-04-28)
 *
 * topic_index.json(SOT) + topics/{topicId}/topic_meta.json(mirror) 동시 갱신 헬퍼.
 * SOT 갱신 실패 시 mirror 갱신 중단 — 부분 갱신으로 인한 표류 방지.
 *
 * D-B status enum 7종:
 *   open | framing | design-approved | implementing | completed | suspended | cancelled
 */

import * as fs from 'fs';
import * as path from 'path';

export type TopicStatus =
  | 'open'
  | 'framing'
  | 'design-approved'
  | 'implementing'
  | 'completed'
  | 'suspended'
  | 'cancelled';

export type TopicPhase =
  | 'framing'
  | 'design'
  | 'implementation'
  | 'validated';

export interface TopicStatusUpdate {
  status?: TopicStatus;
  phase?: TopicPhase;
  hold?: string | null;
}

export interface UpdateResult {
  sotUpdated: boolean;
  mirrorUpdated: boolean;
  warnings: string[];
}

/**
 * topic_index.json(SOT)와 topics/{topicId}/topic_meta.json(mirror)를 동시 갱신.
 *
 * @param root  프로젝트 루트 경로 (절대 경로)
 * @param topicId  e.g. "topic_127"
 * @param update  변경할 필드만 포함 (partial update)
 */
export function updateTopicStatus(
  root: string,
  topicId: string,
  update: TopicStatusUpdate
): UpdateResult {
  const warnings: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const patch: Record<string, unknown> = { ...update, lastUpdated: today };

  // ── 1. SOT: memory/shared/topic_index.json ───────────────────────────────
  const indexPath = path.join(root, 'memory', 'shared', 'topic_index.json');
  let sotUpdated = false;
  let mirrorUpdated = false;

  try {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    const data: { topics: Record<string, unknown>[] } = JSON.parse(raw);
    const topic = data.topics.find((t) => t['id'] === topicId);

    if (!topic) {
      warnings.push(`SOT: topic ${topicId} not found in topic_index.json`);
      return { sotUpdated, mirrorUpdated, warnings };
    }

    Object.assign(topic, patch);
    fs.writeFileSync(indexPath, JSON.stringify(data, null, 2), 'utf-8');
    sotUpdated = true;
  } catch (e) {
    warnings.push(`SOT write failed: ${(e as Error).message}`);
    return { sotUpdated, mirrorUpdated, warnings };
  }

  // ── 2. mirror: topics/{topicId}/topic_meta.json ──────────────────────────
  const metaPath = path.join(root, 'topics', topicId, 'topic_meta.json');

  if (!fs.existsSync(metaPath)) {
    warnings.push(`mirror: ${metaPath} not found — skipping mirror update`);
    return { sotUpdated, mirrorUpdated, warnings };
  }

  try {
    const raw = fs.readFileSync(metaPath, 'utf-8');
    const meta: Record<string, unknown> = JSON.parse(raw);
    Object.assign(meta, patch);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
    mirrorUpdated = true;
  } catch (e) {
    warnings.push(`mirror write failed: ${(e as Error).message}`);
  }

  return { sotUpdated, mirrorUpdated, warnings };
}
