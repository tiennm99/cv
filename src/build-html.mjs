// Renders the default web CV: one static, printable HTML page (blue on white) with
// inline CSS and no JavaScript. Printing it (Ctrl+P) hides the buttons and the footer.
// Like the other web copies it leaves out the phone number; only the PDF carries it.
// The animated site lives beside it at ./show-off/.
import MarkdownIt from 'markdown-it';
import { dates, socialBase, title } from './build-pdf.mjs';
import { REPO_URL, SITE_URL } from './build-markdown.mjs';

const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
markdown.disable('image');
const inline = value => markdown.renderInline(String(value));
const escape = value => markdown.utils.escapeHtml(String(value));

export const SHOW_OFF_PATH = './show-off/';
/** Favicon of the simple CV, in its blue-on-white theme (the show-off site keeps its own). */
export const FAVICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1d4ed8"/><path d="M6 24V8h4l4 8 4-8h4v16h-3V14l-3 6h-4l-3-6v10z" fill="#fff"/></svg>\n';

const CSS = `
:root {
  color-scheme: light;
  --ink: #1a1f2b; --ink-2: #4a5263; --blue: #1d4ed8; --blue-soft: #dbe6fd;
  --font: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: #fff; color: var(--ink); font: 0.98rem/1.55 var(--font); }
main { max-width: 48rem; margin: 0 auto; padding: 1.25rem 1.25rem 3rem; }
a { color: var(--blue); text-decoration: none; }
a:hover { text-decoration: underline; }
a:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.9rem; }
.button { display: inline-flex; align-items: center; min-height: 40px; padding: 0 0.95rem; border: 1px solid var(--blue); border-radius: 6px; font-size: 0.9rem; font-weight: 600; }
.button:hover { text-decoration: none; background: var(--blue-soft); }
.button.primary { background: var(--blue); color: #fff; }
.button.primary:hover { background: #1e40af; }
header { padding-bottom: 0.9rem; border-bottom: 2px solid var(--blue); }
/* Wide screens: the buttons share the name's row; narrow ones get them after the contacts. */
@media (min-width: 46rem) {
  header { display: grid; grid-template-columns: 1fr auto; column-gap: 1rem; align-items: center; }
  header > * { grid-column: 1 / -1; }
  h1 { grid-column: 1; grid-row: 1; }
  .actions { grid-column: 2; grid-row: 1; margin-top: 0; }
}
h1 { margin: 0; font-size: clamp(1.9rem, 6vw, 2.4rem); line-height: 1.15; color: var(--blue); letter-spacing: -0.01em; }
.headline { margin: 0.25rem 0 0; font-size: 1.1rem; font-weight: 600; }
.contact { display: flex; flex-wrap: wrap; gap: 0.15rem 0; margin: 0.6rem 0 0; padding: 0; list-style: none; font-size: 0.92rem; color: var(--ink-2); }
.contact li + li::before { content: "|"; margin: 0 0.6rem; color: var(--blue-soft); }
section { padding-top: 1.4rem; }
h2 { margin: 0 0 0.75rem; padding-bottom: 0.2rem; border-bottom: 1px solid var(--blue-soft); font-size: 1rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--blue); }
article + article { margin-top: 1rem; }
.row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0 1rem; align-items: baseline; }
h3 { margin: 0; font-size: 1.02rem; }
.row p { margin: 0; }
.role { font-style: italic; }
.right { font-size: 0.9rem; color: var(--ink-2); font-variant-numeric: tabular-nums; white-space: nowrap; }
article p { margin: 0.35rem 0 0; }
article ul { margin: 0.35rem 0 0; padding-left: 1.15rem; }
article li + li { margin-top: 0.2rem; }
article li::marker { color: var(--blue); }
dl { display: grid; grid-template-columns: minmax(9rem, max-content) 1fr; gap: 0.3rem 1.25rem; margin: 0; }
dt { font-weight: 600; }
dd { margin: 0; }
footer { margin-top: 2.5rem; padding-top: 0.75rem; border-top: 1px solid var(--blue-soft); font-size: 0.85rem; color: var(--ink-2); }
@media (max-width: 34rem) {
  .contact { gap: 0.15rem 1rem; }
  .contact li + li::before { content: none; }
  dl { grid-template-columns: 1fr; gap: 0; }
  dd { margin-bottom: 0.5rem; }
}
@page { size: auto; margin: 14mm 14mm 16mm; }
@media print {
  body { font-size: 10.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  main { max-width: none; padding: 0; }
  .actions, footer { display: none; }
  header { display: block; }
  article, dl > * { break-inside: avoid; }
  h2 { break-after: avoid; }
  a:hover { text-decoration: none; }
}
`;

