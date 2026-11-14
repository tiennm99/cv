import assert from 'node:assert/strict';
import test from 'node:test';
import { pdfData, segments } from '../src/build-pdf.mjs';
import { loadCv } from '../src/load-cv.mjs';

test('segments splits Markdown links and styles into plain segments', () => {
  assert.deepEqual(segments('Tools for [Chaos *Age*](https://example.com/a) and `code`'), [
    { text: 'Tools for ' },
    { text: 'Chaos ', url: 'https://example.com/a' },
    { text: 'Age', url: 'https://example.com/a', em: true },
    { text: ' and ' },
    { text: 'code', code: true },
  ]);
});

test('pdfData keeps every section and the recruiter contact details', async () => {
  const cv = await loadCv(new URL('../miti99.yml', import.meta.url));
  const data = pdfData(cv);
  assert.deepEqual(data.sections.map(section => section.title), Object.keys(cv.sections).map(key => key[0].toUpperCase() + key.slice(1)));
  assert.ok(data.contacts.some(contact => contact.url === `mailto:${cv.email}`));
  assert.ok(data.contacts.some(contact => contact.url?.startsWith('tel:')));
  assert.match(data.sections[0].items[0].dates, /^[A-Z][a-z]{2} \d{4} – (present|[A-Z][a-z]{2} \d{4})$/);
});
