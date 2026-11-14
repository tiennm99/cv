import { describe, expect, it } from 'vitest';
import { curatedRecent, featuredRows, keptOut, tickerItems } from './now-data.js';

/**
 * @param {string} fullName "owner/name".
 * @param {string} pushedAt ISO date.
 * @param {Partial<import('../../lib/live/github.js').Repo>} [extra] Overrides.
 * @returns {import('../../lib/live/github.js').Repo} Repo.
 */
const repo = (fullName, pushedAt, extra = {}) => {
  const [owner, name] = fullName.split('/');
  return { fullName, owner, name, fork: false, archived: false, stars: 0, language: 'Go', description: 'desc', homepage: '', url: `https://github.com/${fullName}`, pushedAt, topics: [], ...extra };
};

/** @type {import('../../lib/content.js').Featured[]} */
const curated = [
  { repo: 'tiennm99/awesome-ai-dev-tools', title: 'A', blurb: 'Ranking.', stack: ['Go'], tags: [], href: null },
  { repo: 'tiennm99dev/gomoku', title: 'G', blurb: 'Gomoku.', stack: ['Go', 'WebSocket'], tags: [], href: null },
  { repo: 'tiennm99/noitu', title: 'N', blurb: 'Word chain.', stack: ['Go', 'SvelteKit'], tags: [], href: null },
];

describe('now helpers', () => {
  it('keeps out forks, templates, gift sites and emulator images', () => {
    expect(keptOut({ name: 'grasscutter-docker', fork: false })).toBe(true);
    expect(keptOut({ name: 'export-telegram-group-members', fork: false })).toBe(true);
    expect(keptOut({ name: 'go-template', fork: false })).toBe(true);
    expect(keptOut({ name: 'gomoku', fork: true })).toBe(true);
    expect(keptOut({ name: 'gomoku', fork: false })).toBe(false);
  });

  it('lists only curated repos, newest push first, without bot-refreshed ones', () => {
    const rows = curatedRecent([
      repo('tiennm99/models', '2026-11-14T00:00:00Z', { language: 'Shell' }),
      repo('tiennm99/awesome-ai-dev-tools', '2026-11-14T01:00:00Z'),
      repo('tiennm99/grasscutter-docker', '2026-11-13T00:00:00Z'),
      repo('tiennm99/noitu', '2026-11-01T00:00:00Z'),
      repo('tiennm99dev/gomoku', '2026-11-10T00:00:00Z'),
      repo('tiennm99/sokoban', '2026-10-01T00:00:00Z', { language: 'Svelte' }),
    ], curated);
    expect(rows.map(row => row.name)).toEqual(['gomoku', 'noitu', 'sokoban']);
    expect(rows[0]).toMatchObject({ tag: 'Go', desc: 'Gomoku.', key: 'tiennm99dev/gomoku' });
    expect(rows[2]).toMatchObject({ tag: 'Svelte', desc: 'desc' });
  });

  it('falls back to featured rows with no dates', () => {
    const rows = featuredRows(curated, 2);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ owner: 'tiennm99dev', name: 'gomoku', pushedAt: null, tag: 'Go' });
  });

  it('builds the ticker from the featured set and adds live stars', () => {
    const live = repo('tiennm99dev/gomoku', '2026-11-10T00:00:00Z', { stars: 3 });
    const items = tickerItems(curated, new Map([[live.fullName, live]]));
    expect(items.map(item => item.name)).toEqual(['awesome-ai-dev-tools', 'gomoku', 'noitu']);
    expect(items[1]).toMatchObject({ stars: 3, pushedAt: live.pushedAt, tags: ['Go', 'WebSocket'] });
    expect(items[0]).toMatchObject({ stars: null, pushedAt: null });
  });
});
