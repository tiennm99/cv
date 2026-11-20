// Builds the public site into dist/: the default one-page web CV (index.html, static,
// no JavaScript), the animated show-off site (site/, Vite) in dist/show-off/, the PDF
// CV and the llms.txt / llms-full.txt Markdown copies, and regenerates README.md.
// The PDF is typeset by Typst from miti99.yml (src/build-pdf.mjs), with no browser.
// The root miti99.pdf and README.md are committed copies.
// `--site-only` skips the PDF render and reuses the committed root miti99.pdf.
import { copyFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { build as viteBuild } from 'vite';
import { loadCv } from '../src/load-cv.mjs';
import { buildPdf } from '../src/build-pdf.mjs';
import { llmsFull, llmsTxt, readme } from '../src/build-markdown.mjs';
import { cvHtml } from '../src/build-html.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
const pdfPath = join(root, 'miti99.pdf');

const cv = await loadCv(join(root, 'miti99.yml'));
if (!process.argv.includes('--site-only')) buildPdf(cv, pdfPath);
await writeFile(join(root, 'README.md'), readme(cv));

await rm(out, { recursive: true, force: true });
await viteBuild({ configFile: join(root, 'site/vite.config.js'), logLevel: 'warn' });
await writeFile(join(out, 'index.html'), cvHtml(cv));
await copyFile(join(root, 'site/public/favicon.svg'), join(out, 'favicon.svg'));
await copyFile(pdfPath, join(out, 'miti99.pdf'));
await writeFile(join(out, 'llms.txt'), llmsTxt(cv));
await writeFile(join(out, 'llms-full.txt'), llmsFull(cv));
console.log('Built the web CV, the show-off site, miti99.pdf and llms.txt into dist/, and README.md.');
