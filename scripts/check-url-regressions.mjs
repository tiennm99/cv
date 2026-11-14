// Checks that unusual but valid URLs (uppercase hosts, default ports, paths, queries)
// and the contact links survive into the Typst PDF as working links.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildPdf } from '../src/build-pdf.mjs';
import { loadCv, validateCvDocument } from '../src/load-cv.mjs';
import { normalizedLinks, pdfUrlLinks } from '../src/link-checks.mjs';

const root = new URL('../', import.meta.url);
const cv = structuredClone(await loadCv(new URL('miti99.yml', root)));
const website = 'HTTPS://EXAMPLE.com:443/Path?first=1&second=2';
const markdownLink = 'http://EXAMPLE.com:80/Docs?first=1&second=2';
cv.website = website;
cv.sections.projects[0].name = cv.sections.projects[0].name.replace(/\]\(https?:[^)]+\)/, `](${markdownLink})`);
validateCvDocument({ cv });
const directory = await mkdtemp(join(tmpdir(), 'cv-url-regressions-'));
try {
  const path = join(directory, 'links.pdf');
  buildPdf(cv, path);
  const pdfLinks = pdfUrlLinks(execFileSync('pdfinfo', ['-url', path], { encoding: 'utf8' }));
  for (const expected of normalizedLinks([website, markdownLink, `mailto:${cv.email}`, `tel:${cv.phone.replace(/[^\d+]/g, '')}`])) {
    assert.ok(pdfLinks.has(expected), `PDF lost link: ${expected}`);
  }
  console.log('Passed: PDF URL normalization for uppercase hosts, default ports, paths, queries, and contacts.');
} finally {
  await rm(directory, { recursive: true, force: true });
}
