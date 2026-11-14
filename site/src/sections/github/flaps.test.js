import { describe, expect, it } from 'vitest';
import { fit, tiles, route, normalise, languageRepos } from './flaps.js';

describe('split-flap helpers', () => {
  it('keeps short names whole', () => {
    expect(fit('JavaScript', 10)).toBe('JavaScript');
    expect(fit('C++', 10)).toBe('C++');
  });

  it('abbreviates long language names instead of cutting mid-word', () => {
    expect(fit('Jupyter Notebook', 10)).toBe('JUPYTER');
    expect(fit('Objective-C', 10)).toBe('OBJ-C');
    expect(fit('Visual Basic .NET', 10)).toBe('VB.NET');
  });

  it('marks an unknown cut with a drum-safe full stop', () => {
    const label = fit('Supercalifragilistic', 10);
    expect(label).toHaveLength(10);
    expect(label.endsWith('.')).toBe(true);
    expect(tiles(label, 10).every(char => char === normalise(char))).toBe(true);
  });

  it('walks the drum forward and ends on the target', () => {
    const path = route('A', 'D');
    expect(path).toEqual(['B', 'C', 'D']);
    expect(route('A', 'A', { min: 5 }).at(-1)).toBe('A');
  });

  it('links a language to the filtered repository list', () => {
    expect(languageRepos('Jupyter Notebook')).toContain('language=jupyter%20notebook');
  });
});
