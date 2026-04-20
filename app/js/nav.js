/**
 * Navigation helper
 * Legend Team — read-only viewer
 */

// Highlight current page in nav + load version from charter
document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Version: project_charter.json이 단일 소스. 모든 페이지 sidebar 자동 반영.
  try {
    const charter = await fetch('./data/memory/shared/project_charter.json').then(r => r.json());
    const ver = charter?.charter?.version ?? charter?.version;
    if (ver) {
      document.querySelectorAll('#sidebarVersion').forEach(el => {
        el.textContent = `v${ver}`;
      });
    }
  } catch (_) {}
});

// Get URL parameters
function getParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// Status catalog — single source of truth for topic status rendering.
// Loaded async at startup; statusBadge falls back to raw id until loaded.
window._statusCatalog = null;
(async () => {
  try {
    const c = await fetch('./data/memory/shared/status_catalog.json').then(r => r.json());
    window._statusCatalog = c;
  } catch (_) {}
})();

function resolveStatus(raw) {
  const c = window._statusCatalog;
  if (!c) return { id: raw, label: raw, color: null };
  const canonical = c.aliases?.[raw] || raw;
  const entry = (c.statuses || []).find(s => s.id === canonical);
  if (!entry) return { id: canonical, label: canonical, color: null };
  return entry;
}

// Status badge HTML — driven by status_catalog.json
function statusBadge(status) {
  const e = resolveStatus(status);
  const cls = `status-${e.id}`;
  const style = e.color ? ` style="color:${e.color};border-color:${e.color}33"` : '';
  return `<span class="status-badge ${cls}"${style}>${e.label}</span>`;
}

// Natural descending sort for topic IDs like `topic_044`, `topic_010a`.
// Higher numeric base first; same base, suffix present first (10a above 10).
function compareTopicIdDesc(a, b) {
  const parse = (id) => {
    const m = /^topic_(\d+)([a-z]*)$/i.exec(id || '');
    return m ? { n: parseInt(m[1], 10), s: (m[2] || '').toLowerCase() } : { n: -1, s: id || '' };
  };
  const pa = parse(a), pb = parse(b);
  if (pa.n !== pb.n) return pb.n - pa.n;
  return pb.s.localeCompare(pa.s);
}

function sortTopicsDesc(topics) {
  return [...topics].sort((x, y) => compareTopicIdDesc(x.id, y.id));
}
