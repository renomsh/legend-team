/**
 * nexus-turn-push.ts
 * D-169 / Arki rev4 §4 / session_209 P4
 *
 * Nexus(Main Claude) 직접 turns[] push 헬퍼.
 * turnPushMode = "nexus" 일 때 병렬 dispatch 완료 후 호출.
 *
 * 흐름:
 *   1. pending_turns_{sessionId}.jsonl에서 agentId 매칭 entry 조회
 *   2. __hook_origin 검증 (D1 sentinel)
 *   3. sort_key(dispatch_order) 기준 정렬
 *   4. current_session.json.turns[] 순차 push (단일 스레드 — race 없음)
 *   5. pending_turns 파일 archive 이동
 *
 * export:
 *   pushTurnsFromPending(dispatches, sessionPath?, cwd?)
 *   extractSelfScoresFromContent(content)  [옵션 B fallback]
 */

import * as fs from 'fs';
import * as path from 'path';
import { pendingTurnsPath } from './turn-push-mode';

const CWD = process.cwd();
const DEFAULT_SESSION_PATH = path.join(CWD, 'memory', 'sessions', 'current_session.json');
const HOOK_ORIGIN_SENTINEL = 'post-tool-use-task';

export interface DispatchRecord {
  role: string;
  dispatchOrder: number;          // Nexus가 dispatch한 순서 (0-based) → sort_key
  agentId?: string | null;        // tool_response.agentId (null 허용)
  toolResult?: {
    content?: Array<{ type: string; text: string }>;
    agentId?: string | null;
    [key: string]: unknown;
  };
}

export interface PendingTurnEntry {
  ts: string;
  sessionId: string;
  agentId: string | null;
  role: string;
  selfScores?: Record<string, unknown>;
  __hook_origin: string;
}

export interface PushedTurn {
  role: string;
  turnIdx: number;
  source: 'agent';
  selfScores?: Record<string, unknown>;
  sort_key: number;
}

export interface PushResult {
  pushed: PushedTurn[];
  gaps: Array<{ kind: string; role: string; detail: string }>;
  pendingArchived: boolean;
}

// ─── extractSelfScores (옵션 B fallback — SKILL.md §Nexus push 흐름) ─────

