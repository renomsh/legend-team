import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

// ── Types ──────────────────────────────────────────────────────────────────

interface Role {
  id: string;
  name: string;
  domain: string;
  status: string;
  authority: string;
  description: string;
  owns: string[];
}

interface TopicMeta {
  id: string;
  title: string;
  status: string;
  created: string;
  lastUpdated: string;
  description: string;
  tags: string[];
}

interface TopicIndexEntry {
  id: string;
  title: string;
  status: string;
  created: string;
  path: string;
}

interface Decision {
  id: string;
  title: string;
  rationale?: string;
  madeBy?: string;
  date?: string;
  status?: string;
  reversible?: boolean;
}

interface Issue {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
}

interface FeedbackEntry {
  id?: string;
  date?: string;
  phase?: string;
  feedback?: string;
  directive?: string;
  status?: string;
}

interface RevisionEntry {
  revision?: number;
  date?: string;
  agent?: string;
  summary?: string;
  status?: string;
}

interface DebateEntry {
  id?: string;
  agent?: string;
  phase?: string;
  revision?: number;
  date?: string;
  summary?: string;
  status?: string;
}

interface SpeculativeOption {
  id?: string;
  assumptionChallenged?: string;
  scenario?: string;
  whyItMatters?: string;
  confidenceLevel?: string;
  status?: string;
}

interface TopicDetail {
  meta: TopicMeta;
  agendaRaw: string;
  decisions: Decision[];
  issues: Issue[];
  feedback: FeedbackEntry[];
  revisions: RevisionEntry[];
  debateLog: DebateEntry[];
  speculative: SpeculativeOption[];
  reports: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

function readJSON<T>(relPath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function readText(relPath: string): string {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
  } catch {
    return '';
  }
}

function readTopicDetail(topicPath: string, topicId: string): TopicDetail {
  const base = topicPath; // e.g. "topics/topic_001"

  const meta = readJSON<TopicMeta>(`${base}/topic_meta.json`, {
    id: topicId, title: '', status: 'open',
    created: '', lastUpdated: '', description: '', tags: [],
  });

  const agendaRaw = readText(`${base}/agenda.md`);
  const decisionsData = readJSON<{ decisions: Decision[] }>(`${base}/decisions.json`, { decisions: [] });
  const issuesData    = readJSON<{ issues: Issue[] }>(`${base}/open_issues.json`, { issues: [] });
  const feedbackData  = readJSON<{ feedback: FeedbackEntry[] }>(`${base}/master_feedback.json`, { feedback: [] });
  const revisionsData = readJSON<{ revisions: RevisionEntry[] }>(`${base}/revision_history.json`, { revisions: [] });
  const debateData    = readJSON<{ entries: DebateEntry[] }>(`${base}/debate_log.json`, { entries: [] });
  const speculativeData = readJSON<{ options: SpeculativeOption[] }>(`${base}/speculative_options.json`, { options: [] });

  // Report files
  const reportsDir = path.join(ROOT, base, 'reports');
  let reports: string[] = [];
  try {
    reports = fs.readdirSync(reportsDir).filter(f => f.endsWith('.md'));
  } catch { /* no reports dir */ }

  return {
    meta,
    agendaRaw,
    decisions: decisionsData.decisions ?? [],
    issues: issuesData.issues ?? [],
    feedback: feedbackData.feedback ?? [],
    revisions: revisionsData.revisions ?? [],
    debateLog: debateData.entries ?? [],
    speculative: speculativeData.options ?? [],
    reports,
  };
}

function getRoleIcon(id: string): string {
  const icons: Record<string, string> = {
    ace: '⚔️', arki: '🏛️', fin: '💰',
    riki: '🛡️', editor: '📝', nova: '🌟',
  };
  return icons[id] ?? '🔹';
}

function getRoleColor(id: string): string {
  const colors: Record<string, string> = {
    ace: '#3b6fd4', arki: '#1a8a8a', fin: '#2e8b57',
    riki: '#c0392b', editor: '#7d3c98', nova: '#b7860b',
  };
  return colors[id] ?? '#555';
}

function getSequenceNumber(id: string, sequence: string[]): number {
  return sequence.indexOf(id) + 1;
}

function getStatusBadge(status: string): string {
  const map: Record<string, { label: string; cls: string }> = {
    open:          { label: '진행중', cls: 'status-open' },
    'in-progress': { label: '진행중', cls: 'status-open' },
    review:        { label: '검토중', cls: 'status-review' },
    closed:        { label: '완료',   cls: 'status-closed' },
  };
  const s = map[status] ?? { label: status, cls: 'status-closed' };
  return `<span class="status-badge ${s.cls}">${s.label}</span>`;
}

// ── Dashboard Builder ──────────────────────────────────────────────────────

function buildDashboard(): string {
  const rolesConfig  = readJSON<{ roles: Record<string, Role> }>('config/roles.json', { roles: {} });
  const topicIndex   = readJSON<{ topics: TopicIndexEntry[]; lastUpdated: string }>(
    'memory/shared/topic_index.json', { topics: [], lastUpdated: '' }
  );
  const workflow     = readJSON<{ defaultSequence: string[] }>('config/workflow.json', { defaultSequence: [] });
  const visibility   = readJSON<Record<string, unknown>>('config/visibility.json', {});

  const roles    = Object.values(rolesConfig.roles);
  const mainRoles = roles.filter(r => r.id !== 'nova');
  const nova     = roles.find(r => r.id === 'nova') ?? { id: 'nova', name: 'Nova', domain: 'speculation', status: 'speculative', authority: 'advisory', description: '', owns: [] };
  const topics   = topicIndex.topics;
  const sequence = workflow.defaultSequence;

  // Read full detail for every topic
  const topicDetails: TopicDetail[] = topics.map(t =>
    readTopicDetail(t.path, t.id)
  );

  // ── Role Cards ──
  const mainRoleCards = mainRoles.map(role => {
    const color    = getRoleColor(role.id);
    const icon     = getRoleIcon(role.id);
    const seq      = getSequenceNumber(role.id, sequence);
    const ownsItems = role.owns.map(o => `<li>${o}</li>`).join('');
    return `
      <div class="role-card" style="--card-color: ${color};" data-role-id="${role.id}" onclick="openRolePopover('${role.id}', this)">
        <div class="card-header">
          <span class="card-icon">${icon}</span>
          <div class="card-title-block">
            <div class="card-seq">PHASE ${seq}</div>
            <div class="card-name">${role.name.toUpperCase()}</div>
            <div class="card-domain">${role.domain}</div>
          </div>
        </div>
        <div class="card-desc">${role.description}</div>
        <ul class="card-owns">${ownsItems}</ul>
        <div class="card-footer">
          <span class="auth-badge auth-${role.authority}">${role.authority}</span>
          <span class="status-dot ${role.status === 'active' ? 'dot-active' : 'dot-off'}"></span>
        </div>
        <div class="card-click-hint">클릭하면 권한 매트릭스 보기</div>
      </div>`;
  }).join('\n');

  // ── Topic Rows ──
  const topicRows = topics.length > 0
    ? topics.map((t, i) => {
        const detail = topicDetails[i]!;
        const decCount = detail.decisions.length;
        const issueCount = detail.issues.length;
        const reportCount = detail.reports.length;
        return `
        <tr class="topic-row" onclick="openTopicPanel('${t.id}')" title="클릭하면 상세보기">
          <td class="topic-id">${t.id}</td>
          <td class="topic-title">${t.title}</td>
          <td>${getStatusBadge(t.status)}</td>
          <td class="topic-date">${t.created}</td>
          <td class="topic-meta-counts">
            <span class="count-pill" title="결정사항">${decCount > 0 ? `✅ ${decCount}` : '—'}</span>
            <span class="count-pill" title="이슈">${issueCount > 0 ? `⚠️ ${issueCount}` : '—'}</span>
            <span class="count-pill" title="보고서">${reportCount > 0 ? `📄 ${reportCount}` : '—'}</span>
          </td>
        </tr>`;
      }).join('\n')
    : `<tr><td colspan="5" class="no-topics">진행 중인 토픽 없음</td></tr>`;

  const generatedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  // Serialize topic data for JS
  const jsData = JSON.stringify(topicDetails);
  const jsVisibility = JSON.stringify(visibility);
  const jsRoles = JSON.stringify(rolesConfig.roles);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Legend Team — Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #080816;
      color: #c8d0e0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      min-height: 100vh;
      padding: 40px 24px 60px;
      overflow-x: hidden;
    }
    body.panel-open { overflow: hidden; }

