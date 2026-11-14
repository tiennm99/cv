// Renders the CV PDF with Typst (pdf/cv.typ), without a browser.
// This module turns the validated CV into plain JSON, so the template never parses
// Markdown or escapes markup; pdf/build.py runs the Typst compiler through uv.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const pdfProject = fileURLToPath(new URL('../pdf/', import.meta.url));
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
markdown.disable('image');
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const socialBase = { GitHub: 'https://github.com/', LinkedIn: 'https://linkedin.com/in/' };

/**
 * Splits inline Markdown into styled text segments.
 * @param {string} value Inline Markdown from miti99.yml.
 * @returns {{ text: string, url?: string, strong?: boolean, em?: boolean, code?: boolean }[]} Segments in order.
 */
export function segments(value) {
  const out = [];
  const style = { strong: 0, em: 0 };
  let url;
  for (const token of markdown.parseInline(String(value), {})[0]?.children ?? []) {
    if (token.type === 'link_open') url = token.attrGet('href');
    else if (token.type === 'link_close') url = undefined;
    else if (token.type === 'strong_open' || token.type === 'strong_close') style.strong += token.type.endsWith('open') ? 1 : -1;
    else if (token.type === 'em_open' || token.type === 'em_close') style.em += token.type.endsWith('open') ? 1 : -1;
    else if (['text', 'code_inline', 'softbreak'].includes(token.type)) {
      const segment = { text: token.type === 'softbreak' ? ' ' : token.content };
      if (url) segment.url = url;
      if (style.strong) segment.strong = true;
      if (style.em) segment.em = true;
      if (token.type === 'code_inline') segment.code = true;
      out.push(segment);
    }
  }
  return out;
}

const formatDate = value => {
  const [year, month] = String(value).split('-');
  return month ? `${months[Number(month) - 1]} ${year}` : String(value);
};
const dates = entry => entry.date !== undefined
  ? formatDate(entry.date)
  : `${formatDate(entry.start_date)} – ${formatDate(entry.end_date)}`;
const title = key => key.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

/**
 * Builds the JSON the Typst template lays out. The PDF is for recruiters, so it keeps the phone number.
 * @param {object} cv CV validated by loadCv.
 * @returns {object} Template data.
 */
export function pdfData(cv) {
  const contacts = [
    { text: cv.location },
    { text: cv.email, url: `mailto:${cv.email}` },
    { text: cv.phone, url: `tel:${cv.phone.replace(/[^+\d]/g, '')}` },
    { text: cv.website.replace(/^https?:\/\//, '').replace(/\/$/, ''), url: cv.website },
    ...cv.social_networks.map(social => ({
      text: `${social.network} / ${social.username}`,
      url: `${socialBase[social.network]}${encodeURIComponent(social.username)}`,
    })),
  ];
  const sections = Object.entries(cv.sections).map(([key, items]) => key === 'skills'
    ? { title: title(key), kind: 'skills', items: items.map(item => ({ label: item.label, details: segments(item.details) })) }
    : {
      title: title(key),
      kind: 'entries',
      items: items.map(item => ({
        title: segments(item.position ?? item.name ?? item.institution),
        subtitle: segments([item.company, item.degree && item.area ? `${item.degree} in ${item.area}` : undefined].filter(Boolean).join(' · ')),
        location: item.location ?? '',
        dates: dates(item),
        summary: item.summary ? segments(item.summary) : [],
        highlights: item.highlights.map(segments),
      })),
    });
  return { name: cv.name, headline: cv.headline, contacts, sections };
}

/**
 * Compiles the CV to a PDF file with Typst through uv.
 * @param {object} cv CV validated by loadCv.
 * @param {string} outPath Where to write the PDF.
 */
export function buildPdf(cv, outPath) {
  const result = spawnSync('uv', ['run', '--project', pdfProject, '--locked', '--quiet', 'python', `${pdfProject}build.py`, outPath], {
    input: JSON.stringify(pdfData(cv)),
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'pipe'],
  });
  if (result.error) throw new Error(`Could not run uv (install it from https://docs.astral.sh/uv/): ${result.error.message}`);
  if (result.status !== 0) throw new Error(`Typst failed to build the PDF:\n${result.stderr}`);
}
