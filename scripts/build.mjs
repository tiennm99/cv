import { readFile, writeFile, mkdir, rm, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadCv } from '../src/load-cv.mjs';
import { renderHtml } from '../src/render-html.mjs';
import { launchBrowser } from '../src/browser.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
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
await writeFile(join(root, 'index.html'), html);
await writeFile(join(root, 'miti99.pdf'), pdf);
await rm(join(root, 'dist'), { recursive: true, force: true });
await mkdir(join(root, 'dist'));
for (const file of ['index.html', 'miti99.pdf']) await copyFile(join(root, file), join(root, 'dist', file));
console.log('Built index.html and miti99.pdf; public copies are in dist/.');
