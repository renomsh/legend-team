#!/usr/bin/env ts-node
/**
 * compute-growth.ts — D-060 Phase 1 MVP
 *
 * Phase 1 변경:
 *   - scoreMetric: automatic 모드 4종 구현 (L1.cumulativeLearning, L3.autonomy,
 *     dev.firstPassRate, nova.promotionRate)
 *   - resolvePendingLag: dueAtSession 도달 시 재채점 + pendingLag 제거
 *   - computeGrowth: sinceSession 기반 incremental + --backfill-sessions N 후향 집계
 *   - _phase0 마커 제거
 *
 * 설계 원칙:
 *   - datapoints append-only (과거 값 재계산 금지 → provenance 훼손 방지)
 *   - registry status=active 만 계산
 *   - incremental: sinceSession 이후만 (hook 호출 비용 상수화)
 *   - null 값도 datapoint로 기록 (data-gap 가시화)
 *
 * 사용법:
 *   npx ts-node scripts/compute-growth.ts                          # 최신 세션 1개 집계
 *   npx ts-node scripts/compute-growth.ts --since session_070      # session_070 이후 전부
 *   npx ts-node scripts/compute-growth.ts --backfill-sessions 5    # 최근 N세션 후향 집계
 *   npx ts-node scripts/compute-growth.ts --dry-run                # 기록 없이 출력만
 */

import * as path from 'path';
import * as fs from 'fs';
import { ROOT, readJson, writeJson, appendLog } from './lib/utils';

// ── 경로 ──────────────────────────────────────────────────────────────────
const REGISTRY_PATH      = path.join(ROOT, 'memory', 'shared', 'metrics_registry.json');
const RUBRIC_PATH        = path.join(ROOT, 'memory', 'shared', 'hit_rate_rubric.json');
const CLASSIFIER_PATH    = path.join(ROOT, 'memory', 'shared', 'intervention_classifier.json');
const REGIME_PATH        = path.join(ROOT, 'memory', 'shared', 'regime_markers.json');
const HEALTH_PATH        = path.join(ROOT, 'memory', 'derived', 'metric_health.json');
const OUTPUT_PATH        = path.join(ROOT, 'memory', 'derived', 'growth_metrics.json');
const SESSION_INDEX_PATH = path.join(ROOT, 'memory', 'sessions', 'session_index.json');
const DECISION_LEDGER_PATH = path.join(ROOT, 'memory', 'decision_ledger.json');
const TOPICS_DIR         = path.join(ROOT, 'topics');
const ROLES_DIR          = path.join(ROOT, 'memory', 'roles');

// ── 타입 ──────────────────────────────────────────────────────────────────
export interface MetricDef {
  id: string;
  tier: 'common' | 'signature';
  layer?: 'L1' | 'L2' | 'L3';
  role?: string;
  appliesTo?: string[];
  source: { type: string; from?: string[]; filter?: string };
  scorer: {
    mode: 'automatic' | 'consensus' | 'single';
    raters?: string[];
    rater?: string;
    rubricRef?: string;
  };
  scoringLag: number;
  windows: number[];
  normalization: 'none' | 'percentile' | 'zscore';
  formula?: string;
  status: 'active' | 'draft' | 'deprecated';
  description?: string;
}

export interface MetricsRegistry {
  schemaVersion: string;
  registryVersion: string;
  effectiveFrom: string;
  metrics: MetricDef[];
}

export interface RegimeMarker {
  id: string;
  type: string;
  startDate: string;
  sessionStart: string;
  transitionZone: number;
  label: string;
  decisionRef?: string;
}

export interface GrowthDatapoint {
  metricId: string;
  sessionId: string;
  computedAtSession: string;
  value: number | null;
  rubricVersion?: string;
  classifierVersion?: string;
  registryVersion?: string;
  regimeId?: string | null;
  inTransitionZone?: boolean;
  window?: number;
  rawInputs?: unknown;
}

export interface PendingLagEntry {
  metricId: string;
  triggerSession: string;
  dueAtSession: string;
  createdAt: string;
}

