/**
 * zero-condense-marker.ts
 * PD-064 P1 (session_194, topic_167, 2026-05-05) — Zero D.Condense 마커 SOT.
 *
 * 결함 #1 (FP) root cause: 마커 키 드리프트(`session`/`topic`/`executedAt` vs `sessionId`/`topicId`/`completedAt`).
 * 해결: 표준 키를 헬퍼로 단일화. legacy migrate는 D-028 정신 보존 위해 회피하고, read 호환만 제공.
 *
 * - writeMarker(reportDir, sess, opts): canonical schema로 박제.
 * - readAndValidateMarker(reportDir, sess): legacy 키 호환 read + 스키마 검증.
 *
 * canonical schema (필수 키): sessionId, topicId, completedAt, files[]
 * legacy 호환 read: marker.sessionId || marker.session  /  marker.topicId || marker.topic  /  marker.completedAt || marker.executedAt
 *
 * Prime Directive D2 정합: 마커 존재만 신뢰 금지 — 실 페이로드 검증.
 */

import * as fs from 'fs';
import * as path from 'path';

export const MARKER_FILENAME = '_zero_condense.json';

export interface ZeroCondenseMarker {
  sessionId: string;
  topicId: string;
  completedAt: string;
  files: string[];
  refinedRoles?: string[];
  skippedRoles?: string[];
  phaseB?: {
    completedAt: string;
    ediCondensed?: string;
  };
  // 자유 추가 필드 (originalSizes, condensedSizes 등)
  [k: string]: unknown;
}

export interface MarkerReadResult {
  valid: boolean;
  reason?: string;
  /** 정규화된 canonical view — read 시 legacy 키도 흡수 */
  canonical?: Pick<ZeroCondenseMarker, 'sessionId' | 'topicId' | 'completedAt' | 'files'>;
  /** 원본 raw JSON (참고용) */
  raw?: unknown;
}

export interface MinimalSession {
  sessionId?: string;
  topicId?: string;
}

export interface WriteMarkerOptions {
  refinedRoles?: string[];
  skippedRoles?: string[];
  files?: string[];
  extra?: Record<string, unknown>;
}

/**
 * canonical schema로 마커 박제. 존재 시 덮어쓴다.
 * `files`는 디렉토리에서 자동 추출 (*.md, _zero_condense.json 제외) — opts.files로 override 가능.
 */
export function writeMarker(reportDir: string, sess: MinimalSession, opts: WriteMarkerOptions = {}): string {
  if (!sess || !sess.sessionId || !sess.topicId) {
    throw new Error('writeMarker: sess.sessionId · sess.topicId 필수');
  }
  if (!fs.existsSync(reportDir)) {
    throw new Error(`writeMarker: reportDir 부재 — ${reportDir}`);
  }

  let files = opts.files;
  if (!files) {
    try {
      files = fs.readdirSync(reportDir)
        .filter(f => f.endsWith('.md'))
        .filter(f => !f.startsWith('_'));
    } catch {
      files = [];
    }
  }

  const marker: ZeroCondenseMarker = {
    sessionId: sess.sessionId,
    topicId: sess.topicId,
    completedAt: new Date().toISOString(),
    files,
    ...(opts.refinedRoles ? { refinedRoles: opts.refinedRoles } : {}),
    ...(opts.skippedRoles ? { skippedRoles: opts.skippedRoles } : {}),
    ...(opts.extra || {}),
  };

  const markerPath = path.join(reportDir, MARKER_FILENAME);
  fs.writeFileSync(markerPath, JSON.stringify(marker, null, 2) + '\n', 'utf8');
  return markerPath;
}

/**
 * 마커 read + 검증. legacy 키(`session`/`topic`/`executedAt`) 호환.
 * 파싱 실패·세션 mismatch·필수 키 부재 시 valid=false + reason.
 */
export function readAndValidateMarker(reportDir: string, sess: MinimalSession): MarkerReadResult {
  const markerPath = path.join(reportDir, MARKER_FILENAME);
  if (!fs.existsSync(markerPath)) {
    return { valid: false, reason: `marker file not found: ${markerPath}` };
  }

  let raw: unknown;
  try {
    const text = fs.readFileSync(markerPath, 'utf8').trim();
    raw = text ? JSON.parse(text) : null;
  } catch (e) {
    return { valid: false, reason: `parseError: ${(e as Error).message}` };
  }

  if (!raw || typeof raw !== 'object') {
    return { valid: false, reason: 'marker payload empty or not an object' };
  }

  const m = raw as Record<string, unknown>;
  // legacy compat read
  const sessionId = (m.sessionId ?? m.session) as string | undefined;
  const topicId = (m.topicId ?? m.topic) as string | undefined;
  const completedAt = (m.completedAt ?? m.executedAt) as string | undefined;
  const files = Array.isArray(m.files) ? (m.files as string[]) : [];

  if (!sessionId) {
    return { valid: false, reason: 'missing sessionId (also no legacy `session` key)', raw };
  }
  if (!completedAt) {
    return { valid: false, reason: 'missing completedAt (also no legacy `executedAt` key)', raw };
  }
  if (sess.sessionId && sessionId !== sess.sessionId) {
    return {
      valid: false,
      reason: `sessionId mismatch: marker=${sessionId} expected=${sess.sessionId}`,
      raw,
    };
  }

  return {
    valid: true,
    canonical: {
      sessionId,
      topicId: topicId || '',
      completedAt,
      files,
    },
    raw,
  };
}
