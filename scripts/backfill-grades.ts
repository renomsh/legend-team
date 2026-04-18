/**
 * backfill-grades.ts
 * topic_index + session_index에 grade 필드 소급 적용
 * 기준: Size → Grade (D-031 기준)
 *   S: 12+  A: 8~11  B: 5~7  C: 4
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

function sizeToGrade(size: number): 'S' | 'A' | 'B' | 'C' {
  if (size >= 12) return 'S';
  if (size >= 8)  return 'A';
  if (size >= 5)  return 'B';
  return 'C';
}

function main() {
  const dashData = JSON.parse(fs.readFileSync(path.join(ROOT, 'memory/shared/dashboard_data.json'), 'utf8'));
  const sessionIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'memory/sessions/session_index.json'), 'utf8'));
  const topicIndex = JSON.parse(fs.readFileSync(path.join(ROOT, 'memory/shared/topic_index.json'), 'utf8'));

  // Build sessionId → size map
  const sizeMap: Record<string, number> = {};
  for (const s of dashData.sessions) {
    sizeMap[s.sessionId] = s.size ?? 4;
  }

  // Build topicSlug → max size map (토픽이 복수 세션일 경우 max)
  const slugToSize: Record<string, number> = {};
  for (const s of sessionIndex.sessions) {
    const slug = s.topicSlug;
    const size = sizeMap[s.sessionId] ?? 4;
    slugToSize[slug] = Math.max(slugToSize[slug] ?? 0, size);
  }

  // ── session_index 업데이트 ──
  let siUpdated = 0;
  for (const s of sessionIndex.sessions) {
    const size = sizeMap[s.sessionId] ?? 4;
    const gradeActual = sizeToGrade(size);
    if (!s.gradeDeclared) {
      s.gradeDeclared = gradeActual; // 소급: 선언값 = 실측값
      s.gradeActual   = gradeActual;
      s.gradeMismatch = false;
      s.framingSkipped = false; // 소급: 과거엔 모두 프레이밍 있었음
      siUpdated++;
    }
  }
  fs.writeFileSync(path.join(ROOT, 'memory/sessions/session_index.json'), JSON.stringify(sessionIndex, null, 2));
  console.log(`[backfill-grades] session_index: ${siUpdated}건 업데이트`);

  // ── topic_index 업데이트 ──
  let tiUpdated = 0;
  for (const t of topicIndex.topics) {
    if (t.grade) continue; // 이미 있으면 스킵
    // reportPath에서 slug 추출
    const slug = t.reportPath?.split('/').pop() ?? '';
    const slugKey = slug.replace(/^\d{4}-\d{2}-\d{2}_/, '');
    // 매칭 시도: 정확 또는 부분
    let size = 4;
    for (const [k, v] of Object.entries(slugToSize)) {
      if (k === slugKey || k.includes(slugKey) || slugKey.includes(k)) {
        size = v; break;
      }
    }
    t.grade = sizeToGrade(size);
    tiUpdated++;
  }
  fs.writeFileSync(path.join(ROOT, 'memory/shared/topic_index.json'), JSON.stringify(topicIndex, null, 2));
  console.log(`[backfill-grades] topic_index: ${tiUpdated}건 업데이트`);
}

main();