export interface GrowthMetricsOutput {
  schemaVersion: string;
  generatedAt: string;
  registryVersion: string;
  datapoints: GrowthDatapoint[];
  latestBySignature: Record<string, GrowthDatapoint[]>;
  pendingLag: PendingLagEntry[];
}

interface SessionEntry {
  sessionId: string;
  topicSlug?: string;
  topic?: string;
  startedAt?: string;
  closedAt?: string;
  agentsCompleted?: string[];
  turns?: Array<{
    role: string;
    turnIdx?: number;
    phase?: string;
    recallReason?: string;
  }>;
  grade?: string;
  note?: string;
}

interface ScorerContext {
  sessionId: string;
  window: number;
  allSessions: SessionEntry[];
  regimes: RegimeMarker[];
  registryVersion: string;
  existingDatapoints: GrowthDatapoint[];
  masterTurnsMap: Record<string, { masterTurns: number; messageCount: number }>;
}

// ── 헬퍼 ──────────────────────────────────────────────────────────────────
function sessionNum(id: string): number {
  return parseInt(id.replace('session_', ''), 10) || 0;
}

/** window 내 세션 목록 (target 포함 이전 W개) */
function windowSessions(sessions: SessionEntry[], targetId: string, w: number): SessionEntry[] {
  const targetN = sessionNum(targetId);
  return sessions
    .filter(s => sessionNum(s.sessionId) <= targetN)
    .sort((a, b) => sessionNum(b.sessionId) - sessionNum(a.sessionId))
    .slice(0, w);
}

/** lagAtSession: session_N + lag → session_(N+lag) */
function laggedSession(triggerId: string, lag: number): string {
  const n = sessionNum(triggerId);
  return `session_${String(n + lag).padStart(3, '0')}`;
}

// ── 로더 ──────────────────────────────────────────────────────────────────
export function loadRegistry(): MetricsRegistry {
  const reg = readJson<MetricsRegistry | null>(REGISTRY_PATH, null);
  if (!reg) throw new Error(`metrics_registry.json not found at ${REGISTRY_PATH}`);
  if (!Array.isArray(reg.metrics)) throw new Error('metrics_registry.json: .metrics must be an array');
  return reg;
}

export function loadRegimes(): RegimeMarker[] {
  const data = readJson<{ markers: RegimeMarker[] } | null>(REGIME_PATH, null);
  return data?.markers ?? [];
}

export function loadExistingOutput(): GrowthMetricsOutput {
  return readJson<GrowthMetricsOutput>(OUTPUT_PATH, {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    registryVersion: 'v1',
    datapoints: [],
    latestBySignature: {},
    pendingLag: [],
  });
}

function loadSessions(): SessionEntry[] {
  const idx = readJson<{ sessions: SessionEntry[] }>(SESSION_INDEX_PATH, { sessions: [] });
  return idx.sessions ?? [];
}

interface TokenEntry {
  legendSessionId?: string;
  usage?: { masterTurns?: number; messageCount?: number };
}

/** token_log.json에서 세션별 masterTurns/messageCount 맵 로드 */
export function loadMasterTurnsMap(): Record<string, { masterTurns: number; messageCount: number }> {
  const TOKEN_LOG = path.join(ROOT, 'memory', 'sessions', 'token_log.json');
  const log = readJson<{ entries?: TokenEntry[] }>(TOKEN_LOG, { entries: [] });
  const map: Record<string, { masterTurns: number; messageCount: number }> = {};
  for (const entry of log.entries ?? []) {
    const sid = entry.legendSessionId;
    if (!sid) continue;
    const mt = entry.usage?.masterTurns ?? 0;
    const mc = entry.usage?.messageCount ?? 0;
    // 동일 세션 중복 시 최신(더 큰 messageCount) 우선
    if (!map[sid] || mc > map[sid]!.messageCount) {
      map[sid] = { masterTurns: mt, messageCount: mc };
    }
  }
  return map;
}

