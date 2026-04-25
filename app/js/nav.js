/**
 * Navigation helper
 * Legend Team — read-only viewer
 */

// ── Drawer (mobile off-canvas) — D-095 1024 single breakpoint
// Spec: responsive-policy.md §3-1, §6 + token-axes-spec.md §6-3 (z-index)
function openDrawer() {
  const sb = document.getElementById('primarySidebar');
  const bd = document.getElementById('sidebarBackdrop');
  const hb = document.getElementById('hamburgerBtn');
  if (sb) sb.dataset.open = 'true';
  if (bd) bd.dataset.open = 'true';
  if (hb) { hb.setAttribute('aria-expanded', 'true'); hb.setAttribute('aria-label', '메뉴 닫기'); }
  document.body.style.overflow = 'hidden';
  // Focus trap entry point: first non-disabled nav-item
  const firstItem = sb?.querySelector('.nav-item:not([aria-disabled="true"])');
  if (firstItem) firstItem.focus();
}
function closeDrawer() {
  const sb = document.getElementById('primarySidebar');
  const bd = document.getElementById('sidebarBackdrop');
  const hb = document.getElementById('hamburgerBtn');
  if (sb) sb.dataset.open = 'false';
  if (bd) bd.dataset.open = 'false';
  if (hb) { hb.setAttribute('aria-expanded', 'false'); hb.setAttribute('aria-label', '메뉴 열기'); }
  document.body.style.overflow = '';
}
function toggleDrawer() {
  const sb = document.getElementById('primarySidebar');
  if (!sb) return;
  if (sb.dataset.open === 'true') closeDrawer(); else openDrawer();
}

// Map current filename → data-nav slug (single source — no sidebar HTML duplication)
function _currentNavSlug() {
  const f = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (f === '' || f === 'index.html') return 'home';
  if (f === 'dashboard-upgrade.html') return 'dashboard-upgrade';
  if (f === 'dashboard-ops.html') return 'dashboard-ops';
  if (f === 'growth.html') return 'growth';
  if (f === 'people.html') return 'people';
  if (f === 'topic.html') return 'records-topics';
  if (f === 'session.html') return 'records-sessions';
  if (f === 'decisions.html') return 'records-decisions';
  if (f === 'feedback.html') return 'records-feedback';
  if (f === 'deferrals.html') return 'records-deferrals';
  if (f === 'system.html') return 'system';
  return null;
}

function _setActiveNav() {
  const slug = _currentNavSlug();
  if (!slug) return;
  document.querySelectorAll('.nav-item[data-nav]').forEach(el => {
    if (el.dataset.nav === slug && el.dataset.state !== 'pending') {
      el.dataset.active = 'true';
      el.classList.add('active');
    } else {
      el.removeAttribute('data-active');
    }
  });
}

// Highlight current page in nav + load version from charter
document.addEventListener('DOMContentLoaded', async () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Drawer wiring (no-op on pages without partial sidebar)
  _setActiveNav();
  const hb = document.getElementById('hamburgerBtn');
  const bd = document.getElementById('sidebarBackdrop');
  if (hb) hb.addEventListener('click', toggleDrawer);
  if (bd) bd.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
  // Resize ≥1024 → force close (drawer becomes sticky in CSS)
  let _rzT = null;
  window.addEventListener('resize', () => {
    if (_rzT) clearTimeout(_rzT);
    _rzT = setTimeout(() => {
      if (window.innerWidth >= 1024) closeDrawer();
    }, 100);
  });
  // Disabled pending nav-item: prevent click
  document.querySelectorAll('.nav-item[aria-disabled="true"]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); });
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
