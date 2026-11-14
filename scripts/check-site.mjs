// Checks the built landing site in dist/, served under the /cv/ project-site path:
// - static: relative URLs only, no phone number in any text asset, no CDN hosts;
// - in Chromium: every asset loads under /cv/, only the allowed live APIs are
//   requested, no console or page errors, no horizontal overflow from 360 to 1920px
//   (motion on, and reduced motion without WebGL), and the PDF download works.
// External requests are blocked, so the run also covers the offline fallbacks.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCv } from '../src/load-cv.mjs';
import { launchBrowser } from '../src/browser.mjs';
import { createPreviewServer, BASE } from './preview.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
const cv = await loadCv(join(root, 'miti99.yml'));
const TEXT = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest']);
const CDN = /\b(?:fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|esm\.sh|cdn\.skypack\.dev)\b/;
/** Hosts the page may call at runtime: live GitHub data, avatars and the blog feed. */
const ALLOWED_HOSTS = new Set(['api.github.com', 'avatars.githubusercontent.com', 'github.com', 'miti99.com']);
const WIDTHS = [360, 390, 768, 1440, 1920];

/**
 * @param {string} dir Directory.
 * @returns {Promise<string[]>} Files below it.
 */
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)])));
  return nested.flat();
}

// ---------- static ----------
const all = await files(out);
const html = await readFile(join(out, 'index.html'), 'utf8');
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  assert.ok(!url.startsWith('/'), `Root-relative URL breaks the /cv/ project site: ${url}`);
}
const digits = cv.phone.replace(/\D/g, '');
const local = digits.replace(/^84/, '');
const phonePatterns = [digits, local, `0${local}`].map(value => new RegExp(value.split('').join('[\\s().+-]*')));
// The PDF is the HR copy and carries the phone by design; every web asset must not.
for (const file of all.filter(file => TEXT.has(extname(file)))) {
  const text = await readFile(file, 'utf8');
  for (const pattern of phonePatterns) assert.ok(!pattern.test(text), `Phone number found in ${file}`);
  assert.ok(!CDN.test(text), `Runtime CDN reference in ${file}`);
}

// ---------- browser ----------
/** Finds visible elements that stick out past the viewport and are not clipped by an ancestor. */
const overflowProbe = () => {
  const vw = document.documentElement.clientWidth;
  const found = [];
  for (const el of document.body.querySelectorAll('*')) {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.right <= vw + 1 && rect.left >= -1) continue;
    const style = getComputedStyle(el);
    if (style.position === 'fixed' || style.visibility === 'hidden') continue;
    let clipped = false;
    for (let up = el.parentElement; up && up !== document.body; up = up.parentElement) {
      const s = getComputedStyle(up);
      if (s.position === 'fixed') { clipped = true; break; }
      if (s.overflowX === 'visible' && !s.contain.includes('paint')) continue;
      const box = up.getBoundingClientRect();
      if (box.right <= vw + 1 && box.left >= -1) { clipped = true; break; }
    }
    if (!clipped) found.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} (${Math.round(rect.left)}..${Math.round(rect.right)})`);
  }
  return { scrollWidth: document.documentElement.scrollWidth, vw, found: found.slice(0, 5) };
};

const server = createPreviewServer(out);
const browser = await launchBrowser();
const problems = [];
const externalHosts = new Set();

/**
 * Opens the site in a fresh context that blocks external requests and records problems.
 * @param {string} label Context name for messages.
 * @param {import('playwright').BrowserContextOptions} options Context options.
 * @param {string} url Page URL.
 * @returns {Promise<{ page: import('playwright').Page, context: import('playwright').BrowserContext }>} Page.
 */
async function open(label, options, url) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, ...options });
  const origin = new URL(url).origin;
  await context.route('**/*', route => {
    const target = new URL(route.request().url());
    if (target.origin === origin || target.protocol === 'data:' || target.protocol === 'blob:') return route.continue();
    externalHosts.add(target.hostname);
    return route.abort('internetdisconnected');
  });
  const page = await context.newPage();
  page.on('pageerror', error => problems.push(`[${label}] page error: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const source = message.location().url;
    // Blocked external calls log a network error; the page must still render fine.
    if (/Failed to load resource/.test(message.text()) && source && new URL(source).origin !== origin) return;
    problems.push(`[${label}] console error: ${message.text()}`);
  });
  page.on('response', response => {
    const target = new URL(response.url());
    if (target.origin !== origin) return;
    if (!target.pathname.startsWith(BASE)) problems.push(`[${label}] request outside ${BASE}: ${target.pathname}`);
    if (response.status() >= 400) problems.push(`[${label}] ${response.status()} for ${target.pathname}`);
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  return { page, context };
}

/**
 * Scrolls through the whole page so scroll-driven code runs, then back to the top.
 * @param {import('playwright').Page} page Page.
 */
async function sweep(page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = await page.evaluate(() => innerHeight);
  for (let y = 0; y < height; y += step) {
    await page.evaluate(top => window.scrollTo(0, top), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

/**
 * @param {import('playwright').Page} page Page.
 * @param {string} label Context name.
 * @param {number[]} widths Viewport widths.
 */
async function checkWidths(page, label, widths) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.waitForTimeout(600);
    const result = await page.evaluate(overflowProbe);
    if (result.scrollWidth > result.vw || result.found.length) problems.push(`[${label}] horizontal overflow at ${width}px: ${result.found.join('; ') || `scrollWidth ${result.scrollWidth}`}`);
  }
}

try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const site = `http://127.0.0.1:${server.address().port}${BASE}`;

  const motion = await open('motion', {}, site);
  assert.equal(await motion.page.locator('main section').count() >= 10, true, 'Expected the ten sections on the page');
  await sweep(motion.page);
  await checkWidths(motion.page, 'motion', WIDTHS);
  const shown = await motion.page.locator('body').innerText();
  for (const pattern of phonePatterns) assert.ok(!pattern.test(shown), 'Phone number rendered on the page');
  assert.ok(shown.includes(cv.email), 'The yml email is missing from the page');
  await motion.context.close();

  const still = await open('reduced, no WebGL', { reducedMotion: 'reduce' }, `${site}?nogl`);
  await sweep(still.page);
  await checkWidths(still.page, 'reduced, no WebGL', WIDTHS);
  const link = still.page.locator('a[href="./miti99.pdf"][download]').first();
  await link.scrollIntoViewIfNeeded();
  const [download] = await Promise.all([still.page.waitForEvent('download'), link.click()]);
  assert.equal(await download.failure(), null);
  assert.match(download.suggestedFilename(), /\.pdf$/);
  assert.deepEqual(await readFile(await download.path()), await readFile(join(out, 'miti99.pdf')), 'Downloaded file is not dist/miti99.pdf');
  await still.context.close();

  const unexpected = [...externalHosts].filter(host => !ALLOWED_HOSTS.has(host));
  assert.deepEqual(unexpected, [], `Unexpected runtime hosts: ${unexpected.join(', ')}`);
  assert.deepEqual(problems, [], `Site problems:\n${problems.join('\n')}`);
  console.log(`Passed: ${all.length} files, relative URLs, no phone number, no CDN hosts; under ${BASE}: assets load, runtime hosts ${[...externalHosts].sort().join(', ') || 'none'}, no errors, no overflow at ${WIDTHS.join('/')}px, PDF download.`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
