import { describe, expect, it } from 'vitest';
import { profile } from '../../lib/profile.js';
import { cards, WORDS, HEADING, whereUsed, repoCount, languageUrl, describeAnchor, slug, isLinked } from './stack-data.js';

describe('stack data', () => {
  it('splits the heading one word per card', () => {
    expect(cards.map(card => card.word)).toEqual(WORDS);
    expect(WORDS.join(' ').replace('every- thing', 'everything')).toBe(HEADING);
  });

  it('keeps every yml skill and marks Java as the strongest', () => {
    const shown = new Set(cards.flatMap(card => card.skills.filter(s => s.source === 'cv').map(s => s.name)));
    for (const group of profile.skills) for (const item of group.items) expect(shown.has(item)).toBe(true);
    expect(cards[0].skills.filter(s => s.lead).map(s => s.name)).toEqual(['Java']);
  });

  it('gives every chip a unique id', () => {
    const ids = cards.flatMap(card => card.skills.map(s => s.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(slug('C++')).toBe('cpp');
  });

  it('only cross-links to known anchors', () => {
    for (const card of cards) for (const skill of card.skills) for (const link of whereUsed(skill.name)) expect(describeAnchor(link.id)).not.toBeNull();
    expect(whereUsed('Java').map(link => link.title)).toContain('Survival2D thesis');
    expect(describeAnchor('nope')).toBeNull();
  });

  it('keeps CV experience items apart from the CV skill list', () => {
    const ai = cards.find(card => card.key === 'ai');
    expect(ai?.skills.map(s => s.source)).toEqual(['cv', 'xp', 'xp']);
  });

  it('links the skills the page shows and leaves the rest as plain tags', () => {
    for (const name of ['event-driven architecture', 'OOP', 'design patterns', 'code review', 'Linux', 'Shell']) expect(isLinked(name)).toBe(true);
    for (const name of ['Spring Boot', 'Cocos2d-x', 'Godot', 'MySQL', 'ClickHouse', 'AWS Lambda/SAM']) expect(isLinked(name)).toBe(false);
    expect(whereUsed('event-driven architecture').map(link => link.title)).toContain('Chaos Age 2');
  });

  it('counts live repos per language and hides counts without data', () => {
    const languages = [{ name: 'JavaScript', count: 17 }, { name: 'TypeScript', count: 2 }, { name: 'Go', count: 18 }];
    expect(repoCount('JavaScript/TypeScript', languages)).toBe(19);
    expect(repoCount('Rust', languages)).toBe(0);
    expect(repoCount('Go', [])).toBeNull();
    expect(repoCount('Kafka', languages)).toBeNull();
    expect(languageUrl('C++')).toContain('language=c%2B%2B');
  });
});
