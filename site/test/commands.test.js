import { describe, expect, it } from 'vitest';
import { buildCommands, filterCommands, fuzzyScore } from '../src/lib/commands.js';
import { SECTIONS, isolatedSection } from '../src/lib/sections.js';
import { featured } from '../src/lib/content.js';

const commands = buildCommands({ email: 'someone@example.com' });

describe('commands', () => {
  it('has a jump per section, the five actions and every featured project', () => {
    expect(commands.filter(command => command.group === 'Jump to')).toHaveLength(SECTIONS.length);
    expect(commands.filter(command => command.group === 'Do').map(command => command.action)).toEqual(['download-cv', 'copy-email', 'toggle-theme', 'toggle-motion', 'refresh']);
    for (const project of featured) expect(commands.some(command => command.hint === project.repo)).toBe(true);
    expect(new Set(commands.map(command => command.id)).size).toBe(commands.length);
  });

  it('fuzzy-matches characters in order and prefers word starts', () => {
    expect(fuzzyScore('gh', 'GitHub')).toBeGreaterThan(0);
    expect(fuzzyScore('xyz', 'GitHub')).toBe(0);
    expect(fuzzyScore('exp', 'Experience')).toBeGreaterThan(fuzzyScore('exp', 'Toggle expert'));
  });

  it('ranks the best match first and keeps everything for an empty query', () => {
    expect(filterCommands(commands, '')).toHaveLength(commands.length);
    expect(filterCommands(commands, 'cv')[0].action).toBe('download-cv');
    expect(filterCommands(commands, 'theme')[0].action).toBe('toggle-theme');
    expect(filterCommands(commands, 'gomoku')[0].hint).toBe('tiennm99dev/gomoku');
    expect(filterCommands(commands, 'zzzz')).toEqual([]);
    expect(filterCommands(commands, 'zingplay')[0].action).toBe('jump:experience');
    expect(filterCommands(commands, 'thesis')[0].action).toBe('jump:timeline');
  });

  it('reads the isolate section from the query string', () => {
    expect(isolatedSection('?section=craft')?.file).toBe('craft/Craft.svelte');
    expect(isolatedSection('?section=nope')).toBeNull();
    expect(isolatedSection('')).toBeNull();
  });
});
