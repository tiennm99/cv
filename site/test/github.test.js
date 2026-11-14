import { describe, expect, it, vi } from 'vitest';
import { API, CACHE_KEY, TTL_MS, derive, loadGitHub, nextLink, toRepo } from '../src/lib/live/github.js';

const USER_URL = `${API}/users/tiennm99`;
const USER_REPOS = `${API}/users/tiennm99/repos?type=owner&per_page=100`;
const USER_REPOS_2 = `${USER_REPOS}&page=2`;
const ORG_REPOS = `${API}/orgs/tiennm99dev/repos?type=public&per_page=100`;

const rawRepo = (full, extra = {}) => ({
  full_name: full,
  name: full.split('/')[1],
  owner: { login: full.split('/')[0] },
  fork: false,
  archived: false,
  stargazers_count: 0,
  language: 'Go',
  description: '',
  homepage: '',
  html_url: `https://github.com/${full}`,
  pushed_at: '2026-01-01T00:00:00Z',
  ...extra,
});

const BODIES = {
  [USER_URL]: { login: 'tiennm99', name: 'Tien', bio: 'A developer wants to be magician', followers: 10, public_repos: 3, created_at: '2018-05-01T00:00:00Z', avatar_url: 'https://avatars.example/u', html_url: 'https://github.com/tiennm99' },
  [USER_REPOS]: [rawRepo('tiennm99/a', { stargazers_count: 4, pushed_at: '2026-03-01T00:00:00Z' }), rawRepo('tiennm99/fork', { fork: true, stargazers_count: 100, language: 'C' })],
  [USER_REPOS_2]: [rawRepo('tiennm99/old', { archived: true, stargazers_count: 2, language: 'Java' })],
  [ORG_REPOS]: [rawRepo('tiennm99dev/gomoku', { stargazers_count: 1, language: 'JavaScript', pushed_at: '2026-05-01T00:00:00Z' })],
};

/** In-memory Storage. */
function memoryStorage() {
  const map = new Map();
  return {
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
    map,
  };
}

/**
 * Fake fetch returning BODIES with ETags, rate headers and pagination.
 * @param {{ remaining?: number, status?: number, notModified?: boolean }} [options] Behaviour.
 */
function fakeFetch({ remaining = 50, status = 200, notModified = false } = {}) {
  return vi.fn(async (url, init) => {
    const headers = new Headers({ 'x-ratelimit-remaining': String(remaining), 'x-ratelimit-reset': '9999999999', etag: `"${url}"` });
    if (url === USER_REPOS) headers.set('link', `<${USER_REPOS_2}>; rel="next", <${USER_REPOS_2}>; rel="last"`);
    if (status !== 200) return new Response('{}', { status, headers });
    if (notModified && init.headers['If-None-Match'] === `"${url}"`) return new Response(null, { status: 304, headers });
    return new Response(JSON.stringify(BODIES[url]), { status: 200, headers });
  });
}

describe('github helpers', () => {
  it('parses the next link', () => {
    expect(nextLink(`<${USER_REPOS_2}>; rel="next", <x>; rel="last"`)).toBe(USER_REPOS_2);
    expect(nextLink('<x>; rel="prev"')).toBeNull();
    expect(nextLink(null)).toBeNull();
  });

  it('counts stars and languages over non-fork repos, archived included', () => {
    const repos = [...BODIES[USER_REPOS], ...BODIES[USER_REPOS_2], ...BODIES[ORG_REPOS]].map(toRepo);
    const data = derive(null, repos);
    expect(data.totals).toEqual({ stars: 7, repos: 3 });
    expect(data.languages).toEqual([{ name: 'Go', count: 1 }, { name: 'Java', count: 1 }, { name: 'JavaScript', count: 1 }]);
    expect(data.recent.map(repo => repo.fullName)).toEqual(['tiennm99dev/gomoku', 'tiennm99/a', 'tiennm99/old']);
    expect(data.byName.get('tiennm99dev/gomoku')?.stars).toBe(1);
  });
});

