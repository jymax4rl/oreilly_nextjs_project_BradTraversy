/**
 * Lightweight Markdown → safe React-ready HTML for Ops documentation.
 * Supports headings, paragraphs, lists, tables, code, links, blockquotes.
 * Does not execute HTML from source; escapes then applies limited markup.
 */

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text) {
  let s = escapeHtml(text);
  s = s.replace(
    /`([^`]+)`/g,
    '<code class="docs-code-inline">$1</code>',
  );
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g,
    '<a href="$2" class="docs-link">$1</a>',
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  return s;
}

function slugifyHeading(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

/**
 * Extract heading outline from markdown for "On this page".
 * @returns {{ id: string, text: string, level: number }[]}
 */
export function extractMarkdownOutline(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const outline = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,4})\s+(.+)$/.exec(line);
    if (!m) continue;
    const text = m[2].trim();
    outline.push({
      id: slugifyHeading(text),
      text,
      level: m[1].length,
    });
  }
  return outline;
}

/**
 * @param {string} markdown
 * @returns {string} HTML
 */
export function renderDocumentationMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let i = 0;
  let inFence = false;
  let fenceLang = "";
  let fenceBuf = [];
  let listType = null;
  let listBuf = [];
  let tableBuf = [];

  const flushList = () => {
    if (!listType) return;
    const tag = listType === "ol" ? "ol" : "ul";
    html.push(
      `<${tag} class="docs-list">${listBuf
        .map((item) => `<li>${inlineFormat(item)}</li>`)
        .join("")}</${tag}>`,
    );
    listType = null;
    listBuf = [];
  };

  const flushTable = () => {
    if (!tableBuf.length) return;
    const rows = tableBuf.filter((r) => !/^\s*\|?\s*-{3,}/.test(r));
    if (!rows.length) {
      tableBuf = [];
      return;
    }
    const parseRow = (row) =>
      row
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
    const header = parseRow(rows[0]);
    const body = rows.slice(1).map(parseRow);
    html.push('<div class="docs-table-wrap"><table class="docs-table"><thead><tr>');
    header.forEach((c) => html.push(`<th>${inlineFormat(c)}</th>`));
    html.push("</tr></thead><tbody>");
    body.forEach((cols) => {
      html.push("<tr>");
      cols.forEach((c) => html.push(`<td>${inlineFormat(c)}</td>`));
      html.push("</tr>");
    });
    html.push("</tbody></table></div>");
    tableBuf = [];
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      flushList();
      flushTable();
      if (!inFence) {
        inFence = true;
        fenceLang = line.slice(3).trim();
        fenceBuf = [];
      } else {
        html.push(
          `<pre class="docs-pre"><code class="docs-code-block"${
            fenceLang ? ` data-lang="${escapeHtml(fenceLang)}"` : ""
          }>${escapeHtml(fenceBuf.join("\n"))}</code></pre>`,
        );
        inFence = false;
        fenceLang = "";
        fenceBuf = [];
      }
      i += 1;
      continue;
    }

    if (inFence) {
      fenceBuf.push(line);
      i += 1;
      continue;
    }

    if (/^\|/.test(line)) {
      flushList();
      tableBuf.push(line);
      i += 1;
      continue;
    }
    if (tableBuf.length) flushTable();

    const heading = /^(#{2,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugifyHeading(text);
      html.push(
        `<h${level} id="${id}" class="docs-h${level}">${inlineFormat(text)}</h${level}>`,
      );
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushList();
      const note = line.replace(/^>\s?/, "");
      const kind = /^⚠|^warning:/i.test(note)
        ? "warning"
        : /^note:/i.test(note)
          ? "note"
          : "callout";
      html.push(
        `<aside class="docs-callout docs-callout--${kind}" role="note">${inlineFormat(
          note.replace(/^(⚠|warning:|note:)\s*/i, ""),
        )}</aside>`,
      );
      i += 1;
      continue;
    }

    const ul = /^[-*]\s+(.+)$/.exec(line);
    if (ul) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listBuf.push(ul[1]);
      i += 1;
      continue;
    }
    const ol = /^(\d+)\.\s+(.+)$/.exec(line);
    if (ol) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listBuf.push(ol[2]);
      i += 1;
      continue;
    }
    if (listType) flushList();

    if (!line.trim()) {
      i += 1;
      continue;
    }

    html.push(`<p class="docs-p">${inlineFormat(line)}</p>`);
    i += 1;
  }

  flushList();
  flushTable();
  if (inFence && fenceBuf.length) {
    html.push(
      `<pre class="docs-pre"><code class="docs-code-block">${escapeHtml(
        fenceBuf.join("\n"),
      )}</code></pre>`,
    );
  }

  return html.join("\n");
}