/**
 * @param {object} item Dated CV entry.
 * @returns {string} Article HTML.
 */
function entry(item) {
  // The usual resume layout: organisation and place on the first line, role and
  // dates on the second; a project has its name and dates on one line.
  const lines = item.company
    ? [[inline(item.company), escape(item.location)], [inline(item.position), escape(dates(item))]]
    : item.institution
      ? [[inline(item.institution), escape(item.location)], [escape(`${item.degree} in ${item.area}`), escape(dates(item))]]
      : [[inline(item.name), escape(dates(item))]];
  const [[name, nameRight], role] = lines;
  return [
    '<article>',
    `<div class="row"><h3>${name}</h3><p class="right">${nameRight}</p></div>`,
    role ? `<div class="row"><p class="role">${role[0]}</p><p class="right">${role[1]}</p></div>` : '',
    item.summary ? `<p>${inline(item.summary)}</p>` : '',
    `<ul>${item.highlights.map(highlight => `<li>${inline(highlight)}</li>`).join('')}</ul>`,
    '</article>',
  ].join('');
}

/**
 * The default web CV page.
 * @param {object} cv CV validated by loadCv.
 * @returns {string} HTML document.
 */
export function cvHtml(cv) {
  const website = cv.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const contact = [
    escape(cv.location),
    `<a href="mailto:${escape(cv.email)}">${escape(cv.email)}</a>`,
    `<a href="${escape(cv.website)}">${escape(website)}</a>`,
    ...cv.social_networks.map(social => `<a href="${escape(socialBase[social.network] + encodeURIComponent(social.username))}">${escape(social.network)}</a>`),
  ];
  const sections = Object.entries(cv.sections).map(([key, items]) => {
    const body = key === 'skills'
      ? `<dl>${items.map(item => `<dt>${escape(item.label)}</dt><dd>${inline(item.details)}</dd>`).join('')}</dl>`
      : items.map(entry).join('');
    return `<section aria-labelledby="${key}"><h2 id="${key}">${escape(title(key))}</h2>${body}</section>`;
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(cv.name)} · CV</title>
<meta name="description" content="${escape(`${cv.name}: ${cv.headline}. ${cv.location}.`)}">
<link rel="canonical" href="${SITE_URL}">
<link rel="icon" href="./favicon.svg" type="image/svg+xml">
<link rel="alternate" type="text/markdown" href="./README.md" title="CV in Markdown">
<style>${CSS.trim()}</style>
</head>
<body>
<main>
<header>
<h1>${escape(cv.name)}</h1>
<p class="headline">${escape(cv.headline)}</p>
<ul class="contact">${contact.map(item => `<li>${item}</li>`).join('')}</ul>
<nav class="actions" aria-label="Other versions">
<a class="button primary" href="./miti99.pdf" download="Tien-Nguyen-Minh-CV.pdf">Download PDF</a>
<a class="button" href="${SHOW_OFF_PATH}">Show-off version ✦</a>
</nav>
</header>
${sections.join('\n')}
<footer>Also as <a href="./miti99.pdf">PDF</a> and <a href="./README.md">Markdown (README.md)</a> · <a href="./llms.txt">llms.txt</a> · <a href="${REPO_URL}">Source</a></footer>
</main>
</body>
</html>
`;
}
