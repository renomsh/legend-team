/**
 * g1-apply.js — Phase 1 G1 적용 헬퍼 (one-shot)
 *
 * - 8 active 페이지(dashboard-upgrade 제외)에 `<link rel="stylesheet" href="css/tokens.css">` 삽입
 * - 각 페이지의 인라인 <aside class="sidebar">…</aside> 블록을 `<!-- @partial:sidebar -->` 마커로 치환
 * - 색 인라인 :root{} 제거는 작업 1 spec(`--c-*`만)이라 base 토큰 페이지는 그대로 둠
 */
const fs = require('fs');
const path = require('path');
const APP = path.resolve(__dirname, '..', 'app');

const PAGES = [
  'dashboard-ops.html',
  'index.html',
  'topic.html',
  'session.html',
  'decisions.html',
  'feedback.html',
  'people.html',
];

function injectTokensLink(html) {
  // skip if already linked
  if (/href=["']css\/tokens\.css["']/.test(html)) return html;
  // insert before existing first <link rel="stylesheet" href="css/style.css"> or before </head>
  const styleLinkRe = /(<link\s+rel=["']stylesheet["']\s+href=["']css\/style\.css["'][^>]*>)/i;
  if (styleLinkRe.test(html)) {
    return html.replace(styleLinkRe, '<link rel="stylesheet" href="css/tokens.css">\n  $1');
  }
  return html.replace(/<\/head>/i, '  <link rel="stylesheet" href="css/tokens.css">\n</head>');
}

function replaceSidebarWithPartial(html) {
  // already replaced
  if (/<!--\s*@partial:sidebar\s*-->/.test(html)) return html;
  // greedy match <aside class="sidebar"> ... </aside>
  const re = /<aside\s+class=["']sidebar["'][\s\S]*?<\/aside>/i;
  if (!re.test(html)) return html;
  return html.replace(re, '<!-- @partial:sidebar -->');
}

let changed = 0;
for (const f of PAGES) {
  const fp = path.join(APP, f);
  if (!fs.existsSync(fp)) { console.warn(`miss: ${f}`); continue; }
  const before = fs.readFileSync(fp, 'utf8');
  let after = injectTokensLink(before);
  after = replaceSidebarWithPartial(after);
  if (after !== before) {
    fs.writeFileSync(fp, after, 'utf8');
    changed++;
    console.log(`PATCHED: ${f}`);
  } else {
    console.log(`unchanged: ${f}`);
  }
}
console.log(`\nDONE — ${changed}/${PAGES.length} files patched.`);
