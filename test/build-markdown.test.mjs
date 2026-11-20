import assert from 'node:assert/strict';
import test from 'node:test';
import { SITE_URL, cvMarkdown, llmsFull, llmsTxt, readme } from '../src/build-markdown.mjs';
import { loadCv } from '../src/load-cv.mjs';

const cv = await loadCv(new URL('../miti99.yml', import.meta.url));

test('cvMarkdown has every section and entry, and no phone number', () => {
  const markdown = cvMarkdown(cv);
  assert.ok(markdown.startsWith(`# ${cv.name}\n`));
  for (const key of Object.keys(cv.sections)) assert.match(markdown, new RegExp(`^## ${key[0].toUpperCase()}${key.slice(1)}$`, 'm'));
  for (const item of cv.sections.experience) assert.ok(markdown.includes(`### ${item.position} — ${item.company}`));
  for (const item of cv.sections.projects) assert.ok(markdown.includes(`### ${item.name}`));
  for (const item of cv.sections.skills) assert.ok(markdown.includes(`- **${item.label}:** ${item.details}`));
  assert.ok(!markdown.includes(cv.phone));
});

test('readme is marked as generated and links the other formats', () => {
  const text = readme(cv);
  assert.match(text, /^<!-- Generated from miti99\.yml/);
  assert.ok(text.includes('(miti99.pdf)'));
  assert.ok(text.includes(`${SITE_URL}llms.txt`));
  assert.ok(text.includes('docs/development.md'));
});

test('llms.txt follows the llmstxt.org shape', () => {
  const text = llmsTxt(cv);
  const lines = text.split('\n');
  assert.equal(lines[0], `# ${cv.name}`);
  assert.match(lines[2], /^> /);
  assert.ok(text.includes(`(${SITE_URL}llms-full.txt)`));
  for (const line of lines.filter(value => value.startsWith('- '))) assert.match(line, /^- \[[^\]]+\]\(https?:\/\/[^)\s]+\)/);
  assert.ok(!text.includes(cv.phone));
});

test('llms-full.txt is the CV with a pointer back to the site', () => {
  const text = llmsFull(cv);
  assert.ok(text.startsWith(`# ${cv.name}\n\n> CV of ${cv.name}. Website: ${SITE_URL}`));
  assert.ok(text.endsWith(cvMarkdown(cv).split('\n').slice(1).join('\n')));
});