// ── Registry 검증 ──────────────────────────────────────────────────────────
export function validateRegistry(reg: MetricsRegistry): string[] {
  const errors: string[] = [];
  const required: Array<keyof MetricDef> = ['id', 'tier', 'source', 'scorer', 'scoringLag', 'windows', 'normalization', 'status'];
  const seenIds = new Set<string>();
  for (const m of reg.metrics) {
    for (const f of required) {
      if ((m as unknown as Record<string, unknown>)[f as string] === undefined) {
        errors.push(`metric ${m.id ?? '?'}: missing required field "${f}"`);
      }
    }
    if (m.id) {
      if (seenIds.has(m.id)) errors.push(`duplicate metric id: ${m.id}`);
      seenIds.add(m.id);
    }
    if (m.scoringLag !== undefined && (m.scoringLag < 0 || !Number.isInteger(m.scoringLag))) {
      errors.push(`metric ${m.id}: scoringLag must be a non-negative integer`);
    }
    if (m.windows && !Array.isArray(m.windows)) {
      errors.push(`metric ${m.id}: windows must be an array`);
    }
  }
  return errors;
}

// ── Regime 조회 ────────────────────────────────────────────────────────────
export function resolveRegimeAt(sessionId: string, regimes: RegimeMarker[]): { id: string | null; inTransitionZone: boolean } {
  const targetNum = sessionNum(sessionId);
  if (isNaN(targetNum)) return { id: null, inTransitionZone: false };

  let current: RegimeMarker | null = null;
  let inZone = false;
  for (const r of regimes) {
    const startNum = sessionNum(r.sessionStart);
    if (isNaN(startNum)) continue;
    if (targetNum >= startNum) {
      if (!current || startNum > sessionNum(current.sessionStart)) {
        current = r;
      }
      if (targetNum < startNum + r.transitionZone) inZone = true;
    }
  }
  return { id: current?.id ?? null, inTransitionZone: inZone };
}

// ── Automatic 스코어러 구현 ────────────────────────────────────────────────

/**
 * L1.cumulativeLearning — window 내 총 role 발언 수 (누적 학습량 프록시)
 * source: turn_log(=session_index turns) + role_memory 엔트리 수
 */
function scoreL1CumulativeLearning(ctx: ScorerContext): number | null {
  const wins = windowSessions(ctx.allSessions, ctx.sessionId, ctx.window);
  let turnCount = 0;
  for (const s of wins) {
    turnCount += s.turns?.length ?? s.agentsCompleted?.length ?? 0;
  }

  // role_memory 엔트리 수는 정적(snapshot) — window 무관하게 현재 상태 반영
  let memoryEntries = 0;
  if (fs.existsSync(ROLES_DIR)) {
    for (const f of fs.readdirSync(ROLES_DIR)) {
      if (!f.endsWith('.json')) continue;
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(ROLES_DIR, f), 'utf8'));
        memoryEntries += raw.masterSelectionPatterns?.length ?? 0;
        memoryEntries += raw.evidence?.length ?? 0;
        memoryEntries += raw.learnings?.length ?? 0;
        memoryEntries += raw.patterns?.length ?? 0;
        memoryEntries += raw.hitRateHistory?.length ?? 0;
      } catch (_) { /* skip malformed */ }
    }
  }

  return turnCount + memoryEntries;
}

/**
 * L3.autonomy — 1 - (directive + corrective + override) / masterTurns
 *
 * Phase 1 proxy: intervention_classifier 태깅 미구현이므로 token_log의
 * masterTurns/messageCount를 fallback으로 사용.
 * proxy formula: 1 - masterTurns / (messageCount - masterTurns)
 *   → master turns as fraction of agent turns. 전체를 directive로 간주 (보수적 추정).
 * Phase 2에서 intervention_classifier 태깅 구현 후 정식 공식으로 교체.
 */
