/**
 * Data for section 06 (stack): six skill cards built from the yml skill groups plus
 * the content brief's extras, and the chip cross-link map. Every skill, note and link
 * comes from miti99.yml or plans/261114-1228-landing-site/content-brief.md.
 */
import { profile } from '../../lib/profile.js';
import { anchors, crossLinks, featured, projectAnchor, links } from '../../lib/content.js';

/**
 * @typedef {'cv' | 'xp' | 'repos'} SkillSource "cv": the yml skills list; "xp": named in a yml experience
 *   bullet (not the skills list); "repos": seen in public repos (brief).
 * @typedef {{ name: string, id: string, source: SkillSource, lead?: boolean }} Skill
 * @typedef {'accent' | 'split' | 'rows' | 'mono' | 'pills' | 'ink'} Variant
 * @typedef {{ key: string, word: string, label: string, note: string, variant: Variant, skills: Skill[] }} StackCard
 * @typedef {{ id: string, section: string, title: string }} CrossLink
 */

/** The heading "Java by day, everything else.", one word per card ("every-" + "thing" hyphenates "everything"). */
export const HEADING = 'Java by day, everything else.';
export const WORDS = ['Java', 'by', 'day,', 'every-', 'thing', 'else.'];

/** Source labels, shared by the legend, the popovers and the card meta. */
export const SOURCE_LABELS = {
  cv: 'CV skill list',
  xp: 'CV experience',
  repos: 'Public repos',
};

/**
 * @param {string} name Skill name.
 * @returns {string} DOM-safe slug.
 */
export const slug = name => name.toLowerCase().replace(/\+/g, 'p').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Items of a yml skill group, matched by a label prefix.
 * @param {string} prefix Start of the yml label, e.g. "Languages".
 * @returns {string[]} Items, or [] when the group is missing.
 */
function ymlGroup(prefix) {
  return profile.skills.find(group => group.label.startsWith(prefix))?.items ?? [];
}

/** Moved from "Testing & Engineering" to the AI tooling card. */
const AI_ITEM = 'AI-assisted development';

/**
 * @param {string[]} names Skill names.
 * @param {SkillSource} source Where they come from.
 * @returns {Skill[]} Chips.
 */
const tagged = (names, source) => names.map(name => ({ name, id: slug(name), source }));

/**
 * @param {string[]} cv Items from the yml skills list.
 * @param {string[]} repos Extras from the brief (public repos).
 * @returns {Skill[]} Chips, CV first.
 */
const chips = (cv, repos = []) => [...tagged(cv, 'cv'), ...tagged(repos, 'repos')];

/** @type {StackCard[]} */
export const cards = [
  {
    key: 'languages',
    word: WORDS[0],
    label: 'Languages',
    note: 'Java backends for multiplayer games at ZingPlay since 2020. Go and JavaScript run most of the side projects.',
    variant: 'accent',
    skills: chips(ymlGroup('Languages'), ['Rust', 'C++']).map(skill => (skill.name === 'Java' ? { ...skill, lead: true } : skill)),
  },
  {
    key: 'frameworks',
    word: WORDS[1],
    label: 'Frameworks',
    note: 'Netty and Vert.x on the game server; Svelte 5, three.js and Phaser 3 in public projects.',
    variant: 'split',
    skills: chips(ymlGroup('Frameworks'), ['Svelte 5', 'three.js', 'Phaser 3', 'Hono']),
  },
  {
    key: 'data',
    word: WORDS[2],
    label: 'Data & messaging',
    note: 'Couchbase, Redis and Kafka behind Chaos Age 2.',
    variant: 'rows',
    skills: chips(ymlGroup('Data'), ['SQLite', 'MongoDB Atlas']),
  },
  {
    key: 'infra',
    word: WORDS[3],
    label: 'Infra & DevOps',
    note: 'Docker and GitLab CI at work; Workers, Vercel, GitHub Actions and a self-hosted Coolify homelab after hours.',
    variant: 'mono',
    skills: chips(ymlGroup('Infrastructure'), ['Coolify', 'Cloudflare Pages']),
  },
  {
    key: 'engineering',
    word: WORDS[4],
    label: 'Engineering',
    note: 'Reusable packet handlers, JUnit 5 with Mockito, Docker for local dependencies, Gradle with GitLab CI.',
    variant: 'pills',
    skills: chips(ymlGroup('Testing').filter(item => item !== AI_ITEM)),
  },
  {
    key: 'ai',
    word: WORDS[5],
    label: 'AI tooling',
    note: 'An internal Claude Code plugin and skill marketplace with Java server scaffolding guidance, and a daily-refreshed ranking of AI developer tools.',
    variant: 'ink',
    skills: [...chips([AI_ITEM]), ...tagged(['Claude Code', 'Plugin & skill marketplace'], 'xp')],
  },
];

