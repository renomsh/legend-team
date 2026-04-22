#!/usr/bin/env ts-node
/**
 * compute-dashboard.ts
 * 대시보드 지표 계산기 → memory/shared/dashboard_data.json 출력
 *
 * Size 공식 (D-027):
 *   Size = (decisionAxes × 2) + rolesCalled + (rolesRecalled × 2) + (sessionsSpanned × 3)
 *   masterTurns 제거 — 자율성 지표는 버블 색상으로만 표현
 *
 * 사용법:
 *   ts-node scripts/compute-dashboard.ts
 */

import * as path from 'path';
import { ROOT, readJson, writeJson, appendLog } from './lib/utils';
import { Turn } from './lib/turn-types';

// ── 경로 (환경변수 오버라이드 지원 — 테스트 픽스처 주입용) ──────────────────
const SESSION_INDEX_PATH  = process.env.COMPUTE_SESSION_INDEX   ?? path.join(ROOT, 'memory', 'sessions', 'session_index.json');
const TOPIC_INDEX_PATH    = process.env.COMPUTE_TOPIC_INDEX     ?? path.join(ROOT, 'memory', 'shared', 'topic_index.json');
const DECISION_LEDGER_PATH = process.env.COMPUTE_DECISION_LEDGER ?? path.join(ROOT, 'memory', 'shared', 'decision_ledger.json');
const TOKEN_LOG_PATH      = process.env.COMPUTE_TOKEN_LOG       ?? path.join(ROOT, 'memory', 'sessions', 'token_log.json');
const FEEDBACK_LOG_PATH   = process.env.COMPUTE_FEEDBACK_LOG    ?? path.join(ROOT, 'memory', 'master', 'master_feedback_log.json');
const PROPOSAL_LOG_PATH   = process.env.COMPUTE_PROPOSAL_LOG    ?? path.join(ROOT, 'memory', 'sessions', 'proposal_log.json');
const OUTPUT_PATH         = process.env.COMPUTE_OUTPUT_PATH     ?? path.join(ROOT, 'memory', 'shared', 'dashboard_data.json');

// Sonnet 4.6 단가 ($ per 1M tokens)
const COST_PER_MTOK = { input: 3.0, output: 15.0, cache_creation: 3.75, cache_read: 0.30 };

function calcCostUSD(usage: { input_tokens: number; output_tokens: number; cache_creation_input_tokens: number; cache_read_input_tokens: number }): number {
  return (
    (usage.input_tokens * COST_PER_MTOK.input +
     usage.output_tokens * COST_PER_MTOK.output +
     usage.cache_creation_input_tokens * COST_PER_MTOK.cache_creation +
     usage.cache_read_input_tokens * COST_PER_MTOK.cache_read) / 1_000_000
  );
}

// ── 타입 ──────────────────────────────────────────────────────────────────
interface SessionIndexEntry {
  sessionId: string;
  topicSlug: string;
  topic?: string;
  startedAt: string;
  closedAt?: string | null | undefined;
  decisions?: string[];
  note?: string;
  retroactive?: boolean;
  agentsCompleted?: string[];
  masterTurns?: number;
  gradeDeclared?: 'S' | 'A' | 'B' | 'C';
  gradeActual?: 'S' | 'A' | 'B' | 'C';
  gradeMismatch?: boolean;
  framingSkipped?: boolean;
  turns?: Turn[];
  plannedSequence?: string[];
  legacy?: boolean;
}

interface TopicEntry {
  id: string;
  type?: string;
  title: string;
  status: string;
  created: string;
  masterDecisions?: string[];
  note?: string;
}

interface DecisionEntry {
  id: string;
  date: string;
  session: string;
  topic: string;
  axis: string;
}

interface TokenEntry {
  legendSessionId: string;
  capturedAt: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    messageCount: number;
    total_billable: number;
    masterTurns?: number;
  };
}

interface FeedbackEntry {
  id: string;
  date: string;
  topic: string;
  feedback: string;
  status: string;
}

