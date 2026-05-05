/* metrics-utils.js — growth·people 공유 유틸 (topic_115) */

function renderTier3(agg) {
  const allRaw = (agg.aggregates || []).concat(agg.derivedAggregates || []);
  // P3 hidden policy: 값 없는 raw row 제외 (n===0 || mean===null)
  const all = allRaw.filter(a => a.n > 0 && a.mean !== null && a.mean !== undefined);
  document.getElementById('t3Count').textContent = `${all.length} / ${allRaw.length}`;
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
