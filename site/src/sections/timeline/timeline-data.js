/**
 * Timeline view model: the shared `timeline` entries from content.js, enriched with
 * per-entry links and small facts. Every fact comes from miti99.yml (through
 * `profile`) or the content brief; live numbers are added in the component.
 */
import { timeline, links, anchors, projectAnchor } from '../../lib/content.js';
import { profile } from '../../lib/profile.js';

/**
 * @typedef {{ label: string, href: string, external?: boolean }} EntryLink
 * @typedef {import('../../lib/content.js').TimelineEntry & {
 *   id: string, year: number, month: string, facts: string[], links: EntryLink[], thesis?: boolean, liveGitHub?: boolean
 * }} Entry
 */

/**
 * @param {string} text Sentence.
 * @returns {string} Sentence with an upper-case first letter.
 */
const capitalise = text => text.charAt(0).toUpperCase() + text.slice(1);

/** Month label for entries that cover a whole year (they sort after that year's dated entries). */
export const WHOLE_YEAR = 'Whole year';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Readable label per entry kind (also drives the marker shape). */
export const KIND_LABEL = { study: 'Study', work: 'Work', writing: 'Writing', build: 'Build', github: 'GitHub' };

const education = profile.education?.[0];
const current = profile.experience?.[0];

/** Honours from the yml education highlight ("GPA: 8.14/10; ...; ..."). */
const honours = (education?.highlights?.[0]?.text ?? '')
  .split(';')
  .map(part => part.trim().replace(/\.$/, ''))
  .filter(Boolean);

/** Thesis facts from the yml education highlight, with the brief's wording as fallback. */
export const thesis = {
  name: 'Survival2D',
  // The card title already names Survival2D, so the summary starts after it.
  summary: capitalise(
    (education?.highlights?.[1]?.text ?? 'Thesis: Survival2D, a multiplayer battle royale server.')
      .replace(/^Thesis:\s*/, '')
      .replace(/^Survival2D,\s*/, ''),
  ),
  stack: ['Java', 'Netty', 'WebSocket', 'FlatBuffers', 'Behavior-tree AI', 'Server-side anti-cheat'],
  gpa: honours.find(item => item.startsWith('GPA'))?.replace(/^GPA:\s*/, '') ?? '8.14/10',
  awards: honours.filter(item => !item.startsWith('GPA')),
  school: education?.institution ?? 'Ho Chi Minh City University of Technology',
  degree: education ? `${education.degree} ${education.area}` : 'B.E. Computer Science and Engineering',
};

/** @type {Record<string, { body?: string, facts?: string[], links?: EntryLink[], thesis?: boolean, liveGitHub?: boolean }>} */
const EXTRAS = {
  '2017-09': { facts: ['B.E. 2017 to 2023', education?.location ?? 'HCMC, Vietnam'] },
  '2018-05': { links: [{ label: 'github.com/tiennm99', href: links.github, external: true }], liveGitHub: true },
  '2020-04': { facts: ['30 posts in 2020'], links: [{ label: 'miti99.com', href: links.blog, external: true }] },
  '2020-07': {
    facts: [current ? `Today: ${current.position}` : 'Today: Senior Software Engineer', 'Primary Java backend contributor on Chaos Age 2'],
    links: [{ label: 'The game-backend story', href: `#${anchors.zingplay}` }],
  },
  // The thesis card holds the grades, honours and thesis, so the entry body stays short.
  '2023-06': { body: 'Graduates from HCMUT.', thesis: true },
  2025: {
    facts: ['89 posts in 2025'],
    links: [{ label: 'Store Scraper Bot', href: `#${projectAnchor('tiennm99/store-scraper-bot')}` }],
  },
  '2026-08': { links: [{ label: 'github.com/tiennm99dev', href: links.githubOrg, external: true }] },
  2026: {
    links: [
      { label: 'Gomoku', href: `#${projectAnchor('tiennm99dev/gomoku')}` },
      { label: 'Rubik', href: `#${projectAnchor('tiennm99dev/rubik')}` },
      { label: 'Nối từ', href: `#${projectAnchor('tiennm99/noitu')}` },
      { label: 'rplace', href: `#${projectAnchor('tiennm99/rplace')}` },
      { label: 'AI dev tools ranking', href: `#${projectAnchor('tiennm99/awesome-ai-dev-tools')}` },
      { label: 'Claude Code marketplace', href: `#${anchors.ai}` },
    ],
  },
};

/** @type {Entry[]} */
export const entries = timeline.map(entry => {
  const [year, month] = entry.date.split('-');
  const extra = EXTRAS[entry.date] ?? {};
  return {
    ...entry,
    id: `tl-${entry.date}`,
    year: Number(year),
    month: month ? MONTHS[Number(month) - 1] : WHOLE_YEAR,
    body: extra.body ?? entry.body,
    facts: extra.facts ?? [],
    links: extra.links ?? [],
    thesis: extra.thesis,
    liveGitHub: extra.liveGitHub,
  };
});

/**
 * Every year from the first to the last entry; years without an entry stay as quiet ticks.
 * @type {{ year: number, indices: number[] }[]} Entry indices in that year, in order (empty for quiet years).
 */
export const railYears = (() => {
  const first = entries[0].year;
  const last = entries[entries.length - 1].year;
  return Array.from({ length: last - first + 1 }, (_, offset) => {
    const year = first + offset;
    const indices = entries.flatMap((entry, index) => (entry.year === year ? [index] : []));
    return { year, indices };
  });
})();

/**
 * Entry a rail year jumps to: the first entry of that year, or, when an entry of
 * that year is already active, the next one in the same year (wrapping round).
 * @param {number[]} indices Entry indices in the year.
 * @param {number} active Active entry index.
 * @returns {number} Entry index to jump to, or -1 for a quiet year.
 */
export function railTarget(indices, active) {
  if (!indices.length) return -1;
  const at = indices.indexOf(active);
  return at === -1 ? indices[0] : indices[(at + 1) % indices.length];
}

/**
 * Posts on miti99.com per year, from the content brief (2021 to 2024 is one total).
 * `to` is inclusive; the last bucket is the count when the brief was written.
 * @type {{ from: number, to: number, count: number, soFar?: boolean }[]}
 */
export const blogPosts = [
  { from: 2020, to: 2020, count: 30 },
  { from: 2021, to: 2024, count: 7 },
  { from: 2025, to: 2025, count: 89 },
  { from: 2026, to: 2026, count: 72, soFar: true },
];

/**
 * Advance width of each digit (0-9) in Anybody at wght 820 / wdth 68, in em,
 * measured once from the self-hosted font. The odometer sizes each column to its
 * digit so the year sets as one word (the tabular "1" leaves a hole).
 */
export const DIGIT_ADVANCE = [0.453, 0.413, 0.458, 0.454, 0.473, 0.451, 0.453, 0.404, 0.451, 0.454];

/**
 * Splits a year into its four digits for the odometer columns.
 * @param {number} year Four-digit year.
 * @returns {number[]} Digits, most significant first.
 */
export const digitsOf = year => String(year).padStart(4, '0').slice(-4).split('').map(Number);
