/**
 * Section manifest: order, ids (also the DOM anchor ids), labels and the component
 * file inside `src/sections/`. App.svelte, the nav ruler and the palette read it.
 * @typedef {{ id: string, num: string, label: string, file: string, keywords: string }} SectionInfo
 */

/** @type {SectionInfo[]} */
export const SECTIONS = [
  { id: 'hero', num: '01', label: 'Intro', file: 'hero/Hero.svelte', keywords: 'home top name about' },
  { id: 'now', num: '02', label: 'Now', file: 'now/Now.svelte', keywords: 'today recent clock ticker' },
  { id: 'experience', num: '03', label: 'Experience', file: 'experience/Experience.svelte', keywords: 'work job zingplay vng games career' },
  { id: 'craft', num: '04', label: 'Craft', file: 'craft/Craft.svelte', keywords: 'terminal jvm forensics debugging architecture' },
  { id: 'projects', num: '05', label: 'Projects', file: 'projects/Projects.svelte', keywords: 'side projects repos portfolio' },
  { id: 'stack', num: '06', label: 'Stack', file: 'stack/Stack.svelte', keywords: 'skills languages tools java' },
  { id: 'timeline', num: '07', label: 'Timeline', file: 'timeline/Timeline.svelte', keywords: 'history education university thesis years' },
  { id: 'writing', num: '08', label: 'Writing', file: 'writing/Writing.svelte', keywords: 'blog posts articles newsletter' },
  { id: 'github', num: '09', label: 'GitHub', file: 'github/GithubBoard.svelte', keywords: 'stats stars languages board live' },
  { id: 'contact', num: '10', label: 'Contact', file: 'contact/Contact.svelte', keywords: 'email download cv pdf links hire' },
];

/**
 * Reads the isolate-mode section id from a query string (`?section=<id>`).
 * @param {string} search location.search.
 * @returns {SectionInfo | null} The isolated section, or null for the full page.
 */
export function isolatedSection(search) {
  const id = new URLSearchParams(search).get('section');
  return SECTIONS.find(section => section.id === id) ?? null;
}
