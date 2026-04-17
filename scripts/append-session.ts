#!/usr/bin/env ts-node
/**
 * append-session.ts
 * session_index.json에 새 세션을 안전하게 추가.
 * Edit 도구 직접 수정 금지 — 이 스크립트만 사용.
 *
 * 사용법:
 *   ts-node scripts/append-session.ts \
 *     --sessionId session_028 \
 *     --topicSlug legend-team-dashboard \
 *     --topic "legend-team Dash board" \
 *     --startedAt 2026-04-17T04:00:00.000Z \
 *     --closedAt 2026-04-17T06:00:00.000Z \
 *     [--decisions "D-027,D-028"] \
 *     [--note "메모"]
 */

import * as fs from 'fs';
import * as path from 'path';

const SESSION_INDEX_PATH = path.join(__dirname, '../memory/sessions/session_index.json');

interface SessionEntry {
  sessionId: string;
  topicSlug: string;
  topic?: string;
  startedAt: string;
  closedAt?: string | null;
  decisions?: string[];
  note?: string;
}

interface SessionIndex {
  sessions: SessionEntry[];
  lastUpdated: string;
  note?: string;
}

interface ParsedArgs {
  help?: boolean;
  sessionId?: string;
  topicSlug?: string;
  topic?: string;
  startedAt?: string;
  closedAt?: string | null;
  decisions?: string[];
  note?: string;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const parsed = new Map<string, string>();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg !== undefined && arg.startsWith('--')) {
      const next = args[i + 1];
      parsed.set(arg.slice(2), next ?? '');
      i++;
    }
  }
  if (parsed.has('help')) return { help: true };

  const result: ParsedArgs = {};
  const sessionId = parsed.get('sessionId');
  const topicSlug = parsed.get('topicSlug');
  const topic = parsed.get('topic');
  const startedAt = parsed.get('startedAt');
  const closedAt = parsed.get('closedAt');
  const decisions = parsed.get('decisions');
  const note = parsed.get('note');

  if (sessionId) result.sessionId = sessionId;
  if (topicSlug) result.topicSlug = topicSlug;
  if (topic) result.topic = topic;
  if (startedAt) result.startedAt = startedAt;
  result.closedAt = closedAt ?? null;
  if (decisions) result.decisions = decisions.split(',').map(d => d.trim());
  if (note) result.note = note;

  return result;
}

function main() {
  const args = parseArgs();

  if (args.help) {
    console.log(`
Usage: ts-node scripts/append-session.ts \\
  --sessionId <id> \\
  --topicSlug <slug> \\
  [--topic <title>] \\
  --startedAt <ISO8601> \\
  [--closedAt <ISO8601>] \\
  [--decisions "D-001,D-002"] \\
  [--note <text>]
`);
    process.exit(0);
  }

  if (!args.sessionId || !args.topicSlug || !args.startedAt) {
    console.error('❌ 필수 항목 누락: --sessionId, --topicSlug, --startedAt');
    process.exit(1);
  }

  const raw = fs.readFileSync(SESSION_INDEX_PATH, 'utf8');
  let index: SessionIndex;
  try {
    index = JSON.parse(raw);
  } catch (e) {
    console.error('❌ session_index.json 파싱 오류:', e);
    process.exit(1);
  }

  const existing = index.sessions.find(s => s.sessionId === args.sessionId);
  if (existing) {
    console.log(`⚠️  ${args.sessionId} 이미 존재. 업데이트합니다.`);
    Object.assign(existing, {
      topicSlug: args.topicSlug,
      ...(args.topic && { topic: args.topic }),
      startedAt: args.startedAt,
      closedAt: args.closedAt ?? existing.closedAt,
      ...(args.decisions && { decisions: args.decisions }),
      ...(args.note && { note: args.note }),
    });
  } else {
    const entry: SessionEntry = {
      sessionId: args.sessionId!,
      topicSlug: args.topicSlug!,
      ...(args.topic && { topic: args.topic }),
      startedAt: args.startedAt!,
      closedAt: args.closedAt ?? null,
      ...(args.decisions && { decisions: args.decisions }),
      ...(args.note && { note: args.note }),
    };
    index.sessions.push(entry);
  }

  index.lastUpdated = new Date().toISOString();
  fs.writeFileSync(SESSION_INDEX_PATH, JSON.stringify(index, null, 2), 'utf8');

  // 검증
  JSON.parse(fs.readFileSync(SESSION_INDEX_PATH, 'utf8'));
  console.log(`✅ ${args.sessionId} 기록 완료 (total: ${index.sessions.length}개)`);
}

main();