    /* ── HEADER ── */
    .header { text-align: center; margin-bottom: 48px; }
    .header-label { font-size: 10px; letter-spacing: 4px; color: #556; text-transform: uppercase; margin-bottom: 6px; }
    .header-title { font-size: 28px; font-weight: 700; color: #e8eaf0; letter-spacing: 1px; }
    .header-sub { font-size: 12px; color: #445; margin-top: 4px; }

    /* ── MASTER CARD ── */
    .master-wrap { display: flex; justify-content: center; margin-bottom: 0; }
    .master-card {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid #2a2a4a; border-radius: 12px; padding: 20px 36px;
      text-align: center; min-width: 220px; position: relative;
    }
    .master-card::after {
      content: ''; display: block; width: 1px; height: 36px;
      background: #2a2a4a; margin: 0 auto; margin-top: 20px;
    }
    .master-label { font-size: 9px; letter-spacing: 3px; color: #556; text-transform: uppercase; margin-bottom: 6px; }
    .master-name { font-size: 20px; font-weight: 700; color: #e8eaf0; }
    .master-desc { font-size: 11px; color: #556; margin-top: 6px; }

    /* ── ROLE GRID ── */
    .roles-grid {
      display: grid; grid-template-columns: repeat(5, 1fr);
      gap: 14px; max-width: 1100px; margin: 0 auto 40px;
    }
    .role-card {
      background: linear-gradient(160deg, color-mix(in srgb, var(--card-color) 12%, #0d0d1e) 0%, #0d0d1e 100%);
      border: 1px solid color-mix(in srgb, var(--card-color) 35%, transparent);
      border-top: 3px solid var(--card-color);
      border-radius: 10px; padding: 18px 16px 14px;
      display: flex; flex-direction: column; gap: 10px;
      transition: transform 0.15s, box-shadow 0.15s;
      cursor: pointer; position: relative;
    }
    .role-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px color-mix(in srgb, var(--card-color) 20%, transparent);
    }
    .card-click-hint {
      font-size: 9px; color: color-mix(in srgb, var(--card-color) 50%, transparent);
      text-align: center; letter-spacing: 1px; margin-top: 2px;
      opacity: 0; transition: opacity 0.15s;
    }
    .role-card:hover .card-click-hint { opacity: 1; }

    .card-header { display: flex; align-items: flex-start; gap: 10px; }
    .card-icon { font-size: 22px; line-height: 1; margin-top: 2px; }
    .card-title-block { flex: 1; }
    .card-seq { font-size: 9px; letter-spacing: 2px; color: color-mix(in srgb, var(--card-color) 70%, #aaa); text-transform: uppercase; }
    .card-name { font-size: 16px; font-weight: 700; color: #e0e4f0; letter-spacing: 0.5px; }
    .card-domain { font-size: 10px; color: #556; text-transform: uppercase; letter-spacing: 1px; }
    .card-desc { font-size: 11px; color: #7a8090; line-height: 1.5; }
    .card-owns { list-style: none; flex: 1; }
    .card-owns li { font-size: 11px; color: #8090a8; padding: 2px 0; padding-left: 12px; position: relative; }
    .card-owns li::before { content: '›'; position: absolute; left: 0; color: var(--card-color); }
    .card-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #1a1a2e; padding-top: 10px; }
    .auth-badge { font-size: 9px; letter-spacing: 1px; text-transform: uppercase; padding: 2px 7px; border-radius: 4px; }
    .auth-primary  { background: #1a2a4a; color: #4080cc; }
    .auth-domain   { background: #1a2a1a; color: #40a060; }
    .auth-advisory { background: #2a2a1a; color: #a09040; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; }
    .dot-active { background: #2ecc71; box-shadow: 0 0 6px #2ecc71; }
    .dot-off    { background: #555; }

    /* ── NOVA SECTION ── */
    .nova-section { max-width: 1100px; margin: 0 auto 40px; }
    .nova-label { font-size: 10px; letter-spacing: 3px; color: #554422; text-transform: uppercase; margin-bottom: 10px; padding-left: 4px; }
    .nova-card {
      --card-color: #b7860b;
      background: linear-gradient(160deg, #1a1400 0%, #0d0d1e 100%);
      border: 1px dashed #3a3010; border-top: 3px dashed #b7860b;
      border-radius: 10px; padding: 16px 18px;
      display: flex; align-items: center; gap: 20px; opacity: 0.75;
    }
    .nova-card .card-icon { font-size: 28px; }
    .nova-main { flex: 1; }
    .nova-title { font-size: 15px; font-weight: 700; color: #c8a030; margin-bottom: 4px; }
    .nova-desc { font-size: 11px; color: #665530; line-height: 1.5; }
    .nova-owns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
    .nova-owns span { font-size: 10px; color: #8a7030; background: #1a1500; border: 1px solid #3a3010; padding: 2px 8px; border-radius: 4px; }
    .nova-badge { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #554422; border: 1px dashed #3a3010; padding: 3px 10px; border-radius: 4px; white-space: nowrap; }

    /* ── TOPICS TABLE ── */
    .topics-section { max-width: 1100px; margin: 0 auto; }
    .section-title { font-size: 10px; letter-spacing: 3px; color: #334; text-transform: uppercase; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #334; padding: 8px 12px; text-align: left; border-bottom: 1px solid #1a1a2e; }
    td { font-size: 12px; padding: 10px 12px; border-bottom: 1px solid #0f0f1e; color: #8090a0; }
    .topic-id    { color: #3b6fd4; font-family: monospace; font-size: 11px; }
    .topic-title { color: #aab0c0; }
    .topic-date  { font-size: 11px; }
    .no-topics   { text-align: center; color: #334; padding: 20px; }
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; letter-spacing: 1px; }
    .status-open   { background: #0d2a1a; color: #2ecc71; }
    .status-review { background: #1a1a00; color: #f0c040; }
    .status-closed { background: #1a1a2e; color: #556; }
    .topic-row { cursor: pointer; transition: background 0.12s; }
    .topic-row:hover td { background: #0e0e20; }
    .topic-meta-counts { display: flex; gap: 8px; }
    .count-pill { font-size: 11px; color: #556; }

    /* ── FOOTER ── */
    .footer { text-align: center; margin-top: 48px; font-size: 10px; color: #223; letter-spacing: 1px; }

    /* ── OVERLAY ── */
    .overlay {
      position: fixed; inset: 0;
      background: rgba(4, 4, 14, 0.7);
      z-index: 100; opacity: 0;
      pointer-events: none; transition: opacity 0.2s;
    }
    .overlay.visible { opacity: 1; pointer-events: all; }

    /* ── TOPIC DETAIL PANEL ── */
    .detail-panel {
      position: fixed; top: 0; right: 0;
      width: min(680px, 95vw); height: 100vh;
      background: #0c0c1e;
      border-left: 1px solid #1e1e38;
      z-index: 101;
      display: flex; flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    .detail-panel.open { transform: translateX(0); }

    .panel-header {
      padding: 24px 28px 0;
      border-bottom: 1px solid #1a1a30;
      flex-shrink: 0;
    }
    .panel-close {
      position: absolute; top: 16px; right: 20px;
      background: none; border: none; color: #446; font-size: 20px;
      cursor: pointer; line-height: 1; padding: 4px 8px;
      border-radius: 4px; transition: color 0.1s, background 0.1s;
    }
    .panel-close:hover { color: #c8d0e0; background: #1a1a2e; }
    .panel-topic-id { font-size: 10px; color: #3b6fd4; font-family: monospace; letter-spacing: 1px; margin-bottom: 4px; }
    .panel-topic-title { font-size: 18px; font-weight: 700; color: #e0e4f0; margin-bottom: 8px; line-height: 1.3; }
    .panel-topic-meta { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .panel-meta-tag { font-size: 10px; color: #446; }

    /* ── TABS ── */
    .panel-tabs {
      display: flex; gap: 0;
      margin-top: 4px; overflow-x: auto;
    }
    .tab-btn {
      background: none; border: none; border-bottom: 2px solid transparent;
      color: #446; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;
      padding: 10px 16px; cursor: pointer; white-space: nowrap;
      transition: color 0.15s, border-color 0.15s;
    }
    .tab-btn:hover { color: #8090a8; }
    .tab-btn.active { color: #c8d0e0; border-bottom-color: #3b6fd4; }
    .tab-btn .tab-count {
      background: #1a1a30; color: #4a5a70; font-size: 9px;
      padding: 1px 5px; border-radius: 10px; margin-left: 4px;
    }
    .tab-btn.active .tab-count { background: #1a2a4a; color: #4080cc; }

    /* ── PANEL BODY ── */
    .panel-body { flex: 1; overflow-y: auto; padding: 24px 28px 40px; }
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }

    /* ── OVERVIEW TAB ── */
    .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .overview-card { background: #0f0f22; border: 1px solid #1a1a30; border-radius: 8px; padding: 14px 16px; }
    .ov-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #446; margin-bottom: 6px; }
    .ov-value { font-size: 14px; color: #c8d0e0; }
    .ov-value.mono { font-family: monospace; font-size: 12px; }
    .agent-seq-table { width: 100%; border-collapse: collapse; }
    .agent-seq-table th { font-size: 9px; letter-spacing: 1px; color: #334; text-transform: uppercase; padding: 6px 10px; border-bottom: 1px solid #1a1a2e; text-align: left; }
    .agent-seq-table td { font-size: 12px; padding: 8px 10px; border-bottom: 1px solid #0f0f1e; }
    .agent-name-cell { display: flex; align-items: center; gap: 8px; }
    .agent-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    .seq-status-done    { color: #2ecc71; }
    .seq-status-pending { color: #446; }
    .seq-status-skipped { color: #7a6010; }

    /* ── AGENDA TAB ── */
    .agenda-content { font-size: 12px; line-height: 1.7; color: #8090a8; }
    .agenda-content h3 { font-size: 13px; color: #a0b0c8; margin: 20px 0 8px; letter-spacing: 0.5px; border-bottom: 1px solid #1a1a2e; padding-bottom: 6px; }
    .agenda-content h4 { font-size: 12px; color: #8090a8; margin: 12px 0 6px; }
    .agenda-content ul { padding-left: 16px; margin: 6px 0; }
    .agenda-content li { margin-bottom: 3px; }
    .agenda-content p { margin-bottom: 8px; }
    .agenda-content strong { color: #b0c0d8; }
    .agenda-content code { background: #1a1a2e; padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 11px; color: #8ab4e0; }
    .agenda-content table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
    .agenda-content table th { background: #0f0f22; color: #446; padding: 6px 10px; text-align: left; border: 1px solid #1a1a30; font-size: 10px; }
    .agenda-content table td { padding: 6px 10px; border: 1px solid #0f0f1e; color: #7080a0; }
    .agenda-content blockquote { border-left: 3px solid #2a2a4a; padding-left: 12px; color: #556; margin: 8px 0; }
    .agenda-empty { color: #334; font-size: 12px; }

    /* ── DECISIONS TAB ── */
    .decision-item {
      background: #0f0f22; border: 1px solid #1a1a30; border-left: 3px solid #2e8b57;
      border-radius: 6px; padding: 14px 16px; margin-bottom: 12px;
    }
    .decision-id { font-size: 10px; font-family: monospace; color: #2e8b57; margin-bottom: 4px; }
    .decision-title { font-size: 13px; color: #c0d0e0; margin-bottom: 6px; }
    .decision-meta { display: flex; gap: 12px; flex-wrap: wrap; }
    .decision-meta span { font-size: 10px; color: #446; }
    .decision-rationale { font-size: 11px; color: #7080a0; margin-top: 8px; line-height: 1.5; }

    /* ── ISSUES TAB ── */
    .issue-item {
      background: #0f0f22; border: 1px solid #1a1a30; border-left: 3px solid #c0392b;
      border-radius: 6px; padding: 14px 16px; margin-bottom: 12px;
    }
    .issue-title { font-size: 13px; color: #c0d0e0; margin-bottom: 6px; }
    .issue-desc { font-size: 11px; color: #7080a0; line-height: 1.5; }
    .issue-status { font-size: 10px; color: #446; margin-top: 6px; }

    /* ── FEEDBACK TAB ── */
    .feedback-item {
      background: #0f0f22; border: 1px solid #1a1a30; border-left: 3px solid #3b6fd4;
      border-radius: 6px; padding: 14px 16px; margin-bottom: 12px;
    }
    .feedback-phase { font-size: 10px; color: #3b6fd4; font-family: monospace; margin-bottom: 4px; }
    .feedback-date  { font-size: 10px; color: #334; margin-bottom: 8px; }
    .feedback-text  { font-size: 12px; color: #a0b0c8; line-height: 1.6; margin-bottom: 8px; }
    .feedback-directive { font-size: 11px; color: #7080a0; font-style: italic; border-top: 1px solid #1a1a2e; padding-top: 8px; }
    .feedback-status { font-size: 10px; margin-top: 6px; }
    .fstat-applied  { color: #2ecc71; }
    .fstat-pending  { color: #f0c040; }

    /* ── REPORTS TAB ── */
    .report-item {
      background: #0f0f22; border: 1px solid #1a1a30;
      border-radius: 6px; padding: 12px 16px; margin-bottom: 10px;
      display: flex; align-items: center; gap: 12px;
    }
    .report-icon { font-size: 20px; }
    .report-name { font-size: 12px; color: #a0b0c8; font-family: monospace; }
    .report-hint { font-size: 10px; color: #334; margin-top: 2px; }

    /* ── SPECULATIVE TAB ── */
    .spec-item {
      background: linear-gradient(160deg, #1a1400 0%, #0f0f1e 100%);
      border: 1px dashed #3a3010; border-left: 3px dashed #b7860b;
      border-radius: 6px; padding: 14px 16px; margin-bottom: 12px;
    }
    .spec-label { font-size: 10px; color: #b7860b; letter-spacing: 1px; margin-bottom: 4px; }
    .spec-assumption { font-size: 11px; color: #8a7030; margin-bottom: 6px; }
    .spec-scenario { font-size: 12px; color: #c8a030; line-height: 1.5; }
    .spec-confidence { font-size: 10px; color: #665530; margin-top: 6px; }

    /* ── EMPTY STATE ── */
    .empty-state { text-align: center; color: #334; font-size: 12px; padding: 40px 20px; }
    .empty-state .empty-icon { font-size: 32px; margin-bottom: 10px; }

    /* ── ROLE POPOVER ── */
    .role-popover {
      position: fixed; z-index: 200;
      background: #0e0e22; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 16px;
      width: 320px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      opacity: 0; pointer-events: none;
      transition: opacity 0.15s;
    }
    .role-popover.visible { opacity: 1; pointer-events: all; }
    .popover-title { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #446; margin-bottom: 12px; }
    .vis-table { width: 100%; border-collapse: collapse; font-size: 10px; }
    .vis-table th { color: #334; padding: 4px 6px; text-align: left; border-bottom: 1px solid #1a1a2e; }
    .vis-table td { padding: 5px 6px; border-bottom: 1px solid #0f0f1e; color: #6070a0; font-family: monospace; }
    .vis-required { color: #2ecc71; }
    .vis-optional { color: #446; }
    .vis-none     { color: #222; }
    .popover-close-hint { font-size: 9px; color: #334; margin-top: 10px; text-align: center; }

    @media (max-width: 900px) {
      .roles-grid { grid-template-columns: repeat(3, 1fr); }
      .overview-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .roles-grid { grid-template-columns: repeat(2, 1fr); }
      .detail-panel { width: 100vw; }
    }
  </style>
</head>
<body>

  <!-- ── OVERLAY ── -->
  <div class="overlay" id="overlay" onclick="closeAll()"></div>

  <!-- ── TOPIC DETAIL PANEL ── -->
  <div class="detail-panel" id="detailPanel">
    <div class="panel-header">
      <button class="panel-close" onclick="closePanel()">✕</button>
      <div class="panel-topic-id" id="panelTopicId"></div>
      <div class="panel-topic-title" id="panelTopicTitle"></div>
      <div class="panel-topic-meta" id="panelTopicMeta"></div>
      <div class="panel-tabs" id="panelTabs"></div>
    </div>
    <div class="panel-body" id="panelBody"></div>
  </div>

  <!-- ── ROLE POPOVER ── -->
  <div class="role-popover" id="rolePopover">
    <div class="popover-title" id="popoverTitle"></div>
    <div id="popoverContent"></div>
    <div class="popover-close-hint">클릭 밖 또는 ESC로 닫기</div>
  </div>

  <!-- ── MAIN CONTENT ── -->
  <div class="header">
    <div class="header-label">Legend Team · Strategy System</div>
    <div class="header-title">LEGEND TEAM</div>
    <div class="header-sub">Memory-First · Topic-Based · Role-Separated</div>
  </div>

  <div class="master-wrap">
    <div class="master-card">
      <div class="master-label">Commander</div>
      <div class="master-name">MASTER</div>
      <div class="master-desc">지시 제공 · 피드백 권한 · 모든 에이전트 조율</div>
    </div>
  </div>

  <div class="roles-grid">
    ${mainRoleCards}
  </div>

  <div class="nova-section">
    <div class="nova-label">⚠ Optional · Speculative Only</div>
    <div class="nova-card">
      <span class="card-icon">🌟</span>
      <div class="nova-main">
        <div class="nova-title">NOVA — Speculation</div>
        <div class="nova-desc">${nova.description}</div>
        <div class="nova-owns">
          ${nova.owns.map(o => `<span>${o}</span>`).join('')}
        </div>
      </div>
      <div class="nova-badge">ADVISORY ONLY</div>
    </div>
  </div>

  <div class="topics-section">
    <div class="section-title">Topic Index — 클릭하면 상세보기</div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Status</th>
          <th>Created</th>
          <th>요약</th>
        </tr>
      </thead>
      <tbody>${topicRows}</tbody>
    </table>
  </div>

  <div class="footer">Generated ${generatedAt} · legend-team v1.0.0</div>

  <!-- ── EMBEDDED DATA ── -->
  <script>
    const TOPIC_DETAILS = ${jsData};
    const VISIBILITY    = ${jsVisibility};
    const ROLES         = ${jsRoles};

    // ── MARKDOWN → HTML (lightweight) ──────────────────────────────────────
    function mdToHtml(md) {
      if (!md) return '';

      // Remove YAML frontmatter
      md = md.replace(/^---[\\s\\S]*?---\\n?/, '');

      const lines = md.split('\\n');
      const out = [];
      let inTable = false;
      let inCode = false;
      let inUl = false;
      let inOl = false;

      function closeList() {
        if (inUl) { out.push('</ul>'); inUl = false; }
        if (inOl) { out.push('</ol>'); inOl = false; }
      }
      function closeTable() {
        if (inTable) { out.push('</tbody></table>'); inTable = false; }
      }

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Code block
        if (line.startsWith('\`\`\`')) {
          if (inCode) { out.push('</code></pre>'); inCode = false; }
          else { closeList(); closeTable(); out.push('<pre><code>'); inCode = true; }
          continue;
        }
        if (inCode) { out.push(escHtml(line)); continue; }

        // Table row
        if (line.trim().startsWith('|')) {
          closeList();
          if (!inTable) { out.push('<table><tbody>'); inTable = true; }
          // Check if separator row
          if (line.replace(/[|\\-:\\s]/g, '') === '') continue;
          const isHeader = i === 0 || !lines[i-1]?.trim().startsWith('|') ||
            (lines[i+1]?.replace(/[|\\-:\\s]/g, '') === '');
          const cells = line.split('|').slice(1, -1).map(c => c.trim());
          // Detect header by next line being separator
          const nextIsSep = lines[i+1]?.replace(/[|\\-:\\s]/g, '') === '';
          const tag = nextIsSep ? 'th' : 'td';
          out.push('<tr>' + cells.map(c => \`<\${tag}>\${inline(c)}<\${'/'}+tag>\`).join('') + '</tr>');
          continue;
        } else {
          closeTable();
        }

        // Headings
        if (line.startsWith('### ')) { closeList(); out.push(\`<h4>\${inline(line.slice(4))}</h4>\`); continue; }
        if (line.startsWith('## ')) { closeList(); out.push(\`<h3>\${inline(line.slice(3))}</h3>\`); continue; }
        if (line.startsWith('# ')) { closeList(); out.push(\`<h3>\${inline(line.slice(2))}</h3>\`); continue; }

        // Horizontal rule
        if (/^(-{3,}|\\*{3,})$/.test(line.trim())) { closeList(); out.push('<hr style="border-color:#1a1a2e;margin:12px 0">'); continue; }

        // Ordered list
        if (/^\\d+\\.\\s/.test(line)) {
          if (!inOl) { closeList(); out.push('<ol style="padding-left:18px;margin:6px 0">'); inOl = true; }
          out.push(\`<li>\${inline(line.replace(/^\\d+\\.\\s/, ''))}</li>\`);
          continue;
        }

        // Unordered list
        if (/^[-*+]\\s/.test(line)) {
          if (!inUl) { closeList(); out.push('<ul style="padding-left:16px;margin:6px 0">'); inUl = true; }
          out.push(\`<li>\${inline(line.replace(/^[-*+]\\s/, ''))}</li>\`);
          continue;
        }

        closeList();

        // Blockquote
        if (line.startsWith('> ')) { out.push(\`<blockquote>\${inline(line.slice(2))}</blockquote>\`); continue; }

        // Empty line
        if (line.trim() === '') { out.push('<br>'); continue; }

        // Paragraph
        out.push(\`<p>\${inline(line)}</p>\`);
      }

      closeList(); closeTable();
      if (inCode) out.push('</code></pre>');
      return out.join('\\n');
    }

    function escHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function inline(s) {
      return s
        .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
        .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*([^*]+)\\*/g, '<em>$1</em>')
        .replace(/~~([^~]+)~~/g, '<del>$1</del>');
    }

    // ── STATUS HELPERS ─────────────────────────────────────────────────────
    function statusLabel(s) {
      const m = { open:'진행중','in-progress':'진행중', review:'검토중', closed:'완료' };
      return m[s] || s;
    }
    function statusCls(s) {
      return { open:'status-open','in-progress':'status-open', review:'status-review', closed:'status-closed' }[s] || 'status-closed';
    }

    function agentColor(id) {
      const c = { ace:'#3b6fd4', arki:'#1a8a8a', fin:'#2e8b57', riki:'#c0392b', editor:'#7d3c98', nova:'#b7860b', master:'#e8eaf0' };
      return c[id] || '#556';
    }
    function agentIcon(id) {
      const m = { ace:'⚔️', arki:'🏛️', fin:'💰', riki:'🛡️', editor:'📝', nova:'🌟', master:'👑' };
      return m[id] || '🔹';
    }

    // ── PANEL OPEN / CLOSE ─────────────────────────────────────────────────
    let currentTopicId = null;
    let currentTab = 'overview';

    function openTopicPanel(topicId) {
      currentTopicId = topicId;
      const detail = TOPIC_DETAILS.find(d => d.meta.id === topicId);
      if (!detail) return;

      // Header
      document.getElementById('panelTopicId').textContent = detail.meta.id;
      document.getElementById('panelTopicTitle').textContent = detail.meta.title;

      const meta = detail.meta;
      document.getElementById('panelTopicMeta').innerHTML =
        \`<span class="status-badge \${statusCls(meta.status)}">\${statusLabel(meta.status)}</span>\` +
        \`<span class="panel-meta-tag">생성 \${meta.created || '—'}</span>\` +
        (meta.lastUpdated ? \`<span class="panel-meta-tag">업데이트 \${meta.lastUpdated.slice(0,10)}</span>\` : '') +
        (meta.tags?.length ? \`<span class="panel-meta-tag">\${meta.tags.join(', ')}</span>\` : '');

      // Tabs
      const tabs = [
        { id: 'overview',   label: '개요' },
        { id: 'agenda',     label: '아젠다' },
        { id: 'decisions',  label: '결정',      count: detail.decisions.length },
        { id: 'issues',     label: '이슈',      count: detail.issues.length },
        { id: 'feedback',   label: '피드백',    count: detail.feedback.length },
        { id: 'reports',    label: '보고서',    count: detail.reports.length },
        { id: 'speculative',label: '투기',      count: detail.speculative.length },
      ];
      document.getElementById('panelTabs').innerHTML = tabs.map(t =>
        \`<button class="tab-btn\${t.id === 'overview' ? ' active' : ''}" onclick="switchTab('\${t.id}')">\${t.label}\${t.count !== undefined ? \`<span class="tab-count">\${t.count}</span>\` : ''}</button>\`
      ).join('');

      currentTab = 'overview';
      renderTabContent(detail, 'overview');

      // Show
      document.getElementById('detailPanel').classList.add('open');
      document.getElementById('overlay').classList.add('visible');
      document.body.classList.add('panel-open');
    }

    function switchTab(tabId) {
      currentTab = tabId;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.textContent.trim().startsWith(getTabLabel(tabId))));
      document.querySelectorAll('#panelTabs .tab-btn').forEach(b => {
        const match = b.getAttribute('onclick') === \`switchTab('\${tabId}')\`;
        b.classList.toggle('active', match);
      });
      const detail = TOPIC_DETAILS.find(d => d.meta.id === currentTopicId);
      if (detail) renderTabContent(detail, tabId);
    }

    function getTabLabel(id) {
      const m = { overview:'개요', agenda:'아젠다', decisions:'결정', issues:'이슈', feedback:'피드백', reports:'보고서', speculative:'투기' };
      return m[id] || id;
    }

    function renderTabContent(detail, tabId) {
      const body = document.getElementById('panelBody');
      body.innerHTML = '';

      if (tabId === 'overview')    body.innerHTML = renderOverview(detail);
      if (tabId === 'agenda')      body.innerHTML = renderAgenda(detail);
      if (tabId === 'decisions')   body.innerHTML = renderDecisions(detail);
      if (tabId === 'issues')      body.innerHTML = renderIssues(detail);
      if (tabId === 'feedback')    body.innerHTML = renderFeedback(detail);
      if (tabId === 'reports')     body.innerHTML = renderReports(detail);
      if (tabId === 'speculative') body.innerHTML = renderSpeculative(detail);

      body.scrollTop = 0;
    }

    // ── TAB RENDERERS ──────────────────────────────────────────────────────

    function renderOverview(d) {
      const m = d.meta;
      const seq = ['ace','arki','fin','riki','editor'];
      // Try to infer agent status from debate_log
      const doneAgents = new Set(d.debateLog.map(e => e.agent));
      const agentRows = seq.map((a, i) => {
        const done = doneAgents.has(a) || (m.status === 'closed');
        const color = agentColor(a);
        const icon = agentIcon(a);
        const statusLabel = done ? '완료' : '대기';
        const statusCls = done ? 'seq-status-done' : 'seq-status-pending';
        return \`<tr>
          <td>\${i+1}</td>
          <td><span class="agent-name-cell"><span class="agent-dot" style="background:\${color}"></span>\${icon} \${a.toUpperCase()}</span></td>
          <td class="\${statusCls}">\${statusLabel}</td>
        </tr>\`;
      }).join('');

      return \`
        <div class="overview-grid">
          <div class="overview-card">
            <div class="ov-label">토픽 ID</div>
            <div class="ov-value mono">\${m.id}</div>
          </div>
          <div class="overview-card">
            <div class="ov-label">상태</div>
            <div class="ov-value"><span class="status-badge \${statusCls(m.status)}">\${statusLabel(m.status)}</span></div>
          </div>
          <div class="overview-card">
            <div class="ov-label">생성일</div>
            <div class="ov-value">\${m.created || '—'}</div>
          </div>
          <div class="overview-card">
            <div class="ov-label">최종 업데이트</div>
            <div class="ov-value">\${m.lastUpdated ? m.lastUpdated.slice(0,10) : '—'}</div>
          </div>
        </div>
        \${m.description ? \`<div style="font-size:12px;color:#7080a0;margin-bottom:20px;line-height:1.6">\${m.description}</div>\` : ''}
        <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#334;margin-bottom:10px">에이전트 진행 순서</div>
        <table class="agent-seq-table">
          <thead><tr><th>#</th><th>역할</th><th>상태</th></tr></thead>
          <tbody>\${agentRows}</tbody>
        </table>
        <div style="margin-top:20px;display:flex;gap:16px;font-size:11px;color:#446">
          <span>결정 <strong style="color:#c0d0e0">\${d.decisions.length}</strong></span>
          <span>이슈 <strong style="color:#c0d0e0">\${d.issues.length}</strong></span>
          <span>피드백 <strong style="color:#c0d0e0">\${d.feedback.length}</strong></span>
          <span>보고서 <strong style="color:#c0d0e0">\${d.reports.length}</strong></span>
        </div>
      \`;
    }

    function renderAgenda(d) {
      if (!d.agendaRaw || d.agendaRaw.trim() === '') {
        return \`<div class="empty-state"><div class="empty-icon">📋</div>아젠다 없음</div>\`;
      }
      return \`<div class="agenda-content">\${mdToHtml(d.agendaRaw)}</div>\`;
    }

    function renderDecisions(d) {
      if (!d.decisions.length) {
        return \`<div class="empty-state"><div class="empty-icon">✅</div>저장된 결정사항 없음</div>\`;
      }
      return d.decisions.map(dec => \`
        <div class="decision-item">
          <div class="decision-id">\${dec.id || '—'}</div>
          <div class="decision-title">\${dec.title || '(제목 없음)'}</div>
          \${dec.rationale ? \`<div class="decision-rationale">\${dec.rationale}</div>\` : ''}
          <div class="decision-meta">
            \${dec.madeBy ? \`<span>\${agentIcon(dec.madeBy)} \${dec.madeBy}</span>\` : ''}
            \${dec.date   ? \`<span>\${dec.date.slice(0,10)}</span>\` : ''}
            \${dec.status ? \`<span class="\${dec.status === 'active' ? 'seq-status-done' : 'seq-status-skipped'}">\${dec.status}</span>\` : ''}
            \${dec.reversible !== undefined ? \`<span>\${dec.reversible ? '번복 가능' : '번복 불가'}</span>\` : ''}
          </div>
        </div>
      \`).join('');
    }

    function renderIssues(d) {
      if (!d.issues.length) {
        return \`<div class="empty-state"><div class="empty-icon">⚠️</div>열린 이슈 없음</div>\`;
      }
      return d.issues.map(issue => \`
        <div class="issue-item">
          <div class="issue-title">\${issue.title || issue.id || '(이슈 없음)'}</div>
          \${issue.description ? \`<div class="issue-desc">\${issue.description}</div>\` : ''}
          \${issue.status ? \`<div class="issue-status">상태: \${issue.status}</div>\` : ''}
        </div>
      \`).join('');
    }

    function renderFeedback(d) {
      if (!d.feedback.length) {
        return \`<div class="empty-state"><div class="empty-icon">💬</div>마스터 피드백 없음</div>\`;
      }
      return d.feedback.map(f => \`
        <div class="feedback-item">
          \${f.phase ? \`<div class="feedback-phase">\${f.phase}</div>\` : ''}
          \${f.date  ? \`<div class="feedback-date">\${f.date.slice(0,10)}</div>\` : ''}
          \${f.feedback ? \`<div class="feedback-text">\${f.feedback}</div>\` : ''}
          \${f.directive ? \`<div class="feedback-directive">지시: \${f.directive}</div>\` : ''}
          \${f.status ? \`<div class="feedback-status \${f.status === 'applied' ? 'fstat-applied' : 'fstat-pending'}">\${f.status === 'applied' ? '✔ 적용됨' : '⏳ 대기중'}</div>\` : ''}
        </div>
      \`).join('');
    }

    function renderReports(d) {
      if (!d.reports.length) {
        return \`<div class="empty-state"><div class="empty-icon">📄</div>생성된 보고서 없음</div>\`;
      }
      return d.reports.map(r => {
        const parts = r.replace('.md','').split('_');
        const agent = parts[2] || '';
        const rev   = parts[3] ? \`r\${parts[3].replace('r','')}\` : '';
        return \`
          <div class="report-item">
            <span class="report-icon">\${agentIcon(agent)}</span>
            <div>
              <div class="report-name">\${r}</div>
              <div class="report-hint">\${agent ? agent.toUpperCase() : ''} \${rev} · 마크다운 보고서</div>
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderSpeculative(d) {
      if (!d.speculative.length) {
        return \`<div class="empty-state"><div class="empty-icon">🌟</div>투기적 옵션 없음 — Nova가 발언하지 않았습니다</div>\`;
      }
      return d.speculative.map(s => \`
        <div class="spec-item">
          <div class="spec-label">🌟 NOVA · 투기적</div>
          \${s.assumptionChallenged ? \`<div class="spec-assumption">도전 가정: \${s.assumptionChallenged}</div>\` : ''}
          \${s.scenario ? \`<div class="spec-scenario">\${s.scenario}</div>\` : ''}
          \${s.confidenceLevel ? \`<div class="spec-confidence">신뢰도: \${s.confidenceLevel} · 상태: \${s.status || '—'}</div>\` : ''}
        </div>
      \`).join('');
    }

    // ── ROLE POPOVER ───────────────────────────────────────────────────────
    function openRolePopover(roleId, cardEl) {
      event.stopPropagation();
      const vis = VISIBILITY.assets || {};
      const role = ROLES[roleId];
      if (!role) return;

      const color = { ace:'#3b6fd4', arki:'#1a8a8a', fin:'#2e8b57', riki:'#c0392b', editor:'#7d3c98', nova:'#b7860b' }[roleId] || '#556';

      document.getElementById('popoverTitle').textContent = roleId.toUpperCase() + ' — Visibility Matrix';
      document.getElementById('popoverTitle').style.color = color;

      const rows = Object.entries(vis).map(([asset, perms]) => {
        const level = perms[roleId] || 'none';
        const cls   = level === 'required' ? 'vis-required' : level === 'optional' ? 'vis-optional' : 'vis-none';
        const icon  = level === 'required' ? '✔ 필수' : level === 'optional' ? '○ 선택' : '— 없음';
        return \`<tr><td style="font-size:10px;color:#6070a0">\${asset}</td><td class="\${cls}">\${icon}</td></tr>\`;
      }).join('');

      document.getElementById('popoverContent').innerHTML =
        rows ? \`<table class="vis-table"><thead><tr><th>자산</th><th>\${roleId.toUpperCase()}</th></tr></thead><tbody>\${rows}</tbody></table>\`
             : \`<div style="font-size:11px;color:#334;padding:8px 0">Visibility 데이터 없음</div>\`;

      // Position
      const popover = document.getElementById('rolePopover');
      const rect = cardEl.getBoundingClientRect();
      let top  = rect.bottom + 8;
      let left = rect.left;
      if (left + 320 > window.innerWidth) left = window.innerWidth - 328;
      if (top + 280 > window.innerHeight) top = rect.top - 280;
      popover.style.top  = top + 'px';
      popover.style.left = left + 'px';
      popover.classList.add('visible');

      document.getElementById('overlay').classList.add('visible');
    }

    // ── CLOSE ──────────────────────────────────────────────────────────────
    function closePanel() {
      document.getElementById('detailPanel').classList.remove('open');
      document.getElementById('overlay').classList.remove('visible');
      document.body.classList.remove('panel-open');
      currentTopicId = null;
    }

    function closePopover() {
      document.getElementById('rolePopover').classList.remove('visible');
      if (!currentTopicId) {
        document.getElementById('overlay').classList.remove('visible');
      }
    }

    function closeAll() {
      closePanel();
      closePopover();
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAll();
    });
  </script>
</body>
</html>`;
}

const html = buildDashboard();
const outPath = path.join(ROOT, 'app', 'dashboard.html');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, 'utf-8');
console.log(`Dashboard generated → ${outPath}`);
