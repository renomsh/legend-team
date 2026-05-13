/**
 * atomic-write.ts — PD-079 / D-181 Phase 1
 *
 * 2-phase commit JSON writer. write-atomic.ts(.tmp 인접)와 별개로 staging 디렉토리 경유.
 *
 *   1. {dir}/.staging/{filename} 에 write
 *   2. fsync (디스크 동기화)
 *   3. rename → 최종 경로 (Windows: 같은 파일시스템 내 atomic 보장)
 *
 * 실패 시 staging 잔존 가능 — 호출측은 다음 라운드에서 동일 파일 덮어쓰기로 자동 정리.
 */

import * as fs from 'fs';
import * as path from 'path';

export function atomicWriteJSON(absPath: string, data: unknown): void {
  const dir = path.dirname(absPath);
  const filename = path.basename(absPath);
  const stagingDir = path.join(dir, '.staging');

  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  const stagingPath = path.join(stagingDir, filename);
  const content = JSON.stringify(data, null, 2) + '\n';

  // 1) write + fsync
  const fd = fs.openSync(stagingPath, 'w');
  try {
    fs.writeSync(fd, content);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }

  // 2) rename (atomic within same filesystem)
  fs.renameSync(stagingPath, absPath);

  // 3) staging dir cleanup (best-effort)
  try {
    const remaining = fs.readdirSync(stagingDir);
    if (remaining.length === 0) fs.rmdirSync(stagingDir);
  } catch {
    /* ignore */
  }
}

if (require.main === module) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: ts-node atomic-write.ts <target.json>');
    process.exit(1);
  }
  atomicWriteJSON(path.resolve(target), { smoke: true, ts: Date.now() });
  console.log(`atomicWriteJSON OK: ${target}`);
}
