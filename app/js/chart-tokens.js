/* ============================================================
 * chart-tokens.js — ECharts gradient stop 토큰 helper
 * ------------------------------------------------------------
 * Source spec: D-102 (PD-049/050) §5.2, vera_rev1 §4.2
 * Owner: Phase 2 신설 (Phase 3 호출부 swap 직전 로드)
 *
 * 단일 출처: app/css/tokens.css `--c-chart-bar*`, `--a-chart-area-*`
 * Load order (P-5): tokens.css <link>가 본 <script>보다 먼저 파싱되어야 함.
 *
 * 방어:
 *   - cssVar() 빈 문자열 반환 시 console.error + fallback hex 반환.
 *   - 호출부는 Phase 3 swap에서 CHART_TOKENS.* 함수 호출만 사용.
 * ============================================================ */
(function () {
  'use strict';

  var FALLBACK = {
    '--c-chart-bar-from':  '#F472B6',
    '--c-chart-bar-to':    '#8B5CF6',
    '--c-chart-bar2-from': '#14B8A6',
    '--c-chart-bar2-to':   '#0891B2',
    '--a-chart-area-from': '0.33',
    '--a-chart-area-to':   '0.00'
  };

  function cssVar(name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!v) {
      console.error('[chart-tokens] empty CSS var ' + name + ' — using fallback');
      return FALLBACK[name] || '';
    }
    return v;
  }

  function cssVarNum(name) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var n = parseFloat(raw);
    if (isNaN(n)) {
      console.error('[chart-tokens] non-numeric CSS var ' + name + ' — using fallback');
      return parseFloat(FALLBACK[name]);
    }
    return n;
  }

  function hexToRgba(hex, a) {
    var h = String(hex).replace('#', '');
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  window.CHART_TOKENS = {
    barFrom:   function () { return cssVar('--c-chart-bar-from'); },
    barTo:     function () { return cssVar('--c-chart-bar-to'); },
    bar2From:  function () { return cssVar('--c-chart-bar2-from'); },
    bar2To:    function () { return cssVar('--c-chart-bar2-to'); },
    areaFromA: function () { return cssVarNum('--a-chart-area-from'); },
    areaToA:   function () { return cssVarNum('--a-chart-area-to'); },
    areaFade:  function (hex) {
      return [
        { offset: 0, color: hexToRgba(hex, cssVarNum('--a-chart-area-from')) },
        { offset: 1, color: hexToRgba(hex, cssVarNum('--a-chart-area-to'))   }
      ];
    }
  };
})();
