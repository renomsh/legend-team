// Vera Design System — canonical ROLE_COLORS (v2.0, session_106)
// Single source of truth: tokens.css --c-* variables.
// getComputedStyle reads live tokens; hex fallbacks kept for non-browser contexts.

function getRoleColor(role) {
  return getComputedStyle(document.documentElement).getPropertyValue('--c-' + role).trim();
}

function getRoleColorRgba(role, alpha) {
  const hex = getRoleColor(role);
  if (!hex || !hex.startsWith('#')) return 'rgba(110,110,120,' + alpha + ')';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

window.getRoleColor = getRoleColor;
window.getRoleColorRgba = getRoleColorRgba;

// ROLE_COLORS object — reads from tokens.css at runtime (with hex fallbacks for safety)
window.ROLE_COLORS = new Proxy({
  ace:          '#8B5CF6',
  'ace-review': '#A78BFA',
  arki:         '#06B6D4',
  fin:          '#F59E0B',
  riki:         '#EF4444',
  nova:         '#10B981',
  editor:       '#9CA3AF',
  dev:          '#3B82F6',
  vera:         '#F472B6'
}, {
  get(target, prop) {
    if (typeof prop !== 'string') return target[prop];
    // 'ace-review' has no --c-ace-review token, use fallback
    if (prop === 'ace-review') return target['ace-review'] || '#A78BFA';
    try {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--c-' + prop).trim();
      return val || target[prop];
    } catch (e) {
      return target[prop];
    }
  }
});

// Display name overrides (data key → label)
window.ROLE_LABELS = {
  ace:          'ace',
  'ace-review': 'ace-review',
  arki:         'arki',
  fin:          'fin',
  riki:         'riki',
  nova:         'nova',
  editor:       'edi',
  dev:          'dev',
  vera:         'vera'
};
