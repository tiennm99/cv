import data from 'virtual:profile';

/**
 * @typedef {import('./profile-shape.js').RichText} RichText
 * @typedef {{ network: string, username: string, url: string }} Social
 * @typedef {{ company: string, position: string, start: string, end: string, location: string, summary: string, highlights: RichText[] }} Experience
 * @typedef {{ name: string, url: string, start: string, end: string, summary: string, highlights: RichText[] }} Project
 * @typedef {{ label: string, items: string[] }} SkillGroup
 * @typedef {{ institution: string, area: string, degree: string, start: string, end: string, location: string, highlights: RichText[] }} Education
 * @typedef {{ name: string, headline: string, location: string, email: string, website: string, socials: Social[], experience: Experience[], projects: Project[], skills: SkillGroup[], education: Education[] }} Profile
 */

/** Public profile from miti99.yml, whitelisted at build time (no phone). */
export const profile = /** @type {Profile} */ (data);

/**
 * @param {string} network Social network name, e.g. "GitHub".
 * @returns {Social | undefined} The matching social entry.
 */
export const social = network => profile.socials.find(entry => entry.network === network);

/**
 * Formats a yml date (YYYY or YYYY-MM or "present") for display.
 * @param {string} value Date from the profile.
 * @returns {string} e.g. "Jul 2020", "2026" or "Present".
 */
export function formatYm(value) {
  if (value === 'present') return 'Present';
  const [year, month] = value.split('-');
  if (!month) return year;
  return `${new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(+year, +month - 1, 1)))} ${year}`;
}
