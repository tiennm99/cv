/**
 * Reactive GitHub state shared by the shell and every section.
 * Read `gh.*` in components; call `startGitHub()` once (App does) and
 * `refreshGitHub()` from refresh buttons.
 */
import { loadGitHub, offline, MIN_REMAINING } from './github.js';

/** @typedef {import('./github.js').GitHubData} GitHubData */

/**
 * `status` is 'connecting' until the first load settles, then 'fresh' | 'stale' | 'offline'.
 * `loading` is true while any request is in flight.
 */
export const gh = $state({
  /** @type {'connecting' | import('./github.js').LiveStatus} */
  status: 'connecting',
  loading: false,
  /** @type {number | null} */
  asOf: null,
  /** @type {number | null} */
  rateRemaining: null,
  /** @type {number | null} */
  rateReset: null,
  /** @type {GitHubData['user']} */
  user: null,
  /** @type {GitHubData['repos']} */
  repos: [],
  /** @type {GitHubData['totals']} */
  totals: null,
  /** @type {GitHubData['languages']} */
  languages: [],
  /** @type {GitHubData['recent']} */
  recent: [],
  // Replaced wholesale on every load and never mutated, so a plain Map is enough.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  byName: /** @type {GitHubData['byName']} */ (new Map()),
});

/** @type {Promise<void> | null} */
let inflight = null;

/**
 * @param {boolean} force Bypass the 20-minute TTL.
 * @returns {Promise<void>} Settles when the state is updated.
 */
function load(force) {
  if (inflight) return inflight;
  gh.loading = true;
  inflight = loadGitHub({ force })
    .then(data => {
      Object.assign(gh, data);
    })
    .catch(error => {
      // loadGitHub degrades on its own; this only guards against an unexpected throw.
      console.info('GitHub live data unavailable:', error instanceof Error ? error.message : error);
      if (gh.status === 'connecting') Object.assign(gh, offline());
    })
    .finally(() => {
      gh.loading = false;
      inflight = null;
    });
  return inflight;
}

let started = false;

/** Starts the first load once per page. */
export function startGitHub() {
  if (started) return;
  started = true;
  load(false);
}

/** @returns {Promise<void>} Forces a refetch (ETag-revalidated). */
export const refreshGitHub = () => load(true);

/** @returns {boolean} Whether a manual refresh is allowed by the rate limit. */
export const canRefresh = () => !gh.loading && (gh.rateRemaining === null || gh.rateRemaining >= MIN_REMAINING || (gh.rateReset ?? 0) < Date.now());

/**
 * Looks up a repo by "owner/name".
 * @param {string} fullName Repo full name.
 * @returns {import('./github.js').Repo | undefined} Live repo data.
 */
export const repo = fullName => gh.byName.get(fullName.toLowerCase());
