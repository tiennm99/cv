import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONTRAST_PAIRS, TOKENS, contrast, oklchToSrgb } from '../src/lib/tokens.js';

describe('design tokens', () => {
  for (const theme of /** @type {const} */ (['light', 'invert'])) {
    for (const [fg, bg, min] of CONTRAST_PAIRS) {
      it(`${theme}: ${fg} on ${bg} >= ${min}:1`, () => {
        expect(contrast(TOKENS[theme][fg], TOKENS[theme][bg])).toBeGreaterThanOrEqual(min);
      });
    }
  }

  it('converts OKLCH white and black', () => {
    expect(oklchToSrgb([1, 0, 0]).map(v => +v.toFixed(3))).toEqual([1, 1, 1]);
    expect(oklchToSrgb([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('mirrors the values declared in app.css', () => {
    const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
    const block = selector => css.slice(css.indexOf(selector), css.indexOf('}', css.indexOf(selector)));
    const blocks = { light: block(':root {'), invert: block(':root[data-theme="invert"] {') };
    for (const [theme, tokens] of Object.entries(TOKENS)) {
      for (const [name, [l, c, h]] of Object.entries(tokens)) {
        expect(blocks[theme], `${theme} --${name}`).toContain(`--${name}: oklch(${l} ${c} ${h});`);
      }
    }
  });
});
