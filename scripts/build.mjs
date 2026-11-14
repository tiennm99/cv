// Builds the public site into dist/: the landing site (site/, Vite) and the PDF CV.
// The PDF is rendered by Chromium from an internal HTML render of miti99.yml; that
// HTML is never published. The root miti99.pdf is the committed copy of the PDF.
// `--site-only` skips the PDF render and reuses the committed root miti99.pdf.
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { build as viteBuild } from 'vite';
import { loadCv } from '../src/load-cv.mjs';
import { renderHtml } from '../src/render-html.mjs';
import { launchBrowser } from '../src/browser.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
const pdfPath = join(root, 'miti99.pdf');

if (!process.argv.includes('--site-only')) {
  const cv = await loadCv(join(root, 'miti99.yml'));
  const html = renderHtml(cv, await readFile(join(root, 'styles/cv.css'), 'utf8'));
  const browser = await launchBrowser();
  let pdf;
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    pdf = await page.pdf({ format: 'Letter', preferCSSPageSize: true, printBackground: true, tagged: true });
  } finally {
    await browser.close();
  }
  await writeFile(pdfPath, pdf);
}

// Vite empties dist/ first, so the PDF is copied in afterwards.
await viteBuild({ configFile: join(root, 'site/vite.config.js'), logLevel: 'warn' });
await copyFile(pdfPath, join(out, 'miti99.pdf'));
console.log('Built the landing site and miti99.pdf into dist/.');