function scoreL3Autonomy(ctx: ScorerContext): number | null {
  const wins = windowSessions(ctx.allSessions, ctx.sessionId, ctx.window);
  let totalMasterTurns = 0;
  let totalAgentTurns = 0;
  let usableCount = 0;

  for (const s of wins) {
    const tokenData = ctx.masterTurnsMap[s.sessionId];
    if (!tokenData || tokenData.messageCount === 0) continue;
    const agentTurns = tokenData.messageCount - tokenData.masterTurns;
    if (agentTurns <= 0) continue;
    totalMasterTurns += tokenData.masterTurns;
    totalAgentTurns += agentTurns;
    usableCount++;
  }

  if (usableCount === 0 || totalAgentTurns === 0) return null;
  const ratio = totalMasterTurns / totalAgentTurns;
  return parseFloat(Math.max(0, 1 - ratio).toFixed(4));
}

/**
 * dev.firstPassRate — window 내 Dev 관여 세션 중 재호출 없는 비율
 * source: session_index turns[].recallReason 기준
 */
function scoreDevFirstPassRate(ctx: ScorerContext): number | null {
  const wins = windowSessions(ctx.allSessions, ctx.sessionId, ctx.window);
  const devSessions = wins.filter(s =>
    s.turns?.some(t => t.role === 'dev') || s.agentsCompleted?.includes('dev')
  );
  if (devSessions.length === 0) return null;

  let firstPassCount = 0;
  for (const s of devSessions) {
    const devTurns = s.turns?.filter(t => t.role === 'dev') ?? [];
    const hasRecall = devTurns.some(t => t.recallReason != null);
    if (!hasRecall) firstPassCount++;
  }
  return parseFloat((firstPassCount / devSessions.length).toFixed(4));
}

/**
 * nova.promotionRate — window 내 Nova 발언 중 decision_ledger 에 승격된 비율
 * source: speculative_options.json per topic + decision_ledger
 */
function scoreNovaPromotionRate(ctx: ScorerContext): number | null {
  const wins = windowSessions(ctx.allSessions, ctx.sessionId, ctx.window);
  const novaSessions = wins.filter(s =>
    s.turns?.some(t => t.role === 'nova') || s.agentsCompleted?.includes('nova')
  );
  if (novaSessions.length === 0) return null;

  // decision_ledger에서 Nova-originated decisions 카운트
  const ledger = readJson<{ decisions: Array<{ id: string; summary?: string; notes?: string }> }>(
    DECISION_LEDGER_PATH, { decisions: [] }
  );

  let novaOutputCount = 0;
  let promotedCount = 0;

  for (const s of novaSessions) {
    novaOutputCount++;
    // speculative_options 파일에서 Nova 출력 체크 (per-topic)
    if (s.topicSlug) {
      // topic 디렉토리에서 speculative_options.json 찾기
      const matchingTopic = fs.existsSync(TOPICS_DIR)
        ? fs.readdirSync(TOPICS_DIR).find(d => {
            const meta = readJson<{ slug?: string; topicSlug?: string }>(
              path.join(TOPICS_DIR, d, 'topic_meta.json'), {}
            );
            return meta.slug === s.topicSlug || meta.topicSlug === s.topicSlug;
          })
        : undefined;

      if (matchingTopic) {
        const specOpts = readJson<{ options?: Array<{ promotedToDecision?: string }> }>(
          path.join(TOPICS_DIR, matchingTopic, 'speculative_options.json'), {}
        );
        if (specOpts.options?.some(o => o.promotedToDecision)) promotedCount++;
      }
    }
  }

  if (novaOutputCount === 0) return null;
  return parseFloat((promotedCount / novaOutputCount).toFixed(4));
}

