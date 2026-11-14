// Builds the public site into dist/: the landing site (site/, Vite) and the PDF CV.
// The PDF is typeset by Typst from miti99.yml (src/build-pdf.mjs), with no browser.
// The root miti99.pdf is the committed copy of the PDF.
// `--site-only` skips the PDF render and reuses the committed root miti99.pdf.
import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { build as viteBuild } from 'vite';
import { loadCv } from '../src/load-cv.mjs';
import { buildPdf } from '../src/build-pdf.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'dist');
const pdfPath = join(root, 'miti99.pdf');

if (!process.argv.includes('--site-only')) {
  buildPdf(await loadCv(join(root, 'miti99.yml')), pdfPath);
}

// Vite empties dist/ first, so the PDF is copied in afterwards.
await viteBuild({ configFile: join(root, 'site/vite.config.js'), logLevel: 'warn' });
await copyFile(pdfPath, join(out, 'miti99.pdf'));
console.log('Built the landing site and miti99.pdf into dist/.');
