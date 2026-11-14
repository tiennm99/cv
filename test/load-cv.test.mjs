import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { loadCv, validateCvDocument } from '../src/load-cv.mjs';

const source = parse(await readFile(new URL('../miti99.yml', import.meta.url), 'utf8'));
const fresh = () => structuredClone({ cv: source.cv });

test('accepts the real CV without altering its content', () => {
  const input = fresh();
  const before = structuredClone(input);
  assert.deepEqual(validateCvDocument(input), source.cv);
  assert.deepEqual(input, before);
});

test('rejects content the supported renderer would silently lose', () => {
  for (const change of [
    value => { value.cv.sections.publications = []; },
    value => { value.cv.sections.projects[0].url = 'https://example.com'; },
    value => { value.cv.photo = 'portrait.png'; },
    value => { value.cv.social_networks[0].network = 'Unsupported'; },
    value => { value.design = {}; },
  ]) {
    const input = fresh();
    change(input);
    assert.throws(() => validateCvDocument(input), /unsupported/);
  }
});

test('rejects invalid dates, URLs, and required content with a field path', () => {
  for (const [change, expected] of [
    [value => { value.cv.sections.experience[0].start_date = '2020-13'; }, /start_date/],
    [value => { value.cv.sections.experience[0].end_date = '2019'; }, /precedes/],
    [value => { value.cv.sections.projects[0].date = 2026; }, /not both/],
    [value => { value.cv.website = 'javascript:alert(1)'; }, /cv.website/],
    [value => { value.cv.sections.projects[0].summary = '[unsafe](javascript:alert(1))'; }, /summary/],
    [value => { value.cv.sections.education[0].highlights = []; }, /highlights/],
    [value => { value.cv.name = ''; }, /cv.name/],
  ]) {
    const input = fresh();
    change(input);
    assert.throws(() => validateCvDocument(input), expected);
  }
});

test('reports malformed YAML and duplicate keys clearly', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'cv-validation-'));
  try {
    const path = join(directory, 'invalid.yml');
    for (const yaml of ['cv: [', 'cv: {}\ncv: {}\n']) {
      await writeFile(path, yaml);
      await assert.rejects(loadCv(path), /Invalid YAML/);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('rejects HTTP URLs whose authority would require parser repair', () => {
  for (const website of [
    'https:example.com', 'https:/example.com', 'https:///example.com',
    'https:////example.com', 'https:\\example.com', 'https://\\example.com',
    'https://example.com\\path',
  ]) {
    const input = fresh();
    input.cv.website = website;
    assert.throws(() => validateCvDocument(input), /cv.website/, website);
    const markdownInput = fresh();
    markdownInput.cv.sections.projects[0].summary = `[project](<${website}>)`;
    assert.throws(() => validateCvDocument(markdownInput), /summary/, website);
  }
});

test('accepts explicit case-insensitive HTTP authorities without changing them', () => {
  for (const website of ['HTTPS://EXAMPLE.com:443/Path?A=1&B=2', 'http://EXAMPLE.com:80/', 'https://[::1]:443/path']) {
    const input = fresh();
    input.cv.website = website;
    input.cv.sections.projects[0].summary = `[project](${website})`;
    assert.equal(validateCvDocument(input).website, website);
  }
});
