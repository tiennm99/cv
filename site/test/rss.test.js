// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { RSS_TTL_MS, loadPosts, parseFeed, plainText } from '../src/lib/live/rss.js';

const FEED = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel><title>miti99</title>
<item><title>Góc làm việc cuối 2026</title><link>https://miti99.com/posts/goc-lam-viec/</link>
<pubDate>Wed, 04 Nov 2026 10:00:00 +0700</pubDate><category>homelab</category><category>linux</category>
<description>&lt;p&gt;DeskMini ở nhà, &lt;strong&gt;code-server&lt;/strong&gt; trên cloud.&lt;/p&gt;</description></item>
<item><title>Newsletter #139</title><link>https://miti99.com/posts/newsletter-139/</link>
<pubDate>Wed, 07 Oct 2026 08:00:00 +0700</pubDate><description>Links of the week</description></item>
<item><title>Bad link</title><link>javascript:alert(1)</link></item>
</channel></rss>`;

const memoryStorage = () => {
  const map = new Map();
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
};

describe('rss', () => {
  it('parses items, categories and plain-text summaries, dropping unsafe links', () => {
    const posts = parseFeed(FEED);
    expect(posts).toHaveLength(2);
    expect(posts[0]).toEqual({
      title: 'Góc làm việc cuối 2026',
      url: 'https://miti99.com/posts/goc-lam-viec/',
      date: '2026-11-04T03:00:00.000Z',
      categories: ['homelab', 'linux'],
      summary: 'DeskMini ở nhà, code-server trên cloud.',
    });
    expect(posts[1].categories).toEqual([]);
  });

  it('truncates long summaries', () => {
    expect(plainText('a '.repeat(300), 20)).toHaveLength(20);
  });

  it('caches for 30 minutes and falls back to stale, then offline', async () => {
    const storage = memoryStorage();
    const ok = vi.fn(async () => new Response(FEED, { status: 200 }));
    const fresh = await loadPosts({ fetchImpl: ok, storage, now: () => 0, limit: 1 });
    expect(fresh.status).toBe('fresh');
    expect(fresh.posts).toHaveLength(1);
    await loadPosts({ fetchImpl: ok, storage, now: () => RSS_TTL_MS - 1 });
    expect(ok).toHaveBeenCalledTimes(1);

    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const failing = vi.fn(async () => new Response('', { status: 500 }));
    const stale = await loadPosts({ fetchImpl: failing, storage, now: () => RSS_TTL_MS + 1 });
    expect(stale.status).toBe('stale');
    expect(stale.posts[0].title).toBe('Góc làm việc cuối 2026');
    const offline = await loadPosts({ fetchImpl: failing, storage: memoryStorage(), now: () => 0 });
    expect(offline).toEqual({ status: 'offline', asOf: null, posts: [] });
    info.mockRestore();
  });

  it('treats a corrupted or old-format cache as none', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    for (const value of [{ fetchedAt: Date.now(), posts: { length: 2 } }, { fetchedAt: 'x', posts: [{ title: 't' }] }, { posts: [null] }]) {
      const storage = memoryStorage();
      storage.setItem('rss:v1', JSON.stringify(value));
      const fresh = await loadPosts({ fetchImpl: async () => new Response(FEED, { status: 200 }), storage, now: () => 0 });
      expect(fresh.status).toBe('fresh');
      const offline = await loadPosts({ fetchImpl: async () => new Response('', { status: 500 }), storage: (() => { const s = memoryStorage(); s.setItem('rss:v1', JSON.stringify(value)); return s; })(), now: () => 0 });
      expect(offline).toEqual({ status: 'offline', asOf: null, posts: [] });
    }
    info.mockRestore();
  });
});
