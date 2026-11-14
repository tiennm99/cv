/**
 * Latest blog posts from https://miti99.com/index.xml, fetched live in the browser
 * (the feed sends `access-control-allow-origin: *`) and cached for 30 minutes.
 */
import { readJson, writeJson } from './storage.js';
import { blog } from '../content.js';

export const RSS_CACHE_KEY = 'rss:v1';
export const RSS_TTL_MS = 30 * 60 * 1000;

/**
 * @typedef {{ title: string, url: string, date: string, categories: string[], summary: string }} Post
 * @typedef {{ status: 'fresh' | 'stale' | 'offline', asOf: number | null, posts: Post[] }} PostsResult
 */

/**
 * Strips HTML tags and collapses whitespace.
 * @param {string} html Feed description (HTML escaped as text).
 * @param {number} [max] Maximum characters.
 * @returns {string} Plain text summary.
 */
export function plainText(html, max = 220) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Parses an RSS 2.0 document into posts.
 * @param {string} xml Feed text.
 * @param {DOMParser} [parser] DOMParser instance (injectable for tests).
 * @returns {Post[]} Posts in feed order.
 */
export function parseFeed(xml, parser = new DOMParser()) {
  const doc = parser.parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid feed');
  const field = (item, tag) => item.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';
  return [...doc.getElementsByTagName('item')].map(item => {
    const pub = field(item, 'pubDate');
    const time = Date.parse(pub);
    return {
      title: field(item, 'title'),
      url: field(item, 'link'),
      date: Number.isNaN(time) ? '' : new Date(time).toISOString(),
      categories: [...item.getElementsByTagName('category')].map(node => node.textContent?.trim() ?? '').filter(Boolean),
      summary: plainText(field(item, 'description')),
    };
  }).filter(post => post.title && /^https?:\/\//.test(post.url));
}

/**
 * @param {unknown} post Cached post.
 * @returns {boolean} True when it has the fields the Writing section renders.
 */
const isPost = post => {
  const p = /** @type {any} */ (post);
  return Boolean(p) && typeof p.title === 'string' && typeof p.url === 'string' && /^https?:\/\//.test(p.url)
    && typeof p.date === 'string' && typeof p.summary === 'string' && Array.isArray(p.categories);
};

/**
 * A cache of the wrong shape (corrupted, or written by an older version) counts as none.
 * @param {any} cache Stored cache.
 * @returns {{ fetchedAt: number, posts: Post[] } | null} The cache when usable.
 */
const validCache = cache => (cache && Number.isFinite(cache.fetchedAt) && Array.isArray(cache.posts) && cache.posts.length && cache.posts.every(isPost) ? cache : null);

/**
 * Loads the latest posts. Degrades to the stale cache, then to offline (empty).
 * @param {{ limit?: number, force?: boolean, fetchImpl?: typeof fetch, storage?: Storage | null, now?: () => number, parser?: DOMParser }} [options] Options.
 * @returns {Promise<PostsResult>} Posts and status.
 */
export async function loadPosts({ limit = 6, force = false, fetchImpl = globalThis.fetch?.bind(globalThis), storage, now = Date.now, parser } = {}) {
  const cache = validCache(readJson(RSS_CACHE_KEY, storage));
  const time = now();
  const fromCache = status => ({ status, asOf: cache.fetchedAt, posts: cache.posts.slice(0, limit) });
  if (cache && !force && time - cache.fetchedAt < RSS_TTL_MS) return fromCache('fresh');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetchImpl(blog.feed, { signal: controller.signal });
    if (!response.ok) throw new Error(`Feed ${response.status}`);
    const posts = parseFeed(await response.text(), parser).slice(0, 30);
    if (!posts.length) throw new Error('Empty feed');
    writeJson(RSS_CACHE_KEY, { fetchedAt: time, posts }, storage);
    return { status: 'fresh', asOf: time, posts: posts.slice(0, limit) };
  } catch (error) {
    console.info('Blog feed unavailable:', error instanceof Error ? error.message : error);
    return cache ? fromCache('stale') : { status: 'offline', asOf: null, posts: [] };
  } finally {
    clearTimeout(timer);
  }
}
