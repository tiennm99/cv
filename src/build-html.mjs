// Renders the default web CV: one static HTML page with inline CSS and no JavaScript.
// Like the other web copies it leaves out the phone number; only the PDF carries it.
// The animated site lives beside it at ./show-off/.
import MarkdownIt from 'markdown-it';
import { dates, socialBase, title } from './build-pdf.mjs';
import { SITE_URL } from './build-markdown.mjs';

const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
markdown.disable('image');
const inline = value => markdown.renderInline(String(value));
const escape = value => markdown.utils.escapeHtml(String(value));

export const SHOW_OFF_PATH = './show-off/';

const CSS = `
:root {
  color-scheme: light dark;
  --paper: #fbfaf7; --ink: #1c1b19; --ink-2: #5d5a54; --line: #e4e0d8; --accent: #b4532a;
  --serif: "Iowan Old Style", "Palatino Linotype", Palatino, Charter, "Bitstream Charter", Georgia, serif;
  --sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root { --paper: #151412; --ink: #ece8e1; --ink-2: #a39e95; --line: #2e2b27; --accent: #e08a5f; }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 1rem/1.65 var(--sans); }
main { max-width: 46rem; margin: 0 auto; padding: 4.5rem 1.25rem 3rem; }
a { color: inherit; text-decoration-color: var(--line); text-decoration-thickness: 1px; text-underline-offset: 0.2em; }
a:hover { color: var(--accent); text-decoration-color: currentColor; }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
header { padding-bottom: 2rem; border-bottom: 1px solid var(--line); }
h1 { margin: 0; font: 600 clamp(2.4rem, 7vw, 3.4rem)/1.05 var(--serif); letter-spacing: -0.02em; }
.headline { margin: 0.75rem 0 0; font: italic 1.2rem/1.4 var(--serif); color: var(--ink-2); }
.contact { display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; margin: 1.25rem 0 0; padding: 0; list-style: none; font-size: 0.92rem; color: var(--ink-2); }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.75rem; }
.button { display: inline-flex; align-items: center; gap: 0.5rem; min-height: 44px; padding: 0 1.1rem; border: 1px solid var(--ink); border-radius: 999px; font-size: 0.95rem; font-weight: 500; text-decoration: none; }
.button.primary { background: var(--ink); color: var(--paper); }
.button.primary:hover { background: var(--accent); border-color: var(--accent); color: var(--paper); }
.button:hover { border-color: var(--accent); }
section { padding-top: 2.5rem; }
h2 { margin: 0 0 1.25rem; font: 600 0.78rem/1 var(--sans); letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
article + article { margin-top: 1.75rem; }
h3 { margin: 0; font: 600 1.25rem/1.3 var(--serif); }
h3 a { text-decoration: none; }
.org { color: var(--ink-2); font-weight: 400; }
.meta { margin: 0.2rem 0 0; font-size: 0.85rem; color: var(--ink-2); font-variant-numeric: tabular-nums; }
article p { margin: 0.6rem 0 0; }
article ul { margin: 0.6rem 0 0; padding-left: 1.1rem; }
article li + li { margin-top: 0.35rem; }
article li::marker { color: var(--accent); }
dl { display: grid; grid-template-columns: minmax(9rem, max-content) 1fr; gap: 0.6rem 1.5rem; margin: 0; }
dt { font-weight: 600; }
dd { margin: 0; color: var(--ink-2); }
footer { margin-top: 3.5rem; padding-top: 1.25rem; border-top: 1px solid var(--line); font-size: 0.85rem; color: var(--ink-2); }
@media (max-width: 34rem) {
  main { padding-top: 3rem; }
  dl { grid-template-columns: 1fr; gap: 0.15rem; }
  dd { margin-bottom: 0.6rem; }
}
@media print {
  :root { --paper: #fff; --ink: #000; --ink-2: #333; --line: #ccc; --accent: #000; }
  main { max-width: none; padding: 0; }
  .actions, footer { display: none; }
  section, article { break-inside: avoid; }
  a { text-decoration: none; }
}
`;

/**
 * @param {object} item Dated CV entry.
 * @returns {string} Article HTML.
 */
function entry(item) {
  const heading = item.position
    ? `${inline(item.position)} <span class="org">· ${inline(item.company)}</span>`
    : inline(item.name ?? item.institution);
  const meta = [item.degree && `${item.degree} in ${item.area}`, dates(item), item.location].filter(Boolean).map(escape).join(' · ');
  return [
    '<article>',
    `<h3>${heading}</h3>`,
    `<p class="meta">${meta}</p>`,
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
<link rel="alternate" type="text/markdown" href="./llms-full.txt" title="CV in Markdown">
<style>${CSS.trim()}</style>
</head>
<body>
<main>
<header>
<h1>${escape(cv.name)}</h1>
<p class="headline">${escape(cv.headline)}</p>
<ul class="contact">${contact.map(item => `<li>${item}</li>`).join('')}</ul>
<div class="actions">
<a class="button primary" href="./miti99.pdf" download="Tien-Nguyen-Minh-CV.pdf">Download PDF</a>
<a class="button" href="${SHOW_OFF_PATH}">Show off ✦</a>
</div>
</header>
${sections.join('\n')}
<footer>Also as <a href="./miti99.pdf">PDF</a> and <a href="./llms-full.txt">Markdown</a> · <a href="https://github.com/tiennm99/cv">Source</a></footer>
</main>
</body>
</html>
`;
}
