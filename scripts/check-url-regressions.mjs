import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { launchBrowser } from '../src/browser.mjs';
import { loadCv, validateCvDocument } from '../src/load-cv.mjs';
import { normalizedLinks, pdfUrlLinks } from '../src/link-checks.mjs';
import { renderHtml } from '../src/render-html.mjs';

const root = new URL('../', import.meta.url);
const cv = structuredClone(await loadCv(new URL('miti99.yml', root)));
const website = 'HTTPS://EXAMPLE.com:443/Path?first=1&second=2';
const markdownLink = 'http://EXAMPLE.com:80/Docs?first=1&second=2';
cv.website = website;
cv.sections.projects[0].name = cv.sections.projects[0].name.replace(/\]\(https?:[^)]+\)/, `](${markdownLink})`);
validateCvDocument({ cv });
const html = renderHtml(cv, await readFile(new URL('styles/cv.css', root), 'utf8'));
const directory = await mkdtemp(join(tmpdir(), 'cv-url-regressions-'));
let browser;
try {
  browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const htmlLinks = normalizedLinks(await page.locator('a[href]').evaluateAll(anchors =>
    anchors.map(anchor => anchor.href).filter(href => /^(?:https?:|mailto:|tel:)/i.test(href))));
  const path = join(directory, 'links.pdf');
  await writeFile(path, await page.pdf({ format: 'Letter', preferCSSPageSize: true, printBackground: true, tagged: true }));
  const pdfLinks = pdfUrlLinks(execFileSync('pdfinfo', ['-url', path], { encoding: 'utf8' }));
  for (const expected of normalizedLinks([website, markdownLink, `mailto:${cv.email}`, `tel:${cv.phone.replace(/[^\d+]/g, '')}`])) {
    assert.ok(htmlLinks.has(expected), `HTML lost link: ${expected}`);
    assert.ok(pdfLinks.has(expected), `PDF lost link: ${expected}`);
  }
  console.log('Passed: real HTML/PDF URL normalization for uppercase hosts, default ports, paths, queries, and contacts.');
} finally {
  try { await browser?.close(); }
  finally { await rm(directory, { recursive: true, force: true }); }
}
