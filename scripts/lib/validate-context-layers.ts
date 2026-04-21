/**
 * validate-context-layers.ts
 * PD-020b P1.2 — L1/L2/L3 throws-on-invalid 검증 함수.
 *
 * 호출자: session_061 L1/L2/L3 쓰기 구현부 + session_062 /open 로더.
 * 본 세션에선 타입과 규칙을 박아두기만 한다.
 */

import type {
  TurnLogEntry,
  SessionContributionFrontmatter,
  ContextBriefFrontmatter,
} from '../../src/types/context-layers';
import { L3_SIZE_LIMIT_BYTES } from '../../src/types/context-layers';

// ──────────────────────────────────────────
// 공통
// ──────────────────────────────────────────
export class ContextLayerError extends Error {
  constructor(public readonly layer: 'L1' | 'L2' | 'L3', message: string) {
    super(`[${layer}] ${message}`);
    this.name = 'ContextLayerError';
  }
}

function assertString(v: unknown, field: string, layer: 'L1' | 'L2' | 'L3'): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new ContextLayerError(layer, `${field} 누락/비문자열`);
  }
  return v;
}

// ──────────────────────────────────────────
// L1 TurnLogEntry
// ──────────────────────────────────────────
export function validateTurnLogEntry(obj: unknown, ctx?: { expectedTopicId?: string }): TurnLogEntry {
  if (!obj || typeof obj !== 'object') {
    throw new ContextLayerError('L1', 'entry가 객체가 아님');
  }
  const e = obj as Record<string, unknown>;
  assertString(e['ts'], 'ts', 'L1');
  const topicId = assertString(e['topicId'], 'topicId', 'L1');
  assertString(e['sessionId'], 'sessionId', 'L1');
  assertString(e['role'], 'role', 'L1');
  if (typeof e['turnIdx'] !== 'number') {
    throw new ContextLayerError('L1', 'turnIdx 누락/비숫자');
  }

  // RK: 토픽 전환 경계 — 기대 topicId와 일치해야 함 (호출자가 current_session.topicId 전달)
  if (ctx?.expectedTopicId && topicId !== ctx.expectedTopicId) {
    throw new ContextLayerError(
      'L1',
      `topicId 불일치: entry="${topicId}" vs expected="${ctx.expectedTopicId}" — 토픽 경계 오염 의심`,
    );
  }

  return e as unknown as TurnLogEntry;
}

// ──────────────────────────────────────────
// L2 SessionContribution
// ──────────────────────────────────────────
export function validateSessionContributionFM(obj: unknown): SessionContributionFrontmatter {
  if (!obj || typeof obj !== 'object') {
    throw new ContextLayerError('L2', 'frontmatter가 객체가 아님');
  }
  const f = obj as Record<string, unknown>;
  assertString(f['sessionId'], 'sessionId', 'L2');
  assertString(f['topicId'], 'topicId', 'L2');
  assertString(f['startedAt'], 'startedAt', 'L2');
  assertString(f['closedAt'], 'closedAt', 'L2');

  const grade = f['grade'];
  if (grade !== 'S' && grade !== 'A' && grade !== 'B' && grade !== 'C') {
    throw new ContextLayerError('L2', `grade 무효: ${String(grade)}`);
  }

  if (!Array.isArray(f['rolesInOrder'])) {
    throw new ContextLayerError('L2', 'rolesInOrder 배열 필수');
  }
  if (typeof f['turnsCount'] !== 'number') {
    throw new ContextLayerError('L2', 'turnsCount 숫자 필수');
  }
  if (!Array.isArray(f['decisionIds'])) {
    throw new ContextLayerError('L2', 'decisionIds 배열 필수');
  }

  // nextAction 필수 (Riki RK + Ace 결정)
  const nextAction = f['nextAction'];
  if (typeof nextAction !== 'string' || nextAction.trim().length === 0) {
    throw new ContextLayerError(
      'L2',
      'nextAction 누락 — Ace 종합검토에서 생성 필수 (quality 플래그 오염 원인)',
    );
  }

  return f as unknown as SessionContributionFrontmatter;
}

/** L2 Markdown 본문에 필수 섹션이 모두 있는지 검증 */
export function validateL2Body(md: string): void {
  const required = ['## Summary', '## Decisions', '## Key Findings', '## Open Issues', '## Next Action'];
  for (const sec of required) {
    if (!md.includes(sec)) {
      throw new ContextLayerError('L2', `필수 섹션 누락: "${sec}"`);
    }
  }
}

// ──────────────────────────────────────────
// L3 ContextBrief
// ──────────────────────────────────────────
export function validateContextBriefFM(obj: unknown): ContextBriefFrontmatter {
  if (!obj || typeof obj !== 'object') {
    throw new ContextLayerError('L3', 'frontmatter가 객체가 아님');
  }
  const f = obj as Record<string, unknown>;
  assertString(f['topicId'], 'topicId', 'L3');
  assertString(f['topicTitle'], 'topicTitle', 'L3');

  const phase = f['phase'];
  if (phase !== 'framing' && phase !== 'design' && phase !== 'implementation' && phase !== 'validated') {
    throw new ContextLayerError('L3', `phase 무효: ${String(phase)}`);
  }
  const grade = f['grade'];
  if (grade !== 'S' && grade !== 'A' && grade !== 'B' && grade !== 'C') {
    throw new ContextLayerError('L3', `grade 무효: ${String(grade)}`);
  }

  const hold = f['hold'];
  if (hold !== null && (typeof hold !== 'object' || hold === undefined)) {
    throw new ContextLayerError('L3', 'hold는 null 또는 {heldAt,heldAtPhase,reason}');
  }

  if (typeof f['sizeBytes'] !== 'number') {
    throw new ContextLayerError('L3', 'sizeBytes 숫자 필수');
  }
  if ((f['sizeBytes'] as number) > L3_SIZE_LIMIT_BYTES) {
    throw new ContextLayerError(
      'L3',
      `sizeBytes=${f['sizeBytes']} > ${L3_SIZE_LIMIT_BYTES} — 상한 초과, Editor 요약 압축 필요`,
    );
  }

  return f as unknown as ContextBriefFrontmatter;
}

export function validateL3Body(md: string): void {
  const required = ['## Current Phase', '## Key Anchors', '## Decisions', '## Open Issues', '## Next Action'];
  for (const sec of required) {
    if (!md.includes(sec)) {
      throw new ContextLayerError('L3', `필수 섹션 누락: "${sec}"`);
    }
  }
}
