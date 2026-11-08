import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import { normalizedLinks, pdfUrlLinks } from '../src/link-checks.mjs';
import { loadCv } from '../src/load-cv.mjs';
import { launchBrowser } from '../src/browser.mjs';
import { createPreviewServer } from './preview.mjs';

const root = new URL('../', import.meta.url);
const cv = await loadCv(new URL('miti99.yml', root));
const pdfPath = fileURLToPath(new URL('dist/miti99.pdf', root));
const info = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
assert.match(info, /Pages:\s+1\b/, 'PDF must fit one page');
assert.match(info, /Page size:\s+612 x 792 pts/, 'PDF must use US Letter');
assert.match(info, /Tagged:\s+yes/, 'PDF must be tagged');
const pdfText = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' });
const pdfLinks = pdfUrlLinks(execFileSync('pdfinfo', ['-url', pdfPath], { encoding: 'utf8' }));
assert.deepEqual((await readdir(new URL('dist/', root))).sort(), ['index.html', 'miti99.pdf']);
for (const name of ['index.html', 'miti99.pdf']) assert.deepEqual(await readFile(new URL(name, root)), await readFile(new URL(`dist/${name}`, root)));

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
const normalize = value => value.normalize('NFKC').replace(/[\s\u00ad]/g, '').toLowerCase();
for (const expected of text) assert.ok(normalize(pdfText).includes(normalize(expected)), 'PDF lost source text');
for (const expected of normalizedLinks(links)) assert.ok(pdfLinks.has(expected), `PDF lost link: ${expected}`);

const server = createPreviewServer();
const browser = await launchBrowser();
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const page = await browser.newPage();
  await page.goto(origin);
  assert.equal(await page.locator('script').count(), 0, 'Public page must work without JavaScript');
  assert.equal(await page.locator('link[href^="http"], [src^="http"]').count(), 0, 'Public page must be self-contained');
  const htmlText = await page.locator('body').innerText();
  for (const expected of text) assert.ok(normalize(htmlText).includes(normalize(expected)), 'HTML lost source text');
  const htmlLinks = normalizedLinks(await page.locator('a[href]').evaluateAll(anchors => anchors.map(anchor => anchor.href)));
  for (const expected of normalizedLinks(links)) assert.ok(htmlLinks.has(expected), `HTML lost link: ${expected}`);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Horizontal overflow at ${width}px`);
  }
  const downloadEvent = page.waitForEvent('download');
  await page.locator('a[download][href="./miti99.pdf"], a[download][href="miti99.pdf"]').click();
  const download = await downloadEvent;
  assert.equal(download.suggestedFilename(), 'miti99.pdf');
  assert.equal(await download.failure(), null);
  const downloaded = await readFile(await download.path());
  assert.deepEqual(downloaded, await readFile(pdfPath));
  assert.equal((await fetch(`${origin}/miti99.yml`)).status, 404, 'Preview must expose only public outputs');
  console.log('Passed: source text and links, tagged one-page Letter PDF, responsive widths, public-only preview, and PDF download.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
