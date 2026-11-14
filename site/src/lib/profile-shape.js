/**
 * Pure whitelist from the validated CV document (src/load-cv.mjs) to the public
 * profile the site may show. Fields are copied by name; anything not listed here,
 * the phone number above all, never leaves this function.
 */

const LINK = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

/**
 * @typedef {{ label: string, url: string }} Link
 * @typedef {{ text: string, links: Link[] }} RichText
 */

/**
 * Turns inline Markdown with links into plain text plus the list of links.
 * @param {string} value Inline Markdown from the yml.
 * @returns {RichText} Plain text and its links in reading order.
 */
export function richText(value) {
  /** @type {Link[]} */
  const links = [];
  const text = String(value).replace(LINK, (_, label, url) => {
    links.push({ label, url });
    return label;
  });
  return { text, links };
}

const SOCIAL_URL = {
  GitHub: username => `https://github.com/${username}`,
  LinkedIn: username => `https://www.linkedin.com/in/${username}`,
};

/**
 * @param {Record<string, any>} entry Dated yml entry.
 * @returns {{ start: string, end: string }} Start and end as YYYY or YYYY-MM, end may be "present".
 */
function range(entry) {
  if (entry.date !== undefined) return { start: String(entry.date), end: String(entry.date) };
  return { start: String(entry.start_date), end: String(entry.end_date) };
}

/**
 * Builds the public profile from a validated CV object.
 * @param {Record<string, any>} cv Result of loadCv().
 * @returns {import('./profile.js').Profile} Public, phone-free profile.
 */
export function toPublicProfile(cv) {
  const s = cv.sections;
  return {
    name: cv.name,
    headline: cv.headline,
    location: cv.location,
    email: cv.email,
    website: cv.website,
    socials: cv.social_networks.map(({ network, username }) => ({ network, username, url: SOCIAL_URL[network](username) })),
    experience: s.experience.map(entry => ({
      company: entry.company,
      position: entry.position,
      ...range(entry),
      location: entry.location,
      summary: entry.summary,
      highlights: entry.highlights.map(richText),
    })),
    projects: s.projects.map(entry => {
      const title = richText(entry.name);
      return {
        name: title.text,
        url: title.links[0]?.url ?? '',
        ...range(entry),
        summary: entry.summary,
        highlights: entry.highlights.map(richText),
      };
    }),
    skills: s.skills.map(({ label, details }) => ({ label, items: details.split(/,\s*/).map(item => item.trim()).filter(Boolean) })),
    education: s.education.map(entry => ({
      institution: entry.institution,
      area: entry.area,
      degree: entry.degree,
      ...range(entry),
      location: entry.location,
      highlights: entry.highlights.map(richText),
    })),
  };
}