// ── 스코어러 분기 ──────────────────────────────────────────────────────────
export function scoreMetricForWindow(
  def: MetricDef,
  ctx: ScorerContext
): GrowthDatapoint {
  const regime = resolveRegimeAt(ctx.sessionId, ctx.regimes);
  let value: number | null = null;
  let rawInputs: unknown = undefined;

  if (def.scorer.mode === 'automatic') {
    switch (def.id) {
      case 'common.L1.cumulativeLearning':
        value = scoreL1CumulativeLearning(ctx);
        rawInputs = { window: ctx.window, source: 'turns+role_memory' };
        break;

      case 'common.L3.autonomy':
        value = scoreL3Autonomy(ctx);
        rawInputs = { window: ctx.window, source: 'token_log.masterTurns (proxy, Phase2에서 intervention_classifier로 교체 예정)' };
        break;

      case 'signature.dev.firstPassRate':
        value = scoreDevFirstPassRate(ctx);
        rawInputs = { window: ctx.window, source: 'turns.recallReason' };
        break;

      case 'signature.nova.promotionRate':
        value = scoreNovaPromotionRate(ctx);
        rawInputs = { window: ctx.window, source: 'speculative_options+decision_ledger' };
        break;

      case 'signature.arki.structuralLifespan':
        // 10-session lag + redesign detection 미구현 → Phase 2
        value = null;
        rawInputs = { reason: 'redesign-detection-not-implemented', phase: 'Phase2' };
        break;

      case 'signature.fin.costForecastAccuracy':
        // Fin 예측 미기록 → Phase 2
        value = null;
        rawInputs = { reason: 'fin-forecast-not-recorded', phase: 'Phase2' };
        break;

      case 'signature.vera.masterRevisionInv':
        // master_feedback_log에 Vera 항목 거의 없음 → Phase 2
        value = null;
        rawInputs = { reason: 'vera-feedback-insufficient', phase: 'Phase2' };
        break;

      default:
        value = null;
        rawInputs = { reason: 'unknown-metric-id' };
    }
  } else {
    // consensus / single — live scoring 필요, 자동화 불가
    value = null;
    rawInputs = { reason: `mode=${def.scorer.mode}-requires-live-input` };
  }

  return {
    metricId: def.id,
    sessionId: ctx.sessionId,
    computedAtSession: ctx.sessionId,
    value,
    registryVersion: ctx.registryVersion,
    regimeId: regime.id,
    inTransitionZone: regime.inTransitionZone,
    window: ctx.window,
    rawInputs,
  };
}

/** Phase 1 호환 래퍼 — 모든 window에 대해 scoreMetricForWindow 호출 */
export function scoreMetric(
  def: MetricDef,
  sessionId: string,
  allSessions: SessionEntry[],
  regimes: RegimeMarker[],
  registryVersion: string,
  existingDatapoints: GrowthDatapoint[],
  masterTurnsMap: Record<string, { masterTurns: number; messageCount: number }> = {}
): GrowthDatapoint[] {
  return def.windows.map(w =>
    scoreMetricForWindow(def, { sessionId, window: w, allSessions, regimes, registryVersion, existingDatapoints, masterTurnsMap })
  );
}

// ── Lag 큐 처리 ────────────────────────────────────────────────────────────
export function resolvePendingLag(
  output: GrowthMetricsOutput,
  currentSession: string,
  registry: MetricsRegistry,
  allSessions: SessionEntry[],
  regimes: RegimeMarker[],
  masterTurnsMap: Record<string, { masterTurns: number; messageCount: number }> = {}
): { resolved: GrowthDatapoint[]; remaining: PendingLagEntry[] } {
  const resolved: GrowthDatapoint[] = [];
  const remaining: PendingLagEntry[] = [];
  const currentN = sessionNum(currentSession);

  for (const entry of output.pendingLag) {
    const dueN = sessionNum(entry.dueAtSession);
    if (currentN >= dueN) {
      // 만기 도달 — 재채점
      const def = registry.metrics.find(m => m.id === entry.metricId && m.status === 'active');
      if (def) {
        const datapoints = scoreMetric(
          def, entry.triggerSession, allSessions, regimes, registry.registryVersion, output.datapoints, masterTurnsMap
        );
        for (const dp of datapoints) {
          resolved.push({
            ...dp,
            computedAtSession: currentSession, // 실제 채점 세션
          });
        }
      }
    } else {
      remaining.push(entry);
    }
  }
  return { resolved, remaining };
}

