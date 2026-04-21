// Vera template: sequencePanel v1.0 (session_049, Phase 4 — UI)
// Applies: R-D01 (dashed border = recall marker), R-D02 (brand-purple-tint α ∈ {.12,.18,.25} = connector)
// See: memory/shared/design_rules.json, memory/roles/vera_memory.json.templates.sequencePanel
//
// Requires: d3 v7 (global), ROLE_COLORS (global map role→hex)
// Contract:
//   renderSequencePanel({ sequences, svgSelector, cardSelector, emptySelector })
//     sequences: Array<{ sessionId, topic, sequence: Array<{role, phase, turnIdx, recallReason}> }>
//     svgSelector:   default '#seqSvg'
//     cardSelector:  default '#sequencePanelCard'
//     emptySelector: default '#seqEmpty'
//
// Spec (fixed — Editor 판단 영역 없음):
//   labelW=96, nodeR=8, gap=28, rowH=24, topPad=20, maxRows=10
//   labels: mono 11px #06B6D4, clickable → scrollIntoView [data-sid]
//   nodes: circle r=8 fill=ROLE_COLORS[role]; recall → stroke=#F5F5F7 2px dashed 3,2
//   phase-transition: 6×2 white bar above node
//   connector: line 1px rgba(139,92,246,0.25)
//   a11y: 24×24 invisible hit rect per node

(function (global) {
  function render(opts) {
    opts = opts || {};
    const sequences = opts.sequences || [];
    const svgSel = opts.svgSelector || '#seqSvg';
    const cardSel = opts.cardSelector || '#sequencePanelCard';
    const emptySel = opts.emptySelector || '#seqEmpty';

    const svg = d3.select(svgSel);
    const card = document.querySelector(cardSel);
    const empty = document.querySelector(emptySel);
    if (!svg.node() || !card) return;
    svg.selectAll('*').remove();

    if (!sequences.length) { if (empty) empty.style.display = 'grid'; return; }
    if (empty) empty.style.display = 'none';

    const rows = sequences.slice(-10).reverse();
    const labelW = 96, nodeR = 10, gap = 36, rowH = 28, topPad = 20;
    const colors = global.ROLE_COLORS || {};
    const g = svg.append('g');

    rows.forEach((row, rIdx) => {
      const cy = topPad + rIdx * rowH;

      g.append('text')
        .attr('x', 8).attr('y', cy + 4)
        .attr('font-family', 'monospace').attr('font-size', 11).attr('font-weight', 700)
        .attr('fill', '#06B6D4').attr('cursor', 'pointer')
        .text(row.sessionId)
        .on('click', () => {
          const el = document.querySelector(`[data-sid="${row.sessionId}"]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

      const seq = row.sequence || [];
      for (let i = 0; i < seq.length - 1; i++) {
        const x1 = labelW + i * gap + nodeR + 6;
        const x2 = labelW + (i + 1) * gap + nodeR + 6;
        g.append('line')
          .attr('x1', x1).attr('x2', x2).attr('y1', cy).attr('y2', cy)
          .attr('stroke', 'rgba(139,92,246,0.25)').attr('stroke-width', 1);
      }

      seq.forEach((t, i) => {
        const cx = labelW + i * gap + nodeR + 6;
        if (t.recallReason === 'phase-transition') {
          g.append('rect')
            .attr('x', cx - 3).attr('y', cy - nodeR - 5)
            .attr('width', 6).attr('height', 2).attr('fill', '#F5F5F7');
        }
        const color = colors[t.role] || '#6E6E78';
        const node = g.append('circle')
          .attr('cx', cx).attr('cy', cy).attr('r', nodeR)
          .attr('fill', color)
          .attr('stroke', '#0B0B0D').attr('stroke-width', 1.5);
        if (t.recallReason) {
          node.attr('stroke', '#F5F5F7').attr('stroke-width', 2).attr('stroke-dasharray', '4,3');
        }
        const label = `${t.role} · turn#${t.turnIdx} · ${t.phase || '—'}${t.recallReason ? ' · recall:' + t.recallReason : ''}`;
        node.append('title').text(label);
        g.append('rect')
          .attr('x', cx - 12).attr('y', cy - 12).attr('width', 24).attr('height', 24)
          .attr('fill', 'transparent').style('pointer-events', 'all')
          .append('title').text(label);
      });
    });

    const neededH = topPad + rows.length * rowH + 20;
    svg.attr('height', Math.max(neededH, 120));
  }

  global.SequencePanel = { render: render };
})(window);
