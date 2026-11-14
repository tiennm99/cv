import { describe, expect, it } from 'vitest';
import { localTime, relativeTime, yearsSince } from '../src/lib/time.js';
import { initialTier, dropTier } from '../src/lib/motion/quality.js';

describe('time', () => {
  it('formats Asia/Saigon local time', () => {
    expect(localTime(Date.UTC(2026, 10, 14, 6, 5))).toBe('13:05');
  });

  it('counts whole years since a month', () => {
    expect(yearsSince('2020-07', Date.UTC(2026, 5, 30))).toBe(5);
    expect(yearsSince('2020-07', Date.UTC(2026, 6, 1))).toBe(6);
  });

  it('formats relative dates', () => {
    const now = Date.UTC(2026, 10, 14);
    expect(relativeTime(now - 3 * 864e5, now)).toBe('3 days ago');
    expect(relativeTime(now, now)).toBe('just now');
  });
});

describe('quality tier', () => {
  it('starts from device facts and drops one tier at a time', () => {
    expect(initialTier({ webgl2: false, dpr: 1, cores: 16 })).toBe('off');
    expect(initialTier({ webgl2: true, dpr: 1, cores: 2 })).toBe('low');
    expect(initialTier({ webgl2: true, dpr: 2, cores: 8 })).toBe('high');
    expect(initialTier({ webgl2: true, dpr: 3, cores: 8 })).toBe('mid');
    expect(dropTier('high')).toBe('mid');
    expect(dropTier('off')).toBe('off');
  });
});
