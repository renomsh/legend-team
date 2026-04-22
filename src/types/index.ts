// Core data model types for legend-team v0.3.0

export type TopicSessionStatus = 'open' | 'in-progress' | 'review' | 'suspended' | 'closed';
export type ReportStatus = 'draft' | 'reviewed' | 'approved' | 'superseded' | 'speculative';

/** @deprecated Use TopicSessionStatus */
export type TopicStatus = TopicSessionStatus;

/** @deprecated Use ReportStatus */
export type RevisionStatus = 'draft' | 'reviewed' | 'master-approved' | 'superseded';

export type RoleId = 'ace' | 'arki' | 'fin' | 'riki' | 'editor' | 'nova' | 'master';

/** @deprecated Use RoleId */
export type AgentId = RoleId;

// A single strategic topic being processed by the team
export interface Topic {
  id: string;
  title: string;
  status: TopicSessionStatus;
  created: string;        // ISO date (YYYY-MM-DD)
  lastUpdated: string;
  description: string;
  tags: string[];
}

// One step in the Ace-defined agent sequence for a topic
export interface AgendaItem {
  order: number;
  role: RoleId;
  task: string;
  rationale: string;
  status: 'pending' | 'done' | 'skipped';
}

// Ace's full framing output for a topic
export interface Agenda {
  topicId: string;
  revision: number;
  date: string;
  decisionAxes: string[];
  scopeIn: string[];
  scopeOut: string[];
  keyAssumptions: string[];
  sequence: AgendaItem[];
  openQuestions: string[];
}

// A single role contribution recorded in the debate log
export interface DebateEntry {
  id: string;
  topicId: string;
  role: RoleId;
  /** @deprecated Use role */
  agent?: RoleId;
  phase: string;
  revision: number;
  date: string;
  summary: string;
  filePath: string;         // path to the full role output file
  status: 'submitted' | 'superseded';
}

// A recorded decision — active, superseded, or rejected
export interface Decision {
  id: string;
  topicId: string;
  date: string;
  title: string;
  rationale: string;
  madeBy: RoleId;
  reversible: boolean;
  status: 'active' | 'superseded' | 'rejected';
}

// An unresolved question, gap, or escalation
export interface OpenIssue {
  id: string;
  topicId: string;
  date: string;
  description: string;
  raisedBy: RoleId;
  assignedTo?: RoleId;
  status: 'open' | 'resolved' | 'escalated';
  resolution?: string;
}

// A piece of supporting evidence referenced by one or more roles
export interface Evidence {
  id: string;
  topicId: string;
  date: string;
  description: string;
  source: string;
  type: 'data' | 'assumption' | 'reference' | 'expert-input';
  usedBy: RoleId[];
}

// Metadata for an Editor-compiled report artifact
export interface ReportMeta {
  topicId: string;
  revision: number;
  date: string;
  status: ReportStatus;
  contributingRoles: RoleId[];
  /** @deprecated Use contributingRoles */
  contributingAgents?: RoleId[];
  filePath: string;
  summary: string;
}

// A single piece of master feedback — authoritative, applied against specific outputs
export interface MasterFeedback {
  id: string;
  topicId: string;
  date: string;
  phase: string;
  feedback: string;
  directive: string;        // what must change as a result
  appliedTo: string[];      // output file paths or role ids affected
  status: 'pending' | 'applied';
}

// A revision record tracking what changed and who changed it
export interface Revision {
  revision: number;
  date: string;
  role: RoleId;
  /** @deprecated Use role */
  agent?: RoleId;
  summary: string;
  previousRevision: number | null;
  filePath: string;
}

// A Nova speculative output — advisory only unless explicitly promoted by master
export interface SpeculativeOption {
  id: string;
  topicId: string;
  date: string;
  assumptionChallenged: string;
  scenario: string;
  whyItMatters: string;
  suggestedFollowUp: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  status: 'speculative' | 'promoted' | 'dismissed';
  promotedBy?: string;      // set only if master explicitly promoted this option
}

// A single entry in the accessed_assets manifest (frontmatter field)
export interface AccessedAsset {
  file: string;              // filename in memory/shared/, e.g. "glossary.json"
  scope: 'current_topic' | 'all_topics';
}

// Visibility level for a role's access to a shared asset
export type VisibilityLevel = 'required' | 'optional';

