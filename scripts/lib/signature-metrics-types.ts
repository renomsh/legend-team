// PD-023 P0a — Signature Metrics canonical types
// Spec: reports/2026-04-23_pd023-self-scores-thin-impl/arki_rev1.md §2.2
// 12 interfaces/types. Single source of truth — do not duplicate elsewhere.

export type LifecycleState =
  | "draft"
  | "shadow"
  | "candidate"
  | "active"
  | "deprecated"
  | "archived";

export type Axis =
  | "learning"
  | "quality"
  | "judgment-consistency"
  | "execution-transfer";

export type Scope = "role" | "cross-role" | "session";

export type Scale = "0-5" | "Y/N" | "ratio" | "percentile";

export type Polarity = "higher-better" | "lower-better" | "target-value";

export type TopicType = "framing" | "implementation" | "standalone";

export interface RaterSpec {
  type: "self" | "external" | "automated";
  by?: string;
}

export interface AlertConfig {
  redBelow?: number;
  yellowBelow?: number;
  trendDropPct?: number;
}

export interface DerivedComposition {
  formula: "weighted-mean";
  inputs: { metricId: string; weight: number }[];
  polarityNormalized: boolean;
  nullPolicy: "weight-renormalize" | "propagate-null" | "zero-fill";
}

export interface Metric {
  id: string;
  shortKey: string;
  role: string;
  scope: Scope;
  axis: Axis;
  type?: "base" | "derived";
  scale: Scale;
  polarity: Polarity;
  targetValue?: number;
  tradeoffWith?: string[];
  construct: string;
  externalAnchor: string[];
  validityCheck: "monthly" | "quarterly" | "yearly";
  rater: RaterSpec;
  raterWeights: Record<string, number>;
  timing: "immediate" | "deferred";
  aggregation: string;
  baselineSessions: number;
  alerts?: AlertConfig;
  causedBy?: string[];
  leadingIndicator?: boolean;
  lifecycleState: LifecycleState;
  deprecatedInVersion?: string;
  supersededBy?: string;
  computedBy?: string;
  composition?: DerivedComposition;
  indicator?: boolean;
  outcomeMetrics?: string[];
  stratifyBy?: "grade" | "mode" | null;
  inputPriority: "core" | "extended";
  defaultStrategy: "previous-session-value" | "explicit-only";
  missingPenalty: "warn" | "silent" | "block";
  applicableTopicTypes: TopicType[];
  participationExpectedTopicTypes: TopicType[];
  defaultUsageCount?: number;
  _reserved?: Record<string, unknown>;
}

export type RecordSource =
  | "yaml-block"
  | "cli"
  | "auto-scorer"
  | "manual-edit"
  | "master-override"
  | "default-fallback";

export interface ScoreRecord {
  recordId: string;
  sessionId: string;
  topicId: string;
  topicType: TopicType;
  role: string;
  metricId: string;
  raterId: string;
  rawScore: number | string;
  normalizedScore: number;
  registryVersion: string;
  recordedBy: string;
  recordSource: RecordSource;
  sessionPhase: string;
  confidence?: number;
  ts: string;
  supersedes?: string;
  overrideReason?: string;
  extensions?: Record<string, unknown>;
}

export interface AggregateView {
  metricId: string;
  role: string;
  view: "all" | "recent10" | "recent3";
  mean: number;
  n: number;
  std: number;
  ci95: [number, number];
  stratum?: { grade?: string; mode?: string };
}
