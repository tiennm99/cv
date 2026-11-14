import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
markdown.disable('image');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
const inline = (value) => markdown.renderInline(String(value ?? ''));
const safeUrl = (value) => {
  const url = String(value ?? '').trim();
  return /^(https?:\/\/|mailto:|tel:)/i.test(url) && !/[\u0000-\u0020]/.test(url) ? url : '';
};
const link = (url, label) => safeUrl(url)
  ? `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`
  : escapeHtml(label);
const sectionTitle = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const sectionId = (key) => String(key).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function date(value) {
  const raw = String(value ?? '');
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(raw);
  const text = match && monthNames[Number(match[2]) - 1] ? `${monthNames[Number(match[2]) - 1]} ${match[1]}` : raw;
  return /^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(raw)
    ? `<time datetime="${escapeHtml(raw)}">${escapeHtml(text)}</time>`
    : escapeHtml(text);
}

function dates(entry) {
  if (entry.date != null) return date(entry.date);
  return [entry.start_date, entry.end_date].filter((value) => value != null).map(date).join(' <span aria-hidden="true">–</span> ');
}

function renderEntry(entry) {
  if (typeof entry === 'string') return `<p>${inline(entry)}</p>`;
  const title = entry.position || entry.name || entry.institution || entry.title;
  const subtitle = [entry.company, entry.degree && entry.area ? `${entry.degree} in ${entry.area}` : entry.degree || entry.area].filter(Boolean).join(' · ');
  const dateText = dates(entry);
  const metadata = [subtitle && `<p class="entry-subtitle">${inline(subtitle)}</p>`, entry.location && `<p class="entry-location">${escapeHtml(entry.location)}</p>`].filter(Boolean).join('');
  return `<article class="entry">
    <header class="entry-header">
      <div class="entry-heading">${title ? `<h3>${inline(title)}</h3>` : ''}${metadata}</div>
      ${dateText ? `<p class="entry-dates">${dateText}</p>` : ''}
    </header>
    ${entry.summary ? `<p class="entry-summary">${inline(entry.summary)}</p>` : ''}
    ${entry.highlights?.length ? `<ul class="highlights">${entry.highlights.map((highlight) => `<li>${inline(highlight)}</li>`).join('')}</ul>` : ''}
  </article>`;
}

function contacts(cv) {
  const items = [];
  if (cv.location) items.push(`<span>${escapeHtml(cv.location)}</span>`);
  if (cv.email) items.push(link(`mailto:${cv.email}`, cv.email));
  if (cv.phone) items.push(link(`tel:${String(cv.phone).replace(/[^+\d]/g, '')}`, cv.phone));
  if (cv.website) items.push(link(cv.website, String(cv.website).replace(/^https?:\/\//, '').replace(/\/$/, '')));
  for (const social of cv.social_networks || []) {
    const networks = { LinkedIn: 'https://linkedin.com/in/', GitHub: 'https://github.com/' };
    const url = social.url || (networks[social.network] && `${networks[social.network]}${encodeURIComponent(social.username)}`);
    items.push(url ? link(url, `${social.network} / ${social.username}`) : escapeHtml(`${social.network} / ${social.username}`));
  }
  return `<ul class="contact-list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

/** Render the CV as a standalone document; all styling is supplied by the caller. */
export function renderHtml(cv, css) {
  const sections = Object.entries(cv.sections || {});
  const title = `${cv.name} | ${cv.headline || 'Curriculum Vitae'}`;
  const description = [cv.name, cv.headline, cv.location].filter(Boolean).join(' · ');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
  <style>${String(css).replace(/<\/style/gi, '<\\/style')}</style>
</head>
<body>
  <a class="skip-link" href="#cv">Skip to CV</a>
  <div class="page-shell">
    <nav class="site-nav" aria-label="CV navigation">
      <div class="section-links">${sections.map(([key]) => `<a href="#${sectionId(key)}">${escapeHtml(sectionTitle(key))}</a>`).join('')}</div>
      <a class="download-link" href="./miti99.pdf" download>Download PDF <span aria-hidden="true">↗</span></a>
    </nav>
    <main id="cv">
      <header class="cv-header">
        <h1>${escapeHtml(cv.name)}</h1>
        ${cv.headline ? `<p class="headline">${escapeHtml(cv.headline)}</p>` : ''}
        <address aria-label="Contact details">${contacts(cv)}</address>
      </header>
      ${sections.map(([key, entries]) => `<section class="cv-section section-${sectionId(key)}" id="${sectionId(key)}" aria-labelledby="heading-${sectionId(key)}">
        <h2 id="heading-${sectionId(key)}">${escapeHtml(sectionTitle(key))}</h2>
        <div class="section-content">${entries.every((entry) => typeof entry === 'object' && entry.label != null)
    ? `<dl class="skills-list">${entries.map((entry) => `<div><dt>${escapeHtml(entry.label)}</dt><dd>${inline(entry.details)}</dd></div>`).join('')}</dl>`
    : entries.map(renderEntry).join('')}</div>
      </section>`).join('')}
    </main>
  </div>
</body>
</html>\n`.replace(/[\t ]+$/gm, '');
}
