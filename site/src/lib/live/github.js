/**
 * Live GitHub data, fetched in the visitor's browser from the public REST API.
 * Nothing here is stored in the repo. Budget: 4 requests per cold visit
 * (1 user + 2 tiennm99 repo pages + 1 tiennm99dev page), cached in localStorage
 * for 20 minutes and revalidated with ETags.
 */
import { readJson, writeJson } from './storage.js';

export const API = 'https://api.github.com';
export const USER = 'tiennm99';
export const ORG = 'tiennm99dev';
export const CACHE_KEY = 'gh:v1';
export const TTL_MS = 20 * 60 * 1000;
export const TIMEOUT_MS = 5000;
export const MIN_REMAINING = 4;

const USER_URL = `${API}/users/${USER}`;
const SEED_URLS = [
  `${API}/users/${USER}/repos?type=owner&per_page=100`,
  `${API}/orgs/${ORG}/repos?type=public&per_page=100`,
];

/**
 * @typedef {{ fullName: string, owner: string, name: string, fork: boolean, archived: boolean, stars: number, language: string | null, description: string, homepage: string, url: string, pushedAt: string, topics: string[] }} Repo
 * @typedef {{ avatarUrl: string, name: string, bio: string, followers: number, publicRepos: number, createdAt: string, url: string }} GitHubUser
 * @typedef {{ etag: string | null, next: string | null, data: any }} CacheEntry
 * @typedef {{ v: 1, fetchedAt: number, rate: { remaining: number | null, reset: number | null }, entries: Record<string, CacheEntry> }} Cache
 * @typedef {'fresh' | 'stale' | 'offline'} LiveStatus
 * @typedef {{ status: LiveStatus, asOf: number | null, rateRemaining: number | null, rateReset: number | null, user: GitHubUser | null, repos: Repo[], totals: { stars: number, repos: number } | null, languages: Array<{ name: string, count: number }>, recent: Repo[], byName: Map<string, Repo> }} GitHubData
 */

/**
 * Parses the `rel="next"` URL out of a Link header.
 * @param {string | null} header Link header value.
 * @returns {string | null} Next page URL.
 */
export function nextLink(header) {
  if (!header) return null;
  for (const part of header.split(',')) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="?next"?/);
    if (match) return match[1];
  }
  return null;
}

/**
 * Keeps only the repo fields the site uses (also keeps the cache small).
 * @param {any} raw Repo object from the API.
 * @returns {Repo} Normalised repo.
 */
export function toRepo(raw) {
  return {
    fullName: raw.full_name,
    owner: raw.owner?.login ?? raw.full_name.split('/')[0],
    name: raw.name,
    fork: Boolean(raw.fork),
    archived: Boolean(raw.archived),
    stars: raw.stargazers_count ?? 0,
    language: raw.language ?? null,
    description: raw.description ?? '',
    homepage: raw.homepage ?? '',
    url: raw.html_url,
    pushedAt: raw.pushed_at,
    topics: Array.isArray(raw.topics) ? raw.topics : [],
  };
}

/**
 * @param {any} raw User object from the API.
 * @returns {GitHubUser} Normalised user.
 */
export function toUser(raw) {
  return {
    avatarUrl: raw.avatar_url,
    name: raw.name ?? raw.login,
    bio: raw.bio ?? '',
    followers: raw.followers ?? 0,
    publicRepos: raw.public_repos ?? 0,
    createdAt: raw.created_at,
    url: raw.html_url,
  };
}

/**
 * Derives totals, language counts, recent pushes and the lookup map.
 * Totals and languages count non-fork repos of both accounts, archived included.
 * @param {GitHubUser | null} user Normalised user.
 * @param {Repo[]} repos Normalised repos from both accounts.
 * @returns {Pick<GitHubData, 'user' | 'repos' | 'totals' | 'languages' | 'recent' | 'byName'>} Derived data.
 */
export function derive(user, repos) {
  const own = repos.filter(repo => !repo.fork);
  const counts = new Map();
  for (const repo of own) if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  const languages = [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const recent = [...own].sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt)).slice(0, 5);
  return {
    user,
    repos,
    totals: { stars: own.reduce((sum, repo) => sum + repo.stars, 0), repos: own.length },
    languages,
    recent,
    byName: new Map(repos.map(repo => [repo.fullName.toLowerCase(), repo])),
  };
}

/**
 * @param {unknown} repo Cached repo.
 * @returns {boolean} True when it has the fields `derive` and the sections rely on.
 */
const isRepo = repo => Boolean(repo) && typeof repo === 'object'
  && typeof (/** @type {any} */ (repo).fullName) === 'string'
  && Number.isFinite(/** @type {any} */ (repo).stars);

/**
 * Rebuilds the derived data from a cache snapshot. A cache of the wrong shape
 * (corrupted, or written by an older version) counts as no cache.
 * @param {Cache | null | undefined} cache Cache snapshot.
 * @returns {Pick<GitHubData, 'user' | 'repos' | 'totals' | 'languages' | 'recent' | 'byName'> | null} Derived data, or null when incomplete or invalid.
 */
