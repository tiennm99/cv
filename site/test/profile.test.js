import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { loadCv } from '../../src/load-cv.mjs';
import { toPublicProfile, richText } from '../src/lib/profile-shape.js';
import { profile, formatYm } from '../src/lib/profile.js';

const cv = await loadCv(fileURLToPath(new URL('../../miti99.yml', import.meta.url)));
const phoneDigits = cv.phone.replace(/\D/g, '');

/**
 * Walks every key and value of a JSON-able tree.
 * @param {any} node Tree.
 * @param {(key: string, value: any) => void} visit Visitor.
 */
function walk(node, visit) {
  if (Array.isArray(node)) node.forEach(item => walk(item, visit));
  else if (node && typeof node === 'object') for (const [key, value] of Object.entries(node)) { visit(key, value); walk(value, visit); }
}

describe('public profile', () => {
  it('never contains the phone number, as a key or a value', () => {
    for (const data of [toPublicProfile(cv), profile]) {
      const json = JSON.stringify(data);
      expect(json.replace(/\D/g, '')).not.toContain(phoneDigits.slice(-9));
      walk(data, (key, value) => {
        expect(key.toLowerCase()).not.toContain('phone');
        if (typeof value === 'string') expect(value).not.toBe(cv.phone);
      });
    }
  });

  it('exposes only the whitelisted top-level fields', () => {
    expect(Object.keys(profile).sort()).toEqual(['education', 'email', 'experience', 'headline', 'location', 'name', 'projects', 'skills', 'socials', 'website']);
    expect(profile.email).toBe(cv.email);
  });

  it('builds social URLs and splits skills', () => {
    expect(profile.socials).toContainEqual({ network: 'GitHub', username: 'tiennm99', url: 'https://github.com/tiennm99' });
    expect(profile.socials).toContainEqual({ network: 'LinkedIn', username: 'miti99', url: 'https://www.linkedin.com/in/miti99' });
    expect(profile.skills[0]).toEqual({ label: 'Languages', items: ['Java', 'Go', 'JavaScript/TypeScript', 'Shell'] });
  });

  it('turns Markdown links into text plus links', () => {
    expect(richText('Built [Gomoku](https://github.com/tiennm99dev/gomoku) in Go')).toEqual({
      text: 'Built Gomoku in Go',
      links: [{ label: 'Gomoku', url: 'https://github.com/tiennm99dev/gomoku' }],
    });
    expect(profile.projects[0].name).toBe('Store Scraper Bot');
    expect(profile.projects[0].url).toBe('https://github.com/tiennm99/store-scraper-bot');
    expect(profile.experience[0].highlights[0].links[0].label).toBe('Chaos Age 2');
  });

  it('formats yml dates', () => {
    expect(formatYm('2020-07')).toBe('Jul 2020');
    expect(formatYm('2026')).toBe('2026');
    expect(formatYm('present')).toBe('Present');
  });
});
