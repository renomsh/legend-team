/**
 * zero-condense-marker.js (CommonJS sidecar)
 * PD-064 P1 (session_194, topic_167) — .ts 헬퍼의 런타임 등가물.
 *
 * .claude/hooks/*.js (CommonJS)에서 ts-node 없이 require 가능하도록 분리.
 * SOT는 zero-condense-marker.ts. 두 파일 의미 동일 유지 의무.
 *
 * canonical schema: { sessionId, topicId, completedAt, files[] }
 * legacy compat read: marker.sessionId || marker.session  /  topicId || topic  /  completedAt || executedAt
 */

const fs = require('fs');
const path = require('path');

const MARKER_FILENAME = '_zero_condense.json';

function writeMarker(reportDir, sess, opts) {
  opts = opts || {};
  if (!sess || !sess.sessionId || !sess.topicId) {
    throw new Error('writeMarker: sess.sessionId · sess.topicId 필수');
  }
  if (!fs.existsSync(reportDir)) {
    throw new Error('writeMarker: reportDir 부재 — ' + reportDir);
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

  const marker = Object.assign(
    {
      sessionId: sess.sessionId,
      topicId: sess.topicId,
      completedAt: new Date().toISOString(),
      files,
    },
    opts.refinedRoles ? { refinedRoles: opts.refinedRoles } : {},
    opts.skippedRoles ? { skippedRoles: opts.skippedRoles } : {},
    opts.extra || {}
  );

  const markerPath = path.join(reportDir, MARKER_FILENAME);
  fs.writeFileSync(markerPath, JSON.stringify(marker, null, 2) + '\n', 'utf8');
  return markerPath;
}

function readAndValidateMarker(reportDir, sess) {
  const markerPath = path.join(reportDir, MARKER_FILENAME);
  if (!fs.existsSync(markerPath)) {
    return { valid: false, reason: 'marker file not found: ' + markerPath };
  }

  let raw;
  try {
    const text = fs.readFileSync(markerPath, 'utf8').trim();
    raw = text ? JSON.parse(text) : null;
  } catch (e) {
    return { valid: false, reason: 'parseError: ' + (e && e.message) };
  }

  if (!raw || typeof raw !== 'object') {
    return { valid: false, reason: 'marker payload empty or not an object' };
  }

  const sessionId = raw.sessionId != null ? raw.sessionId : raw.session;
  const topicId = raw.topicId != null ? raw.topicId : raw.topic;
  const completedAt = raw.completedAt != null ? raw.completedAt : raw.executedAt;
  const files = Array.isArray(raw.files) ? raw.files : [];

  if (!sessionId) {
    return { valid: false, reason: 'missing sessionId (also no legacy `session` key)', raw };
  }
  if (!completedAt) {
    return { valid: false, reason: 'missing completedAt (also no legacy `executedAt` key)', raw };
  }
  if (sess && sess.sessionId && sessionId !== sess.sessionId) {
    return {
      valid: false,
      reason: 'sessionId mismatch: marker=' + sessionId + ' expected=' + sess.sessionId,
      raw,
    };
  }

  return {
    valid: true,
    canonical: { sessionId, topicId: topicId || '', completedAt, files },
    raw,
  };
}

module.exports = { writeMarker, readAndValidateMarker, MARKER_FILENAME };
