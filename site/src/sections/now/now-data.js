/**
 * Pure helpers for section 02 (now): curated recent rows, ticker items and
 * the Saigon clock face.
 */
import { TIME_ZONE } from '../../lib/time.js';

/**
 * @typedef {import('../../lib/live/github.js').Repo} Repo
 * @typedef {import('../../lib/content.js').Featured} Featured
 * @typedef {{ key: string, name: string, owner: string, href: string, about: string, tags: string[], pushedAt: string | null, stars: number | null }} TickerItem
 */

/**
 * @typedef {{ key: string, owner: string, name: string, href: string, desc: string, tag: string, pushedAt: string | null }} RecentRow
 */

/** Bench repos from the content brief (section 4), matched by name on either account. */
export const BENCH = ['traefik-cloudflare-dns', 'usage-monitor', 'thptqg', 'genshin-repository', 'sokoban', 'time-mocker'];

/** Repos the brief keeps off the page: gift and personal sites, OSINT tooling. */
const KEEP_OUT = ['valentine-2025', 'tn1', 'ocrot', 'xr2s25fe', 'export-telegram-group-members'];

/** Repos whose pushes come from a scheduled bot, so their push date says nothing about the author. */
const AUTOMATED = ['awesome-ai-dev-tools', 'genshin-repository'];

/**
 * Whether the brief keeps a repo off the page (forks, templates, gift sites,
 * OSINT tooling, game-emulator images).
 * @param {Pick<Repo, 'name' | 'fork'>} repo Repo.
 * @returns {boolean} True when it must not be shown.
 */
export function keptOut(repo) {
  const name = repo.name.toLowerCase();
  return repo.fork || KEEP_OUT.includes(name) || name.startsWith('grasscutter') || name.includes('template');
}

/**
 * Up to `limit` curated repos (featured or bench) ordered by their live push
 * date. Kept-out repos and bot-refreshed repos never appear.
 * @param {Repo[]} repos All live repos of both accounts.
 * @param {Featured[]} curated Featured repos.
 * @param {number} [limit] Row count.
 * @returns {RecentRow[]} Rows, newest push first; empty when nothing matches.
 */
export function curatedRecent(repos, curated, limit = 5) {
  const byRepo = new Map(curated.map(item => [item.repo.toLowerCase(), item]));
  return repos
    .filter(repo => !keptOut(repo) && !AUTOMATED.includes(repo.name.toLowerCase()))
    .filter(repo => byRepo.has(repo.fullName.toLowerCase()) || BENCH.includes(repo.name.toLowerCase()))
    .sort((a, b) => Date.parse(b.pushedAt) - Date.parse(a.pushedAt))
    .slice(0, limit)
    .map(repo => {
      const item = byRepo.get(repo.fullName.toLowerCase());
      return {
        key: repo.fullName.toLowerCase(),
        owner: repo.owner,
        name: repo.name,
        href: repo.url,
        desc: item?.blurb || repo.description,
        tag: item?.stack[0] ?? repo.language ?? '',
        pushedAt: repo.pushedAt,
      };
    });
}

/**
 * Offline rows: the first curated featured repos, no live dates.
 * @param {Featured[]} curated Featured repos.
 * @param {number} [limit] Row count.
 * @returns {RecentRow[]} Rows in curated order.
 */
export function featuredRows(curated, limit = 5) {
  return curated.slice(0, limit).map(item => {
    const [owner, name] = item.repo.split('/');
    return { key: item.repo.toLowerCase(), owner, name, href: `https://github.com/${item.repo}`, desc: item.blurb, tag: item.stack[0] ?? '', pushedAt: null };
  });
}

/**
 * Ticker items: always the curated featured set with its real stack tags, so
 * the ticker never repeats the list above it. Live data only adds stars and
 * the last push date.
 * @param {Featured[]} curated Featured repos.
 * @param {Map<string, Repo>} byName Live repos keyed by lower-case "owner/name".
 * @returns {TickerItem[]} Items in curated order.
 */
export function tickerItems(curated, byName) {
  return curated.map(item => {
    const [owner, name] = item.repo.split('/');
    const repo = byName.get(item.repo.toLowerCase());
    return {
      key: item.repo.toLowerCase(),
      name,
      owner,
      href: `https://github.com/${item.repo}`,
      about: item.blurb,
      tags: item.stack.slice(0, 3),
      pushedAt: repo?.pushedAt ?? null,
      stars: repo?.stars ?? null,
    };
  });
}

/**
 * Hour, minute and second in Asia/Saigon.
 * @param {number} now Epoch ms.
 * @returns {{ h: number, m: number, s: number }} Clock parts.
 */
export function saigonParts(now) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(now);
  const get = type => Number(parts.find(part => part.type === type)?.value ?? 0) % (type === 'hour' ? 24 : 60);
  return { h: get('hour'), m: get('minute'), s: get('second') };
}

/**
 * Months elapsed since a YYYY-MM month (UTC calendar).
 * @param {string} ym "YYYY-MM".
 * @param {number} now Epoch ms.
 * @returns {number} Whole months.
 */
export function monthsSince(ym, now) {
  const [year, month] = ym.split('-').map(Number);
  const date = new Date(now);
  return Math.max(0, (date.getUTCFullYear() - year) * 12 + (date.getUTCMonth() + 1 - month));
}
