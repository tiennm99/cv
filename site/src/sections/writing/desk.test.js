// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { LEDE_MARK, ago, cleanSummary, ledeParser, markLede, newsletterNo, postLang, splitLede } from './desk.js';

const NEWSLETTER = '<p><em>Mời bạn thưởng thức Newsletter #139.</em></p><h2 id="x"><a href="https://example.com/a">What Go Taught Us</a></h2><p>So sánh ParparVM với Go.</p>';

describe('desk helpers', () => {
  it('detects Vietnamese posts by their letters', () => {
    expect(postLang({ title: 'Khi AI crawler đi dạo khắp Gitea tự host của mình' })).toBe('vi');
    expect(postLang({ title: 'Newsletter #139', summary: 'Mời bạn thưởng thức' })).toBe('vi');
    expect(postLang({ title: 'How to name things', summary: 'Plain English text.' })).toBe('en');
  });

  it('reads newsletter issue numbers only from newsletter titles', () => {
    expect(newsletterNo('Newsletter #139')).toBe(139);
    expect(newsletterNo(' newsletter # 7 ')).toBe(7);
    expect(newsletterNo('Newsletter #139: extra')).toBeNull();
    expect(newsletterNo('Góc làm việc cuối 2026')).toBeNull();
  });

  it('drops the newsletter greeting and decodes leftover entities', () => {
    expect(cleanSummary('Mời bạn thưởng thức Newsletter #139. What Go Taught Us')).toBe('What Go Taught Us');
    expect(cleanSummary('ba &ldquo;vị khách&rdquo; ghé')).toBe('ba "vị khách" ghé');
    expect(cleanSummary('No greeting here.')).toBe('No greeting here.');
  });

  it('moves a newsletter lede title in front of the body and leaves long reads alone', () => {
    const marked = markLede(NEWSLETTER, new DOMParser());
    expect(marked.startsWith(`What Go Taught Us${LEDE_MARK} `)).toBe(true);
    expect(marked).not.toContain('Mời bạn');
    const longRead = '<p>Mình muốn mở chỗ làm việc.</p><h2>Phần một</h2>';
    expect(markLede(longRead, new DOMParser())).toBe(longRead);
  });

  it('marks descriptions inside a feed document', () => {
    const escaped = NEWSLETTER.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const xml = `<rss><channel><item><title>Newsletter #139</title><description>${escaped}</description></item></channel></rss>`;
    const doc = ledeParser(new DOMParser()).parseFromString(xml, 'application/xml');
    expect(doc.getElementsByTagName('description')[0].textContent).toMatch(/^What Go Taught Us⁣/);
  });

  it('splits the lede from the body', () => {
    expect(splitLede(`Fast and Hard Code${LEDE_MARK} Theo Armin Ronacher`)).toEqual({ lede: 'Fast and Hard Code', body: 'Theo Armin Ronacher' });
    expect(splitLede('Mình muốn mở chỗ làm việc.')).toEqual({ lede: '', body: 'Mình muốn mở chỗ làm việc.' });
  });

  it('rounds post ages down', () => {
    const now = Date.parse('2026-11-14T06:55:00Z');
    expect(ago('2026-11-03T17:00:00.000Z', now)).toBe('10 days ago');
    expect(ago('2026-11-13T17:00:00.000Z', now)).toBe('today');
    expect(ago('2026-10-06T17:00:00.000Z', now)).toBe('5 weeks ago');
    expect(ago('2026-07-01T00:00:00.000Z', now)).toBe('4 months ago');
  });
});