interface ProposalEntry {
  id: string;
  sessionId: string;
  role: string;
  topic: string;
  summary: string;
  label: 'explicit' | 'implicit' | 'rejected' | 'deferred';
  linkedDecision?: string;
  linkedDeferral?: string;
}

interface SessionData {
  sessionId: string;
  topicSlug: string;
  topic?: string | undefined;
  startedAt: string;
  closedAt?: string | null | undefined;
  decisionCount: number;
  decisionAxes: number;
  decisions?: string[];
  rolesCalled: number;
  rolesRecalled: number;
  sessionsSpanned: number;
  size: number;
  gradeDeclared: 'S' | 'A' | 'B' | 'C';
  gradeActual: 'S' | 'A' | 'B' | 'C';
  gradeMismatch: boolean;
  framingSkipped: boolean;
  masterTurns: number;
  dataQuality: 'auto' | 'manual' | 'backfill';
  agentsCompleted?: string[];
  tokenUsage?: {
    totalBillable: number;
    cacheHitRate: number;
    messageCount: number;
  };
  adoptionRate?: number;
  sessionCostUSD?: number;
}

interface RoleFrequencyEntry {
  role: string;
  count: number;
  sessions: string[];
}

interface AlarmEntry {
  ruleId: string;
  severity: 'red' | 'yellow';
  sessionId?: string;
  description: string;
}

interface FeedbackRecurrence {
  keyword: string;
  occurrences: Array<{ date: string; feedbackId: string; summary: string }>;
}

// ── 헬퍼 ──────────────────────────────────────────────────────────────────
function computeSize(decisionAxes: number, rolesCalled: number, rolesRecalled: number, sessionsSpanned: number): number {
  return (decisionAxes * 2) + rolesCalled + (rolesRecalled * 2) + (sessionsSpanned * 3);
}

function sizeToGrade(size: number): 'S' | 'A' | 'B' | 'C' {
  if (size >= 12) return 'S';
  if (size >= 8)  return 'A';
  if (size >= 5)  return 'B';
  return 'C';
}

function countRolesRecalled(agentsCompleted: string[]): number {
  const counts = new Map<string, number>();
  for (const role of agentsCompleted) {
    counts.set(role, (counts.get(role) ?? 0) + 1);
  }
  let recalled = 0;
  for (const count of counts.values()) {
    if (count > 1) recalled += count - 1;
  }
  return recalled;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['이', '가', '은', '는', '을', '를', '의', '에', '로', '으로', '와', '과', '및', '또는', '그리고']);
  return text
    .replace(/[^\w가-힣\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.has(w))
    .slice(0, 5);
}