// ── latestBySignature 재계산 ───────────────────────────────────────────────
function rebuildLatestBySignature(datapoints: GrowthDatapoint[]): Record<string, GrowthDatapoint[]> {
  const result: Record<string, GrowthDatapoint[]> = {};
  for (const dp of datapoints) {
    if (!dp.metricId.startsWith('signature.')) continue;
    if (!result[dp.metricId]) result[dp.metricId] = [];
    result[dp.metricId]!.push(dp);
  }
  // 각 metric 내 최신 N 개만 유지 (window=20 기준 최신 10개)
  for (const key of Object.keys(result)) {
    result[key] = (result[key] ?? [])
      .sort((a, b) => sessionNum(b.sessionId) - sessionNum(a.sessionId))
      .slice(0, 10);
  }
  return result;
}

// ── metric_health.json 업데이트 ────────────────────────────────────────────
function updateMetricHealth(
  registry: MetricsRegistry,
  datapoints: GrowthDatapoint[],
  currentSession: string
): void {
  const health: Record<string, unknown> = {};
  for (const m of registry.metrics.filter(m => m.status === 'active')) {
    const myDps = datapoints.filter(d => d.metricId === m.id);
    const nonNull = myDps.filter(d => d.value !== null);
    health[m.id] = {
      totalDatapoints: myDps.length,
      nonNullDatapoints: nonNull.length,
      lastComputedSession: myDps
        .sort((a, b) => sessionNum(b.computedAtSession) - sessionNum(a.computedAtSession))[0]
        ?.computedAtSession ?? null,
      status: nonNull.length > 0 ? 'ok' : 'data-gap',
    };
  }
  writeJson(HEALTH_PATH, {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    computedAtSession: currentSession,
    metrics: health,
  });
}

// ── 엔트리포인트 ──────────────────────────────────────────────────────────
export interface ComputeOpts {
  sinceSession?: string;
  backfillSessions?: number;
  dryRun?: boolean;
}

