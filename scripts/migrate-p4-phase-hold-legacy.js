// P4 migration: topic_index phase/hold/legacy + session_index topicId backfill
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = __dirname.replace(/[\\/]scripts$/, '');
const topicIndexPath = path.join(ROOT, 'memory/shared/topic_index.json');
const sessionIndexPath = path.join(ROOT, 'memory/sessions/session_index.json');

const idx = JSON.parse(fs.readFileSync(topicIndexPath, 'utf8'));
const si = JSON.parse(fs.readFileSync(sessionIndexPath, 'utf8'));

// ── Step 1: topic_index.json 마이그레이션 ─────────────────────────────────
// phase가 없는 모든 토픽에 phase:null, hold:null, legacy:true 추가
let topicMigratedCount = 0;
for (const t of idx.topics) {
  if (t.phase === undefined) {
    t.phase = null;
    t.hold = null;
    t.legacy = true;
    topicMigratedCount++;
  }
}
idx.lastUpdated = new Date().toISOString();
fs.writeFileSync(topicIndexPath, JSON.stringify(idx, null, 2));
console.log(`[topic_index] ${topicMigratedCount}개 엔트리 마이그레이션 완료 (phase:null, hold:null, legacy:true)`);

// ── Step 2: topic_001/topic_meta.json 물리 파일 업데이트 ─────────────────
const topicMetaPath = path.join(ROOT, 'topics/topic_001/topic_meta.json');
if (fs.existsSync(topicMetaPath)) {
  const meta = JSON.parse(fs.readFileSync(topicMetaPath, 'utf8'));
  if (meta.phase === undefined) {
    meta.phase = null;
    meta.hold = null;
    meta.legacy = true;
    fs.writeFileSync(topicMetaPath, JSON.stringify(meta, null, 2));
    console.log('[topic_meta.json] topics/topic_001/topic_meta.json 업데이트 완료');
  } else {
    console.log('[topic_meta.json] topics/topic_001/topic_meta.json 이미 phase 있음 — 스킵');
  }
} else {
  console.log('[topic_meta.json] topics/topic_001/topic_meta.json 없음 — 스킵');
}

// ── Step 3: session_index topicId 백필 ───────────────────────────────────
// topic reportPath에서 slug 추출 → 룩업 맵 구성
const slugToTopicId = {};
for (const t of idx.topics) {
  if (t.reportPath) {
    const slug = t.reportPath.replace(/^reports\/\d{4}-\d{2}-\d{2}_/, '');
    if (slug) slugToTopicId[slug] = t.id;
  }
}

function extractSlug(topicSlug) {
  if (!topicSlug) return null;
  return topicSlug.replace(/^\d{4}-\d{2}-\d{2}_/, '');
}

let sessionMigratedCount = 0;
const noMatch = [];

for (const s of si.sessions) {
  if (s.topicId) continue;
  const slug = extractSlug(s.topicSlug);
  const topicId = slugToTopicId[slug];
  if (topicId) {
    s.topicId = topicId;
    sessionMigratedCount++;
  } else {
    noMatch.push({ sessionId: s.sessionId, topicSlug: s.topicSlug, slug });
  }
}

si.lastUpdated = new Date().toISOString();
fs.writeFileSync(sessionIndexPath, JSON.stringify(si, null, 2));
console.log(`[session_index] ${sessionMigratedCount}개 세션 topicId 백필 완료`);
if (noMatch.length > 0) {
  console.log(`[session_index] 매칭 실패 ${noMatch.length}개:`);
  noMatch.forEach(n => console.log('  ', n.sessionId, '|', n.topicSlug, '→', n.slug));
}
