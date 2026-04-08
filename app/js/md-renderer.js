/**
 * Lightweight Markdown → HTML renderer
 * Legend Team — read-only viewer
 */

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function mdToHtml(md) {
  if (!md) return '';

  // Remove YAML frontmatter
  md = md.replace(/^---[\s\S]*?---\n?/, '');

  const lines = md.split('\n');
  const out = [];
  let inTable = false, inCode = false, inUl = false, inOl = false;

  function closeList() {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  }
  function closeTable() {
    if (inTable) { out.push('</tbody></table>'); inTable = false; }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      if (inCode) { out.push('</code></pre>'); inCode = false; }
      else { closeList(); closeTable(); out.push('<pre><code>'); inCode = true; }
      continue;
    }
    if (inCode) { out.push(escHtml(line)); continue; }

    // Table row
    if (line.trim().startsWith('|')) {
      closeList();
      if (!inTable) { out.push('<table><tbody>'); inTable = true; }
      if (line.replace(/[|\-:\s]/g, '') === '') continue;
      const isHeader = !lines[i-1]?.trim().startsWith('|') ||
        (lines[i+1]?.replace(/[|\-:\s]/g, '') === '');
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      const tag = isHeader ? 'th' : 'td';
      out.push('<tr>' + cells.map(c => `<${tag}>${inlineFormat(c)}</${tag}>`).join('') + '</tr>');
      continue;
    }
    if (inTable) closeTable();

    // Headings
    const hMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (hMatch) {
      closeList();
      const level = hMatch[1].length;
      out.push(`<h${level}>${inlineFormat(hMatch[2])}</h${level}>`);
      continue;
    }

    // Unordered list
    if (line.match(/^\s*[-*]\s+/)) {
      if (!inUl) { closeTable(); out.push('<ul>'); inUl = true; }
      out.push(`<li>${inlineFormat(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
      continue;
    }
    if (inUl && !line.match(/^\s*[-*]\s+/)) closeList();

    // Ordered list
    if (line.match(/^\s*\d+\.\s+/)) {
      if (!inOl) { closeTable(); out.push('<ol>'); inOl = true; }
      out.push(`<li>${inlineFormat(line.replace(/^\s*\d+\.\s+/, ''))}</li>`);
      continue;
    }
    if (inOl && !line.match(/^\s*\d+\.\s+/)) closeList();

    // Blockquote
    if (line.startsWith('>')) {
      closeList();
      out.push(`<blockquote>${inlineFormat(line.replace(/^>\s*/, ''))}</blockquote>`);
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      closeList();
      out.push('<hr>');
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      closeList();
      continue;
    }

    // Paragraph
    closeList();
    out.push(`<p>${inlineFormat(line)}</p>`);
  }

  closeList();
  closeTable();
  if (inCode) out.push('</code></pre>');

  return out.join('\n');
}

function sanitizeHref(url) {
  // Allow only http/https/relative paths — block javascript:, data:, etc.
  return /^(https?:\/\/|#|\/)/.test(url.trim()) ? url.trim() : '#';
}

function inlineFormat(text) {
  return text
    .replace(/`([^`]+)`/g, (_, code) => `<code>${escHtml(code)}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
      `<a href="${escHtml(sanitizeHref(url))}">${escHtml(label)}</a>`
    );
}

// Export for module usage
if (typeof module !== 'undefined') module.exports = { mdToHtml, escHtml };
