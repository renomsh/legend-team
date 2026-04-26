/* metrics-utils.js — growth·people 공유 유틸 (topic_115) */

function renderTier3(agg) {
  const all = (agg.aggregates || []).concat(agg.derivedAggregates || []);
  document.getElementById('t3Count').textContent = all.length;
  let html = '<table class="table"><thead><tr><th>Metric</th><th>Role</th><th>View</th><th>Stratum</th><th>Mean</th><th>n</th><th>Std</th></tr></thead><tbody>';
  for (const a of all) {
    html += `<tr>
      <td>${a.metricId}</td>
      <td>${a.role}</td>
      <td>${a.view}</td>
      <td>${a.stratum?.grade ? 'grade=' + a.stratum.grade : '—'}</td>
      <td class="num">${fmt(a.mean)}</td>
      <td class="num">${a.n}</td>
      <td class="num">${fmt(a.std)}</td>
    </tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('tier3Body').innerHTML = html;
}
