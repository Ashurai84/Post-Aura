import fs from "node:fs";
import path from "node:path";

const docsDir = path.resolve(process.cwd(), "docs");
const inputPath = path.join(docsDir, "POSTAURA_V1.md");
const outputPath = path.join(docsDir, "POSTAURA_V1.html");

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function slugify(text, fallbackIndex) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return slug || `section-${fallbackIndex}`;
}

function formatInline(text) {
  let html = escapeHtml(text);

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return html;
}

function isTableSeparator(line) {
  return /^\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/.test(line.trim());
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const headings = [];
  const html = [];

  let paragraph = [];
  let inCodeBlock = false;
  let codeFenceLang = "";
  let codeLines = [];
  let listType = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    html.push(`<p>${formatInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!listType) return;
    html.push(listType === "ol" ? "</ol>" : "</ul>");
    listType = null;
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.startsWith("```")) {
      flushParagraph();
      closeList();

      if (!inCodeBlock) {
        inCodeBlock = true;
        codeFenceLang = line.slice(3).trim();
        codeLines = [];
      } else {
        const languageClass = codeFenceLang ? ` class="language-${escapeHtml(codeFenceLang)}"` : "";
        const codeBody = escapeHtml(codeLines.join("\n"));
        html.push(`<pre><code${languageClass}>${codeBody}</code></pre>`);
        inCodeBlock = false;
        codeFenceLang = "";
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      closeList();

      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = slugify(text, headings.length + 1);
      headings.push({ level, text, id });
      html.push(`<h${level} id="${id}">${formatInline(text)}</h${level}>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      closeList();
      html.push("<hr />");
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushParagraph();
      closeList();

      const headerCells = parseTableRow(line);
      i += 1;

      const bodyRows = [];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
        i += 1;
        bodyRows.push(parseTableRow(lines[i]));
      }

      const headerHtml = headerCells.map((cell) => `<th>${formatInline(cell)}</th>`).join("");
      const bodyHtml = bodyRows
        .map((row) => `<tr>${row.map((cell) => `<td>${formatInline(cell)}</td>`).join("")}</tr>`)
        .join("");

      html.push(`<div class="table-wrap"><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${formatInline(orderedMatch[1])}</li>`);
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${formatInline(unorderedMatch[1])}</li>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();

  return { content: html.join("\n"), headings };
}

function buildHtmlDocument(title, bodyHtml, headings) {
  const toc = headings
    .filter((heading) => heading.level <= 3)
    .map((heading) => {
      const indentClass = heading.level === 1 ? "toc-item" : heading.level === 2 ? "toc-item toc-child" : "toc-item toc-grandchild";
      return `<a class="${indentClass}" href="#${heading.id}">${escapeHtml(heading.text)}</a>`;
    })
    .join("\n");

  const generatedAt = new Date().toLocaleString();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg: #f6f3ea;
      --panel: #fffaf0;
      --ink: #18140f;
      --muted: #544a3e;
      --accent: #c4572a;
      --line: #e5d7c3;
      --code-bg: #221f1a;
      --code-ink: #fef4dc;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      color: var(--ink);
      background:
        radial-gradient(circle at top right, #f9d7af 0%, transparent 40%),
        radial-gradient(circle at bottom left, #f7e8ca 0%, transparent 40%),
        var(--bg);
      font-family: "Charter", "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
      line-height: 1.65;
    }

    .layout {
      max-width: 1280px;
      margin: 0 auto;
      padding: 28px;
      display: grid;
      gap: 24px;
      grid-template-columns: 280px minmax(0, 1fr);
    }

    .toc {
      position: sticky;
      top: 18px;
      align-self: start;
      max-height: calc(100vh - 36px);
      overflow: auto;
      border: 1px solid var(--line);
      background: color-mix(in srgb, var(--panel) 94%, white 6%);
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 14px 38px rgba(30, 20, 10, 0.08);
    }

    .toc h2 {
      margin: 0 0 12px;
      font-family: "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif;
      letter-spacing: 0.03em;
      font-size: 0.85rem;
      text-transform: uppercase;
      color: var(--muted);
    }

    .toc-item {
      display: block;
      color: var(--ink);
      text-decoration: none;
      margin: 8px 0;
      font-size: 0.95rem;
      transition: transform 150ms ease, color 150ms ease;
    }

    .toc-child { margin-left: 12px; font-size: 0.9rem; color: var(--muted); }
    .toc-grandchild { margin-left: 24px; font-size: 0.84rem; color: var(--muted); }

    .toc-item:hover {
      color: var(--accent);
      transform: translateX(2px);
    }

    .content {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 22px;
      padding: 30px;
      box-shadow: 0 18px 42px rgba(26, 19, 13, 0.08);
      animation: fadeIn 380ms ease;
    }

    h1, h2, h3, h4, h5, h6 {
      line-height: 1.2;
      margin: 1.5em 0 0.5em;
      scroll-margin-top: 20px;
    }

    h1 {
      margin-top: 0;
      font-size: clamp(1.8rem, 4vw, 2.8rem);
    }

    h2 {
      font-size: clamp(1.3rem, 2.2vw, 1.8rem);
      border-top: 1px solid var(--line);
      padding-top: 20px;
    }

    p { margin: 0.85em 0; }
    ul, ol { padding-left: 1.3rem; }

    a { color: var(--accent); }

    code {
      font-family: "SF Mono", "Menlo", "Consolas", monospace;
      font-size: 0.9em;
      padding: 0.1em 0.35em;
      border-radius: 6px;
      background: #efe3d1;
    }

    pre {
      background: var(--code-bg);
      color: var(--code-ink);
      border-radius: 14px;
      padding: 14px;
      overflow: auto;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border-radius: 0;
      font-size: 0.88rem;
      line-height: 1.45;
    }

    hr {
      border: 0;
      border-top: 1px solid var(--line);
      margin: 1.8em 0;
    }

    .table-wrap {
      overflow-x: auto;
      margin: 14px 0;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      min-width: 620px;
      border: 1px solid var(--line);
      background: #fffcf6;
    }

    th, td {
      border: 1px solid var(--line);
      text-align: left;
      padding: 9px;
      vertical-align: top;
      font-size: 0.92rem;
    }

    th {
      background: #f2e8d8;
      font-family: "Avenir Next", "Gill Sans", sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      font-size: 0.74rem;
    }

    .meta {
      margin-top: 24px;
      font-size: 0.85rem;
      color: var(--muted);
      border-top: 1px solid var(--line);
      padding-top: 16px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 960px) {
      .layout {
        grid-template-columns: 1fr;
      }

      .toc {
        position: static;
        max-height: none;
      }

      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="toc">
      <h2>Table Of Contents</h2>
      ${toc}
    </aside>

    <main class="content">
      ${bodyHtml}
      <div class="meta">Generated from POSTAURA_V1.md on ${escapeHtml(generatedAt)}</div>
    </main>
  </div>
</body>
</html>`;
}

function main() {
  const markdown = fs.readFileSync(inputPath, "utf8");
  const { content, headings } = markdownToHtml(markdown);
  const title = markdown.split("\n")[0].replace(/^#\s*/, "").trim() || "PostAura Documentation";
  const html = buildHtmlDocument(title, content, headings);

  fs.writeFileSync(outputPath, html, "utf8");
  console.log(`Built docs HTML: ${path.relative(process.cwd(), outputPath)}`);
}

main();
