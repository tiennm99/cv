import assert from 'node:assert/strict';
import test from 'node:test';
import { SHOW_OFF_PATH, cvHtml } from '../src/build-html.mjs';
import { loadCv } from '../src/load-cv.mjs';

const cv = await loadCv(new URL('../miti99.yml', import.meta.url));

test('cvHtml renders a static page with every section and no phone number', () => {
  const html = cvHtml(cv);
  assert.match(html, /^<!doctype html>/);
  assert.ok(!/<script/i.test(html), 'no JavaScript');
  for (const key of Object.keys(cv.sections)) assert.ok(html.includes(`<h2 id="${key}">`));
  assert.ok(html.includes(`href="${SHOW_OFF_PATH}"`));
  assert.ok(html.includes('href="./miti99.pdf" download'));
  assert.ok(!html.includes(cv.phone));
});

test('cvHtml escapes text and renders Markdown links', () => {
  const copy = structuredClone(cv);
  copy.name = 'A <b>&</b> B';
  copy.sections.projects[0].summary = 'Uses [Go](https://go.dev/) & <script>';
  const html = cvHtml(copy);
  assert.ok(html.includes('<h1>A &lt;b&gt;&amp;&lt;/b&gt; B</h1>'));
  assert.ok(html.includes('Uses <a href="https://go.dev/">Go</a> &amp; &lt;script&gt;'));
});
