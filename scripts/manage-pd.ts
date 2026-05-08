/**
 * manage-pd.ts
 * /pd 슬래시 커맨드 백엔드. SOT: memory/shared/pending_deferrals.json
 *
 * Usage:
 *   npx ts-node scripts/manage-pd.ts list
 *   npx ts-node scripts/manage-pd.ts add "<내용> [--note=<메모>]"
 *   npx ts-node scripts/manage-pd.ts rm PD-NNN
 */

import * as fs from 'fs';
import * as path from 'path';
import { ROOT, readJson } from './lib/utils';

const PD_PATH      = path.join(ROOT, 'memory', 'shared', 'pending_deferrals.json');
const SESSION_PATH = path.join(ROOT, 'memory', 'sessions', 'current_session.json');

interface PdItem {
  id: string;
  fromSession: string;
  fromTopic: string;
  createdAt: string;
  title?: string;
  item: string;
  status: 'pending' | 'resolved';
  note?: string;
  resolveCondition?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolveNote?: string;
  dependsOn?: string[];
  relatedDecisions?: string[];
  relatedTopic?: string;
  blockers?: string[];
}

interface PdFile {
  schema: string;
  createdAt: string;
  createdBy: string;
  note: string;
  items: PdItem[];
}

interface CurrentSession {
  sessionId?: string;
  topicSlug?: string;
  topicId?: string;
  pendingDeferralsAdded?: string[];
  [k: string]: unknown;
}

function readPdFile(): PdFile {
  return readJson<PdFile>(PD_PATH, {
    schema: 'pending_deferrals.v1',
    createdAt: new Date().toISOString().slice(0, 10),
    createdBy: 'manage-pd.ts',
    note: '',
    items: [],
  });
}

function writePdFile(data: PdFile): void {
  fs.writeFileSync(PD_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(items: PdItem[]): string {
  const nums = items
    .map(p => parseInt(p.id.replace('PD-', ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `PD-${String(max + 1).padStart(3, '0')}`;
}

function cmdList(): void {
  const data = readPdFile();
  const pending = data.items.filter(i => i.status === 'pending');
  if (pending.length === 0) {
    console.log('pending PD 없음');
    return;
  }
  console.log(`\n📋 Pending Deferrals (${pending.length}건)\n`);
  for (const p of pending) {
    const title = p.title ?? p.item.slice(0, 60);
    console.log(`  ${p.id}  ${title}`);
    console.log(`         from: ${p.fromSession} / ${p.fromTopic}`);
    if (p.resolveCondition) console.log(`         resolve: ${p.resolveCondition}`);
    console.log('');
  }
}

function cmdAdd(raw: string): void {
  const noteMatch = raw.match(/--note=["']?(.+?)["']?$/);
  const note = noteMatch ? noteMatch[1] : undefined;
  const item = noteMatch ? raw.slice(0, noteMatch.index).trim() : raw.trim();

  if (!item) {
    console.error('내용을 입력하세요.');
    process.exit(1);
  }

  const data = readPdFile();
  const sess = readJson<CurrentSession>(SESSION_PATH, {});

  const id = nextId(data.items);
  const entry: PdItem = {
    id,
    fromSession: sess.sessionId ?? 'unknown',
    fromTopic: sess.topicSlug ?? 'unknown',
    createdAt: new Date().toISOString().slice(0, 10),
    item,
    status: 'pending',
    ...(note ? { note } : {}),
  };

  data.items.push(entry);
  writePdFile(data);

  // current_session 추적
  if (!Array.isArray(sess.pendingDeferralsAdded)) sess.pendingDeferralsAdded = [];
  sess.pendingDeferralsAdded.push(id);
  fs.writeFileSync(SESSION_PATH, JSON.stringify(sess, null, 2), 'utf-8');

  console.log(`PD 등록 완료: ${id} — "${item}"`);
}

function cmdRm(id: string): void {
  const upper = id.toUpperCase();
  const data = readPdFile();
  const idx = data.items.findIndex(i => i.id === upper);
  if (idx === -1) {
    console.error(`${upper} 항목을 찾을 수 없음`);
    process.exit(1);
  }
  const target = data.items[idx]!;
  target.status = 'resolved';
  target.resolvedAt = new Date().toISOString().slice(0, 10);
  const sess = readJson<CurrentSession>(SESSION_PATH, {});
  target.resolvedBy = sess.sessionId ?? 'unknown';
  writePdFile(data);
  console.log(`${upper} → resolved 처리 완료`);
}

const argv = process.argv;
const cmd = argv[2];
const rest = argv.slice(3);

if (!cmd || cmd === 'list') {
  cmdList();
} else if (cmd === 'add') {
  cmdAdd(rest.join(' '));
} else if (cmd === 'rm' || cmd === 'remove') {
  cmdRm(rest[0] ?? '');
} else {
  console.error(`알 수 없는 명령: ${cmd}. list | add | rm`);
  process.exit(1);
}
