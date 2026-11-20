// Renders the CV as Markdown: the repository README.md and, for the site, the
// llms.txt index and llms-full.txt (https://llmstxt.org/). Like the site, these
// public copies leave out the phone number; only the PDF carries it.
import { dates, segments, socialBase, title } from './build-pdf.mjs';

export const SITE_URL = 'https://tiennm99.github.io/cv/';
export const REPO_URL = 'https://github.com/tiennm99/cv';
const GENERATED = '<!-- Generated from miti99.yml by `npm run build`. Edit miti99.yml, not this file. -->';

const plain = value => segments(value).map(segment => segment.text).join('');
const firstLink = value => segments(value).find(segment => segment.url)?.url;
const socials = cv => cv.social_networks.map(social => ({
  label: social.network,
  url: `${socialBase[social.network]}${encodeURIComponent(social.username)}`,
}));

/**
 * The CV body in Markdown, from the name heading down to education.
 * @param {object} cv CV validated by loadCv.
 * @returns {string} Markdown ending with a newline.
 */
export function cvMarkdown(cv) {
  const contact = [
    cv.location,
    `[${cv.email}](mailto:${cv.email})`,
    `[${cv.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}](${cv.website})`,
    ...socials(cv).map(link => `[${link.label}](${link.url})`),
  ].join(' · ');
  const lines = [`# ${cv.name}`, '', `**${cv.headline}**`, '', contact];
  for (const [key, items] of Object.entries(cv.sections)) {
    lines.push('', `## ${title(key)}`, '');
    if (key === 'skills') {
      lines.push(...items.map(item => `- **${item.label}:** ${item.details}`));
      continue;
    }
    items.forEach((item, index) => {
      const heading = item.position ? `${item.position} — ${item.company}` : item.name ?? item.institution;
      const meta = [item.degree && `${item.degree} in ${item.area}`, dates(item), item.location].filter(Boolean).join(' · ');
      if (index) lines.push('');
      lines.push(`### ${heading}`, '', `*${meta}*`, '');
      if (item.summary) lines.push(item.summary, '');
      lines.push(...item.highlights.map(highlight => `- ${highlight}`));
    });
  }
  return `${lines.join('\n')}\n`;
}

/**
 * README.md: the CV, links to its other formats, and a short quick start.
 * @param {object} cv CV validated by loadCv.
 * @returns {string} Markdown.
 */
export function readme(cv) {
  const [heading, ...body] = cvMarkdown(cv).split('\n');
  return [
    GENERATED,
    '',
    heading,
    '',
    `[Website](${SITE_URL}) · [Show-off version](${SITE_URL}show-off/) · [PDF](${SITE_URL}miti99.pdf) · [llms.txt](${SITE_URL}llms.txt)`,
    ...body.slice(0, -1),
    '',
    '---',
    '',
    '## About this repo',
    '',
    `One data file, [\`miti99.yml\`](${REPO_URL}/blob/main/miti99.yml), builds the simple web CV, the`,
    'animated show-off site, the one-page PDF (Typst), this README and the',
    '`llms.txt` files for the site.',
    '',
    '```sh',
    'npm ci',
    'npm run dev     # show-off site at http://127.0.0.1:5199/',
    'npm run build   # dist/ plus the committed miti99.pdf and README.md',
    '```',
    '',
    'Needs Node.js 24+ and [uv](https://docs.astral.sh/uv/). Checks, layout and',
    `deployment: [docs/development.md](${REPO_URL}/blob/main/docs/development.md).`,
    '',
  ].join('\n');
}

/**
 * llms.txt: a short index of the CV for language models, per llmstxt.org.
 * @param {object} cv CV validated by loadCv.
 * @returns {string} Markdown.
 */
export function llmsTxt(cv) {
  const [job] = cv.sections.experience;
  const projects = cv.sections.projects
    .filter(project => firstLink(project.name))
    .map(project => `- [${plain(project.name)}](${firstLink(project.name)}): ${plain(project.summary)}`);
  return [
    `# ${cv.name}`,
    '',
    `> ${cv.headline}, based in ${cv.location}. ${plain(job.position)} at ${plain(job.company)} since ${dates(job).split(' – ')[0]}.`,
    '',
    `Personal site and CV of ${cv.name}. The full CV (experience, projects, skills, education) is in llms-full.txt as Markdown. Contact: ${cv.email}.`,
    '',
    '## CV',
    '',
    `- [Full CV in Markdown](${SITE_URL}llms-full.txt): experience, projects, skills and education`,
    `- [CV as PDF](${SITE_URL}miti99.pdf): the one-page recruiter copy`,
    `- [README.md](${SITE_URL}README.md): the same CV as the repository README`,
    `- [Web CV](${SITE_URL}): the same CV as a plain web page`,
    '',
    '## Projects',
    '',
    ...projects,
    '',
    '## Profiles',
    '',
    `- [Website and blog](${cv.website})`,
    ...socials(cv).map(link => `- [${link.label}](${link.url})`),
    '',
    '## Optional',
    '',
    `- [Source of this site](${REPO_URL}): the YAML data file and the generators`,
    '',
  ].join('\n');
}

/**
 * llms-full.txt: the whole CV in Markdown.
 * @param {object} cv CV validated by loadCv.
 * @returns {string} Markdown.
 */
export function llmsFull(cv) {
  const [heading, ...body] = cvMarkdown(cv).split('\n');
  return [heading, '', `> CV of ${cv.name}. Website: ${SITE_URL} · PDF: ${SITE_URL}miti99.pdf`, ...body].join('\n');
}