export async function computeGrowth(opts: ComputeOpts = {}): Promise<GrowthMetricsOutput> {
  const registry = loadRegistry();
  const errors = validateRegistry(registry);
  if (errors.length > 0) {
    throw new Error(`metrics_registry validation failed:\n  - ${errors.join('\n  - ')}`);
  }

  const regimes = loadRegimes();
  const allSessions = loadSessions();
  const existing = loadExistingOutput();
  const masterTurnsMap = loadMasterTurnsMap();

  const activeMetrics = registry.metrics.filter(m => m.status === 'active');

  // 집계할 세션 목록 결정
  let targetSessions: SessionEntry[] = [];
  if (opts.backfillSessions && opts.backfillSessions > 0) {
    // 후향 집계: 최근 N 세션
    targetSessions = allSessions
      .sort((a, b) => sessionNum(b.sessionId) - sessionNum(a.sessionId))
      .slice(0, opts.backfillSessions)
      .reverse();
  } else if (opts.sinceSession) {
    const sinceN = sessionNum(opts.sinceSession);
    targetSessions = allSessions
      .filter(s => sessionNum(s.sessionId) >= sinceN)
      .sort((a, b) => sessionNum(a.sessionId) - sessionNum(b.sessionId));
  } else {
    // 기본: 이미 집계된 세션 이후 새 세션만
    const computedIds = new Set(existing.datapoints.map(d => d.computedAtSession));
    const latestComputed = Math.max(0, ...[...computedIds].map(sessionNum));
    targetSessions = allSessions
      .filter(s => sessionNum(s.sessionId) > latestComputed)
      .sort((a, b) => sessionNum(a.sessionId) - sessionNum(b.sessionId));
    if (targetSessions.length === 0) {
      // 새 세션 없으면 마지막 세션만 재계산
      const latest = allSessions.sort((a, b) => sessionNum(b.sessionId) - sessionNum(a.sessionId))[0];
      if (latest) targetSessions = [latest];
    }
  }

  // 중복 방지: 이미 집계된 (sessionId, metricId, window) 조합 체크
  const computedKey = (dp: GrowthDatapoint) => `${dp.sessionId}|${dp.metricId}|${dp.window ?? 0}`;
  const existingKeys = new Set(existing.datapoints.map(computedKey));

  const newDatapoints: GrowthDatapoint[] = [];

  for (const session of targetSessions) {
    // lag 큐 처리 먼저
    const { resolved, remaining } = resolvePendingLag(
      { ...existing, pendingLag: existing.pendingLag },
      session.sessionId,
      registry,
      allSessions,
      regimes,
      masterTurnsMap
    );
    existing.pendingLag = remaining;
    for (const dp of resolved) {
      const k = computedKey(dp);
      if (!existingKeys.has(k)) {
        newDatapoints.push(dp);
        existingKeys.add(k);
      }
    }

    // 각 metric 스코어링
    for (const def of activeMetrics) {
      const dps = scoreMetric(
        def, session.sessionId, allSessions, regimes, registry.registryVersion, existing.datapoints, masterTurnsMap
      );

      for (const dp of dps) {
        const k = computedKey(dp);
        if (existingKeys.has(k)) continue; // 이미 계산됨

        if (def.scoringLag > 0) {
          // lag 있는 metric → pendingLag 큐에 추가 (자동 모드만 가능)
          if (def.scorer.mode === 'automatic') {
            const due = laggedSession(session.sessionId, def.scoringLag);
            const alreadyQueued = existing.pendingLag.some(
              p => p.metricId === def.id && p.triggerSession === session.sessionId
            );
            if (!alreadyQueued) {
              existing.pendingLag.push({
                metricId: def.id,
                triggerSession: session.sessionId,
                dueAtSession: due,
                createdAt: new Date().toISOString(),
              });
            }
          }
          // lag=0이 아닌 경우: lag 해소 시 채점되므로 지금은 스킵
          continue;
        }

        // lag=0 → 즉시 기록
        newDatapoints.push(dp);
        existingKeys.add(k);
      }
    }
  }

  const currentSession = allSessions
    .sort((a, b) => sessionNum(b.sessionId) - sessionNum(a.sessionId))[0]?.sessionId ?? 'session_000';

  const allDatapoints = [...existing.datapoints, ...newDatapoints];
  const output: GrowthMetricsOutput = {
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    registryVersion: registry.registryVersion,
    datapoints: allDatapoints,
    latestBySignature: rebuildLatestBySignature(allDatapoints),
    pendingLag: existing.pendingLag,
  };

  if (!opts.dryRun) {
    writeJson(OUTPUT_PATH, output);
    updateMetricHealth(registry, allDatapoints, currentSession);
  }

  appendLog('compute-growth', [
    `Phase 1 ok.`,
    `sessions=${targetSessions.length}`,
    `newDatapoints=${newDatapoints.length}`,
    `totalDatapoints=${allDatapoints.length}`,
    `pendingLag=${output.pendingLag.length}`,
  ].join(' '));

  return output;
}

// ── CLI ───────────────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const sinceIdx = args.indexOf('--since');
  const backfillIdx = args.indexOf('--backfill-sessions');
  const opts: ComputeOpts = { dryRun: args.includes('--dry-run') };
  if (sinceIdx >= 0) { const v = args[sinceIdx + 1]; if (v) opts.sinceSession = v; }
  if (backfillIdx >= 0) { const v = args[backfillIdx + 1]; if (v) opts.backfillSessions = parseInt(v, 10) || 5; }

  computeGrowth(opts)
    .then(out => {
      const nonNull = out.datapoints.filter(d => d.value !== null).length;
      console.log(`[compute-growth] Phase 1 ok.`);
      console.log(`  totalDatapoints : ${out.datapoints.length}`);
      console.log(`  nonNullDatapoints: ${nonNull}`);
      console.log(`  pendingLag      : ${out.pendingLag.length}`);
      console.log(`  generatedAt     : ${out.generatedAt}`);
    })
    .catch(e => {
      console.error('[compute-growth] FAIL:', e instanceof Error ? e.message : e);
      process.exit(1);
    });
}
