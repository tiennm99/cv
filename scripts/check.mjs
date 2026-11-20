// Checks the PDF CV and the dist/ layout after `npm run build`.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import { normalizedLinks, pdfUrlLinks } from '../src/link-checks.mjs';
import { loadCv } from '../src/load-cv.mjs';
import { llmsFull, llmsTxt, readme } from '../src/build-markdown.mjs';

const root = new URL('../', import.meta.url);
const cv = await loadCv(new URL('miti99.yml', root));
const pdfPath = fileURLToPath(new URL('dist/miti99.pdf', root));

// ---------- PDF ----------
const info = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
assert.match(info, /Pages:\s+1\b/, 'PDF must fit one page');
assert.match(info, /Page size:\s+612 x 792 pts/, 'PDF must use US Letter');
assert.match(info, /Tagged:\s+yes/, 'PDF must be tagged');
const pdfText = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' });
const pdfLinks = pdfUrlLinks(execFileSync('pdfinfo', ['-url', pdfPath], { encoding: 'utf8' }));

const markdown = new MarkdownIt({ html: false });
const text = [];
const links = new Set([cv.website, `mailto:${cv.email}`, `tel:${cv.phone.replace(/[^\d+]/g, '')}`]);
function collect(value, key) {
  if (key === 'website') return;
  if (['date', 'start_date', 'end_date'].includes(key)) {
    const raw = String(value);
    const [year, month] = raw.split('-');
    text.push(month ? `${new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(`${year}-${month}-01T00:00:00Z`))} ${year}` : raw);
    return;
  }
  if (typeof value === 'string') {
    const tokens = markdown.parseInline(value, {})[0]?.children ?? [];
    text.push(tokens.filter(token => ['text', 'code_inline'].includes(token.type)).map(token => token.content).join(''));
    for (const token of tokens) if (token.type === 'link_open') links.add(token.attrGet('href'));
  } else if (Array.isArray(value)) value.forEach(item => collect(item));
  else for (const [childKey, item] of Object.entries(value)) collect(item, childKey);
}
collect(cv);
for (const social of cv.social_networks) links.add(social.network === 'GitHub' ? `https://github.com/${social.username}` : `https://linkedin.com/in/${social.username}`);
const normalize = value => value.normalize('NFKC').replace(/[\s­]/g, '').toLowerCase();
for (const expected of text) assert.ok(normalize(pdfText).includes(normalize(expected)), 'PDF lost source text');
for (const expected of normalizedLinks(links)) assert.ok(pdfLinks.has(expected), `PDF lost link: ${expected}`);

// ---------- dist/ layout ----------
const top = (await readdir(new URL('dist/', root))).sort();
assert.deepEqual(top, ['assets', 'favicon.svg', 'index.html', 'llms-full.txt', 'llms.txt', 'miti99.pdf'], `Unexpected dist/ entries: ${top.join(', ')}`);
assert.deepEqual(await readFile(new URL('miti99.pdf', root)), await readFile(pdfPath), 'Root miti99.pdf differs from dist/miti99.pdf; commit the rebuilt PDF');
await assert.rejects(access(new URL('index.html', root)), 'The old web CV (root index.html) must not come back');
const html = await readFile(new URL('dist/index.html', root), 'utf8');

// ---------- Markdown copies ----------
const readmeText = await readFile(new URL('README.md', root), 'utf8');
assert.equal(readmeText, readme(cv), 'README.md is stale; run npm run build and commit it');
assert.equal(await readFile(new URL('dist/llms.txt', root), 'utf8'), llmsTxt(cv), 'dist/llms.txt is stale');
const full = await readFile(new URL('dist/llms-full.txt', root), 'utf8');
assert.equal(full, llmsFull(cv), 'dist/llms-full.txt is stale');
for (const source of [full, readmeText]) {
  const visible = normalize(source.replace(/\[([^\]]*)\]\([^)\s]+\)/g, '$1').replace(/[*`]/g, ''));
  for (const expected of text.filter(value => value !== cv.phone)) assert.ok(visible.includes(normalize(expected)), `Markdown copy lost source text: ${expected}`);
  assert.ok(!source.includes(cv.phone), 'Phone number must stay out of the Markdown copies');
}
assert.match(html, /<div id="app">/, 'dist/index.html is not the landing site');

console.log('Passed: tagged one-page Letter PDF with every source text and link; dist/ holds the landing site, the PDF and llms.txt; README.md is current.');
