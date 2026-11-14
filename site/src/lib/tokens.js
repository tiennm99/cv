/**
 * Colour tokens mirrored from app.css, for WebGL uniforms and the contrast test.
 * Keep these values identical to the `:root` blocks in app.css.
 */

/** @typedef {[number, number, number]} Oklch L (0-1), C, H (degrees). */
/** @typedef {'light' | 'invert'} Theme */

/** @type {Record<Theme, Record<string, Oklch>>} */
export const TOKENS = {
  light: {
    paper: [0.965, 0.01, 95],
    'paper-2': [0.93, 0.012, 95],
    ink: [0.17, 0.012, 270],
    'ink-2': [0.4, 0.012, 270],
    accent: [0.63, 0.235, 31],
    'accent-text': [0.5, 0.2, 31],
    'accent-ink': [0.17, 0.012, 270],
  },
  invert: {
    paper: [0.13, 0.01, 270],
    'paper-2': [0.19, 0.012, 270],
    ink: [0.97, 0.01, 95],
    'ink-2': [0.78, 0.01, 95],
    accent: [0.7, 0.2, 33],
    'accent-text': [0.76, 0.17, 35],
    'accent-ink': [0.13, 0.01, 270],
  },
};

/**
 * Text pairs that must pass WCAG AA: [foreground, background, minimum ratio].
 * @type {Array<[string, string, number]>}
 */
export const CONTRAST_PAIRS = [
  ['ink', 'paper', 4.5],
  ['ink', 'paper-2', 4.5],
  ['ink-2', 'paper', 4.5],
  ['ink-2', 'paper-2', 4.5],
  ['accent-text', 'paper', 4.5],
  ['accent-text', 'paper-2', 4.5],
  ['accent-ink', 'accent', 4.5],
  ['paper', 'ink', 4.5],
  ['accent', 'paper', 3],
];

/**
 * Converts OKLCH to linear sRGB, clamped to gamut.
 * @param {Oklch} color OKLCH triple.
 * @returns {[number, number, number]} Linear sRGB in 0..1.
 */
export function oklchToLinearSrgb([l, c, h]) {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = v => Math.min(1, Math.max(0, v));
  return [
    clamp(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    clamp(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    clamp(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

/**
 * Converts OKLCH to gamma-encoded sRGB (what WebGL colour uniforms expect).
 * @param {Oklch} color OKLCH triple.
 * @returns {[number, number, number]} sRGB in 0..1.
 */
export function oklchToSrgb(color) {
  return /** @type {[number, number, number]} */ (oklchToLinearSrgb(color).map(v => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
}

/**
 * WCAG 2 contrast ratio between two OKLCH colours.
 * @param {Oklch} fg Foreground.
 * @param {Oklch} bg Background.
 * @returns {number} Ratio, 1..21.
 */
export function contrast(fg, bg) {
  const lum = color => {
    const [r, g, b] = oklchToLinearSrgb(color);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The theme currently applied to <html>, resolving the system default.
 * @returns {Theme} Active theme.
 */
export function activeTheme() {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'invert') return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'invert' : 'light';
}
