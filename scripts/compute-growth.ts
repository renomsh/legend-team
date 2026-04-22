#!/usr/bin/env ts-node
/**
 * compute-growth.ts — D-060 Phase 0 스켈레톤
 *
 * 책임: metrics_registry.json을 루프 돌려 각 메트릭의 datapoint를 산출,
 *       memory/derived/growth_metrics.json에 append-only로 기록한다.
 *
 * Phase 0 범위 (현재): 파일 로드 + 구조 검증 + 스키마 뼈대 작성. 실제 scoring은 Phase 1.
 * Phase 1 예정: scoreMetric 구현 + lag 큐 처리 + 훅 체인 등록.
 *
 * 설계 원칙:
 *   - datapoints는 append-only (과거 값 재계산 금지 → provenance 훼손 방지)
 *   - pendingLag 큐 상태가 파일에 들어감 → 재기동 안전
 *   - registry status=active 만 계산
 *   - incremental: sinceSession 이후만 (hook 호출 비용 상수화)
 *
 * 사용법:
 *   npx ts-node scripts/compute-growth.ts                 # Phase 0 스모크 (로드만)
 *   npx ts-node scripts/compute-growth.ts --since session_070  # Phase 1 예정
 */

import * as path from 'path';
import { ROOT, readJson, writeJson, appendLog } from './lib/utils';

// ── 경로 ──────────────────────────────────────────────────────────────────
const REGISTRY_PATH   = path.join(ROOT, 'memory', 'shared', 'metrics_registry.json');
const RUBRIC_PATH     = path.join(ROOT, 'memory', 'shared', 'hit_rate_rubric.json');
const CLASSIFIER_PATH = path.join(ROOT, 'memory', 'shared', 'intervention_classifier.json');
const REGIME_PATH     = path.join(ROOT, 'memory', 'shared', 'regime_markers.json');
const HEALTH_PATH     = path.join(ROOT, 'memory', 'derived', 'metric_health.json');
const OUTPUT_PATH     = path.join(ROOT, 'memory', 'derived', 'growth_metrics.json');
const SESSION_INDEX_PATH = path.join(ROOT, 'memory', 'sessions', 'session_index.json');

const PHASE0_MARKER = '__phase_0_skeleton__';

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
  sessionId: string;            // 지표가 발생한 세션
  computedAtSession: string;    // 채점이 확정된 세션 (lag 반영)
  value: number | null;
  rubricVersion?: string;       // provenance
  classifierVersion?: string;   // provenance
  registryVersion?: string;     // provenance
  regimeId?: string | null;
  inTransitionZone?: boolean;
  window?: number;              // 20 | 100 | 500
  rawInputs?: unknown;          // 감사용
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
  _phase0?: string;  // Phase 0 마커, Phase 1에서 제거
}

// ── 로더 (Phase 0 완성) ──────────────────────────────────────────────────
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
    _phase0: PHASE0_MARKER,
  });
}

// ── Registry 검증 (Phase 0 완성) ──────────────────────────────────────────
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

// ── Regime 조회 (Phase 0 완성) ────────────────────────────────────────────
export function resolveRegimeAt(sessionId: string, regimes: RegimeMarker[]): { id: string | null; inTransitionZone: boolean } {
  // sessionId 형식: session_NNN
  const targetNum = parseInt(sessionId.replace('session_', ''), 10);
  if (isNaN(targetNum)) return { id: null, inTransitionZone: false };

  let current: RegimeMarker | null = null;
  let inZone = false;
  for (const r of regimes) {
    const startNum = parseInt(r.sessionStart.replace('session_', ''), 10);
    if (isNaN(startNum)) continue;
    if (targetNum >= startNum) {
      if (!current || startNum > parseInt(current.sessionStart.replace('session_', ''), 10)) {
        current = r;
      }
      if (targetNum < startNum + r.transitionZone) inZone = true;
    }
  }
  return { id: current?.id ?? null, inTransitionZone: inZone };
}

// ── 스코어러 분기 (Phase 1 구현 예정) ─────────────────────────────────────
export function scoreMetric(_def: MetricDef, _sessionId: string): GrowthDatapoint | null {
  // Phase 1: scorer.mode 분기
  //   'automatic' → source.from 파일 직접 집계
  //   'consensus' → 라이브 채점은 불가. turn_log의 rater 역할 발언에서 rubric 점수 추출 또는 세션 종료 시 Ace가 집계 요청
  //   'single'    → rater 역할의 세션 종료 시 제출한 점수 사용
  throw new Error('scoreMetric: Phase 1 not implemented');
}

// ── Lag 큐 처리 (Phase 1 구현 예정) ───────────────────────────────────────
export function resolvePendingLag(_output: GrowthMetricsOutput, _currentSession: string): GrowthDatapoint[] {
  // Phase 1: pendingLag에서 dueAtSession <= currentSession인 항목을 스코어링하여 datapoint로 전환
  throw new Error('resolvePendingLag: Phase 1 not implemented');
}

// ── 엔트리포인트 ──────────────────────────────────────────────────────────
export interface ComputeOpts {
  sinceSession?: string;
  dryRun?: boolean;
}

export async function computeGrowth(opts: ComputeOpts = {}): Promise<GrowthMetricsOutput> {
  const registry = loadRegistry();
  const errors = validateRegistry(registry);
  if (errors.length > 0) {
    throw new Error(`metrics_registry validation failed:\n  - ${errors.join('\n  - ')}`);
  }

  const regimes = loadRegimes();
  const existing = loadExistingOutput();

  const activeMetrics = registry.metrics.filter(m => m.status === 'active');

  // Phase 0: 실제 scoring 없이 로드/검증만 하고 기존 output을 그대로 반환
  const output: GrowthMetricsOutput = {
    ...existing,
    schemaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    registryVersion: registry.registryVersion,
    _phase0: PHASE0_MARKER,
  };

  appendLog('compute-growth', `Phase 0 load ok: ${activeMetrics.length} active metrics, ${regimes.length} regimes`);

  if (!opts.dryRun) {
    writeJson(OUTPUT_PATH, output);
  }
  return output;
}

// ── CLI ───────────────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const sinceIdx = args.indexOf('--since');
  const opts: ComputeOpts = { dryRun: args.includes('--dry-run') };
  if (sinceIdx >= 0) {
    const v = args[sinceIdx + 1];
    if (v) opts.sinceSession = v;
  }

  computeGrowth(opts)
    .then(out => {
      const activeCount = out.datapoints.length;
      const pendingCount = out.pendingLag.length;
      console.log(`[compute-growth] Phase 0 ok. datapoints=${activeCount} pending=${pendingCount} generatedAt=${out.generatedAt}`);
      if (out._phase0) console.log(`[compute-growth] ${out._phase0} (scoring은 Phase 1)`);
    })
    .catch(e => {
      console.error('[compute-growth] FAIL:', e instanceof Error ? e.message : e);
      process.exit(1);
    });
}
