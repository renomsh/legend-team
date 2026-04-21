/**
 * validate-schema-vs-data.ts
 * PD-020b P1.4 (GA-1) — TS 타입 정의 ↔ 실제 JSON 데이터 필드 diff 감시.
 *
 * 목적: session_058의 TopicIndexEntry 필드 누락(session_060 오픈 차단) 같은
 * type drift를 조기에 탐지. Write 지점과 타입 선언의 동기화 체크.
 *
 * 검사 대상:
 *  1. topic_index.json 각 엔트리 필드 ↔ TopicIndexEntry 인터페이스
 *  2. session_index.json 각 엔트리 turns[] ↔ Turn 인터페이스 (중복이지만 게이트용)
 *  3. current_session.json ↔ CurrentSessionTurnFields
 *
 * 사용:
 *   npx ts-node scripts/validate-schema-vs-data.ts
 */

import fs from 'fs';
import path from 'path';

const CWD = process.cwd();

interface Issue {
  file: string;
  entryId: string;
  kind: 'unknown-field' | 'missing-required' | 'type-mismatch';
  message: string;
}

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

// ──────────────────────────────────────────
// TopicIndexEntry 알려진 필드 (src/types/index.ts 동기화 대상)
// ──────────────────────────────────────────
const TOPIC_INDEX_KNOWN_FIELDS = new Set([
  'id', 'title', 'status', 'phase', 'hold', 'grade',
  'created', 'controlPath', 'reportPath', 'reportFiles',
  'published', 'outcome', 'note', 'path',
  // Legacy/migrated fields (소급 허용 — 신규 엔트리엔 쓰지 않음)
  'legacy', 'closedAt', 'sessionId', 'type',
  // TODO P1 follow-up: TopicIndexEntry 인터페이스에 정식 반영 필요
  'gradeDeclared', 'gradeActual', 'gradeMismatch', 'masterDecisions', '_migrationNote',
]);
const TOPIC_INDEX_REQUIRED = ['id', 'title', 'status', 'created'];

// ──────────────────────────────────────────
// session_index entry 알려진 필드
// ──────────────────────────────────────────
const SESSION_INDEX_KNOWN_FIELDS = new Set([
  'sessionId', 'topicSlug', 'topic', 'topicId', 'startedAt', 'closedAt',
  'cwd', 'decisions', 'agentsCompleted', 'turns', 'plannedSequence',
  'grade', 'gradeDeclared', 'gradeActual', 'gradeMismatch',
  'framingLevel', 'framingSkipped', 'legacy', 'note', 'mode',
  'reportPath', 'tokenUsage',
  // Legacy session_001~004 소급 기록 필드
  'retroactive', 'gap',
]);

// Turn 알려진 필드
const TURN_KNOWN_FIELDS = new Set([
  'role', 'turnIdx', 'phase', 'recallReason', 'splitReason', 'chars', 'segments',
]);
const TURN_REQUIRED = ['role', 'turnIdx'];

function checkEntry(
  obj: Record<string, unknown>,
  known: Set<string>,
  required: string[],
  file: string,
  entryId: string,
  issues: Issue[],
): void {
  for (const k of Object.keys(obj)) {
    if (!known.has(k)) {
      issues.push({ file, entryId, kind: 'unknown-field', message: `미등록 필드: "${k}"` });
    }
  }
  for (const r of required) {
    if (!(r in obj)) {
      issues.push({ file, entryId, kind: 'missing-required', message: `필수 필드 누락: "${r}"` });
    }
  }
}

function main(): void {
  const issues: Issue[] = [];

  // 1. topic_index
  const topicIndexPath = path.join(CWD, 'memory', 'shared', 'topic_index.json');
  const topicIndex = readJson<{ topics: Array<Record<string, unknown>> }>(topicIndexPath);
  for (const t of topicIndex.topics) {
    checkEntry(t, TOPIC_INDEX_KNOWN_FIELDS, TOPIC_INDEX_REQUIRED, 'topic_index.json', String(t['id']), issues);
  }

  // 2. session_index + turns
  const sessionIndexPath = path.join(CWD, 'memory', 'sessions', 'session_index.json');
  const sessionIndex = readJson<{ sessions: Array<Record<string, unknown>> }>(sessionIndexPath);
  for (const s of sessionIndex.sessions) {
    const sid = String(s['sessionId']);
    checkEntry(s, SESSION_INDEX_KNOWN_FIELDS, ['sessionId'], 'session_index.json', sid, issues);
    if (Array.isArray(s['turns'])) {
      (s['turns'] as Array<Record<string, unknown>>).forEach((t, i) => {
        checkEntry(t, TURN_KNOWN_FIELDS, TURN_REQUIRED, 'session_index.json', `${sid}.turns[${i}]`, issues);
      });
    }
  }

  // 3. current_session (있으면)
  const currentSessionPath = path.join(CWD, 'memory', 'sessions', 'current_session.json');
  if (fs.existsSync(currentSessionPath)) {
    const cur = readJson<Record<string, unknown>>(currentSessionPath);
    const CURRENT_KNOWN = new Set([
      ...SESSION_INDEX_KNOWN_FIELDS,
      'status', 'decisions', 'notes', 'gaps', 'masterDecisions', 'agentsCompleted',
    ]);
    checkEntry(cur, CURRENT_KNOWN, ['sessionId', 'status'], 'current_session.json', String(cur['sessionId']), issues);
    if (Array.isArray(cur['turns'])) {
      (cur['turns'] as Array<Record<string, unknown>>).forEach((t, i) => {
        checkEntry(t, TURN_KNOWN_FIELDS, TURN_REQUIRED, 'current_session.json', `turns[${i}]`, issues);
      });
    }
  }

  // 리포트
  console.log(`\n═══ Schema vs Data Drift Check ═══`);
  if (issues.length === 0) {
    console.log('✓ drift 없음');
    process.exit(0);
  }

  const byKind: Record<string, Issue[]> = {};
  for (const i of issues) {
    (byKind[i.kind] ??= []).push(i);
  }
  for (const kind of Object.keys(byKind)) {
    console.log(`\n[${kind}] ${byKind[kind]!.length}건`);
    byKind[kind]!.slice(0, 20).forEach(i => {
      console.log(`  ${i.file} :: ${i.entryId} — ${i.message}`);
    });
    if (byKind[kind]!.length > 20) {
      console.log(`  ... (+${byKind[kind]!.length - 20}건)`);
    }
  }
  console.log(`\n총 ${issues.length}건 drift 발견`);
  process.exit(1);
}

main();
