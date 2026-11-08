import { readFile } from 'node:fs/promises';
import { parseDocument } from 'yaml';
import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({ html: false });
markdown.validateLink = () => true;
const fail = (path, message) => { throw new Error(`${path}: ${message}`); };
const object = (value, path, keys) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'expected a mapping');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`${path}.${key}`, 'unsupported field');
};
const text = (value, path) => {
  if (typeof value !== 'string' || !value.trim()) fail(path, 'expected non-empty text');
  const visit = tokens => {
    for (const token of tokens) {
      if (token.type === 'image') fail(path, 'images are unsupported');
      if (token.type === 'link_open') url(token.attrGet('href'), path);
      if (token.children) visit(token.children);
    }
  };
  visit(markdown.parseInline(value, {}));
};
function url(value, path) {
  try {
    if (typeof value !== 'string' || /[\s\u0000-\u001f]/.test(value)) throw new Error();
    const parsed = new URL(value);
    if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) throw new Error();
  } catch { fail(path, 'expected an absolute HTTP(S) URL without credentials'); }
}
function date(value, path, present = false) {
  const raw = String(value);
  if (present && raw === 'present') return raw;
  if (!/^[1-9]\d{3}(?:-(?:0[1-9]|1[0-2]))?$/.test(raw)) fail(path, 'expected YYYY or YYYY-MM' + (present ? ' or present' : ''));
  return raw;
}
function dates(entry, path) {
  if (entry.date !== undefined) {
    date(entry.date, `${path}.date`);
    if (entry.start_date !== undefined || entry.end_date !== undefined) fail(path, 'use date or a date range, not both');
  } else {
    const start = date(entry.start_date, `${path}.start_date`);
    const end = date(entry.end_date, `${path}.end_date`, true);
    if (end !== 'present' && start > end) fail(path, 'end_date precedes start_date');
  }
}
function list(value, path, validate) {
  if (!Array.isArray(value) || !value.length) fail(path, 'expected a non-empty list');
  value.forEach((entry, index) => validate(entry, `${path}[${index}]`));
}

export function validateCvDocument(document) {
  object(document, 'document', ['cv']);
  const cv = document.cv;
  object(cv, 'cv', ['name', 'headline', 'location', 'email', 'phone', 'website', 'social_networks', 'sections']);
  for (const key of ['name', 'headline', 'location', 'email', 'phone', 'website']) text(cv[key], `cv.${key}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cv.email)) fail('cv.email', 'invalid email address');
  if (!/^[+\d()\s.-]+$/.test(cv.phone) || cv.phone.replace(/\D/g, '').length < 7) fail('cv.phone', 'invalid phone number');
  url(cv.website, 'cv.website');
  list(cv.social_networks, 'cv.social_networks', (social, path) => {
    object(social, path, ['network', 'username']);
    if (!['GitHub', 'LinkedIn'].includes(social.network)) fail(`${path}.network`, 'unsupported social network');
    text(social.username, `${path}.username`);
    if (!/^[a-zA-Z0-9_-]+$/.test(social.username)) fail(`${path}.username`, 'invalid username');
  });
  const fields = {
    experience: ['company', 'position', 'location', 'summary'],
    projects: ['name', 'summary'],
    education: ['institution', 'area', 'degree', 'location'],
    skills: ['label', 'details'],
  };
  object(cv.sections, 'cv.sections', Object.keys(fields));
  for (const [section, required] of Object.entries(fields)) {
    list(cv.sections[section], `cv.sections.${section}`, (entry, path) => {
      const dated = section !== 'skills';
      object(entry, path, [...required, ...(dated ? ['start_date', 'end_date', 'date', 'highlights'] : [])]);
      required.forEach(key => text(entry[key], `${path}.${key}`));
      if (dated) {
        dates(entry, path);
        list(entry.highlights, `${path}.highlights`, text);
      }
    });
  }
  return cv;
}

export async function loadCv(path) {
  const document = parseDocument(await readFile(path, 'utf8'), { uniqueKeys: true });
  if (document.errors.length) throw new Error(`Invalid YAML: ${document.errors.map(error => error.message).join('; ')}`);
  return validateCvDocument(document.toJS({ maxAliasCount: 0 }));
}