/** The writing section: the blog's homelab, self-hosted and Linux posts (brief section 8). */
const WRITING = 'writing';

/** Extra cross-links for skills the shared map does not cover (brief project stacks, yml AI text). */
const extraLinks = {
  'Svelte 5': ['tiennm99/rplace', 'tiennm99dev/rubik'].map(projectAnchor),
  'three.js': ['tiennm99dev/rubik', 'tiennm99dev/tilt-maze'].map(projectAnchor),
  'Phaser 3': [projectAnchor('tiennm99dev/gomoku')],
  Hono: [projectAnchor('tiennm99/rplace')],
  SQLite: [projectAnchor('tiennm99/noitu')],
  'MongoDB Atlas': [projectAnchor('tiennm99/tiennm99bot')],
  Coolify: [projectAnchor('tiennm99/tiennm99bot')],
  'Cloudflare Pages': [projectAnchor('tiennm99/awesome-ai-dev-tools')],
  'unit testing': [anchors.quality],
  'CI/CD': [anchors.quality],
  'code review': [anchors.quality],
  OOP: [anchors.quality],
  'design patterns': [anchors.quality],
  'event-driven architecture': [anchors.chaosAge, anchors.liveGames],
  Linux: [WRITING],
  'Claude Code': [anchors.ai],
  'Plugin & skill marketplace': [anchors.ai],
};

/** Human labels for the non-project anchors. */
const anchorTitles = {
  [anchors.zingplay]: ['Experience', 'ZingPlay Game Studios'],
  [anchors.chaosAge]: ['Experience', 'Chaos Age 2'],
  [anchors.liveGames]: ['Experience', 'Burkozel, Show, Sky Garden'],
  [anchors.quality]: ['Experience', 'Engineering quality'],
  [anchors.ai]: ['Experience', 'AI-assisted development'],
  [anchors.craft]: ['Craft', 'Production forensics terminal'],
  [anchors.thesis]: ['Timeline', 'Survival2D thesis'],
  [WRITING]: ['Writing', 'Blog: homelab, self-hosted, Linux'],
};

/**
 * @param {string} id Anchor id.
 * @returns {CrossLink | null} Labelled link, or null for an unknown id.
 */
export function describeAnchor(id) {
  const known = anchorTitles[id];
  if (known) return { id, section: known[0], title: known[1] };
  const project = featured.find(item => projectAnchor(item.repo) === id);
  return project ? { id, section: 'Projects', title: project.title } : null;
}

/**
 * Where a skill shows up on the page.
 * @param {string} name Skill name.
 * @returns {CrossLink[]} Links, de-duplicated, in map order.
 */
export function whereUsed(name) {
  const ids = [...(crossLinks[name] ?? []), ...(extraLinks[name] ?? [])];
  return [...new Set(ids)].map(describeAnchor).filter(link => link !== null);
}

/**
 * A chip links somewhere when the page shows the skill or GitHub can list repos for it;
 * the rest are plain tags (listed, no showcase on this page).
 * @param {string} name Skill name.
 * @returns {boolean} True when the chip should be a button with a popover.
 */
export const isLinked = name => whereUsed(name).length > 0 || languagesOf(name) !== null;

/** GitHub primary-language names behind each language chip (for live repo counts). */
const githubLanguages = {
  Java: ['Java'],
  Go: ['Go'],
  'JavaScript/TypeScript': ['JavaScript', 'TypeScript'],
  Shell: ['Shell'],
  Rust: ['Rust'],
  'C++': ['C++'],
};

/**
 * @param {string} name Skill name.
 * @returns {string[] | null} GitHub language names, or null when the skill is not a language.
 */
export const languagesOf = name => githubLanguages[name] ?? null;

/**
 * Live count of public non-fork repos whose primary language matches the skill.
 * @param {string} name Skill name.
 * @param {{ name: string, count: number }[]} languages Live `gh.languages`.
 * @returns {number | null} Count, or null when not a language or no live data.
 */
export function repoCount(name, languages) {
  const names = languagesOf(name);
  if (!names || languages.length === 0) return null;
  return languages.filter(entry => names.includes(entry.name)).reduce((sum, entry) => sum + entry.count, 0);
}

/**
 * GitHub repository list filtered by the skill's first language.
 * @param {string} name Skill name.
 * @returns {string | null} URL, or null when not a language.
 */
export function languageUrl(name) {
  const names = languagesOf(name);
  return names ? `${links.github}?tab=repositories&type=source&language=${encodeURIComponent(names[0].toLowerCase())}` : null;
}
