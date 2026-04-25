#!/usr/bin/env ts-node
/**
 * sync-system-state.ts
 * session_index / topic_index / decision_ledger 원본을 읽어
 * memory/shared/system_state.json(fast-path)을 재계산한다.
 *
 * 자동 갱신 필드:
 *   - lastSessionId, nextSessionId (session_index 기준)
 *   - openTopics (topic_index 기준 — status in-progress | suspended)
 *   - recentDecisions (decision_ledger 최신 5개)
 *
 * 보존 필드 (수동 관리):
 *   - pendingDeferrals (Claude가 /close 시 직접 resolved 처리)
 *   - currentVersion
 *
 * 사용법:
 *   ts-node scripts/sync-system-state.ts
 */
import * as path from 'path';
import { ROOT, readJson, writeJson, appendLog } from './lib/utils';

const SESSION_INDEX_PATH = path.join(ROOT, 'memory', 'sessions', 'session_index.json');
const TOPIC_INDEX_PATH = path.join(ROOT, 'memory', 'shared', 'topic_index.json');
const DECISION_LEDGER_PATH = path.join(ROOT, 'memory', 'shared', 'decision_ledger.json');
const SYSTEM_STATE_PATH = path.join(ROOT, 'memory', 'shared', 'system_state.json');

interface SessionEntry {
  sessionId: string;
  topicSlug?: string;
  startedAt?: string;
  closedAt?: string | null;
  oneLineSummary?: string;
  decisionsAdded?: string[];
}
interface TopicEntry {
  id: string;
  title: string;
  status: string;
  reportPath?: string;
  note?: string;
}
interface DecisionEntry {
  id: string;
  date: string;
  axis: string;
  value?: string;
  session?: string;
}
interface PendingDeferral {
  id: string;
  fromSession: string;
  fromTopic?: string;
  item: string;
  status: 'pending' | 'in-progress' | 'resolved';
  note?: string;
  resolvedInSession?: string;
}
interface RecentSessionSummary {
  sessionId: string;
  topicSlug: string;
  closedAt: string;
  oneLineSummary: string;
  decisionsAdded: string[];
}

interface SystemState {
  _comment?: string;
  lastSessionId: string;
  nextSessionId: string;
  currentVersion: string;
  openTopics: Array<{ id: string; title: string; status: string; reportPath?: string; note?: string }>;
  recentDecisions: Array<{ id: string; date: string; axis: string; summary?: string }>;
  recentSessionSummaries: RecentSessionSummary[];
  pendingDeferrals: PendingDeferral[];
  lastUpdated: string;
}

function parseSessionNum(id: string): number {
  const m = id.match(/session_(\d+)/);
  return m && m[1] ? parseInt(m[1], 10) : 0;
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

function main() {
  console.log('🔄 sync-system-state.ts 시작...');

  const sessionIndex = readJson<{ sessions: SessionEntry[] }>(SESSION_INDEX_PATH, { sessions: [] });
  const topicIndex = readJson<{ topics: TopicEntry[] }>(TOPIC_INDEX_PATH, { topics: [] });
  const decisionLedger = readJson<{ decisions: DecisionEntry[] }>(DECISION_LEDGER_PATH, { decisions: [] });
  const currentState = readJson<SystemState>(SYSTEM_STATE_PATH, {
    lastSessionId: 'session_000',
    nextSessionId: 'session_001',
    currentVersion: 'v0.0.0',
    openTopics: [],
    recentDecisions: [],
    recentSessionSummaries: [],
    pendingDeferrals: [],
    lastUpdated: new Date().toISOString(),
  });

  // lastSessionId / nextSessionId
  const sessionNums = sessionIndex.sessions.map(s => parseSessionNum(s.sessionId)).filter(n => n > 0);
  const lastNum = sessionNums.length > 0 ? Math.max(...sessionNums) : 0;
  const lastSessionId = `session_${pad3(lastNum)}`;
  const nextSessionId = `session_${pad3(lastNum + 1)}`;

  // openTopics
  const openTopics = topicIndex.topics
    .filter(t => t.status === 'in-progress' || t.status === 'suspended')
    .map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      ...(t.reportPath && { reportPath: t.reportPath }),
      ...(t.note && { note: t.note }),
    }));

  // recentDecisions (최신 5개, date+id 역순)
  const sorted = [...decisionLedger.decisions].sort((a, b) => {
    const cmp = (b.date || '').localeCompare(a.date || '');
    if (cmp !== 0) return cmp;
    return b.id.localeCompare(a.id);
  });
  const recentDecisions = sorted.slice(0, 5).map(d => ({
    id: d.id,
    date: d.date,
    axis: d.axis,
    summary: d.value || d.axis,
  }));

  // recentSessionSummaries (최신 3개, closedAt 역순)
  // R-3 레거시 폴백: closedInSession 없는 항목도 topicSlug 그대로 포함 + "(레거시)" 표기
  const sessionsSortedByClose = [...sessionIndex.sessions]
    .filter(s => s.closedAt != null)
    .sort((a, b) => (b.closedAt || '').localeCompare(a.closedAt || ''));

  const summaryEligible = sessionsSortedByClose.filter(s => s.oneLineSummary != null);

  const recentSessionSummaries: RecentSessionSummary[] = summaryEligible.slice(0, 3).map(s => {
    let summary = s.oneLineSummary as string;
    // 500자 초과 시 truncate
    if (summary.length > 500) {
      console.warn(`[sync-system-state] oneLineSummary truncated for ${s.sessionId} (${summary.length} chars)`);
      summary = summary.slice(0, 497) + '…';
    }
    return {
      sessionId: s.sessionId,
      topicSlug: s.topicSlug || '(unknown)',
      closedAt: s.closedAt as string,
      oneLineSummary: summary,
      decisionsAdded: Array.isArray(s.decisionsAdded) ? s.decisionsAdded : [],
    };
  });

  const next: SystemState = {
    _comment: currentState._comment || 'fast-path 파일. /open 시 최우선 로드. 원본에서 파생됨. /close 시 재계산.',
    lastSessionId,
    nextSessionId,
    currentVersion: currentState.currentVersion,
    openTopics,
    recentDecisions,
    recentSessionSummaries,
    pendingDeferrals: currentState.pendingDeferrals || [],
    lastUpdated: new Date().toISOString(),
  };

  writeJson(SYSTEM_STATE_PATH, next);
  appendLog('sync-system-state', `lastSession=${lastSessionId} openTopics=${openTopics.length} recentDecisions=${recentDecisions.length} recentSummaries=${recentSessionSummaries.length} deferrals=${next.pendingDeferrals.length}`);
  console.log(`✅ system_state.json 갱신 — last=${lastSessionId} next=${nextSessionId} openTopics=${openTopics.length} recentSummaries=${recentSessionSummaries.length} deferrals(pending)=${next.pendingDeferrals.filter(d => d.status === 'pending').length}`);
}

main();
