// Builds the public site into dist/: the landing site (site/, Vite), the PDF CV and
// the llms.txt / llms-full.txt Markdown copies, and regenerates the root README.md.
// The PDF is typeset by Typst from miti99.yml (src/build-pdf.mjs), with no browser.
// The root miti99.pdf and README.md are committed copies.
// `--site-only` skips the PDF render and reuses the committed root miti99.pdf.
import { copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { build as viteBuild } from 'vite';
import { loadCv } from '../src/load-cv.mjs';
import { buildPdf } from '../src/build-pdf.mjs';
import { llmsFull, llmsTxt, readme } from '../src/build-markdown.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
const pdfPath = join(root, 'miti99.pdf');

const cv = await loadCv(join(root, 'miti99.yml'));
if (!process.argv.includes('--site-only')) buildPdf(cv, pdfPath);
await writeFile(join(root, 'README.md'), readme(cv));

// Vite empties dist/ first, so the PDF is copied in afterwards.
await viteBuild({ configFile: join(root, 'site/vite.config.js'), logLevel: 'warn' });
await copyFile(pdfPath, join(out, 'miti99.pdf'));
await writeFile(join(out, 'llms.txt'), llmsTxt(cv));
await writeFile(join(out, 'llms-full.txt'), llmsFull(cv));
console.log('Built the landing site, miti99.pdf and llms.txt into dist/, and README.md.');
