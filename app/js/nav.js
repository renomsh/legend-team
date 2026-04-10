/**
 * Navigation helper
 * Legend Team — read-only viewer
 */

// Highlight current page in nav
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
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