// ── 메인 ──────────────────────────────────────────────────────────────────
function main() {
  console.log('📊 compute-dashboard.ts 시작...');

  const sessionIndex = readJson<{ sessions: SessionIndexEntry[] }>(
    SESSION_INDEX_PATH, { sessions: [] }
  );
  const topicIndex = readJson<{ topics: TopicEntry[] }>(
    TOPIC_INDEX_PATH, { topics: [] }
  );
  const decisionLedger = readJson<{ decisions: DecisionEntry[] }>(
    DECISION_LEDGER_PATH, { decisions: [] }
  );
  const tokenLog = readJson<{ entries: TokenEntry[] }>(
    TOKEN_LOG_PATH, { entries: [] }
  );
  const feedbackLogRaw = readJson<{ feedbackLog?: FeedbackEntry[]; entries?: FeedbackEntry[] }>(
    FEEDBACK_LOG_PATH, {}
  );
  const feedbackLog = { entries: feedbackLogRaw.feedbackLog ?? feedbackLogRaw.entries ?? [] };
  const proposalLog = readJson<{ proposals: ProposalEntry[] }>(
    PROPOSAL_LOG_PATH, { proposals: [] }
  );

  // 토픽별 세션 수 (sessionsSpanned 계산용)
  const topicSlugToSessions = new Map<string, number>();
  for (const s of sessionIndex.sessions) {
    const count = topicSlugToSessions.get(s.topicSlug) ?? 0;
    topicSlugToSessions.set(s.topicSlug, count + 1);
  }

  // 토큰 맵
  const tokenMap = new Map<string, TokenEntry['usage']>();
  for (const t of tokenLog.entries) {
    tokenMap.set(t.legendSessionId, t.usage);
  }

  // 제안 맵 (sessionId → proposals)
  const proposalMap = new Map<string, ProposalEntry[]>();
  for (const p of proposalLog.proposals) {
    const list = proposalMap.get(p.sessionId) ?? [];
    list.push(p);
    proposalMap.set(p.sessionId, list);
  }

  // 세션 결정 수 + ID 배열 (decision_ledger 기준 — 권위 있는 원본)
  const sessionDecisionCount = new Map<string, number>();
  const sessionDecisionIds = new Map<string, string[]>();
  for (const d of decisionLedger.decisions) {
    const count = sessionDecisionCount.get(d.session) ?? 0;
    sessionDecisionCount.set(d.session, count + 1);
    const list = sessionDecisionIds.get(d.session) ?? [];
    list.push(d.id);
    sessionDecisionIds.set(d.session, list);
  }

  // ── 세션 데이터 계산 ────────────────────────────────────────────────────
  const AUTO_START_SESSION = 'session_027'; // Hook 자동 수집 시작
  const autoStartNum = parseInt(AUTO_START_SESSION.replace('session_', ''), 10);

  const sessions: SessionData[] = sessionIndex.sessions.map(s => {
    const sessionNum = parseInt(s.sessionId.replace('session_', ''), 10);
    const hasBackfill = s.agentsCompleted && s.agentsCompleted.length > 0 && sessionNum < autoStartNum;
    const dataQuality: 'auto' | 'manual' | 'backfill' =
      sessionNum >= autoStartNum ? 'auto' : (hasBackfill ? 'backfill' : 'manual');

    const agents = s.agentsCompleted ?? [];
    const rolesCalled = agents.length > 0 ? agents.length : 1; // 최소 1 (Ace)
    const rolesRecalled = countRolesRecalled(agents);
    const sessionsSpanned = topicSlugToSessions.get(s.topicSlug) ?? 1;
    const decisionAxes = sessionDecisionCount.get(s.sessionId)
      ?? (s.decisions?.length ?? 0);

    const size = computeSize(decisionAxes, rolesCalled, rolesRecalled, sessionsSpanned);
    const gradeActual = sizeToGrade(size);
    const gradeDeclared = (s.gradeDeclared ?? gradeActual) as 'S' | 'A' | 'B' | 'C';
    const gradeMismatch = gradeDeclared !== gradeActual;
    const framingSkipped = s.framingSkipped ?? false;

    const token = tokenMap.get(s.sessionId);
    const totalBill = token
      ? (token.total_billable ?? ((token.input_tokens||0)+(token.output_tokens||0)+(token.cache_creation_input_tokens||0)+(token.cache_read_input_tokens||0)))
      : 0;
    const tokenUsage = token && totalBill > 0 ? {
      totalBillable: totalBill,
      cacheHitRate: (token.cache_read_input_tokens || 0) / totalBill,
      messageCount: token.messageCount || 0,
    } : undefined;
    const sessionCostUSD = token && totalBill > 0
      ? parseFloat(calcCostUSD(token).toFixed(4))
      : undefined;

    const proposals = proposalMap.get(s.sessionId) ?? [];
    const adoptionRate = proposals.length > 0
      ? proposals.filter(p => p.label === 'explicit' || p.label === 'implicit').length / proposals.length
      : undefined;

    const decIds = sessionDecisionIds.get(s.sessionId) ?? s.decisions ?? [];

    return {
      sessionId: s.sessionId,
      topicSlug: s.topicSlug,
      topic: s.topic,
      startedAt: s.startedAt,
      closedAt: s.closedAt,
      decisionCount: decIds.length,
      decisionAxes,
      ...(decIds.length > 0 && { decisions: decIds }),
      rolesCalled,
      rolesRecalled,
      sessionsSpanned,
      size,
      gradeDeclared,
      gradeActual,
      gradeMismatch,
      framingSkipped,
      masterTurns: token?.masterTurns ?? s.masterTurns ?? 0,
      dataQuality,
      ...(agents.length > 0 && { agentsCompleted: agents }),
      ...(tokenUsage && { tokenUsage }),
      ...(adoptionRate !== undefined && { adoptionRate }),
      ...(sessionCostUSD !== undefined && { sessionCostUSD }),
    };
  });

  // ── grade 통계 ───────────────────────────────────────────────────────────
  const gradeCount = { S: 0, A: 0, B: 0, C: 0 };
  let gradeMismatchCount = 0;
  let framingSkippedCount = 0;
  const mismatchSessions: string[] = [];
  for (const s of sessions) {
    gradeCount[s.gradeActual]++;
    if (s.gradeMismatch) { gradeMismatchCount++; mismatchSessions.push(s.sessionId); }
    if (s.framingSkipped) framingSkippedCount++;
  }

  // ── 전체 지표 ────────────────────────────────────────────────────────────
  const totalSessions = sessions.length;
  const withMasterTurns = sessions.filter(s => s.masterTurns > 0);
  const avgMasterTurns = withMasterTurns.length > 0
    ? withMasterTurns.reduce((sum, s) => sum + s.masterTurns, 0) / withMasterTurns.length
    : 0;

  const autoSessions = sessions.filter(s => s.dataQuality === 'auto' && s.tokenUsage);
  const costSessions = sessions.filter(s => s.sessionCostUSD !== undefined);
  const totalCostUSD = parseFloat(costSessions.reduce((sum, s) => sum + (s.sessionCostUSD ?? 0), 0).toFixed(4));
  const avgCostPerSession = costSessions.length > 0
    ? parseFloat((totalCostUSD / costSessions.length).toFixed(4))
    : 0;
  const avgCacheHitRate = autoSessions.length > 0
    ? autoSessions.reduce((sum, s) => sum + (s.tokenUsage?.cacheHitRate ?? 0), 0) / autoSessions.length
    : 0;

  const withAdoption = sessions.filter(s => s.adoptionRate !== undefined);
  const avgAdoptionRate = withAdoption.length > 0
    ? withAdoption.reduce((sum, s) => sum + (s.adoptionRate ?? 0), 0) / withAdoption.length
    : 0;

  // ── 경보 (R1~R7) ─────────────────────────────────────────────────────────
  const alarms: AlarmEntry[] = [];

  for (const s of sessions) {
    // R1: Ace 과호출 (재호출 2회+)
    if (s.rolesRecalled >= 2) {
      alarms.push({ ruleId: 'R1', severity: 'yellow', sessionId: s.sessionId, description: `Ace/역할 과호출: rolesRecalled=${s.rolesRecalled}` });
    }
    // R2: Master 병목 (masterTurns > 평균 × 1.5)
    if (avgMasterTurns > 0 && s.masterTurns > avgMasterTurns * 1.5) {
      alarms.push({ ruleId: 'R2', severity: 'yellow', sessionId: s.sessionId, description: `Master 병목: masterTurns=${s.masterTurns} (avg=${avgMasterTurns.toFixed(1)})` });
    }
    // R3: 고토큰 저재활용 (캐시 히트율 50% 미만, auto 세션만)
    if (s.dataQuality === 'auto' && s.tokenUsage && s.tokenUsage.cacheHitRate < 0.5) {
      alarms.push({ ruleId: 'R3', severity: 'yellow', sessionId: s.sessionId, description: `저캐시 히트율: ${(s.tokenUsage.cacheHitRate * 100).toFixed(1)}%` });
    }
  }

  // R5: 피드백 재발 (60일 내 키워드 중복)
  const feedbackRecurrences: FeedbackRecurrence[] = [];
  const keywordMap = new Map<string, Array<{ date: string; feedbackId: string; summary: string }>>();
  for (const f of feedbackLog.entries) {
    const keywords = extractKeywords(f.feedback ?? f.topic ?? '');
    for (const kw of keywords) {
      const list = keywordMap.get(kw) ?? [];
      list.push({ date: f.date, feedbackId: f.id, summary: (f.feedback ?? '').slice(0, 60) });
      keywordMap.set(kw, list);
    }
  }
  for (const [kw, occurrences] of keywordMap.entries()) {
    if (occurrences.length >= 2) {
      feedbackRecurrences.push({ keyword: kw, occurrences });
      if (occurrences.length >= 3) {
        alarms.push({ ruleId: 'R5', severity: 'red', description: `피드백 재발: "${kw}" ${occurrences.length}회` });
      }
    }
  }

  // ── 역할 호출 빈도 집계 (Turn[] 기반, non-legacy 전용) ───────────────────
  // D-048: seen.has() 제거 — Turn[] 기반으로 재호출 포함 전체 카운트.
  // legacy:true 세션은 집계 배제 (R-6).
  const turnRoleFreqMap = new Map<string, { count: number; sessions: string[] }>();
  for (const s of sessionIndex.sessions) {
    if (s.legacy) continue;
    if (!s.turns || s.turns.length === 0) continue;
    for (const turn of s.turns) {
      const role = turn.role.toLowerCase();
      const entry = turnRoleFreqMap.get(role) ?? { count: 0, sessions: [] };
      entry.count++;
      if (!entry.sessions.includes(s.sessionId)) entry.sessions.push(s.sessionId);
      turnRoleFreqMap.set(role, entry);
    }
  }
  const roleFrequency: RoleFrequencyEntry[] = Array.from(turnRoleFreqMap.entries())
    .map(([role, data]) => ({ role, count: data.count, sessions: data.sessions }))
    .sort((a, b) => b.count - a.count);

  // ── Turn 시퀀스 (D3 sequence 대시보드용) ─────────────────────────────────
  const turnSequences = sessionIndex.sessions
    .filter(s => !s.legacy && s.turns && s.turns.length > 0)
    .map(s => ({
      sessionId: s.sessionId,
      topic: s.topic ?? s.topicSlug,
      sequence: s.turns!.map(t => ({
        role: t.role,
        phase: t.phase ?? null,
        turnIdx: t.turnIdx,
        recallReason: t.recallReason ?? null,
      })),
    }));

  // ── 출력 ─────────────────────────────────────────────────────────────────
  const output = {
    generatedAt: new Date().toISOString(),
    totalSessions,
    autoDataFrom: AUTO_START_SESSION,
    metrics: {
      avgMasterTurns: parseFloat(avgMasterTurns.toFixed(2)),
      avgCacheHitRate: parseFloat(avgCacheHitRate.toFixed(4)),
      cacheSampleSize: autoSessions.length,
      cacheSampleTotal: totalSessions,
      avgAdoptionRate: parseFloat(avgAdoptionRate.toFixed(4)),
      totalDecisions: decisionLedger.decisions.length,
      gradeDistribution: gradeCount,
      gradeMismatchCount,
      gradeMismatchSessions: mismatchSessions,
      framingSkippedCount,
      turnBasedSessions: turnSequences.length,
      totalCostUSD,
      avgCostPerSession,
      costSampleSize: costSessions.length,
    },
    sessions,
    roleFrequency,
    turnSequences,
    alarms,
    feedbackRecurrences,
  };

  writeJson(OUTPUT_PATH, output);
  appendLog('compute-dashboard', `완료 — ${totalSessions}개 세션, ${alarms.length}개 경보`);
  console.log(`✅ dashboard_data.json 생성 완료`);
  console.log(`   세션: ${totalSessions}개 | 경보: ${alarms.length}개 | 피드백 재발: ${feedbackRecurrences.length}개`);
}

main();
