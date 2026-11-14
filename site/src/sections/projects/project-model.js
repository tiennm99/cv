/**
 * Pure helpers for the projects index: merge curated rows with live GitHub data,
 * filter by tag and sort. No DOM, no state, so the component stays thin.
 */

/** @typedef {import('../../lib/content.js').Featured} Featured */
/** @typedef {import('../../lib/live/github.js').Repo} Repo */

/**
 * @typedef {object} Row
 * @property {string} key Repo full name, also the Flip id.
 * @property {string} no Curated position, "01".."10"; stays with the project when sorted.
 * @property {number} order Curated position as a number.
 * @property {Featured} item Curated copy from content.js.
 * @property {Repo | undefined} live Live repo data, when loaded.
 * @property {string} url GitHub page of the repo.
 * @property {string} demo Live demo URL, curated first, then the repo homepage, or ''.
 * @property {string} host Demo host for display, or ''.
 * @property {string} description Live GitHub description, else the curated blurb.
 */

/** Sort modes offered by the control, in display order. */
export const SORTS = /** @type {const} */ (['Curated', 'Stars', 'Recent']);

/**
 * @param {string} url Absolute URL.
 * @returns {string} Host plus path without a trailing slash ("t.me/tiennm99bot"), or ''.
 */
export function displayHost(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, '');
    return `${parsed.host.replace(/^www\./, '')}${path}`;
  } catch {
    return '';
  }
}

/**
 * Builds index rows from the curated list and a live lookup.
 * @param {Featured[]} featured Curated projects in curated order.
 * @param {(fullName: string) => Repo | undefined} lookup Live repo by "owner/name".
 * @returns {Row[]} Rows in curated order.
 */
export function buildRows(featured, lookup) {
  return featured.map((item, index) => {
    const live = lookup(item.repo);
    const demo = item.href || live?.homepage || '';
    return {
      key: item.repo,
      no: String(index + 1).padStart(2, '0'),
      order: index,
      item,
      live,
      url: live?.url || `https://github.com/${item.repo}`,
      demo,
      host: displayHost(demo),
      description: live?.description?.trim() || item.blurb,
    };
  });
}

/**
 * @param {Row} row Row.
 * @param {string} filter Chip label; 'All' matches everything.
 * @returns {boolean} Whether the row passes the filter.
 */
export const matches = (row, filter) => filter === 'All' || row.item.tags.includes(filter);

/**
 * @param {Featured[]} featured Curated projects.
 * @param {string[]} filters Chip labels.
 * @returns {Record<string, number>} Row count per chip.
 */
export function filterCounts(featured, filters) {
  return Object.fromEntries(filters.map(filter => [filter, featured.filter(item => filter === 'All' || item.tags.includes(filter)).length]));
}

/**
 * Sorts rows; live sorts fall back to curated order for ties and missing data.
 * @param {Row[]} rows Rows.
 * @param {typeof SORTS[number]} mode Sort mode.
 * @returns {Row[]} A new sorted array.
 */
export function sortRows(rows, mode) {
  const curated = (a, b) => a.order - b.order;
  if (mode === 'Stars') return [...rows].sort((a, b) => (b.live?.stars ?? -1) - (a.live?.stars ?? -1) || curated(a, b));
  if (mode === 'Recent') {
    const time = row => (row.live?.pushedAt ? Date.parse(row.live.pushedAt) : 0);
    return [...rows].sort((a, b) => time(b) - time(a) || curated(a, b));
  }
  return [...rows].sort(curated);
}

/** GitHub's linguist colours for the languages these repos report. */
const LANG_COLORS = {
  Go: '#00ADD8',
  Java: '#b07219',
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Svelte: '#ff3e00',
  HTML: '#e34c26',
  CSS: '#663399',
  Kotlin: '#A97BFF',
  Python: '#3572A5',
  Shell: '#89e051',
  Vue: '#41b883',
  Rust: '#dea584',
  'C++': '#f34b7d',
  GDScript: '#355570',
};

/**
 * @param {string | null | undefined} language GitHub language name.
 * @returns {string} Its linguist colour, or '' when unknown.
 */
export const langColor = language => (language && LANG_COLORS[/** @type {keyof typeof LANG_COLORS} */ (language)]) || '';