describe('loadGitHub', () => {
  it('makes 4 requests cold, then serves the cache inside the TTL', async () => {
    const storage = memoryStorage();
    const fetchImpl = fakeFetch();
    const first = await loadGitHub({ fetchImpl, storage, now: () => 1000 });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(first.status).toBe('fresh');
    expect(first.totals).toEqual({ stars: 7, repos: 3 });
    expect(first.user?.bio).toBe('A developer wants to be magician');
    expect(first.rateRemaining).toBe(50);

    const second = await loadGitHub({ fetchImpl, storage, now: () => 1000 + TTL_MS - 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(second.status).toBe('fresh');
    expect(second.asOf).toBe(1000);
  });

  it('revalidates with If-None-Match after the TTL and keeps data on 304', async () => {
    const storage = memoryStorage();
    await loadGitHub({ fetchImpl: fakeFetch(), storage, now: () => 0 });
    const fetchImpl = fakeFetch({ notModified: true });
    const result = await loadGitHub({ fetchImpl, storage, now: () => TTL_MS + 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
    expect(fetchImpl.mock.calls.every(([, init]) => init.headers['If-None-Match'])).toBe(true);
    expect(result.status).toBe('fresh');
    expect(result.asOf).toBe(TTL_MS + 1);
    expect(result.totals?.stars).toBe(7);
  });

  it('falls back to the stale cache on errors, then to offline', async () => {
    const storage = memoryStorage();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await loadGitHub({ fetchImpl: fakeFetch(), storage, now: () => 0 });
    const stale = await loadGitHub({ fetchImpl: fakeFetch({ status: 403, remaining: 0 }), storage, now: () => TTL_MS + 5 });
    expect(stale.status).toBe('stale');
    expect(stale.asOf).toBe(0);
    expect(stale.totals?.stars).toBe(7);

    const offline = await loadGitHub({ fetchImpl: fakeFetch({ status: 500 }), storage: memoryStorage(), now: () => 0 });
    expect(offline.status).toBe('offline');
    expect(offline.totals).toBeNull();
    warn.mockRestore();
  });

  it('skips the network while the cached rate limit is below 4 and not reset', async () => {
    const storage = memoryStorage();
    await loadGitHub({ fetchImpl: fakeFetch({ remaining: 2 }), storage, now: () => 0 });
    const fetchImpl = fakeFetch();
    const result = await loadGitHub({ fetchImpl, storage, now: () => TTL_MS + 1 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.status).toBe('stale');
  });

  it('survives unusable storage', async () => {
    const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem() {} };
    const result = await loadGitHub({ fetchImpl: fakeFetch(), storage: /** @type {any} */ (broken), now: () => 0 });
    expect(result.status).toBe('fresh');
    expect(JSON.parse(memoryStorage().getItem(CACHE_KEY) ?? 'null')).toBeNull();
  });

  it('treats a corrupted or old-format cache as none and replaces it', async () => {
    const corrupt = [
      { v: 1, fetchedAt: 0, rate: {}, entries: { [USER_URL]: { data: {} }, [USER_REPOS]: { data: 5, next: null } } },
      { v: 1, fetchedAt: 0, rate: {}, entries: { [USER_URL]: { data: {} }, [USER_REPOS]: { data: [{ stars: 1 }], next: null }, [ORG_REPOS]: { data: [], next: null } } },
      { v: 1, fetchedAt: 'x', entries: null },
      [1, 2, 3],
    ];
    for (const value of corrupt) {
      const storage = memoryStorage();
      storage.setItem(CACHE_KEY, JSON.stringify(value));
      const result = await loadGitHub({ fetchImpl: fakeFetch(), storage, now: () => 1 });
      expect(result.status).toBe('fresh');
      expect(result.totals?.stars).toBe(7);
      expect(JSON.parse(storage.getItem(CACHE_KEY) ?? 'null').fetchedAt).toBe(1);
    }
  });
});