// Per-asset visibility rule across all roles
export type AssetVisibility = Record<RoleId, VisibilityLevel>;

// The full visibility matrix stored in config/visibility.json
export interface VisibilityConfig {
  version: number;
  description: string;
  assets: Record<string, AssetVisibility>;
  queryScope: Record<string, { default: string; filterByTopic: string }>;
}

// ── 2-plane topic index ──────────────────────────────────────────────────────

/**
 * Canonical topic index entry (v0.3.0+).
 * controlPath = local write-channel workspace (topics/{id})
 * reportPath  = artifact plane (reports/{date}_{slug})
 */
export interface TopicIndexEntry {
  id: string;
  title: string;
  status: TopicSessionStatus;
  created: string;
  /** D-052: lifecycle phase, orthogonal to hold */
  phase?: 'framing' | 'design' | 'implementation' | 'validated' | string;
  /** D-052: hold state — null = active, object = held */
  hold?: null | {
    heldAt?: string;
    heldAtPhase?: string;
    reason?: string;
  };
  /** Declared grade at /open */
  grade?: 'S' | 'A' | 'B' | 'C';
  /** Declared vs actual grade tracking (D-054 gap) */
  gradeDeclared?: 'S' | 'A' | 'B' | 'C' | null;
  gradeActual?: 'S' | 'A' | 'B' | 'C' | null;
  gradeMismatch?: boolean;
  /** Master decisions attributed to this topic */
  masterDecisions?: Array<{ id: string; summary?: string; status?: string }>;
  /** Control plane: local workspace for agenda, debate_log, decisions, issues */
  controlPath?: string;       // e.g. "topics/topic_001"
  /** Artifact plane: published report directory */
  reportPath?: string;        // e.g. "reports/2026-04-04_local-vs-server"
  /** List of report files in reportPath */
  reportFiles?: string[];
  /** Whether this topic has been published to the viewer */
  published?: boolean;
  /** Outcome summary (set when closed) */
  outcome?: string;
  /** Freeform notes */
  note?: string;
  /** @deprecated Use controlPath. Kept for backward compatibility. */
  path?: string;
}

export interface TopicIndex {
  topics: TopicIndexEntry[];
  lastUpdated: string;
}

// ── Decision Ledger (D-055: owningTopicId + scopeCheck) ─────────────────────

/** D-055: scopeCheck enum — 결정의 토픽 범위 분류 */
export type ScopeCheck =
  | 'topic-local'       // 단일 토픽에 국한
  | 'cross-topic'       // 복수 토픽에 걸침 (relatedTopics 필수)
  | 'global'            // 시스템 전역 (CLAUDE.md 등재 동반)
  | 'legacy-ambiguous'; // 백필 기본값 — 사후 분류 대상

/** decision_ledger.json 엔트리 타입 (v1.0, D-055) */
export interface DecisionLedgerEntry {
  id: string;
  date: string;
  session: string;
  topic: string;
  axis: string;
  decision: string;
  value?: string;
  authority: 'master' | 'team';
  status: 'confirmed' | 'superseded' | 'rejected';
  /** D-055: 이 결정을 소유하는 토픽 ID (🔴 하드 필수) */
  owningTopicId: string | null;
  /** D-055: 결정의 범위 분류 (🔴 하드 필수) */
  scopeCheck: ScopeCheck;
  /** cross-topic 시 관련 토픽 ID 목록 */
  relatedTopics?: string[];
}

export interface DecisionLedger {
  decisions: DecisionLedgerEntry[];
  lastUpdated?: string;
}

// ── Frontmatter schema (canonical v0.3.0) ───────────────────────────────────

/**
 * Canonical frontmatter fields for all role output .md files.
 * Used by validate-output.ts for schema enforcement.
 *
 * Example:
 * ---
 * topic: topic_003
 * topic_slug: local-vs-server
 * role: ace
 * phase: framing
 * revision: 1
 * date: 2026-04-04
 * report_status: approved
 * session_status: closed
 * accessed_assets:
 *   - topic_index.json
 *   - decision_ledger.json
 * ---
 */
export interface CanonicalFrontmatter {
  topic: string;
  topic_slug?: string;
  role: RoleId;
  phase: string;
  revision: number;
  date: string;
  report_status: ReportStatus;
  session_status: TopicSessionStatus;
  accessed_assets: string[];
}
