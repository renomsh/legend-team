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
    const charter = await fetch('memory/shared/project_charter.json').then(r => r.json());
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

// Status badge HTML
function statusBadge(status) {
  const cls = status === 'open' ? 'status-open' :
              status === 'in-progress' ? 'status-in-progress' :
              'status-closed';
  const label = status === 'open' ? 'open' :
                status === 'in-progress' ? 'in-progress' :
                status === 'closed' ? 'completed' : status;
  return `<span class="status-badge ${cls}">${label}</span>`;
}
