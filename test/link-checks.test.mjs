import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizedLinks, pdfUrlLinks } from '../src/link-checks.mjs';

test('compares complete links using URI normalization for HTML and PDF', () => {
  const expected = 'HTTPS://EXAMPLE.com:443/Path?first=1&second=2';
  const actual = 'https://example.com/Path?first=1&second=2';
  assert.ok(normalizedLinks([actual]).has(new URL(expected).href));
  assert.ok(pdfUrlLinks(`Page  Type          URL\n   1  Annotation    ${actual}\n`).has(new URL(expected).href));
  for (const different of [
    'https://example.com/path?first=1&second=2',
    'https://example.com/Path?second=2&first=1',
    'https://example.com/Path?first=1&second=2&extra=3',
    `https://other.example/?next=${expected}`,
    'https://example.com/Path/longer?first=1&second=2',
  ]) {
    assert.ok(!normalizedLinks([different]).has(new URL(expected).href));
    assert.ok(!pdfUrlLinks(`   1  Annotation    ${different}\n`).has(new URL(expected).href));
  }
});

test('extracts PDF URL table rows while preserving contact URI semantics', () => {
  const links = pdfUrlLinks('Page  Type          URL\n   1  Annotation    mailto:Person@example.com\n   1  Annotation    tel:+123456789\n');
  assert.deepEqual([...links], ['mailto:Person@example.com', 'tel:+123456789']);
  assert.ok(!links.has('mailto:person@example.com'));
  assert.equal(pdfUrlLinks('https://example.com/\n').size, 0);
});