export function fromCache(cache) {
  try {
    if (!cache || typeof cache !== 'object' || !Number.isFinite(cache.fetchedAt) || !cache.entries || typeof cache.entries !== 'object') return null;
    const user = cache.entries[USER_URL]?.data;
    if (!user || typeof user !== 'object' || Array.isArray(user)) return null;
    /** @type {Repo[]} */
    const repos = [];
    const seen = new Set();
    for (const seed of SEED_URLS) {
      let url = seed;
      while (url) {
        const entry = cache.entries[url];
        if (!entry || !Array.isArray(entry.data) || !entry.data.every(isRepo) || seen.has(url)) return null;
        seen.add(url);
        repos.push(...entry.data);
        url = typeof entry.next === 'string' ? entry.next : null;
      }
    }
    return derive(user, repos);
  } catch {
    return null;
  }
}

/**
 * @param {unknown} rate Cached rate-limit state.
 * @returns {Cache['rate']} The same state when well formed, otherwise unknown.
 */
const validRate = rate => {
  const r = /** @type {any} */ (rate);
  const num = value => (Number.isFinite(value) ? value : null);
  return { remaining: num(r?.remaining), reset: num(r?.reset) };
};

/**
 * @param {Headers} headers Response headers.
 * @returns {{ remaining: number | null, reset: number | null }} Rate-limit state.
 */
function rateFrom(headers) {
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  return { remaining: remaining === null ? null : Number(remaining), reset: reset === null ? null : Number(reset) * 1000 };
}

/** @returns {GitHubData} Empty offline result. */
export function offline() {
  return { status: 'offline', asOf: null, rateRemaining: null, rateReset: null, user: null, repos: [], totals: null, languages: [], recent: [], byName: new Map() };
}

/**
 * Loads GitHub data with cache, ETag revalidation and rate-limit awareness.
 * Degrades: fresh network data, then stale cache (labelled), then offline.
 * @param {{ force?: boolean, fetchImpl?: typeof fetch, storage?: Storage | null, now?: () => number }} [options] Options.
 * @returns {Promise<GitHubData>} Data and its status.
 */
export async function loadGitHub({ force = false, fetchImpl = globalThis.fetch.bind(globalThis), storage, now = Date.now } = {}) {
  const stored = readJson(CACHE_KEY, storage);
  const cached = fromCache(stored);
  // An invalid cache is dropped whole (its ETags too), so the next fetch replaces it.
  /** @type {Cache | null} */
  const cache = cached ? { ...stored, rate: validRate(stored.rate) } : null;
  const storedRate = validRate(stored?.rate);
  const time = now();
  const withStatus = (status, data, snapshot) => ({
    status,
    asOf: snapshot.fetchedAt,
    rateRemaining: snapshot.rate?.remaining ?? null,
    rateReset: snapshot.rate?.reset ?? null,
    ...data,
  });

  if (cached && !force && time - cache.fetchedAt < TTL_MS) return withStatus('fresh', cached, cache);
  const limited = storedRate.remaining !== null && storedRate.remaining < MIN_REMAINING && (storedRate.reset ?? 0) > time;
  if (limited) return cached ? withStatus('stale', cached, cache) : offline();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  /** @type {Cache} */
  const next = { v: 1, fetchedAt: time, rate: { remaining: null, reset: null }, entries: {} };

  /**
   * Fetches one URL with If-None-Match; stores the normalised body in `next`.
   * @param {string} url API URL.
   * @param {(raw: any) => any} map Body normaliser.
   * @returns {Promise<string | null>} Next page URL.
   */
  const get = async (url, map) => {
    const previous = cache?.entries?.[url];
    const headers = { Accept: 'application/vnd.github+json' };
    if (previous?.etag) headers['If-None-Match'] = previous.etag;
    const response = await fetchImpl(url, { headers, signal: controller.signal });
    const rate = rateFrom(response.headers);
    if (rate.remaining !== null && (next.rate.remaining === null || rate.remaining < next.rate.remaining)) next.rate = rate;
    if (response.status === 304 && previous) {
      next.entries[url] = previous;
      return previous.next;
    }
    if (!response.ok) {
      if (response.status === 403 || response.status === 429) console.warn(`GitHub API rate limit reached (${response.status}); showing cached data.`);
      throw new Error(`GitHub ${response.status} for ${url}`);
    }
    const body = await response.json();
    const entry = { etag: response.headers.get('etag'), next: nextLink(response.headers.get('link')), data: map(body) };
    next.entries[url] = entry;
    return entry.next;
  };

  const follow = async seed => {
    let url = seed;
    while (url) url = await get(url, body => body.map(toRepo));
  };

  try {
    await Promise.all([get(USER_URL, toUser), ...SEED_URLS.map(follow)]);
    writeJson(CACHE_KEY, next, storage);
    const data = fromCache(next);
    if (!data) throw new Error('Incomplete GitHub data');
    return withStatus('fresh', data, next);
  } catch (error) {
    if (!(error instanceof Error && /GitHub (403|429)/.test(error.message))) console.info('GitHub live data unavailable:', error instanceof Error ? error.message : error);
    const rate = next.rate.remaining === null ? storedRate : next.rate;
    if (cache) writeJson(CACHE_KEY, { ...cache, rate }, storage);
    return cached ? withStatus('stale', cached, { ...cache, rate }) : { ...offline(), rateRemaining: rate.remaining, rateReset: rate.reset };
  } finally {
    clearTimeout(timer);
  }
}
