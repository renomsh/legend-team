// Core data model types for legend-team v1

export type TopicStatus = 'open' | 'in-progress' | 'review' | 'closed';
export type AgentId = 'ace' | 'arki' | 'fin' | 'riki' | 'editor' | 'nova' | 'master';
export type RevisionStatus = 'draft' | 'reviewed' | 'master-approved' | 'superseded';

// A single strategic topic being processed by the team
export interface Topic {
  id: string;
  title: string;
  status: TopicStatus;
  created: string;        // ISO date (YYYY-MM-DD)
  lastUpdated: string;
  description: string;
  tags: string[];
}

// One step in the Ace-defined agent sequence for a topic
export interface AgendaItem {
  order: number;
  agent: AgentId;
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

// A single agent contribution recorded in the debate log
export interface DebateEntry {
  id: string;
  topicId: string;
  agent: AgentId;
  phase: string;
  revision: number;
  date: string;
  summary: string;
  filePath: string;         // path to the full agent output file
  status: 'submitted' | 'superseded';
}

// A recorded decision — active, superseded, or rejected
export interface Decision {
  id: string;
  topicId: string;
  date: string;
  title: string;
  rationale: string;
  madeBy: AgentId;
  reversible: boolean;
  status: 'active' | 'superseded' | 'rejected';
}

// An unresolved question, gap, or escalation
export interface OpenIssue {
  id: string;
  topicId: string;
  date: string;
  description: string;
  raisedBy: AgentId;
  assignedTo?: AgentId;
  status: 'open' | 'resolved' | 'escalated';
  resolution?: string;
}

// A piece of supporting evidence referenced by one or more agents
export interface Evidence {
  id: string;
  topicId: string;
  date: string;
  description: string;
  source: string;
  type: 'data' | 'assumption' | 'reference' | 'expert-input';
  usedBy: AgentId[];
}

// Metadata for an Editor-compiled report artifact
export interface ReportMeta {
  topicId: string;
  revision: number;
  date: string;
  status: RevisionStatus;
  contributingAgents: AgentId[];
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
  appliedTo: string[];      // output file paths or agent ids affected
  status: 'pending' | 'applied';
}

// A revision record tracking what changed and who changed it
export interface Revision {
  revision: number;
  date: string;
  agent: AgentId;
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
export type AssetVisibility = Record<AgentId, VisibilityLevel>;

// The full visibility matrix stored in config/visibility.json
export interface VisibilityConfig {
  version: number;
  description: string;
  assets: Record<string, AssetVisibility>;
  queryScope: Record<string, { default: string; filterByTopic: string }>;
}

// Shared index structures stored in memory/shared/

export interface TopicIndexEntry {
  id: string;
  title: string;
  status: TopicStatus;
  created: string;
  path: string;             // relative path from project root, e.g. "topics/topic_001"
}

export interface TopicIndex {
  topics: TopicIndexEntry[];
  lastUpdated: string;
}