export function extractSelfScoresFromContent(
  content: Array<{ type: string; text: string }> | undefined
): Record<string, unknown> | null {
  if (!content) return null;
  const text = content
    .filter(c => c.type === 'text')
    .map(c => c.text)
    .join('\n');

  const idx = text.lastIndexOf('# self-scores');
  if (idx === -1) return null;

  const scores: Record<string, unknown> = {};
  const lines = text.slice(idx + '# self-scores'.length).split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('```') || line.startsWith('---') || /^#{1,3} /.test(line)) break;
    if (line === '') { if (Object.keys(scores).length > 0) break; continue; }
    if (line.startsWith('#')) continue;
    if (/^[A-Z][A-Z0-9_]*:/.test(line)) break;
    const m = line.match(/^([\w.-]+):\s*(.+?)(?:\s+#.*)?$/);
    if (!m) { if (Object.keys(scores).length > 0) break; continue; }
    const key = m[1]!;
    const valRaw = m[2]!.trim();
    const num = Number(valRaw);
    scores[key] = Number.isFinite(num) && /^-?\d/.test(valRaw) ? num : valRaw;
  }
  return Object.keys(scores).length > 0 ? scores : null;
}

// ─── pending_turns 읽기 ───────────────────────────────────

function readPendingEntries(pendingPath: string): PendingTurnEntry[] {
  if (!fs.existsSync(pendingPath)) return [];
  const raw = fs.readFileSync(pendingPath, 'utf8');
  const entries: PendingTurnEntry[] = [];
  for (const line of raw.split('\n').filter(l => l.trim())) {
    try { entries.push(JSON.parse(line) as PendingTurnEntry); } catch {}
  }
  return entries;
}

// ─── main push function ──────────────────────────────────

/**
 * N개 병렬 dispatch 완료 후 Nexus가 호출.
 * dispatches는 dispatch 호출 시 준비한 배열 — toolResult는 완료 후 채워넣음.
 */
export async function pushTurnsFromPending(
  dispatches: DispatchRecord[],
  sessionPath: string = DEFAULT_SESSION_PATH,
  cwd: string = CWD
): Promise<PushResult> {
  const sessRaw = fs.readFileSync(sessionPath, 'utf8');
  const sess = JSON.parse(sessRaw) as {
    sessionId?: string;
    turns?: PushedTurn[];
    gaps?: Array<unknown>;
    [key: string]: unknown;
  };

  const sessionId = sess.sessionId;
  if (!sessionId) throw new Error('current_session.sessionId 없음');

  const pendingPath = pendingTurnsPath(sessionId, cwd);
  const pendingEntries = readPendingEntries(pendingPath);

  const gaps: PushResult['gaps'] = [];
  const pushed: PushedTurn[] = [];

  // dispatch_order 기준 정렬 (sort_key = dispatch_order)
  const sorted = [...dispatches].sort((a, b) => a.dispatchOrder - b.dispatchOrder);

  const existingTurns = Array.isArray(sess.turns) ? sess.turns : [];
  let turnIdx = existingTurns.length;

  for (const dispatch of sorted) {
    const { role, dispatchOrder, agentId: dispatchAgentId, toolResult } = dispatch;

    // pending_turns에서 agentId 매칭
    const resolvedAgentId = dispatchAgentId ?? toolResult?.agentId ?? null;
    let pendingEntry: PendingTurnEntry | undefined;

    if (resolvedAgentId) {
      pendingEntry = pendingEntries.find(e => e.agentId === resolvedAgentId);
    }

    // D1 sentinel 검증
    if (pendingEntry && pendingEntry.__hook_origin !== HOOK_ORIGIN_SENTINEL) {
      gaps.push({
        kind: 'hook-origin-invalid',
        role,
        detail: `__hook_origin="${pendingEntry.__hook_origin}" ≠ "${HOOK_ORIGIN_SENTINEL}" → skip`,
      });
      pendingEntry = undefined;
    }

    // selfScores 결정: pending entry 우선, 없으면 옵션 B fallback
    let selfScores: Record<string, unknown> | undefined;
    if (pendingEntry?.selfScores) {
      selfScores = pendingEntry.selfScores;
    } else if (toolResult?.content) {
      const extracted = extractSelfScoresFromContent(
        toolResult.content as Array<{ type: string; text: string }>
      );
      if (extracted) {
        selfScores = extracted;
        if (!pendingEntry) {
          gaps.push({
            kind: 'nexus-push-missing',
            role,
            detail: `agentId=${resolvedAgentId} pending_turns entry 없음 — optionB fallback selfScores 사용`,
          });
        }
      }
    }

    const turn: PushedTurn = {
      role,
      turnIdx,
      source: 'agent',
      ...(selfScores && { selfScores }),
      sort_key: dispatchOrder,
    };

    existingTurns.push(turn);
    pushed.push(turn);
    turnIdx++;
  }

  sess.turns = existingTurns;

  // gaps 병합 (기존 gaps 보존)
  if (gaps.length > 0) {
    sess.gaps = [...(Array.isArray(sess.gaps) ? sess.gaps : []), ...gaps];
  }

  // 단일 write (단일 스레드 — race 없음)
  fs.writeFileSync(sessionPath, JSON.stringify(sess, null, 2) + '\n', 'utf8');

  // pending_turns archive (다음 세션 영향 0)
  let pendingArchived = false;
  if (fs.existsSync(pendingPath)) {
    try {
      const archiveDir = path.join(cwd, 'memory', 'sessions', 'pending_turns_archive');
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
      const archivePath = path.join(archiveDir, path.basename(pendingPath));
      fs.renameSync(pendingPath, archivePath);
      pendingArchived = true;
    } catch {}
  }

  return { pushed, gaps, pendingArchived };
}
