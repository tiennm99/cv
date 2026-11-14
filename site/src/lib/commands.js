/**
 * Command palette model: the command list and fuzzy matching. Pure, so it is unit
 * tested; Palette.svelte wires the `run` handlers.
 */
import { SECTIONS } from './sections.js';
import { featured, links } from './content.js';

/**
 * @typedef {'Jump to' | 'Do' | 'Open'} Group
 * @typedef {{ id: string, group: Group, label: string, hint?: string, keywords?: string, href?: string, action?: string }} Command
 */

export const GROUPS = /** @type {Group[]} */ (['Jump to', 'Do', 'Open']);

/**
 * Builds every palette command. `action` names are handled by the palette;
 * `href` commands open links.
 * @param {{ email: string }} profile Public profile (email for copy).
 * @returns {Command[]} Commands in group order.
 */
export function buildCommands(profile) {
  /** @type {Command[]} */
  const jump = SECTIONS.map(section => ({ id: `jump:${section.id}`, group: 'Jump to', label: section.label, hint: section.num, keywords: `${section.id} ${section.keywords}`, action: `jump:${section.id}` }));
  /** @type {Command[]} */
  const doing = [
    { id: 'do:cv', group: 'Do', label: 'Download CV (PDF)', keywords: 'resume pdf hr', action: 'download-cv' },
    { id: 'do:email', group: 'Do', label: 'Copy email', hint: profile.email, keywords: 'contact mail', action: 'copy-email' },
    { id: 'do:theme', group: 'Do', label: 'Toggle theme', keywords: 'dark light invert', action: 'toggle-theme' },
    { id: 'do:motion', group: 'Do', label: 'Toggle motion', keywords: 'reduce animation', action: 'toggle-motion' },
    { id: 'do:refresh', group: 'Do', label: 'Refresh live data', keywords: 'github reload', action: 'refresh' },
  ];
  /** @type {Command[]} */
  const open = [
    { id: 'open:github', group: 'Open', label: 'GitHub', hint: 'tiennm99', href: links.github },
    { id: 'open:github-org', group: 'Open', label: 'GitHub WIP org', hint: 'tiennm99dev', href: links.githubOrg },
    { id: 'open:blog', group: 'Open', label: 'Blog', hint: 'miti99.com', href: links.blog },
    { id: 'open:linkedin', group: 'Open', label: 'LinkedIn', hint: 'miti99', href: links.linkedin },
    { id: 'open:bio', group: 'Open', label: 'Link-in-bio', keywords: 'links', href: links.linkInBio },
    ...featured.map(project => ({ id: `open:${project.repo}`, group: /** @type {Group} */ ('Open'), label: project.title, hint: project.repo, keywords: project.stack.join(' '), href: project.href ?? `https://github.com/${project.repo}` })),
  ];
  return [...jump, ...doing, ...open];
}

/**
 * Scores how well `query` fuzzy-matches `text` (characters in order).
 * Consecutive runs and word starts score higher; 0 means no match.
 * @param {string} query User input.
 * @param {string} text Candidate text.
 * @returns {number} Score, 0 when not matched.
 */
export function fuzzyScore(query, text) {
  const q = query.toLowerCase().replace(/\s+/g, '');
  const t = text.toLowerCase();
  if (!q) return 1;
  let score = 0;
  let ti = 0;
  let run = 0;
  for (const char of q) {
    const found = t.indexOf(char, ti);
    if (found === -1) return 0;
    const wordStart = found === 0 || /[\s\-/.:(]/.test(t[found - 1]);
    run = found === ti ? run + 1 : 0;
    score += 1 + run * 2 + (wordStart ? 3 : 0) - Math.min(found - ti, 5) * 0.2;
    ti = found + 1;
  }
  if (t.startsWith(q)) score += 5;
  return score;
}

/**
 * Filters and ranks commands; keeps group order when the query is empty.
 * @param {Command[]} commands All commands.
 * @param {string} query User input.
 * @returns {Command[]} Matching commands, best first.
 */
export function filterCommands(commands, query) {
  if (!query.trim()) return commands;
  return commands
    .map(command => ({ command, score: Math.max(fuzzyScore(query, command.label) * 1.5, fuzzyScore(query, `${command.label} ${command.hint ?? ''} ${command.keywords ?? ''}`)) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(entry => entry.command);
}
